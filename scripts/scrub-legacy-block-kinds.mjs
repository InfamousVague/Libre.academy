#!/usr/bin/env node
/// Remove the legacy `puzzle` / `cloze` / `micropuzzle` lesson kinds
/// from every staged starter course AND the bundled `.fishbones`
/// archives. These three kinds were the pre-blocks-mode mobile-first
/// drill formats; they've been superseded by the unified blocks
/// render mode that lives ON the existing `exercise` / `mixed`
/// lesson via the `blocks` field. The renderer code for the legacy
/// kinds is being deleted in the same commit, so packs that still
/// carry those entries would render as empty space — this script
/// excises them from the data so the chapters re-collapse to their
/// authored-exercise shape.
///
/// Idempotent: re-runs are no-ops once a pack is scrubbed.
///
/// Usage:
///   node scripts/scrub-legacy-block-kinds.mjs                # scrub staged + bundled
///   node scripts/scrub-legacy-block-kinds.mjs --installed    # ALSO scrub the user's installed courses
///   node scripts/scrub-legacy-block-kinds.mjs --course <id>  # one course only
///   node scripts/scrub-legacy-block-kinds.mjs --dry          # report what would be removed, no writes

import { mkdtemp, readFile, writeFile, readdir, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir, homedir } from "node:os";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STAGED = join(ROOT, "public", "starter-courses");
const BUNDLED = join(ROOT, "src-tauri", "resources", "bundled-packs");
const INSTALLED_DIR = join(
  homedir(),
  "Library/Application Support/com.mattssoftware.kata/courses",
);

const LEGACY_KINDS = new Set(["puzzle", "cloze", "micropuzzle"]);
const args = parseArgs(process.argv.slice(2));

async function main() {
  let totalCourses = 0;
  let totalRemoved = 0;

  // 1) Staged starter courses (the source of truth — bundles are
  //    re-derived from these by `scripts/extract-starter-courses.mjs`).
  if (existsSync(STAGED)) {
    console.log(`[scrub] staged starter courses → ${STAGED}`);
    for (const file of await readdir(STAGED)) {
      if (!file.endsWith(".json") || file === "manifest.json") continue;
      const courseId = file.replace(/\.json$/, "");
      if (args.course && args.course !== courseId) continue;
      const path = join(STAGED, file);
      const removed = await scrubCourseJson(path);
      if (removed > 0) {
        totalCourses += 1;
        totalRemoved += removed;
        console.log(`  ✓ ${courseId.padEnd(40)}  -${removed} legacy lesson(s)`);
      }
    }
  } else {
    console.log(`[scrub] (no staged starter courses at ${STAGED}; skipping)`);
  }

  // 2) Bundled course archives (`.academy` + legacy `.fishbones`).
  //    Re-zip after patching the inner course.json. Skipping when
  //    the pack didn't contain any legacy kinds keeps re-runs cheap.
  if (existsSync(BUNDLED)) {
    console.log(`\n[scrub] bundled packs → ${BUNDLED}`);
    for (const file of await readdir(BUNDLED)) {
      const ext = [".academy", ".fishbones"].find((e) => file.endsWith(e));
      if (!ext) continue;
      const courseId = file.slice(0, -ext.length);
      if (args.course && args.course !== courseId) continue;
      const removed = await scrubBundledPack(join(BUNDLED, file));
      if (removed > 0) {
        totalCourses += 1;
        totalRemoved += removed;
        const suffix = args.dry ? " (would re-bundle)" : " (re-bundled)";
        console.log(`  ✓ ${courseId.padEnd(40)}  -${removed} legacy lesson(s)${suffix}`);
      }
    }
  }

  // 3) Optionally scrub the user's installed copies so a running app
  //    sees the cleaned courses without waiting on a SEED_VERSION bump.
  if (args.installed && existsSync(INSTALLED_DIR)) {
    console.log(`\n[scrub] installed courses → ${INSTALLED_DIR}`);
    for (const dir of await readdir(INSTALLED_DIR)) {
      if (args.course && args.course !== dir) continue;
      const path = join(INSTALLED_DIR, dir, "course.json");
      if (!existsSync(path)) continue;
      const removed = await scrubCourseJson(path);
      if (removed > 0) {
        totalCourses += 1;
        totalRemoved += removed;
        console.log(`  ✓ ${dir.padEnd(40)}  -${removed} legacy lesson(s)`);
      }
    }
  }

  console.log("");
  console.log(
    `[scrub] removed ${totalRemoved} lesson(s) across ${totalCourses} location(s)${
      args.dry ? " (DRY RUN — no writes)" : ""
    }`,
  );
}

/// Read a course.json, drop every lesson whose `kind` is in
/// LEGACY_KINDS, drop chapters that go empty, write back. Returns
/// the number of lessons removed.
async function scrubCourseJson(path) {
  const text = await readFile(path, "utf-8");
  const course = JSON.parse(text);
  if (!Array.isArray(course.chapters)) return 0;
  let removed = 0;
  const cleanedChapters = [];
  for (const chapter of course.chapters) {
    if (!Array.isArray(chapter.lessons)) {
      cleanedChapters.push(chapter);
      continue;
    }
    const before = chapter.lessons.length;
    const cleanedLessons = chapter.lessons.filter(
      (l) => !LEGACY_KINDS.has(l?.kind),
    );
    removed += before - cleanedLessons.length;
    if (cleanedLessons.length > 0) {
      cleanedChapters.push({ ...chapter, lessons: cleanedLessons });
    }
    // Empty chapters drop entirely — we don't want navigation to
    // surface a chapter title with no lessons under it.
  }
  if (removed === 0) return 0;
  if (!args.dry) {
    course.chapters = cleanedChapters;
    await writeFile(path, JSON.stringify(course, null, 2) + "\n", "utf-8");
  }
  return removed;
}

/// Unzip the bundled pack, scrub its course.json, re-zip in place.
/// We re-zip even when the count is 0 only when a course.json is
/// patched — see scrubCourseJson's early return.
async function scrubBundledPack(packPath) {
  const tmp = await mkdtemp(join(tmpdir(), "scrub-blocks-"));
  let removed = 0;
  try {
    execFileSync("unzip", ["-q", packPath, "-d", tmp]);
    const inner = join(tmp, "course.json");
    if (!existsSync(inner)) return 0;
    removed = await scrubCourseJson(inner);
    if (removed === 0 || args.dry) return removed;
    // Determine the file list in the original archive so we re-zip
    // the same set of side-files (cover.jpg / etc.) that came in.
    const innerFiles = await readdir(tmp);
    const tmpZip = join(tmp, "out.fishbones");
    const cwd = process.cwd();
    process.chdir(tmp);
    try {
      execFileSync("zip", ["-q", "-X", tmpZip, ...innerFiles.filter((f) => f !== "out.fishbones")], {
        stdio: ["ignore", "ignore", "inherit"],
      });
    } finally {
      process.chdir(cwd);
    }
    await copyFile(tmpZip, packPath);
    return removed;
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

function parseArgs(argv) {
  const out = { dry: false, installed: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry") out.dry = true;
    else if (a === "--installed") out.installed = true;
    else if (a === "--course") out.course = argv[++i];
  }
  return out;
}

main().catch((err) => {
  console.error("[scrub] failed:", err);
  process.exit(1);
});
