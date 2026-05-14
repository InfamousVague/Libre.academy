/// "Auto advance" learner preference — when enabled, passing the
/// tests on a code exercise automatically navigates to the next
/// lesson after the completion celebration plays out, instead of
/// leaving the learner sitting on the green-checkmark state waiting
/// to click "Next".
///
/// Storage. Boolean, persisted to localStorage under
/// `libre:autoAdvance:v1`. localStorage (not IndexedDB) because the
/// preference is read on a hot path — every test-pass — and we
/// don't want to await an async storage layer mid-completion. The
/// `:v1` suffix bakes in a schema version we can ignore on a future
/// migration.
///
/// API shape mirrors `lib/sfx.ts`'s settings module:
///   - `getAutoAdvanceEnabled()` — synchronous read. Used by
///     App.tsx's `markCompletedAndCelebrate` to decide whether to
///     schedule the advance.
///   - `setAutoAdvanceEnabled(v)` — synchronous write. Called from
///     the Settings dialog's toggle handler.
///
/// The Settings UI itself uses `useLocalStorageState` for the
/// controlled toggle state. The two paths are reconciled by both
/// writing through the same localStorage key — `getAutoAdvanceEnabled`
/// re-reads on every call, so it always sees the latest value
/// regardless of which surface flipped it.

const STORAGE_KEY = "libre:autoAdvance:v1";

/// Off by default — the existing flow (sit on the passed state, let
/// the learner click Next on their own time) is the safer default
/// because nothing surprises a learner who didn't opt in.
const DEFAULT_ENABLED = false;

/// Synchronous read. Returns `false` on environments without
/// localStorage (SSR, locked-down WebViews) — same fail-safe path
/// the rest of the lib/* settings modules take.
export function getAutoAdvanceEnabled(): boolean {
  if (typeof localStorage === "undefined") return DEFAULT_ENABLED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_ENABLED;
    // Stored as `"1"` / `"0"` (matching the sfx module's
    // serialisation) rather than JSON so a manual edit of the
    // value in DevTools doesn't trip a `JSON.parse` exception. The
    // toggle is a binary, no need for a structured format.
    return raw === "1";
  } catch {
    // Private browsing on Safari throws on `getItem`. Treat as off.
    return DEFAULT_ENABLED;
  }
}

/// Synchronous write. Silently no-ops if localStorage is
/// unavailable — the caller's UI state still updates, the change
/// just doesn't survive a reload.
export function setAutoAdvanceEnabled(value: boolean): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* quota / private browsing — drop the write */
  }
}

/// The localStorage key, exposed so the Settings UI can pass it
/// straight to `useLocalStorageState` without duplicating the
/// string literal. Both surfaces stay in sync via the underlying
/// localStorage.
export const AUTO_ADVANCE_STORAGE_KEY = STORAGE_KEY;

/// The default value, exposed for the same reason — `useLocalStorageState`'s
/// `initialValue` arg should match the default the imperative
/// readers see on first launch.
export const AUTO_ADVANCE_DEFAULT = DEFAULT_ENABLED;
