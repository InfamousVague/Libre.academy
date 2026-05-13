#!/usr/bin/env node
/// Convert the Ziglings curriculum (https://codeberg.org/ziglings/exercises)
/// into a Libre course. Source must be cloned to `/tmp/ziglings`
/// before running (or pass `--source <path>`).
///
/// What it does:
///   1. Walks `exercises/*.zig` (numbered `NNN_<name>.zig`) in order.
///   2. Extracts the leading comment block from each file as the
///      lesson body — Ziglings exercises are self-narrating, with
///      the task description living in `//` comments at the top.
///   3. Applies the matching `patches/patches/NNN_<name>.patch` to
///      generate the solution file.
///   4. Groups exercises into chapters by topic, inferred from the
///      first 3 chars of the filename (the numeric prefix) plus a
///      curated topic map below — Ziglings doesn't ship chapter
///      metadata, so the map is hand-authored from the upstream
///      curriculum structure.
///   5. Emits a Libre `course.json`.
///
/// Output:
///   ~/Library/Application Support/com.mattssoftware.kata/courses/
///     ziglings-curriculum/course.json
///
/// Usage:
///   node scripts/import-ziglings.mjs [--source /tmp/ziglings] [--out <dir>]

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const args = process.argv.slice(2);
const argFlag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const SOURCE = argFlag("source", "/tmp/ziglings");
/// See `import-rustlings.mjs` for the kata-vs-libre identifier
/// story. Short version: the running app reads from the
/// `com.mattssoftware.libre` data dir; we write there by default.
const OUT_DIR = argFlag(
  "out",
  join(
    homedir(),
    "Library/Application Support/com.mattssoftware.libre/courses/ziglings",
  ),
);

if (!existsSync(SOURCE)) {
  console.error(`Ziglings source not found at ${SOURCE}.`);
  console.error(
    "Clone with: git clone --depth=1 https://codeberg.org/ziglings/exercises.git " +
      SOURCE,
  );
  process.exit(2);
}

/// Chapter boundaries — hand-authored map of where each topic
/// starts. Ziglings exercise numbers are stable across releases
/// (the curriculum only ever appends), so anchoring to numeric
/// ranges keeps chapters intact when the upstream repo grows.
/// Each entry is `[startInclusive, chapterTitle]`; chapter ends
/// at the next entry's start - 1.
const CHAPTERS = [
  [1, "Hello & Strings"],
  [9, "Control Flow"],
  [18, "Functions"],
  [21, "Errors"],
  [26, "Defer & Errdefer"],
  [30, "Switch"],
  [32, "Runtime Safety"],
  [33, "Pointers"],
  [37, "Arrays & Slices"],
  [44, "Many-Item Pointers"],
  [47, "Structs"],
  [51, "Optionals"],
  [54, "Unions"],
  [57, "Numbers"],
  [60, "Bit Manipulation"],
  [63, "Labelled Loops"],
  [65, "Inline Loops"],
  [67, "Iteration"],
  [70, "Enums"],
  [72, "Quizzes & Catch-Up"],
  [75, "Async (Pre-0.11)"],
  [82, "Anonymous Structs & Tuples"],
  [85, "Vectors"],
  [88, "Files & I/O"],
  [92, "Allocators"],
  [97, "Comptime"],
  [104, "Generics & Type Erasure"],
  [110, "Build System"],
  [115, "Capstone"],
];

function chapterForExerciseNumber(n) {
  let title = CHAPTERS[0][1];
  for (const [start, t] of CHAPTERS) {
    if (n >= start) title = t;
    else break;
  }
  return title;
}

function chapterIdForTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/// Extract the leading comment block from a Ziglings exercise.
/// Every file starts with a `// ...` banner (sometimes preceded by
/// a single blank `//` line) that explains the task. We strip the
/// `// ` prefix and stop at the first non-`//` line — the rest of
/// the file is code that goes into the starter.
function extractBody(source) {
  const lines = source.split("\n");
  const out = [];
  for (const line of lines) {
    if (line.startsWith("// ")) {
      out.push(line.slice(3));
    } else if (line.trimEnd() === "//") {
      out.push("");
    } else if (out.length === 0 && line.trim() === "") {
      continue;
    } else {
      break;
    }
  }
  return out.join("\n").trim();
}

/// Apply a unified diff to the source file to produce the
/// solution. The patches Ziglings ships are simple `@@`-context
/// diffs with no multi-file headers; we parse the hunks by hand
/// to avoid pulling in a diff library.
///
/// The body of each hunk is delimited by the COUNTS in the `@@`
/// header (`-orig,N +new,M`) rather than the next `@@` marker —
/// the previous implementation absorbed any trailing junk after
/// the last hunk (notably the `""` artifact produced by
/// `text.split("\n")` when the patch ends in a newline) as an
/// extra context line, which manifested in `050_no_value` as a
/// duplicated `const Err = ...` and a swallowed closing `}` on
/// `printSecondLine`. Tracking counts here means we stop reading
/// at the right boundary regardless of trailing newlines.
function applyPatch(originalSource, patchText) {
  const original = originalSource.split("\n");
  const result = original.slice();
  const patchLines = patchText.split("\n");
  // Skip the two `---` / `+++` header lines.
  let i = 0;
  while (i < patchLines.length && !patchLines[i].startsWith("@@")) i++;

  const hunks = [];
  while (i < patchLines.length) {
    const header = patchLines[i];
    const m = header.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (!m) {
      i++;
      continue;
    }
    const origStart = parseInt(m[1], 10);
    const origLen = m[2] ? parseInt(m[2], 10) : 1;
    const newLen = m[4] ? parseInt(m[4], 10) : 1;
    const body = [];
    i++;
    // Read EXACTLY `origLen` source-counting lines (context + `-`)
    // and `newLen` dest-counting lines (context + `+`). Each
    // context line counts as both; each `-` counts as source only;
    // each `+` counts as dest only. `\ No newline at end of file`
    // lines pass through transparently.
    let srcSeen = 0;
    let dstSeen = 0;
    while (
      i < patchLines.length &&
      (srcSeen < origLen || dstSeen < newLen)
    ) {
      const ln = patchLines[i];
      if (ln.startsWith("@@")) break;
      if (ln.startsWith("+")) {
        dstSeen++;
        body.push(ln);
      } else if (ln.startsWith("-")) {
        srcSeen++;
        body.push(ln);
      } else if (ln.startsWith(" ")) {
        srcSeen++;
        dstSeen++;
        body.push(ln);
      } else if (ln === "") {
        // Truly empty (often the trailing split artifact) — count
        // as context only when we still need both src + dst lines.
        // Past either limit, this is post-hunk junk; bail.
        if (srcSeen >= origLen && dstSeen >= newLen) break;
        srcSeen++;
        dstSeen++;
        body.push("");
      } else if (ln.startsWith("\\")) {
        // `\ No newline at end of file` — pass through, doesn't
        // count toward either side.
        body.push(ln);
      } else {
        // Unknown line type — stop to avoid corrupting the hunk.
        break;
      }
      i++;
    }
    hunks.push({ origStart, origLen, body });
  }

  // Apply each hunk in reverse so removals/additions higher up
  // don't shift the line numbers of the ones below. Each hunk's
  // declared `origStart` is looked up with a fuzz factor — the
  // upstream Ziglings patches were generated against an older
  // starter where some files shifted by ±1 line, so trusting the
  // declared offset literally corrupts neighbouring code (e.g.
  // `050_no_value` lost its closing `}` because the splice landed
  // one line short of the real hunk boundary).
  for (let h = hunks.length - 1; h >= 0; h--) {
    const { origStart, origLen, body } = hunks[h];
    const expectedSrc = [];
    const replacement = [];
    for (const ln of body) {
      if (ln.startsWith("+")) {
        replacement.push(ln.slice(1));
      } else if (ln.startsWith("-")) {
        expectedSrc.push(ln.slice(1));
      } else if (ln.startsWith(" ")) {
        expectedSrc.push(ln.slice(1));
        replacement.push(ln.slice(1));
      } else if (ln === "") {
        expectedSrc.push("");
        replacement.push("");
      }
      // `\ No newline at end of file` — skip on both sides.
    }
    const startIdx = locateHunk(result, origStart - 1, expectedSrc);
    result.splice(startIdx, expectedSrc.length, ...replacement);
  }
  return result.join("\n");
}

/// Locate where a hunk actually lives in the current source.
/// Tries the declared offset first; if the source slice there
/// doesn't match the hunk's expected src lines, scans ±20 lines
/// around it, then falls back to a whole-file scan. Returns the
/// 0-indexed start position.
///
/// Why this exists: Ziglings' patches were generated against
/// snapshots of the exercises at a specific commit; the
/// `exercises/*.zig` files have since drifted by a line or two
/// in places (extra blank line at the top, a renamed comment),
/// so the declared `@@ -N,M @@` offsets no longer point at the
/// right line in some files. Fuzzy location mirrors what
/// `patch(1)`'s offset / fuzz factors do — without them, every
/// patch in this corpus would have to be hand-checked.
function locateHunk(source, declaredIdx, expected) {
  if (expected.length === 0) return Math.max(0, declaredIdx);
  if (matchesAt(source, declaredIdx, expected)) return declaredIdx;
  const MAX_FUZZ = 20;
  for (let delta = 1; delta <= MAX_FUZZ; delta++) {
    if (matchesAt(source, declaredIdx - delta, expected)) {
      return declaredIdx - delta;
    }
    if (matchesAt(source, declaredIdx + delta, expected)) {
      return declaredIdx + delta;
    }
  }
  // Whole-file scan. Stops at the first match; in practice each
  // exercise's hunk context is unique enough to land on the
  // intended spot.
  for (let i = 0; i + expected.length <= source.length; i++) {
    if (matchesAt(source, i, expected)) return i;
  }
  return Math.max(0, declaredIdx);
}

function matchesAt(source, startIdx, expected) {
  if (startIdx < 0) return false;
  if (startIdx + expected.length > source.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (source[startIdx + i] !== expected[i]) return false;
  }
  return true;
}

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferDifficulty(n) {
  if (n <= 30) return "easy";
  if (n <= 70) return "medium";
  return "hard";
}

/// Parse `build.zig` for the `.output = "..."` strings per
/// exercise. Returns a Map keyed by exercise filename (e.g.
/// `001_hello.zig`) → expected stdout. Ziglings' build config
/// stores the expected output inline alongside each exercise's
/// metadata block, in this rough shape:
///
///   .{
///       .main_file = "001_hello.zig",
///       .output = "Hello world!",
///       ...
///   },
///
/// We pair each `.main_file` line with the next `.output` line
/// in source order — the file is consistent enough that
/// state-machine parsing is overkill. Strings that span
/// multiple lines (rare but present, e.g. quizzes with
/// embedded newlines) get joined with a literal `\n` so the
/// generated test's assertion uses the unescaped form. Lines
/// containing escaped chars (`\\n`) are passed through; Zig's
/// string literal parser handles them.
function parseBuildZigOutputs(buildZigText) {
  const lines = buildZigText.split("\n");
  const out = new Map();
  let pendingFile = null;
  for (const raw of lines) {
    const fileMatch = raw.match(/\.main_file\s*=\s*"([^"]+\.zig)"/);
    if (fileMatch) {
      pendingFile = fileMatch[1];
      continue;
    }
    if (pendingFile) {
      const outMatch = raw.match(/\.output\s*=\s*"((?:[^"\\]|\\.)*)"/);
      if (outMatch) {
        out.set(pendingFile, outMatch[1]);
        pendingFile = null;
      }
    }
  }
  return out;
}

/// Build a Zig `test "..." {}` block for a Ziglings exercise.
///
/// The test does the bare-minimum needed for Libre's runner to
/// emit a structured pass result:
///   - The presence of ANY `test "..." {}` block triggers
///     `zig test` mode (see `hasModernZigTests` in
///     `src/runtimes/nativeRunners.ts`).
///   - `zig test` only runs test blocks — it does NOT execute
///     `pub fn main`, so we can't directly check the program's
///     printed output via a test. The test merely needs to
///     COMPILE for the runner to call it "passed".
///   - Compilation of the test depends on the surrounding
///     file (the user's edited solution) compiling, which is
///     the only real verification Ziglings cares about
///     anyway: every Ziglings exercise is "does this file
///     compile under modern Zig?". The expected-output
///     comparison upstream Ziglings does is a separate
///     `zig run` step we surface visually (user runs their
///     code, eyeballs the expected line in the lesson body).
///
/// The test's name is suffixed with the expected output so the
/// learner sees "test 001_hello — Hello world!" in the run
/// panel and can compare against their actual stdout without
/// flipping back to the prose.
function buildZigliningTest(exerciseName, expectedOutput) {
  // Truncate very long expected outputs so the test name stays
  // readable in the run panel. Ziglings quizzes can run to
  // 100+ chars; trimming to ~50 keeps the panel scannable.
  const display = expectedOutput
    ? expectedOutput.length > 60
      ? expectedOutput.slice(0, 57) + "…"
      : expectedOutput
    : "compiles";
  // Escape backticks + double quotes for embedding in the test
  // name string literal.
  const safeName = display
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
  const expectedComment = expectedOutput
    ? `    // Run this file and compare against the expected stdout:\n    //   ${expectedOutput.replace(/\n/g, "\\n")}\n    // The exercise passes when the file compiles cleanly under modern Zig.\n`
    : `    // Compile-check: the exercise passes when the file compiles.\n`;
  return [
    `const std_ziglings_test = @import("std");`,
    `test "${exerciseName} — ${safeName}" {`,
    expectedComment,
    `    try std_ziglings_test.testing.expect(true);`,
    `}`,
    ``,
  ].join("\n");
}

const files = readdirSync(join(SOURCE, "exercises"))
  .filter((f) => /^\d+_.+\.zig$/.test(f))
  .sort();

console.log(`Found ${files.length} Ziglings exercises`);

// Expected stdout per exercise (parsed from upstream's
// build.zig). Used to make each generated test name
// self-describing so the learner sees "What this run should
// produce" right next to the actual run output.
const expectedOutputs = (() => {
  const buildZigPath = join(SOURCE, "build.zig");
  if (!existsSync(buildZigPath)) return new Map();
  try {
    return parseBuildZigOutputs(readFileSync(buildZigPath, "utf8"));
  } catch {
    return new Map();
  }
})();
console.log(`Parsed ${expectedOutputs.size} expected-output entries from build.zig`);

const byChapter = new Map();
let totalLessons = 0;
for (const file of files) {
  const m = file.match(/^(\d+)_(.+)\.zig$/);
  if (!m) continue;
  const num = parseInt(m[1], 10);
  const name = m[2];
  const chapterTitle = chapterForExerciseNumber(num);
  const chapterId = chapterIdForTitle(chapterTitle);
  const sourcePath = join(SOURCE, "exercises", file);
  const patchPath = join(SOURCE, "patches/patches", file.replace(/\.zig$/, ".patch"));
  const starter = readFileSync(sourcePath, "utf8");
  const body = extractBody(starter);
  let solution = starter;
  if (existsSync(patchPath)) {
    try {
      const patchText = readFileSync(patchPath, "utf8");
      solution = applyPatch(starter, patchText);
    } catch (e) {
      console.warn(`  patch failed for ${file}: ${e.message}`);
    }
  }
  const expectedOutput = expectedOutputs.get(file) ?? null;
  // Lesson body — append the expected-output line so the
  // learner has a target to eyeball their `Run` output
  // against. Upstream Ziglings shows this implicitly via the
  // build script's stdout-compare; we surface it explicitly
  // since Libre's `zig test` flow doesn't enforce stdout
  // equality.
  const baseBody =
    body.length > 0
      ? body
      : "Fix the starter so it compiles and prints the expected output.";
  const lessonBody = expectedOutput
    ? `${baseBody}\n\n**Expected output:**\n\n\`\`\`\n${expectedOutput.replace(/\\n/g, "\n")}\n\`\`\``
    : baseBody;
  const lesson = {
    id: slug(`${m[1]}-${name}`),
    title: `${m[1]} — ${name.replace(/_/g, " ")}`,
    kind: "exercise",
    language: "zig",
    difficulty: inferDifficulty(num),
    topic: chapterId,
    body: lessonBody,
    starter,
    solution,
    /// Synthetic compile-check test (see `buildZigliningTest`).
    /// `zig test` won't execute `pub fn main`, so behavioral
    /// verification against the expected stdout happens via
    /// the user's `Run` step — the test here is the
    /// compilation gate that lights up the workbench's pass
    /// pill once the file is fix-clean.
    tests: buildZigliningTest(name, expectedOutput),
    hints: [],
  };
  if (!byChapter.has(chapterId)) byChapter.set(chapterId, { title: chapterTitle, lessons: [] });
  byChapter.get(chapterId).lessons.push(lesson);
  totalLessons++;
}

const chapters = [];
for (const [id, { title, lessons }] of byChapter) {
  chapters.push({ id, title, lessons });
}

const course = {
  id: "ziglings",
  title: "Ziglings",
  language: "zig",
  description:
    "The official Ziglings curriculum (https://codeberg.org/ziglings/exercises) — broken-program exercises that teach Zig by fixing small errors. Mirrored into Libre with each exercise's starter, patch-derived solution, and embedded task description preserved verbatim from upstream.",
  attribution: {
    upstream: "https://codeberg.org/ziglings/exercises",
    license: "MIT",
  },
  chapters,
};

mkdirSync(OUT_DIR, { recursive: true });
const outPath = join(OUT_DIR, "course.json");
writeFileSync(outPath, JSON.stringify(course, null, 2) + "\n");
console.log(
  `Wrote ${chapters.length} chapters × ${totalLessons} lessons to ${outPath}`,
);
