/// Inline SVG circular progress ring. `progress` is 0–1; sweeps counter-
/// clockwise from 12 o'clock (the standard "how full is my level" visual
/// metaphor). Center `label` is shown inside; optional `sublabel` below
/// for the bigger hero variant. Track and fill colors inherit from CSS
/// via the classes below, so theming works without prop plumbing.
///
/// Extracted from TopBar.tsx so the Profile view can reuse the same ring
/// at a larger size without duplicating the SVG math.

import "./ProgressRing.css";

export function ProgressRing({
  progress,
  size,
  stroke,
  label,
  sublabel,
  labelScale,
}: {
  progress: number;
  size: number;
  stroke: number;
  label: string;
  sublabel?: string;
  /// Multiplier for the inner label font. Defaults to 1 — the topbar chip
  /// variant keeps that. The Profile hero bumps this up so the level
  /// number reads at a glance inside a 120px ring.
  labelScale?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <span
      className="fishbones__progress-ring"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="fishbones__progress-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="fishbones__progress-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          // Rotate -90deg so 0% starts at 12 o'clock, not 3 o'clock.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span
        className="fishbones__progress-ring-label"
        style={
          labelScale && labelScale !== 1
            ? { fontSize: `${11 * labelScale}px` }
            : undefined
        }
      >
        {label}
        {sublabel && (
          <span
            className="fishbones__progress-ring-sublabel"
            style={
              labelScale && labelScale !== 1
                ? { fontSize: `${9 * Math.min(labelScale, 1.6)}px` }
                : undefined
            }
          >
            {sublabel}
          </span>
        )}
      </span>
    </span>
  );
}
