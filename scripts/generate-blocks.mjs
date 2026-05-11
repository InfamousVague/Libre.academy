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
/// Sidecar directory for rejected model outputs — anything that
/// failed validation (round-trip mismatch, missing slot, etc.).
/// Inspect to tune the prompt or relax the validator.
const REJECTED = join(ROOT, ".cache", "blocks", "_rejected");
const INSTALLED_DIR = join(
  homedir(),
  "Library/Application Support/com.mattssoftware.libre/courses",
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
/// Bounded concurrency for the API authoring pass. Anthropic's tier-1
/// rate limit is generous (~50 rpm) so 4-6 in flight is a safe sweet
/// spot — slow enough not to trip 429s, fast enough that a 1700-lesson
/// run finishes in 20-40 min instead of 1.5+ hours sequentially.
/// Override via `--concurrency=N` if your tier allows more.
const DEFAULT_CONCURRENCY = 4;

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
  await mkdir(REJECTED, { recursive: true });

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

  // ── Phase 1: collect work items ────────────────────────────────
  // Walk every staged course once and build a flat list of "this
  // lesson needs blocks data" entries. We hold lesson references
  // (not copies) so workers below mutate `lesson.blocks` in place
  // and a single per-course write at the end persists every change.
  const courses = []; // [{ filePath, course, dirty }]
  const work = []; // [{ courseIdx, lesson, language, solHash, cacheKey, cachePath }]
  let totalSkipped = 0;
  let inPlaceHits = 0;

  for (const f of targetFiles) {
    const filePath = join(STAGED, f);
    const text = await readFile(filePath, "utf-8");
    const course = JSON.parse(text);
    if (!course.chapters) continue;
    const courseIdx = courses.length;
    courses.push({ filePath, course, dirty: false });
    let collectedThisCourse = 0;
    const limit = args.limit ?? MAX_LESSONS_PER_COURSE_DEFAULT;
    for (const chapter of course.chapters) {
      for (const lesson of chapter.lessons) {
        if (collectedThisCourse >= limit) continue;
        if (lesson.kind !== "exercise" && lesson.kind !== "mixed") continue;
        if (!lesson.solution || lesson.solution.trim().length === 0) continue;
        const lines = lesson.solution.split(/\r?\n/);
        if (lines.length < MIN_SOLUTION_LINES) continue;
        if (lines.length > MAX_SOLUTION_LINES) {
          totalSkipped += 1;
          continue;
        }
        // Idempotent re-run guard: if the lesson already has blocks
        // data with the SAME solution hash, skip — we only re-author
        // when the solution changes. Avoids wasting API calls for
        // lessons whose blocks were authored under a previous run.
        const solHash = createHash("sha1")
          .update(lesson.solution)
          .digest("hex")
          .slice(0, 12);
        if (lesson.blocks?._sha === solHash) {
          inPlaceHits += 1;
          continue;
        }
        const cacheKey = createHash("sha1")
          .update(`${course.id}|${lesson.id}|${MODEL}|${lesson.solution}`)
          .digest("hex")
          .slice(0, 16);
        work.push({
          courseIdx,
          lesson,
          language: lesson.language || course.language,
          solHash,
          cacheKey,
          cachePath: join(CACHE, `${cacheKey}.json`),
          courseTitle: course.title,
        });
        collectedThisCourse += 1;
      }
    }
  }

  console.log(
    `\n[generate-blocks] ${courses.length} course(s), ${work.length} lesson(s) to author` +
      ` (${inPlaceHits} already up-to-date, ${totalSkipped} skipped over length cap)`,
  );
  if (work.length === 0) {
    console.log(`[generate-blocks] nothing to do.`);
    return;
  }
  if (args.dry) {
    for (const w of work) {
      console.log(
        `  · ${w.lesson.id.padEnd(40)}  [dry-run, would call API or hit cache]`,
      );
    }
    console.log(
      `\n[generate-blocks] dry run — ${work.length} would be authored.`,
    );
    return;
  }

  // ── Phase 2: process with bounded concurrency ──────────────────
  // Worker pool of N concurrent requests. We checkpoint course
  // JSON saves every PROGRESS_FLUSH_EVERY successful authorings so a
  // crash or Ctrl-C mid-run preserves work.
  const concurrency = Math.max(1, args.concurrency ?? DEFAULT_CONCURRENCY);
  const PROGRESS_FLUSH_EVERY = 25;
  let totalApiCalls = 0;
  let totalCacheHits = 0;
  let totalAuthored = 0;
  let totalFailed = 0;
  let cursor = 0;
  const startedAt = Date.now();

  async function flushDirty() {
    for (const c of courses) {
      if (!c.dirty) continue;
      await writeFile(
        c.filePath,
        JSON.stringify(c.course, null, 2),
        "utf-8",
      );
      if (args.install) {
        const installedPath = join(
          INSTALLED_DIR,
          c.course.id,
          "course.json",
        );
        if (existsSync(installedPath)) {
          await copyFile(c.filePath, installedPath);
        }
      }
      c.dirty = false;
    }
  }

  async function worker() {
    while (true) {
      const idx = cursor;
      if (idx >= work.length) return;
      cursor += 1;
      const item = work[idx];
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
      const tag = `[${idx + 1}/${work.length} · ${elapsed}s]`;
      try {
        let payload;
        if (existsSync(item.cachePath)) {
          payload = JSON.parse(await readFile(item.cachePath, "utf-8"));
          totalCacheHits += 1;
          console.log(
            `  ${tag} ↩ ${item.lesson.id.padEnd(40)} cache  (${payload.slots.length} slots)`,
          );
        } else {
          const raw = await authorBlocks({
            courseTitle: item.courseTitle,
            lessonTitle: item.lesson.title,
            language: item.language,
            body: item.lesson.body || "",
            starter: item.lesson.starter || "",
            solution: item.lesson.solution,
          });
          const result = postProcess(raw, item.lesson.solution);
          if (!result.ok) {
            // Dump the rejected model output for postmortem so we
            // can tune the prompt or relax the validator without
            // re-paying for another API call. Sidecar filename
            // mirrors the cache key for correlation.
            try {
              await writeFile(
                join(REJECTED, `${item.cacheKey}.json`),
                JSON.stringify(
                  {
                    courseId: courses[item.courseIdx].course.id,
                    lessonId: item.lesson.id,
                    reason: result.reason,
                    rawFromModel: result.raw,
                    assembled: result.got,
                    canonical: result.want,
                  },
                  null,
                  2,
                ),
                "utf-8",
              );
            } catch {
              /* postmortem write is best-effort */
            }
            throw new Error(result.reason);
          }
          payload = result.payload;
          await writeFile(
            item.cachePath,
            JSON.stringify(payload, null, 2),
            "utf-8",
          );
          totalApiCalls += 1;
          console.log(
            `  ${tag} ✓ ${item.lesson.id.padEnd(40)} Claude (${payload.slots.length} slots, ${payload.pool.length} blocks)`,
          );
        }
        payload._sha = item.solHash;
        item.lesson.blocks = payload;
        courses[item.courseIdx].dirty = true;
        totalAuthored += 1;
        // Periodic checkpoint so a long run survives interruption.
        if (totalAuthored % PROGRESS_FLUSH_EVERY === 0) {
          await flushDirty();
        }
      } catch (e) {
        totalFailed += 1;
        console.warn(
          `  ${tag} ✗ ${item.lesson.id.padEnd(40)} ${(e.message ?? String(e)).slice(0, 200)}`,
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: concurrency }, () => worker()),
  );

  // ── Phase 3: final flush ────────────────────────────────────────
  await flushDirty();

  const dur = ((Date.now() - startedAt) / 1000).toFixed(0);
  console.log("");
  console.log(
    `[generate-blocks] done in ${dur}s — authored ${totalAuthored}` +
      ` (${totalApiCalls} API call(s), ${totalCacheHits} cache hit(s), ${totalFailed} failed, ${inPlaceHits} skipped as up-to-date, ${totalSkipped} over length cap)`,
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

CRITICAL — TEMPLATE FIDELITY (this is where most outputs go wrong):
- COPY the canonical solution verbatim. Do NOT rewrite it, reformat it, or "improve" the formatting.
- Preserve EVERY character: indentation (tabs vs spaces), blank lines, comments, trailing newlines, operator spacing, EVERYTHING.
- The ONLY change you make is replacing exact substrings with [[SLOT name]] markers. Replacing "9.0" with "[[SLOT num]]"? Fine. Replacing "    return c * 9.0;" with "  return c * [[SLOT num]];"? Wrong (you changed indentation + dropped spaces).
- "answer" must equal the EXACT substring you replaced — same casing, same whitespace, no leading/trailing spaces unless they were in the original.
- Your output template is run through an automated round-trip checker: assembled = template with markers replaced by their answers. assembled is then compared to the canonical solution. ANY drift fails the lesson and your work is thrown away.

WORKED EXAMPLE
Canonical solution (Zig):
\`\`\`
const std = @import("std");

pub fn celsiusToFahrenheit(c: f64) f64 {
    return c * 9.0 / 5.0 + 32.0;
}
\`\`\`

Correct output:
{
  "template": "const std = @import(\\"std\\");\\n\\npub fn celsiusToFahrenheit(c: f64) f64 {\\n    return c * [[SLOT num]] / [[SLOT den]] + [[SLOT offset]];\\n}\\n",
  "slots": [
    { "name": "num", "answer": "9.0", "hint": "numerator", "decoys": ["9", "1.8", "5.0"] },
    { "name": "den", "answer": "5.0", "hint": "denominator", "decoys": ["5", "9.0", "1.8"] },
    { "name": "offset", "answer": "32.0", "hint": "offset", "decoys": ["32", "273.15", "100.0"] }
  ],
  "prompt": "Drop the right constants into the Fahrenheit formula."
}

Note the correct example: the template's first line is "const std = @import(\\"std\\");" with no changes; the indentation on the return line is exactly four spaces; the closing brace and trailing newline are present. The answers are "9.0", "5.0", "32.0" — matching the original exactly.

Format rules (strict):
- Output is a SINGLE JSON object with shape:
  {
    "template": "<the solution with [[SLOT name]] markers>",
    "slots": [
      { "name": "<id>", "answer": "<correct token text>", "hint": "<one-word category>", "decoys": ["<wrong>", "<wrong>", ...] }
    ],
    "prompt": "<one-sentence learner-facing intro, optional>"
  }
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
  // Retry with exponential backoff for the transient failure modes
  // we expect on a multi-hour run: 429 (rate limit), 502/503/504
  // (gateway hiccup), and `fetch` network errors. Permanent errors
  // (400 = bad prompt, 401 = bad key, etc.) bail immediately.
  const MAX_ATTEMPTS = 4;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
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
        const transient = res.status === 429 || res.status >= 500;
        if (!transient || attempt === MAX_ATTEMPTS) {
          throw new Error(`API ${res.status}: ${txt.slice(0, 200)}`);
        }
        // Honor Retry-After when the API gives us one; otherwise
        // exponential backoff with a 30s cap.
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "", 10);
        const delayMs = Number.isFinite(retryAfter)
          ? retryAfter * 1000
          : Math.min(30_000, 1000 * 2 ** (attempt - 1) + Math.random() * 500);
        await new Promise((r) => setTimeout(r, delayMs));
        lastErr = new Error(`API ${res.status}: ${txt.slice(0, 100)}`);
        continue;
      }
      const data = await res.json();
      const text = data.content?.[0]?.text;
      if (!text) throw new Error("no text in response");
      const stripped = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      try {
        return JSON.parse(stripped);
      } catch (e) {
        // Bad JSON is the model's fault, not transport — retry once
        // (model can be flaky on JSON formatting under load) but
        // bubble up if it persists.
        if (attempt === MAX_ATTEMPTS) {
          throw new Error(
            `bad JSON from model: ${e.message}; got: ${stripped.slice(0, 200)}`,
          );
        }
        lastErr = e;
        await new Promise((r) =>
          setTimeout(r, 1000 * 2 ** (attempt - 1)),
        );
        continue;
      }
    } catch (e) {
      // Network / DNS / TLS errors land here. Retry up to MAX_ATTEMPTS.
      if (attempt === MAX_ATTEMPTS) throw e;
      lastErr = e;
      await new Promise((r) =>
        setTimeout(r, 1000 * 2 ** (attempt - 1) + Math.random() * 500),
      );
    }
  }
  throw lastErr ?? new Error("authorBlocks: exhausted retries");
}

// ── Post-processing + validation ───────────────────────────────────

/// Normalise a string for the round-trip equality check. Tolerates
/// the small whitespace differences models routinely introduce
/// without changing compile semantics:
///   - Line endings: CRLF / CR → LF
///   - Per-line trailing whitespace: stripped
///   - Trailing blank lines / final newline: stripped
/// Tabs vs spaces and leading indentation are preserved — those
/// matter for indentation-sensitive languages (Python / YAML).
function canonicalForCompare(s) {
  return s
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

/// Convert the model's `{ template, slots }` shape into our canonical
/// `BlocksData` shape and validate. Returns either
/// `{ ok: true, payload }` or `{ ok: false, reason, raw }` so the
/// caller can log the specific rejection cause and (optionally) save
/// the rejected payload for postmortem inspection.
function postProcess(raw, canonicalSolution) {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "model output isn't a JSON object", raw };
  }
  if (typeof raw.template !== "string") {
    return { ok: false, reason: "missing or non-string `template`", raw };
  }
  if (!Array.isArray(raw.slots)) {
    return { ok: false, reason: "missing or non-array `slots`", raw };
  }
  // Map [[SLOT name]] markers to our __SLOT_<id>__ form. The model's
  // `name` becomes our slot id verbatim — same identifier-shape
  // constraints already enforced by the system prompt.
  const slotsByName = new Map();
  for (const s of raw.slots) {
    if (!s || typeof s.name !== "string" || typeof s.answer !== "string") {
      return {
        ok: false,
        reason: "a slot is missing `name` or `answer`",
        raw,
      };
    }
    if (!/^[A-Za-z0-9_-]+$/.test(s.name)) {
      return {
        ok: false,
        reason: `slot name "${s.name}" has illegal characters`,
        raw,
      };
    }
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
      return {
        ok: false,
        reason: `template references slot "${name}" but no slot definition exists`,
        raw,
      };
    }
  }
  for (const name of slotsByName.keys()) {
    if (!seenInTemplate.has(name)) {
      return {
        ok: false,
        reason: `slot "${name}" defined but no [[SLOT ${name}]] marker in template`,
        raw,
      };
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
  // matches the original solution under our compare-time
  // normalisation (line endings, trailing whitespace).
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
  const got = canonicalForCompare(assembled);
  const want = canonicalForCompare(canonicalSolution);
  if (got !== want) {
    // Find the first divergent line so the postmortem can show
    // exactly what the model got wrong without dumping the entire
    // diff. Most failures are 1-2 lines off.
    const gotLines = got.split("\n");
    const wantLines = want.split("\n");
    const maxL = Math.max(gotLines.length, wantLines.length);
    let diffLine = -1;
    for (let i = 0; i < maxL; i++) {
      if (gotLines[i] !== wantLines[i]) {
        diffLine = i;
        break;
      }
    }
    const reason =
      diffLine >= 0
        ? `round-trip mismatch at line ${diffLine + 1}: assembled "${(gotLines[diffLine] ?? "").slice(0, 80)}" vs canonical "${(wantLines[diffLine] ?? "").slice(0, 80)}"`
        : `round-trip mismatch (length ${got.length} vs ${want.length})`;
    return { ok: false, reason, raw, got, want };
  }

  return {
    ok: true,
    payload: {
      template,
      slots,
      pool,
      prompt:
        typeof raw.prompt === "string" && raw.prompt.length < 200
          ? raw.prompt
          : undefined,
    },
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
    else if (a === "--concurrency") out.concurrency = parseInt(argv[++i], 10);
  }
  return out;
}

main().catch((err) => {
  console.error("[generate-blocks] failed:", err);
  process.exit(1);
});
