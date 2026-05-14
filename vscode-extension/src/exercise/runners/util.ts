/// Shared helpers for the per-language runners. Mostly subprocess
/// plumbing — every runner shells out to a toolchain on the user's
/// path, so we centralise the spawn-and-capture logic here rather
/// than reimplementing it three different ways.
import { spawn, type SpawnOptionsWithoutStdio } from "node:child_process";
import * as fs from "node:fs/promises";

export interface SpawnResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  /// True when we hit the timeout — distinct from a non-zero exit so
  /// the caller can render "took too long" instead of "tests failed".
  timedOut: boolean;
}

export interface SpawnConfig extends SpawnOptionsWithoutStdio {
  /// Timeout in milliseconds. Defaults to 60s — long enough for a
  /// cold `cargo test` build, short enough that an infinite loop in
  /// user code doesn't wedge the runner indefinitely.
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;

/// Spawn a subprocess, collect its stdout/stderr, and resolve once
/// it exits OR the timeout fires. Never rejects on a non-zero exit —
/// callers want the exit code + captured output to render to the
/// user. We only reject on a spawn failure (e.g. ENOENT for a
/// missing toolchain) so the caller can surface the actionable
/// "install Rust" / "install Python" error.
export function spawnCapture(
  command: string,
  args: string[],
  config: SpawnConfig = {},
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, config);
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      /// SIGKILL because some toolchains catch SIGTERM and keep
      /// running (looking at you, JVM languages). We want the
      /// runner to release the lesson workspace promptly.
      child.kill("SIGKILL");
    }, config.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ stdout, stderr, exitCode: code, timedOut });
    });
  });
}

/// Resolve absolute path of a toolchain binary by name. Returns null
/// if the binary isn't on PATH — runners use this to surface a
/// friendly "please install X" message instead of an ENOENT stack.
export async function which(binary: string): Promise<string | null> {
  /// `command -v` is POSIX shell-portable; on Windows we use `where`.
  /// We don't need the actual resolved path — only "did this resolve
  /// to anything" — so we shell out via the user's shell and read
  /// stdout.
  const isWindows = process.platform === "win32";
  const cmd = isWindows ? "where" : "command";
  const args = isWindows ? [binary] : ["-v", binary];
  /// On non-Windows we need `command` which is a shell built-in;
  /// spawn through `sh -c` so the built-in is available.
  const shellCmd = isWindows ? cmd : "sh";
  const shellArgs = isWindows ? args : ["-c", `command -v ${binary}`];
  try {
    const result = await spawnCapture(shellCmd, shellArgs, { timeoutMs: 5_000 });
    if (result.exitCode === 0 && result.stdout.trim().length > 0) {
      return result.stdout.trim().split("\n")[0] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/// Read a file's contents, or return null if it doesn't exist. Used
/// by runners that gracefully degrade when scaffolding files are
/// missing.
export async function readMaybe(p: string): Promise<string | null> {
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return null;
  }
}

/// Re-create a scratch directory empty. Each runner call gets a
/// pristine scratch so assembled solution+tests files from previous
/// runs don't pollute the input to this one.
export async function resetScratch(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}
