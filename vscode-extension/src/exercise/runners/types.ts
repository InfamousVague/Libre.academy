/// Shape every per-language runner conforms to.
///
/// A runner receives the user's edited file path + the hidden tests
/// path + the lesson workspace dir, and returns a structured result
/// the run-tests command can render in the output channel.
///
/// We keep the interface small on purpose — extending it later (e.g.
/// adding per-test pass/fail breakdown) is fine as long as the
/// existing fields keep working.
import type { ExerciseLesson, Course } from "../../data/types";

export interface RunInput {
  course: Course;
  lesson: ExerciseLesson;
  /// Path to the user's editable solution file. Already exists on
  /// disk — runners read it, don't assume the in-editor unsaved
  /// version (we save it explicitly before invoking the runner).
  userFilePath: string;
  /// Workspace dir for this lesson. `<dir>/.libre/` holds the
  /// hidden tests + scaffolding; `<dir>/<userFile>` is the editable
  /// solution.
  workspaceDir: string;
  /// Where the runner can stage temporary scratch files (assembled
  /// `solution + tests` for languages that need them concatenated).
  /// Subdir of `<workspaceDir>/.libre/` — cleaned up between runs.
  scratchDir: string;
}

export type RunStatus = "pass" | "fail" | "error";

export interface RunResult {
  status: RunStatus;
  /// Combined stdout + stderr from the runner. Always non-empty on
  /// failures (so the user has something concrete to look at);
  /// optional on pass (a successful run might be entirely silent).
  output: string;
  /// Optional human-friendly summary line — shown in the toast when
  /// the runner finishes. Defaults to the status word if omitted.
  summary?: string;
  /// Non-zero exit code from the underlying subprocess when relevant.
  /// `null` for runners that don't shell out (none yet, but keeps the
  /// interface forgiving).
  exitCode?: number | null;
}

export interface Runner {
  /// Display name shown in the runner-mismatch error toast.
  readonly displayName: string;
  /// Language ids this runner serves. Multiple ids per runner is
  /// fine (e.g. one runner for both `c` and `cpp` if they share a
  /// compile-then-execute pipeline).
  readonly languages: readonly string[];
  /// Execute the user's code against the lesson's hidden tests.
  /// Throws on configuration errors (toolchain missing, scratch
  /// dir unwritable); resolves with a RunResult for everything else.
  run(input: RunInput): Promise<RunResult>;
}
