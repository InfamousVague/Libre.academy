/// Ambient animated background — a halftone dot field laid over a slow-
/// drifting radial color wash. Targets the same vibe as crypto-wallet
/// hero panels (a colored wash bleeding through a fine dot grid that
/// breathes over ~20s) without carrying any layout chrome itself.
///
/// Built as a self-contained absolute-positioned wrapper so it can drop
/// behind any container: the desktop bootloader, an empty-state pane,
/// a marketing hero, etc. The component supplies its own background;
/// the host just supplies positioning context (a relatively-positioned
/// parent) and decides whether children render on top.
///
/// Implementation notes — see DottedGradientBg.css for the full visual
/// stack:
///   1. A flat near-black floor (`background-color`).
///   2. Two `radial-gradient` color washes positioned via animated
///      CSS custom properties (registered with `@property` so the
///      values interpolate smoothly mid-keyframe instead of stepping).
///   3. A repeating-radial-gradient dot field overlaid on top, with
///      a soft alpha-mask so the dots fade out toward the edges —
///      same trick the source mock uses to suggest depth without
///      hard-edged tiling.
///
/// `prefers-reduced-motion: reduce` freezes the wash animation. The
/// dots and base color stay so the surface still has texture for users
/// who've opted out of motion.

import "./DottedGradientBg.css";

export type DottedGradientVariant = "fill" | "corner";

export interface DottedGradientBgProps {
  /// Optional className applied to the root so callers can tune
  /// border-radius, z-index, or set their own positioning context.
  className?: string;
  /// Children render above the dot field. Use this when the
  /// gradient is the BACKGROUND for content; pass nothing if you
  /// want the component to be a sibling layer.
  children?: React.ReactNode;
  /// Layout shape. Default `"fill"` matches the original use case
  /// (absolute-fill the parent, host supplies positioning context).
  /// `"corner"` switches to a `position: fixed` top-left bloom sized
  /// to ~60vw × 50vh, faded toward the bottom-right via a radial
  /// alpha-mask so the gradient blends into whatever's underneath.
  /// Use `corner` for the App-level "always present in top-left"
  /// decoration; the dot field + wash still drift as in fill mode.
  variant?: DottedGradientVariant;
}

export default function DottedGradientBg({
  className,
  children,
  variant = "fill",
}: DottedGradientBgProps) {
  const variantClass = `fishbones-dgrad--${variant}`;
  return (
    <div
      className={`fishbones-dgrad ${variantClass}${className ? ` ${className}` : ""}`}
      aria-hidden={variant === "corner" ? true : undefined}
    >
      <div className="fishbones-dgrad__wash" aria-hidden />
      <div className="fishbones-dgrad__dots" aria-hidden />
      {children && <div className="fishbones-dgrad__content">{children}</div>}
    </div>
  );
}
