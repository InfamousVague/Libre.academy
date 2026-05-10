#!/usr/bin/env node
/// Merge a separately-authored translations overlay into a course JSON.
///
/// Workflow:
///   1. Author a `<courseId>.translations.json` file with translations
///      grouped by locale → chapter → lesson. The file lives next to
///      the course JSON in `public/starter-courses/i18n/<courseId>.json`
///      so the merge script knows where to find it.
///   2. Run `node scripts/apply-translations.mjs <courseId>` and the
///      script splices each translation under the matching
///      `translations[locale]` field on the course / chapter / lesson.
///
/// Idempotent — re-running with a fully-merged overlay is a no-op
/// (it overwrites the same fields with the same values). Safe to
/// re-run after editing any single string in the overlay.
///
/// Overlay shape:
///   {
///     "ru": {
///       "course": { "title": "...", "description": "..." },
///       "chapters": {
///         "intro": {
///           "title": "Введение",
///           "lessons": {
///             "what-is-hellotrade": {
///               "title": "Что такое HelloTrade?",
///               "body": "...markdown...",
///               "objectives": ["...", "..."],
///               "hints": ["...", "..."],
///               "questions": [{ "prompt": "...", "options": ["...", "..."], "explanation": "..." }]
///             }
///           }
///         }
///       }
///     },
///     "es": { ... },
///     ...
///   }
///
/// Missing keys at any level are skipped (not deleted). To clear a
/// translation, edit the course JSON directly — the overlay is
/// additive only, so a partial overlay never destroys existing data.

import { readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === "--help") {
  console.log(`Usage: apply-translations.mjs <courseId-or-path> [--locales ru,es,...]`);
  process.exit(args[0] === "--help" ? 0 : 1);
}

const courseRef = args[0];
const localesArg = parseFlag(args, "--locales");
const filter = localesArg ? new Set(localesArg.split(",").map((s) => s.trim())) : null;

function resolveCoursePath(ref) {
  if (ref.endsWith(".json") && existsSync(ref)) return path.resolve(ref);
  const starter = path.join(REPO_ROOT, "public", "starter-courses", `${ref}.json`);
  if (existsSync(starter)) return starter;
  throw new Error(`Course not found: ${ref}`);
}

async function resolveOverlayFiles(courseFile) {
  const dir = path.dirname(courseFile);
  const id = path.basename(courseFile, ".json");
  const i18nDir = path.join(dir, "i18n");
  if (!existsSync(i18nDir)) return [];
  // Match `<id>.json` (the canonical spine) AND any sibling
  // `<id>-<suffix>.json` (chapter overlays, body-only patches, etc.).
  // Letting the directory hold many small overlays per course keeps
  // each one editable without merging into a 5000-line monolith.
  const entries = await readdir(i18nDir);
  const matched = entries
    .filter((e) => e === `${id}.json` || e.startsWith(`${id}-`))
    .filter((e) => e.endsWith(".json"))
    .sort();
  return matched.map((e) => path.join(i18nDir, e));
}

const courseFile = resolveCoursePath(courseRef);
const overlayFiles = await resolveOverlayFiles(courseFile);

if (overlayFiles.length === 0) {
  console.error(
    `No overlay files found under public/starter-courses/i18n/ matching <${path.basename(courseFile, ".json")}>*.json`,
  );
  process.exit(1);
}

const course = JSON.parse(await readFile(courseFile, "utf8"));

// Deep-merge each overlay file in lex order; later files win on
// per-key conflicts. The lex sort is intentional: name files like
// `hellotrade.json` (spine) → `hellotrade-01-intro.json` (chapter
// patches) so reapplication order is predictable when iterating.
const overlay = {};
for (const f of overlayFiles) {
  const part = JSON.parse(await readFile(f, "utf8"));
  deepMerge(overlay, part);
}
console.log(
  `📚 Merging ${overlayFiles.length} overlay file(s) → ${path.relative(REPO_ROOT, courseFile)}`,
);
for (const f of overlayFiles) console.log(`   • ${path.relative(REPO_ROOT, f)}`);

let merged = 0;

for (const [locale, perLocale] of Object.entries(overlay)) {
  if (filter && !filter.has(locale)) continue;
  // Course root.
  if (perLocale.course) {
    course.translations ??= {};
    course.translations[locale] ??= {};
    if (perLocale.course.title)
      course.translations[locale].title = perLocale.course.title;
    if (perLocale.course.description)
      course.translations[locale].description = perLocale.course.description;
    merged += 1;
  }
  // Chapters + lessons.
  for (const ch of course.chapters) {
    const chOverlay = perLocale.chapters?.[ch.id];
    if (!chOverlay) continue;
    if (chOverlay.title) {
      ch.translations ??= {};
      ch.translations[locale] ??= {};
      ch.translations[locale].title = chOverlay.title;
      merged += 1;
    }
    for (const l of ch.lessons) {
      const lOverlay = chOverlay.lessons?.[l.id];
      if (!lOverlay) continue;
      l.translations ??= {};
      l.translations[locale] ??= {};
      const t = l.translations[locale];
      if (lOverlay.title) t.title = lOverlay.title;
      if (lOverlay.body) t.body = lOverlay.body;
      if (lOverlay.objectives) t.objectives = lOverlay.objectives;
      if (lOverlay.hints) t.hints = lOverlay.hints;
      if (lOverlay.questions) t.questions = lOverlay.questions;
      merged += 1;
    }
  }
}

await writeFile(courseFile, JSON.stringify(course, null, 2));
console.log(
  `✅ ${merged} translation block(s) merged into ${path.relative(REPO_ROOT, courseFile)}`,
);

function parseFlag(argv, name) {
  const i = argv.indexOf(name);
  if (i === -1) return null;
  return argv[i + 1] || null;
}

/// Recursive merge — overlay values overwrite, but nested objects
/// merge key-by-key. Arrays are replaced wholesale (a partial
/// translation of a 4-question quiz needs to ship the full 4-element
/// array; merging by index would silently leave stale English in
/// half the slots).
function deepMerge(dst, src) {
  for (const [k, v] of Object.entries(src)) {
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      dst[k] &&
      typeof dst[k] === "object" &&
      !Array.isArray(dst[k])
    ) {
      deepMerge(dst[k], v);
    } else {
      dst[k] = v;
    }
  }
}
