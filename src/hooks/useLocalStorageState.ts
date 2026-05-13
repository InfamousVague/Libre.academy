import { useCallback, useState } from "react";

/// `useState` with localStorage backing. Reads the initial value from
/// localStorage (synchronously, before the first paint), and writes
/// every subsequent change back. The setter has the same shape as
/// `useState`'s — accepting either a value or an updater function.
///
/// Replaces the ~10 hand-rolled patterns scattered across App.tsx,
/// Sidebar, PlaygroundView, CourseLibrary, etc., where each one
/// open-coded:
///
///     const [v, setV] = useState(() => {
///       if (typeof localStorage === "undefined") return defaultV;
///       try {
///         const raw = localStorage.getItem(KEY);
///         return raw == null ? defaultV : parse(raw);
///       } catch { return defaultV; }
///     });
///     useEffect(() => {
///       try { localStorage.setItem(KEY, serialize(v)); } catch {}
///     }, [v]);
///
/// Now:
///
///     const [v, setV] = useLocalStorageState(KEY, defaultV);
///
/// The hook handles every edge case the open-coded versions had to
/// reckon with one-by-one:
///   - SSR / non-browser environments where `localStorage` is
///     undefined (returns the default; setter is a no-op for storage
///     but still updates React state).
///   - Private-browsing modes (Safari) that throw on `getItem` /
///     `setItem` — caught and silently swallowed.
///   - JSON-corrupted payloads (a stale schema, a manual edit) —
///     return the default rather than crash.
///
/// Storage key versioning is the caller's responsibility: bake a `:v1`
/// suffix into the key so a future schema change can ignore old data
/// instead of mis-parsing it.
///
/// **Type safety**: `T` defaults to whatever you pass as the initial
/// value, so most callers don't need to annotate. For unions or
/// narrower types, pass an explicit type argument.
///
/// **Serialization**: defaults to JSON. For booleans + simple strings
/// JSON works fine. For larger / structured values, JSON is still the
/// right answer — pass a `serialize` / `deserialize` pair only when
/// you need a custom format (e.g. a CSV-encoded string).
export interface LocalStorageStateOptions<T> {
  /// Custom serialiser. Defaults to `JSON.stringify`.
  serialize?: (value: T) => string;
  /// Custom deserialiser. Defaults to `JSON.parse`. Receives the raw
  /// string from `localStorage.getItem`; should return either the
  /// parsed value or throw — throws are caught and the hook falls
  /// back to the default.
  deserialize?: (raw: string) => T;
}

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  options: LocalStorageStateOptions<T> = {},
): [T, (next: T | ((prev: T) => T)) => void] {
  return useWebStorageState(
    typeof localStorage === "undefined" ? null : localStorage,
    key,
    initialValue,
    options,
  );
}

/// Sister hook with the same shape as `useLocalStorageState` but
/// backed by `sessionStorage`. Use this for state that should
/// persist across in-session navigations but reset on every fresh
/// app launch — e.g. the Tracks page's "you've already seen the
/// hyper-scroll intro" flag, where we want the wow-factor to
/// replay once per launch but not nag the learner every time they
/// click back into the Tracks tab.
///
/// In a browser, `sessionStorage` is per-tab and clears on tab
/// close. In Tauri, the WebView is recreated on each app launch,
/// so sessionStorage scopes naturally to "this run of the app".
export function useSessionStorageState<T>(
  key: string,
  initialValue: T,
  options: LocalStorageStateOptions<T> = {},
): [T, (next: T | ((prev: T) => T)) => void] {
  return useWebStorageState(
    typeof sessionStorage === "undefined" ? null : sessionStorage,
    key,
    initialValue,
    options,
  );
}

/// Shared implementation. The localStorage / sessionStorage APIs
/// are identical (both `Storage`) so a single hook can serve both
/// — the only thing that varies is which storage to write to.
function useWebStorageState<T>(
  storage: Storage | null,
  key: string,
  initialValue: T,
  options: LocalStorageStateOptions<T>,
): [T, (next: T | ((prev: T) => T)) => void] {
  const serialize = options.serialize ?? JSON.stringify;
  const deserialize = options.deserialize ?? (JSON.parse as (raw: string) => T);

  const [state, setState] = useState<T>(() => {
    if (!storage) return initialValue;
    try {
      const raw = storage.getItem(key);
      if (raw == null) return initialValue;
      return deserialize(raw);
    } catch {
      // Private-browsing throw OR corrupt payload — fall back to default.
      return initialValue;
    }
  });

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const value =
          typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        if (storage) {
          try {
            storage.setItem(key, serialize(value));
          } catch {
            // Quota exceeded / private-browsing — silently drop the
            // persistence, but still update React state. Losing one
            // write doesn't break the app.
          }
        }
        return value;
      });
    },
    [storage, key, serialize],
  );

  return [state, set];
}
