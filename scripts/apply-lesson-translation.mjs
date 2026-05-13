#!/usr/bin/env node
/// Idempotently set a single locale's translation overlay on a single
/// lesson inside an installed challenge pack's `course.json`. Used by
/// the parallel-translation workflow (each fan-out agent calls this
/// per lesson + locale instead of hand-rolling its own JSON writer).
///
/// Usage:
///   node scripts/apply-lesson-translation.mjs \
///     <courseId> <lessonId> <locale> '<json-payload>'
///
/// Example:
///   node scripts/apply-lesson-translation.mjs \
///     challenges-assembly-handwritten easy-add-two-constants ru \
///     '{"title":"...","body":"...","hints":["..."]}'
///
/// Notes:
///   - `<courseId>` resolves to
///     `~/Library/Application Support/com.mattssoftware.kata/courses/<courseId>/course.json`.
///   - `<json-payload>` is a JSON-stringified `LessonTranslation`
///     (see `src/data/locales.ts`). It can carry `title`, `body`,
///     `objectives[]`, `hints[]`, `questions[]` — only the keys
///     applicable to the lesson kind. Code fences in `body` MUST be
///     preserved verbatim from the source.
///   - Multiple writers on the SAME course.json race — the parallel
///     workflow ensures one agent per courseId so this is safe.
///   - Idempotent: re-running with the same args overwrites the
///     existing overlay for that (lesson, locale). No de-dup logic
///     beyond "last write wins."

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const [, , courseId, lessonId, locale, payloadStr] = process.argv;
if (!courseId || !lessonId || !locale || !payloadStr) {
  console.error(
    "usage: apply-lesson-translation.mjs <courseId> <lessonId> <locale> '<json>'",
  );
  process.exit(2);
}
const validLocales = new Set(["ru", "es", "fr", "kr", "jp"]);
if (!validLocales.has(locale)) {
  console.error(`invalid locale: ${locale} (expected one of ${[...validLocales].join(",")})`);
  process.exit(2);
}

const coursePath = join(
  homedir(),
  "Library/Application Support/com.mattssoftware.kata/courses",
  courseId,
  "course.json",
);

let course;
try {
  course = JSON.parse(readFileSync(coursePath, "utf8"));
} catch (e) {
  console.error(`failed to read ${coursePath}: ${e.message}`);
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(payloadStr);
} catch (e) {
  console.error(`payload is not valid JSON: ${e.message}`);
  process.exit(2);
}

let found = false;
for (const ch of course.chapters ?? []) {
  for (const l of ch.lessons ?? []) {
    if (l.id !== lessonId) continue;
    found = true;
    l.translations = { ...(l.translations || {}) };
    l.translations[locale] = payload;
  }
}
if (!found) {
  console.error(`lesson '${lessonId}' not found in ${courseId}`);
  process.exit(1);
}

writeFileSync(coursePath, JSON.stringify(course, null, 2) + "\n");
console.log(`ok ${courseId} ${lessonId} ${locale}`);
