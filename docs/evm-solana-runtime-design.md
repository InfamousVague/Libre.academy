# EVM, Vyper & Solana runtimes — design

Goal: replace the "compile + grep the ABI" pattern with **real deploy-and-call exercises** so courses (`mastering-ethereum`, `viem-ethers`, `solidity-complete`, `vyper-fundamentals`, `solana-programs`) can teach what learners actually do on chain.

Status today (verified):

| Course | exercises | what tests check |
|---|---|---|
| `solidity-complete` | many | `compiled.contracts[…].abi` shape — never executes |
| `mastering-ethereum` | 8 (all `javascript`) | wei↔ether math, hex codecs — no chain |
| `viem-ethers` | many (TS) | encoding/decoding only |
| `vyper-fundamentals` | **0 exercises** (40 reading, 16 micropuzzle, 12 quiz) | — |
| `solana-programs` | 20 (all `rust`) | hand-stubbed `sol::*` types in the same file |

---

## 1. EVM — pick: in-process `@ethereumjs/vm`

Three options weighed:

| Option | Bundle | Offline | Realistic? | Verdict |
|---|---|---|---|---|
| `@ethereumjs/vm` + `solc-js` (in-process) | ~500 KB gz | ✅ | ✅ executes the same bytecode the EVM runs | **chosen** |
| Bundled `anvil` / `hardhat node` | n/a in browser | desktop-only | ✅ | secondary — Tauri sidecar later |
| Live testnet (Sepolia + Alchemy) | small | ❌ | ✅ but rate-limited, needs faucet keys, backend | rejected for POC — adds infra and a billable RPC dependency |

`@ethereumjs/vm` runs in the browser, persists state across calls, supports snapshots, and accepts the *exact* bytecode `solc-js` already produces — no API impedance. It's also what Remix uses for its "JavaScript VM" environment. Web build stays self-contained; desktop gets the same path.

### New deps

```
"@ethereumjs/vm": "^8",
"@ethereumjs/tx": "^5",
"@ethereumjs/common": "^4",
"@ethereumjs/util": "^9",
"viem": "^2"     // ABI encode/decode + types — already used in course content
```

Total cost on first load: ~500 KB gzipped. Lazy-imported behind the `solidity`/`evm` dispatch case so non-EVM lessons don't pay it.

### New test harness signature

A new `harness: "evm"` flag on `ExerciseLesson` opts in. When set, the existing `compiled` global stays, and a new `chain` object is injected:

```js
test("counter increments", async () => {
  const counter = await chain.deploy("Counter");          // address-bound proxy
  expect(await counter.read.value()).toBe(0n);
  const receipt = await counter.write.increment();
  expect(receipt.status).toBe("success");
  expect(await counter.read.value()).toBe(1n);
});

test("only owner can withdraw", async () => {
  const vault = await chain.deploy("Vault", [chain.account.address]);
  const stranger = chain.newAccount({ balance: 10n ** 18n });
  await chain.expectRevert(
    vault.connect(stranger).write.withdraw(),
    "NotOwner",
  );
});
```

`chain` exposes:

- `chain.account` — pre-funded EOA (`address`, `privateKey`, `nonce`)
- `chain.newAccount({ balance })` — additional pre-funded EOAs for multi-actor tests
- `chain.deploy(name, args?, { value?, from? })` — pulls bytecode + ABI from `compiled`, returns a `ContractInstance` with viem-shaped `read.<fn>(...)` / `write.<fn>(...)` proxies
- `chain.getContract(name, address)` — wrap an existing address
- `chain.expectRevert(promise, signature?)` — assertion sugar
- `chain.snapshot()` / `chain.revert(id)` — checkpointing for per-`test` isolation
- `chain.mine(blocks?)`, `chain.warp(seconds)` — time/block control
- `chain.balanceOf(address)`, `chain.getLogs(filter)` — read helpers

Implementation maps each `read`/`write` call to ABI-encode (viem) → run on the VM (ethereumjs) → ABI-decode the return data or revert reason.

### viem/ethers exercise variant

For `viem-ethers` lessons the same harness applies, but the test code can `import { createPublicClient, custom } from "viem"` against a thin transport that proxies to our in-process VM. That gives learners real viem code that talks to a real EVM, without an RPC bill. Punted out of POC scope but the runtime exposes a `chain.transport` for it.

---

## 2. Vyper — Pyodide + `micropip install vyper`

Vyper is a Python compiler. Three options:

| Option | Where it works | Verdict |
|---|---|---|
| Pyodide + `micropip.install("vyper")` | browser (we already ship Pyodide) | **chosen** if the wheel installs cleanly — Vyper 0.4.x is pure Python, so it should |
| Tauri sidecar `vyper` binary | desktop only | fallback if Pyodide path fails |
| Remote compile service (vyper.online API) | both, but adds backend dependency | last resort |

Output is the same `compiled` object shape (`{contracts: {[file]: {[name]: {abi, evm: {bytecode: {object}}}}}}`) so the **EVM harness above is reused unchanged**. A Vyper exercise sets `language: "vyper"` + `harness: "evm"` and writes the same `chain.deploy(...)` tests as a Solidity one.

This single decision is what makes "expand Vyper" tractable: we don't build a parallel runtime, we just need the bytecode. Once that's flowing, every existing Solidity-style exercise template can be ported to Vyper by swapping the source language.

---

## 3. Solana — chosen: pluggable, default to **Mock RPC + LiteSVM**

Three options:

| Option | Bundle | Offline | Verdict |
|---|---|---|---|
| `solana-test-validator` Tauri sidecar | ~80 MB native | desktop-only | secondary — best fidelity, ships in v2 |
| `litesvm-node` (LiteSVM compiled to JS) + `@solana/web3.js` | ~2 MB | ✅ | **chosen** for v1 — runs real BPF programs in-browser |
| Live devnet + faucet | small | ❌ | rejected — devnet faucet is rate-limited and unreliable |

LiteSVM (Anza's lightweight SVM, used by Anchor's testing harness) has a JS port and runs deployed `.so` BPF programs directly. The Rust runtime already compiles Solana programs via system `cargo-build-sbf` on desktop — we route the resulting `.so` into LiteSVM and inject a Solana-shaped `chain` analogue:

```js
test("counter increments", async () => {
  const program = await svm.deploy("counter");           // pulls the built .so
  const counter = Keypair.generate();
  await program.methods.initialize().accounts({ counter: counter.publicKey }).rpc();
  const acc = await program.account.counter.fetch(counter.publicKey);
  expect(acc.count).toBe(0n);
});
```

Web build (no `cargo-build-sbf`): exercises that need deploy degrade to a `desktopOnlyResult` banner; the **mocked-stub** style of the current course continues to work via the Rust runtime as before. So the Solana lift is desktop-first, with web parity gated on a future cloud-build endpoint.

---

## 4. Type changes

Single field added to `ExerciseLesson` and `MixedLesson` in `src/data/types.ts`:

```ts
/// Selects an enriched test harness with chain-aware globals.
/// Default (undefined) keeps the legacy "tests run against compiled
/// output / module exports" behavior. Set "evm" for Solidity/Vyper
/// deploy+call lessons, "solana" for LiteSVM lessons.
harness?: "evm" | "solana";
```

No new lesson `kind` — the harness lives inside the existing exercise flow so `PoppedWorkbench`, progress tracking, hints, and the editor all work unchanged.

---

## 5. Dispatcher changes

In `src/runtimes/index.ts`:

- Replace the `case "solidity"` branch with a check on `lesson.harness`. When `harness === "evm"` (Solidity *or* Vyper source), route to the new `runEvm()`. Otherwise keep `runSolidity()` for back-compat.
- Add a `case "vyper"` that routes to `runVyper()` (no `harness` flag = compile-only, like current solidity); with `harness === "evm"` go to `runEvm()` after compiling via Pyodide.
- The `harness` value has to be threaded from `runFiles` into the runtimes; add a `RunOpts` parameter rather than growing the positional arg list.

Patch surface is small: ~30 lines in the dispatcher, two new runtime files, one type field. Existing exercises keep working (the dispatcher only diverges when `harness` is set).

---

## 6. Authoring impact (the actual goal)

After landing this:

- `solidity-complete` — promote ~10 existing exercises from "ABI shape check" to "deploy + call" by writing real `chain.deploy(...)` tests. Compile errors and ABI errors still surface the same way.
- `mastering-ethereum` — convert the 8 JS-only exercises to mixed Solidity+JS where the JS test code drives a real deployed contract (closer to what the book actually teaches).
- `viem-ethers` — wire `chain.transport` into a viem `createPublicClient`/`createWalletClient` so learners write real viem against the in-process EVM.
- `vyper-fundamentals` — **add ~12 exercises from scratch** (currently zero). Same EVM harness, Vyper source. Topics: storage variables, decorators (`@external`, `@view`), reentrancy guard, ERC-20 mini-impl.
- `solana-programs` — convert the 20 Rust exercises from "stubs in the same file" to "real `cargo-build-sbf` + LiteSVM deploy + JS-driven RPC" (desktop-first).

---

## 7. POC

Two files committed alongside this doc:

- `src/runtimes/evm.ts` — the EVM runtime (compile via existing solc loader, deploy + call via @ethereumjs/vm, ABI bridge via viem). Includes a worked deploy+call test path.
- `src/runtimes/vyper.ts` — the Vyper runtime (Pyodide + micropip) with three documented strategies.

A sample EVM exercise (drop-in to `solidity-complete.json`):

```json
{
  "id": "counter-deploy-call",
  "kind": "exercise",
  "title": "Deploy & call a Counter",
  "language": "solidity",
  "harness": "evm",
  "body": "Implement a `Counter` contract with `value()` (uint256) and `increment()`. Tests will deploy it, read `value()`, call `increment()`, and read again.",
  "starter": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.26;\n\ncontract Counter {\n    // TODO: storage + functions\n}\n",
  "solution": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.26;\n\ncontract Counter {\n    uint256 public value;\n    function increment() external { value += 1; }\n}\n",
  "tests": "test('starts at zero', async () => {\n  const c = await chain.deploy('Counter');\n  expect(await c.read.value()).toBe(0n);\n});\n\ntest('increments', async () => {\n  const c = await chain.deploy('Counter');\n  const r = await c.write.increment();\n  expect(r.status).toBe('success');\n  expect(await c.read.value()).toBe(1n);\n});\n\ntest('increments twice', async () => {\n  const c = await chain.deploy('Counter');\n  await c.write.increment();\n  await c.write.increment();\n  expect(await c.read.value()).toBe(2n);\n});\n"
}
```

## 8. Open questions for review

1. **Bundle budget:** do we accept ~500 KB gz on the EVM-lesson lazy chunk? (My read: yes — it only loads when an EVM lesson runs and the win is large.)
2. **viem vs ethers vs hand-rolled ABI:** lean viem because course content already imports it and v2 is tree-shakable.
3. **Solana web parity:** do we ship LiteSVM in the web build now (~2 MB) or gate it behind a "compile in cloud" later? Recommend: web shows the lesson read-only with a "run on desktop" banner for the first release.
4. **Vyper compiler version pin:** which Vyper to lock to? Recommend `0.4.0` to match the current docs ecosystem.
