#!/usr/bin/env node
/// Apply blocks payloads to lessons WITHOUT calling the LLM API.
///
/// Sister to `generate-blocks.mjs` — same validation logic, same
/// round-trip check, same cache + course-write semantics, but the
/// "where does the payload come from" step reads from disk instead
/// of from Claude. Two sources are tried in order:
///
///   1. `.blocks-manual/<courseId>/<lessonId>.json` — hand-authored
///      raw payload in the SAME shape the model emits:
///        { template, slots: [{ name, answer, hint, decoys }], prompt? }
///      Run through `postProcess` → validated round-trip → written
///      to cache → patched onto the lesson. Source of truth for
///      lessons we author by hand when we're out of API credits.
///
///   2. `.cache/blocks/<key>.json` — pre-existing post-processed
///      cache from a prior `generate-blocks.mjs` run. Already in the
///      canonical `BlocksData` shape. Re-validated against the
///      current `lesson.solution` before applying so a solution edit
///      that wasn't reflected in the cache key (shouldn't happen,
///      but paranoia is cheap) won't silently apply bad blocks.
///
/// Anything that fails round-trip is reported and skipped — never
/// silently applied.
///
/// Usage:
///   node scripts/apply-blocks.mjs                     # all courses
///   node scripts/apply-blocks.mjs --course <id>       # one course
///   node scripts/apply-blocks.mjs --dry               # report only
///   node scripts/apply-blocks.mjs --install           # also patch ~/Library installed copy

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
const MANUAL = join(ROOT, ".blocks-manual");
const INSTALLED_DIR = join(
  homedir(),
  "Library/Application Support/com.mattssoftware.kata/courses",
);

/// Same model id the LLM script uses. The cache key is computed with
/// it, so to read pre-existing cache files we have to mirror the
/// constant exactly — bumping the model in `generate-blocks.mjs`
/// without bumping it here would silently invalidate every cache hit.
const MODEL = "claude-sonnet-4-5-20250929";
const MIN_SOLUTION_LINES = 3;
const MAX_SOLUTION_LINES = 80;

const args = parseArgs(process.argv.slice(2));

async function main() {
  await mkdir(CACHE, { recursive: true });
  await mkdir(MANUAL, { recursive: true });

  const files = (await readdir(STAGED)).filter(
    (f) => f.endsWith(".json") && f !== "manifest.json",
  );
  const targetFiles = args.course
    ? files.filter((f) => f === `${args.course}.json`)
    : files;
  if (args.course && targetFiles.length === 0) {
    console.error(`[apply-blocks] no staged course matches --course=${args.course}`);
    process.exit(1);
  }

  let totalEligible = 0;
  let totalSkipped = 0; // already up-to-date
  let totalManualApplied = 0;
  let totalCacheApplied = 0;
  let totalFailed = 0;
  let totalNoSource = 0;
  const failures = [];

  for (const f of targetFiles) {
    const filePath = join(STAGED, f);
    const text = await readFile(filePath, "utf-8");
    const course = JSON.parse(text);
    if (!course.chapters) continue;
    let dirty = false;

    for (const chapter of course.chapters) {
      for (const lesson of chapter.lessons) {
        if (lesson.kind !== "exercise" && lesson.kind !== "mixed") continue;
        if (!lesson.solution || lesson.solution.trim().length === 0) continue;
        const lines = lesson.solution.split(/\r?\n/);
        if (lines.length < MIN_SOLUTION_LINES) continue;
        if (lines.length > MAX_SOLUTION_LINES) continue;
        totalEligible += 1;

        const solHash = createHash("sha1")
          .update(lesson.solution)
          .digest("hex")
          .slice(0, 12);
        if (lesson.blocks?._sha === solHash) {
          totalSkipped += 1;
          continue;
        }

        const cacheKey = createHash("sha1")
          .update(`${course.id}|${lesson.id}|${MODEL}|${lesson.solution}`)
          .digest("hex")
          .slice(0, 16);
        const cachePath = join(CACHE, `${cacheKey}.json`);
        const manualPath = join(MANUAL, course.id, `${lesson.id}.json`);

        // Source preference: manual > cache. A hand-authored payload
        // is treated as the override — if you've taken the trouble to
        // write one, it should land even when a stale cache entry
        // exists for the same lesson.
        let payload = null;
        let source = null;
        let raw = null;

        if (existsSync(manualPath)) {
          try {
            raw = JSON.parse(await readFile(manualPath, "utf-8"));
          } catch (e) {
            failures.push({
              courseId: course.id,
              lessonId: lesson.id,
              reason: `manual file: bad JSON — ${e.message.slice(0, 120)}`,
            });
            totalFailed += 1;
            continue;
          }
          const result = postProcess(raw, lesson.solution);
          if (!result.ok) {
            failures.push({
              courseId: course.id,
              lessonId: lesson.id,
              reason: `manual: ${result.reason}`,
            });
            totalFailed += 1;
            continue;
          }
          payload = result.payload;
          source = "manual";
          // Persist to cache so future LLM-script runs see it as a
          // hit and don't try to re-author. Same shape `generate-blocks`
          // writes.
          if (!args.dry) {
            await writeFile(
              cachePath,
              JSON.stringify(payload, null, 2),
              "utf-8",
            );
          }
        } else if (existsSync(cachePath)) {
          let cached;
          try {
            cached = JSON.parse(await readFile(cachePath, "utf-8"));
          } catch (e) {
            failures.push({
              courseId: course.id,
              lessonId: lesson.id,
              reason: `cache file: bad JSON — ${e.message.slice(0, 120)}`,
            });
            totalFailed += 1;
            continue;
          }
          // Cache files are POST-processed already, so just re-run
          // the round-trip check to confirm they still match the
          // current solution. (They should — cache key includes the
          // solution text — but worth a belt-and-suspenders check.)
          const rtOk = roundTripCheckPostProcessed(cached, lesson.solution);
          if (!rtOk.ok) {
            failures.push({
              courseId: course.id,
              lessonId: lesson.id,
              reason: `cache stale: ${rtOk.reason}`,
            });
            totalFailed += 1;
            continue;
          }
          payload = cached;
          source = "cache";
        } else {
          totalNoSource += 1;
          continue;
        }

        payload._sha = solHash;
        if (!args.dry) {
          lesson.blocks = payload;
          dirty = true;
        }
        if (source === "manual") totalManualApplied += 1;
        else totalCacheApplied += 1;
        console.log(
          `  ✓ ${course.id.padEnd(40)} ${lesson.id.padEnd(38)} (${source}, ${payload.slots.length} slots)`,
        );
      }
    }

    if (dirty && !args.dry) {
      await writeFile(filePath, JSON.stringify(course, null, 2), "utf-8");
      if (args.install) {
        const installedPath = join(INSTALLED_DIR, course.id, "course.json");
        if (existsSync(installedPath)) {
          await copyFile(filePath, installedPath);
          console.log(`    ↪ installed copy patched: ${installedPath}`);
        }
      }
    }
  }

  console.log("");
  console.log(
    `[apply-blocks] eligible=${totalEligible}  already-current=${totalSkipped}  applied(manual)=${totalManualApplied}  applied(cache)=${totalCacheApplied}  failed=${totalFailed}  no-source=${totalNoSource}`,
  );
  if (failures.length > 0) {
    console.log("");
    console.log("Failures:");
    for (const f of failures) {
      console.log(`  ✗ ${f.courseId} :: ${f.lessonId}  — ${f.reason}`);
    }
  }
}

// ── Validation (mirrors generate-blocks.mjs) ──────────────────────────

function canonicalForCompare(s) {
  return s
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

/// Same `postProcess` logic from `generate-blocks.mjs`. Kept verbatim
/// so a hand-authored payload that survives this validator behaves
/// identically to one the LLM emitted — including the round-trip
/// equality check that's the actual quality gate.
function postProcess(raw, canonicalSolution) {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "model output isn't a JSON object" };
  }
  if (typeof raw.template !== "string") {
    return { ok: false, reason: "missing or non-string `template`" };
  }
  if (!Array.isArray(raw.slots)) {
    return { ok: false, reason: "missing or non-array `slots`" };
  }
  const slotsByName = new Map();
  for (const s of raw.slots) {
    if (!s || typeof s.name !== "string" || typeof s.answer !== "string") {
      return { ok: false, reason: "a slot is missing `name` or `answer`" };
    }
    if (!/^[A-Za-z0-9_-]+$/.test(s.name)) {
      return {
        ok: false,
        reason: `slot name "${s.name}" has illegal characters`,
      };
    }
    slotsByName.set(s.name, s);
  }
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
      };
    }
  }
  for (const name of slotsByName.keys()) {
    if (!seenInTemplate.has(name)) {
      return {
        ok: false,
        reason: `slot "${name}" defined but no [[SLOT ${name}]] marker in template`,
      };
    }
  }
  template = template.replace(markerRe, (_match, name) => `__SLOT_${name}__`);

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
    return { ok: false, reason };
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

/// Round-trip a payload that's already in post-processed shape
/// (`__SLOT_<id>__` markers, `pool` + `slots` already split). Used
/// for cache-source entries — they don't go through the marker
/// rewrite again, just the assemble + compare.
function roundTripCheckPostProcessed(payload, canonicalSolution) {
  if (!payload || typeof payload.template !== "string") {
    return { ok: false, reason: "cache payload missing template" };
  }
  if (!Array.isArray(payload.slots) || !Array.isArray(payload.pool)) {
    return { ok: false, reason: "cache payload missing slots/pool" };
  }
  const blockById = new Map(payload.pool.map((b) => [b.id, b]));
  const placements = Object.fromEntries(
    payload.slots.map((s) => [s.id, s.expectedBlockId]),
  );
  const assembled = payload.template.replace(
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
    return { ok: false, reason: "round-trip mismatch vs current solution" };
  }
  return { ok: true };
}

function parseArgs(argv) {
  const out = { dry: false, install: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry") out.dry = true;
    else if (a === "--install") out.install = true;
    else if (a === "--course") out.course = argv[++i];
  }
  return out;
}

main().catch((err) => {
  console.error("[apply-blocks] failed:", err);
  process.exit(1);
});
