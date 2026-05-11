#!/usr/bin/env node
/**
 * One-shot migration: course covers were 1024×1536 PNGs (~3.5 MB
 * each) which made library + discover load painfully slow on first
 * mount — every tile pays the cost of base64-encoding a multi-megabyte
 * payload over IPC. This script converts every existing cover to a
 * 480×720 JPEG q85 (~30-80 KB each), trimming startup time from
 * "seconds of blank tiles" to instant.
 *
 * What it touches:
 *   - `src-tauri/resources/bundled-packs/<id>.libre` — extracts
 *     each archive, replaces inner `cover.png` with `cover.jpg`,
 *     repacks. The Rust `load_course_cover` is updated in this same
 *     change to prefer `.jpg` (with the right MIME) and fall back
 *     to `.png` so older archives still work.
 *   - `<app-data>/courses/<id>/cover.png` — writes a sibling
 *     `cover.jpg` and deletes the source `cover.png`. Idempotent:
 *     a course whose folder already has `cover.jpg` (and no .png) is
 *     skipped.
 *   - `cover-overrides/<id>.png` is left ALONE — those are the
 *     editorial-source PNGs the extract-starter-courses pipeline
 *     reads to produce the web JPEGs. Keeping them as PNG preserves
 *     the lossless source-of-truth for re-encodes.
 *
 * Special case: the A to Zig course folder doesn't have ANY cover yet
 * (the .libre built earlier carries only course.json). When run,
 * this script seeds it from `cover-overrides/a-to-zig.png` and packs
 * the result into the archive in one pass.
 *
 * Run:
 *   node scripts/optimize-covers.mjs
 *   node scripts/optimize-covers.mjs --dry-run
 *
 * Requires ImageMagick (`magick` or `convert`) on PATH.
 */

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
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const BUNDLE_DIR = join(REPO_ROOT, "src-tauri", "resources", "bundled-packs");
const COVER_OVERRIDES = join(REPO_ROOT, "cover-overrides");
const APP_DATA = join(
  homedir(),
  "Library",
  "Application Support",
  "com.mattssoftware.libre",
);
const COURSES_DIR = join(APP_DATA, "courses");

// 480×720 = 2x retina for the largest tile (~240px wide in the
// catalog browser). JPEG q85 hits a ~30-80 KB sweet spot for
// photographic content with no visible quality loss at render size.
const TARGET_WIDTH = 480;
const TARGET_HEIGHT = 720;
const JPEG_QUALITY = 85;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");

let imagemagick = null;
function pickImageMagick() {
  if (imagemagick) return imagemagick;
  for (const cmd of ["magick", "convert"]) {
    try {
      execFileSync(cmd, ["-version"], { stdio: "ignore" });
      imagemagick = cmd;
      return cmd;
    } catch {
      // try next
    }
  }
  throw new Error("ImageMagick not found — install with `brew install imagemagick`");
}

/// Resize + convert any input image to a 480×720 JPEG q85 at `dst`.
/// `>` qualifier on `-resize` means "shrink only, never enlarge"
/// so a 320×480 source stays 320×480 (idempotent).
function toOptimizedJpeg(srcPath, dstPath) {
  const cmd = pickImageMagick();
  execFileSync(
    cmd,
    [
      srcPath,
      "-resize",
      `${TARGET_WIDTH}x${TARGET_HEIGHT}>`,
      "-strip",
      "-interlace",
      "Plane",
      "-quality",
      String(JPEG_QUALITY),
      dstPath,
    ],
    { stdio: "ignore" },
  );
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function rmIfExists(p) {
  if (existsSync(p)) {
    if (DRY_RUN) return;
    unlinkSync(p);
  }
}

/// Process the local install at `<app-data>/courses/<id>/`.
/// Outputs `cover.jpg`, deletes `cover.png`. Returns
/// `{ before, after }` byte counts (or null when nothing to do).
function optimizeLocalInstall(courseId) {
  const dir = join(COURSES_DIR, courseId);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return null;
  const png = join(dir, "cover.png");
  const jpg = join(dir, "cover.jpg");

  // Already-optimized: cover.jpg present and no cover.png. Idempotent.
  if (existsSync(jpg) && !existsSync(png)) return null;

  // Source priority: existing cover.png, else cover.jpg (re-encode is
  // cheap and might be a stale large JPEG too).
  const src = existsSync(png) ? png : existsSync(jpg) ? jpg : null;
  if (!src) return null;

  const before = statSync(src).size;
  if (!DRY_RUN) {
    toOptimizedJpeg(src, jpg);
    rmIfExists(png);
  }
  const after = DRY_RUN ? before : statSync(jpg).size;
  return { before, after };
}

/// Process a `.libre` archive in place: extract, replace any
/// `cover.png` inside with `cover.jpg`, repack at the same path.
/// Special case: when `seedFromOverride` is true (used for A to Zig
/// which had NO cover at all), reads cover-overrides/<id>.png and
/// injects it as cover.jpg.
function optimizeBundledArchive(archivePath, packId) {
  const work = mkdtempSync(join(tmpdir(), "fb-cover-"));
  let report = null;
  try {
    execFileSync("unzip", ["-q", archivePath, "-d", work], { stdio: "pipe" });
    const innerPng = join(work, "cover.png");
    const innerJpg = join(work, "cover.jpg");
    const overrideSrc = join(COVER_OVERRIDES, `${packId}.png`);

    let beforeBytes = 0;
    let src = null;
    if (existsSync(innerPng)) {
      beforeBytes = statSync(innerPng).size;
      src = innerPng;
    } else if (existsSync(innerJpg)) {
      beforeBytes = statSync(innerJpg).size;
      src = innerJpg;
    } else if (existsSync(overrideSrc)) {
      // Archive has no cover at all (A to Zig case). Seed from the
      // editorial-source PNG in cover-overrides/. Zero "before" so
      // the report flags this as a fresh add rather than a shrink.
      beforeBytes = 0;
      src = overrideSrc;
    } else {
      // No cover, nothing to do. Skip silently.
      return null;
    }

    if (!DRY_RUN) {
      toOptimizedJpeg(src, innerJpg);
      // Drop the legacy PNG so the repacked archive is unambiguous.
      if (src !== innerPng) {
        // src was either innerJpg (we just overwrote it) or the
        // override PNG (untouched). Either way ensure no stale
        // cover.png is in the work dir.
      }
      rmIfExists(innerPng);

      // Repack: zip from inside `work` so paths are flat at root.
      // Match `promote-library-to-bundle.mjs` flags: -X strips extras,
      // -q quiets stdout, fresh delete first because zip APPENDS.
      const tmpArchive = `${archivePath}.tmp`;
      rmIfExists(tmpArchive);
      execFileSync(
        "/usr/bin/zip",
        ["-r", "-q", "-X", tmpArchive, "."],
        { cwd: work, stdio: ["ignore", "ignore", "inherit"] },
      );
      // Atomic-ish replace: rm then rename.
      rmIfExists(archivePath);
      execFileSync("mv", [tmpArchive, archivePath], { stdio: "ignore" });
    }

    const afterBytes = DRY_RUN
      ? beforeBytes
      : statSync(innerJpg).size;
    report = { before: beforeBytes, after: afterBytes };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  return report;
}

function main() {
  if (!existsSync(BUNDLE_DIR)) {
    console.error(`bundle dir not found: ${BUNDLE_DIR}`);
    process.exit(1);
  }
  pickImageMagick(); // fail-fast if ImageMagick is missing

  console.log(
    `[optimize-covers] target: ${TARGET_WIDTH}×${TARGET_HEIGHT} JPEG q${JPEG_QUALITY}` +
      (DRY_RUN ? " (DRY RUN)" : ""),
  );
  console.log("");

  // ── Bundled archives ─────────────────────────────────────────
  // Accept both `.academy` (post-rebrand canonical extension) and
  // `.libre` (legacy) so partial migrations still get optimised.
  const ARCHIVE_EXTS = [".academy", ".libre"];
  console.log("== bundled-packs/*.{academy,libre} ==");
  let totalBundledBefore = 0;
  let totalBundledAfter = 0;
  let bundledChanged = 0;
  for (const name of readdirSync(BUNDLE_DIR).sort()) {
    const ext = ARCHIVE_EXTS.find((e) => name.endsWith(e));
    if (!ext) continue;
    const packId = name.slice(0, -ext.length);
    const archive = join(BUNDLE_DIR, name);
    const r = optimizeBundledArchive(archive, packId);
    if (!r) {
      console.log(`  ·  ${packId} (no cover, skipped)`);
      continue;
    }
    const fresh = r.before === 0;
    const tag = fresh
      ? `seeded from cover-overrides → ${fmtBytes(r.after)}`
      : `${fmtBytes(r.before)} → ${fmtBytes(r.after)}`;
    console.log(`  ${fresh ? "+" : "↓"}  ${packId}: ${tag}`);
    totalBundledBefore += r.before;
    totalBundledAfter += r.after;
    bundledChanged += 1;
  }
  console.log(
    `  total: ${fmtBytes(totalBundledBefore)} → ${fmtBytes(totalBundledAfter)} ` +
      `across ${bundledChanged} archives`,
  );
  console.log("");

  // ── Local installs ────────────────────────────────────────────
  console.log("== ~/Library/.../com.mattssoftware.libre/courses/<id>/ ==");
  if (!existsSync(COURSES_DIR)) {
    console.log("  (no local courses dir, skipping)");
    return;
  }
  // Also seed A to Zig's local install from cover-overrides if it
  // currently has no cover at all. The bundled-archive pass above
  // already pulls the override into the archive; this mirrors that
  // into the live install dir so the user sees the cover without
  // having to reinstall.
  const aToZigDir = join(COURSES_DIR, "a-to-zig");
  const aToZigJpg = join(aToZigDir, "cover.jpg");
  const aToZigPng = join(aToZigDir, "cover.png");
  const aToZigOverride = join(COVER_OVERRIDES, "a-to-zig.png");
  if (
    existsSync(aToZigDir) &&
    !existsSync(aToZigJpg) &&
    !existsSync(aToZigPng) &&
    existsSync(aToZigOverride)
  ) {
    if (!DRY_RUN) toOptimizedJpeg(aToZigOverride, aToZigJpg);
    const sz = DRY_RUN ? statSync(aToZigOverride).size : statSync(aToZigJpg).size;
    console.log(`  +  a-to-zig: seeded from cover-overrides → ${fmtBytes(sz)}`);
  }

  let totalLocalBefore = 0;
  let totalLocalAfter = 0;
  let localChanged = 0;
  for (const courseId of readdirSync(COURSES_DIR).sort()) {
    const r = optimizeLocalInstall(courseId);
    if (!r) continue;
    console.log(
      `  ↓  ${courseId}: ${fmtBytes(r.before)} → ${fmtBytes(r.after)}`,
    );
    totalLocalBefore += r.before;
    totalLocalAfter += r.after;
    localChanged += 1;
  }
  console.log(
    `  total: ${fmtBytes(totalLocalBefore)} → ${fmtBytes(totalLocalAfter)} ` +
      `across ${localChanged} courses`,
  );
  console.log("");
  console.log("Done.");
  if (!DRY_RUN) {
    console.log(
      "Re-run `node scripts/extract-starter-courses.mjs` to refresh the web manifest.",
    );
  }
}

main();
