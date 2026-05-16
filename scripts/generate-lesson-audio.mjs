#!/usr/bin/env node
/// ElevenLabs lesson-audio generation pipeline.
///
/// Walks every reading + mixed lesson across every course in
/// `public/starter-courses/` and the live install dir, runs each
/// lesson body through the spoken-text preprocessor, then calls
/// ElevenLabs TTS to produce a content-hashed MP3 per lesson.
///
/// Output:
///   dist/audio/<courseId>/<lessonId>.<sha7>.mp3
///   dist/audio/manifest.json
///
/// Idempotent — only re-synthesises a lesson when its body has
/// changed since the last run (detected via sha256 of the spoken
/// text). Re-running on an unchanged catalog is a no-op (still
/// regenerates the manifest in case other fields drifted).
///
/// USAGE:
///   1. Drop these into `.env` at the repo root (gitignored):
///        ELEVEN_API_KEY=sk_...
///        ELEVEN_VOICE_NAME=Verity                # or a custom name
///        FB_TTS_CDN_BASE=https://libre.academy/audio
///   2. Optional flags:
///        ELEVEN_MODEL=eleven_multilingual_v2     # default
///        ELEVEN_MODEL=eleven_turbo_v2_5          # ~half the chars cost
///   3. Run:
///        node scripts/generate-lesson-audio.mjs                # all reading/mixed
///        node scripts/generate-lesson-audio.mjs --course mastering-bitcoin
///        node scripts/generate-lesson-audio.mjs --courses rustlings,exercism-rust
///        node scripts/generate-lesson-audio.mjs --lesson ch01-reading
///        node scripts/generate-lesson-audio.mjs --dry-run      # report char count, no API calls
///        node scripts/generate-lesson-audio.mjs --include-exercises --courses rustlings,exercism-rust,exercism-zig
///                                                              # narrate exercise-kind courses too
///                                                              # (*lings / Exercism — body is teaching prose)
///   4. Upload `dist/audio/` to the CDN (rsync / aws s3 sync /
///      cloudflare r2 — depends on your hosting).
///
/// COST: each call to ElevenLabs is billed by character count.
/// `--dry-run` prints a per-course / per-lesson breakdown so you
/// know the bill before you commit.

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  markdownToSpokenText,
  chunkForSynthesis,
  splitMarkdownIntoSections,
} from "./spoken-text.mjs";

// ── env loading ─────────────────────────────────────────────────
// Ultra-light .env reader — no deps. Looks for a `.env` file at the
// repo root and adds anything `KEY=VALUE` to process.env. Existing
// shell-set vars win.
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const ENV_FILE = join(ROOT, ".env");
if (existsSync(ENV_FILE)) {
  for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const API_KEY = process.env.ELEVEN_API_KEY;
const VOICE_NAME = process.env.ELEVEN_VOICE_NAME || "Jessa";
// Default to multilingual_v2 (the highest-quality model). Overridable
// via env (`ELEVEN_MODEL=eleven_turbo_v2_5`) or via the `--turbo` flag
// further down for ad-hoc cost-conscious runs. Turbo charges roughly
// half the credits per character with a small expressivity tradeoff.
let MODEL_ID = process.env.ELEVEN_MODEL || "eleven_multilingual_v2";
const CDN_BASE = process.env.FB_TTS_CDN_BASE
  ? process.env.FB_TTS_CDN_BASE.replace(/\/+$/, "")
  : "https://libre.academy/audio"; // Vultr VPS — same machine that hosts the marketing site + /learn/ web build.

// ── arg parsing ─────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const has = (name) => args.includes(name);

/// Both `--course` and `--courses` accept a comma-separated list and
/// behave identically — the singular/plural distinction was a
/// footgun (`--course rustlings,exercism-rust` silently matched a
/// course literally named "rustlings,exercism-rust", i.e. nothing).
/// If both flags are passed the sets union.
const courseFilterRaw = flag("--course");
const coursesFilterRaw = flag("--courses");
const courseFilterSet = new Set(
  [courseFilterRaw, coursesFilterRaw]
    .filter(Boolean)
    .flatMap((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),
);
const lessonFilter = flag("--lesson");
const DRY_RUN = has("--dry-run");
const VERBOSE = has("--verbose") || has("-v");
/// Opt-in: also narrate `exercise`-kind lessons. The default
/// (reading + mixed only) is correct for prose books, but the
/// *lings + Exercism courses are 100% exercise-kind and their
/// `body` is genuine instructional prose (concept explanation +
/// task description; the actual code lives in `starter`, not
/// `body`, and the spoken-text preprocessor strips any fenced
/// snippets from the body anyway). Without this flag those
/// courses yield zero narratable lessons. Scope it with
/// `--courses` so you don't accidentally narrate every challenge
/// pack in the catalog.
const INCLUDE_EXERCISES = has("--include-exercises");

// `--turbo` swaps the model to `eleven_turbo_v2_5` regardless of env.
// On Creator-tier billing this halves the per-char credit cost — same
// voice (Verity), slightly less expressive but indistinguishable for
// most narration; recommended for first-pass full-catalog runs.
if (has("--turbo")) {
  MODEL_ID = "eleven_turbo_v2_5";
}

if (!DRY_RUN && !API_KEY) {
  console.error(
    "ELEVEN_API_KEY not set. Add it to .env or export it in your shell.",
  );
  process.exit(2);
}

// ── output paths ────────────────────────────────────────────────
const OUT_DIR = join(ROOT, "dist/audio");
mkdirSync(OUT_DIR, { recursive: true });
const MANIFEST_PATH = join(OUT_DIR, "manifest.json");

/// Existing manifest — used to skip already-generated lessons whose
/// content hasn't changed. Survives across runs since `dist/audio/`
/// is a checked-in or rsynced output. Defaults to empty if first run.
const previousManifest = existsSync(MANIFEST_PATH)
  ? JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
  : { lessons: {} };

// ── course discovery ────────────────────────────────────────────
function loadAllCourses() {
  const seen = new Set();
  const out = [];
  // 1) Bundled seeds. Authoritative for content; we prefer these
  //    over the live install when both have the same id.
  const seedDir = join(ROOT, "public/starter-courses");
  if (existsSync(seedDir)) {
    for (const f of readdirSync(seedDir).filter((n) => n.endsWith(".json"))) {
      const p = join(seedDir, f);
      try {
        const c = JSON.parse(readFileSync(p, "utf8"));
        if (c.id && !seen.has(c.id)) {
          seen.add(c.id);
          out.push({ ...c, _path: p });
        }
      } catch {
        /* skip malformed */
      }
    }
  }
  // 2) Live install dir (developer's machine). Picks up courses the
  //    seed doesn't have — e.g. user-imported packs not yet checked in.
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
          out.push({ ...c, _path: p });
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
      // Only narrate prose. "reading" is pure prose; "mixed" has
      // prose + an exercise, narrate the prose part. "exercise"
      // is normally skipped (the body would be terse "fix this"
      // instructions) — but the *lings + Exercism courses ARE
      // all exercise-kind and ship a real teaching `body`, so
      // `--include-exercises` opts them in. Quizzes never get
      // narration (the body is the question list, not prose).
      const narratable =
        l.kind === "reading" ||
        l.kind === "mixed" ||
        (INCLUDE_EXERCISES && l.kind === "exercise");
      if (narratable && l.body && l.body.trim()) {
        yield l;
      }
    }
  }
}

// ── ElevenLabs voice resolution ─────────────────────────────────
let resolvedVoiceId = null;
async function resolveVoiceId() {
  if (resolvedVoiceId) return resolvedVoiceId;
  if (DRY_RUN) {
    resolvedVoiceId = "<dry-run-voice-id>";
    return resolvedVoiceId;
  }
  const r = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": API_KEY },
  });
  if (!r.ok) {
    throw new Error(`ElevenLabs /v1/voices failed: ${r.status} ${await r.text()}`);
  }
  const { voices } = await r.json();
  // ElevenLabs library voices have descriptive display names like
  // "Verity - Chatty, Fast-Paced, Fun Storyteller". Match in three
  // tiers so the user can configure ELEVEN_VOICE_NAME with either
  // the bare nickname ("Verity") OR the full string:
  //   1) exact case-insensitive
  //   2) starts-with the user's value (e.g. ELEVEN_VOICE_NAME=Verity
  //      matches "Verity - Chatty…")
  //   3) name contains the user's value as a whole word (handles
  //      "Verity Storyteller" → "Verity - … Storyteller")
  const target = VOICE_NAME.toLowerCase().trim();
  const targetWords = new Set(
    target.split(/\s+/).filter((w) => w.length > 1),
  );
  let match =
    voices.find((v) => v.name?.toLowerCase() === target) ??
    voices.find((v) => v.name?.toLowerCase().startsWith(target + " ")) ??
    voices.find((v) => v.name?.toLowerCase().startsWith(target + "-")) ??
    voices.find((v) => v.name?.toLowerCase().startsWith(target));
  if (!match) {
    // Last resort: every word in the user's value is a whole word in
    // the candidate's display name. Helps with "Adam Firm" → "Adam -
    // Dominant, Firm" without false-positiving on substrings.
    match = voices.find((v) => {
      const cand = (v.name ?? "").toLowerCase();
      const tokens = new Set(cand.split(/[\s,\-]+/).filter(Boolean));
      for (const w of targetWords) if (!tokens.has(w)) return false;
      return targetWords.size > 0;
    });
  }
  if (!match) {
    const names = voices.map((v) => v.name).join("\n  - ");
    throw new Error(
      `voice "${VOICE_NAME}" not found in your account.\nAvailable voices:\n  - ${names}`,
    );
  }
  resolvedVoiceId = match.voice_id;
  console.error(`✓ resolved voice "${VOICE_NAME}" → "${match.name}" (${resolvedVoiceId})`);
  return resolvedVoiceId;
}

// ── synthesis ────────────────────────────────────────────────────
async function synthesizeChunk(voiceId, text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      // Verity is a "Chatty, Fast-Paced, Fun Storyteller" — give her
      // some variation room (lower stability) but enough similarity
      // boost to keep the timbre consistent across paragraphs. These
      // settings work well for most ElevenLabs library voices; tweak
      // per-voice if needed.
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.75,
        style: 0.15,
        use_speaker_boost: true,
      },
    }),
  });
  if (!r.ok) {
    throw new Error(
      `ElevenLabs TTS failed: ${r.status} ${(await r.text()).slice(0, 500)}`,
    );
  }
  return Buffer.from(await r.arrayBuffer());
}

async function synthesizeLesson(voiceId, spokenText) {
  const chunks = chunkForSynthesis(spokenText);
  const buffers = [];
  for (let i = 0; i < chunks.length; i++) {
    if (VERBOSE) {
      console.error(
        `    chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`,
      );
    }
    buffers.push(await synthesizeChunk(voiceId, chunks[i]));
  }
  return Buffer.concat(buffers);
}

// ── main ────────────────────────────────────────────────────────
function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

/// Estimate MP3 duration from the file's byte length. ElevenLabs
/// emits 128 kbps CBR MP3 (`mp3_44100_128` in the synthesis URL),
/// so duration ≈ bytes / 16000 (128 kbits/s = 16000 bytes/s). The
/// estimate is within a few hundred ms of the true duration —
/// sufficient for cumulative-progress maths in the player. The
/// player refines with the live `audio.duration` once each section
/// has actually loaded.
function estimateDurationFromBytes(bytes) {
  if (!bytes || bytes <= 0) return null;
  // 128 kbps CBR MP3 → 16000 bytes per second of audio.
  return Math.round((bytes / 16000) * 100) / 100;
}

async function main() {
  const courses = loadAllCourses();
  console.error(`[generate-audio] found ${courses.length} courses`);

  // Manifest schema v2 — each lesson carries a `sections` array
  // instead of a single `url`. Each section is one MP3 file under
  // `dist/audio/<courseId>/<lessonId>/NN.<sha7>.mp3`. The player
  // walks the array, plays each in order, and waits for `ended`
  // before advancing — so the cursor + progress signal stay glued
  // to which paragraph is actually being read.
  const manifest = {
    version: 2,
    voice: VOICE_NAME,
    voiceId: null,
    model: MODEL_ID,
    cdnBase: CDN_BASE,
    generatedAt: new Date().toISOString(),
    lessons: {},
  };

  let lessonsTouched = 0;
  let sectionsSynth = 0;
  let sectionsSkipped = 0;
  let sectionsDeduped = 0;
  let totalChars = 0;
  let billedChars = 0;

  // Within-run dedup cache. *lings courses repeat the chapter
  // intro verbatim in every sibling exercise's body (rustlings is
  // ~41% duplicate spoken text — the same "Type conversions"
  // section appears in conversions1..5). Without this, ElevenLabs
  // would be billed once PER lesson for byte-identical narration.
  // Key = voice|model|textHash; value = the synthesized result so
  // a later identical section just re-writes the bytes to its own
  // per-lesson path (manifest + runtime contract unchanged — every
  // lesson still owns its files at the expected URL) WITHOUT a
  // second paid API call. Scoped per-run (not persisted) — the
  // cross-run cache is the existing per-section manifest check
  // above; this only catches duplicates within a single
  // invocation, which is exactly where the *lings redundancy lives.
  const runSynthCache = new Map();

  // ── Pre-flight: course-filter sanity ──────────────────────────
  // The audio system is now COURSE-SCOPED: the manifest is keyed by
  // `courseId/lessonId` and the runtime (`useLessonAudio`) resolves
  // composite-first. Two courses that happen to share a bare lesson
  // slug (every Exercism track reuses `hello-world`, `leap`, …) no
  // longer collide — each gets its own `courseId/lessonId` entry.
  // The old cross-course bare-id abort is therefore gone; the only
  // genuine corruption case left is a duplicate lesson id WITHIN a
  // single course (same composite key written twice), checked
  // further below.
  //
  // Pre-flight: a course filter that matches NOTHING is almost
  // always a typo or a singular/plural / id-vs-title mixup. Fail
  // loudly with the valid ids rather than producing a confusing
  // silent "lessons touched: 0".
  if (courseFilterSet.size > 0) {
    const allIds = new Set(courses.map((c) => c.id));
    const unknown = [...courseFilterSet].filter((id) => !allIds.has(id));
    if (unknown.length === courseFilterSet.size) {
      console.error(
        `\n✗ ABORT: none of the requested course id(s) exist.\n` +
          `  requested: ${[...courseFilterSet].join(", ")}\n` +
          `  (did you use --course with a comma list under the old\n` +
          `   singular flag, or pass a title instead of an id?)\n\n` +
          `  Available course ids:\n` +
          courses
            .map((c) => `    ${c.id}`)
            .sort()
            .join("\n"),
      );
      process.exit(4);
    }
    if (unknown.length > 0) {
      console.error(
        `⚠ warning: these requested ids don't exist and will be ` +
          `ignored: ${unknown.join(", ")}`,
      );
    }
  }

  {
    // Same-course duplicate-id check. With composite keys the only
    // way to clobber an entry is two lessons in the SAME course
    // sharing a lesson id (→ identical `courseId/lessonId` key).
    // That's a malformed course, not a cross-course slug clash —
    // rare, but worth a loud abort before spending on synthesis.
    const selected = courses.filter(
      (c) => courseFilterSet.size === 0 || courseFilterSet.has(c.id),
    );
    const dupes = [];
    for (const c of selected) {
      const seen = new Set();
      for (const l of readingLessons(c)) {
        if (seen.has(l.id)) dupes.push(`${c.id}/${l.id}`);
        else seen.add(l.id);
      }
    }
    if (dupes.length > 0) {
      console.error(
        `\n✗ ABORT: ${dupes.length} duplicate lesson id(s) within a ` +
          `single course — these map to the same composite manifest\n` +
          `  key and would overwrite each other. No characters billed.\n\n` +
          dupes
            .slice(0, 12)
            .map((d) => `  • ${d}`)
            .join("\n") +
          (dupes.length > 12 ? `\n  …and ${dupes.length - 12} more` : "") +
          `\n\n  Fix the course JSON so every lesson id is unique within ` +
          `its course.`,
      );
      process.exit(3);
    }
  }

  for (const course of courses) {
    if (courseFilterSet.size > 0 && !courseFilterSet.has(course.id)) continue;
    const lessons = [...readingLessons(course)];
    if (lessons.length === 0) continue;
    if (VERBOSE) {
      console.error(`\n=== ${course.id} (${lessons.length} reading lessons)`);
    }
    for (const lesson of lessons) {
      if (lessonFilter && lesson.id !== lessonFilter) continue;

      // Sectioning happens on the RAW markdown so block indices line
      // up with the renderer's `data-tts-block` numbering. Each
      // section's spoken text is run through the same
      // `markdownToSpokenText` pipeline the old per-lesson path used.
      const sections = splitMarkdownIntoSections(lesson.body);
      if (sections.length === 0) continue;

      lessonsTouched += 1;
      const lessonRelDir = `${course.id}/${lesson.id}`;
      const lessonAbsDir = join(OUT_DIR, lessonRelDir);
      const sectionEntries = [];
      let lessonAnySynth = false;

      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const section = sections[sIdx];
        const spoken = markdownToSpokenText(section.source);
        // Skip an empty-spoken section (e.g. a heading-only section
        // whose body became "" after preprocessing) — the player
        // would have nothing to play and the manifest entry would
        // be a 0-byte MP3.
        if (!spoken.trim()) {
          if (VERBOSE)
            console.error(
              `    · ${lesson.id} §${sIdx + 1} empty after preprocess — skipped`,
            );
          continue;
        }
        const textHash = sha256(spoken);
        const sha7 = textHash.slice(0, 7);
        // Zero-padded to two digits so lexical sort = playback
        // order. Three digits would be paranoid (a single lesson
        // with 100+ H1/H2 sections would be unusual; degrade
        // gracefully if we ever hit it by widening the pad).
        const seq = String(sIdx + 1).padStart(2, "0");
        const fileRel = `${lessonRelDir}/${seq}.${sha7}.mp3`;
        const fileAbs = join(OUT_DIR, fileRel);
        const cdnUrl = `${CDN_BASE}/${fileRel}`;

        totalChars += spoken.length;

        // Cache hit: the previous manifest had this same lesson +
        // section index + textHash, AND the on-disk file still
        // exists. Refresh the URL field defensively (CDN base may
        // have moved) and move on.
        // Composite-keyed lookup, with a bare-id fallback so a
        // pre-migration local manifest still scores cache hits on
        // the first composite run (otherwise every lesson would
        // re-synthesize once, billing for byte-identical audio).
        const prevEntry =
          previousManifest.lessons?.[lessonRelDir] ??
          previousManifest.lessons?.[lesson.id];
        const prevSection = prevEntry?.sections?.[sIdx];
        const cacheHit =
          prevSection &&
          prevSection.textHash === textHash &&
          prevSection.voice === VOICE_NAME &&
          prevSection.model === MODEL_ID &&
          existsSync(fileAbs);

        if (cacheHit) {
          sectionsSkipped += 1;
          sectionEntries.push({
            ...prevSection,
            url: cdnUrl,
            blockStart: section.blockStart,
            blockEnd: section.blockEnd,
            headingText: section.headingText,
            headingLevel: section.headingLevel,
          });
          if (VERBOSE)
            console.error(`  ↩ ${lesson.id} §${sIdx + 1} cache hit`);
          continue;
        }

        // Within-run dedup: identical spoken text (same voice +
        // model) was already synthesized earlier in THIS run for a
        // sibling lesson. Reuse those bytes — write them to this
        // lesson's own file path so the per-lesson manifest URL
        // contract is unchanged — but DON'T pay ElevenLabs again.
        const dedupKey = `${VOICE_NAME}|${MODEL_ID}|${textHash}`;
        const dedup = runSynthCache.get(dedupKey);
        if (dedup) {
          sectionsDeduped += 1;
          if (!DRY_RUN) {
            // Re-materialize the identical clip at this lesson's
            // path. Cheap local file copy; no API call.
            mkdirSync(lessonAbsDir, { recursive: true });
            writeFileSync(fileAbs, dedup.mp3);
          }
          sectionEntries.push({
            url: cdnUrl,
            sha256: dedup.sha256,
            sizeBytes: dedup.sizeBytes,
            durationSec: dedup.durationSec,
            textHash,
            voice: VOICE_NAME,
            voiceId: dedup.voiceId,
            model: MODEL_ID,
            blockStart: section.blockStart,
            blockEnd: section.blockEnd,
            headingText: section.headingText,
            headingLevel: section.headingLevel,
          });
          if (VERBOSE)
            console.error(
              `  = ${lesson.id} §${sIdx + 1} dedup (identical to an earlier section this run — $0)`,
            );
          continue;
        }

        billedChars += spoken.length;

        if (DRY_RUN) {
          console.error(
            `  ▶ would synth ${lesson.id} §${sIdx + 1} (${spoken.length} chars)` +
              (section.headingText ? ` — "${section.headingText}"` : ""),
          );
          sectionEntries.push({
            url: cdnUrl,
            sha256: undefined,
            sizeBytes: undefined,
            durationSec: undefined,
            textHash,
            voice: VOICE_NAME,
            model: MODEL_ID,
            blockStart: section.blockStart,
            blockEnd: section.blockEnd,
            headingText: section.headingText,
            headingLevel: section.headingLevel,
          });
          // Register the hash so a later identical section this run
          // takes the dedup path → the projected `billedChars` in
          // the dry-run summary matches what a real run would bill.
          runSynthCache.set(dedupKey, {
            mp3: null,
            sha256: undefined,
            sizeBytes: undefined,
            durationSec: undefined,
            voiceId: undefined,
          });
          sectionsSynth += 1;
          continue;
        }

        console.error(
          `  ▶ ${lesson.id} §${sIdx + 1} (${spoken.length} chars)` +
            (section.headingText ? ` — "${section.headingText}"` : ""),
        );
        const voiceId = await resolveVoiceId();
        manifest.voiceId = voiceId;
        const mp3 = await synthesizeLesson(voiceId, spoken);
        mkdirSync(lessonAbsDir, { recursive: true });
        writeFileSync(fileAbs, mp3);
        const mp3Sha = sha256(mp3);
        const mp3Dur = estimateDurationFromBytes(mp3.length);
        sectionEntries.push({
          url: cdnUrl,
          sha256: mp3Sha,
          sizeBytes: mp3.length,
          durationSec: mp3Dur,
          textHash,
          voice: VOICE_NAME,
          voiceId,
          model: MODEL_ID,
          blockStart: section.blockStart,
          blockEnd: section.blockEnd,
          headingText: section.headingText,
          headingLevel: section.headingLevel,
        });
        // Cache the synthesized clip so a later identical section
        // this run (sibling *lings exercise repeating the chapter
        // intro) reuses these bytes for free instead of paying
        // ElevenLabs a second time.
        runSynthCache.set(dedupKey, {
          mp3,
          sha256: mp3Sha,
          sizeBytes: mp3.length,
          durationSec: mp3Dur,
          voiceId,
        });
        sectionsSynth += 1;
        lessonAnySynth = true;
      }

      if (sectionEntries.length === 0) continue;

      // Composite key (`courseId/lessonId`) — same shape as
      // `lessonRelDir` + the on-disk audio path. Two courses that
      // share a bare lesson slug no longer collide. The runtime
      // resolves this composite-first (with a bare fallback for
      // legacy manifests).
      manifest.lessons[lessonRelDir] = {
        courseId: course.id,
        voice: VOICE_NAME,
        model: MODEL_ID,
        sections: sectionEntries,
      };

      // Forward the manifest's voiceId once we have one — populated
      // on first synthesis, no-op otherwise.
      if (lessonAnySynth && manifest.voiceId == null) {
        manifest.voiceId = await resolveVoiceId();
      }
    }
  }

  // Trim manifest entries for lessons that no longer exist (course
  // edits removed a lesson, lesson kind switched away from reading).
  // Their MP3s stay on disk — your upload step can prune via diff if
  // you want to reclaim CDN space.

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.error("\n──────────────────────────────────────");
  console.error(`lessons touched: ${lessonsTouched}`);
  console.error(`sections synth:  ${sectionsSynth}`);
  console.error(`sections cached: ${sectionsSkipped} (prior-run manifest)`);
  console.error(
    `sections dedup:  ${sectionsDeduped} (identical text reused this run — $0)`,
  );
  console.error(`total chars:     ${totalChars.toLocaleString()}`);
  console.error(
    `billed chars:    ${billedChars.toLocaleString()} (what ElevenLabs actually charges)`,
  );
  if (DRY_RUN) {
    console.error(`(dry run — no API calls made)`);
  }
  console.error(`manifest:        ${MANIFEST_PATH}`);
  console.error(`upload root:     ${OUT_DIR}`);

  // "lessons touched: 0" is almost never what the user wanted —
  // explain the likely cause instead of exiting silently. By here
  // the pre-flight has already proven the filter matched ≥1 real
  // course, so the usual culprit is exercise-kind courses without
  // --include-exercises.
  if (lessonsTouched === 0) {
    const selected = courses.filter(
      (c) => courseFilterSet.size === 0 || courseFilterSet.has(c.id),
    );
    const kindsOf = (c) =>
      new Set((c.chapters || []).flatMap((ch) => (ch.lessons || []).map((l) => l.kind)));
    const exerciseOnly = selected.filter((c) => {
      const k = kindsOf(c);
      return k.size > 0 && ![...k].some((x) => x === "reading" || x === "mixed");
    });
    console.error("\n──────────────────────────────────────");
    if (!INCLUDE_EXERCISES && exerciseOnly.length > 0) {
      console.error(
        `✗ 0 lessons narrated. ${exerciseOnly.length} of the selected ` +
          `course(s) are exercise-only and were skipped because\n` +
          `  --include-exercises was not passed:\n` +
          exerciseOnly.map((c) => `    ${c.id}`).join("\n") +
          `\n\n  Re-run with --include-exercises, e.g.:\n` +
          `    node scripts/generate-lesson-audio.mjs --include-exercises ` +
          `--courses ${selected.map((c) => c.id).join(",")} --dry-run`,
      );
    } else {
      console.error(
        `✗ 0 lessons narrated — the selected course(s) had no ` +
          `reading/mixed${INCLUDE_EXERCISES ? "/exercise" : ""} lessons ` +
          `with a non-empty body. Nothing was billed.`,
      );
    }
  }
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
