/// Tiny shared helpers for swapping between the timestamp shapes
/// the relay and the local stores use.
///
/// The relay speaks ISO 8601 strings ("2026-04-15T19:42:00Z"); the
/// local SQLite + IndexedDB stores speak unix seconds (i64). Every
/// crossing between the two has historically been a custom one-liner
/// that occasionally got it wrong (Date.parse → milliseconds; we
/// want seconds). These helpers exist so that crossing happens in
/// one well-tested place.

/// Parse an ISO 8601 string into unix seconds. Returns `null` on a
/// blank / unparseable input — the caller should fall back to the
/// local "now" path in that case (typically `Date.now()/1000`).
///
/// `Date.parse` returns NaN for unrecognised strings; we trap that
/// and return null so callers can use a single `?? undefined` to
/// default to the local-stamp path.
export function isoToUnixSeconds(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 1000);
}

/// Inverse — unix seconds → ISO 8601 string suitable for the relay.
/// `null` / non-finite inputs return the empty string so a malformed
/// row never makes it onto the wire as `"NaN"` (the relay would 400).
export function unixSecondsToIso(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec)) return "";
  return new Date(sec * 1000).toISOString();
}
