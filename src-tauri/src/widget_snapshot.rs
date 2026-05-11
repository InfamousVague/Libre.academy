//! Cross-process snapshot for iOS widgets + the watchOS app.
//!
//! ## What this is
//!
//! WidgetKit, the watchOS app, and the main iPhone app are all
//! separate processes with separate sandboxes. They communicate via
//! a **shared App Group container** — a directory that all three
//! processes can read + write, identified by an entitlement string
//! (`group.com.mattssoftware.libre.shared`).
//!
//! The main app (this Tauri binary) is the SOURCE OF TRUTH for
//! everything the widgets / watch render. Whenever the relevant
//! state changes — streak, current lesson, upcoming practice card —
//! the JS layer calls `publish_widget_snapshot(json)` and we write
//! the JSON blob to `<group>/widget-snapshot.json`. WidgetKit's
//! TimelineProvider + the watch app both read that file on every
//! refresh.
//!
//! ## Why JSON
//!
//! - Trivially debuggable from the host (cat the file, see the
//!   widget state). No protobufs, no SQLite, no shared CoreData.
//! - Atomically replaceable with a single write — POSIX rename gives
//!   us "either the old version or the new, never half."
//! - Cheap to consume from Swift (`JSONDecoder` against a
//!   one-time `Codable` schema mirroring what we write here).
//!
//! The atomic-rename pattern means widgets never see a half-written
//! file even if WidgetKit refreshes mid-write. We write to a
//! sibling tempfile in the same dir, then `std::fs::rename` it onto
//! the final path.
//!
//! ## App Group container resolution
//!
//! On iOS the URL is obtained via Foundation's
//! `NSFileManager.containerURL(forSecurityApplicationGroupIdentifier:)`.
//! We can call that from Rust through the `objc2-foundation` crate,
//! which is already in our dep tree (Tauri pulls it in transitively
//! for window management). On non-iOS targets the function is a
//! no-op — desktop has no widgets to feed.

#[cfg(target_os = "ios")]
use objc2_foundation::{NSFileManager, NSString};
use std::path::PathBuf;
use tauri::AppHandle;

/// Bundle id of the App Group both the main app + widget extension +
/// watch app are members of. Must match the entitlements files
/// (`libre_iOS.entitlements`, `libre_widgets.entitlements`,
/// `libre_watch.entitlements`) AND the App Group registered on
/// the Apple Developer portal under the same identifier.
#[cfg(target_os = "ios")]
const APP_GROUP_ID: &str = "group.com.mattssoftware.libre.shared";

/// Filename inside the shared container. Versioned so a future
/// schema bump can ship without breaking older widget builds (we'd
/// write to v2 + keep v1 fresh too for one release window).
const SNAPSHOT_FILENAME: &str = "widget-snapshot.v1.json";

/// Resolve the App Group container URL on iOS. Returns None on any
/// other platform OR on iOS if the container can't be resolved
/// (entitlement missing, group id wrong, profile not provisioned —
/// all failure cases have the same surface from JS's POV).
#[cfg(target_os = "ios")]
fn shared_container_dir() -> Option<PathBuf> {
    // SAFETY: NSFileManager.defaultManager is a singleton accessor;
    // the returned reference is autoreleased and remains valid for
    // the duration of this scope. containerURLForSecurityApplication-
    // GroupIdentifier likewise returns an autoreleased NSURL whose
    // path() is also autoreleased — we copy the path string into an
    // owned PathBuf before returning so the autorelease pool drain
    // doesn't dangle anything.
    unsafe {
        let fm = NSFileManager::defaultManager();
        let group_id = NSString::from_str(APP_GROUP_ID);
        let url = fm.containerURLForSecurityApplicationGroupIdentifier(&group_id)?;
        let path_ns = url.path()?;
        Some(PathBuf::from(path_ns.to_string()))
    }
}

/// Non-iOS no-op so the call site stays cross-platform.
#[cfg(not(target_os = "ios"))]
fn shared_container_dir() -> Option<PathBuf> {
    None
}

/// Tauri command. JS calls this with a fully-serialised JSON string
/// (the JS layer owns the schema; we don't parse it here). On iOS
/// we atomically write to the App Group container; on other
/// platforms we silently no-op so the JS code can call this
/// unconditionally.
///
/// Returns Ok(()) on success or no-op platforms; Err(string) when
/// the container is missing or the write fails. The JS layer logs
/// the error as a warning and moves on — failing to publish the
/// snapshot is non-fatal (the widgets just stay at their last value).
#[tauri::command]
pub fn publish_widget_snapshot(
    _app: AppHandle,
    json: String,
) -> Result<(), String> {
    let dir = match shared_container_dir() {
        Some(d) => d,
        // No container = no-op platform. Pretend success so the
        // JS publisher doesn't spam logs on desktop.
        None => return Ok(()),
    };
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("create_dir_all({}): {}", dir.display(), e))?;
    let final_path = dir.join(SNAPSHOT_FILENAME);
    let tmp_path = dir.join(format!("{}.tmp", SNAPSHOT_FILENAME));
    // Write to sibling tempfile then rename onto the final path.
    // POSIX rename is atomic on the same filesystem, so widget /
    // watch processes reading the snapshot never see a partial
    // write — they read either the old version or the new one,
    // never anything in between.
    std::fs::write(&tmp_path, json.as_bytes())
        .map_err(|e| format!("write({}): {}", tmp_path.display(), e))?;
    std::fs::rename(&tmp_path, &final_path).map_err(|e| {
        // Best-effort cleanup of the tempfile if rename failed.
        let _ = std::fs::remove_file(&tmp_path);
        format!(
            "rename({} -> {}): {}",
            tmp_path.display(),
            final_path.display(),
            e
        )
    })?;

    // Mirror the snapshot to the paired watch via WatchConnectivity.
    // Implemented in Swift (see WatchConnectivityBridge.swift) and
    // exposed as a C entry point named `libre_watch_push_snapshot`.
    // Calling it is safe even with no watch paired — the Swift side
    // gates on `isPaired && isWatchAppInstalled`.
    //
    // WidgetKit timelines re-fetch every 15-30 min on their own, OR
    // immediately when the user opens the app (Apple's cooperative
    // refresh policy). We don't need a second mechanism to nudge the
    // widgets — the snapshot file will be there when WidgetKit
    // happens to look. For users who want a manual refresh, the
    // standard "long-press the widget → Edit Widget" flow
    // re-triggers a getTimeline call.
    #[cfg(target_os = "ios")]
    push_to_watch(&json);

    Ok(())
}

/// Push the JSON snapshot to the paired Apple Watch. The Swift side
/// (`libre_watch_push_snapshot`) handles the WatchConnectivity
/// session activation + transfer queue.
///
/// We resolve the Swift symbol at RUNTIME via `dlsym` rather than
/// declaring it as an `extern "C"` link-time reference. Reason:
/// the Rust static library (`libapp.a`) is built first by Cargo's
/// `cdylib`/`staticlib` step, before the iOS app's Swift sources
/// have been compiled. A link-time `extern "C"` reference would
/// fail with "Undefined symbols for architecture arm64:
/// _libre_watch_push_snapshot" because the Swift symbol isn't
/// in any object file Cargo can see at that point.
///
/// `dlsym(RTLD_DEFAULT, ...)` looks up the symbol in the running
/// process at the time of the call — by then the Swift code has
/// been linked into the same binary as the Rust code, so the
/// lookup succeeds. If for some reason the Swift bridge is missing
/// (e.g. an embedding that drops the iOS-app target) we silently
/// skip the watch push instead of crashing.
#[cfg(target_os = "ios")]
fn push_to_watch(json: &str) {
    use std::os::raw::{c_char, c_void};

    extern "C" {
        fn dlsym(handle: *mut c_void, symbol: *const c_char) -> *mut c_void;
    }
    // RTLD_DEFAULT on darwin is `(void*)-2`; the constant isn't
    // exported by libc's headers in a stable way so we encode it
    // directly. Same value across all darwin variants.
    const RTLD_DEFAULT: *mut c_void = -2isize as *mut c_void;

    /// Matches the Swift `@_cdecl` declaration:
    /// `func libre_watch_push_snapshot(_ ptr: UnsafePointer<CChar>?, _ len: Int)`
    type PushFn = unsafe extern "C" fn(ptr: *const c_char, len: usize);

    let symbol_name = b"libre_watch_push_snapshot\0";
    // SAFETY: we pass a valid null-terminated C string + the
    // RTLD_DEFAULT pseudo-handle; dlsym returns either a valid
    // function pointer or null. We check before calling.
    let sym_ptr = unsafe { dlsym(RTLD_DEFAULT, symbol_name.as_ptr() as *const c_char) };
    if sym_ptr.is_null() {
        return;
    }
    // SAFETY: Swift's `@_cdecl` ABI is C-compatible; the function
    // pointer cast matches the declared signature. The Swift side
    // copies the pointer's bytes before returning, so the JSON
    // borrow's lifetime trivially outlives the call.
    let func: PushFn = unsafe { std::mem::transmute(sym_ptr) };
    let bytes = json.as_bytes();
    unsafe {
        func(bytes.as_ptr() as *const c_char, bytes.len());
    }
}
