#!/usr/bin/env node
/// LLM-assisted blocks-mode authoring. Walks every staged starter
/// course and, for each `exercise` / `mixed` lesson with a non-trivial
/// solution, asks Claude to identify 3–7 pedagogically-meaningful
/// holes in the solution + author plausible decoys. The result is a
/// `BlocksData` payload attached to the lesson under the `blocks`
/// field (no sibling lesson — blocks mode is a render mode of the
/// existing exercise).
///
/// Output shape matches `BlocksData` in `src/data/types.ts`:
///   { template, slots: [{ id, expectedBlockId, hint }], pool: [{ id, code, decoy? }], prompt? }
///
/// Validation runs locally before write:
///   1. Every slot id in `template` matches an entry in `slots`.
///   2. Every `expectedBlockId` exists in `pool`.
///   3. Synthesising the canonical placements yields a string that
///      equals the lesson's `solution` modulo trailing whitespace.
///      (If the round-trip fails the LLM's template diverged from
///      the canonical solution and we drop the result.)
///
/// REQUIRES: env var `ANTHROPIC_API_KEY`.
///
/// Usage:
///   node scripts/generate-blocks.mjs                          # all courses
///   node scripts/generate-blocks.mjs --course <id>            # one course
///   node scripts/generate-blocks.mjs --course <id> --limit 5  # one course, first 5 lessons
///   node scripts/generate-blocks.mjs --course <id> --install  # also patch the user's installed course.json
///   node scripts/generate-blocks.mjs --dry                    # plan only, no API calls, no writes
///
/// Caching: responses are stored in `.cache/blocks/<hash>.json`
/// (gitignored) so re-runs are free for unchanged content. The
/// hash is over (course id, lesson id, model, solution) — a lesson
/// whose solution changes invalidates its cache automatically.

import { mkdir, readFile, writeFile, readdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STAGED = join(ROOT, "public", "starter-courses");
const CACHE = join(ROOT, ".cache", "blocks");
const INSTALLED_DIR = join(
  homedir(),
  "Library/Application Support/com.mattssoftware.kata/courses",
);

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_LESSONS_PER_COURSE_DEFAULT = 999;
/// Skip authoring for solutions that are too short — fewer than 3
/// non-trivial lines makes for either a degenerate single-slot
/// puzzle (boring) or "every token is a slot" (no learning signal).
const MIN_SOLUTION_LINES = 3;
/// Solutions over this many lines blow up the prompt + the resulting
/// puzzle is unreadable on phone. We skip rather than truncate so
/// the lesson stays runnable in editor mode without a half-finished
/// blocks payload that won't synthesise back to the full solution.
const MAX_SOLUTION_LINES = 80;

const args = parseArgs(process.argv.slice(2));

async function main() {
  if (!args.dry && !process.env.ANTHROPIC_API_KEY) {
    console.error(
      "[generate-blocks] ANTHROPIC_API_KEY is unset. Export it before running, or pass --dry to plan only.",
    );
    process.exit(1);
  }
  if (!existsSync(STAGED)) {
    console.error(
      `[generate-blocks] expected ${STAGED} — run \`node scripts/extract-starter-courses.mjs\` first.`,
    );
    process.exit(1);
  }
  await mkdir(CACHE, { recursive: true });

  const files = (await readdir(STAGED)).filter(
    (f) => f.endsWith(".json") && f !== "manifest.json",
  );
  const targetFiles = args.course
    ? files.filter((f) => f === `${args.course}.json`)
    : files;
  if (args.course && targetFiles.length === 0) {
    console.error(
      `[generate-blocks] no staged course matches --course=${args.course}`,
    );
    process.exit(1);
  }

  let totalLessons = 0;
  let totalAuthored = 0;
  let totalCacheHits = 0;
  let totalApiCalls = 0;
  let totalSkipped = 0;

  for (const f of targetFiles) {
    const path = join(STAGED, f);
    const text = await readFile(path, "utf-8");
    const course = JSON.parse(text);
    if (!course.chapters) continue;

    console.log(`\n[generate-blocks] === ${course.id} ===`);
    let authored = 0;
    let lessonsProcessed = 0;
    const limit = args.limit ?? MAX_LESSONS_PER_COURSE_DEFAULT;

    for (const chapter of course.chapters) {
      for (const lesson of chapter.lessons) {
        if (lessonsProcessed >= limit) continue;
        if (lesson.kind !== "exercise" && lesson.kind !== "mixed") continue;
        if (!lesson.solution || lesson.solution.trim().length === 0) continue;
        const lines = lesson.solution.split(/\r?\n/);
        if (lines.length < MIN_SOLUTION_LINES) continue;
        if (lines.length > MAX_SOLUTION_LINES) {
          totalSkipped += 1;
          console.log(
            `  · ${lesson.id.padEnd(40)}  ⊘ solution too long (${lines.length} lines)`,
          );
          continue;
        }
        // Idempotent re-run guard: if the lesson already has blocks
        // data with the SAME solution hash, skip — we only re-author
        // when the solution changes. The cache layer already covers
        // this for cache-hit lessons, but this guard avoids API calls
        // for lessons whose blocks were authored under a previous
        // generator version (no cache file).
        const solHash = createHash("sha1").update(lesson.solution).digest("hex").slice(0, 12);
        if (lesson.blocks?._sha === solHash) {
          totalCacheHits += 1;
          console.log(
            `  · ${lesson.id.padEnd(40)}  ↩ in-place (sha match)`,
          );
          continue;
        }

        lessonsProcessed += 1;
        const language = lesson.language || course.language;

        const cacheKey = createHash("sha1")
          .update(`${course.id}|${lesson.id}|${MODEL}|${lesson.solution}`)
          .digest("hex")
          .slice(0, 16);
        const cachePath = join(CACHE, `${cacheKey}.json`);
        let payload;
        if (existsSync(cachePath)) {
          payload = JSON.parse(await readFile(cachePath, "utf-8"));
          totalCacheHits += 1;
          console.log(
            `  · ${lesson.id.padEnd(40)}  ↩ cache  (${payload.slots.length} slots)`,
          );
        } else {
          if (args.dry) {
            console.log(`  · ${lesson.id.padEnd(40)}  [dry-run, would call API]`);
            continue;
          }
          try {
            const raw = await authorBlocks({
              courseTitle: course.title,
              lessonTitle: lesson.title,
              language,
              body: lesson.body || "",
              starter: lesson.starter || "",
              solution: lesson.solution,
            });
            payload = postProcess(raw, lesson.solution);
            if (!payload) {
              throw new Error("post-process rejected the model's output (round-trip failed)");
            }
            await writeFile(cachePath, JSON.stringify(payload, null, 2), "utf-8");
            totalApiCalls += 1;
            console.log(
              `  ✓ ${lesson.id.padEnd(40)}  ↤ Claude  (${payload.slots.length} slots, ${payload.pool.length} blocks)`,
            );
          } catch (e) {
            console.warn(
              `  ✗ ${lesson.id.padEnd(40)}  failed: ${(e.message ?? String(e)).slice(0, 120)}`,
            );
            continue;
          }
        }
        // Stamp solution hash so subsequent runs are idempotent
        // without consulting the cache file.
        payload._sha = solHash;
        lesson.blocks = payload;
        authored += 1;
        totalAuthored += 1;
      }
    }

    if (authored > 0 && !args.dry) {
      await writeFile(path, JSON.stringify(course, null, 2), "utf-8");
      console.log(
        `[generate-blocks] ${course.id}: authored ${authored} lesson(s), ${lessonsProcessed} processed`,
      );
      // Optional: also mirror to the user's installed copy so they
      // don't have to re-bundle + reinstall to test. Useful while
      // iterating on prompt quality.
      if (args.install) {
        const installedPath = join(INSTALLED_DIR, course.id, "course.json");
        if (existsSync(installedPath)) {
          await copyFile(path, installedPath);
          console.log(`             → mirrored to ${installedPath}`);
        } else {
          console.log(`             (no installed copy at ${installedPath} — skipping mirror)`);
        }
      }
    } else if (lessonsProcessed === 0) {
      console.log(`[generate-blocks] ${course.id}: no eligible exercises`);
    }
    totalLessons += lessonsProcessed;
  }

  console.log("");
  console.log(
    `[generate-blocks] processed ${totalLessons} lesson(s), authored ${totalAuthored}` +
      ` — ${totalApiCalls} API call(s), ${totalCacheHits} cache hit(s), ${totalSkipped} skipped`,
  );
}

// ── Anthropic round-trip ───────────────────────────────────────────

const SYSTEM_PROMPT = `You design "building blocks" code puzzles for a learning app.

For a given exercise, output STRICT JSON describing:
  - a TEMPLATE — the canonical solution with key tokens replaced by [[SLOT name]] markers
  - a list of SLOTS — one entry per [[SLOT name]] marker, each with the canonical answer + 2-3 plausible decoys

The student fills each slot from a pool of code blocks. When every slot is filled correctly the assembled source compiles + tests pass; that's how lessons are graded.

Pedagogical rules:
- Punch out 3–7 slots. Fewer = trivial, more = overwhelming.
- Each slot tests ONE meaningful concept the lesson is teaching: a function name, a key keyword, a magic constant, a return expression, a loop body. Skip braces, semicolons, whitespace — those are scaffolding the learner shouldn't have to assemble.
- Slots should be SMALL (single tokens or short expressions, ideally one to four words of code). Multi-statement slots make the puzzle a slog. If the solution has a complex multi-line block, blank ONE token from inside it, not the whole block.
- Decoys should look plausible but be wrong — sibling-lesson identifiers, similar-looking keywords, common mistakes, off-by-one constants. NOT synonyms that compile to the same answer.
- Each slot's name should be a short identifier-shaped string ("init", "body", "ratio_num"). Used as both the [[SLOT name]] marker AND a stable id.

Format rules (strict):
- The TEMPLATE must equal the canonical solution character-for-character EXCEPT where you put [[SLOT <name>]] markers replacing exactly the answer text. Whitespace and comments unchanged. The marker form is "[[SLOT " + name + "]]" — square brackets, the literal word SLOT, the slot name, closing brackets.
- Output is a SINGLE JSON object with shape:
  {
    "template": "<the solution with [[SLOT name]] markers>",
    "slots": [
      { "name": "<id>", "answer": "<correct token text>", "hint": "<one-word category>", "decoys": ["<wrong>", "<wrong>", ...] }
    ],
    "prompt": "<one-sentence learner-facing intro, optional>"
  }
- "answer" must equal the substring you replaced with the marker (whitespace included).
- 2–3 decoys per slot. No duplicates. Decoys must NOT equal the answer or any other slot's answer.
- Output STRICT JSON ONLY — no markdown fences, no preamble, no trailing commentary.`;

function buildPrompt({ courseTitle, lessonTitle, language, body, starter, solution }) {
  const trimmedBody = body.length > 4000 ? body.slice(0, 4000) + "…" : body;
  return `COURSE: ${courseTitle}
LESSON: ${lessonTitle}
LANGUAGE: ${language}

LESSON BODY:
${trimmedBody}

STARTER:
\`\`\`${language}
${starter || "(none)"}
\`\`\`

CANONICAL SOLUTION:
\`\`\`${language}
${solution}
\`\`\`

Output the JSON object now.`;
}

async function authorBlocks(input) {
  const userPrompt = buildPrompt(input);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("no text in response");
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch (e) {
    throw new Error(
      `bad JSON from model: ${e.message}; got: ${stripped.slice(0, 200)}`,
    );
  }
  return parsed;
}

// ── Post-processing + validation ───────────────────────────────────

/// Convert the model's `{ template, slots }` shape into our canonical
/// `BlocksData` shape and validate. Returns null on any rejection
/// reason (logged by the caller as a skip).
function postProcess(raw, canonicalSolution) {
  if (!raw || typeof raw.template !== "string" || !Array.isArray(raw.slots)) {
    return null;
  }
  // Map [[SLOT name]] markers to our __SLOT_<id>__ form. The model's
  // `name` becomes our slot id verbatim — same identifier-shape
  // constraints already enforced by the system prompt.
  const slotsByName = new Map();
  for (const s of raw.slots) {
    if (!s || typeof s.name !== "string" || typeof s.answer !== "string") {
      return null;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(s.name)) return null;
    slotsByName.set(s.name, s);
  }
  // Replace markers in the template, AND check that each slot named
  // in the model's slots[] actually appears in the template.
  let template = raw.template;
  const markerRe = /\[\[SLOT\s+([A-Za-z0-9_-]+)\]\]/g;
  const seenInTemplate = new Set();
  let m;
  while ((m = markerRe.exec(raw.template)) !== null) {
    seenInTemplate.add(m[1]);
  }
  for (const name of seenInTemplate) {
    if (!slotsByName.has(name)) {
      // Marker without a matching slot definition — bail.
      return null;
    }
  }
  for (const name of slotsByName.keys()) {
    if (!seenInTemplate.has(name)) {
      // Slot defined but never used in the template — bail.
      return null;
    }
  }
  template = template.replace(markerRe, (_match, name) => `__SLOT_${name}__`);

  // Build the pool. Each correct answer becomes a block keyed by
  // `slot_<name>`; decoys become blocks keyed by `decoy_<name>_<i>`.
  // Stable ids derived from the slot name keep the cache reproducible.
  const pool = [];
  const slots = [];
  for (const [name, s] of slotsByName) {
    const correctId = `slot_${name}`;
    pool.push({ id: correctId, code: s.answer });
    if (Array.isArray(s.decoys)) {
      const seen = new Set([s.answer]);
      let di = 0;
      for (const d of s.decoys) {
        if (typeof d !== "string") continue;
        if (seen.has(d)) continue;
        seen.add(d);
        pool.push({ id: `decoy_${name}_${di++}`, code: d, decoy: true });
        if (di >= 4) break;
      }
    }
    slots.push({
      id: name,
      expectedBlockId: correctId,
      hint: typeof s.hint === "string" ? s.hint : undefined,
    });
  }

  // Round-trip check: assemble the template with the canonical
  // placements (slot.id → slot.expectedBlockId) and confirm it
  // matches the original solution. Tolerate trailing whitespace
  // differences — the model occasionally trims or adds a single
  // newline at EOF, which doesn't affect compile correctness.
  const placements = Object.fromEntries(
    slots.map((s) => [s.id, s.expectedBlockId]),
  );
  const blockById = new Map(pool.map((b) => [b.id, b]));
  const assembled = template.replace(
    /__SLOT_([A-Za-z0-9_-]+)__/g,
    (_match, slotId) => {
      const blockId = placements[slotId];
      const block = blockById.get(blockId);
      return block ? block.code : "";
    },
  );
  if (assembled.trimEnd() !== canonicalSolution.trimEnd()) {
    return null;
  }

  return {
    template,
    slots,
    pool,
    prompt:
      typeof raw.prompt === "string" && raw.prompt.length < 200
        ? raw.prompt
        : undefined,
  };
}

function parseArgs(argv) {
  const out = { dry: false, install: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry") out.dry = true;
    else if (a === "--install") out.install = true;
    else if (a === "--course") out.course = argv[++i];
    else if (a === "--limit") out.limit = parseInt(argv[++i], 10);
  }
  return out;
}

main().catch((err) => {
  console.error("[generate-blocks] failed:", err);
  process.exit(1);
});
