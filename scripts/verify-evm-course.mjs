#!/usr/bin/env node
/// Headless EVM-lesson verifier. Spawns the same `buildChain` +
/// `expect` machinery the in-app cmd+K verifier uses, compiles every
/// `harness: "evm"` exercise's solution via npm `solc`, runs the
/// lesson's `tests` source against the live VM, and writes a
/// markdown report identical in shape to the in-app one.
///
/// **Why this exists.** Iterating on lesson fixes via the in-app
/// verifier requires the user to relaunch + click cmd+K every cycle.
/// This CLI runs the same code paths against the same TS source —
/// no app, no rebuild — so AI-driven lesson cleanup can iterate
/// against a real signal.
///
/// **What it shares with the app:**
///   - `src/runtimes/evm/buildChain.ts` (the giant VM closure)
///   - `src/runtimes/evm/expect.ts` (Jest-style matchers)
///   - `src/runtimes/evm/helpers.ts` (`stringify`, `normalizeContractArgs`)
/// They're bundled into a temp ESM module on startup via esbuild so
/// Node can import them without TS preprocessing.
///
/// **What it differs:**
///   - solc loads from the npm package (sync, fast) instead of the
///     in-browser soljson vendor blob.
///   - The chain has no UI hooks — `ChainAttachHooks` is omitted.
///   - There's no playground / runner UI; logs go to stdout / report.
///
/// **Usage:**
///   node scripts/verify-evm-course.mjs                          # all evm lessons in mastering-ethereum
///   node scripts/verify-evm-course.mjs --lesson <id>            # one lesson
///   node scripts/verify-evm-course.mjs --course <id-or-path>    # different course (live install OR a path)
///   node scripts/verify-evm-course.mjs --report report.md       # write markdown report to a file
///   node scripts/verify-evm-course.mjs --json                   # machine-readable output to stdout
///   node scripts/verify-evm-course.mjs --filter <substr>        # only lessons whose id contains substr
///
/// Exit code: 0 if all ran lessons passed, 1 otherwise. Non-evm
/// lessons (reading / quiz / non-evm-harness exercises) are skipped
/// silently.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const require = createRequire(import.meta.url);
const solc = require("solc");

// ─── arg parsing ─────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}
function bool(name) {
  return args.includes(name);
}

const courseArg = flag("--course") ?? "mastering-ethereum";
const lessonArg = flag("--lesson");
const filterArg = flag("--filter");
const reportPath = flag("--report");
const jsonOut = bool("--json");
const verbose = bool("--verbose") || bool("-v");

// Allow --course to be either an installed-course id or a path to a
// course.json. Bare ids resolve under the live app-data install dir.
function resolveCoursePath(idOrPath) {
  if (isAbsolute(idOrPath) && existsSync(idOrPath)) return idOrPath;
  if (idOrPath.endsWith(".json") && existsSync(resolve(idOrPath))) {
    return resolve(idOrPath);
  }
  const live = join(
    homedir(),
    "Library/Application Support/com.mattssoftware.kata/courses",
    idOrPath,
    "course.json",
  );
  if (existsSync(live)) return live;
  const bundled = join(ROOT, "public/starter-courses", `${idOrPath}.json`);
  if (existsSync(bundled)) return bundled;
  throw new Error(
    `course not found: tried '${idOrPath}', '${live}', '${bundled}'`,
  );
}

const COURSE_PATH = resolveCoursePath(courseArg);
if (verbose) console.error(`[verify] course: ${COURSE_PATH}`);

// ─── bundle the TS chain into a Node-importable ESM module ────────
//
// The buildChain closure + expect + helpers are TypeScript that
// imports from `viem` / `@ethereumjs/*` (all installed). esbuild
// transpiles + emits a single .mjs we can dynamic-import. The
// alternative — `tsx` — would also work but adds a dep + a
// double-fork. esbuild is already in the project's devDeps.
// Bundle has to live INSIDE the repo so Node's resolver finds the
// project's `node_modules/@ethereumjs/*` + `node_modules/viem`. A
// /tmp dir would fail with ERR_MODULE_NOT_FOUND. `.cache/` is
// .gitignored upstream and a natural home for derived artifacts.
const BUNDLE_DIR = join(ROOT, "node_modules/.cache/fishbones-evm-headless");
mkdirSync(BUNDLE_DIR, { recursive: true });
const BUNDLE_PATH = join(BUNDLE_DIR, "chain-bundle.mjs");
const ENTRY_PATH = join(BUNDLE_DIR, "chain-entry.ts");

writeFileSync(
  ENTRY_PATH,
  `export { buildChain } from ${JSON.stringify(join(ROOT, "src/runtimes/evm/buildChain.ts"))};
export { expect } from ${JSON.stringify(join(ROOT, "src/runtimes/evm/expect.ts"))};
export { stringify, normalizeContractArgs } from ${JSON.stringify(join(ROOT, "src/runtimes/evm/helpers.ts"))};
export { makeTestRequire } from ${JSON.stringify(join(ROOT, "src/runtimes/evm/testRequire.ts"))};
`,
  "utf8",
);

await esbuild.build({
  entryPoints: [ENTRY_PATH],
  outfile: BUNDLE_PATH,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  packages: "external", // viem / @ethereumjs / @noble — let Node resolve them
  logLevel: verbose ? "warning" : "silent",
});

const { buildChain, expect, makeTestRequire } = await import(
  pathToFileURL(BUNDLE_PATH).href
);

// ─── solc helpers (Node side) ────────────────────────────────────

/// Build the standard JSON input shape solc expects. Mirrors what
/// `runtimes/solidity.ts::buildSolcInput` produces in the browser.
function buildSolcInput(files) {
  const sources = {};
  for (const f of files) sources[f.name] = { content: f.content };
  return JSON.stringify({
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] },
      },
    },
  });
}

/// Compile + normalise into the same `CompiledOutput` shape buildChain expects.
function compileSolidity(files) {
  const input = buildSolcInput(files);
  const out = JSON.parse(solc.compile(input));
  const compiled = { contracts: {}, errors: out.errors };
  for (const [file, perFile] of Object.entries(out.contracts ?? {})) {
    compiled.contracts[file] = {};
    for (const [name, info] of Object.entries(perFile)) {
      compiled.contracts[file][name] = {
        abi: info.abi,
        bytecode: ("0x" + (info.evm?.bytecode?.object ?? "")),
        deployedBytecode: ("0x" + (info.evm?.deployedBytecode?.object ?? "")),
      };
    }
  }
  return compiled;
}

// ─── headless `runEvm` reproduction ──────────────────────────────
//
// Mirrors `src/runtimes/evm.ts::runEvm` minus the UI bits + minus
// the persistent-chain singleton (we always build a fresh ephemeral
// chain per lesson). Same test-fn injection shape so test sources
// written against the in-app harness run unchanged.
async function runEvmHeadless(files, testCode) {
  const tests = [];
  const logs = [];
  let compiled;
  try {
    compiled = compileSolidity(files);
  } catch (e) {
    return {
      logs: [{ level: "error", text: `solc threw: ${e.message}` }],
      tests: [],
      compileError: e.message,
    };
  }
  const fatal = (compiled.errors ?? []).filter((d) => d.severity === "error");
  if (fatal.length) {
    return {
      logs: fatal.map((d) => ({ level: "error", text: d.formattedMessage ?? d.message })),
      tests: [],
      compileError: fatal.map((d) => d.formattedMessage ?? d.message).join("\n"),
    };
  }
  if (Object.keys(compiled.contracts).length === 0) {
    return {
      logs: [{ level: "error", text: "solc produced no contracts" }],
      tests: [],
      compileError: "no contracts emitted",
    };
  }

  const chain = await buildChain(compiled, {});

  // Same `test()` collector shape `runEvm` uses — every test() call
  // pushes one row into `tests`, deferred sequentially through a
  // promise chain so a deploy in test-A finishes before test-B's
  // deploy nonce-races it.
  let prev = Promise.resolve();
  const wrappedBody = (body) => async () => {
    const snapId = await chain.snapshot();
    try {
      await body();
    } finally {
      try {
        await chain.revert(snapId);
      } catch { /* swallow */ }
    }
  };
  const testFn = (name, body) => {
    const wrapped = wrappedBody(body);
    prev = prev.then(
      async () => {
        try {
          await wrapped();
          tests.push({ name, status: "pass" });
        } catch (e) {
          tests.push({
            name,
            status: "fail",
            error: e instanceof Error ? e.message : String(e),
          });
        }
      },
      async () => {},
    );
  };

  // `compiled` view that the in-app harness exposes — file-keyed
  // primary lookup, flat fallback, plus chain's encode helpers
  // re-exported so test bodies can do `compiled.keccak256(...)`.
  const flatContracts = {};
  for (const file of Object.keys(compiled.contracts)) {
    for (const [name, info] of Object.entries(compiled.contracts[file])) {
      flatContracts[name] = info;
    }
  }
  const compiledView = {
    ...compiled,
    contracts: new Proxy(compiled.contracts, {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (prop in flatContracts) return flatContracts[prop];
        return undefined;
      },
      has(target, prop) {
        return prop in target || prop in flatContracts;
      },
    }),
    keccak256: chain.keccak256,
    encodeAbiParameters: chain.encodeAbiParameters,
    decodeAbiParameters: chain.decodeAbiParameters,
    encodeFunctionData: chain.encodeFunctionData,
    decodeFunctionResult: chain.decodeFunctionResult,
  };

  const consoleProxy = {
    log: (...a) => logs.push({ level: "info", text: a.join(" ") }),
    warn: (...a) => logs.push({ level: "warn", text: a.join(" ") }),
    error: (...a) => logs.push({ level: "error", text: a.join(" ") }),
  };
  // Reuse the in-app shim verbatim (extracted from runEvm into
  // ./evm/testRequire.ts so the headless CLI and the in-app
  // verifier hand identical surfaces to lesson tests).
  const testRequire = makeTestRequire();

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction(
      "compiled",
      "chain",
      "expect",
      "test",
      "console",
      "require",
      testCode,
    );
    await fn(compiledView, chain, expect, testFn, consoleProxy, testRequire);
    await prev;
  } catch (e) {
    logs.push({
      level: "error",
      text: `Test harness error: ${e instanceof Error ? e.message : String(e)}`,
    });
  }
  return { logs, tests };
}

// ─── walk the course + drive the runner ──────────────────────────

const course = JSON.parse(readFileSync(COURSE_PATH, "utf8"));
const targets = [];
for (const ch of course.chapters ?? []) {
  for (const lesson of ch.lessons ?? []) {
    if (lesson.kind !== "exercise" && lesson.kind !== "mixed") continue;
    if (lesson.harness !== "evm") continue;
    if (lessonArg && lesson.id !== lessonArg) continue;
    if (filterArg && !lesson.id.includes(filterArg)) continue;
    targets.push({ chapterId: ch.id, lesson });
  }
}

if (targets.length === 0) {
  console.error("No matching EVM exercises.");
  process.exit(2);
}

if (verbose) console.error(`[verify] running ${targets.length} lesson(s)\n`);

function deriveSolutionFiles(lesson) {
  if (Array.isArray(lesson.solutionFiles) && lesson.solutionFiles.length > 0) {
    return lesson.solutionFiles.map((f) => ({
      name: f.name,
      content: f.content,
    }));
  }
  if (typeof lesson.solution === "string" && lesson.solution.trim()) {
    return [{ name: "Contract.sol", content: lesson.solution }];
  }
  return [];
}

const results = [];
for (let i = 0; i < targets.length; i++) {
  const { chapterId, lesson } = targets[i];
  const files = deriveSolutionFiles(lesson);
  const testCode = lesson.tests ?? "";
  const tag = `[${i + 1}/${targets.length}] ${lesson.id}`;
  if (verbose) process.stderr.write(`${tag} ... `);
  const started = Date.now();
  let runResult;
  try {
    runResult = await runEvmHeadless(files, testCode);
  } catch (e) {
    runResult = {
      logs: [{ level: "error", text: e instanceof Error ? e.message : String(e) }],
      tests: [],
    };
  }
  const durationMs = Date.now() - started;
  const passedTests = runResult.tests.filter((t) => t.status === "pass").length;
  const failedTests = runResult.tests.filter((t) => t.status === "fail");
  const harnessError = runResult.logs.find((l) => l.level === "error" && l.text.startsWith("Test harness error"));
  const compileError = runResult.compileError;
  const ok = !compileError && !harnessError && failedTests.length === 0 && runResult.tests.length > 0;
  results.push({
    id: lesson.id,
    title: lesson.title,
    chapterId,
    durationMs,
    ok,
    compileError,
    harnessError: harnessError?.text,
    tests: runResult.tests,
    logs: runResult.logs,
  });
  if (verbose) {
    if (ok) process.stderr.write(`✓ ${passedTests}/${passedTests} (${durationMs}ms)\n`);
    else process.stderr.write(`✗ ${passedTests}/${runResult.tests.length}${compileError ? " (compile error)" : harnessError ? " (harness error)" : ""} (${durationMs}ms)\n`);
  }
}

// ─── report ──────────────────────────────────────────────────────

if (jsonOut) {
  process.stdout.write(JSON.stringify({ courseId: course.id ?? courseArg, results }, null, 2) + "\n");
} else {
  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const lines = [];
  lines.push(`# Headless EVM verification: ${course.title ?? course.id ?? courseArg}`);
  lines.push("");
  lines.push(`**Total:** ${results.length} · **Passed:** ${passed.length} · **Failed:** ${failed.length}  `);
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push("");
  if (failed.length > 0) {
    lines.push(`## ✗ Failed (${failed.length})`);
    lines.push("");
    for (const r of failed) {
      lines.push(`### ${r.title ?? r.id} \`(${r.id})\``);
      lines.push(`- chapter: \`${r.chapterId}\` · duration: ${(r.durationMs / 1000).toFixed(2)}s`);
      if (r.compileError) {
        lines.push("");
        lines.push("**Compile error:**");
        lines.push("```");
        lines.push(r.compileError.split("\n").slice(0, 30).join("\n"));
        lines.push("```");
      } else if (r.harnessError) {
        lines.push("");
        lines.push(`**Harness error:** \`${r.harnessError}\``);
      } else {
        lines.push("");
        lines.push("**Failed tests:**");
        for (const t of r.tests.filter((t) => t.status === "fail")) {
          lines.push(`- \`${t.name}\` — ${t.error?.split("\n")[0] ?? "(no message)"}`);
        }
      }
      lines.push("");
    }
  }
  if (passed.length > 0) {
    lines.push(`## ✓ Passed (${passed.length})`);
    lines.push("");
    lines.push("<details><summary>show list</summary>");
    lines.push("");
    for (const r of passed) lines.push(`- ${r.title ?? r.id} \`(${r.id})\``);
    lines.push("");
    lines.push("</details>");
  }
  const md = lines.join("\n") + "\n";
  if (reportPath) {
    writeFileSync(reportPath, md, "utf8");
    console.error(`wrote ${reportPath}`);
  } else {
    process.stdout.write(md);
  }
}

process.exit(results.every((r) => r.ok) ? 0 : 1);
