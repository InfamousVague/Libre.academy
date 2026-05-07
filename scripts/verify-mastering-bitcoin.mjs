#!/usr/bin/env node
/// Verify every chain-aware lesson in mastering-bitcoin/course.json
/// by running its solution + tests against a fresh chain shell.
///
/// We bypass the full `runBitcoin` runtime dispatcher (its imports
/// chain through extension-less paths that Node's strip-types
/// loader can't resolve without a tsconfig moduleResolution shim);
/// instead we call `buildBitcoinChain()` directly and replicate the
/// same `chain` / `btc` / `expect` / `test` globals the harness
/// would expose at lesson run-time.
///
/// Exits 0 when every chain-aware lesson's solution passes its
/// hidden tests, 1 with detail otherwise.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import * as btc from "@scure/btc-signer";
import { buildBitcoinChain } from "../src/runtimes/bitcoin/buildChain.ts";

const COURSE = join(
  homedir(),
  "Library/Application Support/com.mattssoftware.kata"
    + "/courses/mastering-bitcoin/course.json",
);

// ── Minimal expect() that mirrors the few matchers the lessons use.
// Mirrors `src/runtimes/evm/expect.ts` at the surface level.
function makeExpect() {
  const expect = (actual) => ({
    toBe(expected) {
      if (actual !== expected && !(Number.isNaN(actual) && Number.isNaN(expected))) {
        throw new Error(`Expected ${stringify(actual)} to be ${stringify(expected)}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual, replacer) !== JSON.stringify(expected, replacer)) {
        throw new Error(
          `Expected ${stringify(actual)} to equal ${stringify(expected)}`,
        );
      }
    },
    toBeGreaterThanOrEqual(expected) {
      if (!(actual >= expected)) {
        throw new Error(`Expected ${stringify(actual)} to be >= ${stringify(expected)}`);
      }
    },
    toBeLessThanOrEqual(expected) {
      if (!(actual <= expected)) {
        throw new Error(`Expected ${stringify(actual)} to be <= ${stringify(expected)}`);
      }
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) {
        throw new Error(`Expected ${stringify(actual)} to be > ${stringify(expected)}`);
      }
    },
    not: {
      toBe(expected) {
        if (actual === expected) {
          throw new Error(`Expected ${stringify(actual)} not to be ${stringify(expected)}`);
        }
      },
    },
  });
  return expect;
}

function stringify(v) {
  if (typeof v === "bigint") return `${v}n`;
  try {
    return JSON.stringify(v, replacer);
  } catch {
    return String(v);
  }
}
function replacer(_key, value) {
  return typeof value === "bigint" ? value.toString() + "n" : value;
}

/// Run a plain-JavaScript bitcoin lesson (no `harness: "bitcoin"`).
/// These match the in-app `runJavaScript` worker shape: the test file
/// `require('./user')`s the solution, then calls `test(name, fn)` /
/// `expect(...)` against the exported functions. We replicate that
/// here without spinning up a worker — instantiate the solution as a
/// CommonJS module via `vm.Script`, then evaluate the test code with
/// the same globals injected.
async function runPlainJsTests(solution, testCode) {
  const vm = await import("node:vm");
  const tests = [];
  const userExports = {};
  const userModule = { exports: userExports };

  // Stub require(): only `./user` and a small allow-list of stdlib /
  // crypto helpers the lessons actually reach for.
  const allowedRequires = new Set(["crypto"]);
  const stubRequire = (id) => {
    if (id === "./user" || id === "./user.js") return userModule.exports;
    if (allowedRequires.has(id)) return require(id);
    throw new Error(`require(${JSON.stringify(id)}) blocked in sandbox`);
  };

  // Two patterns coexist in the bitcoin lessons:
  //   A) tests `require('./user')` — solution exports via
  //      `module.exports = { foo }`. We run solution in its own
  //      vm context to capture the exports cleanly, then expose
  //      them via the require shim AND as globals in the test
  //      context so either reference style works.
  //   B) tests use bare names — we run solution + tests in one
  //      shared context so top-level `function foo() {}` from the
  //      solution is in scope when the test calls `foo()`.
  // Pattern detection is keyed on the test source's literal
  // `require('./user')` substring. Lessons split ~50/50; supporting
  // both keeps the verifier honest against the in-app worker which
  // does pattern A natively (tests run in a sandbox that satisfies
  // require) but also supports pattern B because the worker
  // concatenates user + tests into one Function body.
  const usesRequire = /require\(['"]\.\/user['"]\)/.test(testCode);

  const expect = makeExpect();
  let runError = null;
  // Add toThrow / toHaveLength / toMatch + not.* — the matchers the
  // bitcoin JS lessons reach for. Mirrors Jest's surface so the same
  // tests work whether they run here or in the in-browser worker.
  const richExpect = (actual) => {
    const base = expect(actual);
    return {
      ...base,
      toHaveLength(expected) {
        const len = actual?.length;
        if (len !== expected) {
          throw new Error(`Expected length ${expected}, got ${len}`);
        }
      },
      toMatch(re) {
        const str = String(actual);
        const ok = re instanceof RegExp ? re.test(str) : str.includes(String(re));
        if (!ok) throw new Error(`Expected ${stringify(actual)} to match ${re}`);
      },
      toContain(item) {
        if (typeof actual === "string") {
          if (!actual.includes(item)) throw new Error(`Expected ${stringify(actual)} to contain ${stringify(item)}`);
          return;
        }
        if (Array.isArray(actual) || ArrayBuffer.isView(actual)) {
          for (const v of actual) {
            if (v === item) return;
            if (typeof item === "object" && item !== null && JSON.stringify(v, replacer) === JSON.stringify(item, replacer)) return;
          }
          throw new Error(`Expected ${stringify(actual)} to contain ${stringify(item)}`);
        }
        throw new Error(`toContain unsupported on ${typeof actual}`);
      },
      toBeDefined() {
        if (actual === undefined) throw new Error(`Expected value to be defined`);
      },
      toBeUndefined() {
        if (actual !== undefined) throw new Error(`Expected ${stringify(actual)} to be undefined`);
      },
      toBeTruthy() {
        if (!actual) throw new Error(`Expected ${stringify(actual)} to be truthy`);
      },
      toBeFalsy() {
        if (actual) throw new Error(`Expected ${stringify(actual)} to be falsy`);
      },
      toThrow(matcher) {
        let threw = false;
        let caught;
        try { typeof actual === "function" ? actual() : null; } catch (e) { threw = true; caught = e; }
        if (!threw) throw new Error(`Expected function to throw`);
        if (matcher !== undefined) {
          const msg = caught instanceof Error ? caught.message : String(caught);
          if (matcher instanceof RegExp ? !matcher.test(msg) : !msg.includes(String(matcher))) {
            throw new Error(`Expected throw matching ${matcher}, got ${msg}`);
          }
        }
      },
      not: {
        ...base.not,
        toThrow() {
          try { typeof actual === "function" ? actual() : null; }
          catch (e) {
            throw new Error(`Expected not to throw, got ${e instanceof Error ? e.message : String(e)}`);
          }
        },
        toHaveLength(expected) {
          if (actual?.length === expected) throw new Error(`Expected length not to be ${expected}`);
        },
      },
    };
  };

  let prev = Promise.resolve();
  const test = (name, body) => {
    prev = prev.then(async () => {
      try {
        await body();
        tests.push({ name, passed: true });
      } catch (e) {
        tests.push({
          name, passed: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    });
  };

  if (usesRequire) {
    // Pattern A — separate contexts. Solution runs in userCtx with
    // its own module/exports, then tests run in testCtx where
    // require('./user') returns those exports.
    const userCtx = vm.createContext({
      module: userModule, exports: userExports,
      require: stubRequire,
      console: { log() {}, warn() {}, error() {} },
      Buffer, process,
      setTimeout, setInterval, clearTimeout, clearInterval,
    });
    try {
      vm.runInContext(solution, userCtx, { filename: "user.js" });
    } catch (e) {
      runError = `solution failed to load: ${e instanceof Error ? e.message : String(e)}`;
      return { tests, runError };
    }
    const testCtx = vm.createContext({
      require: stubRequire,
      test, expect: richExpect,
      console: { log() {}, warn() {}, error() {} },
      Buffer, process,
      setTimeout, setInterval, clearTimeout, clearInterval,
    });
    try {
      vm.runInContext(testCode, testCtx, { filename: "tests.js" });
      await prev;
    } catch (e) {
      runError = e instanceof Error ? e.message : String(e);
    }
    return { tests, runError };
  }

  // Pattern B — single shared context.
  const sharedCtx = vm.createContext({
    module: userModule, exports: userExports,
    require: stubRequire,
    test, expect: richExpect,
    console: { log() {}, warn() {}, error() {} },
    Buffer, process,
    setTimeout, setInterval, clearTimeout, clearInterval,
  });
  try {
    vm.runInContext(solution, sharedCtx, { filename: "user.js" });
    vm.runInContext(testCode, sharedCtx, { filename: "tests.js" });
    await prev;
  } catch (e) {
    runError = e instanceof Error ? e.message : String(e);
  }
  return { tests, runError };
}

// require() shim for the plain-JS path — node:vm contexts don't have
// require by default, so we hand it through createRequire here once.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

async function runLessonTests(solution, testCode) {
  const chain = buildBitcoinChain();
  const expect = makeExpect();
  const tests = [];

  let prev = Promise.resolve();
  const wrappedBody = (body) => async () => {
    const snapId = chain.snapshot();
    try {
      await body();
    } finally {
      try {
        chain.revert(snapId);
      } catch {
        /* swallow */
      }
    }
  };
  const test = (name, body) => {
    const wrapped = wrappedBody(body);
    prev = prev.then(
      async () => {
        try {
          await wrapped();
          tests.push({ name, passed: true });
        } catch (e) {
          tests.push({
            name,
            passed: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      },
      async () => {
        try {
          await wrapped();
          tests.push({ name, passed: true });
        } catch (e) {
          tests.push({
            name,
            passed: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      },
    );
  };

  const consoleProxy = {
    log: () => {},
    warn: () => {},
    error: () => {},
  };

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new AsyncFunction(
    "chain",
    "btc",
    "expect",
    "test",
    "console",
    `${solution}\n\n${testCode}`,
  );
  let runError = null;
  try {
    await fn(chain, btc, expect, test, consoleProxy);
    await prev;
  } catch (e) {
    runError = e instanceof Error ? e.message : String(e);
  }
  return { tests, runError };
}

const course = JSON.parse(readFileSync(COURSE, "utf8"));

// CLI flag: --filter <substr> narrows the lesson set when iterating
// fixes (so a single failing lesson can be re-run quickly).
const cliArgs = process.argv.slice(2);
const filter = (() => {
  const i = cliArgs.indexOf("--filter");
  return i >= 0 ? cliArgs[i + 1] : null;
})();
const onlyChain = cliArgs.includes("--chain-only");
const onlyJs = cliArgs.includes("--js-only");

let total = 0;
let passed = 0;
const failures = [];

for (const ch of course.chapters) {
  for (const l of ch.lessons) {
    if (l.kind !== "exercise" && l.kind !== "mixed") continue;
    if (filter && !l.id.includes(filter)) continue;
    const isChain = l.harness === "bitcoin";
    const isPlainJs = !l.harness && l.language === "javascript";
    if (!isChain && !isPlainJs) continue;
    if (onlyChain && !isChain) continue;
    if (onlyJs && !isPlainJs) continue;
    total++;
    const { tests, runError } = isChain
      ? await runLessonTests(l.solution ?? "", l.tests ?? "")
      : await runPlainJsTests(l.solution ?? "", l.tests ?? "");
    const failedTests = tests.filter((t) => !t.passed);
    if (runError || failedTests.length > 0) {
      failures.push({ chapter: ch.id, lesson: l.id, kind: isChain ? "chain" : "js", runError, failedTests });
      console.log(`✗ [${ch.id}] ${l.id} ${isChain ? "(chain)" : "(js)"}`);
      if (runError) console.log(`    runtime error: ${runError}`);
      for (const t of failedTests) {
        console.log(`    ✗ ${t.name}\n      ${t.error.split("\n").slice(0, 4).join("\n      ")}`);
      }
    } else {
      passed++;
      console.log(`✓ [${ch.id}] ${l.id} ${isChain ? "(chain)" : "(js)"} — ${tests.length} tests`);
    }
  }
}

console.log();
console.log(`${passed}/${total} exercises passing (${failures.length} failing)`);
if (failures.length) {
  process.exit(1);
}
