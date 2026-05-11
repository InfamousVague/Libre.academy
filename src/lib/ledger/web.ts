/// Web Ledger transport using `navigator.hid` (WebHID).
///
/// Active path for the web build deployed to
/// `mattssoftware.com/fishbones/learn/`. Chrome / Edge / Opera ship
/// WebHID; Safari and Firefox don't, so this build is "Connect Ledger
/// only works in supported browsers" — the unified transport in
/// `index.ts` falls back to an explanatory error when WebHID is
/// missing.
///
/// HID framing is implemented IN this module (unlike the desktop
/// transport which delegates to the Rust side). Every APDU exchange
/// is one HID-output-report stream out, one HID-input-report stream
/// back; the framing protocol matches what `src-tauri/src/ledger.rs`
/// uses on the wire.

// Minimal WebHID type declarations. The full spec lives at
// https://wicg.github.io/webhid/ and ships in @types/w3c-web-hid;
// we inline the surface we use to avoid the extra dep. We DON'T
// extend EventTarget here because TypeScript's lib.dom EventTarget
// signature for addEventListener is wider (`EventListener | null`)
// and the narrowed override produces a "incorrectly extends" error.
// Ledger code doesn't use any other EventTarget method, so leaving
// HIDDevice as a standalone interface is fine.
interface HIDDevice {
  readonly opened: boolean;
  readonly vendorId: number;
  readonly productId: number;
  readonly productName: string;
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  addEventListener(
    type: "inputreport",
    listener: (e: HIDInputReportEvent) => void,
  ): void;
  removeEventListener(
    type: "inputreport",
    listener: (e: HIDInputReportEvent) => void,
  ): void;
}
interface HIDInputReportEvent {
  readonly device: HIDDevice;
  readonly reportId: number;
  readonly data: DataView;
}
interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}
interface HID {
  getDevices(): Promise<HIDDevice[]>;
  requestDevice(opts: { filters: HIDDeviceFilter[] }): Promise<HIDDevice[]>;
}
declare global {
  interface Navigator {
    readonly hid?: HID;
  }
}

import type {
  ConnectOptions,
  LedgerDeviceInfo,
  LedgerStatusListener,
  LedgerTransport,
} from "./types";
import { buildApdu } from "./types";

const LEDGER_VENDOR_ID = 0x2c97;
const CHANNEL_ID = 0x0101;
const TAG_APDU = 0x05;
const HID_REPORT_SIZE = 64;
const PAYLOAD_PER_REPORT = HID_REPORT_SIZE - 5;
const READ_TIMEOUT_MS = 60_000;

/// Same model-name table the Rust transport uses, kept in sync so
/// status-bar labels match across platforms.
function modelName(pid: number): string {
  const high = (pid >> 12) & 0xf;
  switch (high) {
    case 0x1:
      return "Nano S";
    case 0x4:
      return "Nano X";
    case 0x5:
      return "Nano S Plus";
    case 0x6:
      return "Stax";
    case 0x7:
      return "Flex";
    default:
      switch (pid) {
        case 0x0001:
          return "Nano S";
        case 0x0004:
          return "Nano X";
        case 0x0005:
          return "Nano S Plus";
        case 0x0006:
          return "Stax";
        case 0x0007:
          return "Flex";
        default:
          return "Ledger";
      }
  }
}

function infoFromHid(d: HIDDevice): LedgerDeviceInfo {
  return {
    vendorId: d.vendorId,
    productId: d.productId,
    serialNumber: null, // WebHID doesn't expose serial
    manufacturer: null,
    product: d.productName ?? null,
    model: modelName(d.productId),
  };
}

/// Detect WebHID support. Used by the unified transport in `index.ts`
/// to decide whether to instantiate this class or surface an error.
export function isWebHidSupported(): boolean {
  return typeof navigator !== "undefined" && "hid" in navigator;
}

/// Per-instance state for one in-flight read. WebHID delivers
/// inputreports as events, so we keep a buffer + a resolver and let
/// the event handler push reports until the resolver is satisfied.
interface PendingRead {
  reports: Uint8Array[];
  expectedLen: number | null;
  resolve: (response: Uint8Array) => void;
  reject: (err: Error) => void;
  timeoutHandle: ReturnType<typeof setTimeout> | null;
}

export class WebLedgerTransport implements LedgerTransport {
  // Renamed away from `device` because the LedgerTransport interface
  // exposes a method called `device()` and TypeScript blocks the
  // collision (one's a property, the other's an interface method).
  private hidDevice: HIDDevice | null = null;
  private current: LedgerDeviceInfo | null = null;
  private pending: PendingRead | null = null;
  private boundReportHandler: (e: HIDInputReportEvent) => void;
  private listeners = new Set<LedgerStatusListener>();
  /// In-flight connect — see DesktopLedgerTransport for rationale.
  /// On web the open is fast (no native HID round-trip), but the
  /// `requestDevice` picker can hang while the user thinks; we want
  /// concurrent callers to ride the same prompt rather than queue
  /// up multiple pickers.
  private connectingPromise: Promise<LedgerDeviceInfo> | null = null;

  constructor() {
    this.boundReportHandler = (e) => this.onInputReport(e);
  }

  async listDevices(): Promise<LedgerDeviceInfo[]> {
    if (!isWebHidSupported() || !navigator.hid) return [];
    const devices = await navigator.hid.getDevices();
    return devices
      .filter((d: HIDDevice) => d.vendorId === LEDGER_VENDOR_ID)
      .map(infoFromHid);
  }

  /// Try to open a previously-authorised device silently. On web
  /// this is the only auto-connect path that doesn't need a user
  /// gesture. Returns null when no authorised device is present;
  /// callers fall through to a normal `connect()` (which pops the
  /// picker).
  async tryAutoConnect(): Promise<LedgerDeviceInfo | null> {
    try {
      const devices = await this.listDevices();
      if (devices.length === 0) return null;
      return await this.connect({ silent: true });
    } catch {
      return null;
    }
  }

  async connect(opts?: ConnectOptions): Promise<LedgerDeviceInfo> {
    if (!isWebHidSupported() || !navigator.hid) {
      throw new Error(
        "WebHID is not available in this browser. Use Chrome, Edge, or Opera; Safari and Firefox don't support hardware wallets over the web.",
      );
    }
    // Already connected → no-op. (See DesktopLedgerTransport.)
    if (this.current && this.hidDevice) {
      if (!opts?.serialNumber) return this.current;
    }
    // Coalesce concurrent connects onto one in-flight Promise.
    if (this.connectingPromise) {
      return this.connectingPromise;
    }
    this.connectingPromise = (async () => {
      try {
        return await this._connectLocked(opts);
      } finally {
        this.connectingPromise = null;
      }
    })();
    return this.connectingPromise;
  }

  private async _connectLocked(opts?: ConnectOptions): Promise<LedgerDeviceInfo> {
    if (!navigator.hid) {
      throw new Error("WebHID unavailable");
    }
    if (this.hidDevice) {
      // Drop the prior handle before reopening — only happens on an
      // explicit serial-number change request now that the early-out
      // above handles the "already connected" case.
      await this.disconnect();
    }

    let device: HIDDevice | undefined;
    // Try a silent open first — `getDevices()` returns previously-
    // authorised devices that are currently plugged in. This is the
    // path the auto-connect flow uses on app startup, and it's also
    // what makes "click connect twice" not pop a second picker
    // when the user already granted permission.
    const existing = await navigator.hid.getDevices();
    if (opts?.serialNumber) {
      device = existing.find(
        (d: HIDDevice) =>
          d.vendorId === LEDGER_VENDOR_ID &&
          d.productName?.includes(opts.serialNumber!),
      );
    } else {
      device = existing.find((d: HIDDevice) => d.vendorId === LEDGER_VENDOR_ID);
    }
    if (!device) {
      // Silent mode: don't pop a picker — just fail.
      if (opts?.silent) {
        throw new Error("no previously-authorised Ledger present");
      }
      // Triggers the browser's device-picker UI. User has to grant
      // access; cancelling produces an empty array (no exception).
      const granted = await navigator.hid.requestDevice({
        filters: [{ vendorId: LEDGER_VENDOR_ID }],
      });
      device = granted[0];
    }
    if (!device) {
      throw new Error("No Ledger device selected");
    }

    if (!device.opened) {
      await device.open();
    }
    device.addEventListener("inputreport", this.boundReportHandler);

    this.hidDevice = device;
    this.current = infoFromHid(device);
    this.notify();
    return this.current;
  }

  /// Hook a `navigator.hid` `connect` event listener so a Ledger
  /// plugged in AFTER the page loaded auto-connects (provided the
  /// user granted permission to that device on a prior session).
  /// Returns an unsubscribe handler. The `connect` event only fires
  /// for devices that were previously authorised — fresh devices
  /// still need an explicit `requestDevice` user gesture, so this
  /// is a one-time-permission-then-auto-reconnect UX.
  startAutoReconnect(onConnect: (info: LedgerDeviceInfo) => void): () => void {
    if (!isWebHidSupported() || !navigator.hid) {
      return () => {};
    }
    const handler = (e: { device: HIDDevice }) => {
      if (e.device.vendorId !== LEDGER_VENDOR_ID) return;
      if (this.hidDevice) return; // already connected
      this.connect({ silent: true })
        .then((info) => onConnect(info))
        .catch(() => {
          /* silent — auto-connect is best-effort */
        });
    };
    // `connect` and `disconnect` events on navigator.hid have a non-
    // standard shape across versions, but `device` is always present.
    // We typecast loosely because our minimal HID typings don't
    // include the addEventListener overload for these.
    const target = navigator.hid as unknown as {
      addEventListener: (
        type: "connect" | "disconnect",
        listener: (e: { device: HIDDevice }) => void,
      ) => void;
      removeEventListener: (
        type: "connect" | "disconnect",
        listener: (e: { device: HIDDevice }) => void,
      ) => void;
    };
    target.addEventListener("connect", handler);
    return () => {
      target.removeEventListener("connect", handler);
    };
  }

  async disconnect(): Promise<void> {
    if (this.hidDevice) {
      this.hidDevice.removeEventListener(
        "inputreport",
        this.boundReportHandler,
      );
      try {
        await this.hidDevice.close();
      } catch {
        // ignore — happens if the device was unplugged first
      }
    }
    if (this.pending) {
      this.pending.reject(new Error("Transport disconnected"));
      if (this.pending.timeoutHandle) clearTimeout(this.pending.timeoutHandle);
      this.pending = null;
    }
    this.hidDevice = null;
    this.current = null;
    this.notify();
  }

  isConnected(): boolean {
    return this.hidDevice !== null;
  }

  device(): LedgerDeviceInfo | null {
    return this.current;
  }

  async send(
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data?: Uint8Array,
  ): Promise<Uint8Array> {
    if (!this.hidDevice) {
      throw new Error("Ledger is not connected — call connect() first");
    }
    if (this.pending) {
      throw new Error(
        "Another APDU is already in flight on this transport — Ledger HID is half-duplex; serialise calls or open a second transport.",
      );
    }
    const apdu = buildApdu(cla, ins, p1, p2, data);

    const responsePromise = new Promise<Uint8Array>((resolve, reject) => {
      const handle = setTimeout(() => {
        if (this.pending) {
          this.pending.reject(new Error("HID read timed out"));
          this.pending = null;
        }
      }, READ_TIMEOUT_MS);
      this.pending = {
        reports: [],
        expectedLen: null,
        resolve,
        reject,
        timeoutHandle: handle,
      };
    });

    await this.writeChunks(apdu);
    return responsePromise;
  }

  onStatusChange(listener: LedgerStatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── private ────────────────────────────────────────────────

  /// Frame `apdu` into 64-byte HID reports and write each one. WebHID
  /// `sendReport(reportId, data)` takes the data WITHOUT the report-id
  /// prefix (unlike Node hidapi which expects the prefix in the
  /// buffer); `reportId` lives in its own argument.
  private async writeChunks(apdu: Uint8Array): Promise<void> {
    if (apdu.length > 0xffff) {
      throw new Error(`APDU too large: ${apdu.length} bytes (max 65535)`);
    }
    const total = 2 + apdu.length;
    const payload = new Uint8Array(total);
    payload[0] = (apdu.length >> 8) & 0xff;
    payload[1] = apdu.length & 0xff;
    payload.set(apdu, 2);

    let sequence = 0;
    let offset = 0;
    while (offset < total) {
      const end = Math.min(offset + PAYLOAD_PER_REPORT, total);
      const chunk = payload.subarray(offset, end);
      const report = new Uint8Array(HID_REPORT_SIZE);
      report[0] = (CHANNEL_ID >> 8) & 0xff;
      report[1] = CHANNEL_ID & 0xff;
      report[2] = TAG_APDU;
      report[3] = (sequence >> 8) & 0xff;
      report[4] = sequence & 0xff;
      report.set(chunk, 5);

      // Report id 0 — Ledger doesn't use multiple report ids.
      await this.hidDevice!.sendReport(0, report);
      sequence = (sequence + 1) & 0xffff;
      offset = end;
    }
  }

  /// Called by the WebHID event listener for every inbound report.
  /// Accumulates payloads, picks the APDU length out of the first
  /// report, resolves the pending promise once enough bytes arrive.
  private onInputReport(e: HIDInputReportEvent): void {
    if (!this.pending) return;
    // `e.data` is a DataView — wrap its underlying buffer slice as a
    // Uint8Array. Use byteOffset/byteLength so we don't accidentally
    // pull in the whole backing buffer (browsers sometimes share one
    // ArrayBuffer across multiple input reports).
    const data = new Uint8Array(e.data.buffer, e.data.byteOffset, e.data.byteLength);
    if (data.length < 5) {
      this.pending.reject(new Error(`HID report too short: ${data.length}`));
      this.cancelPending();
      return;
    }
    const channel = (data[0] << 8) | data[1];
    const tag = data[2];
    if (channel !== CHANNEL_ID) {
      this.pending.reject(
        new Error(`Unexpected channel 0x${channel.toString(16)}`),
      );
      this.cancelPending();
      return;
    }
    if (tag !== TAG_APDU) {
      this.pending.reject(new Error(`Unexpected tag 0x${tag.toString(16)}`));
      this.cancelPending();
      return;
    }
    // sequence at bytes [3..5] — useful for ordering checks but the
    // browser delivers reports in arrival order anyway.

    const payload = data.subarray(5);
    if (this.pending.expectedLen === null) {
      if (payload.length < 2) {
        this.pending.reject(
          new Error("First HID report missing APDU length prefix"),
        );
        this.cancelPending();
        return;
      }
      const len = (payload[0] << 8) | payload[1];
      this.pending.expectedLen = len;
      this.pending.reports.push(payload.subarray(2));
    } else {
      this.pending.reports.push(payload);
    }

    const have = this.pending.reports.reduce((n, r) => n + r.length, 0);
    if (have >= this.pending.expectedLen) {
      const total = this.pending.expectedLen;
      const out = new Uint8Array(total);
      let off = 0;
      for (const r of this.pending.reports) {
        const take = Math.min(r.length, total - off);
        out.set(r.subarray(0, take), off);
        off += take;
        if (off >= total) break;
      }
      const resolve = this.pending.resolve;
      this.cancelPending();
      resolve(out);
    }
  }

  private cancelPending(): void {
    if (this.pending?.timeoutHandle) clearTimeout(this.pending.timeoutHandle);
    this.pending = null;
  }

  private notify(): void {
    const status = this.current
      ? ({ state: "connected", device: this.current } as const)
      : ({ state: "disconnected" } as const);
    for (const fn of this.listeners) {
      try {
        fn(status);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[ledger] status listener threw:", err);
      }
    }
  }
}
