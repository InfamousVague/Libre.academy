//! Shared utilities for chain runtimes.
//!
//! Each chain's snapshot is a self-contained struct — accounts,
//! programs / contracts, recent transactions, slot/block height,
//! a monotonic revision counter. The frontend cares about three
//! operations:
//!
//!   1. Get the current snapshot (initial render)
//!   2. Subscribe to changes (re-render on mutation)
//!   3. Issue a state-mutating command (transfer, send, deploy, etc.)
//!
//! The pattern in this module:
//!
//!   - `ChainSnapshot` trait — every chain's snapshot type implements
//!     this so we can write generic event-emission and revision-
//!     bumping helpers.
//!   - `emit_snapshot` — given a chain name + snapshot, fire a Tauri
//!     event the frontend can subscribe to.
//!   - Wire-format helpers for the bigint problem: JSON can't carry
//!     u64/i64 values larger than 2^53 safely, so every lamport /
//!     wei / satoshi field is serialised as a decimal string.

use serde::Serialize;
use tauri::{AppHandle, Emitter};

/// Trait every chain snapshot implements. The bumping + emit
/// helpers below are generic over this so each chain doesn't have
/// to reimplement the same plumbing.
pub trait ChainSnapshot: Serialize {
    /// Stable name for the chain — `"svm"`, `"evm"`, `"bitcoin"`.
    /// Used as the Tauri event channel prefix
    /// (`<name>:snapshot` / `<name>:reset`).
    fn channel(&self) -> &'static str;

    /// Bump the snapshot's revision counter. Must be called BEFORE
    /// `emit_snapshot` so subscribers can use the revision for
    /// debouncing identity-only churn.
    fn bump_revision(&mut self);
}

/// Push the snapshot to the frontend via a Tauri event.
///
/// Naming convention: every chain emits to `<name>:snapshot`.
/// Frontend subscribers (`lib/<name>/chainService.ts`) listen
/// once on app boot and feed the payload into the same
/// `useSyncExternalStore` plumbing the in-webview chains used
/// before — the only thing that changed under the hood is where
/// the snapshot comes from.
///
/// Errors are intentionally swallowed and logged: a frontend that
/// dropped the listener (e.g. because the dock was closed) should
/// never crash the chain backend. Worst case the dock UI shows
/// stale state until the next snapshot mutation.
pub fn emit_snapshot<S: ChainSnapshot>(app: &AppHandle, snap: &S) {
    let channel = format!("{}:snapshot", snap.channel());
    if let Err(e) = app.emit(&channel, snap) {
        log::warn!("[chains] emit_snapshot {channel} failed: {e}");
    }
}

/// Helper for the bigint-as-string serde pattern.
/// Solana lamports, Ethereum wei, and Bitcoin satoshis all exceed
/// JS's safe-integer ceiling (2^53 - 1) for realistic balances.
/// Frontend deserialises by `BigInt(string)` on receive.
pub mod bigint_str {
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S: Serializer>(v: &u64, ser: S) -> Result<S::Ok, S::Error> {
        ser.serialize_str(&v.to_string())
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(de: D) -> Result<u64, D::Error> {
        let s = String::deserialize(de)?;
        s.parse::<u64>().map_err(serde::de::Error::custom)
    }
}

/// Same as `bigint_str` but for signed 64-bit values (Solana's
/// `unix_timestamp` is i64).
pub mod bigint_str_i64 {
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S: Serializer>(v: &i64, ser: S) -> Result<S::Ok, S::Error> {
        ser.serialize_str(&v.to_string())
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(de: D) -> Result<i64, D::Error> {
        let s = String::deserialize(de)?;
        s.parse::<i64>().map_err(serde::de::Error::custom)
    }
}
