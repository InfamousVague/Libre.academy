/// Minimal subset of the Libre desktop app's course data types, copied
/// here so the VSCode extension can read the same on-disk course.json
/// files without taking a dependency on the desktop app's source tree.
///
/// When the desktop app's types change shape, this file is the contract
/// to update (and the courseStore parser too). Field comments mirror the
/// canonical definitions in `../../src/data/types.ts`; we only carry the
/// shape the extension actually consumes.
///
/// We intentionally keep this loose (most fields are optional) so a
/// course.json with extra fields the extension doesn't know about still
/// loads — extension-side rendering just ignores anything it doesn't
/// recognise rather than refusing the whole course.

export type LanguageId =
  | "javascript"
  | "typescript"
  | "python"
  | "rust"
  | "swift"
  | "go"
  | "web"
  | "threejs"
  | "react"
  | "reactnative"
  | "svelte"
  | "solid"
  | "htmx"
  | "astro"
  | "bun"
  | "tauri"
  | "c"
  | "cpp"
  | "java"
  | "kotlin"
  | "csharp"
  | "assembly"
  | "solidity"
  | "vyper"
  | "lua"
  | "sql"
  | "dart"
  | "haskell"
  | "scala"
  | "ruby"
  | "elixir"
  | "zig"
  | "move"
  | "cairo"
  | "sway";

/// Workbench file in a multi-file exercise. The lesson's primary
/// `language` decides the runner; individual files can be e.g. `html`
/// inside a `web` lesson.
export interface WorkbenchFile {
  path: string;
  contents: string;
  language?: string;
  /// If true, the file is read-only scaffolding — display in the editor
  /// but don't let the user edit it. The extension respects this via
  /// VSCode's `readonly` file system provider hook.
  readonly?: boolean;
  /// If true, this file is the entrypoint the runner concatenates last
  /// (matters for languages where order is significant, e.g. assembled
  /// single-file Rust).
  entry?: boolean;
}

export interface LessonObjective {
  /// Always a plain string in the on-disk format. We keep this as a
  /// union with `LessonObjective` to leave room for richer objective
  /// metadata later (e.g. per-objective hint text) without breaking
  /// the existing serialised form.
  text: string;
}

export interface ReadingLesson {
  id: string;
  kind: "reading";
  title: string;
  body: string;
  objectives?: string[];
}

export interface ExerciseLesson {
  id: string;
  kind: "exercise" | "mixed";
  title: string;
  body: string;
  language: LanguageId;
  starter: string;
  solution: string;
  tests: string;
  hints?: string[];
  objectives?: string[];
  files?: WorkbenchFile[];
  solutionFiles?: WorkbenchFile[];
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
}

export interface QuizLesson {
  id: string;
  kind: "quiz";
  title: string;
  body: string;
  objectives?: string[];
  /// Quiz internals (multiple-choice / fill-in) aren't supported by the
  /// extension yet — we render the body markdown and the quiz prompt is
  /// expected to live inside the body for v1. v2 will add a structured
  /// quiz UI.
  questions?: unknown;
}

export type Lesson = ReadingLesson | ExerciseLesson | QuizLesson;

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  author?: string;
  description?: string;
  language: LanguageId;
  chapters: Chapter[];
  packType?: "course" | "challenges" | "track";
  /// Absolute on-disk directory the course was loaded from. NOT part of
  /// the persisted course.json — populated by the course store after
  /// it locates the file, so downstream code can resolve `cover.jpg`
  /// and per-lesson workspace paths without re-deriving the dir.
  _path?: string;
}

/// A single completion row in the shared progress.sqlite. Same shape
/// the desktop app's Rust `progress_db` module writes.
export interface CompletionRecord {
  courseId: string;
  lessonId: string;
  completedAt: number;
}

/// Convenience: type guard that narrows a Lesson to its exercise-shaped
/// subset (exercise OR mixed). The mixed kind carries the same
/// starter/solution/tests trio so the runner doesn't need to branch on
/// kind beyond this guard.
export function isExerciseLike(
  lesson: Lesson,
): lesson is ExerciseLesson {
  return lesson.kind === "exercise" || lesson.kind === "mixed";
}
