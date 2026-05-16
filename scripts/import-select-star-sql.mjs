/// Import "Select Star SQL" (https://selectstarsql.com /
/// github.com/zichongkao/selectstarsql) as a Libre SQL course — a
/// guided, narrative SQL *book* querying the Texas death-row
/// dataset. Complements the existing hand-written SQL challenges
/// pack (kata grab-bag) with a read-along course flavour.
///
/// Licensing: prose CC-BY-SA 4.0 (Zi Chong Kao), code + datasets
/// CC0. Surfaced in the course `attribution` block.
///
/// Pipeline
/// ────────
///   1. Compact seed (`/tmp/ssql-build/seed.sql`) — the full 553-row
///      `executions` table with `last_statement` truncated to 60
///      chars so the per-lesson inlined seed stays ~72 KB (the
///      Libre SQL runtime seeds via the executed buffer; there's
///      no shared-fixture field, so the seed rides each lesson the
///      same way every challenges-sql lesson already does).
///   2. Each chapter `.md` is split at `<sql-exercise>` custom
///      elements. Prose between exercises (HTML-ish Jekyll markup)
///      is converted to clean markdown for the lesson body.
///   3. Each `<sql-exercise>` → one `exercise` lesson:
///        starter  = seed + `-- <question>` + data-default-text
///        solution = seed + expect-annotated reference query
///        tests    = seed + expect-annotated reference query
///      matching the exact shape of challenges-sql-handwritten so
///      the platform's existing SQL grading applies unchanged.
///   4. Expected output (`-- expect: N row(s), {firstRow}`) is
///      captured by running the reference query against a canonical
///      SQLite DB built from the SAME seed we ship, so grading is
///      self-consistent regardless of dataset trimming.
///
/// `frontmatter.md` becomes a reading-only intro lesson.
/// `longtail.md` is skipped for v1 — it uses the 14 MB congress
/// DB which can't be inlined; a future pass can add it behind a
/// shared-fixture mechanism.
///
/// Usage: node scripts/import-select-star-sql.mjs
/// (expects /tmp/selectstarsql cloned + /tmp/ssql-build/{seed.sql,
///  canon.db} built — see the prep steps in the chat/runbook.)

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const REPO = "/tmp/selectstarsql";
const SEED = readFileSync("/tmp/ssql-build/seed.sql", "utf8").trim();
const CANON_DB = "/tmp/ssql-build/canon.db";
const OUT_DIR = join(
  homedir(),
  "Library/Application Support/com.mattssoftware.libre/courses/select-star-sql",
);

// Chapter order + titles. frontmatter is reading-only; the three
// deathrow chapters carry the exercises. longtail (congress) is
// deliberately excluded for v1.
const CHAPTERS = [
  { file: "frontmatter.md", title: "Frontmatter", readingOnly: true },
  { file: "beazley.md", title: "Beazley's Last Statement" },
  { file: "hiatuses.md", title: "Hiatuses" },
  { file: "innocence.md", title: "Innocence" },
];

// ── HTML/Jekyll → clean markdown ────────────────────────────────
// The book's prose is markdown sprinkled with hand HTML (sideNote
// divs, codeblock spans, anchor tags). Libre's markdown-it runs
// with `html: false`, so raw HTML would be stripped to nothing —
// convert the constructs we rely on into markdown equivalents.
function htmlToMarkdown(src) {
  let s = src;
  // Drop Jekyll/anchor noise.
  s = s.replace(/<a\s+name="[^"]*"\s*>\s*<\/a>/gi, "");
  s = s.replace(/<br\s*\/?>/gi, "\n\n");
  // sideNote div → a NOTE callout. Pull its <h3> as the title and
  // the inner <p>s as the body.
  s = s.replace(
    /<div class="sideNote">([\s\S]*?)<\/div>/gi,
    (_m, inner) => {
      const h = /<h3>([\s\S]*?)<\/h3>/i.exec(inner);
      const title = h ? stripTags(h[1]).trim() : "Note";
      const paras = [...inner.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((m) =>
        stripTags(m[1]).replace(/\s+/g, " ").trim(),
      );
      const bodyLines = (paras.length ? paras : [stripTags(inner).trim()])
        .filter(Boolean)
        .map((l) => `> ${l}`)
        .join("\n>\n");
      return `\n\n> [!NOTE]\n> **${title}**\n>\n${bodyLines}\n\n`;
    },
  );
  // Inline code spans the book uses for keyword chips.
  s = s.replace(
    /<code class=['"]codeblock['"]>([\s\S]*?)<\/code>/gi,
    (_m, c) => "`" + decodeEntities(stripTags(c)).trim() + "`",
  );
  s = s.replace(/<code>([\s\S]*?)<\/code>/gi, (_m, c) => "`" + decodeEntities(stripTags(c)) + "`");
  // Any stray remaining tags → drop, keep text.
  s = stripTags(s);
  s = decodeEntities(s);
  // Collapse 3+ newlines.
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "");
}
function decodeEntities(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// Parse a `<sql-exercise .../>` (self-closing or paired) tag's
// attributes. Attribute values are HTML-escaped in the source.
function parseExerciseAttrs(tag) {
  const attrs = {};
  const re = /data-([a-z-]+)="([\s\S]*?)"/gi;
  let m;
  while ((m = re.exec(tag)) !== null) {
    attrs[m[1]] = decodeEntities(m[2]);
  }
  return attrs;
}

// Run a reference query against the canonical DB and synthesise the
// `-- expect:` line the Libre SQL harness understands. Returns null
// when the query isn't a single result-producing statement we can
// pin (multi-statement, DDL-only, or a sqlite error) — the lesson
// then ships ungraded-but-runnable.
function deriveExpect(query) {
  const q = query.trim().replace(/;+\s*$/, "");
  if (!/^\s*(SELECT|WITH)\b/i.test(q)) return null;
  if (q.includes(";")) return null; // single statement only
  let rows;
  try {
    const out = execFileSync("sqlite3", ["-json", CANON_DB, q], {
      encoding: "utf8",
      timeout: 10000,
      maxBuffer: 32 * 1024 * 1024,
    }).trim();
    rows = out ? JSON.parse(out) : [];
  } catch {
    return null;
  }
  if (!Array.isArray(rows)) return null;
  const n = rows.length;
  const first = n > 0 ? rows[0] : null;
  // Keep the first-row JSON compact + bounded (long last_statement
  // text would bloat the manifest and the harness only diffs the
  // first row's scalar columns).
  let firstStr = "";
  if (first && typeof first === "object") {
    const trimmed = {};
    for (const [k, v] of Object.entries(first)) {
      trimmed[k] =
        typeof v === "string" && v.length > 80 ? v.slice(0, 80) : v;
    }
    firstStr = ", " + JSON.stringify(trimmed);
  }
  return `-- expect: ${n} row${n === 1 ? "" : "s"}${firstStr}\n${q};`;
}

function slugify(s) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "lesson"
  );
}

function buildCourse() {
  const chapters = [];
  let totalLessons = 0;
  let graded = 0;

  for (const ch of CHAPTERS) {
    const raw = readFileSync(join(REPO, ch.file), "utf8");
    // Strip Jekyll front-matter.
    const body = raw.replace(/^---[\s\S]*?---\s*/, "");

    if (ch.readingOnly) {
      chapters.push({
        title: ch.title,
        lessons: [
          {
            id: "frontmatter",
            title: "Introduction",
            kind: "reading",
            body:
              `# ${ch.title}\n\n` +
              htmlToMarkdown(body) +
              `\n\n> [!NOTE]\n> This course queries a real dataset of 553 Texas executions. ` +
              `Prose © Zi Chong Kao (CC-BY-SA 4.0); dataset CC0. ` +
              `Source: selectstarsql.com`,
            topic: "intro",
          },
        ],
      });
      totalLessons += 1;
      continue;
    }

    // Split into [prose, <sql-exercise>, prose, …] segments.
    const parts = body.split(
      /(<sql-exercise[\s\S]*?<\/sql-exercise>|<sql-exercise[\s\S]*?\/>)/i,
    );
    const lessons = [];
    let proseBuffer = "";
    let exIdx = 0;
    // Track the most recent `## Heading` so lesson titles read like
    // the book's section names rather than "Exercise 7".
    let lastHeading = ch.title;

    const flushHeadingFrom = (text) => {
      const heads = [...text.matchAll(/^##+\s+(.+)$/gm)];
      if (heads.length) lastHeading = stripTags(heads[heads.length - 1][1]).trim();
    };

    for (const seg of parts) {
      if (/^<sql-exercise/i.test(seg)) {
        exIdx += 1;
        const a = parseExerciseAttrs(seg);
        // Attribute text carries inline HTML (<code>…</code>) too —
        // run it through the same converter so nothing leaks into
        // the markdown body (markdown-it has html:false → raw tags
        // would just vanish, dropping the words inside them).
        const question = htmlToMarkdown((a.question || "").trim());
        const comment = htmlToMarkdown((a.comment || "").trim());
        const defaultText = (a["default-text"] || "").trim();
        const solutionSql = (a.solution || defaultText || "").trim();

        const proseMd = htmlToMarkdown(proseBuffer);
        proseBuffer = "";

        const title =
          `${lastHeading} — ${question ? question.replace(/\s+/g, " ").slice(0, 60) : "Exercise " + exIdx}`.trim();

        const bodyParts = [`# ${lastHeading}`, ""];
        if (proseMd) bodyParts.push(proseMd, "");
        if (question) bodyParts.push(`## Your task\n\n${question}`, "");
        if (comment) bodyParts.push(`> [!TIP]\n> ${comment}`, "");

        const starter =
          `-- Schema + data (pre-loaded — leave this in place)\n${SEED}\n\n` +
          `-- Your query (${question.replace(/\n/g, " ")}):\n` +
          (defaultText || "SELECT * FROM executions LIMIT 5;");

        const expectBlock = deriveExpect(solutionSql);
        const refSql = solutionSql || defaultText;
        const solution =
          `-- Schema + data (pre-loaded)\n${SEED}\n\n` +
          (expectBlock
            ? expectBlock
            : `-- (exploratory — run to view results)\n${refSql}${/;\s*$/.test(refSql) ? "" : ";"}`);
        // tests = ONLY the expect-annotated reference query. The
        // Libre SQL harness runs `code` (the learner buffer, which
        // carries the seed via `starter`) first, then executes just
        // the statements in `tests` that have a `-- expect:` comment
        // — bare DDL here is parsed-then-skipped, so inlining the
        // 72 KB seed a third time is pure dead weight (~1.5 MB
        // across the course). Omit it.
        const tests = expectBlock || ""; // "" → ungraded but runnable

        if (expectBlock) graded += 1;

        lessons.push({
          id: `${slugify(ch.file.replace(/\.md$/, ""))}-${exIdx}-${slugify(question || "ex")}`,
          title,
          kind: "exercise",
          language: "sql",
          body: bodyParts.join("\n").trim(),
          starter,
          solution,
          tests,
          difficulty: "medium",
          topic: ch.file.replace(/\.md$/, ""),
        });
        totalLessons += 1;
      } else {
        flushHeadingFrom(seg);
        proseBuffer += seg;
      }
    }

    // Trailing prose after the last exercise → a short reading
    // coda so the chapter's closing narrative isn't dropped.
    const tailMd = htmlToMarkdown(proseBuffer);
    if (tailMd && tailMd.length > 120) {
      lessons.push({
        id: `${slugify(ch.file.replace(/\.md$/, ""))}-wrap-up`,
        title: `${ch.title} — Wrap-up`,
        kind: "reading",
        body: `# ${ch.title} — Wrap-up\n\n${tailMd}`,
        topic: ch.file.replace(/\.md$/, ""),
      });
      totalLessons += 1;
    }

    chapters.push({ title: ch.title, lessons });
  }

  return { chapters, totalLessons, graded };
}

function main() {
  if (!existsSync(REPO) || !existsSync(CANON_DB)) {
    console.error(
      "Missing /tmp/selectstarsql clone or /tmp/ssql-build/canon.db — run the prep steps first.",
    );
    process.exit(1);
  }
  const { chapters, totalLessons, graded } = buildCourse();
  const course = {
    id: "select-star-sql",
    title: "Select Star SQL",
    author: "Zi Chong Kao",
    language: "sql",
    packType: "course",
    description:
      "A guided, narrative introduction to SQL — learn to query by investigating a real dataset of Texas death-row executions. Ported from selectstarsql.com. Prose © Zi Chong Kao under CC-BY-SA 4.0; the dataset is released CC0. Each lesson runs against the dataset live in your browser via SQLite/WASM.",
    attribution: {
      upstream: "https://github.com/zichongkao/selectstarsql",
      site: "https://selectstarsql.com",
      proseLicense: "CC-BY-SA-4.0",
      dataLicense: "CC0-1.0",
      author: "Zi Chong Kao",
    },
    chapters,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, "course.json"),
    JSON.stringify(course, null, 2) + "\n",
  );
  console.log(
    `✓ select-star-sql: ${chapters.length} chapters × ${totalLessons} lessons ` +
      `(${graded} auto-graded SQL exercises) → ${join(OUT_DIR, "course.json")}`,
  );
}

main();
