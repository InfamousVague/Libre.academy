/// Helpers for the multi-file workbench. The component layer always deals
/// with `WorkbenchFile[]` — legacy single-file lessons get converted on the
/// fly so we don't have two render paths.

import type {
  ExerciseLesson,
  FileLanguage,
  LanguageId,
  MixedLesson,
  WorkbenchFile,
} from "../data/types";

/// Default filename + Monaco language for a given primary language. Only
/// used when a lesson has no explicit `files` array — this synthesizes a
/// sensible single-file starting point.
const LANG_DEFAULTS: Record<LanguageId, { name: string; language: FileLanguage }> = {
  javascript: { name: "user.js", language: "javascript" },
  typescript: { name: "user.ts", language: "typescript" },
  python: { name: "user.py", language: "python" },
  rust: { name: "user.rs", language: "rust" },
  swift: { name: "user.swift", language: "swift" },
  go: { name: "main.go", language: "go" },
};

/// Derive the editor's starting file set. When the lesson has explicit
/// `files`, we clone it. Otherwise we synthesize a one-file array from the
/// legacy `starter` field. Cloning matters because the editor mutates the
/// files array on every keystroke and we don't want to leak edits back onto
/// the loaded lesson (which can be revisited via Prev/Next).
export function deriveStarterFiles(lesson: ExerciseLesson | MixedLesson): WorkbenchFile[] {
  if (lesson.files && lesson.files.length > 0) {
    return lesson.files.map((f) => ({ ...f }));
  }
  const def = LANG_DEFAULTS[lesson.language];
  return [
    {
      name: def.name,
      language: def.language,
      content: lesson.starter,
    },
  ];
}

/// Derive the reference solution as files, same shape the editor uses so
/// "reveal solution" can just swap the array wholesale.
export function deriveSolutionFiles(lesson: ExerciseLesson | MixedLesson): WorkbenchFile[] {
  if (lesson.solutionFiles && lesson.solutionFiles.length > 0) {
    return lesson.solutionFiles.map((f) => ({ ...f }));
  }
  const def = LANG_DEFAULTS[lesson.language];
  return [
    {
      name: def.name,
      language: def.language,
      content: lesson.solution,
    },
  ];
}

/// Build the single source string passed to `runCode` from a set of files.
/// Only files matching the lesson's runnable language get concatenated; the
/// rest (e.g. CSS in a web-flavored JS lesson) are ignored by the runner but
/// still visible in the editor tabs.
///
/// Concatenation order is file-array order, which means authors can deliver
/// a reference module (say, a shared helper) as file[0] and the user's
/// primary scratchpad as file[1] — they stack top-down like `cat *.js`.
export function assembleRunnable(files: WorkbenchFile[], language: LanguageId): string {
  const runnable = files.filter((f) => f.language === language);
  if (runnable.length === 0) {
    // Nothing that matches the primary language — run an empty string. Tests
    // will surface this cleanly via "function is not defined" style errors.
    return "";
  }
  if (runnable.length === 1) return runnable[0].content;
  // Separate files with filename comments so runtime errors can hint at which
  // file the trace maps to. Works across every currently-supported runtime
  // because they all use `//` line comments.
  return runnable
    .map((f) => `// ---- ${f.name} ----\n${f.content}`)
    .join("\n\n");
}

/// Whether the given files array differs from the lesson's starter set —
/// used to enable/disable the Reset button so the learner can tell whether
/// they're in "pristine starter" state.
export function filesDifferFromStarter(
  current: WorkbenchFile[],
  starter: WorkbenchFile[],
): boolean {
  if (current.length !== starter.length) return true;
  for (let i = 0; i < current.length; i++) {
    if (current[i].name !== starter[i].name) return true;
    if (current[i].content !== starter[i].content) return true;
  }
  return false;
}
