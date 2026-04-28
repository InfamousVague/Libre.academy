#!/usr/bin/env node
/// Re-run Shiki across every micropuzzle card that's missing
/// `lineHtml` in the staged starter-courses JSON. Cleanup agents
/// set `lineHtml: null` after editing a card's `line` so the
/// build re-tokenises against the new content; this script does
/// the re-tokenising.
///
/// Idempotent: cards that already have `lineHtml` are left alone.
/// Run after the cleanup agents land their edits, before
/// `sync-drills-to-local.mjs`.

import { codeToHtml } from "shiki";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STAGED = join(ROOT, "public", "starter-courses");

const SHIKI_THEME = "github-dark";
const SLOT_RE = /__SLOT_([A-Za-z0-9_-]+)__/g;

function shikiLang(language) {
  switch (language) {
    case "reactnative":
      return "tsx";
    case "threejs":
      return "javascript";
    case "vyper":
      return "python";
    case "bun":
      return "typescript";
    case "assembly":
      return "asm";
    default:
      return language;
  }
}

async function prerenderLine(line, language) {
  const slotIds = [];
  const sentinel = (idx) => `__FBSLOT${idx}__`;
  let prepared = line.replace(SLOT_RE, (_m, id) => {
    const idx = slotIds.length;
    slotIds.push(id);
    return sentinel(idx);
  });
  let html;
  try {
    html = await codeToHtml(prepared, {
      lang: shikiLang(language),
      theme: SHIKI_THEME,
    });
  } catch {
    html = `<pre><code>${escapeHtml(prepared)}</code></pre>`;
  }
  for (let i = 0; i < slotIds.length; i++) {
    const span = `<span data-mp-slot="${slotIds[i]}" class="m-mp__slot m-mp__slot--empty"></span>`;
    html = html.replace(sentinel(i), span);
  }
  return html;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main() {
  if (!existsSync(STAGED)) {
    console.error(`[rerender-shiki] no staged courses at ${STAGED}`);
    process.exit(1);
  }
  const files = (await readdir(STAGED)).filter(
    (f) => f.endsWith(".json") && f !== "manifest.json",
  );
  let totalRendered = 0;
  for (const f of files) {
    const path = join(STAGED, f);
    const course = JSON.parse(await readFile(path, "utf-8"));
    if (!course.chapters) continue;
    let changed = 0;
    for (const ch of course.chapters) {
      for (const lesson of ch.lessons) {
        if (lesson.kind !== "micropuzzle") continue;
        const lang = lesson.language || course.language;
        for (const card of lesson.challenges || []) {
          if (card.lineHtml) continue;
          card.lineHtml = await prerenderLine(card.line, lang);
          changed += 1;
        }
      }
    }
    if (changed > 0) {
      await writeFile(path, JSON.stringify(course, null, 2), "utf-8");
      console.log(`  ✓ ${course.id || f}: re-rendered ${changed} card(s)`);
      totalRendered += changed;
    }
  }
  console.log("");
  console.log(`[rerender-shiki] total cards re-rendered: ${totalRendered}`);
}

main().catch((err) => {
  console.error("[rerender-shiki] failed:", err);
  process.exit(1);
});
