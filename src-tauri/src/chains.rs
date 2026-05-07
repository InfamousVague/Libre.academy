//! Chain runtimes — Rust-side implementations of the SVM, EVM, and
//! Bitcoin backends the webview talks to via Tauri commands.
//!
//! Background: the original architecture ran every chain in the
//! webview (`@ethereumjs/vm` for EVM, a custom UTXO shell for
//! Bitcoin, and an attempted `litesvm` napi import for Solana).
//! That last one is what forced the architectural pivot — `litesvm`
//! ships as a Node napi addon and fundamentally cannot load in a
//! Tauri webview chunk. Rather than maintain two parallel chain
//! abstractions (one in-browser, one Node-side), we collapsed all
//! three runtimes onto Rust crates linked into the Tauri binary.
//!
//! ### Layout
//!
//! Each chain lives under `chains/<name>.rs`:
//!
//!   - `svm.rs`     — wraps the `litesvm` Rust crate (real BPF execution)
//!   - `evm.rs`     — wraps `revm` (added in Phase 5d)
//!   - `bitcoin.rs` — wraps `rust-bitcoin` + a bundled `bitcoind -regtest`
//!                    child process (added in Phase 5e)
//!
//! Shared utilities (snapshot serialization, address marshaling,
//! event-emission helpers) live in `state.rs`.
//!
//! ### State + concurrency
//!
//! Each chain holds an `Arc<Mutex<...>>` registered via `app.manage`
//! at startup. Tauri commands clone the State handle on entry and
//! lock the inner Mutex for the duration of the operation. The
//! contention pattern is "one tx at a time per chain" which a
//! parking_lot Mutex handles fine — we deliberately avoid
//! concurrent tx execution because it would silently lose the
//! deterministic-ordering guarantee learners expect.
//!
//! ### Snapshot push
//!
//! On every state-mutating command (transfer, send_tx, deploy,
//! airdrop, warp), the chain emits a `<name>:snapshot` Tauri event
//! carrying the new full snapshot. The frontend's `chainService`
//! listens for these events and feeds them into its
//! `useSyncExternalStore` subscriber set — same UX the in-webview
//! chains had, just sourced from the Rust process rather than a
//! local module-scope variable.
//!
//! ### Web build
//!
//! Tauri commands don't exist in the web build. The web build's
//! `chainService.ts` short-circuits with the "needs desktop" upsell
//! before ever attempting to invoke. No code paths in this module
//! need to defend against being called from a non-Tauri context.

pub mod state;
pub mod svm;
pub mod evm;
pub mod bitcoin;
