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

import { useCallback, useEffect } from "react";

import type { Achievement } from "../../data/achievements";
import { TIER_META } from "../../data/achievements";
import {
  accelerateActiveCelebrations,
  celebrate,
  dismissActiveCelebrations,
} from "../../lib/celebrate";
import ModalBackdrop from "../Shared/ModalBackdrop";
import AchievementBadge from "./AchievementBadge";
import { useT } from "../../i18n/i18n";
import "./Achievements.css";

/// How long the closing coin shower runs at the bumped rate before
/// being torn down. Long enough that the user perceives the speed-up
/// as a closing flourish; short enough that nothing lingers after
/// the modal is gone. With the new 2× baseline + 4× dismiss bump,
/// 350 ms covers the visible tail without dragging.
const FAREWELL_FLUSH_MS = 350;

interface Props {
  achievement: Achievement;
  onDismiss: () => void;
}

export default function AchievementModal({ achievement, onDismiss }: Props) {
  const t = useT();
  const meta = TIER_META[achievement.tier];

  // Fire the primary celebrate burst on mount. Previously this fired
  // from useAchievements when the unlock was detected, but that
  // decoupling produced "coin shower with no mask underneath" beats —
  // e.g., installing a placeholder book legitimately satisfies
  // "Library card" (silver/gold) and the screen-filler played with
  // only a toast / nothing as the visual anchor. Owning the celebrate
  // call here ties the video lifecycle to the modal lifecycle:
  // celebrate only ever plays alongside the backdrop-blurred mask
  // this component renders, which is exactly the pairing the design
  // calls for.
  //
  // Platinum gets a sustained wash — the primary burst on mount plus
  // a follow-up at 1.2 s so the field doesn't visibly empty before
  // the user has read the blurb. Gold + below get a single burst.
  useEffect(() => {
    if (meta.confetti === "none") return;
    void celebrate(meta.confetti, { x: 0.5, y: 0.35 });
    if (achievement.tier !== "platinum") return;
    const timer = setTimeout(() => {
      void celebrate("medium", { x: 0.5, y: 0.35 });
    }, 1200);
    return () => clearTimeout(timer);
  }, [achievement.tier, meta.confetti]);

  /// Wrap the parent's onDismiss with a closing flourish + tear-down
  /// pass on the coin shower. Without this the video keeps playing
  /// for the rest of its duration even after the modal vanishes —
  /// the celebration outlived the thing it was celebrating, which
  /// reads as "stuck overlay" not "wrap-up". Sequence:
  ///   1. Bump every active celebrate video to 4× (the baseline is
  ///      now 2× — see `lib/celebrate.ts` — so this still doubles
  ///      the playback rate at dismiss time and the remaining coin
  ///      frames flush fast.
  ///   2. Schedule a forced dismiss after FAREWELL_FLUSH_MS so the
  ///      overlay is guaranteed gone even if `ended` doesn't fire
  ///      on a malformed asset / paused decoder.
  ///   3. Call the parent's onDismiss so the modal unmounts in
  ///      parallel with the video's accelerated tail.
  const handleDismiss = useCallback(() => {
    accelerateActiveCelebrations(4.0);
    window.setTimeout(() => {
      dismissActiveCelebrations();
    }, FAREWELL_FLUSH_MS);
    onDismiss();
  }, [onDismiss]);

  /// Belt-and-suspenders: if the modal unmounts for any OTHER reason
  /// (parent re-renders, queue advances to the next platinum unlock,
  /// React StrictMode double-invokes during dev), still tear down
  /// any active celebration on the way out so we don't leak a
  /// playing video into the next mount.
  useEffect(() => {
    return () => {
      dismissActiveCelebrations();
    };
  }, []);

  return (
    // z-index 10010 puts the achievement above the celebration video
    // (z-index 9999 in `lib/celebrate.ts`). The video is intentionally
    // the topmost page-chrome layer so the coin shower paints over
    // existing modal backdrops, but the achievement modal IS the
    // headline of the unlock — it has to sit on top of the coin shower
    // with the backdrop blur masking the video like any other modal
    // cast. The `libre-ach-modal-backdrop` class also bumps the backdrop
    // blur from the default 4 px → 10 px because the coin shower
    // underneath is a high-contrast moving target, and the standard
    // blur wasn't enough to keep the badge legible against it.
    <ModalBackdrop onDismiss={handleDismiss} zIndex={10010} className="libre-ach-modal-backdrop">
      <div
        className={`libre-ach-modal libre-ach-modal--${achievement.tier}`}
        style={
          {
            "--libre-ach-tint": meta.color,
            "--libre-ach-soft": meta.softColor,
          } as React.CSSProperties
        }
      >
        <div className="libre-ach-modal__hero">
          <AchievementBadge achievement={achievement} size="lg" />
        </div>
        <div className="libre-ach-modal__body">
          <span className="libre-ach-modal__eyebrow">
            {achievement.tier === "platinum"
              ? t("achievements.platinumUnlock2")
              : t("achievements.unlocked2")}
          </span>
          <h2 className="libre-ach-modal__title">{achievement.title}</h2>
          <p className="libre-ach-modal__blurb">{achievement.blurb}</p>
          {achievement.xpReward ? (
            <span className="libre-ach-modal__xp">
              {t("achievements.xpAwarded", { n: achievement.xpReward })}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="libre-ach-modal__cta"
          onClick={handleDismiss}
        >
          {t("achievements.keepGoing")}
        </button>
      </div>
    </ModalBackdrop>
  );
}
