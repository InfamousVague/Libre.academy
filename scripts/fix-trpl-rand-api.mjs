/// Migrate the "Programming a Guessing Game" + "Packages, Crates, and
/// Modules" chapters in `the-rust-programming-language` course from
/// the `rand` 0.8 API surface to the 0.9+ surface.
///
/// What changed upstream
/// ─────────────────────
/// `rand` 0.9 (Jan 2025) deprecated `rand::thread_rng()` + the `Rng`
/// trait's `gen_range` method, and introduced `rand::random_range`
/// as a thread-local free function. The Rust playground ships a
/// recent enough toolchain that calls to the old API fail with:
///
///   error[E0425]: cannot find function `thread_rng` in crate `rand`
///
/// Our lesson bodies + a couple of starters still teach the 0.8
/// surface ("import the `Rng` trait, call `rand::thread_rng()`"),
/// which is what triggered the bug report.
///
/// What this script changes
/// ────────────────────────
/// Mechanical text replacements, applied to every lesson's body /
/// starter / solution / tests where the old API appears:
///
///   - Cargo.toml version pin:   rand = "0.8.5"  →  rand = "0.9"
///   - Trait import line:        use rand::Rng;  →  (removed)
///   - Call form:                rand::thread_rng().gen_range(R)
///                                                 →  rand::random_range(R)
///
/// The prose pass also tweaks a few sentences that reference the
/// trait-import requirement — in 0.9 you don't import `Rng` to call
/// `random_range`, so the explanations have to come down too. We
/// keep the conceptual point ("a trait defines methods that types
/// can implement") because that's still true and pedagogically
/// useful in the context of the surrounding chapter; we just drop
/// the "without `use rand::Rng;`, this won't compile" framing.
///
/// Idempotency: re-running is safe. The replacements only fire
/// when the old token is present; once migrated, the script makes
/// no further changes.
///
/// Usage:
///   node scripts/fix-trpl-rand-api.mjs
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

// ─── Mechanical substitutions ────────────────────────────────────
//
// Each entry is `[regex, replacement, label]`. Applied in order so
// later rules can chain off earlier ones (e.g. dropping the trait
// import doesn't leave a dangling blank `use` block because the
// dependency-removal rule runs first).

const CODE_RULES = [
  // Cargo.toml pin — match common forms. We rewrite to a generic
  // "0.9" pin rather than locking to 0.9.x; the lesson copy is
  // illustrative and the playground resolves it transitively.
  [/rand = "0\.8\.\d+"/g, 'rand = "0.9"', "Cargo.toml pin 0.8.x"],
  [/rand = "0\.8"/g, 'rand = "0.9"', "Cargo.toml pin 0.8"],
  // Trait import — drop both the bare `use` line and a following
  // blank line so the import block stays tidy.
  [/^use rand::Rng;\s*\n/gm, "", "drop `use rand::Rng;`"],
  // Free-function form — preserves whatever range expression sat
  // inside the parens.
  [
    /rand::thread_rng\(\)\.gen_range\(([^)]+)\)/g,
    "rand::random_range($1)",
    "thread_rng().gen_range → random_range",
  ],
  // Method-on-rng form — sometimes the rng is bound first. Less
  // common in this course but cheap to cover.
  [
    /let mut rng = rand::thread_rng\(\);/g,
    "// rand 0.9: thread-local RNG is implicit in `random_range`",
    "drop `let mut rng = rand::thread_rng();`",
  ],
];

// ─── Prose tweaks ────────────────────────────────────────────────
//
// Higher-level: small sentence rewrites for lessons where the old
// API's reasoning was baked into the surrounding prose. Each rule
// targets one or two sentences with enough context to avoid
// collateral damage in unrelated lessons.

const PROSE_RULES = [
  // "we need the `Rng` trait in scope" preamble — the trait isn't
  // needed for `random_range`, so the paragraph that follows is
  // dropped along with its leading sentence.
  [
    /To generate random numbers, we need the `Rng` trait in scope:\n+```rust\n+```\n+/g,
    "",
    "drop standalone `use rand::Rng;` setup paragraph",
  ],
  [
    /To generate random numbers, we need the `Rng` trait in scope:\s*\n/g,
    "To generate random numbers, call `rand::random_range` directly — no trait import needed in `rand` 0.9+.\n",
    "rewrite `Rng trait in scope` preamble",
  ],
  // Imperative step in the exercise task list — swap step 3 for the
  // new API call. Match the trailing "(inclusive)" hint so we don't
  // catch a different step.
  [
    /Import the `Rng` trait with `use rand::Rng;`\s*\n/g,
    "",
    "drop `Import Rng trait` task list item",
  ],
  [
    /Generate a random number between 1 and 100 \(inclusive\) using `rand::thread_rng\(\)\.gen_range\(1\.\.=100\)`/g,
    "Generate a random number between 1 and 100 (inclusive) using `rand::random_range(1..=100)`",
    "rewrite task list call form",
  ],
  // The "call thread_rng()" intro sentence — shows up in the
  // primary reading.
  [
    /Now call `rand::thread_rng\(\)` to get a random number generator seeded by the OS, then call `gen_range` on it:/g,
    "Call `rand::random_range` to get a random number from a thread-local generator (it's a free function, so no trait import is needed):",
    "rewrite `Now call thread_rng()` intro",
  ],
  // GitHub-style callout — the NOTE block about needing `use rand::
  // Rng;` for `gen_range` to resolve. We replace the body with a
  // historically-accurate "in older versions" framing so the
  // surrounding paragraph still flows.
  [
    /> \[!NOTE\]\n> A \*\*trait\*\* defines methods that types can implement\. `Rng` defines `gen_range` and other random-generation methods\. Without `use rand::Rng;`, the compiler won't find `gen_range` even though the crate is present\./g,
    "> [!NOTE]\n> The `rand::random_range` free function uses a thread-local generator seeded from the OS, so you don't have to set one up yourself. Older guides may call `rand::thread_rng().gen_range(...)` after importing the `Rng` trait — that form was removed in `rand` 0.9.",
    "rewrite NOTE callout to match 0.9 API",
  ],
  // The "Import the `Rng` trait" task-list item in `generate-
  // secret-number` was already covered above, but the standalone
  // prose hint "You must bring it into scope with `use` before
  // calling `gen_range`" needs to go.
  [
    /> \[!NOTE\]\n> The `Rng` trait defines methods that random number generators implement\. You must bring it into scope with `use` before calling `gen_range`\.\n/g,
    "> [!NOTE]\n> `rand::random_range` is a free function backed by a thread-local RNG — no trait import needed in `rand` 0.9+. Older guides reach for the `Rng` trait + `rand::thread_rng().gen_range(...)`; both forms were removed in 0.9.\n",
    "rewrite generate-secret-number NOTE",
  ],
];

// ─── Lessons we expect to touch ──────────────────────────────────
//
// Used for the post-run report only — the rules above don't gate
// on lesson id, they just look for the old tokens wherever they
// appear. Listing the expected ids lets us flag anything new that
// surfaces unexpectedly.

const EXPECTED_TOUCHED = new Set([
  "understanding-cargo-toml",
  "adding-external-crates",
  "generating-random-numbers",
  "generate-secret-number",
  "comparing-with-match",
  "implement-comparison",
  "looping-for-multiple-guesses",
  "complete-guessing-game",
  "external-packages-nested-paths",
]);

// ─── Driver ──────────────────────────────────────────────────────

function applyRules(text, rules) {
  if (typeof text !== "string" || text.length === 0) return { text, fired: [] };
  let out = text;
  const fired = [];
  for (const [re, replacement, label] of rules) {
    const before = out;
    out = out.replace(re, replacement);
    if (out !== before) fired.push(label);
  }
  return { text: out, fired };
}

function main() {
  const course = JSON.parse(readFileSync(COURSE_PATH, "utf8"));
  let touchedLessons = 0;
  const log = [];

  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      const fields = ["body", "starter", "solution", "tests"];
      const ruleSets = {
        body: [...CODE_RULES, ...PROSE_RULES],
        starter: CODE_RULES,
        solution: CODE_RULES,
        tests: CODE_RULES,
      };
      let lessonFired = [];
      for (const field of fields) {
        const cur = lesson[field];
        if (typeof cur !== "string") continue;
        const { text, fired } = applyRules(cur, ruleSets[field]);
        if (fired.length > 0) {
          lesson[field] = text;
          lessonFired.push(`${field}: ${fired.join(" / ")}`);
        }
      }
      if (lessonFired.length > 0) {
        touchedLessons++;
        log.push({ id: lesson.id, title: lesson.title, fired: lessonFired });
      }
    }
  }

  writeFileSync(COURSE_PATH, JSON.stringify(course, null, 2) + "\n");

  // Report.
  console.log(`Touched ${touchedLessons} lessons:\n`);
  for (const entry of log) {
    const tag = EXPECTED_TOUCHED.has(entry.id) ? " " : "⚠";
    console.log(`${tag} ${entry.id} — ${entry.title}`);
    for (const f of entry.fired) console.log(`    ${f}`);
  }
  // Flag any lesson we expected to touch but didn't.
  const touchedIds = new Set(log.map((e) => e.id));
  const missed = [...EXPECTED_TOUCHED].filter((id) => !touchedIds.has(id));
  if (missed.length > 0) {
    console.log(
      `\n⚠ Expected to touch but didn't: ${missed.join(", ")} — manual check needed`,
    );
  }
  console.log(`\nWrote ${COURSE_PATH}`);
}

main();
