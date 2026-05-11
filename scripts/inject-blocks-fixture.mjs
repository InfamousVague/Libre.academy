#!/usr/bin/env node
/// One-off fixture: hand-authored blocks data for the "Convert
/// Celsius to Fahrenheit" exercise in the `a-to-zig` course
/// (chapter 1, lesson `convert-celsius`). Used as a Phase-1 smoke
/// test for the new BlocksView before the LLM-assisted
/// `generate-blocks.mjs` lands.
///
/// Patches BOTH locations so the lesson lights up immediately:
///   - The user's INSTALLED copy under `~/Library/Application
///     Support/com.mattssoftware.libre/courses/a-to-zig/course.json`.
///     This is what the running app reads, so this is the one that
///     makes the toggle appear after a reload.
///   - The BUNDLED `.libre` archive under
///     `src-tauri/resources/bundled-packs/a-to-zig.libre`.
///     Patching the bundle keeps Phase 1 testing reproducible
///     across reseeds — bumping SEED_VERSION (or a fresh install)
///     will see the blocks data without re-running this script.
///
/// Idempotent: re-running just rewrites the same payload.
///
/// Usage: `node scripts/inject-blocks-fixture.mjs`

import { readFile, writeFile, mkdtemp, rm, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const COURSE_ID = "a-to-zig";
const LESSON_ID = "convert-celsius";
const INSTALLED_COURSE = join(
  process.env.HOME ?? "",
  "Library/Application Support/com.mattssoftware.libre/courses",
  COURSE_ID,
  "course.json",
);
const BUNDLED_PACK = join(
  ROOT,
  "src-tauri/resources/bundled-packs",
  `${COURSE_ID}.libre`,
);

/// The fixture. Template is the canonical solution with four slots
/// punched out — one for the variable, three for the numeric
/// constants. Pool carries the four correct blocks plus three
/// plausible-but-wrong decoys (1.8 — the pre-computed ratio,
/// 273.15 — the Kelvin offset, `temp` — undeclared identifier).
const BLOCKS_FIXTURE = {
  template:
    '\nconst std = @import("std");\n\npub fn celsiusToFahrenheit(c: f64) f64 {\n    return __SLOT_input__ * __SLOT_num__ / __SLOT_den__ + __SLOT_offset__;\n}\n',
  slots: [
    { id: "input", expectedBlockId: "blk_c", hint: "variable" },
    { id: "num", expectedBlockId: "blk_9", hint: "numerator" },
    { id: "den", expectedBlockId: "blk_5", hint: "denominator" },
    { id: "offset", expectedBlockId: "blk_32", hint: "offset" },
  ],
  pool: [
    { id: "blk_c", code: "c" },
    { id: "blk_9", code: "9.0" },
    { id: "blk_5", code: "5.0" },
    { id: "blk_32", code: "32.0" },
    { id: "blk_dec_18", code: "1.8", decoy: true },
    { id: "blk_dec_273", code: "273.15", decoy: true },
    { id: "blk_dec_temp", code: "temp", decoy: true },
  ],
  prompt:
    "Drop the right blocks into each slot. Tap a block, then tap a slot — or drag.",
};

async function patchCourseJson(path) {
  if (!existsSync(path)) {
    console.warn(`[inject-blocks-fixture] missing: ${path} (skipping)`);
    return false;
  }
  const text = await readFile(path, "utf-8");
  const course = JSON.parse(text);
  if (!course.chapters) {
    throw new Error(`[inject-blocks-fixture] ${path} has no chapters array`);
  }
  let found = false;
  for (const ch of course.chapters) {
    for (const lesson of ch.lessons) {
      if (lesson.id === LESSON_ID) {
        if (lesson.kind !== "exercise" && lesson.kind !== "mixed") {
          throw new Error(
            `[inject-blocks-fixture] lesson ${LESSON_ID} is kind=${lesson.kind}, expected exercise/mixed`,
          );
        }
        lesson.blocks = BLOCKS_FIXTURE;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (!found) {
    throw new Error(
      `[inject-blocks-fixture] no lesson with id=${LESSON_ID} in ${path}`,
    );
  }
  // Pretty-print to match the existing convention of the
  // ingest pipeline.
  await writeFile(path, JSON.stringify(course, null, 2) + "\n", "utf-8");
  console.log(`[inject-blocks-fixture] patched ${path}`);
  return true;
}

async function patchBundledPack(packPath) {
  if (!existsSync(packPath)) {
    console.warn(`[inject-blocks-fixture] missing: ${packPath} (skipping)`);
    return;
  }
  // .libre is a zip. Extract → patch course.json → re-zip.
  const tmp = await mkdtemp(join(tmpdir(), "inject-blocks-"));
  try {
    execFileSync("unzip", ["-q", packPath, "-d", tmp]);
    const inner = join(tmp, "course.json");
    if (!existsSync(inner)) {
      throw new Error(
        `[inject-blocks-fixture] ${packPath} did not contain course.json`,
      );
    }
    await patchCourseJson(inner);
    // Re-zip. Replace the original archive in place. `-j` would flatten,
    // we want to preserve the file at the archive root, which is the
    // existing layout.
    const tmpZip = join(tmp, "out.libre");
    const cwd = process.cwd();
    process.chdir(tmp);
    try {
      execFileSync("zip", ["-q", "-X", tmpZip, "course.json", "cover.jpg"], {
        stdio: ["ignore", "ignore", "inherit"],
      });
    } finally {
      process.chdir(cwd);
    }
    await copyFile(tmpZip, packPath);
    console.log(`[inject-blocks-fixture] re-bundled ${packPath}`);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

async function main() {
  // Patch the installed copy first — that's what the running app
  // reads. Bundle patch second so a future reseed picks up the same
  // data.
  const installed = await patchCourseJson(INSTALLED_COURSE);
  if (!installed) {
    console.warn(
      `[inject-blocks-fixture] no installed course at ${INSTALLED_COURSE} — install '${COURSE_ID}' first or run the desktop app.`,
    );
  }
  await patchBundledPack(BUNDLED_PACK);
  console.log(
    `\n[inject-blocks-fixture] done. Reload the app to see the toggle on lesson '${LESSON_ID}' in '${COURSE_ID}'.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
