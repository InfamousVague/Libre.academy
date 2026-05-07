# `chains/` — in-process chain runtimes

Three Rust-side chain backends the desktop app exposes via Tauri
commands. Each chain owns its mutable state behind an
`Arc<Mutex<...>>` registered as Tauri state at startup; every
mutating command emits a `<chain>:snapshot` Tauri event so the
frontend dock UIs can re-render without polling.

## What's here

```
chains/
├── README.md              ← this file
├── state.rs               ← shared traits (ChainSnapshot, emit_snapshot,
│                            bigint_str serde modules)
├── svm.rs                 ← LiteSVM (Solana). Real BPF execution.
├── evm.rs                 ← revm (Ethereum). ~50× faster than ethereumjs.
└── bitcoin.rs             ← rust-bitcoin in-process UTXO state machine
                             with real BIP143 sighashing + ECDSA signing.
```

## Why Rust-side chains

The original architecture ran every chain in the webview:

- **EVM**: `@ethereumjs/vm` — works fine, real EVM, but JS-implemented
- **Bitcoin**: `@scure/btc-signer` + a hand-rolled UTXO shell
- **Solana**: tried `litesvm` napi import → fails. `litesvm`'s `internal.js`
  does `require('node:fs')` and loads a `.node` binary. Cannot run in
  a Tauri webview chunk.

That last one forced the architectural pivot. Rather than maintain
two parallel chain abstractions (in-browser for EVM/BTC, Node-side
for SVM), we collapsed all three onto Rust crates linked into the
Tauri binary. Single architecture, real protocol implementations
across the board.

## Adding a new command

For SVM as the example:

1. **Define the wire types** in `chains/svm.rs`:

   ```rust
   #[derive(Debug, Serialize, Clone)]
   #[serde(rename_all = "camelCase")]
   pub struct MyResult { ... }
   ```

   bigint fields → `#[serde(with = "bigint_str")]` (decimal-string on
   the wire — JSON can't carry u64 safely past 2^53).

2. **Write the command** in `chains/svm.rs`:

   ```rust
   #[tauri::command]
   pub fn svm_my_op(
       app: AppHandle,
       state: State<'_, SharedSvm>,
       arg: String,
   ) -> Result<MyResult, String> {
       let mut guard = state.lock();
       // mutate guard.svm / guard.snapshot
       guard.snapshot.bump_revision();
       let snap = guard.snapshot.clone();
       drop(guard);
       emit_snapshot(&app, &snap);  // push to dock
       Ok(MyResult { ... })
   }
   ```

3. **Register it** in `lib.rs`'s `tauri::generate_handler![...]`.

4. **Add a frontend wrapper** in `lib/svm/chainService.ts`:

   ```ts
   export async function svmMyOp(arg: bigint): Promise<MyResult> {
     await ensureInitialised();
     const wire = await invoke<WireMyResult>("svm_my_op", { arg: arg.toString() });
     adoptSnapshot(wire.snapshot);  // optional: eager-adopt for sync reads
     return { ... };
   }
   ```

5. **Optionally expose it on `svm`** in `runtimes/solana.ts` so test
   code can call it directly via the global.

## Concurrency

One mutex per chain, locked for the duration of each command. The
contention pattern is "one tx at a time per chain" — matches how
real Solana / Ethereum / Bitcoin clients work (sequential tx
submission). Don't introduce lock-free patterns; the mutex is
load-bearing for snapshot consistency.

## Wire format

bigint values (lamports / wei / satoshis / slot / block height /
unix timestamps) → decimal strings on the wire. Frontend parses
back to `bigint` via the snapshot adoption helpers. JSON can carry
integers safely up to 2^53 - 1; real chain values blow past that.

## Snapshot push

Every state-mutating command:

1. Locks the mutex
2. Mutates state + snapshot
3. Calls `snapshot.bump_revision()` so frontend can debounce
   identity-only churn
4. Drops the lock
5. Calls `emit_snapshot(&app, &snap)` to push to the frontend

Frontend `lib/<chain>/chainService.ts` listens once at module load
for `<chain>:snapshot` events and updates its local mirror, which
the React dock subscribes to via `useSyncExternalStore`. The
mirror also gets eagerly updated when invoke responses carry the
new snapshot — that avoids race conditions where a sync read like
`svm.balance()` would otherwise see pre-mutation state.

## Web build

Tauri commands don't exist in the web build. Frontend chain
services should defensively gate on the existing `shouldShowEvmDock`
/ `shouldShowSvmDock` / `shouldShowBitcoinDock` helpers, which the
upstream "needs desktop app" upsell short-circuits on web. No
backend-side defensive code needed.

## Frontend rewire status

- **SVM**: ✅ wired. `lib/svm/chainService.ts` is a Tauri RPC client.
- **EVM**: ❌ pending (Phase 5d.4). `lib/evm/chainService.ts` still
  uses `@ethereumjs/vm`. Rust backend ready in `chains/evm.rs`.
- **Bitcoin**: ❌ pending (Phase 5e.4). `lib/bitcoin/chainService.ts`
  still uses `@scure/btc-signer` + custom UTXO shell. Rust backend
  ready in `chains/bitcoin.rs`.

Both EVM/Bitcoin Rust backends are sitting fully functional but
unused; the existing JS implementations keep powering their
respective lessons until the rewires land. Nothing breaks.
