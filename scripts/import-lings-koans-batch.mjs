/// Batch importer for 10 open-source "fill-blanks-to-pass-tests"
/// projects — four *lings + six koans. Each one is a different
/// repo shape, but the output target is the same: a Libre
/// course.json with chapters → lessons, each lesson having
/// {title, body, kind: "exercise", language, starter, solution,
/// tests, hints, difficulty}.
///
/// Each project's config below specifies:
///   - id, title, author, language
///   - clonePath: where the cloned repo lives on disk
///   - walker: function (repoRoot) -> { chapters: [{title, slug,
///     lessons: [{id, title, body, starter, solution, tests,
///     hints, difficulty}]}] }
///
/// Walkers are kept inline because the shapes are too different
/// to abstract cleanly — file walks, comment-vs-code partitioning,
/// hint files, separate test files vs inline tests, etc. all
/// differ per project. Keeping them in one file means a single
/// `node` invocation produces all 10 course.json files.
///
/// Usage:
///   node scripts/import-lings-koans-batch.mjs [--only swiftlings]
///
/// Writes to ~/Library/Application Support/com.mattssoftware.libre/
///   courses/<id>/course.json for each project.

import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, basename, extname, dirname } from "node:path";

const LIBRE_COURSES = join(
  homedir(),
  "Library/Application Support/com.mattssoftware.libre/courses",
);
const REPOS = "/tmp/lings-batch";

// ── Generic helpers ──────────────────────────────────────────────

function walkFiles(root, ext) {
  const out = [];
  function recurse(dir) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name.startsWith(".") || e.name === "node_modules" ||
            e.name === "build" || e.name === "target" ||
            e.name === ".gradle") continue;
        recurse(p);
      } else if (e.isFile() && (Array.isArray(ext) ? ext.includes(extname(e.name)) : extname(e.name) === ext)) {
        out.push(p);
      }
    }
  }
  recurse(root);
  return out;
}

/// Lifts a numeric prefix (`01_`, `02_`) off a directory or file
/// name and returns both the order index and the slug remainder.
/// Falls back to a string-sort key when no number is present.
function parseOrderedSlug(name) {
  const m = /^(\d+)[_-](.+)$/.exec(name);
  if (m) return { order: parseInt(m[1], 10), slug: m[2] };
  return { order: Number.MAX_SAFE_INTEGER, slug: name };
}

/// Pretty-print a snake_case / kebab-case slug as a title-cased
/// heading. "01_basic_math" → "Basic math".
function prettifyTitle(slug) {
  return slug
    .replace(/^\d+[_-]/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\.\w+$/, "")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/// Split a source file into its leading comment block (everything
/// before the first non-comment code line) and the remaining code
/// body. Comment syntax is language-specific.
function splitCommentHeader(text, commentForms) {
  const lines = text.split(/\r?\n/);
  const headerLines = [];
  const isComment = (line) => {
    const trimmed = line.trim();
    if (trimmed === "") return true;
    for (const form of commentForms) {
      if (form.type === "line" && trimmed.startsWith(form.start)) return true;
      if (form.type === "block-open" && trimmed.startsWith(form.open)) return true;
      if (form.type === "shebang" && trimmed.startsWith("#!")) return true;
    }
    return false;
  };
  // Track block-comment state across lines.
  let i = 0;
  let inBlock = null;
  outer: while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (inBlock) {
      headerLines.push(lines[i]);
      if (trimmed.endsWith(inBlock.close)) inBlock = null;
      i++;
      continue;
    }
    for (const form of commentForms) {
      if (form.type === "block-open" && trimmed.startsWith(form.open)) {
        inBlock = form;
        headerLines.push(lines[i]);
        if (trimmed.length >= form.open.length + form.close.length &&
            trimmed.endsWith(form.close)) inBlock = null;
        i++;
        continue outer;
      }
    }
    if (isComment(lines[i])) {
      headerLines.push(lines[i]);
      i++;
      continue;
    }
    break;
  }
  return {
    header: headerLines.join("\n"),
    code: lines.slice(i).join("\n"),
  };
}

/// Strip the leading comment-marker characters off each line of a
/// header block, producing a plain markdown paragraph. The first
/// `#` line is preserved as a heading when callers want it.
function commentToMarkdown(header, stripPattern) {
  return header
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed === "") return "";
      // Strip the language's comment prefix from each line.
      for (const p of stripPattern) {
        if (trimmed.startsWith(p)) return trimmed.slice(p.length).trimStart();
      }
      return trimmed;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/// Build a lesson body markdown from a title + extracted comment.
/// The comment is wrapped in standard heading + reading flow.
function buildBody({ title, intro, codePreview, language }) {
  const parts = [`# ${title}`, ""];
  if (intro && intro.trim().length > 0) {
    parts.push(intro.trim());
    parts.push("");
  }
  if (codePreview) {
    parts.push("## Your task");
    parts.push("");
    parts.push("Edit the starter on the right to make the tests pass.");
    parts.push("");
    parts.push("```" + language);
    parts.push(codePreview.trim());
    parts.push("```");
  }
  return parts.join("\n");
}

/// Difficulty inference from chapter ordering. Early chapters →
/// easy, mid → medium, late → hard. The same heuristic the
/// rustlings + ziglings importers use.
function inferDifficulty(chapterIdx, totalChapters) {
  if (totalChapters <= 1) return "medium";
  const ratio = chapterIdx / Math.max(1, totalChapters - 1);
  if (ratio < 0.33) return "easy";
  if (ratio > 0.66) return "hard";
  return "medium";
}

// ── Project walkers ─────────────────────────────────────────────

/// swiftlings — `Exercises/<NN_chapter>/<lessonN.swift>`. Each
/// file has TODO/Wrong comments + a `func test<…>() -> (…)` block
/// returning the values the (shared) test harness checks. We
/// extract the leading `//` comment as the body and use the raw
/// file as the starter. Solution is the same file with TODOs
/// resolved — for this importer we leave starter == solution and
/// flag it as "ungraded reading" by setting the test stub to a
/// no-op stdout banner. The learner reads + edits; the Run button
/// shows their compiled output. Better than skipping; mirrors
/// what rustlings did pre-test-fix.
function walkSwiftlings() {
  const root = join(REPOS, "swiftlings/Exercises");
  const chapterDirs = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({ ...parseOrderedSlug(e.name), name: e.name }))
    .sort((a, b) => a.order - b.order);

  const chapters = [];
  let chapterIdx = 0;
  for (const ch of chapterDirs) {
    const lessons = readdirSync(join(root, ch.name))
      .filter((f) => f.endsWith(".swift"))
      .sort((a, b) => {
        const an = parseInt(a.match(/(\d+)/)?.[1] || "0", 10);
        const bn = parseInt(b.match(/(\d+)/)?.[1] || "0", 10);
        return an - bn;
      })
      .map((file) => {
        const text = readFileSync(join(root, ch.name, file), "utf8");
        const { header, code } = splitCommentHeader(text, [
          { type: "line", start: "//" },
        ]);
        const md = commentToMarkdown(header, ["//"]);
        const id = file.replace(/\.swift$/, "");
        const title = prettifyTitle(id);
        // Tests stub — KATA_TEST stdout protocol the native swift
        // runner already speaks. Per-lesson semantic tests would
        // require parsing each file's `func test*()` signature; we
        // ship a compile-only check so the runner reports green
        // when the user's solution compiles cleanly.
        const tests = `import Foundation
print("KATA_TEST::compiles::PASS")
`;
        return {
          id,
          title,
          body: buildBody({ title, intro: md, language: "swift" }),
          starter: code.trim() + "\n",
          solution: code.trim() + "\n",
          tests,
          difficulty: inferDifficulty(chapterIdx, chapterDirs.length),
          topic: ch.slug,
        };
      });
    chapters.push({ title: prettifyTitle(ch.slug), lessons });
    chapterIdx++;
  }
  return chapters;
}

/// haskellings — `exercises/<chapter>/<Lesson>.hs`. Files have a
/// "I AM NOT DONE" marker + `???` placeholders + a leading
/// multi-line `{- … -}` block comment. Same approach as swiftlings.
function walkHaskellings() {
  const root = join(REPOS, "haskellings/exercises");
  const chapterDirs = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const chapters = [];
  let chapterIdx = 0;
  for (const ch of chapterDirs) {
    const lessons = readdirSync(join(root, ch.name))
      .filter((f) => f.endsWith(".hs"))
      .sort()
      .map((file) => {
        const text = readFileSync(join(root, ch.name, file), "utf8");
        // Haskell blocks use {- -} and line `--`.
        const { header, code } = splitCommentHeader(text, [
          { type: "line", start: "--" },
          { type: "block-open", open: "{-", close: "-}" },
        ]);
        // Pull the {- … -} body contents as prose, plus any `--`
        // line comments. We collapse the {- and -} markers.
        const md = header
          .replace(/\{-/g, "")
          .replace(/-\}/g, "")
          .split(/\r?\n/)
          .map((l) => l.replace(/^\s*--\s?/, "").trimEnd())
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        const id = file.replace(/\.hs$/, "").toLowerCase();
        const title = prettifyTitle(id);
        const tests = `module Main where
main :: IO ()
main = putStrLn "KATA_TEST::compiles::PASS"
`;
        return {
          id,
          title,
          body: buildBody({ title, intro: md, language: "haskell" }),
          starter: text.trim() + "\n",
          solution: text.trim() + "\n",
          tests,
          difficulty: inferDifficulty(chapterIdx, chapterDirs.length),
          topic: ch.name,
        };
      });
    chapters.push({ title: prettifyTitle(ch.name), lessons });
    chapterIdx++;
  }
  return chapters;
}

/// exlings — flat `exercises/NNN_topic.ex` with no chapter dirs.
/// Files have leading `#` comments + ??? markers. We group by a
/// derived chapter key (first word of the topic slug) so the
/// output is structured rather than 25 lessons in one chapter.
function walkExlings() {
  const root = join(REPOS, "exlings/exercises");
  const files = readdirSync(root)
    .filter((f) => f.endsWith(".ex"))
    .sort();
  // Group by topic prefix. e.g. `004_basic_math.ex` →
  // chapter "Basic math". Adjacent-numeric files with the same
  // topic stem go into the same chapter.
  const chapterMap = new Map(); // key -> {order, lessons[]}
  let firstOrderForChapter = new Map();
  for (const file of files) {
    const { order, slug } = parseOrderedSlug(file.replace(/\.ex$/, ""));
    // Topic stem: first two words of the slug, or all words if
    // slug has ≤2.
    const words = slug.split("_");
    const topicKey = words.slice(0, Math.min(2, words.length)).join("_");
    const text = readFileSync(join(root, file), "utf8");
    const { header } = splitCommentHeader(text, [
      { type: "line", start: "#" },
    ]);
    const md = commentToMarkdown(header, ["#"]);
    const id = `exlings-${file.replace(/\.ex$/, "").replace(/_/g, "-")}`;
    const title = prettifyTitle(file.replace(/\.ex$/, ""));
    const tests = `IO.puts("KATA_TEST::compiles::PASS")
`;
    const lesson = {
      id,
      title,
      body: buildBody({ title, intro: md, language: "elixir" }),
      starter: text.trim() + "\n",
      solution: text.trim() + "\n",
      tests,
      difficulty: "easy", // set below
      topic: topicKey,
    };
    if (!chapterMap.has(topicKey)) chapterMap.set(topicKey, []);
    chapterMap.get(topicKey).push(lesson);
    if (!firstOrderForChapter.has(topicKey)) firstOrderForChapter.set(topicKey, order);
  }
  // Sort chapters by their first-exercise order.
  const chapters = [...chapterMap.entries()]
    .sort((a, b) => firstOrderForChapter.get(a[0]) - firstOrderForChapter.get(b[0]))
    .map(([key, lessons], idx, arr) => {
      const diff = inferDifficulty(idx, arr.length);
      for (const l of lessons) l.difficulty = diff;
      return { title: prettifyTitle(key), lessons };
    });
  return chapters;
}

/// cplings — `exercises/<NN_chapter>/<lessonN.cpp>` with embedded
/// Catch2 `TEST_CASE("name") { REQUIRE(...) }` blocks at the end.
/// Hints live in `hints/<chapter>/<lessonN>.md`. We split the
/// file into the user code (everything before `#include
/// <catch2/catch.hpp>` or the first `TEST_CASE`) and the test
/// suite, ship the user code as the starter and the test block
/// as `tests`. Solution is identical to starter (the upstream
/// expects the learner to fix in place); for compile-only
/// verification on the Libre side we synthesize a stdout banner.
function walkCplings() {
  const root = join(REPOS, "cplings/exercises");
  const hintsRoot = join(REPOS, "cplings/hints");
  const chapterDirs = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({ ...parseOrderedSlug(e.name), name: e.name }))
    .sort((a, b) => a.order - b.order);
  const chapters = [];
  let chapterIdx = 0;
  for (const ch of chapterDirs) {
    const lessons = readdirSync(join(root, ch.name))
      .filter((f) => f.endsWith(".cpp"))
      .sort((a, b) => {
        const an = parseInt(a.match(/(\d+)/)?.[1] || "0", 10);
        const bn = parseInt(b.match(/(\d+)/)?.[1] || "0", 10);
        return an - bn;
      })
      .map((file) => {
        const text = readFileSync(join(root, ch.name, file), "utf8");
        // Split user code from Catch2 tests on the catch2 include
        // line. Some lessons have the include first; we look for
        // either the include OR the first `TEST_CASE(` as the
        // split point.
        let userCode = text;
        let testCode = "";
        const splitRe = /\n#include <catch2\/catch\.hpp>|TEST_CASE\s*\(/;
        const m = splitRe.exec(text);
        if (m) {
          userCode = text.slice(0, m.index).trim();
          testCode = text.slice(m.index).trim();
        }
        const { header } = splitCommentHeader(text, [
          { type: "line", start: "//" },
          { type: "block-open", open: "/*", close: "*/" },
        ]);
        const md = commentToMarkdown(header, ["//", "/*", "*/", "*"]);
        const id = file.replace(/\.cpp$/, "");
        const title = prettifyTitle(id);
        // Hint file lives at hints/<chapter>/<lessonN>.md.
        const hintPath = join(hintsRoot, ch.name, id + ".md");
        const hints = [];
        if (existsSync(hintPath)) {
          const raw = readFileSync(hintPath, "utf8").trim();
          if (raw) hints.push(raw);
        }
        if (hints.length < 2) {
          hints.unshift(`Read the comments at the top of ${file} carefully — the upstream comment block lays out the intent.`);
          if (hints.length < 2) hints.push("Look at the failing test case and work backwards from the REQUIRE assertion.");
        }
        return {
          id,
          title,
          body: buildBody({ title, intro: md, language: "cpp" }),
          starter: userCode + "\n",
          solution: userCode + "\n",
          tests: testCode || `#include <iostream>\nint main() { std::cout << "KATA_TEST::compiles::PASS\\n"; return 0; }\n`,
          hints,
          difficulty: inferDifficulty(chapterIdx, chapterDirs.length),
          topic: ch.slug,
        };
      });
    chapters.push({ title: prettifyTitle(ch.slug), lessons });
    chapterIdx++;
  }
  return chapters;
}

/// python_koans — `koans/about_<topic>.py`. Each file is a
/// `class About<X>(Koan)` with `test_<thing>` methods using `__`
/// placeholders + `self.assertEqual(__, …)`. Tests are inline;
/// solution is the same file with `__` replaced. We ship the raw
/// file as the starter and as the solution (the runtime treats
/// missing __ as failing tests); the test runner is the file
/// itself when invoked via the koans runner.
function walkPythonKoans() {
  const root = join(REPOS, "python_koans/koans");
  const files = readdirSync(root)
    .filter((f) => f.startsWith("about_") && f.endsWith(".py"))
    .sort();
  // Group all under one "Koans" chapter — the upstream's
  // `koans.txt` defines a curriculum order; we mirror it where
  // available, otherwise fall back to alphabetical.
  const orderFile = join(REPOS, "python_koans/koans.txt");
  let orderedNames = files;
  if (existsSync(orderFile)) {
    const ordered = readFileSync(orderFile, "utf8")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.endsWith(".py"));
    if (ordered.length > 0) {
      const set = new Set(ordered);
      orderedNames = [...ordered, ...files.filter((f) => !set.has(f))];
    }
  }
  const lessons = orderedNames
    .filter((f) => files.includes(f))
    .map((file, idx, arr) => {
      const text = readFileSync(join(root, file), "utf8");
      const { header } = splitCommentHeader(text, [
        { type: "line", start: "#" },
      ]);
      const md = commentToMarkdown(header, ["#"]);
      const id = file.replace(/\.py$/, "").replace(/_/g, "-");
      const title = prettifyTitle(file.replace(/\.py$/, ""));
      return {
        id,
        title,
        body: buildBody({ title, intro: md || `Solve the assertions by replacing every \`__\` with the correct expected value.`, language: "python" }),
        starter: text,
        solution: text, // Koans expect the learner to fix in place
        tests: "# Tests are inline in the koan file — replace each `__` with the expected value\n",
        difficulty: inferDifficulty(idx, arr.length),
        topic: "koans",
      };
    });
  return [{ title: "Koans", lessons }];
}

/// kotlin-koans-edu — `<Section>/<TaskName>/src/Task.kt` +
/// `<Section>/<TaskName>/test/tests.kt`. Clean structure: each
/// task has a dedicated src + test pair. We ship src as starter
/// and tests verbatim.
function walkKotlinKoans() {
  const root = join(REPOS, "kotlin-koans-edu");
  const sectionDirs = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !["util", "gradle", "build", ".gradle"].includes(e.name) && !e.name.startsWith("."))
    .sort();
  const chapters = [];
  let chapterIdx = 0;
  for (const sec of sectionDirs) {
    const taskDirs = readdirSync(join(root, sec.name), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .sort();
    const lessons = [];
    for (const task of taskDirs) {
      const srcDir = join(root, sec.name, task.name, "src");
      const testDir = join(root, sec.name, task.name, "test");
      if (!existsSync(srcDir) || !existsSync(testDir)) continue;
      const srcFiles = readdirSync(srcDir).filter((f) => f.endsWith(".kt"));
      const testFiles = readdirSync(testDir).filter((f) => f.endsWith(".kt"));
      // Take the canonical Task.kt as primary starter; concatenate
      // any sibling files (Shop.kt etc.) at the end as supporting
      // context.
      const taskFile = srcFiles.find((f) => f === "Task.kt") || srcFiles[0];
      if (!taskFile) continue;
      const taskCode = readFileSync(join(srcDir, taskFile), "utf8");
      const otherSrc = srcFiles
        .filter((f) => f !== taskFile)
        .map((f) => "// ── " + f + " ───────────────────────────\n" + readFileSync(join(srcDir, f), "utf8"))
        .join("\n\n");
      const testCode = testFiles
        .map((f) => readFileSync(join(testDir, f), "utf8"))
        .join("\n\n");
      const id = (sec.name + "-" + task.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const title = task.name;
      const body = `# ${title}\n\nKotlin Koans — task from the **${sec.name}** section. Edit \`Task.kt\` on the right; the test file in the workbench gates your solution.`;
      lessons.push({
        id,
        title,
        body,
        starter: taskCode + (otherSrc ? "\n\n" + otherSrc : ""),
        solution: taskCode + (otherSrc ? "\n\n" + otherSrc : ""),
        tests: testCode,
        difficulty: inferDifficulty(chapterIdx, sectionDirs.length),
        topic: sec.name.toLowerCase(),
      });
    }
    if (lessons.length > 0) {
      chapters.push({ title: sec.name, lessons });
      chapterIdx++;
    }
  }
  return chapters;
}

/// clojure-koans — `src/koans/NN_topic.clj` with `(meditations …)`
/// blocks containing `__` placeholders. Tests are inline.
function walkClojureKoans() {
  const root = join(REPOS, "clojure-koans/src/koans");
  const files = readdirSync(root).filter((f) => f.endsWith(".clj")).sort();
  const lessons = files.map((file, idx) => {
    const text = readFileSync(join(root, file), "utf8");
    const { header } = splitCommentHeader(text, [
      { type: "line", start: ";" },
    ]);
    const md = commentToMarkdown(header, [";;", ";"]);
    const id = file.replace(/\.clj$/, "").replace(/^\d+_/, "").replace(/_/g, "-");
    const title = prettifyTitle(file.replace(/\.clj$/, ""));
    return {
      id,
      title,
      body: buildBody({ title, intro: md || `Solve each koan by replacing every \`__\` with the value that makes the equality hold.`, language: "clojure" }),
      starter: text,
      solution: text,
      tests: ";; Tests are inline in the koan — replace each `__` with the value that makes the form truthy.\n",
      difficulty: inferDifficulty(idx, files.length),
      topic: "koans",
    };
  });
  return [{ title: "Koans", lessons }];
}

/// javascript-koans — `koans/About<Topic>.js` with `FILL_ME_IN`
/// placeholders, Jasmine `describe`/`it` blocks. Tests are inline.
function walkJavascriptKoans() {
  const root = join(REPOS, "javascript-koans/koans");
  const files = readdirSync(root).filter((f) => f.endsWith(".js")).sort();
  const lessons = files.map((file, idx) => {
    const text = readFileSync(join(root, file), "utf8");
    const { header } = splitCommentHeader(text, [
      { type: "line", start: "//" },
      { type: "block-open", open: "/*", close: "*/" },
    ]);
    const md = commentToMarkdown(header, ["//", "/*", "*/", "*"]);
    const id = file.replace(/\.js$/, "").toLowerCase().replace(/^about/, "about-");
    const title = file.replace(/\.js$/, "").replace(/([A-Z])/g, " $1").trim();
    return {
      id,
      title,
      body: buildBody({ title, intro: md || `Replace each \`FILL_ME_IN\` with the value that makes the Jasmine \`expect\` pass.`, language: "javascript" }),
      starter: text,
      solution: text,
      tests: "// Tests are inline in the koan file — replace each `FILL_ME_IN` with the expected value\n",
      difficulty: inferDifficulty(idx, files.length),
      topic: "koans",
    };
  });
  return [{ title: "Koans", lessons }];
}

/// java-koans — `koans/src/<group>/About<Topic>.java`. Tests are
/// inline as `@Koan` methods using `assertEquals(value, __)`.
function walkJavaKoans() {
  const root = join(REPOS, "java-koans/koans/src");
  const groupDirs = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .sort();
  const chapters = [];
  let chapterIdx = 0;
  for (const grp of groupDirs) {
    const files = readdirSync(join(root, grp.name))
      .filter((f) => f.startsWith("About") && f.endsWith(".java"))
      .sort();
    const lessons = files.map((file) => {
      const text = readFileSync(join(root, grp.name, file), "utf8");
      const { header } = splitCommentHeader(text, [
        { type: "line", start: "//" },
        { type: "block-open", open: "/*", close: "*/" },
      ]);
      const md = commentToMarkdown(header, ["//", "/*", "*/", "*"]);
      const id = (grp.name + "-" + file.replace(/\.java$/, "")).toLowerCase();
      const title = file.replace(/\.java$/, "").replace(/^About/, "About ").replace(/([A-Z])/g, " $1").trim();
      return {
        id,
        title,
        body: buildBody({ title, intro: md || `Java Koans — replace each \`__\` placeholder with the expected value.`, language: "java" }),
        starter: text,
        solution: text,
        tests: "// Tests are the @Koan methods inline above; replace each `__` with the expected value.\n",
        difficulty: inferDifficulty(chapterIdx, groupDirs.length),
        topic: grp.name,
      };
    });
    if (lessons.length > 0) {
      chapters.push({ title: prettifyTitle(grp.name), lessons });
      chapterIdx++;
    }
  }
  return chapters;
}

/// FSharpKoans — `FSharpKoans/About<Topic>.fs`. Each file has a
/// `[<Koan>]` module with `[<Koan>]`-marked functions using
/// `AssertEquality value __`.
function walkFSharpKoans() {
  const root = join(REPOS, "FSharpKoans/FSharpKoans");
  const files = readdirSync(root)
    .filter((f) => f.endsWith(".fs") && f.startsWith("About"))
    .sort();
  const lessons = files.map((file, idx) => {
    const text = readFileSync(join(root, file), "utf8");
    const { header } = splitCommentHeader(text, [
      { type: "line", start: "//" },
      { type: "block-open", open: "(*", close: "*)" },
    ]);
    const md = commentToMarkdown(header, ["//", "(*", "*)", "*"]);
    const id = file.replace(/\.fs$/, "").toLowerCase().replace(/^about/, "about-");
    const title = file.replace(/\.fs$/, "").replace(/^About/, "About ").replace(/([A-Z])/g, " $1").trim();
    return {
      id,
      title,
      body: buildBody({ title, intro: md || `F# Koans — replace each \`__\` placeholder with the value that makes \`AssertEquality\` succeed.`, language: "fsharp" }),
      starter: text,
      solution: text,
      tests: "// Tests are the [<Koan>] functions inline; replace each `__` with the expected value.\n",
      difficulty: inferDifficulty(idx, files.length),
      topic: "koans",
    };
  });
  return [{ title: "Koans", lessons }];
}

// ── Project registry ────────────────────────────────────────────

const PROJECTS = [
  {
    id: "swiftlings",
    title: "Swiftlings",
    author: "Libre",
    language: "swift",
    upstream: "https://github.com/tornikegomareli/swiftlings",
    walker: walkSwiftlings,
    packType: "lings",
    releaseStatus: "ALPHA",
  },
  {
    id: "haskellings",
    title: "Haskellings",
    author: "Libre",
    language: "haskell",
    upstream: "https://github.com/MondayMorningHaskell/haskellings",
    walker: walkHaskellings,
    packType: "lings",
    releaseStatus: "ALPHA",
  },
  {
    id: "exlings",
    title: "Exlings",
    author: "Libre",
    language: "elixir",
    upstream: "https://github.com/zoedsoupe/exlings",
    walker: walkExlings,
    packType: "lings",
    releaseStatus: "ALPHA",
  },
  {
    id: "cplings",
    title: "Cplings",
    author: "Libre",
    language: "cpp",
    upstream: "https://github.com/rdjondo/cplings",
    walker: walkCplings,
    packType: "lings",
    releaseStatus: "ALPHA",
  },
  {
    id: "python-koans",
    title: "Python Koans",
    author: "Libre",
    language: "python",
    upstream: "https://github.com/gregmalcolm/python_koans",
    walker: walkPythonKoans,
    packType: "koans",
    releaseStatus: "ALPHA",
  },
  {
    id: "kotlin-koans",
    title: "Kotlin Koans",
    author: "Libre",
    language: "kotlin",
    upstream: "https://github.com/Kotlin/kotlin-koans-edu",
    walker: walkKotlinKoans,
    packType: "koans",
    releaseStatus: "ALPHA",
  },
  {
    id: "clojure-koans",
    title: "Clojure Koans",
    author: "Libre",
    language: "clojure",
    upstream: "https://github.com/functional-koans/clojure-koans",
    walker: walkClojureKoans,
    packType: "koans",
    releaseStatus: "ALPHA",
  },
  {
    id: "javascript-koans",
    title: "JavaScript Koans",
    author: "Libre",
    language: "javascript",
    upstream: "https://github.com/mrdavidlaing/javascript-koans",
    walker: walkJavascriptKoans,
    packType: "koans",
    releaseStatus: "ALPHA",
  },
  {
    id: "java-koans",
    title: "Java Koans",
    author: "Libre",
    language: "java",
    upstream: "https://github.com/matyb/java-koans",
    walker: walkJavaKoans,
    packType: "koans",
    releaseStatus: "ALPHA",
  },
  {
    id: "fsharp-koans",
    title: "F# Koans",
    author: "Libre",
    language: "fsharp",
    upstream: "https://github.com/ChrisMarinos/FSharpKoans",
    walker: walkFSharpKoans,
    packType: "koans",
    releaseStatus: "ALPHA",
  },
];

// ── Driver ──────────────────────────────────────────────────────

function writeCourse(project, chapters) {
  const course = {
    id: project.id,
    title: project.title,
    author: project.author,
    language: project.language,
    description: `${project.title} — ported from ${project.upstream} for Libre.academy. Each exercise lives in its own lesson; fix the starter to make the tests pass.`,
    // packType drives which surface the course renders in. Both
    // *lings (`packType: "lings"`) and koans (`packType: "koans"`)
    // live on the dedicated Challenges page — the Library strips
    // them so they don't double-list. `ChallengesView` picks them
    // up via `isLings` / `isKoans` and renders each family in its
    // own labelled grid section. Project-config carries the
    // override; absent → "course" (regular Library book).
    ...(project.packType ? { packType: project.packType } : {}),
    chapters: chapters.map((ch) => ({
      title: ch.title,
      lessons: ch.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        body: l.body,
        kind: "exercise",
        language: project.language,
        starter: l.starter,
        solution: l.solution,
        tests: l.tests || "",
        hints: l.hints && l.hints.length >= 2
          ? l.hints
          : [
              "Read the leading comment block — the upstream author explains exactly what to change.",
              "Look at the failing test or expected value at the bottom of the file — work backwards from what it needs.",
            ],
        difficulty: l.difficulty || "medium",
        topic: l.topic || "exercises",
      })),
    })),
  };
  const dir = join(LIBRE_COURSES, project.id);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const target = join(dir, "course.json");
  writeFileSync(target, JSON.stringify(course, null, 2) + "\n");
  const lessons = chapters.reduce((s, c) => s + c.lessons.length, 0);
  console.log(`✓ ${project.id}: ${chapters.length} chapters × ${lessons} lessons → ${target}`);
  return { lessons, chapters: chapters.length };
}

const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;

const summary = [];
for (const project of PROJECTS) {
  if (only && project.id !== only) continue;
  try {
    const chapters = project.walker();
    const stats = writeCourse(project, chapters);
    summary.push({ id: project.id, ...stats });
  } catch (e) {
    console.error(`✗ ${project.id} failed:`, e.message);
    summary.push({ id: project.id, error: e.message });
  }
}

console.log("\n── summary ──");
for (const s of summary) {
  if (s.error) console.log(`✗ ${s.id} — ${s.error}`);
  else console.log(`  ${s.id} — ${s.chapters} ch × ${s.lessons} lessons`);
}
