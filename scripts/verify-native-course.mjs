#!/usr/bin/env node
/// Headless verifier for `language: "go"` and `language: "rust"`
/// exercise lessons. Companion to `verify-evm-course.mjs` — same
/// CLI shape, same exit-code semantics, same in-place reuse of the
/// in-app runtime helpers (extracted via esbuild bundle on first
/// run and cached at `node_modules/.cache/`).
///
/// **What runs natively (vs. the in-app runtime):**
///   - Go: `go run` against the `joinCodeAndTests` output (same merge
///     the in-app runtime feeds to play.golang.org/compile). The
///     lesson convention is `KATA_TEST::<name>::PASS|FAIL[::<reason>]`
///     printed from a `func main()` that drives each `kataTest_*`
///     check; we parse stdout for those lines.
///   - Rust: write the merged source to a temp file, `rustc --test`
///     it (mirrors what `cargo test` does for a single-file crate
///     with `mod tests {}`), execute the resulting binary, parse the
///     `test ... ok|FAILED` summary lines.
///
/// Local toolchain is required (`go`, `rustc`). On a missing
/// toolchain the script reports each lesson as skipped with a
/// useful hint rather than crashing the whole run.
///
/// **Usage:**
///   node scripts/verify-native-course.mjs --course <id-or-path> --lang go
///   node scripts/verify-native-course.mjs --course the-rust-programming-language --lang rust
///   node scripts/verify-native-course.mjs --course learning-go --lang go --report report.md
///   node scripts/verify-native-course.mjs --course learning-go --lang go --filter slice
///   node scripts/verify-native-course.mjs --lesson <id> --lang go --course learning-go
///
/// Exit code: 0 if all ran lessons passed, 1 otherwise.

import { existsSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import * as esbuild from "esbuild";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

// ─── arg parsing ─────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const bool = (name) => args.includes(name);

const courseArg = flag("--course");
const lessonArg = flag("--lesson");
const filterArg = flag("--filter");
const reportPath = flag("--report");
const langArg = flag("--lang"); // 'go' or 'rust'
const jsonOut = bool("--json");
const verbose = bool("--verbose") || bool("-v");
const perLessonTimeoutMs = parseInt(flag("--timeout") ?? "20000", 10);

if (!courseArg) {
  console.error("Required: --course <id-or-path>");
  process.exit(2);
}
if (!langArg || (langArg !== "go" && langArg !== "rust")) {
  console.error("Required: --lang go|rust");
  process.exit(2);
}

function resolveCoursePath(idOrPath) {
  if (isAbsolute(idOrPath) && existsSync(idOrPath)) return idOrPath;
  if (idOrPath.endsWith(".json") && existsSync(resolve(idOrPath))) {
    return resolve(idOrPath);
  }
  const live = join(
    homedir(),
    "Library/Application Support/com.mattssoftware.libre/courses",
    idOrPath,
    "course.json",
  );
  if (existsSync(live)) return live;
  const bundled = join(ROOT, "public/starter-courses", `${idOrPath}.json`);
  if (existsSync(bundled)) return bundled;
  throw new Error(
    `course not found: tried '${idOrPath}', '${live}', '${bundled}'`,
  );
}

const COURSE_PATH = resolveCoursePath(courseArg);
if (verbose) console.error(`[verify] course: ${COURSE_PATH}`);

// ─── bundle the in-app helpers ───────────────────────────────────
const BUNDLE_DIR = join(ROOT, "node_modules/.cache/libre-native-headless");
mkdirSync(BUNDLE_DIR, { recursive: true });
const BUNDLE_PATH = join(BUNDLE_DIR, "helpers.mjs");
const ENTRY_PATH = join(BUNDLE_DIR, "entry.ts");

writeFileSync(
  ENTRY_PATH,
  `export {
  joinCodeAndTests as joinGo,
  ensureMain,
  parseTestResults as parseGoTests,
} from ${JSON.stringify(join(ROOT, "src/runtimes/go.ts"))};
export {
  joinCodeAndTests as joinRust,
  parseTestResults as parseRustTests,
} from ${JSON.stringify(join(ROOT, "src/runtimes/rust.ts"))};
`,
  "utf8",
);

await esbuild.build({
  entryPoints: [ENTRY_PATH],
  outfile: BUNDLE_PATH,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  packages: "external",
  logLevel: verbose ? "warning" : "silent",
});

const { joinGo, ensureMain, parseGoTests, joinRust, parseRustTests } =
  await import(pathToFileURL(BUNDLE_PATH).href);

// ─── per-language runners ────────────────────────────────────────

/// Detect whether a toolchain binary is on PATH. Returned hint is
/// surfaced in the report's `skipReason` so the user knows what to
/// install if a run can't proceed.
function which(binary) {
  const r = spawnSync("which", [binary], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

const HAS_GO = which("go");
const HAS_RUSTC = which("rustc");

function runGoLesson(solution, tests) {
  if (!HAS_GO) {
    return { tests: [], skipReason: "go binary not on PATH (`brew install go`)" };
  }
  const merged = tests ? joinGo(solution, tests) : ensureMain(solution);
  const dir = mkdtempSync(join(tmpdir(), "libre-go-"));
  const file = join(dir, "main.go");
  try {
    writeFileSync(file, merged, "utf8");
    const r = spawnSync("go", ["run", file], {
      encoding: "utf8",
      timeout: perLessonTimeoutMs,
      env: { ...process.env, GOFLAGS: "-mod=mod" },
    });
    if (r.error) {
      return { tests: [], harnessError: r.error.message };
    }
    if (r.status !== 0 && !r.stdout?.includes("KATA_TEST::")) {
      // Compile error or runtime crash before any test ran. Surface
      // the first 30 lines of stderr so the report has something
      // diagnostic.
      const compileError = (r.stderr || "").split("\n").slice(0, 30).join("\n").trim();
      return { tests: [], compileError: compileError || "go exited non-zero with no output" };
    }
    return { tests: parseGoTests(r.stdout || ""), stdout: r.stdout, stderr: r.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runRustLesson(solution, tests) {
  if (!HAS_RUSTC) {
    return {
      tests: [],
      skipReason: "rustc not on PATH (install via https://rustup.rs)",
    };
  }
  const merged = tests ? joinRust(solution, tests) : solution;
  const dir = mkdtempSync(join(tmpdir(), "libre-rust-"));
  const file = join(dir, "main.rs");
  const bin = join(dir, "main");
  try {
    writeFileSync(file, merged, "utf8");
    // `--edition 2021` matches what the in-app runtime asks the
    // Playground for; `-A warnings` keeps the stderr clean of
    // unused-variable noise that's irrelevant to test outcomes.
    const compile = spawnSync(
      "rustc",
      ["--test", "--edition", "2021", "-A", "warnings", "-o", bin, file],
      { encoding: "utf8", timeout: perLessonTimeoutMs },
    );
    if (compile.error) {
      return { tests: [], harnessError: compile.error.message };
    }
    if (compile.status !== 0) {
      const compileError = (compile.stderr || "").split("\n").slice(0, 40).join("\n").trim();
      return { tests: [], compileError: compileError || "rustc exited non-zero" };
    }
    // `--test-threads=1` makes failures deterministic (cargo runs
    // in parallel by default); `--nocapture` would echo println!
    // output but we leave it off so the parser only sees test lines.
    const run = spawnSync(bin, ["--test-threads=1"], {
      encoding: "utf8",
      timeout: perLessonTimeoutMs,
    });
    if (run.error) {
      return { tests: [], harnessError: run.error.message };
    }
    return { tests: parseRustTests(run.stdout || ""), stdout: run.stdout, stderr: run.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ─── walk the course ─────────────────────────────────────────────
const course = JSON.parse(readFileSync(COURSE_PATH, "utf8"));
const targets = [];
for (const ch of course.chapters ?? []) {
  for (const lesson of ch.lessons ?? []) {
    if (lesson.kind !== "exercise" && lesson.kind !== "mixed") continue;
    if (lesson.language !== langArg) continue;
    if (lessonArg && lesson.id !== lessonArg) continue;
    if (filterArg && !lesson.id.includes(filterArg)) continue;
    targets.push({ chapterId: ch.id, lesson });
  }
}

if (targets.length === 0) {
  console.error(`No matching ${langArg} exercises in ${COURSE_PATH}`);
  process.exit(2);
}
if (verbose) console.error(`[verify] running ${targets.length} lesson(s)\n`);

function deriveSolution(lesson) {
  // For Go/Rust we don't have multi-file solutions in the courseware
  // — the `solution` string is the whole answer.
  if (typeof lesson.solution === "string" && lesson.solution.trim()) {
    return lesson.solution;
  }
  if (Array.isArray(lesson.solutionFiles) && lesson.solutionFiles.length > 0) {
    return lesson.solutionFiles.map((f) => f.content).join("\n\n");
  }
  return "";
}

const results = [];
for (let i = 0; i < targets.length; i++) {
  const { chapterId, lesson } = targets[i];
  const solution = deriveSolution(lesson);
  const testCode = lesson.tests ?? "";
  const tag = `[${i + 1}/${targets.length}] ${lesson.id}`;
  if (verbose) process.stderr.write(`${tag} ... `);
  const started = Date.now();
  let runResult;
  try {
    runResult =
      langArg === "go"
        ? runGoLesson(solution, testCode)
        : runRustLesson(solution, testCode);
  } catch (e) {
    runResult = { tests: [], harnessError: e instanceof Error ? e.message : String(e) };
  }
  const durationMs = Date.now() - started;
  const passedTests = runResult.tests.filter((t) => t.passed).length;
  const failedTests = runResult.tests.filter((t) => !t.passed);
  // A lesson with no `tests` field is a compile-only lesson (matches
  // the in-app runtime: when testCode is undefined, runGo/runRust
  // just compile and report logs). For those, "ok" means
  // compile + run succeeded with no harness error. For lessons that
  // declare tests, we additionally require at least one parsed test
  // and zero failures — `tests.length === 0` with a non-empty
  // testCode means parsing whiffed (test framework mismatch, name
  // regex mismatch, etc.) and is a real failure.
  const expectedTests = !!testCode.trim();
  const ok =
    !runResult.compileError &&
    !runResult.harnessError &&
    !runResult.skipReason &&
    failedTests.length === 0 &&
    (expectedTests ? runResult.tests.length > 0 : true);
  results.push({
    id: lesson.id,
    title: lesson.title,
    chapterId,
    durationMs,
    ok,
    skipReason: runResult.skipReason,
    compileError: runResult.compileError,
    harnessError: runResult.harnessError,
    tests: runResult.tests,
    stderr: runResult.stderr,
  });
  if (verbose) {
    if (runResult.skipReason) {
      process.stderr.write(`⊘ skip (${durationMs}ms)\n`);
    } else if (ok) {
      const summary = expectedTests ? `${passedTests}/${passedTests}` : "compiled";
      process.stderr.write(`✓ ${summary} (${durationMs}ms)\n`);
    } else {
      const tag = runResult.compileError
        ? "compile error"
        : runResult.harnessError
        ? "harness error"
        : `${passedTests}/${runResult.tests.length}`;
      process.stderr.write(`✗ ${tag} (${durationMs}ms)\n`);
    }
  }
}

// ─── report ──────────────────────────────────────────────────────
if (jsonOut) {
  process.stdout.write(JSON.stringify({ courseId: course.id ?? courseArg, lang: langArg, results }, null, 2) + "\n");
} else {
  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok && !r.skipReason);
  const skipped = results.filter((r) => r.skipReason);
  const lines = [];
  lines.push(`# Headless ${langArg} verification: ${course.title ?? course.id ?? courseArg}`);
  lines.push("");
  lines.push(`**Total:** ${results.length} · **Passed:** ${passed.length} · **Failed:** ${failed.length} · **Skipped:** ${skipped.length}  `);
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push("");
  if (failed.length > 0) {
    lines.push(`## ✗ Failed (${failed.length})`);
    lines.push("");
    for (const r of failed) {
      lines.push(`### ${r.title ?? r.id} \`(${r.id})\``);
      lines.push(`- chapter: \`${r.chapterId}\` · duration: ${(r.durationMs / 1000).toFixed(2)}s`);
      if (r.compileError) {
        lines.push("");
        lines.push("**Compile error:**");
        lines.push("```");
        lines.push(r.compileError);
        lines.push("```");
      } else if (r.harnessError) {
        lines.push("");
        lines.push(`**Harness error:** \`${r.harnessError}\``);
      } else {
        lines.push("");
        lines.push("**Failed tests:**");
        for (const t of r.tests.filter((t) => !t.passed)) {
          lines.push(`- \`${t.name}\` — ${t.error?.split("\n")[0] ?? "(no message)"}`);
        }
      }
      lines.push("");
    }
  }
  if (skipped.length > 0) {
    lines.push(`## ⊘ Skipped (${skipped.length})`);
    lines.push("");
    for (const r of skipped) {
      lines.push(`- \`${r.id}\` — ${r.skipReason}`);
    }
    lines.push("");
  }
  if (passed.length > 0) {
    lines.push(`## ✓ Passed (${passed.length})`);
    lines.push("");
    lines.push("<details><summary>show list</summary>");
    lines.push("");
    for (const r of passed) lines.push(`- ${r.title ?? r.id} \`(${r.id})\``);
    lines.push("");
    lines.push("</details>");
  }
  const md = lines.join("\n") + "\n";
  if (reportPath) {
    writeFileSync(reportPath, md, "utf8");
    console.error(`wrote ${reportPath}`);
  } else {
    process.stdout.write(md);
  }
}

process.exit(results.every((r) => r.ok || r.skipReason) ? 0 : 1);
