/// Gold / platinum achievement modal. Layers on top of the existing
/// ModalBackdrop with a celebration treatment: tier-tinted hero
/// panel, oversized badge, a sustained ambient glow, and an
/// optional sustained confetti wash for platinum.
///
/// The component receives ONE achievement at a time. If multiple
/// gold/platinum unlocks fire in the same beat (rare — usually a
/// streak hit and a level milestone simultaneously) the toast queue
/// collapses subsequent ones into the queue and re-renders this
/// modal once the user dismisses the current one.

import { useEffect } from "react";

import type { Achievement } from "../../data/achievements";
import { TIER_META } from "../../data/achievements";
import { celebrate } from "../../lib/celebrate";
import ModalBackdrop from "../Shared/ModalBackdrop";
import AchievementBadge from "./AchievementBadge";
import "./Achievements.css";

interface Props {
  achievement: Achievement;
  onDismiss: () => void;
}

export default function AchievementModal({ achievement, onDismiss }: Props) {
  const meta = TIER_META[achievement.tier];

  // Platinum gets a sustained confetti wash — a burst now and
  // another after 1.2 s so the field doesn't visibly empty before
  // the user has read the blurb. Gold fires once on mount (handled
  // by the engine's main confetti call already) so we don't double-
  // burst here.
  useEffect(() => {
    if (achievement.tier !== "platinum") return;
    const timer = setTimeout(() => {
      void celebrate("medium", { x: 0.5, y: 0.35 });
    }, 1200);
    return () => clearTimeout(timer);
  }, [achievement.tier]);

  return (
    // z-index 10010 puts the achievement above the celebration video
    // (z-index 9999 in `lib/celebrate.ts`). The video is intentionally
    // the topmost page-chrome layer so the coin shower paints over
    // existing modal backdrops, but the achievement modal IS the
    // headline of the unlock — it has to sit on top of the coin shower
    // with the backdrop blur masking the video like any other modal
    // cast. The `fb-ach-modal-backdrop` class also bumps the backdrop
    // blur from the default 4 px → 10 px because the coin shower
    // underneath is a high-contrast moving target, and the standard
    // blur wasn't enough to keep the badge legible against it.
    <ModalBackdrop onDismiss={onDismiss} zIndex={10010} className="fb-ach-modal-backdrop">
      <div
        className={`fb-ach-modal fb-ach-modal--${achievement.tier}`}
        style={
          {
            "--fb-ach-tint": meta.color,
            "--fb-ach-soft": meta.softColor,
          } as React.CSSProperties
        }
      >
        <div className="fb-ach-modal__hero">
          <AchievementBadge achievement={achievement} size="lg" />
        </div>
        <div className="fb-ach-modal__body">
          <span className="fb-ach-modal__eyebrow">
            {achievement.tier === "platinum"
              ? "Platinum unlock"
              : "Achievement unlocked"}
          </span>
          <h2 className="fb-ach-modal__title">{achievement.title}</h2>
          <p className="fb-ach-modal__blurb">{achievement.blurb}</p>
          {achievement.xpReward ? (
            <span className="fb-ach-modal__xp">
              +{achievement.xpReward} XP awarded
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="fb-ach-modal__cta"
          onClick={onDismiss}
        >
          Keep going
        </button>
      </div>
    </ModalBackdrop>
  );
}
