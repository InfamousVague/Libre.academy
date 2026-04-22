import type { RunResult, LogLine, TestResult } from "./types";

/// Go via play.golang.org/compile.
///
/// Same approach as rust.ts — we lean on a public playground because
/// compiling Go in-browser isn't viable. The compile endpoint takes a
/// single-source URL-encoded form body and returns JSON with stdout,
/// stderr, and a compile-error field.
///
/// TEST HARNESS
/// ------------
/// The Go Playground's compile endpoint doesn't expose `go test` directly,
/// so we use a structured-stdout convention instead:
///
///   Each test prints ONE of these lines, exactly:
///     KATA_TEST::<name>::PASS
///     KATA_TEST::<name>::FAIL::<single-line reason>
///
/// The challenge-pack generator is told to emit test code containing a
/// `main()` that runs each check and prints those lines. The runtime
/// parses them out of stdout to build TestResult[]. Any other stdout is
/// preserved as a `log`-level line so the learner can still `fmt.Println`
/// debug prints — parsing only consumes lines matching the exact pattern.

const PLAYGROUND_URL = "https://play.golang.org/compile";
const TIMEOUT_MS = 20000;

interface PlaygroundEvent {
  Message: string;
  Kind: "stdout" | "stderr";
  Delay: number;
}

interface PlaygroundResponse {
  Errors?: string;
  Events?: PlaygroundEvent[];
  Status?: number;
  IsTest?: boolean;
  TestsFailed?: number;
}

export async function runGo(code: string, testCode?: string): Promise<RunResult> {
  const start = performance.now();
  const merged = testCode ? joinCodeAndTests(code, testCode) : code;
  const isTest = !!testCode;

  let body: PlaygroundResponse;
  try {
    const form = new URLSearchParams({
      body: merged,
      version: "2",
    });
    const res = await fetchWithTimeout(
      PLAYGROUND_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      },
      TIMEOUT_MS,
    );
    body = (await res.json()) as PlaygroundResponse;
  } catch (err) {
    return {
      logs: [],
      error:
        err instanceof Error
          ? `Go Playground request failed: ${err.message}`
          : "Go Playground request failed",
      durationMs: performance.now() - start,
    };
  }

  // Compile error surfaces directly in `Errors` — no events, no stdout.
  if (body.Errors && body.Errors.trim().length > 0) {
    return {
      logs: [],
      error: body.Errors.trim(),
      durationMs: performance.now() - start,
    };
  }

  const events = body.Events ?? [];
  const stdout = events
    .filter((e) => e.Kind === "stdout")
    .map((e) => e.Message)
    .join("");
  const stderr = events
    .filter((e) => e.Kind === "stderr")
    .map((e) => e.Message)
    .join("");

  const tests = isTest ? parseTestResults(stdout) : undefined;

  // Strip KATA_TEST lines from the log view — they're protocol, not output.
  // Anything the learner printed themselves still shows up.
  const displayStdout = isTest
    ? stdout
        .split("\n")
        .filter((l) => !/^KATA_TEST::/.test(l))
        .join("\n")
        .trim()
    : stdout.trimEnd();

  const logs: LogLine[] = [];
  if (displayStdout) logs.push({ level: "log", text: displayStdout });
  if (stderr) logs.push({ level: "error", text: stderr.trimEnd() });

  return {
    logs,
    tests,
    durationMs: performance.now() - start,
  };
}

/// Merge user code and test code into a single Go source. Both may declare
/// `package main` — we strip duplicates. The test file is expected to
/// provide its own `func main()`; user code is helper / top-level
/// declarations only. This matches the challenge-pack test contract.
function joinCodeAndTests(userCode: string, testCode: string): string {
  const stripped = (s: string) =>
    s.replace(/^\s*package\s+\w+\s*$/m, "").trim();
  return `package main\n\n${stripped(userCode)}\n\n${stripped(testCode)}\n`;
}

/// Pull TestResult[] out of the stdout stream. Lines look like
/// `KATA_TEST::test_reverse_basic::PASS` or
/// `KATA_TEST::test_reverse_basic::FAIL::expected "olleh", got "hello"`.
function parseTestResults(stdout: string): TestResult[] {
  const results: TestResult[] = [];
  for (const line of stdout.split("\n")) {
    const m = /^KATA_TEST::([\w_]+)::(PASS|FAIL)(?:::(.*))?$/.exec(line);
    if (!m) continue;
    if (m[2] === "PASS") {
      results.push({ name: m[1], passed: true });
    } else {
      results.push({ name: m[1], passed: false, error: m[3] || "test failed" });
    }
  }
  return results;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
