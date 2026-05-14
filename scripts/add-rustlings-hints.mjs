/// Augment every Rustlings lesson with at least two progressive hints.
///
/// Pulls from two sources:
///   1. Upstream rustlings' `info.toml` — a single `hint = """…"""`
///      string per exercise, sometimes already pre-segmented with
///      "Hint 1:" / "Hint 2:" markers. We split on those markers and
///      on paragraph breaks so multi-paragraph hints become multiple
///      progressive steps.
///   2. The lesson's own body (lifted from the upstream README/comment
///      text). The first instructional sentence becomes "Hint 0" — a
///      gentle concept reminder before the upstream hint's more
///      concrete nudge.
///
/// Output structure: `hints[0]` is the lightest touch ("remember
/// what this lesson is teaching"), and subsequent hints escalate
/// toward concrete how-to. The LessonView reveals them one at a
/// time on successive Hint-button clicks, so the learner can stop
/// at whatever level of help they need.
///
/// Idempotent — running twice doesn't double up hints. If a lesson
/// already carries >=2 hints with the shape this script produces,
/// it's skipped.
///
/// Usage:
///   node scripts/add-rustlings-hints.mjs
///
/// Reads + writes:
///   ~/Library/Application Support/com.mattssoftware.libre/courses/rustlings/course.json
///
/// The upstream clone is expected at /tmp/rustlings — same path the
/// import-rustlings.mjs importer uses. Re-clone with:
///   git clone https://github.com/rust-lang/rustlings.git /tmp/rustlings

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const COURSE_PATH = join(
  homedir(),
  "Library/Application Support/com.mattssoftware.libre/courses/rustlings/course.json",
);
const UPSTREAM_INFO = "/tmp/rustlings/rustlings-macros/info.toml";

// ─── 1. Parse upstream info.toml ──────────────────────────────────
//
// We only need (name, hint) pairs. Hand-rolled rather than pulling in
// a TOML library because the shape is constrained: each exercise is a
// `[[exercises]]` block with `name = "..."` and `hint = """..."""`.
// The TOML triple-quoted string is the only multi-line value we
// care about; everything else is single-line scalar we ignore.

function parseUpstreamHints(tomlSrc) {
  const out = new Map(); // name -> hint string
  const lines = tomlSrc.split(/\r?\n/);
  let i = 0;
  let currentName = null;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "[[exercises]]") {
      currentName = null;
      i++;
      continue;
    }
    const nameMatch = /^name\s*=\s*"([^"]+)"/.exec(line);
    if (nameMatch) {
      currentName = nameMatch[1];
      i++;
      continue;
    }
    // hint = """ … """  — a triple-quoted block. The opening can be
    // on the same line as content, but in info.toml it's typically
    // its own line followed by body lines and a closing """.
    const hintMatch = /^hint\s*=\s*"""(.*)$/.exec(line);
    if (hintMatch && currentName) {
      const body = [];
      // Same-line content after the opening """ (rare in this
      // file, but handle it for robustness).
      if (hintMatch[1] !== "") {
        // Check if """ also closes on the same line.
        const sameLineClose = /^(.*?)"""\s*$/.exec(hintMatch[1]);
        if (sameLineClose) {
          out.set(currentName, sameLineClose[1]);
          i++;
          continue;
        }
        body.push(hintMatch[1]);
      }
      i++;
      while (i < lines.length) {
        const closeMatch = /^(.*?)"""\s*$/.exec(lines[i]);
        if (closeMatch) {
          if (closeMatch[1] !== "") body.push(closeMatch[1]);
          i++;
          break;
        }
        body.push(lines[i]);
        i++;
      }
      out.set(currentName, body.join("\n").trim());
      continue;
    }
    i++;
  }
  return out;
}

// ─── 2. Split a single upstream hint into progressive pieces ──────
//
// Two splitting strategies, in priority order:
//
//   (a) Explicit "Hint N:" markers — used in ~8 of the 94 lessons.
//       The upstream author already broke their hint into steps;
//       respect that structure.
//
//   (b) Paragraph break — split on blank lines. Many hints have a
//       conceptual lead-in followed by concrete guidance, separated
//       by an empty line. That maps cleanly to two progressive
//       hints.
//
// If neither applies, return the single hint as a one-element
// array — the caller pads with a concept-reminder hint pulled
// from the lesson body to guarantee the ≥2 minimum.

function splitHint(raw) {
  if (!raw) return [];
  const text = raw.trim();
  if (!text) return [];

  // (a) Explicit "Hint N:" markers. We allow a few naming variants
  // because info.toml drift uses "Hint 1:", "HINT 1:", or
  // occasionally "1." numbering in older files.
  const explicit = text.split(/\n\s*(?:Hint\s*\d+:|HINT\s*\d+:)\s*/);
  if (explicit.length > 1) {
    // The first element is the text BEFORE the first marker — keep
    // it as the conceptual lead-in if non-empty. Subsequent elements
    // become the marked Hint 1, Hint 2, etc.
    const cleaned = explicit
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length > 0);
    if (cleaned.length >= 2) return cleaned;
  }

  // (b) Paragraph break.
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 0);
  if (paragraphs.length >= 2) return paragraphs;

  // Single coherent block — return as-is, caller pads.
  return [text.replace(/\s+/g, " ").trim()];
}

// ─── 3. Derive a concept-reminder hint from the lesson body ───────
//
// Each rustlings lesson body looks like:
//
//   # Title
//
//   <one or more instructional paragraphs explaining the concept>
//
//   ## Further information
//   - [link](…)
//
//   ### exerciseName
//
//   The starter below has errors or TODO …
//
// We want the FIRST instructional paragraph after the title heading,
// which is the canonical concept statement. We strip markdown noise
// (links, code fences, bullet markers) and collapse to a single
// sentence-or-two summary.
//
// Returns null when the body is empty / unparseable; caller handles
// the fallback (a generic "look at the starter carefully" nudge).

// Paragraphs the body sometimes leads with that are NOT useful as a
// concept hint — credits, meta-commentary, "this chapter teaches X"
// signposts. We skip these and look for the next paragraph that
// actually states a concept. If none qualifies, deriveConceptHint
// returns null and the caller falls back to the chapter-keyed
// synthetic hint.
const META_PARAGRAPH_PATTERNS = [
  /^these exercises are adapted/i,
  /^this section will teach you/i,
  /^this section, we'll/i,
  /^in this section/i,
  /^welcome to/i,
  /^thank you/i,
  /^thanks to/i,
  /^for this section, the book/i,
];

function isMetaParagraph(text) {
  return META_PARAGRAPH_PATTERNS.some((re) => re.test(text));
}

function deriveConceptHint(body) {
  if (!body || typeof body !== "string") return null;
  const lines = body.split(/\r?\n/);
  let i = 0;
  // Skip the leading `# Title` heading line(s) and any blank lines
  // after it.
  while (i < lines.length && (lines[i].trim() === "" || lines[i].startsWith("#"))) {
    i++;
  }
  if (i >= lines.length) return null;
  // Walk paragraphs until we find one that isn't a meta-comment /
  // credit / signpost. Stop at any `##` heading — the body's
  // "Further information" section is downstream of the real
  // concept prose and we don't want to grab from there.
  while (i < lines.length) {
    // Collect the next non-empty paragraph.
    const buf = [];
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === "") {
        i++;
        if (buf.length > 0) break;
        continue;
      }
      if (line.startsWith("##")) return finalizeFrom(buf);
      buf.push(line.trim());
      i++;
    }
    if (buf.length === 0) return null;
    const candidate = cleanupParagraph(buf);
    if (!isMetaParagraph(candidate)) return finalize(candidate);
    // Else loop and try the next paragraph.
  }
  return null;
}

function finalizeFrom(buf) {
  if (buf.length === 0) return null;
  const text = cleanupParagraph(buf);
  if (isMetaParagraph(text)) return null;
  return finalize(text);
}

function cleanupParagraph(buf) {
  let text = buf.join(" ");
  // Strip markdown link syntax — keep anchor text only. Without
  // this, hints render with literal `[text](url)` brackets visible.
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Collapse whitespace.
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

function finalize(text) {
  // Trim to 220 chars so the hint is digestible on one glance. Cut
  // on the last sentence boundary within the cap so we don't leave
  // a dangling half-sentence.
  if (text.length > 220) {
    const cut = text.slice(0, 220);
    const lastStop = Math.max(
      cut.lastIndexOf(". "),
      cut.lastIndexOf("! "),
      cut.lastIndexOf("? "),
    );
    text = lastStop > 80 ? cut.slice(0, lastStop + 1) : cut + "…";
  }
  return text;
}

// ─── 4. Stitch the final hint array ───────────────────────────────
//
// Rules:
//   - Always at least 2 hints (the user's requirement).
//   - First hint is the conceptual reminder (from body, or a generic
//     fallback if the body doesn't yield a clean line).
//   - Second+ hints are the upstream rustlings hint, split into
//     progressive pieces where possible.
//   - If the upstream hint is missing entirely (some optional/skip-
//     check exercises), fall back to a topic-derived encouragement.
//
// `existing` is the lesson's current `hints` array. We use it ONLY to
// detect the "no hints this time ;)" placeholders the original
// importer emitted — those are dropped in favour of real hints.

const PLACEHOLDER_HINT_RE = /no hints this time|let the compiler guide you/i;

function buildHints({ lessonId, body, upstreamHint }) {
  const concept = deriveConceptHint(body);
  const upstreamParts = splitHint(upstreamHint);

  // Drop placeholder upstream hints — "No hints this time ;)" gives
  // the learner nothing actionable, and the importer historically
  // copied those through as-is.
  const realUpstream = upstreamParts.filter(
    (p) => !PLACEHOLDER_HINT_RE.test(p),
  );

  const hints = [];

  // Hint 0 — concept reminder. Phrasing intentionally softer than
  // the upstream hints to give the learner a "remember what this
  // lesson is about" beat before the more concrete steps.
  //
  // Three fallback tiers, in priority order:
  //   1. A body-derived concept paragraph (when present + not meta).
  //   2. The chapter-keyed synthetic — actual Rust-specific guidance
  //      tied to the topic, written by hand in this script.
  //   3. The generic "read the starter carefully" fallback.
  //
  // The tier-2 synthetic is a strict upgrade over tier-3 for every
  // chapter we have a template for (most of them), so we only fall
  // through to tier-3 for the rare chapter slug we didn't anticipate.
  if (concept) {
    hints.push(`Remember: ${concept}`);
  } else {
    const synthetic = syntheticSecondHint(lessonId);
    if (synthetic && synthetic !== "Read the test cases — they're the spec.") {
      // Tier 2: a real Rust-specific topic pointer.
      hints.push(synthetic);
    } else {
      // Tier 3: generic fallback.
      hints.push(
        "Read the starter carefully — Rust's compiler errors usually point straight at the line that needs fixing.",
      );
    }
  }

  // Hint 2+ — upstream rustlings guidance, split into steps where
  // possible. If upstream is empty / placeholder, synthesise a
  // second hint from the lesson id so we still hit the ≥2 floor.
  if (realUpstream.length > 0) {
    hints.push(...realUpstream);
  } else {
    hints.push(syntheticSecondHint(lessonId));
  }

  return hints;
}

// Synthetic fallback when upstream offers no usable hint. We key
// off the lesson id's prefix (chapter slug) so the encouragement
// is at least loosely on-topic. Better than a generic "you got
// this!" — points at the relevant chapter of the Rust Book.
function syntheticSecondHint(lessonId) {
  // Chapter slug — strip the trailing exercise index. Lesson ids
  // come in two flavours: hyphen-delimited (`move-semantics1`,
  // `primitive-types4`) and underscore-delimited (`smart_pointers3`).
  // The POINTER table below carries entries for both forms where
  // they're known to occur, but we also normalize on lookup so a
  // hyphen-form lookup can hit an underscore-form key as a fallback.
  const chapter = lessonId.replace(/\d+$/, "");
  const POINTER = {
    intro: "Just press Run — there's nothing to fix yet in this warm-up.",
    variables:
      "Recall the `let` keyword + `mut` for mutability. Check the Rust Book ch.3.1.",
    functions:
      "Mind the signature: parameter types, return type with `->`, and the final-expression-is-the-return-value convention.",
    if: "Rust's `if` is an EXPRESSION — every arm must produce the same type, and `if` can sit on the right-hand side of `let`.",
    "primitive-types":
      "Booleans, integers, floats, chars, tuples, arrays — refer to the Rust Book ch.3.2 for the full set.",
    "primitive_types":
      "Booleans, integers, floats, chars, tuples, arrays — refer to the Rust Book ch.3.2 for the full set.",
    vecs: "Vec<T> is a growable, heap-allocated array. `push`, `pop`, `iter`, `iter_mut`, indexing with `[]` are your friends.",
    move_semantics:
      "Ownership in Rust: each value has ONE owner; assigning / passing moves the value unless the type is `Copy` or you borrow with `&`.",
    structs:
      "Three flavours: classic named-field structs, tuple structs, unit structs. Methods live in `impl` blocks.",
    enums:
      "Enums let you encode a value that can be one of several variants. Pair with `match` to destructure.",
    strings:
      "Two string types: `String` (owned, growable) and `&str` (borrowed slice). They convert via `String::from` / `.as_str()` / `.to_string()`.",
    modules:
      "`mod` declares a module; `use` brings names into scope. `pub` makes items visible to the parent.",
    hashmaps:
      "`HashMap<K, V>` lives in `std::collections`. `insert`, `get`, `entry().or_insert(...)`, and `contains_key` cover most needs.",
    options:
      "`Option<T>` is `Some(T)` or `None`. `match`, `if let`, `?`, `.unwrap_or(...)`, `.map(...)` are the usual escape hatches.",
    error_handling:
      "`Result<T, E>` is `Ok(T)` or `Err(E)`. The `?` operator propagates errors; `From`-derived conversion makes mixing error types painless.",
    generics:
      "Generics let one definition serve many concrete types. Constrain with trait bounds (`T: Display`) when you need to call methods.",
    traits:
      "Traits define shared behaviour. `impl Trait for Type { ... }` adds the implementation; `dyn Trait` lets you store heterogeneous values.",
    lifetimes:
      "Lifetimes encode how long references stay valid. Most of the time you don't write them — when you must, name them like `'a` and tie inputs to outputs.",
    tests:
      "Tests in Rust live next to code with `#[test]`. `cargo test` runs them. `assert_eq!`, `assert!`, `should_panic` are the usual macros.",
    iterators:
      "Iterators are LAZY in Rust. Chain `.filter().map().collect()` and nothing runs until `collect` (or another consumer) forces it.",
    smart_pointers:
      "`Box<T>` heap-allocates; `Rc<T>` / `Arc<T>` share ownership; `RefCell<T>` / `Mutex<T>` give interior mutability.",
    threads:
      "`std::thread::spawn` launches a thread. `move` closures transfer ownership in. `Arc<Mutex<T>>` is the canonical share-state pattern.",
    macros:
      "`macro_rules!` defines a declarative macro. Match on token patterns; substitute with `$name` references in the expansion.",
    clippy:
      "Clippy lints catch idiom drift the compiler won't. Read the lint name in the error to find the issue.",
    conversions:
      "`From` / `Into` for infallible conversions; `TryFrom` / `TryInto` when conversion can fail. Implement `From` and `Into` comes for free.",
    quiz:
      "Mini-checkpoint exercise — apply what you learned in the preceding chapter. Re-read the failing test output for the spec.",
  };
  // Try the literal chapter slug first, then its hyphen↔underscore
  // sibling, then a final keyword-stripped form (so e.g. `error-
  // handling` would match an `error_handling` key if one existed).
  return (
    POINTER[chapter] ||
    POINTER[chapter.replace(/-/g, "_")] ||
    POINTER[chapter.replace(/_/g, "-")] ||
    "Read the test cases — they're the spec."
  );
}

// ─── 5. Drive the augmentation across the whole course ────────────

function main() {
  const tomlSrc = readFileSync(UPSTREAM_INFO, "utf8");
  const upstreamHints = parseUpstreamHints(tomlSrc);
  console.log(`Parsed ${upstreamHints.size} upstream hint entries`);

  const course = JSON.parse(readFileSync(COURSE_PATH, "utf8"));
  let totalLessons = 0;
  let augmented = 0;
  let skipped = 0;

  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      totalLessons++;
      // Idempotency: skip lessons whose hints clearly come from a
      // hand-crafted / upstream-of-importer source rather than from
      // a prior run of THIS script. We tag our hint 0 with a
      // leading "Remember: " prefix (or "Read the starter carefully"
      // fallback) — both forms are recognisable signatures, and
      // re-running over them is safe + desired during iteration.
      // Lessons whose hint 0 looks different (a real human author
      // wrote it) are preserved as-is.
      const existing = Array.isArray(lesson.hints) ? lesson.hints : [];
      const realExisting = existing.filter(
        (h) => typeof h === "string" && !PLACEHOLDER_HINT_RE.test(h),
      );
      const isScriptOutput =
        existing.length > 0 &&
        typeof existing[0] === "string" &&
        (existing[0].startsWith("Remember:") ||
          existing[0].startsWith("Read the starter carefully"));
      if (realExisting.length >= 2 && !isScriptOutput) {
        skipped++;
        continue;
      }

      // Map our lesson id back to upstream rustlings' exercise name.
      // The importer slugifies hyphen-style; upstream uses
      // underscore for some (`smart_pointers3`, `move_semantics1`).
      // Try both forms.
      const id = lesson.id;
      const underscored = id.replace(/-/g, "_");
      const upstreamHint =
        upstreamHints.get(id) || upstreamHints.get(underscored) || "";

      const hints = buildHints({
        lessonId: id,
        body: lesson.body,
        upstreamHint,
      });

      if (hints.length < 2) {
        // Shouldn't happen given the synthetic fallback, but log
        // loudly if it ever does.
        console.warn(`⚠ ${id}: only ${hints.length} hint(s) produced`);
      }

      lesson.hints = hints;
      augmented++;
    }
  }

  writeFileSync(COURSE_PATH, JSON.stringify(course, null, 2) + "\n");
  console.log(
    `Augmented ${augmented}/${totalLessons} lessons (${skipped} already had ≥2 hints; skipped)`,
  );
  console.log(`Wrote ${COURSE_PATH}`);
}

main();
