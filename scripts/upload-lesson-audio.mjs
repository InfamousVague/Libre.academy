#!/usr/bin/env node
/// Upload `dist/audio/` to the Fishbones Vultr VPS so the MP3s live
/// at `https://fishbones.academy/audio/<courseId>/<lessonId>.<sha>.mp3`.
///
/// Mirrors the academy site's deploy pattern (sshpass + rsync) so
/// auth flows through the same `api/.env`'s `VPS_PASSWORD`. The
/// remote target sits inside the academy webroot:
///
///   /var/www/fishbones-academy/audio/
///
/// Important nginx note: the academy's own deploy.mjs uses
/// `rsync --delete` against /var/www/fishbones-academy/, which would
/// wipe the audio dir on every site deploy. The companion patch in
/// this same change adds `--exclude=audio/` to that rsync so a site
/// deploy leaves the audio alone. (See
/// `~/Development/Web/fishbones-academy/scripts/deploy.mjs`.)
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
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DIST_AUDIO = join(ROOT, "dist/audio");

const VPS_HOST = process.env.VPS_HOST ?? "149.28.120.197";
const VPS_USER = process.env.VPS_USER ?? "root";
const VPS_PORT = process.env.VPS_PORT ?? "22";
const VPS_TARGET_DIR =
  process.env.VPS_AUDIO_TARGET_DIR ?? "/var/www/fishbones-academy/audio";

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
    `[upload-audio] verify: curl -I https://fishbones.academy/audio/manifest.json`,
  );
}
