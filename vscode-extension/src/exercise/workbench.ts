/// Per-lesson exercise workspace setup.
///
/// On the desktop app, the user types into an in-app Monaco editor;
/// the starter / solution / tests all live in the course.json blob.
/// Inside VSCode that doesn't fly — the whole point of the extension
/// is to let the user code in the editor they already use. So we
/// materialise the starter as a real file on disk, open it in a
/// native editor tab, and let VSCode do what VSCode does best.
///
/// Layout per lesson:
///
///   <libreData>/vscode-workspaces/<courseId>/<lessonId>/
///     ├── <starterFile>       ← what the user edits
///     ├── .libre/
///     │   ├── tests.<ext>     ← hidden, regenerated each open
///     │   └── meta.json       ← course/lesson ids + last-opened ts
///
/// The `.libre/` subdir is the runner's input for assembling the
/// runnable program — it gets blown away + rewritten every open so a
/// course update flows through cleanly. The user's editable file
/// outside `.libre/` is preserved so half-finished work survives
/// across sessions.
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";
import { lessonWorkspaceDir } from "../data/paths";
import type { Course, ExerciseLesson, WorkbenchFile } from "../data/types";

/// Map language id → conventional starter filename. We pick filenames
/// the language's toolchain will recognise out of the box (e.g.
/// `solution.rs` for Rust so `rustc` is happy) so the runner doesn't
/// need to do anything clever with file extensions.
const STARTER_FILENAMES: Record<string, string> = {
  rust: "solution.rs",
  typescript: "solution.ts",
  javascript: "solution.js",
  python: "solution.py",
  go: "solution.go",
  c: "solution.c",
  cpp: "solution.cpp",
  java: "Solution.java",
  csharp: "Solution.cs",
  ruby: "solution.rb",
  swift: "solution.swift",
  kotlin: "Solution.kt",
  zig: "solution.zig",
  lua: "solution.lua",
  haskell: "Solution.hs",
  scala: "Solution.scala",
  dart: "solution.dart",
  elixir: "solution.exs",
  /// Web is tricky — multi-file by definition. The starter for web
  /// lessons should always come through `files[]` instead of the
  /// single-file `starter` string. We map to `index.html` so if
  /// someone forgets, the file is at least openable.
  web: "index.html",
};

export async function setupExerciseWorkspace(
  course: Course,
  lesson: ExerciseLesson,
): Promise<void> {
  const dir = lessonWorkspaceDir(course.id, lesson.id);
  await fs.mkdir(dir, { recursive: true });
  const internal = path.join(dir, ".libre");
  /// Wipe + recreate the `.libre/` subdir so a course update (new
  /// tests, new harness scaffold) flows through cleanly. We never
  /// touch files OUTSIDE `.libre/` because those carry the user's
  /// in-flight code.
  await fs.rm(internal, { recursive: true, force: true });
  await fs.mkdir(internal, { recursive: true });
  await fs.writeFile(
    path.join(internal, "meta.json"),
    JSON.stringify(
      {
        courseId: course.id,
        lessonId: lesson.id,
        language: lesson.language,
        openedAt: Date.now(),
      },
      null,
      2,
    ),
    "utf8",
  );
  /// Stash the hidden tests for the runner to read. Single-file
  /// lessons use the `tests` string directly; multi-file lessons
  /// override this in the per-file pass below.
  if (lesson.tests) {
    const ext = filenameExtFor(lesson.language);
    await fs.writeFile(
      path.join(internal, `tests${ext}`),
      lesson.tests,
      "utf8",
    );
  }

  /// Decide whether to materialise multi-file workbench or single-file
  /// starter. The `files[]` shape always wins when present — that's
  /// the convention in the desktop app too.
  let entryFile: string;
  if (lesson.files && lesson.files.length > 0) {
    entryFile = await writeWorkbenchFiles(dir, lesson.files);
  } else {
    entryFile = await writeSingleStarter(dir, lesson);
  }

  /// Open the entry file in column ONE so the lesson webview in
  /// column two sits on the right. This mirrors the desktop app's
  /// "code on the left, prose on the right" split.
  const uri = vscode.Uri.file(path.join(dir, entryFile));
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc, {
    viewColumn: vscode.ViewColumn.One,
    preserveFocus: false,
  });
}

/// Write the legacy single-`starter` shape. If the file already exists
/// (the user has prior work-in-progress in this lesson) we LEAVE IT —
/// only the `.libre/` subdir gets reset on open.
async function writeSingleStarter(
  dir: string,
  lesson: ExerciseLesson,
): Promise<string> {
  const filename = STARTER_FILENAMES[lesson.language] ?? "solution.txt";
  const target = path.join(dir, filename);
  if (!(await fileExists(target))) {
    await fs.writeFile(target, lesson.starter ?? "", "utf8");
  }
  return filename;
}

/// Write a multi-file workbench. Same "don't clobber the user's edits"
/// policy as the single-file case — read-only scaffolding gets
/// rewritten on every open, mutable starter files only on first
/// touch. The entry filename is whichever file is flagged
/// `entry: true`, or the first file if no flag is set.
async function writeWorkbenchFiles(
  dir: string,
  files: WorkbenchFile[],
): Promise<string> {
  let entry: string | null = null;
  for (const file of files) {
    const target = path.join(dir, file.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    /// Read-only scaffolding (e.g. a pre-baked Cargo.toml) always
    /// gets overwritten on open — that's how a course update lands.
    /// Mutable files only on first open.
    if (file.readonly || !(await fileExists(target))) {
      await fs.writeFile(target, file.contents, "utf8");
    }
    if (file.entry && !entry) entry = file.path;
  }
  return entry ?? files[0]?.path ?? "index";
}

/// Map a language id to a filename extension for the hidden tests
/// file we drop in `.libre/`. Keep in sync with `STARTER_FILENAMES`'s
/// extensions above — the runner needs to be able to find the tests
/// without metadata.
function filenameExtFor(language: string): string {
  switch (language) {
    case "rust":
      return ".rs";
    case "typescript":
      return ".ts";
    case "javascript":
      return ".js";
    case "python":
      return ".py";
    case "go":
      return ".go";
    case "c":
      return ".c";
    case "cpp":
      return ".cpp";
    case "java":
      return ".java";
    case "csharp":
      return ".cs";
    case "ruby":
      return ".rb";
    case "swift":
      return ".swift";
    case "zig":
      return ".zig";
    default:
      return ".txt";
  }
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/// Locate the user's editable solution file for the current lesson.
/// Used by the runner to read what the user actually typed (the
/// `.libre/` directory only holds tests + meta).
export function entryFilePath(
  courseId: string,
  lessonId: string,
  language: string,
): string {
  const dir = lessonWorkspaceDir(courseId, lessonId);
  const filename = STARTER_FILENAMES[language] ?? "solution.txt";
  return path.join(dir, filename);
}

export function lessonInternalDir(courseId: string, lessonId: string): string {
  return path.join(lessonWorkspaceDir(courseId, lessonId), ".libre");
}
