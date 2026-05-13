#!/usr/bin/env node
/// Convert the Rustlings curriculum (https://github.com/rust-lang/rustlings/)
/// into a Libre course. Source must be cloned to `/tmp/rustlings`
/// before running (or pass `--source <path>`).
///
/// What it does:
///   1. Parses `rustlings-macros/info.toml` for the canonical exercise
///      list, including chapter grouping (via `# HEADER` comments) and
///      per-exercise hints.
///   2. Reads each exercise's starter `.rs` file from `exercises/<dir>/`
///      and its matching solution from `solutions/<dir>/`.
///   3. Reads each chapter's `README.md` (intro prose for the chapter).
///   4. Emits a Libre `course.json` with one chapter per Rustlings
///      directory and one exercise-kind lesson per `.rs` file.
///
/// The resulting course installs to:
///   ~/Library/Application Support/com.mattssoftware.kata/courses/
///     rustlings-curriculum/course.json
///
/// Usage:
///   node scripts/import-rustlings.mjs [--source /tmp/rustlings] [--out <dir>]

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

const args = process.argv.slice(2);
const argFlag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const SOURCE = argFlag("source", "/tmp/rustlings");
/// Tauri's `app_data_dir()` resolves the install path from the
/// bundle identifier in `tauri.conf.json`. The current id is
/// `com.mattssoftware.libre`; the LEGACY id (when the app was
/// called Kata / Fishbones) was `com.mattssoftware.kata`. Both
/// directories may exist side-by-side on machines that survived
/// the rebrand — only the libre one is read by the running app
/// today, so write there by default.
const OUT_DIR = argFlag(
  "out",
  join(
    homedir(),
    "Library/Application Support/com.mattssoftware.libre/courses/rustlings",
  ),
);

if (!existsSync(SOURCE)) {
  console.error(`Rustlings source not found at ${SOURCE}.`);
  console.error(
    "Clone with: git clone --depth=1 https://github.com/rust-lang/rustlings.git " +
      SOURCE,
  );
  process.exit(2);
}

/// Light TOML parser tailored to Rustlings' info.toml structure.
/// Recognises:
///   - `# HEADER` lines as chapter dividers (Rustlings uses
///     `# VARIABLES` / `# IF` / etc. between exercise blocks)
///   - `[[exercises]]` table-array blocks
///   - Triple-quoted multi-line strings (used for `hint`)
///   - Simple `key = "string"` and `key = boolean`
/// Doesn't try to be a general-purpose TOML parser — Rustlings'
/// info.toml has a stable, predictable shape and we exploit that.
function parseInfoToml(text) {
  const lines = text.split("\n");
  const exercises = [];
  let currentChapter = null;
  let current = null;
  let inMultiline = null; // { key, lines }
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.replace(/\r$/, "");

    if (inMultiline) {
      const endIdx = line.indexOf('"""');
      if (endIdx >= 0) {
        const tail = line.slice(0, endIdx);
        if (tail.length > 0) inMultiline.lines.push(tail);
        current[inMultiline.key] = inMultiline.lines.join("\n").trim();
        inMultiline = null;
      } else {
        inMultiline.lines.push(line);
      }
      continue;
    }

    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("welcome_message") || trimmed.startsWith("final_message")) continue;

    // Chapter header — `# NAME` line, but ONLY when it's a
    // bare uppercase word (skip prose comments).
    const headerMatch = trimmed.match(/^#\s+([A-Z][A-Z0-9_ &/-]+)\s*$/);
    if (headerMatch) {
      currentChapter = headerMatch[1].trim();
      continue;
    }
    if (trimmed.startsWith("#")) continue;

    if (trimmed === "[[exercises]]") {
      if (current) exercises.push(current);
      current = { _chapter: currentChapter };
      continue;
    }
    if (!current) continue; // skip top-level keys (format_version etc.)

    // key = value
    const kv = trimmed.match(/^(\w+)\s*=\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2];
    if (value === '"""') {
      // Empty triple-quoted string — rare but handle gracefully.
      current[key] = "";
      continue;
    }
    if (value.startsWith('"""')) {
      const rest = value.slice(3);
      const endIdx = rest.indexOf('"""');
      if (endIdx >= 0) {
        current[key] = rest.slice(0, endIdx);
      } else {
        inMultiline = { key, lines: rest ? [rest] : [] };
      }
      continue;
    }
    if (value.startsWith('"') && value.endsWith('"')) {
      current[key] = value.slice(1, -1);
      continue;
    }
    if (value === "true" || value === "false") {
      current[key] = value === "true";
      continue;
    }
    // Numbers / other — keep raw.
    current[key] = value;
  }
  if (current) exercises.push(current);
  return exercises;
}

/// Slugify a string for use as an id segment — kebab-case, alnum
/// only. Matches the convention every other Libre course uses.
function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/// Pull a clean chapter title from a Rustlings dir name like
/// `01_variables` → `Variables`. The leading number sorts the
/// chapters in the same order Rustlings teaches them.
function chapterTitleFromDir(dir) {
  const m = dir.match(/^\d+_(.+)$/);
  const name = (m ? m[1] : dir).replace(/_/g, " ");
  return name
    .split(" ")
    .map((w) =>
      w.length === 0
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ");
}

/// Build a lesson body from the chapter README (when present) and
/// the exercise's own filename. The README is the canonical "what
/// this chapter teaches" prose — we lean on it heavily so we don't
/// have to invent body copy from scratch.
function buildBody(chapterReadme, exerciseName, starterCode) {
  const parts = [];
  if (chapterReadme) {
    parts.push(chapterReadme.trim());
    parts.push("");
  }
  // Inline the starter so the learner sees the failing snippet
  // even before they open the editor. Rustlings exercises are
  // self-narrating — the comments inside the `.rs` file describe
  // the task — so we let the code speak for itself.
  parts.push("### " + exerciseName);
  parts.push("");
  parts.push("The starter below has errors or TODOs. Fix the code so it compiles and the tests pass.");
  parts.push("");
  parts.push("```rust");
  parts.push(starterCode.trim());
  parts.push("```");
  return parts.join("\n");
}

/// Difficulty bucket — Rustlings doesn't tag exercises with a
/// difficulty, so we infer one from chapter ordering. The first
/// 6 chapters are clearly intro material; 7-15 are intermediate;
/// 16+ (lifetimes, traits, smart pointers, threads, macros) are
/// the hard back half.
function inferDifficulty(chapterDir) {
  const m = chapterDir.match(/^(\d+)_/);
  const n = m ? parseInt(m[1], 10) : 99;
  if (n <= 6) return "easy";
  if (n <= 15) return "medium";
  return "hard";
}

/// Extract the `#[cfg(test)] mod ... { ... }` block from a Rust
/// source file (which Rustlings solutions often include) so we
/// can hoist it into the lesson's `tests` field. Returns:
///   { tests: string|null, codeWithoutTests: string }
///
/// Why hoist: Libre's Rust runtime concatenates user code +
/// lesson `tests` at run time and wraps the tests in a private
/// `#[cfg(test)] mod kata_tests { use super::*; ... }`. If the
/// starter ALSO carries the tests block, the runtime ends up
/// nesting two cfg(test) modules and one of them refers to
/// items it can't see (e.g. `array_and_vec` private to the user
/// module). Hoisting the tests out of the user-editable file
/// (a) avoids that double-mod conflict, (b) means the user
/// can't accidentally delete the tests, and (c) keeps the
/// runtime's "tests come from the lesson" invariant.
///
/// Brace-matching is depth-counted so nested `{ }` inside the
/// test bodies (struct literals, blocks, etc.) don't terminate
/// the parse early.
function splitTestsBlock(source) {
  const re = /(^|\n)\s*#\[cfg\(test\)\]\s*\nmod\s+\w+\s*\{/;
  const m = re.exec(source);
  if (!m) return { tests: null, codeWithoutTests: source };
  const startOuter = m.index + (m[1] ? m[1].length : 0);
  const openBraceAt = m.index + m[0].length - 1; // index of the `{`
  let depth = 1;
  let i = openBraceAt + 1;
  while (i < source.length && depth > 0) {
    const c = source[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    i++;
  }
  if (depth !== 0) return { tests: null, codeWithoutTests: source };
  const blockEnd = i;
  // The inner body is everything between `{` and the matching `}`.
  const innerStart = openBraceAt + 1;
  const innerEnd = blockEnd - 1;
  let body = source.slice(innerStart, innerEnd);
  // Strip a leading `use super::*;` if present — Libre's runtime
  // adds its own `use super::*;` inside the `kata_tests` wrapper,
  // so a second one would duplicate the import (harmless but noisy).
  body = body.replace(/^\s*use\s+super\s*::\s*\*\s*;\s*\n?/, "");
  // Trim outer whitespace.
  body = body.replace(/^\s+|\s+$/g, "");
  const codeWithoutTests =
    (source.slice(0, startOuter) + source.slice(blockEnd))
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s+$/, "") + "\n";
  return { tests: body, codeWithoutTests };
}

/// Fallback test for compile-only Rustlings exercises (no
/// `#[cfg(test)]` block in the upstream solution). The exercise
/// passes when the user's code compiles; the synthetic test
/// just gives the Rust playground a `#[test]` it can report on,
/// so Libre's runner sees a structured pass result instead of
/// an empty test list.
///
/// Critical: the test body MUST reference at least one item from
/// the parent scope so the wrapper's `use super::*;` is
/// considered used. Several Rustlings starters carry
/// `#![forbid(unused_imports)]` at the file level (e.g.
/// `smart_pointers3`, `clippy3`); `forbid` overrules any
/// `#[allow]` attribute the wrapper would otherwise stamp on the
/// import, so the import has to be GENUINELY used. Binding
/// `main` to `_` does that without changing observable behaviour
/// — `main` is universal across Rustlings starters, and our
/// `joinCodeAndTests` synthesises one if the user's file
/// doesn't have it. Test rename keeps it scoped under
/// `rustlings_compile_check` so a reader searching for "compile"
/// pass-pills lands on the relevant template.
const COMPILE_ONLY_TEST = `#[test]
fn rustlings_compile_check() {
    // Compile-only exercise: this test passes whenever the file
    // compiles. Upstream Rustlings uses \`cargo build\` for this
    // same class of exercise; Libre routes through \`cargo test\`
    // so we synthesise a no-op #[test] to give the workbench a
    // structured pass result.
    //
    // We touch \`main\` (universal across every Rustlings starter)
    // to keep the wrapper's \`use super::*;\` legitimately used —
    // some starters ship \`#![forbid(unused_imports)]\`, and
    // \`forbid\` overrules \`allow\`, so a no-op test body would
    // trip E0453.
    let _ = main;
}
`;

const infoToml = readFileSync(join(SOURCE, "rustlings-macros/info.toml"), "utf8");
const exercises = parseInfoToml(infoToml);

console.log(`Parsed ${exercises.length} exercises from info.toml`);

// Group by dir to build chapters.
const byDir = new Map();
for (const ex of exercises) {
  if (!ex.name || !ex.dir) continue;
  if (!byDir.has(ex.dir)) byDir.set(ex.dir, []);
  byDir.get(ex.dir).push(ex);
}

const chapters = [];
let totalLessons = 0;
for (const [dir, exs] of byDir) {
  const chapterTitle = chapterTitleFromDir(dir);
  const chapterId = slug(dir);
  // Optional chapter README — preserved as the body preamble so
  // the learner has context for what each batch teaches.
  let readme = "";
  const readmePath = join(SOURCE, "exercises", dir, "README.md");
  if (existsSync(readmePath)) {
    readme = readFileSync(readmePath, "utf8");
  }
  const lessons = [];
  for (const ex of exs) {
    const starterPath = join(SOURCE, "exercises", dir, `${ex.name}.rs`);
    const solutionPath = join(SOURCE, "solutions", dir, `${ex.name}.rs`);
    if (!existsSync(starterPath)) {
      console.warn(`  skip ${ex.name}: no starter`);
      continue;
    }
    const rawStarter = readFileSync(starterPath, "utf8");
    const rawSolution = existsSync(solutionPath)
      ? readFileSync(solutionPath, "utf8")
      : rawStarter; // fall back so the lesson still installs

    // Hoist the `#[cfg(test)] mod tests { ... }` block from the
    // solution (when present) into the lesson's `tests` field.
    // The user's starter + solution then read CLEANER without
    // the cfg-test gymnastics, and Libre's runtime wraps the
    // hoisted block in its own `kata_tests` mod at run time.
    // For exercises that have NO test block upstream (Rustlings
    // calls them `test = false`, i.e. compile-only), we fall
    // back to a synthetic `rustlings_compiles` test so the
    // workbench still surfaces a structured pass pill.
    const solutionSplit = splitTestsBlock(rawSolution);
    const starterSplit = splitTestsBlock(rawStarter);
    const testsBlock = solutionSplit.tests ?? COMPILE_ONLY_TEST;
    const starter = starterSplit.codeWithoutTests;
    const solution = solutionSplit.codeWithoutTests;

    const hint = (ex.hint ?? "").trim();
    const hints = hint
      ? hint
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean)
      : [];
    lessons.push({
      id: slug(ex.name),
      title:
        ex.name.charAt(0).toUpperCase() +
        ex.name.slice(1).replace(/(\d+)$/, " $1"),
      kind: "exercise",
      language: "rust",
      difficulty: inferDifficulty(dir),
      topic: chapterId,
      body: buildBody(readme, ex.name, starter),
      starter,
      solution,
      tests: testsBlock,
      hints,
    });
    totalLessons++;
  }
  if (lessons.length === 0) continue;
  chapters.push({
    id: chapterId,
    title: chapterTitle,
    lessons,
  });
}

const course = {
  id: "rustlings",
  title: "Rustlings",
  language: "rust",
  description:
    "The official Rustlings curriculum (https://github.com/rust-lang/rustlings) — small interactive exercises that walk through Rust's syntax, ownership model, error handling, traits, and more. Mirrored into Libre with each exercise's starter, solution, and hint preserved verbatim from the upstream repo.",
  /// Attribution chunk — Rustlings is MIT/Apache-2.0 dual licensed.
  /// Surface that here so learners know where the material comes
  /// from and the upstream license travels with the course.
  attribution: {
    upstream: "https://github.com/rust-lang/rustlings",
    license: "MIT OR Apache-2.0",
  },
  chapters,
};

mkdirSync(OUT_DIR, { recursive: true });
const outPath = join(OUT_DIR, "course.json");
writeFileSync(outPath, JSON.stringify(course, null, 2) + "\n");
console.log(
  `Wrote ${chapters.length} chapters × ${totalLessons} lessons to ${outPath}`,
);
