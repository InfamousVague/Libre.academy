/// Hook layer for the achievement system.
///
/// Reactive design: the caller passes the current `history`,
/// `courses`, and `streakAndXp` snapshot in. The hook re-evaluates
/// the registry whenever any of those inputs changes, diffs against
/// the persisted unlocks, and exposes the freshly-unlocked rows as
/// a queue for the presentation layer to drain.
///
/// Using an effect (instead of an imperative `checkAfterCompletion`
/// the caller fires from inside `markCompletedAndCelebrate`) sidesteps
/// the timing trap where `markCompleted` is async and the caller
/// would otherwise evaluate against stale state. By the time the
/// effect fires, React has committed the new history; the snapshot
/// the engine sees is always the post-commit one.
///
/// The hook also fires the appropriate sound + confetti for the
/// highest-tier unlock in each batch — playing 5 sounds at once would
/// sound like a glitch, so we collapse simultaneous unlocks to one
/// audio cue while still surfacing all of them in the visual queue.

import { useEffect, useMemo, useRef, useState } from "react";

import type { Achievement } from "../data/achievements";
import { TIER_META } from "../data/achievements";
import {
  diffUnlocks,
  evaluateAchievements,
  readFreezesUsed,
  readUnlocked,
  recordUnlocks,
} from "../lib/achievements";
import type { ProgressSnapshot, UnlockedRecord } from "../lib/achievements";
import { celebrate } from "../lib/celebrate";
import { playSound } from "../lib/sfx";
import type { Course } from "../data/types";
import type { Completion } from "../lib/storage";
import type { StreakAndXp } from "./useStreakAndXp";

const STORAGE_EVENT_KEY = "fb:achievements:unlocked";

export interface UseAchievementsResult {
  /// Set of unlocked ids — used by AchievementsPage to render the
  /// list, and by anywhere else that wants "have I unlocked X?".
  unlocked: Set<string>;
  /// Full unlock records (id + unlockedAt). Same data as `unlocked`,
  /// but with the timestamp for "Unlocked 3 days ago" copy.
  unlockedRecords: UnlockedRecord[];
  /// Achievements that haven't yet been "presented" by the overlay
  /// (toast dismissed / modal closed). The overlay drains them in
  /// tier order.
  pendingPresentation: Achievement[];
  /// Mark an item presented — drops it from `pendingPresentation`.
  markPresented: (id: string) => void;
  /// True when level-up just happened (prev → current). Drives the
  /// level-up modal in App.tsx. Reset by `clearLevelUp`.
  levelUp: { from: number; to: number } | null;
  clearLevelUp: () => void;
}

export function useAchievements(
  history: readonly Completion[],
  courses: readonly Course[],
  streakAndXp: StreakAndXp,
): UseAchievementsResult {
  const [unlockedRecords, setUnlockedRecords] = useState<UnlockedRecord[]>(
    () => readUnlocked(),
  );
  const [pendingPresentation, setPendingPresentation] = useState<Achievement[]>(
    [],
  );
  const [levelUp, setLevelUp] = useState<UseAchievementsResult["levelUp"]>(null);

  // Track the last-seen unlock ids so the effect can detect new
  // ones without comparing big sets every render.
  const lastSatisfiedIdsRef = useRef<Set<string>>(new Set());
  // Boot-time grace deadline. Within this window, both the
  // achievement-detection effect and the level-up effect skip
  // celebrations (sound + confetti) but still record / track state.
  // The window covers the noisy hydration period when:
  //   - history loads from disk → satisfied set jumps from empty to
  //     "everything the user already earned"
  //   - streakAndXp.level hydrates from initial 1 to the user's real
  //     level → looks like a level-up to the change-detector
  // 2.5 s is comfortably past every hydration path I've measured
  // (cold boot to fully-paint runs ~600-1500 ms typical) without
  // being so long that a genuine in-session unlock during the first
  // few seconds would get swallowed silently.
  const graceDeadlineRef = useRef<number>(0);
  const lastLevelRef = useRef(streakAndXp.level);

  useEffect(() => {
    graceDeadlineRef.current = (typeof performance !== "undefined"
      ? performance.now()
      : Date.now()) + 2500;
  }, []);

  function withinGrace(): boolean {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    return now < graceDeadlineRef.current;
  }

  // Cross-tab sync: another tab unlocking an achievement should
  // light up this tab's list too. localStorage `storage` events fire
  // in OTHER tabs (not the writing tab); the writing tab updates via
  // its own setState path.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_EVENT_KEY) return;
      setUnlockedRecords(readUnlocked());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const unlocked = useMemo(
    () => new Set(unlockedRecords.map((r) => r.id)),
    [unlockedRecords],
  );

  // Reactive evaluation — fires after every progress / streak / level
  // change. The diff vs. persisted unlocks ensures replays don't
  // re-fire toasts.
  useEffect(() => {
    const snapshot: ProgressSnapshot = {
      history,
      courses,
      streakDays: streakAndXp.streakDays,
      longestStreakDays: streakAndXp.longestStreakDays,
      level: streakAndXp.level,
      xp: streakAndXp.xp,
      freezesUsed: readFreezesUsed(),
    };
    const { satisfied } = evaluateAchievements(snapshot);
    lastSatisfiedIdsRef.current = satisfied;

    // First-paint pass: don't surface "freshly unlocked" toasts for
    // every persisted achievement. The persisted record IS the
    // baseline. We still record any satisfied-but-not-persisted ids
    // (covers the case where the user upgraded the app and a brand
    // new achievement matches their existing progress), but we do
    // it silently — no toast / sound / confetti — to avoid an
    // overwhelming "30 achievements unlocked!" carousel on first
    // launch after an update.
    const fresh = diffUnlocks(satisfied, unlockedRecords);
    if (fresh.length === 0) return;

    // Inside the boot grace window, every fresh-looking unlock is
    // assumed to be a discovery (data hydrating up to its true
    // shape), not a real-time earn. Persist quietly and bail —
    // no toast, no sound, no celebration cue. This is the simple,
    // robust replacement for the earlier `initRef` two-pass
    // bookkeeping which broke as soon as the eval order saw
    // multiple empty passes before the first non-empty one.
    if (withinGrace()) {
      const merged = recordUnlocks(fresh, Date.now(), unlockedRecords);
      setUnlockedRecords(merged);
      return;
    }

    // Subsequent passes: full celebration treatment.
    const merged = recordUnlocks(fresh, Date.now(), unlockedRecords);
    setUnlockedRecords(merged);
    setPendingPresentation((prev) => [...prev, ...fresh]);
    // Sound: highest tier only. Multiple unlocks fire one cue.
    const highest = fresh.reduce<Achievement>(
      (acc, a) => (TIER_RANK[a.tier] > TIER_RANK[acc.tier] ? a : acc),
      fresh[0],
    );
    const meta = TIER_META[highest.tier];
    playSound(meta.sound);
    if (meta.confetti !== "none") {
      void celebrate(meta.confetti);
    }
    // We intentionally do NOT include `unlockedRecords` in the deps
    // — recordUnlocks updates it via setUnlockedRecords, and adding
    // it to deps would cause re-runs on every persistence write
    // (infinite loop risk). The diff inside the effect is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, courses, streakAndXp.streakDays, streakAndXp.longestStreakDays, streakAndXp.level, streakAndXp.xp]);

  // Detect level-up transitions. Separate from the achievement
  // engine because level-up has its own celebration semantics
  // (dedicated modal, dedicated sound) — not every level matches a
  // `level-N` achievement.
  useEffect(() => {
    const prev = lastLevelRef.current;
    if (streakAndXp.level > prev) {
      // Skip celebrations during the boot grace window. Cold-boot
      // hydration looks like a "level 1 → level 7" transition the
      // moment streakAndXp finishes loading, which the change
      // detector would otherwise celebrate every launch. Real
      // in-session level-ups happen well outside the 2.5 s window.
      if (!withinGrace()) {
        setLevelUp({ from: prev, to: streakAndXp.level });
        playSound("level-up");
        void celebrate("medium", { x: 0.5, y: 0.4 });
      }
    }
    lastLevelRef.current = streakAndXp.level;
  }, [streakAndXp.level]);

  const markPresented = (id: string) => {
    setPendingPresentation((prev) => prev.filter((a) => a.id !== id));
  };

  const clearLevelUp = () => setLevelUp(null);

  return {
    unlocked,
    unlockedRecords,
    pendingPresentation,
    markPresented,
    levelUp,
    clearLevelUp,
  };
}

const TIER_RANK = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
