#!/usr/bin/env node
/// One-shot dev-only script to inject hand-authored sample
/// micro-puzzles into the staged starter-courses JSON. Used to
/// validate the MobileMicroPuzzle renderer end-to-end without
/// waiting on the LLM authoring pipeline. Once the LLM script is
/// in place this becomes obsolete — but keeping it around is
/// useful for one-off lesson tweaks.
///
/// Run AFTER `node scripts/extract-starter-courses.mjs` (which
/// stages the JSON files); before the academy's `sync:courses`
/// or the next iOS build.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STAGED = join(ROOT, "public", "starter-courses");

/// Hand-authored sample micro-puzzles. Two per course pilot — just
/// enough to validate that the renderer works, language highlighting
/// shows up, and the dispatch routes correctly. The LLM authoring
/// pass will produce many more (target: 6-12 per exercise lesson).
const SAMPLES = [
  {
    courseId: "cryptography-fundamentals",
    insertAfterChapterIdx: 0, // "Foundations" or wherever ch[0] is
    insertAfterLessonIdx: 0,
    lesson: {
      id: "sample-mp-c1l1",
      kind: "micropuzzle",
      language: "javascript",
      title: "Hashing primitives — drill",
      body:
        "Quick fill-in drills for the hash-API surface you just learned. Tap each blank to pick the right token.",
      prompt: "Tap each blank to fill it in.",
      challenges: [
        {
          id: "mp-c1l1-1",
          line: "const buf = new TextEncoder().__SLOT_op__(\"hello\");",
          hint: "TextEncoder method to convert a string to a Uint8Array",
          explanation:
            "encode() returns a Uint8Array — exactly what crypto.subtle expects.",
          blanks: [
            {
              id: "op",
              answer: "encode",
              options: ["encode", "decode", "compress", "stringify"],
              hint: "method",
            },
          ],
        },
        {
          id: "mp-c1l1-2",
          line: "const digest = await crypto.subtle.digest(\"__SLOT_alg__\", buf);",
          hint: "Identifier for SHA-256 in the Web Crypto API",
          explanation:
            "Web Crypto identifies SHA-256 by the literal string \"SHA-256\" (with the dash).",
          blanks: [
            {
              id: "alg",
              answer: "SHA-256",
              options: ["SHA-256", "SHA256", "sha-256", "sha2-256"],
              hint: "algorithm",
            },
          ],
        },
        {
          id: "mp-c1l1-3",
          line: "const bytes = new __SLOT_view__(digest);",
          hint: "Typed-array view to read the digest as bytes",
          explanation:
            "ArrayBuffer is opaque — wrap it in a Uint8Array to get per-byte access.",
          blanks: [
            {
              id: "view",
              answer: "Uint8Array",
              options: ["Uint8Array", "DataView", "Int8Array", "ByteArray"],
              hint: "view type",
            },
          ],
        },
      ],
    },
  },
  {
    courseId: "the-rust-programming-language",
    insertAfterChapterIdx: 0,
    insertAfterLessonIdx: 0,
    lesson: {
      id: "sample-mp-rs1",
      kind: "micropuzzle",
      language: "rust",
      title: "Ownership essentials — drill",
      body: "Three tiny drills covering the most common Rust ownership patterns.",
      prompt: "Tap each blank to fill in the missing keyword.",
      challenges: [
        {
          id: "mp-rs1-1",
          line: "__SLOT_kw__ s = String::from(\"hi\");",
          hint: "Keyword that introduces a binding you can REASSIGN",
          explanation:
            "`let mut` makes the binding mutable; plain `let` is immutable.",
          blanks: [
            {
              id: "kw",
              answer: "let mut",
              options: ["let mut", "let", "const", "var"],
              hint: "binding",
            },
          ],
        },
        {
          id: "mp-rs1-2",
          line: "fn greet(name: __SLOT_ty__) { println!(\"hi {name}\"); }",
          hint: "Type that BORROWS without taking ownership of the string",
          explanation:
            "`&str` is a borrowed string slice — the caller keeps the original.",
          blanks: [
            {
              id: "ty",
              answer: "&str",
              options: ["&str", "String", "str", "&String"],
              hint: "type",
            },
          ],
        },
        {
          id: "mp-rs1-3",
          line: "let v = vec![1, 2, 3]; for x in __SLOT_iter__ { print!(\"{x}\"); }",
          hint:
            "Iterate by reference so `v` is still usable after the loop",
          explanation:
            "`&v` borrows; `v` (without &) MOVES and v can no longer be used afterward.",
          blanks: [
            {
              id: "iter",
              answer: "&v",
              options: ["&v", "v", "v.iter()", "v.into_iter()"],
              hint: "expression",
            },
          ],
        },
      ],
    },
  },
];

/// Stable id derived from course + lesson content so re-runs of
/// this script don't clone duplicates with different ids.
function stableId(prefix, course, lesson) {
  const hash = createHash("sha1")
    .update(`${course}|${lesson.id}|${JSON.stringify(lesson.challenges)}`)
    .digest("hex")
    .slice(0, 8);
  return `${prefix}__${hash}`;
}

async function main() {
  if (!existsSync(STAGED)) {
    console.error(
      `[inject-sample-micropuzzles] expected ${STAGED} — run \`node scripts/extract-starter-courses.mjs\` first.`,
    );
    process.exit(1);
  }

  let inserted = 0;
  for (const sample of SAMPLES) {
    const path = join(STAGED, `${sample.courseId}.json`);
    if (!existsSync(path)) {
      console.warn(
        `[inject-sample-micropuzzles] skipping ${sample.courseId} — not staged`,
      );
      continue;
    }
    const text = await readFile(path, "utf-8");
    const course = JSON.parse(text);
    if (!course.chapters?.[sample.insertAfterChapterIdx]) {
      console.warn(
        `[inject-sample-micropuzzles] ${sample.courseId}: no chapter @${sample.insertAfterChapterIdx}`,
      );
      continue;
    }
    const chapter = course.chapters[sample.insertAfterChapterIdx];
    const lesson = {
      ...sample.lesson,
      id: stableId("micropuzzle", sample.courseId, sample.lesson),
    };
    // Idempotent — skip if a lesson with this stable id already
    // exists in the chapter (would mean we already injected it).
    if (chapter.lessons.some((l) => l.id === lesson.id)) {
      console.log(
        `[inject-sample-micropuzzles] ${sample.courseId}: already injected (${lesson.id}), skipping`,
      );
      continue;
    }
    const at = Math.min(
      sample.insertAfterLessonIdx + 1,
      chapter.lessons.length,
    );
    chapter.lessons.splice(at, 0, lesson);
    await writeFile(path, JSON.stringify(course, null, 2), "utf-8");
    inserted += 1;
    console.log(
      `[inject-sample-micropuzzles] ${sample.courseId}: inserted "${lesson.title}" @ ch${sample.insertAfterChapterIdx}/l${at}`,
    );
  }

  console.log(`[inject-sample-micropuzzles] done — ${inserted} lesson(s) inserted`);
}

main().catch((err) => {
  console.error("[inject-sample-micropuzzles] failed:", err);
  process.exit(1);
});
