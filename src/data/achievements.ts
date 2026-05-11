/// Type-safe achievement registry. The source of truth for the
/// achievement *system design* lives in `acheive_prompts.md` at the
/// repo root — keep this file in lockstep with that doc when adding
/// or editing entries.
///
/// Adding an achievement:
///   1. Append the entry to `acheive_prompts.md` first (forces a
///      human-readable design pass).
///   2. Mirror the row into ACHIEVEMENTS below with matching id,
///      title, blurb, and trigger.
///   3. If the trigger needs a new `kind` not in the AchievementRule
///      union, extend the union here AND the matching switch arm in
///      `src/lib/achievements.ts`'s evaluator.
///   4. Don't trigger-spam: prefer one well-placed achievement with
///      a higher count over five small ones with overlapping
///      conditions. The list reads better when it's curated.
///
/// Retired entries: never delete a row that's ever shipped. Set
/// `retired: true` so the engine skips trigger evaluation while the
/// AchievementsPage still renders past unlocks for users who hit it.

/// Icons come from @base's path-string format — each `<name>.ts`
/// exports a single string of the SVG inner markup, rendered via
/// `<Icon icon={...} />` from `@base/primitives/icon`. Achievement
/// rows reference an icon by string id; the renderer maps id →
/// imported path-string at presentation time. We avoid importing
/// the actual icon constants in this data file so the achievement
/// list stays a plain JSON-shaped value (cheap to ship to a worker,
/// cheap to import from a build script).
export type AchievementIconId =
  | "footprints"
  | "book-open"
  | "book-check"
  | "flame"
  | "sparkles"
  | "snowflake"
  | "bookmark"
  | "library"
  | "library-big"
  | "trophy"
  | "crown"
  | "book-a"
  | "book-copy"
  | "zap"
  | "sun"
  | "sunrise"
  | "languages"
  | "compass"
  | "badge-check"
  | "hammer"
  | "wrench"
  | "layers"
  | "award"
  | "medal"
  | "coins"
  | "diamond"
  | "moon"
  | "calendar-days";

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export type AchievementCategory =
  | "progress"
  | "streak"
  | "volume"
  | "depth"
  | "breadth"
  | "mastery"
  | "esoteric";

/// Lesson kinds we count for kind-specific triggers. Mirrors the
/// discriminated union in `src/data/types.ts` LessonBase / LessonRich.
/// "mixed" is the umbrella kind used for project lessons that combine
/// reading + exercise + quiz.
export type CountedLessonKind = "reading" | "quiz" | "exercise" | "mixed";

/// Trigger rule discriminated union. The evaluator in
/// `src/lib/achievements.ts` walks ProgressSnapshot and checks each
/// rule against the snapshot. Add a new kind here AND the matching
/// arm in the evaluator switch.
export type AchievementRule =
  | { kind: "lessonsTotal"; count: number }
  | { kind: "lessonsKind"; lessonKind: CountedLessonKind; count: number }
  | { kind: "chaptersDone"; count: number }
  | { kind: "booksDone"; count: number }
  | { kind: "streakDays"; count: number }
  | { kind: "longestStreakDays"; count: number }
  | { kind: "level"; count: number }
  | { kind: "xpTotal"; count: number }
  | { kind: "lessonsInDay"; count: number }
  | { kind: "languagesTouched"; count: number }
  | { kind: "booksTouched"; count: number }
  /// Strict before-time-of-day rule: triggers if a completion's
  /// local-time-of-day is BEFORE the boundary. Format "HH:MM".
  | { kind: "completionTime"; before: string }
  /// Strict after-time-of-day rule: triggers if a completion's
  /// local-time-of-day is AT-OR-AFTER the start boundary AND
  /// strictly before `endBefore` (24h, e.g. "04:00") so we can
  /// model "0:00–04:00 local" without a wraparound.
  | { kind: "completionTime"; after: string; endBefore: string }
  /// Did the learner complete at least one lesson on a Saturday
  /// AND at least one on a Sunday inside the same ISO week (any
  /// week).
  | { kind: "weekendDouble" }
  /// Completed a lesson in courseX after >`days` days of zero
  /// completions in courseX.
  | { kind: "comeback"; days: number }
  /// Spent at least N streak freezes (cumulative).
  | { kind: "freezeUsed"; count: number }
  /// Completed a lesson on N distinct days where the local hour
  /// falls inside [hour, beforeHour). Useful for "vampire hours"-
  /// type esoteric achievements.
  | {
      kind: "lessonsAfterHourCount";
      hour: number;
      beforeHour: number;
      count: number;
    };

export interface Achievement {
  /// kebab-case slug, frozen forever. This is the persistence key —
  /// renaming the title is fine, renaming the id orphans every
  /// learner's unlock record.
  id: string;
  title: string;
  blurb: string;
  tier: AchievementTier;
  icon: AchievementIconId;
  category: AchievementCategory;
  trigger: AchievementRule;
  /// Hidden achievements stay opaque on the AchievementsPage list
  /// (lock-icon tile, no title / blurb leaked) until the learner
  /// unlocks them. Esoterics are the natural home for this.
  hidden?: boolean;
  /// Bonus XP awarded on first unlock. Stacks with the lesson XP
  /// that triggered the unlock. Set to 0 (or omit) for milestones
  /// where the celebration itself is the reward.
  xpReward?: number;
  /// Tombstoned entries — engine skips trigger evaluation but past
  /// unlocks still render in the list (with a "retired" pill).
  retired?: boolean;
}

/// Master registry. Order here drives rendering order on the
/// AchievementsPage — group by category, easy → hard within each.
export const ACHIEVEMENTS: Achievement[] = [
  // ── §Onboarding ─────────────────────────────────────────────
  {
    id: "first-lesson",
    title: "First step",
    blurb: "One down. The streak is alive.",
    tier: "bronze",
    icon: "footprints",
    category: "progress",
    trigger: { kind: "lessonsTotal", count: 1 },
    xpReward: 5,
  },
  {
    id: "first-chapter",
    title: "Wrapped a chapter",
    blurb: "Every chapter you finish is one fewer left.",
    tier: "bronze",
    icon: "book-open",
    category: "progress",
    trigger: { kind: "chaptersDone", count: 1 },
    xpReward: 15,
  },
  {
    id: "first-book",
    title: "Closed the book",
    blurb: "First whole book in the rear-view. The shelf is yours.",
    tier: "gold",
    icon: "book-check",
    category: "progress",
    trigger: { kind: "booksDone", count: 1 },
    xpReward: 100,
  },

  // ── §Streak ─────────────────────────────────────────────────
  {
    id: "streak-3",
    title: "Three in a row",
    blurb: "Three days. The fire is real.",
    tier: "bronze",
    icon: "flame",
    category: "streak",
    trigger: { kind: "streakDays", count: 3 },
    xpReward: 10,
  },
  {
    id: "streak-7",
    title: "One full week",
    blurb: "Seven days. You picked up a hobby.",
    tier: "silver",
    icon: "flame",
    category: "streak",
    trigger: { kind: "streakDays", count: 7 },
    xpReward: 25,
  },
  {
    id: "streak-30",
    title: "A month of fire",
    blurb: "Thirty days. This isn't an experiment any more.",
    tier: "gold",
    icon: "flame",
    category: "streak",
    trigger: { kind: "streakDays", count: 30 },
    xpReward: 100,
  },
  {
    id: "streak-100",
    title: "Triple digits",
    blurb:
      "One hundred consecutive days. You've outlasted most New Year's resolutions.",
    tier: "platinum",
    icon: "flame",
    category: "streak",
    trigger: { kind: "streakDays", count: 100 },
    xpReward: 500,
  },
  {
    id: "streak-365",
    title: "A year of fire",
    blurb: "Three hundred and sixty-five. Hall of fame.",
    tier: "platinum",
    icon: "sparkles",
    category: "streak",
    trigger: { kind: "streakDays", count: 365 },
    hidden: true,
    xpReward: 2500,
  },
  {
    id: "streak-saved",
    title: "Saved by the freeze",
    blurb: "Streak freeze used. Streak preserved. Sleep tonight.",
    tier: "bronze",
    icon: "snowflake",
    category: "streak",
    trigger: { kind: "freezeUsed", count: 1 },
  },
  {
    id: "streak-comeback",
    title: "Re-lit the fire",
    blurb: "You came back. That's the real win.",
    tier: "silver",
    icon: "flame",
    category: "streak",
    trigger: { kind: "comeback", days: 14 },
    xpReward: 30,
  },

  // ── §Volume ─────────────────────────────────────────────────
  {
    id: "volume-10",
    title: "Bookworm",
    blurb: "Ten lessons. You're on the shelf.",
    tier: "bronze",
    icon: "bookmark",
    category: "volume",
    trigger: { kind: "lessonsTotal", count: 10 },
    xpReward: 25,
  },
  {
    id: "volume-50",
    title: "Reading habit",
    blurb: "Fifty lessons. The habit's stuck.",
    tier: "bronze",
    icon: "bookmark",
    category: "volume",
    trigger: { kind: "lessonsTotal", count: 50 },
    xpReward: 50,
  },
  {
    id: "volume-100",
    title: "Page turner",
    blurb: "Triple digits in the books column.",
    tier: "silver",
    icon: "library",
    category: "volume",
    trigger: { kind: "lessonsTotal", count: 100 },
    xpReward: 100,
  },
  {
    id: "volume-500",
    title: "Marathon reader",
    blurb: "Five hundred lessons. The library's started to feel small.",
    tier: "gold",
    icon: "trophy",
    category: "volume",
    trigger: { kind: "lessonsTotal", count: 500 },
    xpReward: 500,
  },
  {
    id: "volume-2000",
    title: "Possessed",
    blurb: "Two thousand. Take a walk. Touch grass. Then keep going.",
    tier: "platinum",
    icon: "crown",
    category: "volume",
    trigger: { kind: "lessonsTotal", count: 2000 },
    xpReward: 2000,
  },

  // ── §Library (whole-book finishes) ──────────────────────────
  {
    id: "library-3",
    title: "Library card",
    blurb: "Three books finished. You're a reader, officially.",
    tier: "silver",
    icon: "book-a",
    category: "progress",
    trigger: { kind: "booksDone", count: 3 },
    xpReward: 75,
  },
  {
    id: "library-10",
    title: "Closing the stacks",
    blurb: "Ten finished books. A real curriculum's worth.",
    tier: "gold",
    icon: "library",
    category: "progress",
    trigger: { kind: "booksDone", count: 10 },
    xpReward: 300,
  },
  {
    id: "library-25",
    title: "Master librarian",
    blurb: "Twenty-five books. The shelf is not large enough any more.",
    tier: "platinum",
    icon: "library-big",
    category: "progress",
    trigger: { kind: "booksDone", count: 25 },
    xpReward: 1500,
  },

  // ── §Speed ──────────────────────────────────────────────────
  {
    id: "speed-5",
    title: "Lightning round",
    blurb: "Five lessons today. You're on a roll.",
    tier: "bronze",
    icon: "zap",
    category: "depth",
    trigger: { kind: "lessonsInDay", count: 5 },
    xpReward: 15,
  },
  {
    id: "speed-10",
    title: "Power day",
    blurb: "Ten in one sitting. The chair owes you rent.",
    tier: "silver",
    icon: "zap",
    category: "depth",
    trigger: { kind: "lessonsInDay", count: 10 },
    xpReward: 50,
  },
  {
    id: "speed-25",
    title: "All-nighter",
    blurb: "Twenty-five lessons in a single day. Your wrists are reporting you.",
    tier: "gold",
    icon: "sun",
    category: "depth",
    trigger: { kind: "lessonsInDay", count: 25 },
    xpReward: 200,
  },

  // ── §Breadth ────────────────────────────────────────────────
  {
    id: "breadth-3",
    title: "Polyglot starter",
    blurb: "Three languages tried. The Tower of Babel called.",
    tier: "bronze",
    icon: "languages",
    category: "breadth",
    trigger: { kind: "languagesTouched", count: 3 },
    xpReward: 25,
  },
  {
    id: "breadth-7",
    title: "Polyglot",
    blurb: "Seven languages with at least one lesson under your belt.",
    tier: "silver",
    icon: "languages",
    category: "breadth",
    trigger: { kind: "languagesTouched", count: 7 },
    xpReward: 100,
  },
  {
    id: "breadth-everything",
    title: "Curiosity",
    blurb:
      "At least one lesson in every language we ship. Browser tabs are crying.",
    tier: "gold",
    icon: "compass",
    category: "breadth",
    trigger: { kind: "languagesTouched", count: 16 },
    xpReward: 250,
  },
  {
    id: "breadth-books-10",
    title: "Browsing the stacks",
    blurb: "Started ten different books. Reading widely.",
    tier: "silver",
    icon: "book-copy",
    category: "breadth",
    trigger: { kind: "booksTouched", count: 10 },
    xpReward: 75,
  },

  // ── §Lesson kinds ───────────────────────────────────────────
  {
    id: "quizzes-25",
    title: "Quizzed",
    blurb: "Twenty-five quizzes passed. The questions don't scare you.",
    tier: "silver",
    icon: "badge-check",
    category: "depth",
    trigger: { kind: "lessonsKind", lessonKind: "quiz", count: 25 },
    xpReward: 75,
  },
  {
    id: "exercises-25",
    title: "Hands on",
    blurb: "Twenty-five exercises shipped. The tests bow to you.",
    tier: "silver",
    icon: "hammer",
    category: "depth",
    trigger: { kind: "lessonsKind", lessonKind: "exercise", count: 25 },
    xpReward: 150,
  },
  {
    id: "exercises-100",
    title: "Compulsive coder",
    blurb: "One hundred exercises. The compiler is your friend now.",
    tier: "gold",
    icon: "wrench",
    category: "depth",
    trigger: { kind: "lessonsKind", lessonKind: "exercise", count: 100 },
    xpReward: 500,
  },
  {
    id: "mixed-50",
    title: "Project person",
    blurb: "Fifty mixed-format lessons. You like the bigger pieces.",
    tier: "silver",
    icon: "layers",
    category: "depth",
    trigger: { kind: "lessonsKind", lessonKind: "mixed", count: 50 },
    xpReward: 200,
  },

  // ── §Levels (XP curve) ──────────────────────────────────────
  {
    id: "level-5",
    title: "Apprentice",
    blurb: "Level five. The badge fits.",
    tier: "bronze",
    icon: "award",
    category: "progress",
    trigger: { kind: "level", count: 5 },
  },
  {
    id: "level-10",
    title: "Journeyman",
    blurb: "Level ten. The shelf-ish levels are behind you.",
    tier: "silver",
    icon: "medal",
    category: "progress",
    trigger: { kind: "level", count: 10 },
  },
  {
    id: "level-25",
    title: "Adept",
    blurb: "Level twenty-five. Most of what we have to teach, you've seen.",
    tier: "gold",
    icon: "crown",
    category: "progress",
    trigger: { kind: "level", count: 25 },
  },
  {
    id: "level-50",
    title: "Master",
    blurb: "Level fifty. We're running out of curve to climb.",
    tier: "platinum",
    icon: "crown",
    category: "progress",
    trigger: { kind: "level", count: 50 },
  },
  {
    id: "xp-10000",
    title: "Five figures",
    blurb: "Ten thousand XP. The grind has paid out.",
    tier: "gold",
    icon: "coins",
    category: "progress",
    trigger: { kind: "xpTotal", count: 10000 },
  },
  {
    id: "xp-100000",
    title: "Six figures",
    blurb: "One hundred thousand XP. We genuinely don't know what to say.",
    tier: "platinum",
    icon: "diamond",
    category: "progress",
    trigger: { kind: "xpTotal", count: 100000 },
  },

  // ── §Esoteric ───────────────────────────────────────────────
  {
    id: "night-owl",
    title: "Night owl",
    blurb: "Lesson finished after midnight. We see you.",
    tier: "bronze",
    icon: "moon",
    category: "esoteric",
    hidden: true,
    trigger: { kind: "completionTime", after: "00:00", endBefore: "04:00" },
    xpReward: 10,
  },
  {
    id: "early-bird",
    title: "Early bird",
    blurb: "Lesson before sunrise. The worm is yours.",
    tier: "bronze",
    icon: "sunrise",
    category: "esoteric",
    hidden: true,
    trigger: { kind: "completionTime", before: "06:00" },
    xpReward: 10,
  },
  {
    id: "weekender",
    title: "Weekender",
    blurb: "Lessons on both Saturday AND Sunday. Most people don't.",
    tier: "bronze",
    icon: "calendar-days",
    category: "esoteric",
    hidden: true,
    trigger: { kind: "weekendDouble" },
    xpReward: 15,
  },
  {
    id: "vampire",
    title: "Vampire hours",
    blurb:
      "Seven different days where you finished a lesson between 2 AM and 5 AM. We're concerned.",
    tier: "silver",
    icon: "moon",
    category: "esoteric",
    hidden: true,
    trigger: { kind: "lessonsAfterHourCount", hour: 2, beforeHour: 5, count: 7 },
    xpReward: 50,
  },
];

/// Lookup helper used by the toast/modal layer to resolve an id back
/// to its definition. Logs and returns null on miss; never throws so
/// a stale persisted id from a future-version client doesn't crash
/// today's UI.
export function getAchievement(id: string): Achievement | null {
  return ACHIEVEMENTS.find((a) => a.id === id) ?? null;
}

/// Group achievements by category for the AchievementsPage layout.
/// Order matches the section order in `acheive_prompts.md`.
export const CATEGORY_ORDER: AchievementCategory[] = [
  "progress",
  "streak",
  "volume",
  "depth",
  "breadth",
  "mastery",
  "esoteric",
];

export const CATEGORY_LABEL: Record<AchievementCategory, string> = {
  progress: "Progress",
  streak: "Streaks",
  volume: "Volume",
  depth: "Depth",
  breadth: "Breadth",
  mastery: "Mastery",
  esoteric: "Esoteric",
};

/// Tier metadata: the colour token, sound effect name, and UI hint
/// (toast vs. modal). Read by the toast queue + modal layer when
/// staging an unlock.
export const TIER_META: Record<
  AchievementTier,
  {
    color: string;
    /// Soft fill colour used behind the badge in toast / modal — same
    /// hue as `color` but ~10% saturation, so the icon still pops.
    softColor: string;
    sound: "chime" | "success" | "fanfare" | "arpeggio";
    presentation: "toast" | "modal";
    confetti: "none" | "small" | "medium" | "large";
  }
> = {
  bronze: {
    color: "#cd7f32",
    softColor: "rgba(205, 127, 50, 0.18)",
    sound: "chime",
    // 2026-05-11: bronze + silver promoted from "toast" to "modal" so
    // every tier gets the centred badge + coin-shower treatment. The
    // top-right toast was easy to miss (especially while the learner
    // was scrolling the lesson) and reading the achievement title +
    // blurb required catching the toast inside its hold window. The
    // modal sits dead centre with a backdrop-blurred mask underneath,
    // so the unlock is impossible to miss + the user reads the blurb
    // at their own pace.
    presentation: "modal",
    // Bronze was `confetti: "none"` because the toast didn't carry
    // a celebration video — bumping to "small" gives it a brief coin
    // shower that matches its modest tier without competing with
    // gold/platinum's fuller bursts.
    confetti: "small",
  },
  silver: {
    color: "#c0c0c0",
    softColor: "rgba(192, 192, 192, 0.18)",
    sound: "success",
    presentation: "modal",
    confetti: "small",
  },
  gold: {
    color: "#ffc857",
    softColor: "rgba(255, 200, 87, 0.20)",
    sound: "fanfare",
    presentation: "modal",
    confetti: "medium",
  },
  platinum: {
    color: "#b9f2ff",
    softColor: "rgba(185, 242, 255, 0.22)",
    sound: "arpeggio",
    presentation: "modal",
    confetti: "large",
  },
};
