#!/usr/bin/env node
/// Synthesize the guided-tour narration with ElevenLabs.
///
/// Each step in `src/components/Tour/tourSteps.json` becomes one
/// MP3 under `public/tour-audio/<stepId>.<sha7>.mp3`. The bundled
/// `public/tour-audio/manifest.json` lets the runtime player look
/// up which file to load for the current step.
///
/// Why bundled (under `public/`) and not on the audio CDN like
/// lessons:
///   - 9 short clips total (~3-4 min runtime, ~3MB MP3) — fits
///     in the app bundle without complaining;
///   - the tour fires on FIRST launch when the user has nothing
///     installed yet, so a CDN round-trip would race the auto-play
///     and on slow networks would miss the spotlight entirely;
///   - works offline, which the lesson narrator does not need to
///     because lessons aren't available offline either.
///
/// USAGE:
///   1. Drop these into `.env` at the repo root (gitignored):
///        ELEVEN_API_KEY=sk_...
///        ELEVEN_VOICE_NAME=Mark             # or whatever lesson narrator uses
///        ELEVEN_MODEL=eleven_multilingual_v2
///   2. Run:
///        node scripts/generate-tour-audio.mjs           # all steps
///        node scripts/generate-tour-audio.mjs --step welcome
///        node scripts/generate-tour-audio.mjs --dry-run # plan, no API calls
///        node scripts/generate-tour-audio.mjs --turbo   # use eleven_turbo_v2_5 (~half cost)
///
/// COST: ~3-4 min of audio total. Cheap; entire tour costs less
/// than a single long lesson.
///
/// IDEMPOTENT: re-running with no body changes is a no-op (same
/// textHash → cache hit → manifest written, no API calls).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { markdownToSpokenText } from "./spoken-text.mjs";

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
const VOICE_NAME = process.env.ELEVEN_VOICE_NAME || "Mark";
let MODEL_ID = process.env.ELEVEN_MODEL || "eleven_multilingual_v2";

const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : null;
};
const has = (n) => args.includes(n);

const stepFilter = flag("--step");
const DRY_RUN = has("--dry-run");
const VERBOSE = has("--verbose") || has("-v");

if (has("--turbo")) {
  MODEL_ID = "eleven_turbo_v2_5";
}

if (!DRY_RUN && !API_KEY) {
  console.error(
    "ELEVEN_API_KEY not set. Add it to .env or export it in your shell.",
  );
  process.exit(2);
}

// ── tour-step source ────────────────────────────────────────────
// Single source of truth — `tourSteps.json` is consumed by both
// this script and the React Tour component. Keeps the narration
// in lockstep with what the tooltip displays.
const TOUR_PATH = join(ROOT, "src/components/Tour/tourSteps.json");
const TOUR_DATA = JSON.parse(readFileSync(TOUR_PATH, "utf8"));
const STEPS = TOUR_DATA.steps;

const OUT_DIR = join(ROOT, "public/tour-audio");
mkdirSync(OUT_DIR, { recursive: true });
const MANIFEST_PATH = join(OUT_DIR, "manifest.json");

const previousManifest = existsSync(MANIFEST_PATH)
  ? JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
  : { steps: {} };

// ── ElevenLabs voice resolution + synthesis ────────────────────
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
    throw new Error(
      `ElevenLabs /v1/voices failed: ${r.status} ${await r.text()}`,
    );
  }
  const { voices } = await r.json();
  const target = VOICE_NAME.toLowerCase().trim();
  // Same multi-tier match the lesson generator uses, so an entry
  // in `.env` like `ELEVEN_VOICE_NAME=Mark` resolves regardless of
  // whether the library voice is "Mark", "Mark - Energetic Storyteller",
  // etc.
  const match =
    voices.find((v) => v.name?.toLowerCase() === target) ??
    voices.find((v) => v.name?.toLowerCase().startsWith(target + " ")) ??
    voices.find((v) => v.name?.toLowerCase().startsWith(target + "-")) ??
    voices.find((v) => v.name?.toLowerCase().startsWith(target));
  if (!match) {
    const names = voices.map((v) => v.name).join("\n  - ");
    throw new Error(
      `voice "${VOICE_NAME}" not found in your account.\nAvailable voices:\n  - ${names}`,
    );
  }
  resolvedVoiceId = match.voice_id;
  console.error(
    `✓ resolved voice "${VOICE_NAME}" → "${match.name}" (${resolvedVoiceId})`,
  );
  return resolvedVoiceId;
}

async function synthesize(voiceId, text) {
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

function sha256(s) {
  return createHash("sha256").update(s).digest("hex");
}

// ── main ────────────────────────────────────────────────────────
async function main() {
  const manifest = {
    tour_id: TOUR_DATA.tour_id,
    voice: VOICE_NAME,
    voiceId: null,
    model: MODEL_ID,
    generatedAt: new Date().toISOString(),
    steps: {},
  };

  let synthesised = 0;
  let skipped = 0;
  let totalChars = 0;
  let billedChars = 0;

  for (const step of STEPS) {
    if (stepFilter && step.id !== stepFilter) continue;

    // Use `narration` if explicitly set on a step (lets us write a
    // longer / more flowing voiceover than the short tooltip body),
    // otherwise the body text doubles as the narration source.
    const narration = step.narration || step.body;
    const spoken = markdownToSpokenText(narration);
    const textHash = sha256(spoken);
    const sha7 = textHash.slice(0, 7);
    const fileRel = `${step.id}.${sha7}.mp3`;
    const fileAbs = join(OUT_DIR, fileRel);
    const url = `/tour-audio/${fileRel}`;

    totalChars += spoken.length;

    const prev = previousManifest.steps?.[step.id];
    const cacheHit =
      prev &&
      prev.textHash === textHash &&
      prev.voice === VOICE_NAME &&
      prev.model === MODEL_ID &&
      existsSync(fileAbs);

    if (cacheHit) {
      manifest.steps[step.id] = { ...prev, url };
      skipped++;
      if (VERBOSE) console.error(`  ✓ skip ${step.id} (unchanged)`);
      continue;
    }

    billedChars += spoken.length;

    if (DRY_RUN) {
      console.error(
        `  ▶ would synth ${step.id} (${spoken.length} chars) — "${step.title}"`,
      );
      manifest.steps[step.id] = {
        url,
        textHash,
        voice: VOICE_NAME,
        model: MODEL_ID,
      };
      synthesised++;
      continue;
    }

    console.error(
      `  ▶ ${step.id} (${spoken.length} chars) — "${step.title}"`,
    );
    const voiceId = await resolveVoiceId();
    manifest.voiceId = voiceId;
    const mp3 = await synthesize(voiceId, spoken);
    writeFileSync(fileAbs, mp3);
    manifest.steps[step.id] = {
      url,
      sha256: sha256(mp3),
      sizeBytes: mp3.length,
      // Same byte-derived duration estimate the lesson generator
      // uses — accurate to a few hundred ms for 128 kbps CBR MP3,
      // refined live by the player on `loadedmetadata`.
      durationSec: Math.round((mp3.length / 16000) * 100) / 100,
      textHash,
      voice: VOICE_NAME,
      voiceId,
      model: MODEL_ID,
    };
    synthesised++;
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.error("\n──────────────────────────────────────");
  console.error(`synthesised:  ${synthesised}`);
  console.error(`skipped:      ${skipped} (cache hits)`);
  console.error(`total chars:  ${totalChars.toLocaleString()}`);
  console.error(`billed chars: ${billedChars.toLocaleString()}`);
  if (DRY_RUN) console.error(`(dry run — no API calls made)`);
  console.error(`manifest:     ${MANIFEST_PATH}`);
  console.error(`output dir:   ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("[generate-tour-audio]", err);
  process.exit(1);
});
