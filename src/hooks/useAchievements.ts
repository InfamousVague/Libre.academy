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
import { confettiBurst } from "../lib/confetti";
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
  const initRef = useRef(false);
  const lastLevelRef = useRef(streakAndXp.level);

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
    // Only consider us initialised once we've seen actual data flow
    // through. Cold-boot order is:
    //   pass 1: history=[], courses=[] → satisfied=empty → fresh=empty
    //   pass 2: history loads → satisfied={...10 things...} → fresh=[...10 things...]
    // If pass 1 set initRef=true, pass 2 would mistake every
    // already-earned achievement for a brand-new unlock and fire
    // confetti + sound for the whole catalogue on every cold launch.
    // Gating initRef on real-data presence (any history, any course,
    // any persisted unlock) means we wait for actual signal before
    // accepting the silent baseline.
    const haveSignal =
      history.length > 0 ||
      courses.length > 0 ||
      unlockedRecords.length > 0;
    if (fresh.length === 0) {
      if (haveSignal) initRef.current = true;
      return;
    }
    if (!initRef.current) {
      // Silent record on first pass.
      const merged = recordUnlocks(fresh, Date.now(), unlockedRecords);
      setUnlockedRecords(merged);
      // Same gate — only declare init complete once there's real
      // data behind the satisfied set, so a wave of fresh-looking
      // unlocks from a delayed-load pass still gets the silent
      // record path.
      if (haveSignal) initRef.current = true;
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
      void confettiBurst(meta.confetti);
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
      // Skip the very first paint after a fresh launch — we don't
      // want to celebrate "your level is 7 (because you've been
      // playing for months)" as a level-up the moment the app
      // boots. The initRef guard above handles this: until the
      // first eval pass completes, we don't celebrate.
      if (initRef.current) {
        setLevelUp({ from: prev, to: streakAndXp.level });
        playSound("level-up");
        void confettiBurst("medium", { x: 0.5, y: 0.4 });
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
