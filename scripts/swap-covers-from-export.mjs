#!/usr/bin/env node
/// One-shot: take a folder of new course covers, optimize each, and
/// inject the result into every surface that displays a course cover.
///
/// Pipeline per file:
///   1. Read source JPEG / PNG from `<source>/<id>.jpg`.
///   2. Resize to max 600px wide, JPEG quality 82, strip EXIF.
///   3. Write to `public/starter-courses/<id>.jpg` (web build +
///      academy mirror via sync-starter-courses).
///   4. Replace the inner `cover.jpg` (and drop any legacy
///      `cover.png`) inside `src-tauri/resources/bundled-packs/<id>.academy`
///      so first-launch installs see the new artwork.
///   5. Mirror the source into `cover-overrides/<id>.jpg` so future
///      `optimize-covers.mjs` re-encodes have the right starting
///      point.
///   6. Mirror into the local-install dir (`~/Library/Application
///      Support/com.mattssoftware.kata/courses/<id>/cover.jpg`)
///      so the existing dev install picks up the new cover without
///      reinstalling.
///
/// Idempotent — re-running with the same source folder produces the
/// same outputs. Skips IDs that don't have a matching .academy
/// archive (so accidental file drops don't pollute the bundle).
///
/// Usage:
///   node scripts/swap-covers-from-export.mjs [<source-folder>] [--dry-run]
///   defaults to ~/Desktop/export

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const BUNDLE_DIR = path.join(REPO_ROOT, "src-tauri", "resources", "bundled-packs");
const STARTER_DIR = path.join(REPO_ROOT, "public", "starter-courses");
const OVERRIDES_DIR = path.join(REPO_ROOT, "cover-overrides");
const LOCAL_INSTALL_DIR = path.join(
  homedir(),
  "Library",
  "Application Support",
  "com.mattssoftware.kata",
  "courses",
);

// Match what `optimize-covers.mjs` already targets so the two scripts
// produce visually identical output. 600px wide is 3x retina at the
// largest catalog tile (~200px display); JPEG q82 is the sweet spot
// that pushes file size to ~40-80 KB without visible loss.
const TARGET_WIDTH = 600;
const JPEG_QUALITY = 82;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const SOURCE =
  args.find((a) => !a.startsWith("--")) ||
  path.join(homedir(), "Desktop", "export");

if (!existsSync(SOURCE)) {
  console.error(`Source folder not found: ${SOURCE}`);
  process.exit(1);
}

// Sanity-check the tools we need before we walk anything.
ensureCmd("magick");
ensureCmd("unzip");

const files = readdirSync(SOURCE)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .sort();
if (files.length === 0) {
  console.error(`No .jpg/.jpeg/.png files in ${SOURCE}`);
  process.exit(1);
}

console.log(`📁 Source: ${SOURCE}`);
console.log(`🎯 Target: ${TARGET_WIDTH}px wide, JPEG q${JPEG_QUALITY}`);
console.log(`📦 ${files.length} cover(s) found${dryRun ? " (DRY RUN)" : ""}\n`);

let optimizedTotal = 0;
let starterStaged = 0;
let archiveStaged = 0;
let overrideStaged = 0;
let localStaged = 0;
let skipped = 0;

const tmpDir = mkdtempSync(path.join(tmpdir(), "fb-cover-swap-"));
try {
  for (const file of files) {
    const id = file.replace(/\.(jpe?g|png)$/i, "");
    const src = path.join(SOURCE, file);

    // Optimize once into a temp file; reuse for every destination.
    const optimized = path.join(tmpDir, `${id}.jpg`);
    if (!dryRun) {
      execFileSync(
        "magick",
        [
          src,
          "-strip",
          "-interlace",
          "Plane",
          "-resize",
          `${TARGET_WIDTH}x>`,
          "-sampling-factor",
          "4:2:0",
          "-quality",
          String(JPEG_QUALITY),
          optimized,
        ],
        { stdio: ["ignore", "ignore", "inherit"] },
      );
    }
    const inSize = statSync(src).size;
    const outSize = dryRun ? inSize : statSync(optimized).size;
    optimizedTotal += outSize;

    const archivePath = findArchive(id);
    const tags = [];

    // (a) public/starter-courses/<id>.jpg — web build mirror
    if (!dryRun) copy(optimized, path.join(STARTER_DIR, `${id}.jpg`));
    starterStaged += 1;
    tags.push("starter");

    // (b) inside the .academy archive (desktop install seed)
    if (archivePath) {
      if (!dryRun) injectCoverIntoArchive(archivePath, optimized);
      archiveStaged += 1;
      tags.push("archive");
    } else {
      tags.push("no-archive(skip)");
    }

    // (c) cover-overrides/<id>.jpg — source-of-truth for future
    //     re-encodes via optimize-covers.mjs
    if (!dryRun) {
      copy(src, path.join(OVERRIDES_DIR, `${id}.jpg`));
      // If a stale .png override existed for this id, remove it so
      // the .jpg is unambiguous.
      const stalePng = path.join(OVERRIDES_DIR, `${id}.png`);
      if (existsSync(stalePng)) unlinkSync(stalePng);
    }
    overrideStaged += 1;
    tags.push("override");

    // (d) local install — only if a folder for this course exists
    const localDir = path.join(LOCAL_INSTALL_DIR, id);
    if (existsSync(localDir)) {
      if (!dryRun) {
        copy(optimized, path.join(localDir, "cover.jpg"));
        // Drop any legacy cover.png so load_course_cover finds the .jpg.
        const stale = path.join(localDir, "cover.png");
        if (existsSync(stale)) unlinkSync(stale);
      }
      localStaged += 1;
      tags.push("local");
    }

    console.log(
      `${id.padEnd(50)} ${kb(inSize).padStart(8)} → ${kb(outSize).padStart(7)}  [${tags.join(", ")}]`,
    );
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

console.log(`\n📊 Summary:`);
console.log(`   covers processed:  ${files.length}`);
console.log(`   starter-courses/:  ${starterStaged}`);
console.log(`   .academy archives: ${archiveStaged}${skipped ? `  (${skipped} skipped, no archive)` : ""}`);
console.log(`   cover-overrides/:  ${overrideStaged}`);
console.log(`   local installs:    ${localStaged}`);
console.log(`   total bytes after: ${kb(optimizedTotal)}`);

// ─── Helpers ────────────────────────────────────────────────────

function ensureCmd(cmd) {
  try {
    execFileSync(cmd, ["-version"], { stdio: "ignore" });
  } catch {
    console.error(`Missing tool: ${cmd}. Install with brew (or check PATH).`);
    process.exit(1);
  }
}

function findArchive(id) {
  for (const ext of [".academy", ".libre"]) {
    const p = path.join(BUNDLE_DIR, `${id}${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
}

function copy(from, to) {
  mkdirSync(path.dirname(to), { recursive: true });
  execFileSync("cp", [from, to]);
}

/// Replace the `cover.jpg` (or legacy `cover.png`) inside a .academy
/// zip archive with `optimizedJpg`. Atomic-ish: writes to a tmp
/// archive then moves it over the original.
function injectCoverIntoArchive(archivePath, optimizedJpg) {
  const work = mkdtempSync(path.join(tmpdir(), "fb-archive-swap-"));
  try {
    execFileSync("unzip", ["-q", archivePath, "-d", work], { stdio: "pipe" });
    // Drop legacy cover.png so the .jpg is unambiguous.
    const stalePng = path.join(work, "cover.png");
    if (existsSync(stalePng)) unlinkSync(stalePng);
    copy(optimizedJpg, path.join(work, "cover.jpg"));
    const tmpArchive = `${archivePath}.tmp`;
    if (existsSync(tmpArchive)) unlinkSync(tmpArchive);
    execFileSync(
      "/usr/bin/zip",
      ["-r", "-q", "-X", tmpArchive, "."],
      { cwd: work, stdio: ["ignore", "ignore", "inherit"] },
    );
    if (existsSync(archivePath)) unlinkSync(archivePath);
    execFileSync("mv", [tmpArchive, archivePath]);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function kb(n) {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + " MB";
  return (n / 1024).toFixed(1) + " KB";
}
