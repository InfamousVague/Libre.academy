/// Desktop Ledger transport — talks to the Rust `hidapi` wrapper
/// through Tauri commands. Active path on macOS desktop (where Wry's
/// WebKit doesn't expose `navigator.hid`) and the canonical path on
/// Windows / Linux too so behaviour stays uniform across platforms.
///
/// All HID framing happens on the Rust side. From the frontend's
/// perspective, `send()` is a plain APDU exchange — hand in command
/// bytes, get response bytes back.

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  ConnectOptions,
  LedgerDeviceInfo,
  LedgerStatusListener,
  LedgerTransport,
} from "./types";
import { buildApdu } from "./types";

interface RustDeviceInfo {
  vendor_id: number;
  product_id: number;
  serial_number: string | null;
  manufacturer: string | null;
  product: string | null;
  model: string;
}

function fromRust(d: RustDeviceInfo): LedgerDeviceInfo {
  return {
    vendorId: d.vendor_id,
    productId: d.product_id,
    serialNumber: d.serial_number,
    manufacturer: d.manufacturer,
    product: d.product,
    model: d.model,
  };
}

export class DesktopLedgerTransport implements LedgerTransport {
  private current: LedgerDeviceInfo | null = null;
  private listeners = new Set<LedgerStatusListener>();
  /// In-flight connect attempt — used to coalesce concurrent
  /// `connect()` calls so multiple components calling at once share
  /// a single underlying open. Without this, a Learning Ledger lesson
  /// with several `<DeviceAction>` buttons would each fire their own
  /// connect, each closing + reopening the device, and on macOS the
  /// blocking `hidapi::open_path` can stall the UI thread.
  private connectingPromise: Promise<LedgerDeviceInfo> | null = null;

  async listDevices(): Promise<LedgerDeviceInfo[]> {
    const raw = await invoke<RustDeviceInfo[]>("ledger_list_devices");
    return raw.map(fromRust);
  }

  async connect(opts?: ConnectOptions): Promise<LedgerDeviceInfo> {
    // Already connected to the right device → no-op. The auto-connect
    // path AND user-driven Connect buttons can both fire while we're
    // already connected; nobody benefits from another close+reopen
    // round-trip.
    if (this.current) {
      if (!opts?.serialNumber || opts.serialNumber === this.current.serialNumber) {
        return this.current;
      }
    }
    // Coalesce concurrent attempts onto a single in-flight Promise.
    // Multiple useLedger consumers calling connect() at the same time
    // (the freeze case before this fix) all await the same open.
    if (this.connectingPromise) {
      return this.connectingPromise;
    }
    this.connectingPromise = (async () => {
      // Close any prior handle before opening a new one. Belt-and-
      // braces — Rust side already drops the handle on errors.
      if (this.current) {
        try {
          await invoke("ledger_close");
        } catch {
          /* ignore — we're about to reopen anyway */
        }
        this.current = null;
      }
      try {
        const raw = await invoke<RustDeviceInfo>("ledger_open", {
          serial: opts?.serialNumber ?? null,
        });
        this.current = fromRust(raw);
        this.notify();
        return this.current;
      } finally {
        this.connectingPromise = null;
      }
    })();
    return this.connectingPromise;
  }

  async disconnect(): Promise<void> {
    if (!this.current) return;
    try {
      await invoke("ledger_close");
    } finally {
      this.current = null;
      this.notify();
    }
  }

  isConnected(): boolean {
    return this.current !== null;
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
    if (!this.current) {
      throw new Error("Ledger is not connected — call connect() first");
    }
    const apdu = buildApdu(cla, ins, p1, p2, data);
    // Tauri serialises Vec<u8> as an array of numbers; the IPC layer
    // converts it back on both ends.
    const responseRaw = await invoke<number[]>("ledger_send_apdu", {
      apdu: Array.from(apdu),
    });
    return new Uint8Array(responseRaw);
  }

  /// Subscribe to connect/disconnect events. Returns an unsubscribe
  /// function. Mirrors the React-friendly observer pattern other
  /// Fishbones hooks use.
  onStatusChange(listener: LedgerStatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /// Start the Rust-side device watcher and auto-connect on plug-in.
  /// Caller is the app-level mount; `onConnect` fires when a
  /// previously-disconnected device gets opened automatically. Idempotent
  /// on the Rust side (the second `start_watcher` is a no-op).
  /// Returns an unsubscribe that stops the watcher AND clears the
  /// listener — call on app unmount.
  async startAutoReconnect(
    onConnect: (info: LedgerDeviceInfo) => void,
  ): Promise<() => void> {
    try {
      await invoke("ledger_start_watcher");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[ledger] failed to start watcher:", err);
    }
    const unlisten = await listen<RustDeviceInfo>(
      "ledger:device-present",
      async (e) => {
        if (this.current) return; // already connected
        try {
          const info = await this.connect();
          onConnect(info);
        } catch (err) {
          // Device may be locked / app not open / another process
          // holding it; auto-connect is best-effort.
          // eslint-disable-next-line no-console
          console.warn("[ledger] auto-connect failed:", err);
        }
        void e; // satisfy lint without using the payload
      },
    );
    const unlistenAbsent = await listen("ledger:device-absent", async () => {
      if (this.current) {
        await this.disconnect().catch(() => {});
      }
    });
    return () => {
      unlisten();
      unlistenAbsent();
      // Don't actually stop the watcher — other components may rely
      // on it. The watcher is a singleton on the Rust side and
      // costs ~nothing when no device is plugged in.
    };
  }

  /// One-shot auto-connect — checks if a Ledger is already plugged
  /// in and opens it without UI. Used at app start before the watcher
  /// has had a chance to fire its first event. Resolves to the
  /// device info on success, `null` if no device is available.
  async tryAutoConnect(): Promise<LedgerDeviceInfo | null> {
    try {
      const devices = await this.listDevices();
      if (devices.length === 0) return null;
      return await this.connect();
    } catch {
      return null;
    }
  }

  private notify(): void {
    const status = this.current
      ? ({ state: "connected", device: this.current } as const)
      : ({ state: "disconnected" } as const);
    for (const fn of this.listeners) {
      try {
        fn(status);
      } catch (err) {
        // Don't let one rude listener break the others.
        // eslint-disable-next-line no-console
        console.error("[ledger] status listener threw:", err);
      }
    }
  }
}
