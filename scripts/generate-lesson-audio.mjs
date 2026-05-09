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
///        FB_TTS_CDN_BASE=https://cdn.mattssoftware.com/fishbones/audio
///   2. Optional flags:
///        ELEVEN_MODEL=eleven_multilingual_v2     # default
///        ELEVEN_MODEL=eleven_turbo_v2_5          # ~half the chars cost
///   3. Run:
///        node scripts/generate-lesson-audio.mjs                # all
///        node scripts/generate-lesson-audio.mjs --course mastering-bitcoin
///        node scripts/generate-lesson-audio.mjs --lesson ch01-reading
///        node scripts/generate-lesson-audio.mjs --dry-run      # report char count, no API calls
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

const courseFilter = flag("--course");
const lessonFilter = flag("--lesson");
const DRY_RUN = has("--dry-run");
const VERBOSE = has("--verbose") || has("-v");

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
    "Library/Application Support/com.mattssoftware.kata/courses",
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
      // prose + an exercise, narrate the prose part. Exercises and
      // quizzes get nothing.
      if (l.kind === "reading" || l.kind === "mixed") {
        if (l.body && l.body.trim()) {
          yield l;
        }
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
  let totalChars = 0;
  let billedChars = 0;

  for (const course of courses) {
    if (courseFilter && course.id !== courseFilter) continue;
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
        const prevSection = previousManifest.lessons?.[lesson.id]?.sections?.[
          sIdx
        ];
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
        sectionEntries.push({
          url: cdnUrl,
          sha256: sha256(mp3),
          sizeBytes: mp3.length,
          durationSec: estimateDurationFromBytes(mp3.length),
          textHash,
          voice: VOICE_NAME,
          voiceId,
          model: MODEL_ID,
          blockStart: section.blockStart,
          blockEnd: section.blockEnd,
          headingText: section.headingText,
          headingLevel: section.headingLevel,
        });
        sectionsSynth += 1;
        lessonAnySynth = true;
      }

      if (sectionEntries.length === 0) continue;

      manifest.lessons[lesson.id] = {
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
  console.error(`sections cached: ${sectionsSkipped}`);
  console.error(`total chars:     ${totalChars.toLocaleString()}`);
  console.error(`billed chars:    ${billedChars.toLocaleString()}`);
  if (DRY_RUN) {
    console.error(`(dry run — no API calls made)`);
  }
  console.error(`manifest:        ${MANIFEST_PATH}`);
  console.error(`upload root:     ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
