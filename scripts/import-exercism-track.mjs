#!/usr/bin/env node
/// Convert an Exercism language track (https://github.com/exercism/<lang>)
/// into a Libre course.
///
/// Why a single importer with per-language hooks instead of one per
/// track: Exercism's repo layout is uniform — every track has the
/// same `config.json` at the root with `exercises.concept[]` +
/// `exercises.practice[]`, every exercise has `.docs/instructions.md`,
/// `.meta/config.json` describing file roles, and a stub/test/example
/// trio. The bits that vary per language are
///   (a) how to translate the tests so they run in Libre's runtime
///   (b) how to alias the user-code module name in the test harness
///   (c) the multi-file workbench shape (some tracks ship 2+ source
///       files per exercise).
/// All three live in PROCESSORS below; everything else is shared.
///
/// What it does:
///   1. Reads the track's `config.json` for the canonical concept[]
///      + practice[] exercise lists (skipping deprecated).
///   2. For each exercise:
///      - reads `.docs/introduction.md` (if present) + `.docs/instructions.md`
///        as the lesson body
///      - reads `.docs/hints.md` (if present) as progressive hints
///      - reads `.meta/config.json` to find solution/test/example files
///      - reads the user-facing stub (solution[0]) → starter
///      - reads the example (example[0] / exemplar[0]) → solution
///      - reads the test file (test[0]) → translates per-language → tests
///   3. Emits a Libre `course.json` with TWO chapters: "Concepts"
///      (concept[] order) + "Practice" (practice[] order).
///   4. Writes to the configured OUT_DIR (defaults to the desktop
///      app's installed-courses directory).
///
/// Usage:
///   node scripts/import-exercism-track.mjs --lang python [--repo /tmp/exercism-python] [--out <dir>]
///   node scripts/import-exercism-track.mjs --all   # every language defined in PROCESSORS

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";
import { homedir } from "node:os";

const args = process.argv.slice(2);
const argFlag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const argBool = (name) => args.indexOf(`--${name}`) >= 0;

// ─── Per-language processors ───────────────────────────────────────
//
// Each processor describes how to translate ONE Exercism exercise
// (stub + tests + example) into the strings Libre's runtime expects
// (starter + tests + solution). The shared pipeline calls these
// hooks; the rest of the file knows nothing about Python vs Go vs
// TypeScript.
//
// Shape:
//   - libreLanguageId: the LanguageId Libre uses for this track.
//     Drives icon picking + runtime dispatch.
//   - exerciseSlug: short label for log lines ("python", "rust", …)
//     usually the same as the --lang flag.
//   - title(slug): display title for the generated course (e.g.
//     "Exercism Python Track").
//   - moduleName(slug, solutionBase): map an exercise to the module
//     name the test file imports from. Most tracks use the SOLUTION
//     file's basename (`lasagna.py` → `lasagna`).
//   - translateTests(testCode, moduleName, editorFiles): per-language
//     test translation. The pipeline passes the raw upstream test
//     file content plus any auxiliary editor files (test_utils,
//     data modules, etc.) so the processor can prepend an inline
//     sys.modules registrar / source concatenation / whatever it
//     needs to keep imports resolvable.
//   - userPreamble(editorFiles): optional. When non-empty, prepended
//     to both the starter and solution code so that multi-file
//     concept exercises can resolve `from <support> import …` from
//     the user code itself (the tests-only registration above runs
//     too late for that).

const PYTHON_PROCESSOR = {
  libreLanguageId: "python",
  /// Exercism Python uses snake_case module names. The shared
  /// pipeline passes the SOLUTION file's basename (e.g. `lasagna`
  /// from `lasagna.py`). Most practice exercises name the solution
  /// file after the slug (`anagram.py`); a handful of concept
  /// exercises use a domain noun (`lasagna.py`, `card_games.py`)
  /// so reading from the solution-file basename is more reliable
  /// than slug → snake. Kebab → snake as a final safety pass.
  moduleName(_slug, solutionBase) {
    return solutionBase.replace(/-/g, "_");
  },
  translateTests(testCode, moduleName, editorFiles = []) {
    // Multi-file exercises register each editor file as its own
    // `sys.modules` entry so the upstream test file's
    // `from <editor_mod> import X` resolves at run time. We share
    // the same retry-loop helper the user preamble uses so editor
    // modules can import from each other in any declared order.
    const editorEntries = editorFiles
      .map(
        (f) =>
          `    (${JSON.stringify(f.modName)}, ${JSON.stringify(f.content)}),`,
      )
      .join("\n");
    const editorBlock =
      editorFiles.length > 0
        ? `def _libre_register_editor(_mods):
    _pending = list(_mods)
    _last_err = None
    while _pending:
        _progress = False
        _next = []
        for _name, _src in _pending:
            if _name in _libre_sys.modules and getattr(_libre_sys.modules[_name], '_libre_registered', False):
                _progress = True
                continue
            try:
                _m = _libre_types.ModuleType(_name)
                exec(compile(_src, _name + '.py', 'exec'), _m.__dict__)
                _m._libre_registered = True
                _libre_sys.modules[_name] = _m
                _progress = True
            except (ImportError, NameError, AttributeError) as _e:
                _last_err = _e
                _next.append((_name, _src))
        _pending = _next
        if _pending and not _progress:
            raise _last_err if _last_err else RuntimeError('cyclic editor modules')

_libre_register_editor([
${editorEntries}
])`
        : "";
    const prefix = `# Libre/Exercism harness shim.
# The upstream test file does \`from ${moduleName} import …\`. Libre's
# Python runtime exposes the learner's code under \`sys.modules['user']\`,
# so we alias the two module names before running the tests.
#
# Concept exercises also \`import pytest\` for the \`@pytest.mark.task\`
# decorator. Pyodide doesn't bundle pytest — install a minimal shim
# that no-ops the decorator and proxies the \`raises\` context manager
# to a plain assert-on-exception block.
import sys as _libre_sys
import types as _libre_types

_libre_sys.modules[${JSON.stringify(moduleName)}] = _libre_sys.modules['user']

${editorBlock}

if 'pytest' not in _libre_sys.modules:
    _libre_pytest = _libre_types.ModuleType('pytest')
    class _LibrePytestMark:
        def __getattr__(self, _name):
            def _decorator_factory(*_a, **_kw):
                def _decorator(_fn):
                    return _fn
                return _decorator
            return _decorator_factory
    _libre_pytest.mark = _LibrePytestMark()

    class _LibrePytestRaises:
        def __init__(self, exc):
            self._exc = exc
        def __enter__(self):
            return self
        def __exit__(self, _t, _v, _tb):
            if _t is None:
                raise AssertionError(f"expected {self._exc.__name__} to be raised")
            return isinstance(_v, self._exc)
    _libre_pytest.raises = _LibrePytestRaises

    import unittest as _libre_unittest
    def _libre_pytest_skip(reason=""):
        raise _libre_unittest.SkipTest(reason)
    _libre_pytest.skip = _libre_pytest_skip
    def _libre_pytest_fail(msg=""):
        raise AssertionError(msg)
    _libre_pytest.fail = _libre_pytest_fail

    _libre_sys.modules['pytest'] = _libre_pytest
`;
    const suffix = `
# Libre/Exercism harness runner. Auto-discover unittest.TestCase
# subclasses and run each test_* method through the kata_test DSL
# so the workbench sees structured pass/fail. SkipTest is treated
# as a pass (Exercism uses self.skipTest("extra-credit") for
# optional variants we don't want to gate completion on).
import unittest as _libre_unittest
from kata_test import test as _libre_test
_libre_discovered = []
for _libre_name, _libre_obj in list(globals().items()):
    if (isinstance(_libre_obj, type)
        and issubclass(_libre_obj, _libre_unittest.TestCase)
        and _libre_obj is not _libre_unittest.TestCase):
        for _libre_meth in sorted(dir(_libre_obj)):
            if _libre_meth.startswith('test_'):
                _libre_discovered.append((_libre_obj, _libre_meth))

def _libre_run_one(_libre_cls, _libre_meth):
    _libre_inst = _libre_cls(_libre_meth)
    if hasattr(_libre_inst, 'setUp'):
        _libre_inst.setUp()
    try:
        try:
            getattr(_libre_inst, _libre_meth)()
        except _libre_unittest.SkipTest:
            return
    finally:
        if hasattr(_libre_inst, 'tearDown'):
            _libre_inst.tearDown()

for _libre_cls, _libre_meth in _libre_discovered:
    _libre_label = f"{_libre_cls.__name__}.{_libre_meth}"
    _libre_test(_libre_label, lambda c=_libre_cls, m=_libre_meth: _libre_run_one(c, m))
`;
    return prefix + "\n" + testCode + "\n" + suffix;
  },
  userPreamble(editorFiles) {
    if (editorFiles.length === 0) return "";
    const entries = editorFiles
      .map(
        (f) =>
          `    (${JSON.stringify(f.modName)}, ${JSON.stringify(f.content)}),`,
      )
      .join("\n");
    return `# === Libre harness: provided support modules (read-only) ===
# This exercise ships with one or more helper modules alongside the
# file you're editing. We register them here so your \`from … import …\`
# statements below resolve when the workbench runs your code.
import sys as _libre_sys
import types as _libre_types

def _libre_register_all(_mods):
    _pending = list(_mods)
    _last_err = None
    while _pending:
        _progress = False
        _next = []
        for _name, _src in _pending:
            try:
                _m = _libre_types.ModuleType(_name)
                exec(compile(_src, _name + '.py', 'exec'), _m.__dict__)
                _libre_sys.modules[_name] = _m
                _progress = True
            except (ImportError, NameError, AttributeError) as _e:
                _last_err = _e
                _next.append((_name, _src))
        _pending = _next
        if _pending and not _progress:
            raise _last_err if _last_err else RuntimeError('cyclic editor modules')

_libre_register_all([
${entries}
])
# === Your code below ===

`;
  },
};

/// Shared JS/TS translator. Both tracks use Jest-style tests with
/// `@jest/globals` imports + relative path imports of the exercise
/// module. Libre's JS runtime injects describe/test/expect/etc. as
/// globals and accepts `require('./user')`, so the translation is:
///   1. Strip `import { … } from '@jest/globals'` (and the require
///      that sucrase generates from it)
///   2. Rewrite import/require paths that point at the exercise file
///      → `./user` so the runtime's user-module alias resolves.
///   3. Provide an `xtest`/`xit` stub so skipped tests don't blow up
///      under runtimes that haven't injected them.
function makeJsTsProcessor(libreLanguageId) {
  return {
    libreLanguageId,
    moduleName(_slug, solutionBase) {
      // Strip the .ts/.js extension; the result is the bare name the
      // test file's `import from './<name>'` line uses.
      return solutionBase.replace(/\.[tj]sx?$/, "");
    },
    translateTests(testCode, moduleName, _editorFiles = []) {
      const modPath = moduleName;
      let out = testCode;
      // Strip @jest/globals imports (and stray surrounding statements).
      out = out.replace(
        /import\s*\{[^}]*\}\s*from\s*['"]@jest\/globals['"];?\s*\n/g,
        "",
      );
      // Rewrite ESM-style `import … from './<exercise>'`
      out = out.replace(
        new RegExp(
          `from\\s+(['"])\\.\\.?\\/${escapeRegex(modPath)}(\\.tsx?)?\\1`,
          "g",
        ),
        "from $1./user$1",
      );
      // CommonJS form (in case sucrase already lowered, or the test
      // uses require explicitly).
      out = out.replace(
        new RegExp(
          `require\\s*\\(\\s*(['"])\\.\\.?\\/${escapeRegex(modPath)}(\\.tsx?)?\\1\\s*\\)`,
          "g",
        ),
        "require($1./user$1)",
      );
      // Provide a defensive stub block so xtest/xit/test.skip resolve
      // even if the host runtime doesn't inject them.
      const prefix = `// Libre/Exercism harness shim — Jest globals + skip stubs.
// Libre's JS runtime injects describe/test/it/expect/etc. as
// globals; only the skip variants (xtest, xit) need defensive
// stubs. Module path imports of "./${modPath}" are rewritten to
// "./user" so the runtime's user-code alias resolves.
if (typeof xtest === 'undefined') {
  globalThis.xtest = (typeof test !== 'undefined' && test.skip) || (() => {});
}
if (typeof xit === 'undefined') {
  globalThis.xit = (typeof it !== 'undefined' && it.skip) || (() => {});
}
`;
      return prefix + "\n" + out;
    },
  };
}

const JS_PROCESSOR = makeJsTsProcessor("javascript");
const TS_PROCESSOR = makeJsTsProcessor("typescript");

/// Rust processor. Exercism's Rust tests live in `tests/<slug>.rs`
/// and start with `use <crate>::<item>;` (the crate name comes from
/// `Cargo.toml`'s `[package].name`). Libre's Rust runtime wraps user
/// + test code in `mod kata_tests { use super::*; … }`, which means
/// every item declared at the top level is already in scope inside
/// the test wrapper — so the `use <crate>::` line is redundant
/// (and would fail because there's no separate crate). We strip
/// those lines and also drop `#[ignore]` attributes so Exercism's
/// "primary test enabled, follow-ups ignored" convention shows up
/// as a full battery in the workbench.
const RUST_PROCESSOR = {
  libreLanguageId: "rust",
  moduleName(slug, _solutionBase) {
    // Exercism Rust uses kebab-to-snake for the crate name.
    return slug.replace(/-/g, "_");
  },
  translateTests(testCode, moduleName, _editorFiles = []) {
    let out = testCode;
    // Strip `use <crate>::<…>;` lines (with or without ::*).
    out = out.replace(
      new RegExp(
        `^\\s*use\\s+${escapeRegex(moduleName)}::[^;]+;\\s*$`,
        "gm",
      ),
      "",
    );
    out = out.replace(
      new RegExp(`^\\s*use\\s+${escapeRegex(moduleName)};\\s*$`, "gm"),
      "",
    );
    // Drop `#[ignore]` so the full test battery runs in Libre.
    // Exercism uses #[ignore] to make CLI users opt into the
    // follow-up tests one at a time; in a learn-by-doing UI it's
    // less friction to surface everything.
    out = out.replace(/^\s*#\[ignore\]\s*$/gm, "");
    return out;
  },
};

/// Go processor — best-effort. Libre's Go runtime is `package main`
/// + `KATA_TEST::name::PASS|FAIL` stdout convention, NOT `go test`.
/// Exercism Go tests are `package <slug>` + `func TestX(t *testing.T)`.
/// To run them under Libre's runtime we'd need to synthesize a
/// main() that drives each TestX with a fake *testing.T capturing
/// Errorf/Fatal calls and printing KATA_TEST lines.
///
/// V1 ship: strip the package decl + leave the tests as-is so the
/// content is at least visible / browsable in the library. Lesson
/// authors / future iterations can wire up the full Go test
/// translation. Native-runner desktop builds will fall back to
/// `go test` directly via the existing toolchain.
const GO_PROCESSOR = {
  libreLanguageId: "go",
  moduleName(_slug, solutionBase) {
    return solutionBase.replace(/\.go$/, "");
  },
  translateTests(testCode, _moduleName, _editorFiles = []) {
    // Drop the package declaration; everything else can stay as-is
    // — the runtime merges code + tests and infers stdlib imports.
    let out = testCode.replace(/^\s*package\s+\w+\s*$/m, "");
    // Synthesize a runner main() that drives the upstream
    // `func TestX(t *testing.T)` functions through a fake *testing.T
    // and emits KATA_TEST lines. Discovery is via Go reflection at
    // run time — we walk `package main` for any function whose name
    // starts with `Test` and signature `(*testing.T)`. Helper +
    // benchmark functions are skipped.
    out += `\n
// Libre/Exercism harness runner — emits KATA_TEST stdout for each
// TestXxx function defined above.
type libreT struct {
\tfailed bool
\terr    string
\tname   string
}

func (t *libreT) Errorf(format string, args ...interface{}) {
\tt.failed = true
\tif t.err == "" { t.err = fmt.Sprintf(format, args...) }
}
func (t *libreT) Error(args ...interface{}) {
\tt.failed = true
\tif t.err == "" { t.err = fmt.Sprint(args...) }
}
func (t *libreT) Fatalf(format string, args ...interface{}) {
\tt.failed = true
\tt.err = fmt.Sprintf(format, args...)
\truntime.Goexit()
}
func (t *libreT) Fatal(args ...interface{}) {
\tt.failed = true
\tt.err = fmt.Sprint(args...)
\truntime.Goexit()
}
func (t *libreT) Logf(format string, args ...interface{})      { fmt.Printf(format+"\\n", args...) }
func (t *libreT) Log(args ...interface{})                       { fmt.Println(args...) }
func (t *libreT) Helper()                                       {}
func (t *libreT) Skipf(format string, args ...interface{})      { panic("libre-skip:" + fmt.Sprintf(format, args...)) }
func (t *libreT) Skip(args ...interface{})                      { panic("libre-skip:" + fmt.Sprint(args...)) }
func (t *libreT) SkipNow()                                      { panic("libre-skip:") }
func (t *libreT) Name() string                                  { return t.name }
func (t *libreT) Cleanup(f func())                              {}
func (t *libreT) Parallel()                                     {}
func (t *libreT) FailNow()                                      { t.failed = true; runtime.Goexit() }
func (t *libreT) Fail()                                         { t.failed = true }
func (t *libreT) Failed() bool                                  { return t.failed }
func (t *libreT) Run(name string, fn func(*testing.T)) bool {
\t// Subtests are flattened into the parent's pass/fail.
\tdone := make(chan bool, 1)
\tsub := &libreT{name: t.name + "/" + name}
\tgo func() {
\t\tdefer func() {
\t\t\tif r := recover(); r != nil {
\t\t\t\tmsg := fmt.Sprint(r)
\t\t\t\tif !strings.HasPrefix(msg, "libre-skip:") {
\t\t\t\t\tsub.failed = true
\t\t\t\t\tif sub.err == "" { sub.err = msg }
\t\t\t\t}
\t\t\t}
\t\t\tdone <- true
\t\t}()
\t\tfn((*testing.T)(unsafe.Pointer(sub)))
\t}()
\t<-done
\tif sub.failed { t.failed = true; if t.err == "" { t.err = sub.err } }
\treturn !sub.failed
}

func libreRun(name string, fn func(*testing.T)) {
\tt := &libreT{name: name}
\tdone := make(chan struct{})
\tgo func() {
\t\tdefer func() {
\t\t\tif r := recover(); r != nil {
\t\t\t\tmsg := fmt.Sprint(r)
\t\t\t\tif strings.HasPrefix(msg, "libre-skip:") {
\t\t\t\t\tfmt.Printf("KATA_TEST::%s::PASS\\n", name)
\t\t\t\t\tclose(done); return
\t\t\t\t}
\t\t\t\tt.failed = true
\t\t\t\tif t.err == "" { t.err = msg }
\t\t\t}
\t\t\tclose(done)
\t\t}()
\t\tfn((*testing.T)(unsafe.Pointer(t)))
\t}()
\t<-done
\tif t.failed {
\t\treason := strings.ReplaceAll(t.err, "\\n", " | ")
\t\tfmt.Printf("KATA_TEST::%s::FAIL::%s\\n", name, reason)
\t} else {
\t\tfmt.Printf("KATA_TEST::%s::PASS\\n", name)
\t}
}
`;
    // Synthesize main() to call each TestX. Since we can't use Go
    // reflection over local functions at runtime, we use a small
    // bash-style discovery pass at IMPORT time below by scanning
    // the test source for func TestXxx signatures.
    const testFns = findGoTestFunctions(testCode);
    out += `\nfunc main() {\n`;
    for (const fn of testFns) {
      out += `\tlibreRun(${JSON.stringify(fn)}, ${fn})\n`;
    }
    out += "}\n";
    return out;
  },
};

function findGoTestFunctions(src) {
  const re = /^\s*func\s+(Test[A-Za-z0-9_]*)\s*\(\s*\w*\s+\*testing\.T\s*\)/gm;
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return out;
}

/// Generic "ship as-is" processor for tracks where Libre's runtime
/// support is via native subprocess or external playground and the
/// test framework is a stdlib idiom (Ruby minitest, Elixir ExUnit,
/// Haskell HSpec, …). The lesson content (intro, instructions,
/// hints, starter, solution, tests) is shipped verbatim from
/// upstream; module-name aliasing is a one-line passthrough since
/// the user code lands in a file with the same name the tests
/// import.
///
/// For runtimes that aren't yet plugged into Libre, the test code
/// still ships — the workbench renders it as the test file the
/// learner can inspect, and the `Run` button shows the standard
/// "desktop runtime required" UX on web. Tests don't pass against
/// the bundled solution today, but the curriculum content + starter
/// + solution are all present so a learner reads the lesson, edits
/// the starter, and can verify against the solution on desktop.
function makePassthroughProcessor(libreLanguageId, opts = {}) {
  const stripExt = opts.stripExt ?? /\.\w+$/;
  return {
    libreLanguageId,
    moduleName(_slug, solutionBase) {
      // Take the bare basename of the solution file. Most tracks
      // import from this (e.g. Ruby `accumulate.rb` → `accumulate`).
      return basename(solutionBase).replace(stripExt, "");
    },
    translateTests(testCode, _moduleName, _editorFiles = []) {
      return testCode;
    },
  };
}

const PROCESSORS = {
  python: PYTHON_PROCESSOR,
  javascript: JS_PROCESSOR,
  typescript: TS_PROCESSOR,
  rust: RUST_PROCESSOR,
  go: GO_PROCESSOR,
  // Tier-2 passthrough. Test execution depends on the runtime
  // being plugged in for that language; the curriculum content
  // itself ships either way.
  swift: makePassthroughProcessor("swift"),
  ruby: makePassthroughProcessor("ruby"),
  elixir: makePassthroughProcessor("elixir"),
  haskell: makePassthroughProcessor("haskell"),
  lua: makePassthroughProcessor("lua"),
  dart: makePassthroughProcessor("dart"),
  scala: makePassthroughProcessor("scala"),
  c: makePassthroughProcessor("c"),
  cpp: makePassthroughProcessor("cpp"),
  java: makePassthroughProcessor("java"),
  kotlin: makePassthroughProcessor("kotlin"),
  csharp: makePassthroughProcessor("csharp"),
  zig: makePassthroughProcessor("zig"),
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Shared pipeline ───────────────────────────────────────────────

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function difficultyBucket(n) {
  if (!Number.isFinite(n)) return "medium";
  if (n <= 3) return "easy";
  if (n <= 6) return "medium";
  return "hard";
}

function buildBody({ introduction, instructions, starter, languageHint }) {
  const parts = [];
  if (introduction) {
    parts.push(introduction.trim());
    parts.push("");
  }
  if (instructions) {
    if (introduction) {
      parts.push("---");
      parts.push("");
    }
    parts.push(instructions.trim());
    parts.push("");
  }
  if (starter && starter.trim().length > 0) {
    parts.push("### Starter");
    parts.push("");
    parts.push("```" + languageHint);
    parts.push(starter.trim());
    parts.push("```");
  }
  return parts.join("\n");
}

function parseHints(raw) {
  if (!raw) return [];
  const text = raw.trim();
  if (text.includes("\n##")) {
    return text
      .split(/\n##+\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const bullets = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*[-*]\s+(.*)$/);
    if (m && m[1].trim()) bullets.push(m[1].trim());
  }
  if (bullets.length > 0) return bullets;
  return [text];
}

// ─── Per-track import driver ─────────────────────────────────────────

function importTrack({ lang, repo, outDir }) {
  const processor = PROCESSORS[lang];
  if (!processor) {
    throw new Error(`No processor wired for --lang ${lang}`);
  }
  if (!existsSync(repo)) {
    throw new Error(`Exercism source not found at ${repo}`);
  }

  function readOptional(path) {
    const abs = join(repo, path);
    if (!existsSync(abs)) return null;
    return readFileSync(abs, "utf8");
  }

  const trackConfig = JSON.parse(readFileSync(join(repo, "config.json"), "utf8"));
  const concepts = trackConfig.exercises?.concept ?? [];
  const practices = trackConfig.exercises?.practice ?? [];

  const conceptLessons = [];
  const practiceLessons = [];
  let skipped = 0;
  let unsupported = 0;

  function buildLesson(ex, kind) {
    if (ex.status === "deprecated" || ex.status === "wip") {
      skipped++;
      return null;
    }
    const exDir = join("exercises", kind, ex.slug);
    const metaPath = join(repo, exDir, ".meta", "config.json");
    if (!existsSync(metaPath)) {
      skipped++;
      return null;
    }
    const meta = JSON.parse(readFileSync(join(repo, metaPath.slice(repo.length + 1)), "utf8"));
    const files = meta.files ?? {};
    const solutionFiles = files.solution ?? [];
    const testFiles = files.test ?? [];
    const exampleFiles = files.example ?? files.exemplar ?? [];

    // Find a runnable single-source path. Tracks that ship a
    // build manifest (Cargo.toml, package.yaml, Sources/…/X.swift)
    // alongside the user-edited file have those listed FIRST in
    // `files.solution`; the actual learner-editable code file
    // comes second. Heuristic: prefer the first file with a
    // common-source extension; fall back to the first file if
    // none match. (Rust ships ["src/lib.rs", "Cargo.toml"] —
    // src/lib.rs is what the learner edits; we ignore Cargo.toml
    // since Libre's Rust runtime takes a single source string.)
    const SOURCE_EXTS = /\.(py|js|ts|tsx|jsx|rs|go|swift|rb|ex|exs|hs|lua|dart|scala|sc|c|cpp|cc|cxx|h|hpp|java|kt|kts|cs|zig)$/i;
    const pickSource = (list) => {
      const match = list.find((p) => SOURCE_EXTS.test(p));
      return match ?? list[0];
    };
    if (solutionFiles.length === 0 || testFiles.length === 0) {
      skipped++;
      return null;
    }
    const starterRel = pickSource(solutionFiles);
    const testRel = pickSource(testFiles);
    const exampleRel = exampleFiles.length > 0 ? pickSource(exampleFiles) : null;

    const starterRaw = readOptional(join(exDir, starterRel));
    const testRaw = readOptional(join(exDir, testRel));
    if (starterRaw === null || testRaw === null) {
      skipped++;
      return null;
    }
    const exampleRaw = exampleRel ? readOptional(join(exDir, exampleRel)) : null;

    const introduction = readOptional(join(exDir, ".docs", "introduction.md"));
    const instructions = readOptional(join(exDir, ".docs", "instructions.md"));
    const hintsRaw = readOptional(join(exDir, ".docs", "hints.md"));

    const solutionBase = basename(starterRel).replace(/\.[^./]+$/, "");
    const moduleName = processor.moduleName(ex.slug, solutionBase);
    const editorRels = [
      ...(files.editor ?? []),
      ...(testFiles.length > 1 ? testFiles.slice(1) : []),
    ];
    const editorFiles = editorRels
      .map((rel) => {
        const content = readOptional(join(exDir, rel));
        if (content === null) return null;
        const modName = basename(rel).replace(/\.[^./]+$/, "").replace(/-/g, "_");
        return { modName, content };
      })
      .filter(Boolean);
    const tests = processor.translateTests(testRaw, moduleName, editorFiles);
    const userPreamble = processor.userPreamble?.(editorFiles) ?? "";

    const lesson = {
      id: slug(ex.slug),
      title: ex.name ?? ex.slug,
      kind: "exercise",
      language: processor.libreLanguageId,
      body: buildBody({
        introduction,
        instructions,
        starter: starterRaw,
        languageHint: processor.libreLanguageId,
      }),
      starter: userPreamble + starterRaw,
      solution: userPreamble + (exampleRaw ?? starterRaw),
      tests,
      hints: parseHints(hintsRaw),
    };
    const diff = Number(ex.difficulty);
    if (Number.isFinite(diff)) {
      lesson.difficulty = difficultyBucket(diff);
    }
    return lesson;
  }

  for (const ex of concepts) {
    const lesson = buildLesson(ex, "concept");
    if (lesson) conceptLessons.push(lesson);
  }
  for (const ex of practices) {
    const lesson = buildLesson(ex, "practice");
    if (lesson) practiceLessons.push(lesson);
  }

  const chapters = [];
  if (conceptLessons.length > 0) {
    chapters.push({ id: "concepts", title: "Concepts", lessons: conceptLessons });
  }
  if (practiceLessons.length > 0) {
    chapters.push({ id: "practice", title: "Practice", lessons: practiceLessons });
  }

  const langLabel = lang.charAt(0).toUpperCase() + lang.slice(1);
  const course = {
    id: `exercism-${lang}`,
    title: `Exercism ${langLabel} Track`,
    author: "Exercism",
    language: processor.libreLanguageId,
    packType: "track",
    releaseStatus: "ALPHA",
    description: `The official Exercism ${langLabel} track (https://github.com/exercism/${lang}). Concept exercises walk through the language's building blocks in prerequisite order; practice exercises stretch what you've learned against canonical algorithmic problems. Each exercise's introduction, instructions, hints, and tests are mirrored verbatim from the upstream MIT-licensed repository.`,
    attribution: {
      upstream: `https://github.com/exercism/${lang}`,
      license: "MIT",
    },
    chapters,
  };

  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "course.json");
  writeFileSync(outPath, JSON.stringify(course, null, 2) + "\n");
  const totalLessons = conceptLessons.length + practiceLessons.length;
  console.log(
    `[${lang}] wrote ${chapters.length} chapters × ${totalLessons} lessons (${skipped} skipped, ${unsupported} unsupported) to ${outPath}`,
  );
  return { lang, chapters: chapters.length, lessons: totalLessons, skipped, outPath };
}

// ─── CLI ────────────────────────────────────────────────────────────

const langs = argBool("all")
  ? Object.keys(PROCESSORS)
  : argFlag("lang")
    ? [argFlag("lang")]
    : [];

if (langs.length === 0) {
  console.error("Usage: import-exercism-track.mjs --lang <name>  OR  --all");
  console.error(`Available: ${Object.keys(PROCESSORS).join(", ")}`);
  process.exit(2);
}

for (const lang of langs) {
  const repo = argFlag("repo", `/tmp/exercism-${lang}`);
  const outDir = argFlag(
    "out",
    join(
      homedir(),
      `Library/Application Support/com.mattssoftware.libre/courses/exercism-${lang}`,
    ),
  );
  try {
    importTrack({ lang, repo, outDir });
  } catch (err) {
    console.error(`[${lang}] failed: ${err.message}`);
  }
}
