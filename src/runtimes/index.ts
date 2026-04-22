import type { LanguageId, WorkbenchFile } from "../data/types";
import { assembleRunnable } from "../lib/workbenchFiles";
import { runJavaScript, runTypeScript } from "./javascript";
import { runPython } from "./python";
import { runRust } from "./rust";
import { runSwift } from "./swift";
import { runGo } from "./go";
import { runWeb, isWebLesson } from "./web";
import type { RunResult } from "./types";

export type { RunResult, LogLine, TestResult } from "./types";
export { isPassing } from "./types";

/// Dispatch to the right in-browser runtime for a language.
/// `testCode` is optional; when provided, the runtime runs it against the
/// user's module.exports and reports per-test pass/fail results.
export async function runCode(
  language: LanguageId,
  code: string,
  testCode?: string,
): Promise<RunResult> {
  switch (language) {
    case "javascript":
      return runJavaScript(code, testCode);
    case "typescript":
      return runTypeScript(code, testCode);
    case "python":
      return runPython(code, testCode);
    case "rust":
      return runRust(code, testCode);
    case "swift":
      return runSwift(code, testCode);
    case "go":
      return runGo(code, testCode);
  }
}

/// Multi-file variant used by the workbench UI. Picks the web runtime when
/// the file set includes HTML or CSS (regardless of primary language),
/// otherwise falls through to the single-language runner after assembling
/// the runnable files into one source string.
export async function runFiles(
  language: LanguageId,
  files: WorkbenchFile[],
  testCode?: string,
): Promise<RunResult> {
  if (isWebLesson(files)) {
    return runWeb(files, testCode);
  }
  const code = assembleRunnable(files, language);
  return runCode(language, code, testCode);
}
