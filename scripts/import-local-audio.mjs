#!/usr/bin/env node
/// Import already-generated lesson MP3s from a local directory and
/// rebuild `dist/audio/manifest.json` against them — no ElevenLabs
/// API calls. Use this when you already have the audio files (e.g.
/// in `~/Desktop/<courseId>/`) and just need to wire them up so
/// `upload-lesson-audio.mjs` can push them to the VPS.
///
/// How matching works:
///   1. We walk every course (`public/starter-courses/` + the live
///      `~/Library/Application Support/.../courses` tree, same as
///      `generate-lesson-audio.mjs`).
///   2. For each reading/mixed lesson, we run its body through
///      `markdownToSpokenText` and sha256 the result — exactly the
///      hash the generator uses to name MP3s.
///   3. We look for a file `<lessonId>.<sha7>.mp3` in
///      `<source>/<courseId>/`. If found, we copy it to
///      `dist/audio/<courseId>/` and add a manifest entry. If not
///      found, the lesson is reported as missing (its body has
///      changed since the MP3 was generated, OR it was never
///      generated to begin with).
///
/// Output is a fresh `dist/audio/manifest.json` whose `cdnBase` and
/// per-entry `url` fields use whichever host you set in
/// `FB_TTS_CDN_BASE` — same env the generator reads. Run
/// `upload-lesson-audio.mjs` afterwards to push to the VPS.
///
/// USAGE:
///   node scripts/import-local-audio.mjs                   # default source ~/Desktop
///   node scripts/import-local-audio.mjs --from ~/Audio    # alt source
///   node scripts/import-local-audio.mjs --course a-to-zig # one course
///   node scripts/import-local-audio.mjs --dry-run         # report only, no copies / writes
///   node scripts/import-local-audio.mjs --keep-cdn-base   # preserve a remote manifest's
///                                                          # cdnBase (rarely useful — the
///                                                          # default rewrites to the host
///                                                          # you'll actually upload to)

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  markdownToSpokenText,
  splitMarkdownIntoSections,
} from "./spoken-text.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

// `.env` (gitignored) is the conventional place to set FB_TTS_CDN_BASE
// + voice / model — read it the same way generate-lesson-audio.mjs does
// so a user with that already configured doesn't have to re-export
// shell vars to run this script.
const ENV_FILE = join(ROOT, ".env");
if (existsSync(ENV_FILE)) {
  for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const VOICE_NAME = process.env.ELEVEN_VOICE_NAME || "Verity";
const MODEL_ID = process.env.ELEVEN_MODEL || "eleven_multilingual_v2";
/// CDN base — defaults to the academy host because that's where
/// `upload-lesson-audio.mjs` rsyncs to (`/var/www/libre-academy/audio`,
/// served at `https://libre.academy/audio`). The MP3s live next to
/// the manifest on that one server, so URLs pointing there are correct
/// by construction.
///
/// We DELIBERATELY ignore `FB_TTS_CDN_BASE` here — past invocations
/// with that env var set produced manifests pointing at hosts that
/// never came up, so audio fetches 404'd in the app. The
/// `generate-lesson-audio.mjs` script honors the env var because the
/// generator is the right place to opt into a separate CDN; the
/// importer's job is just to wire up files that are about to be
/// uploaded to the academy host, so it should always emit URLs there.
/// Pass `--cdn-base <url>` if you genuinely need a different host.
const CDN_BASE = "https://libre.academy/audio";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const has = (name) => args.includes(name);

const SOURCE_DIR = flag("--from")
  ? resolve(flag("--from").replace(/^~(?=$|\/)/, homedir()))
  : join(homedir(), "Desktop");
const courseFilter = flag("--course");
const DRY_RUN = has("--dry-run");
const cdnBaseOverride = flag("--cdn-base");
const EFFECTIVE_CDN_BASE = (cdnBaseOverride || CDN_BASE).replace(/\/+$/, "");

const OUT_DIR = join(ROOT, "dist/audio");
const MANIFEST_PATH = join(OUT_DIR, "manifest.json");

// ── course discovery (mirrors generate-lesson-audio.mjs) ────────
function loadAllCourses() {
  const seen = new Set();
  const out = [];
  const seedDir = join(ROOT, "public/starter-courses");
  if (existsSync(seedDir)) {
    for (const f of readdirSync(seedDir).filter((n) => n.endsWith(".json"))) {
      const p = join(seedDir, f);
      try {
        const c = JSON.parse(readFileSync(p, "utf8"));
        if (c.id && !seen.has(c.id)) {
          seen.add(c.id);
          out.push(c);
        }
      } catch {
        /* skip malformed */
      }
    }
  }
  const liveDir = join(
    homedir(),
    "Library/Application Support/com.mattssoftware.libre/courses",
  );
  if (existsSync(liveDir)) {
    for (const id of readdirSync(liveDir)) {
      if (seen.has(id)) continue;
      const p = join(liveDir, id, "course.json");
      if (!existsSync(p)) continue;
      try {
        const c = JSON.parse(readFileSync(p, "utf8"));
        if (c.id && !seen.has(c.id)) {
          seen.add(c.id);
          out.push(c);
        }
      } catch {
        /* skip malformed */
      }
    }
  }
  return out;
}

function* readingLessons(course) {
  for (const ch of course.chapters || []) {
    for (const l of ch.lessons || []) {
      if (l.kind === "reading" || l.kind === "mixed") {
        if (l.body && l.body.trim()) yield l;
      }
    }
  }
}

function sha256(s) {
  return createHash("sha256").update(s).digest("hex");
}

// ── main ────────────────────────────────────────────────────────
function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.error(`[import-audio] source dir not found: ${SOURCE_DIR}`);
    process.exit(2);
  }
  console.error(`[import-audio] source: ${SOURCE_DIR}`);
  console.error(`[import-audio] target: ${OUT_DIR}`);
  console.error(`[import-audio] cdnBase: ${EFFECTIVE_CDN_BASE}`);
  console.error(`[import-audio] voice: ${VOICE_NAME} / model: ${MODEL_ID}`);
  if (DRY_RUN) console.error(`[import-audio] DRY RUN — no copies, no writes`);
  console.error("");

  const courses = loadAllCourses();
  const manifest = {
    // The importer always emits v2 manifests now — even when the
    // sources are legacy single-MP3-per-lesson files, we wrap them
    // as a length-1 section list so the player's v2 code path drives
    // both. New generator output is true multi-section; the legacy
    // wrap is just transitional until the user regenerates.
    version: 2,
    voice: VOICE_NAME,
    voiceId: null,
    model: MODEL_ID,
    cdnBase: EFFECTIVE_CDN_BASE,
    generatedAt: new Date().toISOString(),
    lessons: {},
  };

  let imported = 0;
  let alreadyInDist = 0;
  let missing = 0;
  let stale = 0;
  let legacy = 0;
  const missingByCourse = {};
  const staleByCourse = {};

  for (const course of courses) {
    if (courseFilter && course.id !== courseFilter) continue;
    const lessons = [...readingLessons(course)];
    if (lessons.length === 0) continue;

    const sourceCourseDir = join(SOURCE_DIR, course.id);
    const targetCourseDir = join(OUT_DIR, course.id);
    // Top-level files in the source course dir (v1 layout: one MP3
    // per lesson sitting next to its siblings).
    const sourceTopMp3s = existsSync(sourceCourseDir)
      ? readdirSync(sourceCourseDir, { withFileTypes: true })
          .filter((d) => d.isFile() && d.name.endsWith(".mp3"))
          .map((d) => d.name)
      : [];
    // Per-lesson subdirs (v2 layout: one dir per lesson with NN.sha7.mp3 files).
    const sourceLessonDirs = existsSync(sourceCourseDir)
      ? new Set(
          readdirSync(sourceCourseDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name),
        )
      : new Set();

    // Top-level lookup keyed on `<lessonId>.<sha7>` for the legacy
    // path (single MP3 per lesson).
    const topLevelIndex = new Map();
    for (const f of sourceTopMp3s) {
      const m = /^(.+)\.([0-9a-f]{7})\.mp3$/.exec(f);
      if (m) topLevelIndex.set(`${m[1]}.${m[2]}`, f);
    }

    let courseImports = 0;
    let courseMissing = 0;
    let courseStale = 0;
    let courseLegacy = 0;

    for (const lesson of lessons) {
      const lessonRelDir = `${course.id}/${lesson.id}`;
      const lessonAbsDir = join(OUT_DIR, lessonRelDir);
      const lessonSourceDir = join(sourceCourseDir, lesson.id);

      // ── v2 path: per-section MP3s in <source>/<courseId>/<lessonId>/ ──
      // Hash each section's spoken text; look for an
      // <NN>.<sha7>.mp3 whose sha7 matches. Emit a sectioned manifest
      // entry when at least one section matches; report the rest as
      // missing/stale on a per-section basis so partial coverage
      // is clear instead of silently degrading.
      const haveLessonDir = sourceLessonDirs.has(lesson.id);
      if (haveLessonDir) {
        const lessonSourceFiles = readdirSync(lessonSourceDir).filter((n) =>
          n.endsWith(".mp3"),
        );
        // Index keyed by sha7 so a section matches its file by
        // content, not by section number — a renumbered section
        // (heading reordered) still finds its old MP3 if the spoken
        // text is unchanged.
        const sha7Index = new Map();
        for (const f of lessonSourceFiles) {
          const m = /^(\d{2})\.([0-9a-f]{7})\.mp3$/.exec(f);
          if (m) sha7Index.set(m[2], f);
        }

        const sections = splitMarkdownIntoSections(lesson.body);
        const entrySections = [];
        let hadAnyMatch = false;
        let hadAnyMiss = false;
        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
          const section = sections[sIdx];
          const spokenSection = markdownToSpokenText(section.source);
          if (!spokenSection.trim()) continue;
          const textHash = sha256(spokenSection);
          const sha7 = textHash.slice(0, 7);
          const seq = String(sIdx + 1).padStart(2, "0");
          const fileRel = `${lessonRelDir}/${seq}.${sha7}.mp3`;
          const fileAbs = join(OUT_DIR, fileRel);
          const cdnUrl = `${EFFECTIVE_CDN_BASE}/${fileRel}`;

          if (existsSync(fileAbs)) {
            entrySections.push(buildSectionEntry({
              fileAbs, cdnUrl, textHash, section, sIdx,
            }));
            hadAnyMatch = true;
            continue;
          }

          if (sha7Index.has(sha7)) {
            const sourceAbs = join(lessonSourceDir, sha7Index.get(sha7));
            if (!DRY_RUN) {
              mkdirSync(lessonAbsDir, { recursive: true });
              copyFileSync(sourceAbs, fileAbs);
            }
            entrySections.push(
              buildSectionEntry({
                fileAbs: DRY_RUN ? sourceAbs : fileAbs,
                cdnUrl,
                textHash,
                section,
                sIdx,
              }),
            );
            imported++;
            hadAnyMatch = true;
            continue;
          }

          hadAnyMiss = true;
        }

        if (hadAnyMatch) {
          manifest.lessons[lesson.id] = {
            courseId: course.id,
            voice: VOICE_NAME,
            model: MODEL_ID,
            sections: entrySections,
          };
          courseImports++;
          if (hadAnyMiss) {
            (missingByCourse[course.id] ??= []).push(
              `${lesson.id} (partial — ${entrySections.length}/${sections.length} sections)`,
            );
          }
          continue;
        }
        // Lesson dir exists but no sections matched — fall through
        // to the v1 / missing accounting below.
      }

      // ── v1 path: single MP3 at <source>/<courseId>/<lessonId>.<sha7>.mp3 ──
      // Wrapped as a length-1 section list so the player's v2 path
      // drives it uniformly. The wrap intentionally leaves
      // `blockEnd: -1` to mark "we don't know the block range" — the
      // cursor falls back to char-weighting against overall progress
      // (= same behaviour as before sectioning).
      const wholeSpoken = markdownToSpokenText(lesson.body);
      const wholeTextHash = sha256(wholeSpoken);
      const wholeSha7 = wholeTextHash.slice(0, 7);
      const v1FileRel = `${course.id}/${lesson.id}.${wholeSha7}.mp3`;
      const v1FileAbs = join(OUT_DIR, v1FileRel);
      const v1CdnUrl = `${EFFECTIVE_CDN_BASE}/${v1FileRel}`;

      if (existsSync(v1FileAbs)) {
        manifest.lessons[lesson.id] = {
          courseId: course.id,
          voice: VOICE_NAME,
          model: MODEL_ID,
          sections: [
            buildLegacySectionEntry({
              fileAbs: v1FileAbs,
              cdnUrl: v1CdnUrl,
              textHash: wholeTextHash,
            }),
          ],
        };
        alreadyInDist++;
        legacy++;
        courseLegacy++;
        continue;
      }

      const v1Key = `${lesson.id}.${wholeSha7}`;
      if (topLevelIndex.has(v1Key)) {
        const sourceAbs = join(sourceCourseDir, topLevelIndex.get(v1Key));
        if (!DRY_RUN) {
          mkdirSync(targetCourseDir, { recursive: true });
          copyFileSync(sourceAbs, v1FileAbs);
        }
        manifest.lessons[lesson.id] = {
          courseId: course.id,
          voice: VOICE_NAME,
          model: MODEL_ID,
          sections: [
            buildLegacySectionEntry({
              fileAbs: DRY_RUN ? sourceAbs : v1FileAbs,
              cdnUrl: v1CdnUrl,
              textHash: wholeTextHash,
            }),
          ],
        };
        imported++;
        legacy++;
        courseImports++;
        courseLegacy++;
        continue;
      }

      // Stale: source dir has SOME mp3 for this lesson, but the
      // sha7 doesn't match the current body's hash. The MP3 was
      // generated against an older version of the prose. Don't copy
      // it (it'd narrate stale content); leave the manifest gap so
      // the user knows what to regenerate.
      const staleMatch = sourceTopMp3s.find((f) =>
        f.startsWith(`${lesson.id}.`),
      );
      if (staleMatch) {
        stale++;
        courseStale++;
        (staleByCourse[course.id] ??= []).push(
          `${lesson.id} (have sha7 ${/\.([0-9a-f]{7})\./.exec(staleMatch)?.[1]}, need ${wholeSha7})`,
        );
        continue;
      }

      missing++;
      courseMissing++;
      (missingByCourse[course.id] ??= []).push(lesson.id);
    }

    if (courseImports + courseMissing + courseStale > 0) {
      const legacyHint = courseLegacy > 0 ? `, ${courseLegacy} legacy` : "";
      console.error(
        `  ${course.id}: ${courseImports} imported${legacyHint}, ${courseStale} stale, ${courseMissing} missing`,
      );
    }
  }

  if (!DRY_RUN) {
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.error(`\n[import-audio] wrote ${MANIFEST_PATH}`);
  }

  console.error("");
  console.error(`Summary:`);
  console.error(`  imported from source: ${imported}`);
  console.error(`  already in dist:      ${alreadyInDist}`);
  console.error(`  stale (body changed): ${stale}`);
  console.error(`  missing (no file):    ${missing}`);
  console.error(`  legacy single-file:   ${legacy} (re-run generate-lesson-audio.mjs to upgrade to per-section audio)`);
  console.error(`  manifest entries:     ${Object.keys(manifest.lessons).length}`);

  if (stale > 0) {
    console.error(`\nStale lessons (regenerate body or re-synthesise):`);
    for (const [cid, list] of Object.entries(staleByCourse)) {
      console.error(`  ${cid}:`);
      for (const item of list) console.error(`    - ${item}`);
    }
  }
  if (missing > 0) {
    console.error(`\nMissing lessons (run generate-lesson-audio.mjs to synthesise):`);
    for (const [cid, list] of Object.entries(missingByCourse)) {
      console.error(`  ${cid}: ${list.length} lessons`);
      // Show first 5 so the output stays readable on a long miss list.
      for (const id of list.slice(0, 5)) console.error(`    - ${id}`);
      if (list.length > 5) console.error(`    … +${list.length - 5} more`);
    }
  }

  console.error("");
  console.error(
    `Next: node scripts/upload-lesson-audio.mjs    # rsync dist/audio → libre-academy VPS`,
  );
}

/// File sha256 — used to populate the manifest's sha256 field, same
/// thing the generator does. Reads the file once into memory; lesson
/// MP3s are at most a few MB so this is cheap.
function sha256ForFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/// Approximate duration in seconds for a 128 kbps CBR MP3.
/// Mirrors the generator's `estimateDurationFromBytes`. The audio
/// player refines via the live `audio.duration` once each section
/// loads, so being a few hundred ms off doesn't show up in the UX.
function estimateDurationFromBytes(bytes) {
  if (!bytes || bytes <= 0) return null;
  return Math.round((bytes / 16000) * 100) / 100;
}

/// Build a v2 manifest section entry for the per-section path. The
/// section comes from `splitMarkdownIntoSections` (so we have the
/// heading text + block range); the file fields are read live from
/// disk for accuracy.
function buildSectionEntry({ fileAbs, cdnUrl, textHash, section }) {
  const sizeBytes = statSync(fileAbs).size;
  return {
    url: cdnUrl,
    sha256: sha256ForFile(fileAbs),
    sizeBytes,
    durationSec: estimateDurationFromBytes(sizeBytes),
    textHash,
    voice: VOICE_NAME,
    model: MODEL_ID,
    blockStart: section.blockStart,
    blockEnd: section.blockEnd,
    headingText: section.headingText,
    headingLevel: section.headingLevel,
  };
}

/// Build a v2 manifest section entry from a v1 single-MP3 source.
/// We don't know section structure (the file covers the whole
/// lesson), so `blockStart=0, blockEnd=-1` flags "unknown range" —
/// the cursor falls back to char-weighting against overall progress
/// (= the pre-sectioning behaviour). This wrapping path exists
/// purely for the transition: legacy MP3s on Desktop still produce
/// playable audio while the user decides whether to regenerate.
function buildLegacySectionEntry({ fileAbs, cdnUrl, textHash }) {
  const sizeBytes = statSync(fileAbs).size;
  return {
    url: cdnUrl,
    sha256: sha256ForFile(fileAbs),
    sizeBytes,
    durationSec: estimateDurationFromBytes(sizeBytes),
    textHash,
    voice: VOICE_NAME,
    model: MODEL_ID,
    blockStart: 0,
    blockEnd: -1,
    headingText: null,
    headingLevel: null,
  };
}

main();
