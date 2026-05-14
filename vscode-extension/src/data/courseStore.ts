/// Reads courses from the shared Libre data directory.
///
/// We treat the desktop app's `<dataDir>/courses/<courseId>/course.json`
/// as a read-only source of truth — the extension never writes back to
/// these files. (Progress writes go to the shared SQLite via the
/// progress store; user code edits go to a separate per-lesson
/// workspace tree.)
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { coursesDir } from "./paths";
import type { Course, Lesson } from "./types";

/// Cached parsed course indexed by id. We only invalidate on an
/// explicit refresh — the desktop app writes courses infrequently and
/// re-reading 50MB of JSON on every lesson navigation is wasteful.
const courseCache = new Map<string, Course>();

/// Drop everything we've cached. Called from the `libre.refreshOutline`
/// command and the URI handler whenever it loads a course id that's
/// already cached but might be stale (e.g. the desktop app re-installed
/// a newer version while VSCode was running).
export function clearCourseCache(): void {
  courseCache.clear();
}

/// List every course folder under `<dataDir>/courses/`. Just folder
/// names — call `loadCourse(id)` to actually parse one.
///
/// We could parse every course.json on first call and cache, but for
/// users with 30+ installed courses that's a noticeable startup hit;
/// lazy-loading keeps the activation cost flat.
export async function listCourseIds(): Promise<string[]> {
  const dir = coursesDir();
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    /// Missing directory == no courses installed. Not an error — the
    /// user just hasn't run the desktop app yet (or installed the
    /// shared starter bundle).
    if (isNotFound(err)) return [];
    throw err;
  }
  const ids: string[] = [];
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    /// A course is a folder containing a `course.json`. Skip anything
    /// else (the data dir also holds `progress.sqlite`,
    /// `seeded-packs.json`, etc. as siblings of `courses/` so this
    /// filter is defensive against future stray files inside courses/).
    const manifest = path.join(dir, ent.name, "course.json");
    if (await exists(manifest)) ids.push(ent.name);
  }
  ids.sort();
  return ids;
}

/// Load a single course by id. Returns null if the course folder or
/// course.json is missing — callers handle that gracefully (show "not
/// installed; please install in the desktop app" rather than a stack
/// trace).
export async function loadCourse(courseId: string): Promise<Course | null> {
  const cached = courseCache.get(courseId);
  if (cached) return cached;
  const dir = path.join(coursesDir(), courseId);
  const manifest = path.join(dir, "course.json");
  let raw: string;
  try {
    raw = await fs.readFile(manifest, "utf8");
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    /// Corrupted course.json — surface to the user with the path so
    /// they can re-install. Re-throwing here surfaces the original
    /// parse error in the VSCode developer console.
    throw new Error(
      `Failed to parse ${manifest}: ${(err as Error).message ?? String(err)}`,
    );
  }
  const course = normaliseCourse(parsed, dir);
  if (!course) return null;
  courseCache.set(courseId, course);
  return course;
}

/// Locate a lesson within a loaded course. Returns the chapter index +
/// lesson index alongside the lesson itself so callers can navigate
/// (next/prev) without a second lookup. Linear scan is fine — even
/// the biggest installed course has ~300 lessons and we hit this on
/// user actions, not in a tight loop.
export function findLesson(
  course: Course,
  lessonId: string,
): { chapterIdx: number; lessonIdx: number; lesson: Lesson } | null {
  for (let ci = 0; ci < course.chapters.length; ci++) {
    const ch = course.chapters[ci]!;
    for (let li = 0; li < ch.lessons.length; li++) {
      const l = ch.lessons[li]!;
      if (l.id === lessonId) {
        return { chapterIdx: ci, lessonIdx: li, lesson: l };
      }
    }
  }
  return null;
}

/// Walk forward to the next lesson in reading order, crossing chapter
/// boundaries. Returns null when called on the very last lesson of the
/// course — callers render "Course complete!" instead of a Next button.
export function nextLessonOf(
  course: Course,
  lessonId: string,
): { chapterIdx: number; lessonIdx: number; lesson: Lesson } | null {
  const found = findLesson(course, lessonId);
  if (!found) return null;
  let { chapterIdx, lessonIdx } = found;
  lessonIdx += 1;
  while (chapterIdx < course.chapters.length) {
    const ch = course.chapters[chapterIdx]!;
    if (lessonIdx < ch.lessons.length) {
      return { chapterIdx, lessonIdx, lesson: ch.lessons[lessonIdx]! };
    }
    chapterIdx += 1;
    lessonIdx = 0;
  }
  return null;
}

// ─── Helpers ────────────────────────────────────────────────────────

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "ENOENT"
  );
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/// Sanity-check the parsed course.json shape. The desktop app writes
/// well-formed courses, but a hand-edited course.json (or a course
/// from a future schema version) could miss required fields — we'd
/// rather return null + log than crash the extension host.
function normaliseCourse(raw: unknown, dir: string): Course | null {
  if (!isObject(raw)) return null;
  const id = stringField(raw, "id");
  const title = stringField(raw, "title");
  const language = stringField(raw, "language");
  if (!id || !title || !language) return null;
  const chapters = Array.isArray(raw.chapters) ? raw.chapters : [];
  /// We deliberately don't validate the lessons here — the consumer
  /// of a Course casts down to Lesson where it needs to, and an
  /// unrecognised lesson kind is rendered as "unsupported" rather
  /// than dropped. That keeps the extension forward-compatible with
  /// new lesson kinds the desktop app adds (e.g. video).
  return {
    id,
    title,
    language: language as Course["language"],
    chapters: chapters as Course["chapters"],
    author: stringField(raw, "author") ?? undefined,
    description: stringField(raw, "description") ?? undefined,
    packType: (stringField(raw, "packType") as Course["packType"]) ?? undefined,
    _path: dir,
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function stringField(
  obj: Record<string, unknown>,
  key: string,
): string | null {
  const v = obj[key];
  return typeof v === "string" ? v : null;
}
