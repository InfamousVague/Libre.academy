import { invoke } from "@tauri-apps/api/core";
import type { RunResult, LogLine } from "./types";

/// Swift via the local toolchain.
///
/// V1 only supports running the user's code (no test harness). Swift can't
/// run in-browser at a reasonable weight, so the frontend invokes a
/// `run_swift` Tauri command that writes the source to a temp file and
/// exec's the system `swift` interpreter.
///
/// If swift isn't installed, the Tauri command returns a `launch_error`
/// pointing the user at `xcode-select --install`. We surface that in
/// OutputPane.

interface SubprocessResult {
  stdout: string;
  stderr: string;
  success: boolean;
  durationMs: number;
  launchError: string | null;
}

export async function runSwift(code: string, _testCode?: string): Promise<RunResult> {
  // tauri v2 serializes camelCase ↔ snake_case via serde attrs; here we just
  // camelCase manually on the way out.
  const rawResult = await invoke<{
    stdout: string;
    stderr: string;
    success: boolean;
    duration_ms: number;
    launch_error: string | null;
  }>("run_swift", { code });

  const result: SubprocessResult = {
    stdout: rawResult.stdout,
    stderr: rawResult.stderr,
    success: rawResult.success,
    durationMs: rawResult.duration_ms,
    launchError: rawResult.launch_error,
  };

  if (result.launchError) {
    return {
      logs: [],
      error: result.launchError,
      durationMs: result.durationMs,
    };
  }

  const logs: LogLine[] = [];
  if (result.stdout) logs.push({ level: "log", text: result.stdout.trimEnd() });
  if (result.stderr && !result.success) {
    // Swift compile errors + runtime diagnostics arrive on stderr.
    logs.push({ level: "error", text: result.stderr.trimEnd() });
  }

  return {
    logs,
    error: result.success ? undefined : "swift exited with a non-zero status",
    durationMs: result.durationMs,
  };
}
