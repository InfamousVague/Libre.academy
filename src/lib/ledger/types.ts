/// Shared Ledger transport types. Same shape across the desktop
/// (Tauri-IPC + Rust hidapi) and web (`navigator.hid`) backends so
/// every consumer can write code once and have it run on both.
///
/// Course exercises in `learning-ledger` consume `LedgerTransport`
/// directly; the device-action markdown directive renders buttons
/// that close over a transport instance and call `.send` from a
/// click handler.

/// Metadata for one connected Ledger device. Returned by
/// `listDevices()` and `connect()`. The frontend uses `model` (e.g.
/// "Nano X") for the connect-status chip so the user sees what
/// they've plugged in.
export interface LedgerDeviceInfo {
  vendorId: number;
  productId: number;
  serialNumber?: string | null;
  manufacturer?: string | null;
  product?: string | null;
  /// Friendly name derived from the product id family ("Nano S",
  /// "Nano X", "Nano S Plus", "Stax", "Flex"). Useful for UI labels
  /// without the caller decoding raw PIDs.
  model: string;
}

/// One round-trip APDU exchange. Frame the command bytes, write to
/// the device, read the reassembled response, return the bytes.
/// Throws on transport failure (timeout, disconnect, framing
/// mismatch). Status-word handling is the CALLER's job — every
/// successful response carries a 2-byte SW at the end and most
/// chain-app wrappers throw on non-9000 themselves.
export interface LedgerTransport {
  /// Open a Ledger and stash the connection on the transport.
  /// Idempotent — re-calling with a connected transport is fine
  /// (closes prior, opens fresh). On web, this is what triggers
  /// the browser's device-picker prompt.
  connect(opts?: ConnectOptions): Promise<LedgerDeviceInfo>;

  /// Drop the connection. Safe to call when not connected.
  disconnect(): Promise<void>;

  /// Whether a device is currently open on this transport.
  isConnected(): boolean;

  /// The currently-open device's info, or `null` when disconnected.
  device(): LedgerDeviceInfo | null;

  /// Issue an APDU and await the response. Mirrors
  /// `@ledgerhq/hw-transport`'s `.send` shape.
  /// - `cla`, `ins`, `p1`, `p2`: single bytes (0..255).
  /// - `data`: optional payload (up to 255 bytes — APDU `Lc` is one byte).
  /// Returns the response data + trailing 2-byte status word.
  send(
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data?: Uint8Array,
  ): Promise<Uint8Array>;

  /// List enumerated devices without opening one. On web, this returns
  /// only previously-authorised devices; the user has to grant access
  /// via `connect()` before a fresh device shows up here.
  listDevices(): Promise<LedgerDeviceInfo[]>;
}

export interface ConnectOptions {
  /// Open the device with this serial number. Useful when the user
  /// has multiple Ledgers plugged in. When omitted, opens the first
  /// device found.
  serialNumber?: string;
  /// "Silent" connect — only open if a device is already authorised
  /// + present, never trigger the browser's device-picker dialog.
  /// Used by the auto-connect flow so a returning visitor whose
  /// browser remembers permission gets connected without UI churn.
  /// On desktop this flag is a no-op; opens are always silent.
  silent?: boolean;
}

/// Fired on connection state changes. Subscribers are called
/// synchronously after the underlying transport state flips, so a
/// status-bar UI can rerender without polling.
export type LedgerStatusListener = (
  status:
    | { state: "disconnected" }
    | { state: "connected"; device: LedgerDeviceInfo },
) => void;

/// Build an APDU command's wire bytes from its parts. Shared between
/// transports + course exercises (chapter 3 has students reimplement
/// this from scratch — this version is the canonical reference).
export function buildApdu(
  cla: number,
  ins: number,
  p1: number,
  p2: number,
  data?: Uint8Array,
): Uint8Array {
  const lc = data ? data.length : 0;
  if (lc > 0xff) {
    throw new Error(`APDU data length ${lc} exceeds one byte (0..255)`);
  }
  if (lc === 0) {
    return new Uint8Array([cla, ins, p1, p2]);
  }
  const out = new Uint8Array(4 + 1 + lc);
  out[0] = cla;
  out[1] = ins;
  out[2] = p1;
  out[3] = p2;
  out[4] = lc;
  out.set(data!, 5);
  return out;
}

/// Status-word lookup keyed off the trailing 2 bytes of an APDU
/// response. Returns a humane string for known SWs and a hex
/// fallback for unknowns. Used by the device-status UI when it
/// needs to surface an error to the learner.
///
/// Coverage notes:
///   - ISO 7816 generic codes (0x67xx, 0x6Axx, 0x6Bxx, 0x6Dxx, 0x6Exx,
///     0x6F00, 0x9000) — same meaning across every Ledger app.
///   - Ethereum-app specifics (0x6501, 0x6502, 0x650E, 0x650F) —
///     pulled from LedgerHQ/app-ethereum's `apdu_constants.h` /
///     `ethapp.adoc`. The 0x650E/0F pair shows up most often when
///     the device-side Ethereum app needs an update or "blind
///     signing"/"verbose contract data" toggles haven't been set
///     for the request being made — surface that hint inline.
///   - Bitcoin- + Solana-app specifics aren't catalogued here yet;
///     unknown codes fall through to the hex string.
export function describeStatus(sw: number): string {
  switch (sw) {
    case 0x9000:
      return "OK";
    case 0x6985:
      return "User denied the request on the device";
    case 0x6a80:
      return "Incorrect data — APDU payload is invalid";
    case 0x6a87:
      return "Lc inconsistent with parameters";
    case 0x6b00:
      return "Invalid P1 or P2";
    case 0x6d00:
      return "Invalid INS — wrong app open on the device, or this app doesn't support this instruction";
    case 0x6e00:
      return "Invalid CLA — wrong app open on the device";
    case 0x6700:
      return "Wrong length — Lc doesn't match payload";
    case 0x6804:
      return "Device locked or app not running";
    case 0x6f00:
      return "Internal device error";
    case 0x6faa:
      return "Device busy";
    // ── Ethereum app specifics ───────────────────────────────────
    case 0x6501:
      return "Ethereum app: transaction type not supported";
    case 0x6502:
      return "Ethereum app: chain ID buffer too small";
    case 0x650e:
    case 0x650f:
      return "Ethereum app rejected the request. Common fixes: open the Ethereum app on the device, update it to the latest version in Ledger Live, and enable 'Blind signing' / 'Verbose contract data' under the app's settings.";
    default:
      return `Unknown status: 0x${sw.toString(16).padStart(4, "0")}`;
  }
}
