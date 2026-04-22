/**
 * CLI debug harness for the ingest pipeline.
 *
 * Reads the EXISTING app cache (the same directory Kata's Tauri pipeline
 * writes to), picks out a specific lesson's artifacts, and lets you re-run
 * just that lesson against the Anthropic API without re-ingesting the
 * whole book. Useful when one lesson blows up with a JSON parse error and
 * you want to inspect the raw response or try a few re-rolls quickly.
 *
 * Usage:
 *
 *   # List everything in a book's cache
 *   tsx debug-lesson.ts list rust-book
 *
 *   # Show the cached outline for a chapter
 *   tsx debug-lesson.ts outline rust-book 7
 *
 *   # Re-request a specific lesson, print raw response to stdout
 *   tsx debug-lesson.ts regen rust-book create-cargo-project
 *
 *   # Same as regen, but also try to parse and show parse error location
 *   tsx debug-lesson.ts regen rust-book create-cargo-project --parse
 *
 * Requires:
 *   - ANTHROPIC_API_KEY in env (or read from Kata's settings.json)
 *   - The book's cache dir already populated (run at least one ingest first)
 */

import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const APP_DATA_DIR = join(
  homedir(),
  "Library",
  "Application Support",
  "com.mattssoftware.kata",
);
const CACHE_DIR = join(APP_DATA_DIR, "ingest-cache");

async function resolveApiKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const raw = await readFile(join(APP_DATA_DIR, "settings.json"), "utf8");
    const parsed = JSON.parse(raw) as { anthropic_api_key?: string };
    if (parsed.anthropic_api_key) return parsed.anthropic_api_key;
  } catch {
    /* fall through */
  }
  throw new Error(
    "No Anthropic API key found. Set ANTHROPIC_API_KEY env var or configure one in Kata's Settings.",
  );
}

function bookCache(bookId: string) {
  const dir = join(CACHE_DIR, bookId);
  if (!existsSync(dir)) {
    throw new Error(`Cache not found at ${dir}. Run an ingest for this book first.`);
  }
  return dir;
}

interface LessonStub {
  id: string;
  kind: "reading" | "exercise" | "quiz" | "mixed";
  title: string;
  intent: string;
}

async function listCache(bookId: string) {
  const dir = bookCache(bookId);
  console.log(`Cache: ${dir}`);
  const walk = async (p: string, depth = 0) => {
    const entries = await readdir(p, { withFileTypes: true });
    for (const e of entries) {
      const fp = join(p, e.name);
      const rel = fp.slice(dir.length + 1);
      if (e.isDirectory()) {
        console.log(`  ${"  ".repeat(depth)}${rel}/`);
        await walk(fp, depth + 1);
      } else {
        const stat = await readFile(fp).then((b) => b.length);
        console.log(
          `  ${"  ".repeat(depth)}${rel}  ${formatBytes(stat)}`,
        );
      }
    }
  };
  await walk(dir);
}

async function showOutline(bookId: string, chapterNum: number) {
  const dir = bookCache(bookId);
  const pad = String(chapterNum).padStart(2, "0");
  const path = join(dir, "outlines", `chapter-${pad}.json`);
  const raw = await readFile(path, "utf8");
  const stubs = JSON.parse(raw) as LessonStub[];
  console.log(`Chapter ${chapterNum} outline (${stubs.length} stubs):`);
  for (const [i, s] of stubs.entries()) {
    console.log(`  ${i + 1}. [${s.kind.padEnd(8)}] ${s.title}`);
    console.log(`     id: ${s.id}`);
    console.log(`     intent: ${s.intent}`);
  }
}

/// Walk every outlines/*.json file in the book cache looking for a stub
/// with this id. Returns { stub, chapterIdx, chapterTitle, chapterMd } or
/// throws if not found.
async function locateStub(bookId: string, lessonId: string) {
  const dir = bookCache(bookId);
  const outlinesDir = join(dir, "outlines");
  if (!existsSync(outlinesDir)) {
    throw new Error(`No outlines in cache yet: ${outlinesDir}`);
  }
  const files = (await readdir(outlinesDir)).filter((f) => f.endsWith(".json")).sort();
  for (const f of files) {
    const raw = await readFile(join(outlinesDir, f), "utf8");
    const stubs = JSON.parse(raw) as LessonStub[];
    const match = stubs.find((s) => s.id === lessonId);
    if (match) {
      // chapter-NN.json → NN
      const num = parseInt(f.replace(/\D/g, ""), 10);
      const pad = String(num).padStart(2, "0");
      const cleanPath = join(dir, "clean", `chapter-${pad}.md`);
      const chapterMd = existsSync(cleanPath)
        ? await readFile(cleanPath, "utf8")
        : "";
      return {
        stub: match,
        chapterIdx: num,
        chapterTitle: firstHeading(chapterMd) ?? `Chapter ${num}`,
        chapterMd,
      };
    }
  }
  throw new Error(`Lesson "${lessonId}" not found in any outline under ${outlinesDir}.`);
}

function firstHeading(md: string): string | null {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/// Reference-truncation guard mirroring pipeline.ts — keep this in sync.
const MAX_REFERENCE_CHARS = 500_000;
function fitReference(md: string): string {
  if (md.length <= MAX_REFERENCE_CHARS) return md;
  const window = md.slice(0, MAX_REFERENCE_CHARS);
  let idx = window.lastIndexOf("\n## ");
  if (idx < MAX_REFERENCE_CHARS * 0.7) idx = window.lastIndexOf("\n\n");
  if (idx < MAX_REFERENCE_CHARS * 0.7) idx = MAX_REFERENCE_CHARS;
  return (
    window.slice(0, idx) +
    `\n\n*(Reference truncated — chapter was ${Math.round(
      md.length / 1000,
    )}KB, cap is ${Math.round(MAX_REFERENCE_CHARS / 1000)}KB.)*\n`
  );
}

const GENERATE_SYSTEM = `You author one Codecademy-style lesson at a time for the Kata app. Given the chapter's cleaned Markdown as reference, the target language, and a lesson stub (id, kind, title, intent), return a single JSON object matching one of these shapes depending on kind:

READING:
  { "id": "...", "kind": "reading", "title": "...", "body": "markdown with fenced code blocks" }

EXERCISE:
  { "id": "...", "kind": "exercise", "title": "...", "language": "...", "body": "...", "starter": "...", "solution": "...", "tests": "..." }

QUIZ:
  { "id": "...", "kind": "quiz", "title": "...", "body": "...", "questions": [...] }

Return ONLY the JSON object. No preamble, no code fences.`;

async function regen(bookId: string, lessonId: string, parse: boolean) {
  const apiKey = await resolveApiKey();
  const located = await locateStub(bookId, lessonId);
  console.log(
    `Found stub in chapter ${located.chapterIdx} "${located.chapterTitle}":`,
  );
  console.log(`  kind:   ${located.stub.kind}`);
  console.log(`  title:  ${located.stub.title}`);
  console.log(`  intent: ${located.stub.intent}`);
  console.log(`  ref md: ${formatBytes(located.chapterMd.length)}`);
  console.log();

  // Read the user's model from settings.json (same as what the app uses)
  // so debugging matches production behavior.
  let model = "claude-opus-4-5";
  try {
    const raw = await readFile(join(APP_DATA_DIR, "settings.json"), "utf8");
    const parsed = JSON.parse(raw) as { anthropic_model?: string };
    if (parsed.anthropic_model) model = parsed.anthropic_model;
  } catch {
    /* fall through */
  }
  console.log(`Using model: ${model}`);
  console.log(`Calling Anthropic…`);
  console.log();

  const client = new Anthropic({ apiKey });
  const refMd = fitReference(located.chapterMd);
  const prompt = `Language: rust\nChapter: ${located.chapterTitle}\nStub: ${JSON.stringify(
    located.stub,
  )}\n\n---\n\nChapter source:\n\n${refMd}`;

  // Mirrors max_tokens_for() in src-tauri/src/llm.rs. Sonnet 4.x / Opus 4.x
  // cap at 64K; only legacy Sonnet 3.7 goes to 128K with the beta header.
  const maxTokens =
    model.includes("sonnet-3-7") || model.includes("sonnet-3.7")
      ? 128_000
      : model.includes("haiku")
      ? 32_000
      : 64_000;
  const started = Date.now();
  const resp = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: GENERATE_SYSTEM,
    messages: [{ role: "user", content: prompt }],
    // @ts-expect-error: beta headers typed loosely
    betas: ["output-128k-2025-02-19"],
  });
  const elapsed = Date.now() - started;

  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");
  console.log(
    `=== response (${elapsed}ms, stop_reason=${resp.stop_reason}, ${formatBytes(
      text.length,
    )}, ${resp.usage.input_tokens} in / ${resp.usage.output_tokens} out) ===`,
  );
  console.log();

  if (parse) {
    try {
      const parsed = JSON.parse(text);
      console.log("✓ JSON parsed cleanly");
      console.log(`  kind:  ${parsed.kind}`);
      console.log(`  id:    ${parsed.id}`);
      console.log(`  title: ${parsed.title}`);
      if (parsed.kind === "exercise") {
        console.log(`  starter: ${formatBytes((parsed.starter ?? "").length)}`);
        console.log(`  solution: ${formatBytes((parsed.solution ?? "").length)}`);
        console.log(`  tests: ${formatBytes((parsed.tests ?? "").length)}`);
      }
    } catch (e) {
      const err = e as Error;
      console.log(`✗ JSON.parse failed: ${err.message}`);
      const posMatch = err.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1], 10);
        console.log();
        console.log(`--- context around position ${pos} ---`);
        console.log(text.slice(Math.max(0, pos - 150), pos + 150));
        console.log();
      }
    }
  }

  // Also dump to a debug file for easier inspection.
  const dumpDir = join(bookCache(bookId), "debug");
  await mkdir(dumpDir, { recursive: true });
  const dumpPath = join(dumpDir, `${lessonId}.regen.txt`);
  await writeFile(dumpPath, text);
  console.log();
  console.log(`Full raw written to ${dumpPath}`);
  console.log();
  // Print the text with line numbers so the user can actually see it.
  const lines = text.split("\n");
  console.log(`=== raw content (${lines.length} lines) ===`);
  for (const [i, line] of lines.entries()) {
    console.log(`${String(i + 1).padStart(4, " ")} | ${line}`);
  }
}

async function main() {
  const [cmd, bookId, arg1, ...rest] = process.argv.slice(2);
  if (!cmd || !bookId) {
    console.error(
      "Usage:\n" +
        "  tsx debug-lesson.ts list <bookId>\n" +
        "  tsx debug-lesson.ts outline <bookId> <chapterNum>\n" +
        "  tsx debug-lesson.ts regen <bookId> <lessonId> [--parse]",
    );
    process.exit(1);
  }
  try {
    if (cmd === "list") {
      await listCache(bookId);
    } else if (cmd === "outline") {
      if (!arg1) throw new Error("Missing chapterNum");
      await showOutline(bookId, parseInt(arg1, 10));
    } else if (cmd === "regen") {
      if (!arg1) throw new Error("Missing lessonId");
      const parse = rest.includes("--parse");
      await regen(bookId, arg1, parse);
    } else {
      throw new Error(`Unknown command: ${cmd}`);
    }
  } catch (e) {
    console.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}

main();
