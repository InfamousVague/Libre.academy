#!/usr/bin/env node
/// Bulk-author EVM-harness exercises for `mastering-ethereum` (and
/// any other course where `harness: "evm"` makes sense). Calls
/// Anthropic directly using a system prompt that documents the
/// `chain.*` API the in-process @ethereumjs/vm runner exposes
/// (see src/runtimes/evm.ts).
///
/// Different shape from `bulk-generate-challenges.mjs`:
///   - We target a SPECIFIC course (mastering-ethereum), not a
///     fresh language pack — exercises get appended to existing
///     chapters.
///   - Each lesson is `kind: "exercise"`, `language: "solidity"`,
///     `harness: "evm"`. The starter is real Solidity; the tests
///     are JavaScript driving `chain.deploy(...)` etc.
///   - Topics are EVM-flavoured (storage, modifiers, events,
///     reverts, payable, time, multi-actor).
///
/// Usage:
///   node scripts/bulk-generate-evm-lessons.mjs                 # 20 new
///   COUNT=10 node scripts/bulk-generate-evm-lessons.mjs        # 10 new
///   COURSE_ID=solidity-complete node scripts/...               # other course
///   DRY_RUN=1 node scripts/...                                 # plan only
///   CONCURRENCY=4 node scripts/...                             # default 4

import {
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const APP_SUPPORT = join(
  homedir(),
  "Library/Application Support/com.mattssoftware.kata",
);
const SETTINGS_PATH = join(APP_SUPPORT, "settings.json");
const COURSES_DIR = join(APP_SUPPORT, "courses");

const COURSE_ID = process.env.COURSE_ID ?? "mastering-ethereum";
const COUNT = Number(process.env.COUNT ?? 20);
const DRY_RUN = !!process.env.DRY_RUN;
const MODEL = process.env.MODEL ?? "claude-sonnet-4-5";
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY ?? 4));

/// Topic + difficulty buckets the LLM rotates through. Each entry is
/// (chapter id, topic, difficulty). We bias toward MEDIUM since
/// realistic deploy+call exercises rarely fit in the easy 5-10 line
/// budget — the simplest "compile + read storage" already takes ~15.
const PLAN = [
  // ── Easy: single contract, one piece of state ───────────────
  ["ch04-evm", "storage variables", "easy"],
  ["ch04-evm", "view + pure functions", "easy"],
  ["ch04-evm", "constructor with args", "easy"],
  ["ch04-evm", "modifiers", "easy"],
  ["ch04-evm", "events (single emit)", "easy"],
  ["ch07-contracts", "increment counter", "easy"],
  ["ch07-contracts", "boolean toggle", "easy"],

  // ── Medium: multi-function contracts, simple invariants ────
  ["ch07-contracts", "owner-only access control", "medium"],
  ["ch07-contracts", "ETH deposit + withdraw (payable)", "medium"],
  ["ch07-contracts", "ERC-20-style balances mapping", "medium"],
  ["ch07-contracts", "events with indexed args", "medium"],
  ["ch07-contracts", "custom errors with revert payloads", "medium"],
  ["ch04-evm", "checks-effects-interactions pattern", "medium"],
  ["ch07-contracts", "time-locked withdrawal (block.timestamp)", "medium"],
  ["ch07-contracts", "fixed-supply token transfers", "medium"],
  ["ch07-contracts", "two-of-three multi-sig approve flow", "medium"],

  // ── Hard: cross-contract, edge cases, gas / signing ─────────
  ["ch07-contracts", "factory deploys child contract via new", "hard"],
  ["ch07-contracts", "auction with refund on outbid", "hard"],
  ["ch07-contracts", "vesting cliff + linear unlock over time", "hard"],
  ["ch07-contracts", "reentrancy guard with mutex", "hard"],
];

const SUPPORTED_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

function readSettings() {
  if (!existsSync(SETTINGS_PATH))
    throw new Error(`settings.json not found at ${SETTINGS_PATH}`);
  return JSON.parse(readFileSync(SETTINGS_PATH, "utf8"));
}

function loadCourse() {
  const dir = join(COURSES_DIR, COURSE_ID);
  const path = join(dir, "course.json");
  if (!existsSync(path)) throw new Error(`no course at ${path}`);
  return { dir, path, course: JSON.parse(readFileSync(path, "utf8")) };
}

const SYSTEM_PROMPT = `You author ONE chain-aware Solidity exercise for the Fishbones app's mastering-ethereum course. Each exercise compiles real Solidity, deploys it to an in-process EVM, and exercises real tx flows — NOT just ABI checks.

Return a single JSON object:

  {
    "title": "short descriptive title (≤ 60 chars)",
    "body": "markdown problem statement: what to build, signature shape, 1-2 examples, edge cases",
    "starter": "a complete .sol file with the contract scaffolded but the function bodies marked TODO. MUST compile (use trivial defaults like \`return 0;\` so solc is happy).",
    "solution": "the working .sol file — passes every test below",
    "tests": "JavaScript test code that uses the chain.* harness (see API below) — each test is wrapped in test('name', async () => { ... })",
    "hints": ["1-3 progressive hints"]
  }

THE chain HARNESS (always available in tests):

  // Pre-funded EOAs — same private keys as anvil prints. accounts[0] === chain.account.
  chain.account: { address: \`0x...\`, privateKey: \`0x...\` }
  chain.accounts: AccountHandle[10]

  // Deploy + interact
  const ctr = await chain.deploy("ContractName", [arg1, arg2], { value?: 1n * 10n**18n, from?: chain.accounts[1] });
  await ctr.read.<viewFn>(...args);          // returns ABI-decoded value
  const r = await ctr.write.<fn>(...args);   // returns { status, logs, events, gasUsed, blockNumber }
  const r = await ctr.write.<fn>(...args, { value: 1n * 10n**18n }); // attach ETH
  ctr.connect(otherAccount).write.<fn>(...); // re-bind sender

  // Asserts
  await chain.expectRevert(promise, "ExpectedErrorName");
  expect(value).toBe(0n);
  expect(value).toEqual([1n, 2n]);
  expect(value).toBeGreaterThan(0n);
  expect(value).toContain("substr");

  // Events
  const r = await ctr.write.transfer(...);
  expect(r.events).toEqual([{ eventName: "Transfer", args: { ... } }]);
  // OR via the global filter:
  const logs = await chain.getLogs({ abi, eventName: "Transfer" });

  // Multi-actor
  const alt = chain.accounts[1];
  const r = await ctr.connect(alt).write.deposit({ value: 10n ** 17n });

  // Time + blocks
  await chain.warp(86400);   // bump block.timestamp by 1 day
  await chain.mine(1);       // advance block.number
  chain.blockNumber();       // bigint
  chain.blockTimestamp();    // bigint

  // Money
  await chain.balanceOf(addr);                    // bigint
  await chain.setBalance(addr, 5n * 10n**18n);    // anvil/ganache convention

  // Snapshot + revert (for per-test isolation if needed)
  const snap = await chain.snapshot();
  // ... mutate state ...
  await chain.revert(snap);

WRITING RULES — NON-NEGOTIABLE:

  1. The starter MUST compile. Mark function bodies with \`// TODO\` + a trivial \`return 0;\` / empty body / etc. so solc emits valid bytecode and the test framework can deploy it (and at least one test fails cleanly against the stub instead of all tests crashing on a compile error).

  2. The solution MUST pass every test. Mentally run the tests against the solution before returning — if any assertion is unsatisfiable (e.g. you assert balance == 100 but the solution only writes 99), rewrite the test or the solution.

  3. ≥ 3 test cases minimum: a normal case, an edge case (boundary, zero, overflow, empty input as applicable), AND at least one revert/error case where appropriate.

  4. NO new contract names beyond what the starter declares. The deploy("Name") string must match the contract in the .sol file.

  5. Use BigInt literals (\`100n\`, \`10n ** 18n\`) for every numeric — Solidity uint values come back as bigint.

  6. Use viem-style chained reads: \`await counter.read.value()\` not \`await counter.value()\`.

  7. NO solidity.contracts[...].abi inspection in tests. The whole point of harness:evm is you deploy + call the bytecode. ABI checks belong in the legacy compile-only tests.

  8. NO importing libraries inside test code. The harness exposes exactly: \`compiled\`, \`chain\`, \`expect\`, \`test\`, \`console\`. (No viem, no ethers, no chai imports.)

  9. Keep contract sources self-contained — no \`import "@openzeppelin/...\"\`. The in-process compiler resolves only the user-supplied files. If you need ERC-20 semantics, write the relevant function inline.

  10. Solidity pragma: use \`pragma solidity ^0.8.26;\` to match the runtime's Cancun hardfork.

DIFFICULTY GUIDE:
  easy   — single function, single state slot, ~10-25 lines of solution; tests do read+write+assert.
  medium — 2-4 functions, modifier or mapping or event, 25-60 lines; tests do multi-actor or revert.
  hard   — multiple contracts, time/block manipulation, gas accounting, or non-obvious invariants; 60-150 lines.

EXAMPLE — what a complete response looks like (storage variables, easy):

{
  "title": "Read and Write a uint256",
  "body": "## Storage 101\\n\\nImplement \`Storage\` with:\\n  - \`uint256 public stored\`\\n  - \`store(uint256 x)\` — sets \`stored = x\`\\n  - \`retrieve()\` returning \`stored\`\\n\\nThe public getter for \`stored\` is auto-generated by Solidity, so \`retrieve()\` is a deliberate duplicate to give you practice writing a view function.\\n\\nReverts: nothing here should revert.",
  "starter": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.26;\\n\\ncontract Storage {\\n    uint256 public stored;\\n\\n    function store(uint256 x) external {\\n        // TODO\\n    }\\n\\n    function retrieve() external view returns (uint256) {\\n        // TODO\\n        return 0;\\n    }\\n}\\n",
  "solution": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.26;\\n\\ncontract Storage {\\n    uint256 public stored;\\n\\n    function store(uint256 x) external { stored = x; }\\n    function retrieve() external view returns (uint256) { return stored; }\\n}\\n",
  "tests": "test('starts at zero', async () => {\\n  const s = await chain.deploy('Storage');\\n  expect(await s.read.stored()).toBe(0n);\\n  expect(await s.read.retrieve()).toBe(0n);\\n});\\n\\ntest('store writes the value', async () => {\\n  const s = await chain.deploy('Storage');\\n  await s.write.store(42n);\\n  expect(await s.read.stored()).toBe(42n);\\n  expect(await s.read.retrieve()).toBe(42n);\\n});\\n\\ntest('overwrite replaces, not accumulates', async () => {\\n  const s = await chain.deploy('Storage');\\n  await s.write.store(7n);\\n  await s.write.store(99n);\\n  expect(await s.read.stored()).toBe(99n);\\n});\\n",
  "hints": [
    "stored is a state variable — assign to it inside store().",
    "retrieve() returns the current value of stored — single line."
  ]
}

Return ONLY the JSON object. Begin with \`{\`, end with \`}\`. No markdown fences, no preamble.`;

async function callAnthropic({ apiKey, chapterId, topic, difficulty }) {
  const userPrompt = `Course: mastering-ethereum
Chapter: ${chapterId}
Topic: ${topic}
Difficulty: ${difficulty}

Generate one chain-aware Solidity exercise matching the constraints above. Return ONLY the JSON.`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "output-128k-2025-02-19",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (res.ok) {
      const body = await res.json();
      const text =
        body.content
          ?.filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("") ?? "";
      return { text, usage: body.usage };
    }
    if (res.status === 429 || res.status >= 500) {
      const delay = 2000 * Math.pow(2, attempt);
      const errBody = await res.text().catch(() => "");
      console.warn(
        `  ⚠ ${res.status} on ${chapterId}/${topic}, retry in ${delay}ms (${errBody.slice(0, 80)})`,
      );
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }
  throw new Error(`exhausted retries for ${chapterId}/${topic}`);
}

function parseJsonTolerant(raw) {
  try {
    return JSON.parse(raw);
  } catch {}
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try {
      return JSON.parse(fence[1]);
    } catch {}
  }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {}
  }
  return null;
}

function slug(s) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "evm"
  );
}

function ensureChapter(course, chapterId, title) {
  let ch = course.chapters.find((c) => c.id === chapterId);
  if (!ch) {
    ch = { id: chapterId, title, lessons: [] };
    course.chapters.push(ch);
  }
  return ch;
}

async function runWithPool(items, concurrency, worker) {
  let next = 0;
  async function take() {
    while (next < items.length) {
      const i = next++;
      try {
        await worker(items[i], i);
      } catch (e) {
        console.warn(`  ✗ slot ${i}: ${e.message}`);
      }
    }
  }
  await Promise.all(
    Array(Math.min(concurrency, items.length))
      .fill(0)
      .map(take),
  );
}

async function main() {
  const settings = readSettings();
  const apiKey = settings.anthropic_api_key;
  if (!apiKey) throw new Error("no anthropic_api_key in settings.json");

  const handle = loadCourse();
  console.log(`[evm-gen] course ${COURSE_ID}`);
  console.log(`[evm-gen] model: ${MODEL}, concurrency: ${CONCURRENCY}`);
  console.log(`[evm-gen] PLAN size: ${PLAN.length}, COUNT: ${COUNT}`);

  const slots = PLAN.slice(0, COUNT)
    .filter(([, , d]) => SUPPORTED_DIFFICULTIES.has(d))
    .map(([chapterId, topic, difficulty], i) => ({
      chapterId,
      topic,
      difficulty,
      index: i,
    }));

  const existingIds = new Set(
    handle.course.chapters.flatMap((c) => c.lessons.map((l) => l.id)),
  );
  const nextId = (base) => {
    let id = base;
    let n = 2;
    while (existingIds.has(id)) {
      id = `${base}-${n++}`;
    }
    existingIds.add(id);
    return id;
  };

  if (DRY_RUN) {
    for (const s of slots) {
      console.log(`  [dry] ${s.chapterId}/${s.topic} (${s.difficulty})`);
    }
    return;
  }

  let totalIn = 0;
  let totalOut = 0;
  let savedSinceLast = 0;
  await runWithPool(slots, CONCURRENCY, async (slot) => {
    const tag = `${slot.chapterId}/${slot.topic}`;
    try {
      const { text, usage } = await callAnthropic({
        apiKey,
        chapterId: slot.chapterId,
        topic: slot.topic,
        difficulty: slot.difficulty,
      });
      totalIn += usage?.input_tokens || 0;
      totalOut += usage?.output_tokens || 0;
      const parsed = parseJsonTolerant(text);
      if (!parsed) {
        console.log(`  ✗ ${tag}: unparseable response`);
        return;
      }
      const idBase = `${slot.chapterId}-${slug(slot.topic)}`;
      const lesson = {
        id: nextId(idBase),
        kind: "exercise",
        title: parsed.title || `${slot.topic} (${slot.difficulty})`,
        body: parsed.body || "",
        language: "solidity",
        harness: "evm",
        difficulty: slot.difficulty,
        topic: slot.topic,
        starter: parsed.starter || "",
        solution: parsed.solution || "",
        tests: parsed.tests || "",
        hints: parsed.hints || [],
      };
      // Map chapter ids to display titles when creating new chapters.
      const chapterTitles = {
        "ch04-evm": "The EVM",
        "ch07-contracts": "Smart Contracts",
      };
      ensureChapter(
        handle.course,
        slot.chapterId,
        chapterTitles[slot.chapterId] || slot.chapterId,
      ).lessons.push(lesson);
      savedSinceLast++;
      if (savedSinceLast >= 3) {
        writeFileSync(
          handle.path,
          JSON.stringify(handle.course, null, 2),
          "utf-8",
        );
        savedSinceLast = 0;
      }
      console.log(`  ✓ ${tag} → ${lesson.title}`);
    } catch (e) {
      console.log(`  ✗ ${tag}: ${e.message}`);
    }
  });

  writeFileSync(handle.path, JSON.stringify(handle.course, null, 2), "utf-8");

  const PRICING = {
    "claude-sonnet-4-5": { in: 3, out: 15 },
    "claude-opus-4-5": { in: 15, out: 75 },
    "claude-haiku-4-5": { in: 1, out: 5 },
  };
  const p = PRICING[MODEL] || PRICING["claude-sonnet-4-5"];
  const usd = (totalIn / 1_000_000) * p.in + (totalOut / 1_000_000) * p.out;
  console.log(
    `\n[evm-gen] tokens in=${totalIn.toLocaleString()} out=${totalOut.toLocaleString()} ≈ $${usd.toFixed(2)}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
