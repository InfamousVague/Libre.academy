//! Ledger HID transport for desktop builds.
//!
//! macOS Wry uses WebKit, which doesn't ship WebUSB or WebHID — so
//! desktop users on macOS can't reach a Ledger from the webview's JS
//! environment directly. This module bridges that gap: a small
//! singleton `HidDevice` lives on the Rust side, and the frontend
//! issues APDUs through Tauri commands that frame, write, read, and
//! deframe HID reports for us.
//!
//! On Windows + Linux Tauri uses Chromium so WebHID is available
//! there, but we still go through this module so the desktop code path
//! is uniform across platforms. The web build (`isWeb`) skips this
//! entirely and uses `navigator.hid` directly.
//!
//! ## Wire protocol
//!
//! Ledger's USB-HID transport encapsulates each APDU in 64-byte HID
//! reports, with a small framing header per report:
//!
//! ```text
//! | 2B channel id BE | 1B tag | 2B sequence BE | <up to 59B payload> |
//! ```
//!
//! - **Channel id**: `0x0101` — constant for our purposes.
//! - **Tag**: `0x05` — "this report carries APDU bytes".
//! - **Sequence**: `0x0000`, `0x0001`, … per chunk so the device can
//!   reassemble in order if a report arrives out-of-order.
//! - **Payload**: chunk of the APDU stream. The FIRST chunk's payload
//!   starts with a 2-byte big-endian total APDU length, then the APDU
//!   bytes; subsequent chunks just continue the APDU.
//!
//! Hidapi's report write expects a leading 0-byte report id, so we
//! write 65 bytes (0x00 + 64-byte report) and read 64 bytes.

use hidapi::{HidApi, HidDevice};
use parking_lot::Mutex;
use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::OnceLock;
use std::time::Duration;
use tauri::Emitter;

/// Ledger USB vendor id. Same across every Ledger model.
const LEDGER_VENDOR_ID: u16 = 0x2c97;
/// HID usage page Ledger devices register on the host. We filter on
/// this in addition to the vendor id so we don't pick up a non-HID
/// interface (Ledger devices expose multiple interfaces — we want the
/// "generic HID" one for APDU exchange).
const LEDGER_USAGE_PAGE: u16 = 0xffa0;

/// HID-report framing constants (see module doc).
const CHANNEL_ID: u16 = 0x0101;
const TAG_APDU: u8 = 0x05;
const HID_REPORT_SIZE: usize = 64;
/// Max payload bytes per report after the 5-byte framing header.
const PAYLOAD_PER_REPORT: usize = HID_REPORT_SIZE - 5;
/// How long to wait per HID read before timing out — picked to be
/// long enough that user-confirmation dialogs on the device (which
/// can take 30+ seconds while the user reads + confirms) still
/// resolve, while still bailing eventually if the device is gone.
const READ_TIMEOUT_MS: i32 = 60_000;

/// Singleton HidApi context. The crate documents that creating
/// multiple instances has unspecified behaviour on some platforms
/// (Windows in particular), so we lazy-init one and reuse it for
/// every list / open call. Wrapped in a `Mutex` because
/// `refresh_devices` requires `&mut self` — and refreshing is the
/// step that lets us pick up a freshly-plugged-in Ledger.
static HID_API: OnceLock<Mutex<HidApi>> = OnceLock::new();

/// Currently-open Ledger device. `None` = not connected. We hold ONE
/// device at a time — Ledger HID is exclusive (only one process can
/// hold the handle), and the lesson UX assumes "the device" not
/// "a device". `Mutex` over `Option` so concurrent commands serialise
/// instead of racing.
static OPEN_DEVICE: Mutex<Option<HidDevice>> = Mutex::new(None);

/// Whether the background device watcher is running. Set by
/// `ledger_start_watcher`, cleared by `ledger_stop_watcher`. Used to
/// keep the loop idempotent — calling `start_watcher` twice doesn't
/// spawn two pollers.
static WATCHER_RUNNING: AtomicBool = AtomicBool::new(false);

fn hid_api() -> Result<&'static Mutex<HidApi>, String> {
    if let Some(api) = HID_API.get() {
        return Ok(api);
    }
    let api = HidApi::new().map_err(|e| format!("hidapi init failed: {e}"))?;
    let _ = HID_API.set(Mutex::new(api));
    HID_API
        .get()
        .ok_or_else(|| "hidapi singleton race".to_string())
}

/// Pretty-name a Ledger product id. Matches the same families
/// `@ledgerhq/devices` exposes; the high nibble of the PID indicates
/// the model and the low byte tells us which firmware mode (app vs
/// bootloader vs recovery), but for the connect-status UI we only
/// care about the family name.
fn model_name(pid: u16) -> &'static str {
    match pid >> 12 {
        0x0 => match pid {
            0x0001 => "Nano S",
            0x0004 => "Nano X",
            0x0005 => "Nano S Plus",
            0x0006 => "Stax",
            0x0007 => "Flex",
            _ => "Ledger",
        },
        0x1 => "Nano S",
        0x4 => "Nano X",
        0x5 => "Nano S Plus",
        0x6 => "Stax",
        0x7 => "Flex",
        _ => "Ledger",
    }
}

#[derive(Serialize, Clone, Debug)]
pub struct DeviceInfo {
    pub vendor_id: u16,
    pub product_id: u16,
    pub serial_number: Option<String>,
    pub manufacturer: Option<String>,
    pub product: Option<String>,
    /// Friendly model name ("Nano X", "Stax", …) — derived from PID.
    pub model: String,
}

/// Enumerate every connected Ledger HID interface. Returns an empty
/// vec when no devices are plugged in (NOT an error — the UI uses
/// this to render the "plug in your Ledger" empty state).
#[tauri::command]
pub fn ledger_list_devices() -> Result<Vec<DeviceInfo>, String> {
    let api_lock = hid_api()?;
    let mut api = api_lock.lock();
    // Refresh the device list — without this the cached enumeration
    // from app startup wouldn't pick up a freshly-plugged-in Ledger.
    if let Err(e) = api.refresh_devices() {
        eprintln!("[ledger] refresh_devices failed: {e}");
    }
    let mut out = Vec::new();
    for d in api.device_list() {
        if d.vendor_id() != LEDGER_VENDOR_ID {
            continue;
        }
        // On macOS we always see the right HID interface for a Ledger
        // (it exposes one HID-class interface). On Linux/Windows
        // multiple interfaces may show up; filtering on the Ledger
        // usage page picks the correct APDU one.
        if d.usage_page() != 0 && d.usage_page() != LEDGER_USAGE_PAGE {
            continue;
        }
        out.push(DeviceInfo {
            vendor_id: d.vendor_id(),
            product_id: d.product_id(),
            serial_number: d.serial_number().map(|s| s.to_string()),
            manufacturer: d.manufacturer_string().map(|s| s.to_string()),
            product: d.product_string().map(|s| s.to_string()),
            model: model_name(d.product_id()).to_string(),
        });
    }
    Ok(out)
}

/// Open a Ledger device. If `serial` is `Some`, opens the device with
/// that serial number; if `None`, opens the first Ledger we find. The
/// handle is stashed in `OPEN_DEVICE` for subsequent `ledger_send_apdu`
/// calls.
///
/// Idempotent in the "already open" sense — re-opening replaces the
/// previous handle. Each open implicitly closes the prior one.
#[tauri::command]
pub fn ledger_open(serial: Option<String>) -> Result<DeviceInfo, String> {
    let api_lock = hid_api()?;

    // Find the device path while holding the api lock briefly. Drop
    // the lock BEFORE calling `open_path` so the (potentially blocking
    // on macOS) open doesn't pin the api mutex — without this, the
    // background watcher's periodic `refresh_devices` would queue up
    // behind a slow open and the UI would stall.
    let (info, path) = {
        let mut api = api_lock.lock();
        if let Err(e) = api.refresh_devices() {
            eprintln!("[ledger] refresh_devices failed: {e}");
        }
        let mut chosen: Option<DeviceInfo> = None;
        let mut chosen_path: Option<std::ffi::CString> = None;
        for d in api.device_list() {
            if d.vendor_id() != LEDGER_VENDOR_ID {
                continue;
            }
            if d.usage_page() != 0 && d.usage_page() != LEDGER_USAGE_PAGE {
                continue;
            }
            let s = d.serial_number().map(|s| s.to_string());
            let matches = match (&serial, &s) {
                (Some(want), Some(got)) => want == got,
                (None, _) => true,
                (Some(_), None) => false,
            };
            if matches {
                chosen = Some(DeviceInfo {
                    vendor_id: d.vendor_id(),
                    product_id: d.product_id(),
                    serial_number: s,
                    manufacturer: d.manufacturer_string().map(|s| s.to_string()),
                    product: d.product_string().map(|s| s.to_string()),
                    model: model_name(d.product_id()).to_string(),
                });
                chosen_path = Some(d.path().to_owned());
                break;
            }
        }
        let info = chosen.ok_or_else(|| {
            if serial.is_some() {
                "no Ledger with that serial number is connected".to_string()
            } else {
                "no Ledger device found — plug yours in and unlock it".to_string()
            }
        })?;
        let path = chosen_path.expect("path set when info set");
        (info, path)
    };

    // Re-take the api lock just for the open call. The actual
    // hidapi::HidApi::open_path takes &self; we still need the
    // singleton's storage available so we can't drop it here, but
    // by re-locking we're at least consistent with the rest of the
    // code path — and macOS's slow-open behaviour now affects only
    // commands that actually need to OPEN a device, not unrelated
    // listings or re-enumerations from the watcher.
    let api = api_lock.lock();
    let device = api
        .open_path(&path)
        .map_err(|e| format!("open device: {e}. On Linux you may need a udev rule for /dev/hidraw."))?;
    drop(api);
    let _ = device.set_blocking_mode(true);

    *OPEN_DEVICE.lock() = Some(device);
    Ok(info)
}

/// Drop the current device handle. After this, `ledger_is_open` is
/// false and another process can grab the device.
#[tauri::command]
pub fn ledger_close() -> Result<(), String> {
    *OPEN_DEVICE.lock() = None;
    Ok(())
}

#[tauri::command]
pub fn ledger_is_open() -> bool {
    OPEN_DEVICE.lock().is_some()
}

/// Send one APDU and read the matching response. Wraps the raw HID
/// framing so the caller hands in `[CLA, INS, P1, P2, …]` and gets
/// back `[…response…, SW1, SW2]`.
///
/// On HID-level failure (timeout, device disconnected, framing
/// mismatch) we drop the device handle so subsequent calls don't
/// re-trip on a half-dead connection. The caller has to re-open.
#[tauri::command]
pub fn ledger_send_apdu(apdu: Vec<u8>) -> Result<Vec<u8>, String> {
    if apdu.is_empty() {
        return Err("APDU is empty".to_string());
    }
    let mut guard = OPEN_DEVICE.lock();
    let device = guard
        .as_mut()
        .ok_or_else(|| "no Ledger open — call ledger_open first".to_string())?;

    // Run the framed exchange. On any error, drop the handle so the
    // next call re-opens cleanly rather than reusing a stuck device.
    let result = exchange_apdu(device, &apdu);
    if result.is_err() {
        *guard = None;
    }
    result
}

/// Start a background poller that watches for Ledger plug/unplug
/// events. Emits two Tauri events the frontend listens on:
///
///   - `ledger:device-present` — first device detected after either
///     app start OR a previously-empty enumeration. Payload is the
///     `DeviceInfo` of the device.
///   - `ledger:device-absent` — last device disappeared. No payload.
///
/// Idempotent: calling start more than once is a no-op (the
/// `WATCHER_RUNNING` flag gates the spawn).
///
/// Polls every 1.5s. We can't use real OS-level USB plug/unplug
/// notifications across all three platforms cheaply (macOS would need
/// IOKit, Linux libudev, Windows WM_DEVICECHANGE), so polling is the
/// least-friction approach.
#[tauri::command]
pub fn ledger_start_watcher(app: tauri::AppHandle) -> Result<(), String> {
    if WATCHER_RUNNING.swap(true, Ordering::SeqCst) {
        // Already running.
        return Ok(());
    }
    std::thread::spawn(move || {
        let mut last_present: Option<String> = None;
        // 3s poll cadence — fast enough that "plug in and start using"
        // feels instant, slow enough that the api mutex isn't pinned
        // every couple of frames. Bumped up from 1.5s after observing
        // UI stalls on macOS where IOKit enumeration in
        // `refresh_devices` was contending with `ledger_list_devices`.
        while WATCHER_RUNNING.load(Ordering::SeqCst) {
            std::thread::sleep(Duration::from_millis(3000));
            let api_lock = match hid_api() {
                Ok(a) => a,
                Err(_) => continue,
            };
            // Try-lock so we don't pile up behind an in-flight open
            // when the user is actively interacting with the device.
            // If contended, skip this tick and try again in 3s.
            let mut api = match api_lock.try_lock() {
                Some(a) => a,
                None => continue,
            };
            if api.refresh_devices().is_err() {
                continue;
            }
            let mut found: Option<DeviceInfo> = None;
            for d in api.device_list() {
                if d.vendor_id() != LEDGER_VENDOR_ID {
                    continue;
                }
                if d.usage_page() != 0 && d.usage_page() != LEDGER_USAGE_PAGE {
                    continue;
                }
                found = Some(DeviceInfo {
                    vendor_id: d.vendor_id(),
                    product_id: d.product_id(),
                    serial_number: d.serial_number().map(|s| s.to_string()),
                    manufacturer: d.manufacturer_string().map(|s| s.to_string()),
                    product: d.product_string().map(|s| s.to_string()),
                    model: model_name(d.product_id()).to_string(),
                });
                break;
            }
            drop(api);

            // Synthesise a stable id for change detection — serial
            // number when available, otherwise vid:pid (multiple
            // devices of the same model would collide here, but
            // that's already an unsupported scenario for the lesson
            // UX which assumes one device).
            let current_id: Option<String> = found.as_ref().map(|d| {
                d.serial_number
                    .clone()
                    .unwrap_or_else(|| format!("{:04x}:{:04x}", d.vendor_id, d.product_id))
            });

            match (&last_present, &current_id) {
                (None, Some(_)) => {
                    if let Some(ref info) = found {
                        let _ = app.emit("ledger:device-present", info.clone());
                    }
                }
                (Some(_), None) => {
                    let _ = app.emit("ledger:device-absent", ());
                }
                (Some(prev), Some(cur)) if prev != cur => {
                    // Different device replaced the previous one.
                    let _ = app.emit("ledger:device-absent", ());
                    if let Some(ref info) = found {
                        let _ = app.emit("ledger:device-present", info.clone());
                    }
                }
                _ => {
                    // Same as last tick — nothing to do.
                }
            }
            last_present = current_id;
        }
    });
    Ok(())
}

#[tauri::command]
pub fn ledger_stop_watcher() -> Result<(), String> {
    WATCHER_RUNNING.store(false, Ordering::SeqCst);
    Ok(())
}

/// Frame + write + read + deframe one APDU exchange.
fn exchange_apdu(device: &mut HidDevice, apdu: &[u8]) -> Result<Vec<u8>, String> {
    write_apdu_chunks(device, apdu)?;
    read_apdu_response(device)
}

/// Split `apdu` into 64-byte HID reports and write each one. Each
/// report carries 5 bytes of framing header + up to 59 bytes payload;
/// the FIRST report's payload begins with a 2-byte big-endian total
/// APDU length so the device knows how much to expect.
fn write_apdu_chunks(device: &HidDevice, apdu: &[u8]) -> Result<(), String> {
    if apdu.len() > 0xffff {
        return Err(format!("APDU too large: {} bytes (max 65535)", apdu.len()));
    }
    // Logical payload that gets chunked: [len_hi, len_lo, ...apdu...]
    let mut payload = Vec::with_capacity(2 + apdu.len());
    payload.push((apdu.len() >> 8) as u8);
    payload.push((apdu.len() & 0xff) as u8);
    payload.extend_from_slice(apdu);

    let mut sequence: u16 = 0;
    let mut offset = 0;
    while offset < payload.len() {
        let chunk_end = std::cmp::min(offset + PAYLOAD_PER_REPORT, payload.len());
        let chunk = &payload[offset..chunk_end];

        // Hidapi expects a leading report-id byte. Ledger uses report
        // id 0; total bytes written = 1 + 64.
        let mut report = [0u8; 1 + HID_REPORT_SIZE];
        report[0] = 0x00; // report id
        report[1] = (CHANNEL_ID >> 8) as u8;
        report[2] = (CHANNEL_ID & 0xff) as u8;
        report[3] = TAG_APDU;
        report[4] = (sequence >> 8) as u8;
        report[5] = (sequence & 0xff) as u8;
        report[6..6 + chunk.len()].copy_from_slice(chunk);
        // Remaining bytes stay zero (HID reports are always full size).

        device
            .write(&report)
            .map_err(|e| format!("HID write failed: {e}"))?;

        sequence = sequence.wrapping_add(1);
        offset = chunk_end;
    }
    Ok(())
}

/// Read enough HID reports to reassemble one APDU response. The first
/// report's payload begins with a 2-byte big-endian APDU length; we
/// keep reading until we have that many bytes.
fn read_apdu_response(device: &HidDevice) -> Result<Vec<u8>, String> {
    let mut buf = [0u8; HID_REPORT_SIZE];
    let mut response = Vec::new();
    let mut expected_len: Option<usize> = None;
    let mut expected_sequence: u16 = 0;

    let deadline = std::time::Instant::now() + Duration::from_millis(READ_TIMEOUT_MS as u64);

    loop {
        let remaining = deadline
            .saturating_duration_since(std::time::Instant::now())
            .as_millis() as i32;
        let timeout = if remaining <= 0 { 100 } else { remaining };
        let n = device
            .read_timeout(&mut buf, timeout)
            .map_err(|e| format!("HID read failed: {e}"))?;
        if n == 0 {
            return Err("HID read timed out — is the device unlocked + the right app open?".to_string());
        }
        if n < 5 {
            return Err(format!("HID report too short: {n} bytes"));
        }

        let channel = ((buf[0] as u16) << 8) | (buf[1] as u16);
        let tag = buf[2];
        let seq = ((buf[3] as u16) << 8) | (buf[4] as u16);

        if channel != CHANNEL_ID {
            return Err(format!("unexpected channel id 0x{channel:04x}"));
        }
        if tag != TAG_APDU {
            return Err(format!("unexpected tag 0x{tag:02x}"));
        }
        if seq != expected_sequence {
            return Err(format!(
                "unexpected sequence: got {seq}, expected {expected_sequence}"
            ));
        }
        expected_sequence = expected_sequence.wrapping_add(1);

        let payload = &buf[5..n];
        if expected_len.is_none() {
            // First report — pull the 2-byte big-endian length out of
            // the front of the payload.
            if payload.len() < 2 {
                return Err("first HID report missing APDU length prefix".to_string());
            }
            let len = ((payload[0] as usize) << 8) | (payload[1] as usize);
            expected_len = Some(len);
            // The rest of THIS payload is APDU bytes.
            response.extend_from_slice(&payload[2..]);
        } else {
            response.extend_from_slice(payload);
        }

        if response.len() >= expected_len.unwrap() {
            // Trim any HID-padding bytes the device wrote past the
            // logical APDU length.
            response.truncate(expected_len.unwrap());
            return Ok(response);
        }
    }
}
