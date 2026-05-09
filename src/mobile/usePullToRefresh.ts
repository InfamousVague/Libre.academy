/// Native-feeling pull-to-refresh for mobile.
///
/// Two surfaces use it today (Library + Profile) and the same hook
/// should work for any future scroll-and-refresh page. Listeners
/// attach to the document body since the mobile app uses page-level
/// scrolling (not an internal scroll container) — same convention
/// `useLessonReadCursor` uses.
///
/// Behaviour:
///   - When the user starts a touch with `scrollTop === 0` and
///     drags down, we track the distance via `touchmove` and expose
///     it as `pullDistance` (clamped + rubber-banded).
///   - If they release past `triggerThreshold` (default 80px), we
///     fire the caller's `onRefresh` and stay in the "refreshing"
///     state until the promise resolves. The indicator stays at the
///     trigger height during that window so the user has a stable
///     "yes, it's loading" surface.
///   - If they release before the threshold, we spring back to 0.
///
/// The hook deliberately doesn't render anything — it returns the
/// numeric pull state so the host can paint whatever indicator fits
/// the page (a spinner, a custom logo, a count). `<PullToRefresh>`
/// in the same folder is the off-the-shelf visual.
///
/// We do NOT compete with iOS Safari's native rubber-band: when the
/// page is at scrollTop > 0, we don't intercept anything. When the
/// page IS at top and the user pulls down, we still let the
/// browser do its bounce (we just paint OUR indicator on top).

import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
  onRefresh: () => Promise<void> | void;
  /// Distance in px the finger has to travel before release fires
  /// the refresh callback. 80 is comfortable on a phone — short
  /// enough that one thumb-stroke clears it, long enough that an
  /// accidental tap-and-twitch doesn't.
  triggerThreshold?: number;
  /// Maximum visible pull distance. Past this we stop responding
  /// to additional movement so the indicator never grows past a
  /// screen-height. Independent of the trigger threshold so a
  /// user with momentum can pull comfortably past it without the
  /// motion stalling.
  maxPull?: number;
  /// When false, the hook is inert. Used to disable refresh while
  /// modals / overlays are open so a backdrop pull doesn't fire
  /// the wrong action.
  enabled?: boolean;
}

interface PullState {
  /// Current rendered pull distance in CSS px (0 = idle).
  pullDistance: number;
  /// True from the moment the trigger fires until the caller's
  /// `onRefresh` promise resolves.
  isRefreshing: boolean;
}

export function usePullToRefresh({
  onRefresh,
  triggerThreshold = 80,
  maxPull = 140,
  enabled = true,
}: Options): PullState {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs hold the in-flight gesture state so the touchmove handler
  // doesn't re-bind on every render (which would tear off mid-gesture).
  const startYRef = useRef<number | null>(null);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const finishGesture = useCallback(
    (commit: boolean) => {
      startYRef.current = null;
      if (commit && !refreshingRef.current) {
        refreshingRef.current = true;
        setIsRefreshing(true);
        setPullDistance(triggerThreshold);
        Promise.resolve(onRefreshRef.current())
          .catch(() => {
            /* swallow — best-effort */
          })
          .finally(() => {
            refreshingRef.current = false;
            setIsRefreshing(false);
            setPullDistance(0);
          });
      } else {
        setPullDistance(0);
      }
    },
    [triggerThreshold],
  );

  useEffect(() => {
    if (!enabled) return;

    function onTouchStart(e: TouchEvent) {
      if (refreshingRef.current) return;
      // Only arm if the page is scrolled to the very top. Otherwise
      // a user mid-page drag-down would trigger refresh, which
      // reads as broken (they were trying to scroll).
      const scrollTop =
        document.scrollingElement?.scrollTop ??
        document.documentElement.scrollTop ??
        0;
      if (scrollTop > 1) return;
      const touch = e.touches[0];
      if (!touch) return;
      startYRef.current = touch.clientY;
    }

    function onTouchMove(e: TouchEvent) {
      const startY = startYRef.current;
      if (startY === null) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dy = touch.clientY - startY;
      if (dy <= 0) {
        // User reversed direction back upward — cancel the pull.
        setPullDistance(0);
        return;
      }
      // Rubber-band: linear up to triggerThreshold, then 0.5x
      // resistance past it so the indicator slows but doesn't
      // freeze. Clamp at maxPull.
      const linear = Math.min(dy, triggerThreshold);
      const overshoot = Math.max(0, dy - triggerThreshold);
      const damped = overshoot * 0.5;
      const total = Math.min(linear + damped, maxPull);
      setPullDistance(total);
    }

    function onTouchEnd() {
      const dist = pullDistanceRef.current;
      if (startYRef.current === null) return;
      finishGesture(dist >= triggerThreshold);
    }

    function onTouchCancel() {
      finishGesture(false);
    }

    // Touchmove + touchstart are passive by default in modern
    // browsers; we don't need to call preventDefault (and shouldn't,
    // because that would break the iOS bounce). Attaching to
    // document captures every touch on the page.
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [enabled, finishGesture, triggerThreshold, maxPull]);

  // Mirror pullDistance into a ref so touchend can read the latest
  // value without re-binding (the closure would otherwise capture
  // the value at attach time).
  const pullDistanceRef = useRef(0);
  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  return { pullDistance, isRefreshing };
}
