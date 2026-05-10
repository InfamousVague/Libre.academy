/// Maps each `Achievement.id` to a 256×256 ribbon-snake PNG badge in
/// `public/achievements/<file>`. When a mapping exists the
/// `AchievementBadge` component renders the PNG over the tier-tinted
/// disc instead of falling back to the lucide vector icon registered
/// in `src/lib/achievementIcons.ts`. Missing entries (or assets that
/// haven't been generated yet) keep the lucide-icon fallback so the
/// UI is never broken — every achievement always renders something.
///
/// File-naming convention: `<filename>.png` lives at
/// `/achievements/<filename>.png` (Vite's `public/` mount). The
/// hardcoded list below is the source of truth for which PNGs exist;
/// `import.meta.glob` would also work but a static mapping keeps
/// bundling deterministic and lets the lookup be a single object
/// dereference at render time.
///
/// Multiple existing achievement IDs can point at the same PNG (e.g.
/// `streak-100` and `streak-365` both use `streak-100.png` because we
/// only commissioned one "ribbon-snake sun" composition). That's fine
/// — the disc + glow ring around the image still vary by tier, so
/// the two shared-image badges read distinctly in the grid.

export const ACHIEVEMENT_IMAGES: Record<string, string> = {
  // ── First steps ────────────────────────────────────────────
  "first-lesson": "first-lesson.png",
  "first-chapter": "first-test-pass.png",
  "first-book": "first-course.png",

  // ── Streaks ────────────────────────────────────────────────
  "streak-3": "streak-3.png",
  "streak-7": "streak-7.png",
  "streak-30": "streak-30.png",
  "streak-100": "streak-100.png",
  // No 365-day-specific composition; the centenarian sun reads as
  // "milestone streak" generically and the tier-platinum ring around
  // it differentiates from streak-100's gold.
  "streak-365": "streak-100.png",

  // ── Lesson-volume milestones ──────────────────────────────
  // These map to "books done" badges as a proxy — volume is roughly
  // proportional to books finished, and the books-on-shelf imagery
  // reads as "you've read a lot" without needing a per-volume render.
  "volume-10": "first-test-pass.png",
  "volume-50": "books-5.png",
  "volume-100": "books-10.png",
  "volume-500": "sprint-20.png",
  "volume-2000": "level-100.png",

  // ── Library breadth (distinct books finished) ─────────────
  "library-3": "books-5.png",
  "library-10": "books-10.png",
  "library-25": "tree-walker.png",

  // ── Speed (lessons in a single day) ───────────────────────
  "speed-5": "sprint-5.png",
  "speed-10": "sprint-10.png",
  "speed-25": "sprint-20.png",

  // ── Polyglot breadth ──────────────────────────────────────
  "breadth-3": "polyglot-3.png",
  "breadth-7": "polyglot-5.png",
  "breadth-everything": "polyglot-25.png",
  "breadth-books-10": "books-10.png",

  // ── Quiz / exercise ───────────────────────────────────────
  "quizzes-25": "quiz-sharpshooter.png",
  "exercises-25": "first-test-pass.png",
  "exercises-100": "quiz-sage.png",
  "mixed-50": "capstone-first.png",

  // ── Levels ────────────────────────────────────────────────
  "level-5": "level-5.png",
  "level-10": "level-10.png",
  "level-25": "level-25.png",
  "level-50": "level-50.png",

  // ── XP totals ─────────────────────────────────────────────
  "xp-10000": "level-25.png",
  "xp-100000": "level-100.png",

  // ── Time-of-day ───────────────────────────────────────────
  "night-owl": "night-owl.png",
  "early-bird": "dawn-patrol.png",
  "vampire": "night-owl.png",

  // ── Habit cadence ─────────────────────────────────────────
  "weekender": "practice-perfect-week.png",
};

/// Resolve an achievement id to a public asset URL, or `null` when no
/// PNG is staged for it. Use the public `/` mount (Vite serves
/// `public/foo` as `/foo` at runtime) so the same paths work in the
/// desktop Tauri webview AND the embedded /learn/ build on
/// libre.academy without conditional logic.
export function resolveAchievementImage(id: string): string | null {
  const file = ACHIEVEMENT_IMAGES[id];
  if (!file) return null;
  // Vite's BASE_URL prefix handles the embedded-build path
  // (`/learn/achievements/...`) vs the standalone Tauri serve
  // (`/achievements/...`) without a separate code path.
  const base =
    typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL
      : "/";
  // Trim trailing slash + concatenate so we don't end up with "//".
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmed}/achievements/${file}`;
}
