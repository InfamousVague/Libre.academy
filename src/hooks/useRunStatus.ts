/// Tiny global signal for "is a lesson run currently executing?"
///
/// Lesson-run handlers (LessonView, PoppedWorkbench, anywhere else
/// the user can hit the Run button) wrap their async work with
/// `setRunStatus(true)` → `setRunStatus(false)`. Surfaces elsewhere
/// in the app — the sidebar's chapter grid, achievement chrome,
/// floating widgets — subscribe via `useIsRunning()` to react to
/// that state without any prop drilling through the workbench.
///
/// Implementation is a module-level pub/sub mirroring the pattern
/// `useSidebarVariant` already uses: one boolean held in a closure,
/// a set of listeners that re-render their subscribed components
/// when it flips. Cheap enough that we don't need a Context or a
/// store library for a single boolean.
///
/// Note this is intentionally a SINGLE-RUN signal. Concurrent runs
/// from different surfaces (e.g. a normal LessonView + a popped
/// workbench both running at the same time) will overwrite each
/// other — the second `setRunStatus(false)` from the slower run
/// will flip the flag while the faster run is still going. Real
/// production has at most one run in flight at a time today; if
/// concurrent runs ever ship, swap this for a ref-count.

import { useEffect, useState } from "react";

let isRunning = false;
const listeners = new Set<(running: boolean) => void>();

/// Imperative setter — call with `true` when a run kicks off,
/// `false` when it finishes (success OR failure). Safe to call
/// from non-React contexts (event handlers, async functions,
/// teardown effects). Idempotent — setting to the same value is
/// a no-op.
export function setRunStatus(running: boolean): void {
  if (isRunning === running) return;
  isRunning = running;
  for (const fn of listeners) fn(running);
}

/// React hook — returns the current is-running flag and re-renders
/// the caller whenever it flips. The hook owns its subscription;
/// consumers don't need any teardown bookkeeping.
export function useIsRunning(): boolean {
  const [val, setVal] = useState<boolean>(isRunning);
  useEffect(() => {
    const handler = (running: boolean) => setVal(running);
    listeners.add(handler);
    // Re-sync against the canonical value in case it changed
    // between mount and the useEffect actually running.
    if (val !== isRunning) setVal(isRunning);
    return () => {
      listeners.delete(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return val;
}
