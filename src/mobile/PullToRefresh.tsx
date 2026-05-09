/// Visual indicator for `usePullToRefresh`. Sits absolutely above
/// the page content; the wrapper translates the page down by the
/// current pull distance so the indicator slides into view.
///
/// Renders three states based on the hook's `pullDistance` /
/// `isRefreshing` numbers:
///
///   - **idle** (`pullDistance === 0`): hidden, no translate.
///   - **pulling** (`pullDistance > 0` but still pulling):
///     a circular ring whose stroke fills as the user pulls
///     toward the trigger threshold. Once full, the ring colour
///     shifts to the active tone — visual feedback that releasing
///     now will fire the refresh.
///   - **refreshing**: the ring spins indefinitely until the
///     caller's onRefresh promise resolves.
///
/// Visual borrows from iOS / iPadOS native pull-to-refresh: a
/// subtle circular gauge rather than a chunky branded panel,
/// because in-app refresh should feel like a system primitive.

import "./PullToRefresh.css";

interface Props {
  pullDistance: number;
  isRefreshing: boolean;
  /// Trigger threshold in px — used to compute the gauge fill.
  /// Must match the value passed to `usePullToRefresh`.
  triggerThreshold?: number;
}

export default function PullToRefresh({
  pullDistance,
  isRefreshing,
  triggerThreshold = 80,
}: Props) {
  const visible = pullDistance > 0 || isRefreshing;
  if (!visible) return null;

  const r = 12;
  const c = 2 * Math.PI * r;
  const fillPct = Math.min(pullDistance / triggerThreshold, 1);
  const armed = fillPct >= 1;
  const offset = c * (1 - fillPct);

  return (
    <div
      className={
        "fb-ptr" +
        (armed ? " fb-ptr--armed" : "") +
        (isRefreshing ? " fb-ptr--refreshing" : "")
      }
      style={{ transform: `translateY(${pullDistance - 32}px)` }}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        width="32"
        height="32"
        className="fb-ptr__svg"
      >
        <circle
          className="fb-ptr__track"
          cx="16"
          cy="16"
          r={r}
          fill="none"
        />
        <circle
          className="fb-ptr__fill"
          cx="16"
          cy="16"
          r={r}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={isRefreshing ? c * 0.7 : offset}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
        />
      </svg>
    </div>
  );
}
