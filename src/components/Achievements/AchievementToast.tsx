/// Bronze/silver achievement toast. Slides in from the top-right,
/// holds, and auto-dismisses. Multiple unlocks at the same instant
/// stack vertically with a small gap between them.
///
/// Accessibility: each toast announces via `role="status"` so screen
/// readers pick up the unlock without our having to manage live
/// regions by hand. The ARIA copy uses the achievement's title +
/// blurb so the message reads naturally.
///
/// Auto-dismiss happens after `holdMs`. Hover pauses the timer (so a
/// curious learner can read the blurb without the toast vanishing
/// mid-glance), and clicking the toast dismisses it immediately —
/// useful when the user knows they got the unlock and want to clear
/// the visual.

import { useEffect, useRef, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { x as xIcon } from "@base/primitives/icon/icons/x";

import type { Achievement } from "../../data/achievements";
import AchievementBadge from "./AchievementBadge";
import "./Achievements.css";

interface Props {
  achievement: Achievement;
  /// How long to keep the toast on screen, in ms. Defaults to a
  /// tier-aware value (bronze 4 s, silver 5 s).
  holdMs?: number;
  onDismiss: () => void;
}

export default function AchievementToast({
  achievement,
  holdMs,
  onDismiss,
}: Props) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tierHold = achievement.tier === "bronze" ? 4000 : 5000;
  const total = holdMs ?? tierHold;

  // Three-phase animation: enter (translate-in), hold, exit
  // (translate-out + fade). The phases are CSS-driven; this component
  // just sequences the timers and calls onDismiss after the exit
  // finishes.
  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase("hold"), 240);
    return () => clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    if (phase !== "hold") return;
    dismissTimer.current = setTimeout(() => setPhase("out"), total);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [phase, total]);

  useEffect(() => {
    if (phase !== "out") return;
    const exitTimer = setTimeout(onDismiss, 220);
    return () => clearTimeout(exitTimer);
  }, [phase, onDismiss]);

  const pause = () => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  };
  const resume = () => {
    if (phase !== "hold") return;
    if (dismissTimer.current) return;
    dismissTimer.current = setTimeout(() => setPhase("out"), total / 2);
  };

  const handleDismiss = () => setPhase("out");

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fb-ach-toast fb-ach-toast--${achievement.tier} fb-ach-toast--${phase}`}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onClick={handleDismiss}
    >
      <AchievementBadge achievement={achievement} size="sm" />
      <div className="fb-ach-toast__body">
        <span className="fb-ach-toast__eyebrow">Achievement unlocked</span>
        <span className="fb-ach-toast__title">{achievement.title}</span>
        <span className="fb-ach-toast__blurb">{achievement.blurb}</span>
        {achievement.xpReward ? (
          <span className="fb-ach-toast__xp">+{achievement.xpReward} XP</span>
        ) : null}
      </div>
      <button
        type="button"
        className="fb-ach-toast__close"
        aria-label="Dismiss"
        onClick={(e) => {
          // Don't double-fire dismiss via the parent onClick handler.
          e.stopPropagation();
          handleDismiss();
        }}
      >
        <Icon icon={xIcon} size="xs" color="currentColor" />
      </button>
    </div>
  );
}
