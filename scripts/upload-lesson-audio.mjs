#!/usr/bin/env node
/// Upload `dist/audio/` to the Libre Vultr VPS so the MP3s live
/// at `https://libre.academy/audio/<courseId>/<lessonId>.<sha>.mp3`.
///
/// Mirrors the academy site's deploy pattern (sshpass + rsync) so
/// auth flows through the same `api/.env`'s `VPS_PASSWORD`. The
/// remote target sits inside the academy webroot:
///
///   /var/www/libre-academy/audio/
///
/// Important nginx note: the academy's own deploy.mjs uses
/// `rsync --delete` against /var/www/libre-academy/, which would
/// wipe the audio dir on every site deploy. The companion patch in
/// this same change adds `--exclude=audio/` to that rsync so a site
/// deploy leaves the audio alone. (See
/// `~/Development/Web/libre-academy/scripts/deploy.mjs`.)
///
/// USAGE:
///   node scripts/upload-lesson-audio.mjs                 # full sync
///   node scripts/upload-lesson-audio.mjs --dry-run       # show what would change
///   node scripts/upload-lesson-audio.mjs --course a-to-zig
///                                                        # only that course's dir + manifest
///
/// AUTH:
///   - VPS_SSH_PASSWORD env var (matches the GH Actions secret name), OR
///   - VPS_PASSWORD in `api/.env`, OR
///   - SSHPASS env var
/// Same resolution order the academy's deploy.mjs uses.

import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DIST_AUDIO = join(ROOT, "dist/audio");

const VPS_HOST = process.env.VPS_HOST ?? "149.28.120.197";
const VPS_USER = process.env.VPS_USER ?? "root";
const VPS_PORT = process.env.VPS_PORT ?? "22";
const VPS_TARGET_DIR =
  process.env.VPS_AUDIO_TARGET_DIR ?? "/var/www/libre-academy/audio";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const has = (name) => args.includes(name);

const DRY_RUN = has("--dry-run");
const courseFilter = flag("--course");

if (!existsSync(DIST_AUDIO)) {
  console.error(
    `[upload-audio] no dist/audio yet — run scripts/generate-lesson-audio.mjs first.`,
  );
  process.exit(2);
}
if (!existsSync(join(DIST_AUDIO, "manifest.json"))) {
  console.error(
    `[upload-audio] dist/audio/manifest.json missing. Re-run the generator.`,
  );
  process.exit(2);
}

function readPasswordFromDotenv(path) {
  if (!existsSync(path)) return null;
  const lines = readFileSync(path, "utf8").split("\n");
  for (const line of lines) {
    const m = /^\s*VPS_PASSWORD\s*=\s*(.+)$/.exec(line);
    if (!m) continue;
    let v = m[1].trim();
    if (!v.startsWith('"') && !v.startsWith("'")) {
      const hashIdx = v.indexOf("#");
      if (hashIdx > 0) v = v.slice(0, hashIdx).trim();
    }
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (v) return v;
  }
  return null;
}

function resolveVpsPassword() {
  if (process.env.VPS_SSH_PASSWORD) return process.env.VPS_SSH_PASSWORD;
  if (process.env.SSHPASS) return process.env.SSHPASS;
  const fromApi = readPasswordFromDotenv(join(ROOT, "api/.env"));
  if (fromApi) {
    console.error("[upload-audio] using VPS_PASSWORD from api/.env");
    return fromApi;
  }
  return null;
}

function run(cmd, env) {
  if (DRY_RUN) console.error(`[upload-audio] (dry) ${cmd}`);
  execSync(cmd, {
    stdio: "inherit",
    env: env ? { ...process.env, ...env } : process.env,
  });
}

const pwd = resolveVpsPassword();
if (!pwd && !DRY_RUN) {
  console.error(
    "No VPS password found. Set VPS_SSH_PASSWORD env var, OR populate api/.env (VPS_PASSWORD=…).",
  );
  process.exit(2);
}

// Make sure the remote dir exists. ssh + mkdir is idempotent.
const sshOpts = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p ${VPS_PORT}`;
const remoteHost = `${VPS_USER}@${VPS_HOST}`;

if (!DRY_RUN) {
  console.error(`[upload-audio] ensuring ${VPS_TARGET_DIR}/ exists on VPS`);
  run(
    `sshpass -e ssh -o StrictHostKeyChecking=no -p ${VPS_PORT} ${remoteHost} 'mkdir -p ${VPS_TARGET_DIR}'`,
    { SSHPASS: pwd },
  );
}

// ── Auto-merge + re-key against the LIVE manifest ───────────────
// The generator rebuilds `dist/audio/manifest.json` from the LOCAL
// (often empty/stale) copy, so it only contains the courses it just
// synthesized. Uploading that as-is would overwrite the server
// manifest and silence every previously-narrated course. This step
// fetches the live manifest and merges so existing narration always
// survives — no more manual merge, no more footgun.
//
// It also performs the one-time legacy re-key: pre-migration live
// entries are keyed by bare `lessonId`; we move them to
// `courseId/lessonId` (using each entry's own `.courseId`) so the
// composite-key runtime resolves them. Finally it emits a bare-id
// ALIAS for every globally-unique lesson id so already-shipped
// (pre-migration) desktop builds — which still do a bare lookup —
// keep working for all non-colliding content until they auto-update.
// Colliding ids (e.g. the same Exercism slug in two tracks) stay
// composite-only; old builds simply don't see the newer of the two,
// which is correct (they never had it).
//
// `--no-merge` skips this (escape hatch for a deliberate from-scratch
// manifest); default is always merge.
if (!has("--no-merge")) {
  const localManifestPath = join(DIST_AUDIO, "manifest.json");
  const local = JSON.parse(readFileSync(localManifestPath, "utf8"));
  const liveUrl = `${(local.cdnBase || "https://libre.academy/audio").replace(/\/+$/, "")}/manifest.json`;

  let live = null;
  try {
    const r = await fetch(liveUrl, { cache: "no-store" });
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    if (r.ok && ct.includes("json")) {
      live = await r.json();
    } else if (r.ok) {
      console.error(
        `[upload-audio] live manifest fetch returned non-JSON (${ct || "?"}) — treating as no existing manifest.`,
      );
    }
  } catch (e) {
    console.error(
      `[upload-audio] couldn't fetch live manifest (${e.message}) — proceeding with LOCAL only. ` +
        `If a manifest already exists on the server this could drop entries; abort if unsure.`,
    );
  }

  const merged = {};
  const reKey = (key, entry) => {
    // Already composite (has a slash) → keep. Otherwise promote a
    // legacy bare key to `courseId/lessonId` using the entry's own
    // courseId. If a legacy entry somehow lacks courseId, keep its
    // bare key (better than dropping it).
    if (key.includes("/")) return key;
    return entry && entry.courseId ? `${entry.courseId}/${key}` : key;
  };
  if (live && live.lessons) {
    for (const [k, v] of Object.entries(live.lessons)) merged[reKey(k, v)] = v;
  }
  // Local wins on conflict (it's the fresh synthesis of that lesson).
  for (const [k, v] of Object.entries(local.lessons || {})) {
    merged[reKey(k, v)] = v;
  }

  // Bare-id aliases for back-compat with pre-migration builds —
  // only when the bare id is globally unique among composite keys.
  const composite = Object.keys(merged).filter((k) => k.includes("/"));
  const bareCount = new Map();
  for (const k of composite) {
    const bare = k.slice(k.indexOf("/") + 1);
    bareCount.set(bare, (bareCount.get(bare) || 0) + 1);
  }
  let aliased = 0;
  for (const k of composite) {
    const bare = k.slice(k.indexOf("/") + 1);
    if (bareCount.get(bare) === 1 && !(bare in merged)) {
      merged[bare] = merged[k];
      aliased++;
    }
  }

  const out = {
    ...(live || {}),
    ...local,
    cdnBase: (live && live.cdnBase) || local.cdnBase,
    voice: (live && live.voice) || local.voice,
    voiceId: (live && live.voiceId) || local.voiceId,
    model: (live && live.model) || local.model,
    generatedAt: new Date().toISOString(),
    lessons: merged,
  };
  writeFileSync(localManifestPath, JSON.stringify(out, null, 2));

  const byCourse = {};
  for (const k of composite) {
    const cid = merged[k].courseId || "?";
    byCourse[cid] = (byCourse[cid] || 0) + 1;
  }
  console.error(
    `[upload-audio] merged manifest: ${composite.length} lessons across ` +
      `${Object.keys(byCourse).length} course(s) ` +
      `(${live ? Object.keys(live.lessons || {}).length : 0} live + ` +
      `${Object.keys(local.lessons || {}).length} local), ` +
      `${aliased} bare-id back-compat alias(es).`,
  );
}

// rsync flags:
//   -a       preserve perms/timestamps/symlinks
//   --stats  per-run summary at the end (BSD + GNU rsync compatible;
//            avoid --info=stats2 which is GNU-only)
//   --human-readable   pretty byte counts
//   NO --delete on this dir — we may have files on the server from
//   prior runs that aren't in the current dist/audio (e.g. older
//   courses generated on a different machine). Audio files are
//   content-hashed so stale files are harmless and just sit there
//   until you `make purge-audio` or similar. Keeps deploys safe.
const rsyncArgs = [
  "-a",
  "--stats",
  "--human-readable",
  DRY_RUN ? "--dry-run" : "",
  "-e",
  `"${sshOpts}"`,
].filter(Boolean);

if (courseFilter) {
  // Single-course mode: push just `dist/audio/<id>/` plus the
  // updated manifest. Skips the other course dirs entirely so a
  // big-catalog upload doesn't get rerun for a one-course tweak.
  const courseDir = join(DIST_AUDIO, courseFilter);
  if (!existsSync(courseDir)) {
    console.error(`[upload-audio] no dist/audio/${courseFilter}/ — generate first`);
    process.exit(2);
  }
  const args1 = `sshpass -e rsync ${rsyncArgs.join(" ")} "${courseDir}/" "${remoteHost}:${VPS_TARGET_DIR}/${courseFilter}/"`;
  const args2 = `sshpass -e rsync ${rsyncArgs.join(" ")} "${join(DIST_AUDIO, "manifest.json")}" "${remoteHost}:${VPS_TARGET_DIR}/manifest.json"`;
  run(args1, { SSHPASS: pwd });
  run(args2, { SSHPASS: pwd });
  console.error(
    `[upload-audio] ✓ pushed ${courseFilter} + manifest to ${VPS_TARGET_DIR}/`,
  );
} else {
  // Full sync: every course dir + manifest in one rsync pass.
  const cmd = `sshpass -e rsync ${rsyncArgs.join(" ")} "${DIST_AUDIO}/" "${remoteHost}:${VPS_TARGET_DIR}/"`;
  run(cmd, { SSHPASS: pwd });
  console.error(`[upload-audio] ✓ pushed dist/audio/ → ${VPS_TARGET_DIR}/`);
}

if (!DRY_RUN) {
  console.error(
    `[upload-audio] verify: curl -I https://libre.academy/audio/manifest.json`,
  );
}
