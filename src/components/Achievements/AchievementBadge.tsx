/// Reusable badge tile — the visual atom shared by the toast, the
/// unlock modal hero, and the AchievementsPage list.
///
/// Renders the icon over a tier-tinted disc with a soft glow ring.
/// `locked` flips to a generic lock glyph + desaturated palette so
/// the same component can render unowned slots in the list.
///
/// Sizes:
///   - `sm` (40 × 40) — toast / inline
///   - `md` (64 × 64) — list tile
///   - `lg` (108 × 108) — modal hero
///
/// Hidden achievements bypass `locked: false` rendering entirely —
/// the AchievementsPage caller substitutes a placeholder Achievement
/// (or passes `mystery`) so the icon stays opaque until unlocked.

import { Icon } from "@base/primitives/icon";
import { lock } from "@base/primitives/icon/icons/lock";
import type { Achievement } from "../../data/achievements";
import { TIER_META } from "../../data/achievements";
import { resolveAchievementIcon } from "../../lib/achievementIcons";
import { resolveAchievementImage } from "../../data/achievementImages";
import Hologram from "../Shared/Hologram";
import "./Achievements.css";

interface Props {
  achievement: Achievement;
  /// When true, render the locked silhouette: lock glyph, desaturated
  /// disc, no tier glow. The list view renders ordinary unowned
  /// achievements with `locked` true; mystery (hidden) achievements
  /// pass a synthetic placeholder via the `mystery` prop instead.
  locked?: boolean;
  /// Special-case styling for hidden-and-still-locked achievements:
  /// the title and blurb are replaced with "???" and a generic blurb,
  /// so curious users don't have the trigger spoiled.
  mystery?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_PX: Record<NonNullable<Props["size"]>, string> = {
  sm: "libre-ach-badge--sm",
  md: "libre-ach-badge--md",
  lg: "libre-ach-badge--lg",
};

const ICON_SIZE: Record<NonNullable<Props["size"]>, "sm" | "lg" | "2xl"> = {
  sm: "sm",
  md: "lg",
  lg: "2xl",
};

export default function AchievementBadge({
  achievement,
  locked = false,
  mystery = false,
  size = "md",
  className,
}: Props) {
  const meta = TIER_META[achievement.tier];
  const showLock = locked || mystery;
  // Prefer the ribbon-snake PNG when we have one staged. Locked /
  // mystery slots always fall back to the lucide lock glyph so the
  // PNG silhouette doesn't leak the badge identity.
  const imageSrc = showLock ? null : resolveAchievementImage(achievement.id);
  const iconPath = mystery
    ? lock
    : showLock
      ? lock
      : resolveAchievementIcon(achievement.icon);
  // Background layers: gradient disc + tier glow ring. We pass the
  // tier colour through CSS custom properties on the wrapping
  // element; the .css file handles the rest.
  const styleVars = {
    "--libre-ach-tint": meta.color,
    "--libre-ach-soft": meta.softColor,
  } as React.CSSProperties;
  const cls = [
    "libre-ach-badge",
    SIZE_PX[size],
    showLock ? "libre-ach-badge--locked" : "",
    imageSrc ? "libre-ach-badge--has-image" : "",
    `libre-ach-badge--${achievement.tier}`,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} style={styleVars} aria-hidden>
      <span className="libre-ach-badge__disc" />
      {/* Holographic foil overlay — only on UNLOCKED badges so
          locked silhouettes stay flat and the rainbow announces
          "this is yours". The badge's tier-tinted disc shows
          through at the foil's `plus-lighter` blend, so a gold
          tier still reads as gold + holo on top, not as a flat
          rainbow. The Hologram primitive handles its own
          ambient drift and never transforms its parent — the
          badge's disc, icon, and ring stay in place. */}
      {!showLock && (
        <Hologram
          surface="dark"
          intensity="subtle"
          sparkle="snake"
          className="libre-ach-badge__holo"
        />
      )}
      <span className="libre-ach-badge__icon">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            className="libre-ach-badge__image"
            draggable={false}
            loading="lazy"
          />
        ) : (
          <Icon
            icon={iconPath}
            size={ICON_SIZE[size]}
            color="currentColor"
            weight="regular"
          />
        )}
      </span>
      <span className="libre-ach-badge__ring" />
    </div>
  );
}
