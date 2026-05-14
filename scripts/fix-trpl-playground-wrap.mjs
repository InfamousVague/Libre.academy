/// Wrap bare-statement `rust playground` blocks in `fn main()` so
/// they compile.
///
/// The bug: across the TRPL course, many `rust playground` fences
/// open with `let x = ...;` (or another statement-level construct)
/// without a surrounding `fn main()`. Plain reading is unaffected —
/// markdown-it just syntax-highlights and shows the snippet — but
/// the `playground` info-string flag turns the fence into an
/// inline Monaco sandbox with a Run button (see `libre-inline-
/// sandbox` in markdown.ts). When the learner hits Run, the
/// runtime forwards the code to play.rust-lang.org as-is, which
/// errors with:
///
///   error: expected item, found keyword `let`
///
/// because Rust's grammar only allows `fn`, `use`, `struct`, `enum`,
/// `mod`, `impl`, etc. at file scope.
///
/// What this script does
/// ─────────────────────
/// For every lesson body, finds every `rust playground` fence and:
///   1. Skips it if the body already contains `fn main(` — the
///      author already wrapped it, leave alone.
///   2. Skips it if the body looks like top-level items only (the
///      first non-comment line starts with `use`, `fn`, `struct`,
///      `enum`, `mod`, `impl`, `trait`, `const`, `static`, `pub`,
///      or `extern`). Those compile as a complete file.
///   3. Otherwise: wraps the original code in `fn main() {\n   …\n}`,
///      indenting every line by 4 spaces. Indentation is preserved
///      relative to the original (a 2-space nested block stays
///      visually nested, just shifted right by 4).
///
/// Idempotent — re-running over an already-wrapped block detects
/// `fn main(` and bails.
///
/// Usage:
///   node scripts/fix-trpl-playground-wrap.mjs
///
/// Reads + writes:
///   ~/Library/Application Support/com.mattssoftware.libre/courses/
///       the-rust-programming-language/course.json

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const COURSE_PATH = join(
  homedir(),
  "Library/Application Support/com.mattssoftware.libre/courses/the-rust-programming-language/course.json",
);

// Top-level keywords — if the first non-comment line of the snippet
// starts with one of these, the block is already a complete file
// and shouldn't be wrapped. Stays close to the Rust grammar's set
// of module-item productions.
const TOP_LEVEL_KEYWORDS = new Set([
  "use",
  "fn",
  "struct",
  "enum",
  "mod",
  "impl",
  "trait",
  "const",
  "static",
  "pub",
  "extern",
  "type",
  "union",
  "macro_rules!",
  "#",  // attribute like `#[derive(...)]` — leads into an item
  "//!", // crate-level doc comment
]);

/// Inspect a playground block's body. Returns true when the body
/// needs wrapping (bare statements at top level), false when it's
/// already file-scope-valid.
function needsWrapping(code) {
  if (/\bfn\s+main\s*\(/.test(code)) return false;
  // Find the first non-comment, non-blank line.
  for (const raw of code.split(/\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("//")) continue;
    if (line.startsWith("/*")) continue;
    // First real line. Pull the first token (greedy alphanumerics).
    const firstToken = line.match(/^[A-Za-z_#!]+/);
    if (!firstToken) return true; // weird leading punctuation — wrap defensively
    const tok = firstToken[0];
    if (TOP_LEVEL_KEYWORDS.has(tok)) return false;
    return true;
  }
  return false;
}

/// Produce the wrapped form. Every non-empty line of the original
/// gets a 4-space indent prefix; empty lines stay empty so the
/// vertical rhythm of the snippet is preserved.
function wrapInMain(code) {
  // Strip a trailing newline from the inner body so the closing `}`
  // doesn't sit on its own with an extra gap above. We'll re-add a
  // single trailing newline below the `}` to match the fence's
  // canonical shape.
  const trimmed = code.replace(/\n+$/, "");
  const indented = trimmed
    .split(/\n/)
    .map((line) => (line.length > 0 ? "    " + line : ""))
    .join("\n");
  return `fn main() {\n${indented}\n}\n`;
}

function main() {
  const course = JSON.parse(readFileSync(COURSE_PATH, "utf8"));
  let wrappedBlocks = 0;
  let touchedLessons = 0;
  const log = [];

  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      const body = lesson.body;
      if (typeof body !== "string") continue;
      let lessonWrapped = 0;
      const newBody = body.replace(
        /```rust playground\n([\s\S]*?)```/g,
        (whole, code) => {
          if (!needsWrapping(code)) return whole;
          lessonWrapped++;
          return "```rust playground\n" + wrapInMain(code) + "```";
        },
      );
      if (lessonWrapped > 0) {
        lesson.body = newBody;
        touchedLessons++;
        wrappedBlocks += lessonWrapped;
        log.push({ id: lesson.id, title: lesson.title, blocks: lessonWrapped });
      }
    }
  }

  writeFileSync(COURSE_PATH, JSON.stringify(course, null, 2) + "\n");

  console.log(
    `Wrapped ${wrappedBlocks} playground blocks across ${touchedLessons} lessons:\n`,
  );
  for (const entry of log) {
    console.log(`  ${entry.id} — ${entry.title} (${entry.blocks})`);
  }
  console.log(`\nWrote ${COURSE_PATH}`);
}

main();
