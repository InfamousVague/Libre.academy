//! SVM chain runtime — wraps the `litesvm` Rust crate.
//!
//! `litesvm` is the same SVM implementation the Anza team ships as a
//! Node napi binding; the Rust crate IS the underlying engine, so
//! we get real BPF execution against a real Solana runtime — fees,
//! signatures, account model, compute units, all of it.
//!
//! ### State + concurrency
//!
//! `SvmState` holds the `LiteSVM` instance plus the 10 pre-funded
//! signer keypairs and the snapshot we push to the frontend. It
//! lives behind an `Arc<Mutex<>>` registered as Tauri state at app
//! startup. Every command locks the mutex for its operation; the
//! contention pattern is "one tx per chain at a time" which matches
//! how real Solana clients work (single connection, sequential
//! `sendTransaction`).
//!
//! ### What lands in this file across the phase rollout
//!
//! - **Phase 5a** (this commit): state struct + `svm_init` /
//!   `svm_get_snapshot` / `svm_reset`. Just enough to verify the
//!   wiring boots cleanly.
//! - **Phase 5b**: `svm_balance`, `svm_airdrop`, `svm_transfer`,
//!   `svm_send_tx`, `svm_warp_slot`, `svm_warp_time`,
//!   `svm_deploy_program` (with .so bytes).
//! - **Phase 5c**: snapshot event emission on every mutation;
//!   frontend `chainService` rewires to be a thin RPC client.
//! - **Phase 5f**: `svm_build_bpf` — shells out to the bundled
//!   `cargo-build-sbf` for capstone deploy lessons.
//!
//! ### Wire format
//!
//! Every lamport / slot / unix_timestamp field is serialised as a
//! decimal string. Solana balances exceed JS's safe-integer ceiling
//! (2^53 - 1) for any realistic chain state; the wire format mirrors
//! what `lib/svm/chainService.ts` already uses for its bigint fields.

use std::collections::HashSet;
use std::str::FromStr;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use litesvm::LiteSVM;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use solana_clock::Clock;
use solana_instruction::{AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_signer::Signer;
use solana_system_interface::instruction as system_instruction;
use solana_transaction::Transaction;
use tauri::{AppHandle, Manager, State};

use super::state::{bigint_str, bigint_str_i64, emit_snapshot, ChainSnapshot};

/// 1 SOL in lamports. Defined locally rather than importing from
/// `solana-native-token` to avoid one more dep — this constant
/// is a Solana protocol invariant, never going to change.
const LAMPORTS_PER_SOL: u64 = 1_000_000_000;

// ── Snapshot wire types ──────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AccountSnapshot {
    /// Base58-encoded pubkey.
    pub address: String,
    #[serde(with = "bigint_str")]
    pub lamports: u64,
    /// Display label — `signers[0]` becomes "Default sender", others
    /// "Account N". Mirrors the in-webview chainService labelling.
    pub label: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProgramSnapshot {
    pub program_id: String,
    pub name: String,
    #[serde(with = "bigint_str")]
    pub deployed_at_slot: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TxKind {
    Transfer,
    Invoke,
    Deploy,
    Airdrop,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TxSnapshot {
    /// Base58 signature (or `synth-<kind>-<hex>` for synthetic
    /// events like airdrops that don't produce a real tx).
    pub signature: String,
    pub kind: TxKind,
    pub fee_payer: String,
    pub to: Option<String>,
    #[serde(with = "bigint_str")]
    pub value_lamports: u64,
    #[serde(with = "bigint_str")]
    pub fee_lamports: u64,
    pub status: TxStatus,
    #[serde(with = "bigint_str")]
    pub slot: u64,
    /// Wallclock at which the tx ran on the host. Milliseconds since
    /// Unix epoch — fits in JS's safe-integer range, kept as a
    /// number not a string.
    pub timestamp_ms: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum TxStatus {
    Success,
    Failed,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SvmSnapshot {
    /// `"singleton"` for the long-lived chain the dock subscribes to.
    /// Reserved field — no other scope exists on the Rust side, but
    /// the frontend wire shape includes it so we don't have to
    /// version the snapshot when (if) we add per-test ephemeral
    /// chains later.
    pub scope: String,
    #[serde(with = "bigint_str")]
    pub slot: u64,
    #[serde(with = "bigint_str_i64")]
    pub unix_timestamp: i64,
    pub accounts: Vec<AccountSnapshot>,
    pub programs: Vec<ProgramSnapshot>,
    pub txs: Vec<TxSnapshot>,
    /// Bumped on every snapshot mutation so the frontend's
    /// `useSyncExternalStore` can debounce identity-only churn.
    pub revision: u64,
}

impl ChainSnapshot for SvmSnapshot {
    fn channel(&self) -> &'static str {
        "svm"
    }
    fn bump_revision(&mut self) {
        self.revision = self.revision.saturating_add(1);
    }
}

// ── State struct ─────────────────────────────────────────────────

const PREFUND_LAMPORTS: u64 = 100 * LAMPORTS_PER_SOL;
const RECENT_TXS_LIMIT: usize = 30;
const RECENT_PROGRAMS_LIMIT: usize = 20;

/// Wraps the LiteSVM instance + the keypairs + the snapshot we push
/// to the frontend. The `Arc<Mutex<SvmState>>` wrapper goes into
/// Tauri state at app startup; commands lock it for the duration
/// of their operation.
pub struct SvmState {
    pub svm: LiteSVM,
    /// 10 pre-funded signers. `signers[0]` is the default fee payer
    /// — same identity as `payer`. Source of truth for "which
    /// addresses can sign" — `signer_for(addr)` is the reverse
    /// lookup callers need for transfer / send commands.
    pub signers: Vec<Keypair>,
    pub snapshot: SvmSnapshot,
}

impl SvmState {
    /// Find the keypair for `addr` if it's one of our pre-funded
    /// signers. Returns `None` for an unknown address (test code
    /// that constructs an arbitrary pubkey + tries to make it sign;
    /// real Solana would reject the same way).
    pub fn signer_for(&self, addr: &str) -> Option<&Keypair> {
        self.signers
            .iter()
            .find(|kp| kp.pubkey().to_string() == addr)
    }
}

impl SvmState {
    /// Build a fresh chain. Called once at app startup and again on
    /// every `svm_reset` invocation.
    pub fn new() -> Self {
        let mut svm = LiteSVM::new();
        let mut signers = Vec::with_capacity(10);
        let mut accounts = Vec::with_capacity(10);

        for i in 0..10 {
            let kp = Keypair::new();
            // litesvm.airdrop returns a TransactionMetadata or a
            // FailedTransactionMetadata; for fresh accounts on a
            // fresh chain it always succeeds. We discard the receipt
            // because the bootstrap doesn't need to surface a tx
            // event for the initial pre-fund (real Solana validators
            // mint with a genesis allocation that never appears as
            // a tx either).
            let _ = svm.airdrop(&kp.pubkey(), PREFUND_LAMPORTS);
            accounts.push(AccountSnapshot {
                address: kp.pubkey().to_string(),
                lamports: PREFUND_LAMPORTS,
                label: if i == 0 {
                    "Default sender".to_string()
                } else {
                    format!("Account {i}")
                },
            });
            signers.push(kp);
        }

        let clock = svm.get_sysvar::<Clock>();
        let snapshot = SvmSnapshot {
            scope: "singleton".to_string(),
            slot: clock.slot,
            unix_timestamp: clock.unix_timestamp,
            accounts,
            programs: Vec::new(),
            txs: Vec::new(),
            revision: 0,
        };

        Self {
            svm,
            signers,
            snapshot,
        }
    }

    /// Re-read the lamport balance of every tracked account and
    /// push the result into the snapshot. Called after any mutation
    /// that could change balances (every transfer / send / airdrop)
    /// — cheap because we have at most 10-20 accounts per chain.
    pub fn rebuild_account_balances(&mut self) {
        for acc in self.snapshot.accounts.iter_mut() {
            // Pubkey parse is infallible for addresses we synthesised
            // ourselves — they came from `Keypair::new().pubkey()`
            // upstream and round-trip cleanly. Defensive parse just
            // in case a future code path puts a hand-written address
            // into the accounts list.
            if let Ok(pk) = acc.address.parse::<Pubkey>() {
                acc.lamports = self.svm.get_balance(&pk).unwrap_or(0);
            }
        }
    }

    /// Ensure `address` is in the tracked accounts list. Used after
    /// any tx whose target ISN'T one of the pre-funded signers — PDAs,
    /// freshly-derived pubkeys, custom contract addresses. Without
    /// this, `svm.balance(pda)` on the JS side reads the local
    /// snapshot mirror, doesn't find the address, and returns 0n
    /// even though the chain credited it correctly.
    ///
    /// Idempotent: a no-op if the address is already tracked. Adds
    /// with a generic "Address N" label since we don't know the
    /// learner's name for it. Tests can match on the address; the
    /// dock UI shows the label so the panel doesn't get cluttered
    /// with raw base58 strings.
    pub fn ensure_account_tracked(&mut self, address: &str) {
        if self
            .snapshot
            .accounts
            .iter()
            .any(|a| a.address == address)
        {
            return;
        }
        let lamports = address
            .parse::<Pubkey>()
            .ok()
            .and_then(|pk| self.svm.get_balance(&pk))
            .unwrap_or(0);
        // Label: "Address" + a 1-based index past the pre-funded
        // signers count. With 10 signers + N tracked custom addresses,
        // first new address shows as "Address 11".
        let n = self.snapshot.accounts.len() + 1;
        self.snapshot.accounts.push(AccountSnapshot {
            address: address.to_string(),
            lamports,
            label: format!("Address {n}"),
        });
    }

    /// Push a tx event into the recent-tx ring buffer.
    pub fn push_tx(&mut self, tx: TxSnapshot) {
        let mut txs = vec![tx];
        txs.extend(self.snapshot.txs.iter().take(RECENT_TXS_LIMIT - 1).cloned());
        self.snapshot.txs = txs;
    }

    /// Push a program-deploy event into the ring buffer (de-duped on
    /// `program_id`; a re-deploy of the same id replaces the prior
    /// entry rather than stacking).
    #[allow(dead_code)] // wired up in Phase 5c when we add svm_deploy_program
    pub fn push_program(&mut self, prog: ProgramSnapshot) {
        let without: Vec<_> = self
            .snapshot
            .programs
            .iter()
            .filter(|p| p.program_id != prog.program_id)
            .cloned()
            .collect();
        let mut programs = vec![prog];
        programs.extend(without.into_iter().take(RECENT_PROGRAMS_LIMIT - 1));
        self.snapshot.programs = programs;
    }
}

/// State wrapper Tauri owns. Cloned cheaply by `State<'_, ...>` on
/// command entry; the `parking_lot::Mutex` does the actual locking.
pub type SharedSvm = Arc<Mutex<SvmState>>;

// ── Tauri commands (Phase 5a — minimum viable surface) ───────────

/// Initial snapshot for the dock to render with. Idempotent — does
/// NOT rebuild the chain, just hands back what's already there.
/// Frontend calls this once at mount time.
#[tauri::command]
pub fn svm_init(state: State<'_, SharedSvm>) -> SvmSnapshot {
    state.lock().snapshot.clone()
}

/// Read the current snapshot without forcing any mutation. Mostly
/// for parity with the frontend's `getSnapshot()` API; the
/// snapshot-event push is the primary update channel for the dock.
#[tauri::command]
pub fn svm_get_snapshot(state: State<'_, SharedSvm>) -> SvmSnapshot {
    state.lock().snapshot.clone()
}

/// Drop the chain's state and rebuild it. Same as launching a fresh
/// litesvm — every account balance, deployed program, recent tx
/// goes away. Wired to the dock's "Reset" button.
#[tauri::command]
pub fn svm_reset(app: AppHandle, state: State<'_, SharedSvm>) -> SvmSnapshot {
    let mut guard = state.lock();
    *guard = SvmState::new();
    guard.snapshot.bump_revision();
    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    snap
}

// ── Phase 5b: mutation commands ──────────────────────────────────

/// Read the current lamport balance for an arbitrary address. Returns
/// 0 for accounts that don't exist (matches the litesvm convention
/// of normalising null to zero so test math doesn't have to null-
/// check).
///
/// The result is a decimal string for the same reason the snapshot
/// fields are: lamports values can exceed JS's safe-integer ceiling.
#[tauri::command]
pub fn svm_balance(state: State<'_, SharedSvm>, address: String) -> Result<String, String> {
    let pk: Pubkey = address
        .parse()
        .map_err(|e| format!("invalid pubkey {address:?}: {e}"))?;
    let guard = state.lock();
    Ok(guard.svm.get_balance(&pk).unwrap_or(0).to_string())
}

/// Credit `lamports` to `address`. Idempotent — calling repeatedly
/// just keeps adding lamports. Wired to the dock's faucet button +
/// the runtime's airdrop API.
///
/// Synthesises a tx-snapshot row with kind=`airdrop` so the dock's
/// recent-tx panel reflects the action. Real Solana does generate a
/// real tx for testnet airdrops; on litesvm we synthesise one for
/// UX parity.
#[tauri::command]
pub fn svm_airdrop(
    app: AppHandle,
    state: State<'_, SharedSvm>,
    address: String,
    lamports: String,
) -> Result<SvmSnapshot, String> {
    let pk: Pubkey = address
        .parse()
        .map_err(|e| format!("invalid pubkey {address:?}: {e}"))?;
    let amount: u64 = lamports
        .parse()
        .map_err(|e| format!("invalid lamports {lamports:?}: {e}"))?;

    let mut guard = state.lock();
    guard
        .svm
        .airdrop(&pk, amount)
        .map_err(|e| format!("airdrop failed: {e:?}"))?;

    let slot = guard.svm.get_sysvar::<Clock>().slot;
    guard.push_tx(TxSnapshot {
        signature: synth_signature("airdrop"),
        kind: TxKind::Airdrop,
        fee_payer: address.clone(),
        to: None,
        value_lamports: amount,
        fee_lamports: 0,
        status: TxStatus::Success,
        slot,
        timestamp_ms: now_ms(),
    });
    // Track the airdropped address so subsequent `svm.balance(addr)`
    // reads on the JS side find it in the snapshot mirror. Without
    // this, airdropping to a PDA / fresh pubkey credits the chain
    // but the JS read returns 0 (snapshot only tracks pre-funded
    // signers + addresses we explicitly add).
    guard.ensure_account_tracked(&address);
    guard.rebuild_account_balances();
    guard.snapshot.bump_revision();

    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    Ok(snap)
}

/// Move `lamports` from `from_address` to `to_address` via a real
/// System Program transfer instruction. The fee payer is the source
/// account; standard 5000-lamport-per-signature fee applies.
///
/// `from_address` MUST be one of the 10 pre-funded signers — we look
/// up the matching keypair to sign with. Lessons that need to send
/// from a fresh signer should use `svm_send_tx` with their own
/// instruction set (Phase 5c) where the signer comes in as a
/// serialised tx that's already signed.
#[tauri::command]
pub fn svm_transfer(
    app: AppHandle,
    state: State<'_, SharedSvm>,
    from_address: String,
    to_address: String,
    lamports: String,
) -> Result<SvmSnapshot, String> {
    let to: Pubkey = to_address
        .parse()
        .map_err(|e| format!("invalid to address {to_address:?}: {e}"))?;
    let amount: u64 = lamports
        .parse()
        .map_err(|e| format!("invalid lamports {lamports:?}: {e}"))?;

    let mut guard = state.lock();

    // Clone the source keypair so we can release the borrow on
    // `guard.signers` before grabbing `&mut guard.svm`. Keypair clone
    // is cheap (64 bytes) and matches the canonical Solana pattern
    // for signing without holding an arena lock.
    let from_kp = guard
        .signer_for(&from_address)
        .ok_or_else(|| {
            format!(
                "from {from_address} is not one of the pre-funded signers — \
                 use svm_send_tx with a hand-signed tx for arbitrary senders"
            )
        })?
        .insecure_clone();
    let from_pk = from_kp.pubkey();

    let ix = system_instruction::transfer(&from_pk, &to, amount);
    let blockhash = guard.svm.latest_blockhash();
    let msg = Message::new(&[ix], Some(&from_pk));
    let tx = Transaction::new(&[&from_kp], msg, blockhash);

    let slot = guard.svm.get_sysvar::<Clock>().slot;
    let result = guard.svm.send_transaction(tx);

    let (status, fee, signature, err_text) = match result {
        Ok(meta) => {
            let sig = meta
                .signature
                .to_string();
            // litesvm doesn't expose the per-tx fee directly on
            // `TransactionMetadata` for a successful tx. We compute
            // it from the legacy fee schedule (5000 lamports × 1
            // signature for a single-signer transfer). Multi-signer
            // transactions go through svm_send_tx which has more
            // detailed accounting.
            (TxStatus::Success, 5000u64, sig, None)
        }
        Err(failed) => {
            let sig = failed
                .meta
                .signature
                .to_string();
            // IMPORTANT: real Solana (and LiteSVM mirroring it) DOES
            // charge the fee on a failed tx. The runtime debits fees
            // at tx-prep time, before instruction execution. If the
            // tx body then reverts (insufficient funds for the value
            // transfer, signature missing, etc.), the fee is gone
            // and only the body's state changes roll back. Reporting
            // fee=0 here was wrong — the dock's Recent transactions
            // panel was understating real cost. 1 signature × 5000.
            (
                TxStatus::Failed,
                5000u64,
                sig,
                Some(format!("{:?}", failed.err)),
            )
        }
    };

    // Critical: expire the blockhash so the NEXT tx picks up a fresh
    // one. Without this, two identical transfers (same from/to/amount/
    // payer) compute the same signature against the same blockhash
    // and Solana rejects the duplicate as `AlreadyProcessed`. Real
    // mainnet rotates the blockhash naturally as slots tick; LiteSVM's
    // deterministic single-slot world needs us to do it manually.
    // Same call lives in `svm_send_tx` for the arbitrary-tx path.
    guard.svm.expire_blockhash();

    // Track the recipient so JS-side `svm.balance(to_address)` reads
    // see the new lamports. Same rationale as svm_airdrop. Source
    // address is always one of the pre-funded signers (we look it up
    // via signer_for above) so it's already tracked.
    guard.ensure_account_tracked(&to_address);

    guard.push_tx(TxSnapshot {
        signature,
        kind: TxKind::Transfer,
        fee_payer: from_address.clone(),
        to: Some(to_address),
        value_lamports: if matches!(status, TxStatus::Success) {
            amount
        } else {
            0
        },
        fee_lamports: fee,
        status,
        slot,
        timestamp_ms: now_ms(),
    });
    guard.rebuild_account_balances();
    guard.snapshot.bump_revision();

    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);

    if let Some(e) = err_text {
        return Err(format!("transfer failed: {e}"));
    }
    Ok(snap)
}

/// Move the in-memory clock forward by `slots`. Mirrors LiteSVM's
/// `warp_to_slot` — sets the `Clock` sysvar's `slot` field directly.
/// Used by lessons that gate behaviour on slot height (e.g. vesting
/// schedules, time-locked accounts) without forcing the test author
/// to wait for real time to pass.
#[tauri::command]
pub fn svm_warp_slot(
    app: AppHandle,
    state: State<'_, SharedSvm>,
    slots: String,
) -> Result<SvmSnapshot, String> {
    let delta: u64 = slots
        .parse()
        .map_err(|e| format!("invalid slots {slots:?}: {e}"))?;

    let mut guard = state.lock();
    let target = guard.svm.get_sysvar::<Clock>().slot.saturating_add(delta);
    // LiteSVM's `warp_to_slot` is infallible — sets the Clock sysvar
    // directly. No Result to unwrap.
    guard.svm.warp_to_slot(target);
    guard.snapshot.slot = target;
    guard.snapshot.bump_revision();

    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    Ok(snap)
}

/// Bump the unix timestamp by `seconds`. Mirrors `warp_slot` for the
/// time axis — useful for tests that read `Clock::unix_timestamp`
/// (rent-due calculations, time-based access controls).
#[tauri::command]
pub fn svm_warp_time(
    app: AppHandle,
    state: State<'_, SharedSvm>,
    seconds: String,
) -> Result<SvmSnapshot, String> {
    let delta: i64 = seconds
        .parse()
        .map_err(|e| format!("invalid seconds {seconds:?}: {e}"))?;

    let mut guard = state.lock();
    let mut clock = guard.svm.get_sysvar::<Clock>();
    clock.unix_timestamp = clock.unix_timestamp.saturating_add(delta);
    guard.svm.set_sysvar::<Clock>(&clock);
    guard.snapshot.unix_timestamp = clock.unix_timestamp;
    guard.snapshot.bump_revision();

    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    Ok(snap)
}

// ── Phase 5b+: send arbitrary instructions + deploy programs ─────

/// Wire format for a single instruction. Mirrors the kit's
/// `Instruction` shape so JS callers can serialise their kit
/// instructions field-for-field. Address is base58, role is the
/// AccountRole bitmask (bit 0 = writable, bit 1 = signer).
#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InstructionWire {
    pub program_address: String,
    pub accounts: Vec<AccountMetaWire>,
    /// Hex-encoded instruction data (with or without `0x` prefix).
    pub data_hex: String,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AccountMetaWire {
    pub address: String,
    /// Bit 0 = writable, bit 1 = signer. Matches kit's
    /// `AccountRole` enum encoding.
    pub role: u8,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SvmTxResult {
    pub signature: String,
    pub status: TxStatus,
    pub logs: Vec<String>,
    pub fee_lamports: String,
    /// Last instruction's return data, hex-encoded. Most txs don't
    /// set return data — `null` is the common case.
    pub return_data_hex: Option<String>,
    pub snapshot: SvmSnapshot,
}

/// Send an arbitrary list of instructions through litesvm. Mirrors
/// the kit's `send` API but with the signing handled Rust-side
/// (the keypairs for the 10 pre-funded signers live in `SvmState`).
///
/// **Limitation**: signers MUST be one of the 10 pre-funded signers.
/// Lessons that need to use a freshly-generated keypair to sign will
/// hit a "signer not registered" error. Adding a `svm_register_signer`
/// path that takes a secret key from JS is straightforward but we
/// haven't needed it yet — Foundations through Anchor chapters all
/// work with the pre-funded set.
#[tauri::command]
pub fn svm_send_tx(
    app: AppHandle,
    state: State<'_, SharedSvm>,
    instructions: Vec<InstructionWire>,
    fee_payer_address: String,
) -> Result<SvmTxResult, String> {
    if instructions.is_empty() {
        return Err("svm_send_tx: instructions list is empty".to_string());
    }

    // Convert wire instructions → solana_instruction::Instruction.
    // We pull this out into a helper so the borrow on `guard` is
    // contained.
    let parsed: Vec<Instruction> = instructions
        .iter()
        .map(parse_instruction)
        .collect::<Result<Vec<_>, _>>()?;

    let mut guard = state.lock();

    // Resolve the fee payer keypair. Clone (insecure_clone) so we
    // can release the borrow on guard.signers before we touch
    // guard.svm.
    let fp_kp = guard
        .signer_for(&fee_payer_address)
        .ok_or_else(|| {
            format!(
                "fee payer {fee_payer_address} is not one of the pre-funded signers — \
                 only signers[0..10] can be fee payer in svm_send_tx for now"
            )
        })?
        .insecure_clone();
    let fp_pubkey = fp_kp.pubkey();

    // Collect every signer the tx needs: fee payer + any account in
    // any instruction with the `signer` role bit set.
    let mut signer_addresses = HashSet::new();
    signer_addresses.insert(fp_pubkey.to_string());
    for w in &instructions {
        for a in &w.accounts {
            if a.role & 0b10 != 0 {
                signer_addresses.insert(a.address.clone());
            }
        }
    }

    // Resolve each to a keypair clone. Skip the fee payer (already
    // cloned above as `fp_kp`); re-include it in the final signing
    // vec at the end so the order matches the wire's expectation
    // (fee payer first).
    let mut other_signers: Vec<Keypair> = Vec::new();
    for addr in signer_addresses.iter() {
        if addr == &fp_pubkey.to_string() {
            continue;
        }
        let kp = guard
            .signer_for(addr)
            .ok_or_else(|| {
                format!(
                    "instruction signer {addr} is not one of the pre-funded signers — \
                     fresh-signer support is a Phase 5b+ enhancement"
                )
            })?
            .insecure_clone();
        other_signers.push(kp);
    }

    // Build the legacy tx message + sign.
    let blockhash = guard.svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&parsed, Some(&fp_pubkey), &blockhash);

    // Solana's Transaction::new takes signers as a slice of references
    // — we collect into a Vec<&Keypair> from our owned clones.
    let mut signers_refs: Vec<&Keypair> = vec![&fp_kp];
    signers_refs.extend(other_signers.iter());
    let tx = Transaction::new(&signers_refs, msg, blockhash);

    let slot = guard.svm.get_sysvar::<Clock>().slot;
    let result = guard.svm.send_transaction(tx);

    let (status, signature, logs, fee, return_data, err_text) = match result {
        Ok(meta) => {
            let sig = meta.signature.to_string();
            // legacy fee = 5000 lamports per signature
            let fee = (signers_refs.len() as u64) * 5000;
            let logs = meta.logs.clone();
            let return_data = meta.return_data;
            let return_hex = if return_data.data.is_empty() {
                None
            } else {
                Some(format!("0x{}", hex::encode(&return_data.data)))
            };
            (TxStatus::Success, sig, logs, fee, return_hex, None)
        }
        Err(failed) => {
            let sig = failed.meta.signature.to_string();
            let logs = failed.meta.logs.clone();
            (
                TxStatus::Failed,
                sig,
                logs,
                0u64,
                None,
                Some(format!("{:?}", failed.err)),
            )
        }
    };

    // Same blockhash-expiry rationale as in `svm_transfer` — without
    // this, two identical instruction lists from the same fee payer
    // hit the AlreadyProcessed rejection on the second submission.
    guard.svm.expire_blockhash();

    // Track every WRITABLE account named in any instruction. Writable
    // implies "the runtime might mutate this" — i.e. credit lamports
    // / change data — which is exactly what makes a `svm.balance(...)`
    // read from the JS side relevant. Read-only accounts (programs,
    // lookup-table refs, etc.) don't need tracking. We deliberately
    // skip non-writable accounts to keep the Accounts dock panel
    // focused on accounts whose state actually changed.
    for w in &instructions {
        for a in &w.accounts {
            if a.role & 0b01 != 0 {
                guard.ensure_account_tracked(&a.address);
            }
        }
    }

    // Best-effort: identify the "to" pubkey for the dock's tx row —
    // first instruction's program address.
    let to = parsed.first().map(|ix| ix.program_id.to_string());

    guard.push_tx(TxSnapshot {
        signature: signature.clone(),
        kind: TxKind::Invoke,
        fee_payer: fee_payer_address.clone(),
        to,
        value_lamports: 0, // we don't introspect instructions for value
        fee_lamports: fee,
        status: status.clone(),
        slot,
        timestamp_ms: now_ms(),
    });
    guard.rebuild_account_balances();
    guard.snapshot.bump_revision();

    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);

    if let Some(e) = err_text {
        return Err(format!("tx failed: {e}\nlogs:\n{}", logs.join("\n")));
    }

    Ok(SvmTxResult {
        signature,
        status,
        logs,
        fee_lamports: fee.to_string(),
        return_data_hex: return_data,
        snapshot: snap,
    })
}

/// Deploy a BPF program from raw .so bytes. The program ID is
/// supplied by the caller — typically a learner-controlled keypair
/// or a deterministic placeholder so subsequent invocations can
/// reference it by name.
///
/// The `so_bytes_hex` is the raw .so file contents, hex-encoded.
/// For lessons that ship a pre-built .so as a resource, the JS
/// side can fetch the bytes (via a Tauri command we'll add later)
/// and pass them in. For lessons that simulate a program with a
/// JS handler instead, the runtime registers the handler locally
/// and never calls this command.
#[tauri::command]
pub fn svm_deploy_program(
    app: AppHandle,
    state: State<'_, SharedSvm>,
    program_id_address: String,
    program_name: String,
    so_bytes_hex: String,
) -> Result<SvmSnapshot, String> {
    let program_id = Pubkey::from_str(&program_id_address)
        .map_err(|e| format!("invalid program_id_address {program_id_address:?}: {e}"))?;

    let stripped = so_bytes_hex.strip_prefix("0x").unwrap_or(&so_bytes_hex);
    let bytes = hex::decode(stripped)
        .map_err(|e| format!("invalid so_bytes_hex: {e}"))?;
    if bytes.is_empty() {
        return Err("so_bytes_hex decoded to zero bytes — was the resource read empty?".to_string());
    }

    let mut guard = state.lock();
    // litesvm `add_program` returns Result — common failure mode is
    // an invalid eBPF binary (corrupted .so, wrong loader version).
    // Surface as a clear error rather than panicking.
    guard
        .svm
        .add_program(program_id, &bytes)
        .map_err(|e| format!("add_program failed for {program_id}: {e:?}"))?;

    let slot = guard.svm.get_sysvar::<Clock>().slot;
    let prog_id_str = program_id.to_string();
    guard.push_program(ProgramSnapshot {
        program_id: prog_id_str.clone(),
        name: program_name,
        deployed_at_slot: slot,
    });
    guard.push_tx(TxSnapshot {
        signature: synth_signature("deploy"),
        kind: TxKind::Deploy,
        fee_payer: prog_id_str.clone(),
        to: Some(prog_id_str),
        value_lamports: 0,
        fee_lamports: 0,
        status: TxStatus::Success,
        slot,
        timestamp_ms: now_ms(),
    });
    guard.snapshot.bump_revision();

    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    Ok(snap)
}

/// Convert a wire-format instruction into a solana_instruction::Instruction.
/// Pure parse — no chain access, no errors that depend on state.
fn parse_instruction(w: &InstructionWire) -> Result<Instruction, String> {
    let program_id = Pubkey::from_str(&w.program_address)
        .map_err(|e| format!("invalid program_address {:?}: {e}", w.program_address))?;
    let accounts: Vec<AccountMeta> = w
        .accounts
        .iter()
        .map(|a| {
            let pk = Pubkey::from_str(&a.address)
                .map_err(|e| format!("invalid account address {:?}: {e}", a.address))?;
            // role bit 0 = writable, bit 1 = signer
            let writable = (a.role & 0b01) != 0;
            let signer = (a.role & 0b10) != 0;
            Ok(if writable {
                AccountMeta::new(pk, signer)
            } else {
                AccountMeta::new_readonly(pk, signer)
            })
        })
        .collect::<Result<Vec<_>, String>>()?;
    let stripped = w.data_hex.strip_prefix("0x").unwrap_or(&w.data_hex);
    let data = if stripped.is_empty() {
        Vec::new()
    } else {
        hex::decode(stripped).map_err(|e| format!("invalid data_hex {:?}: {e}", w.data_hex))?
    };
    Ok(Instruction {
        program_id,
        accounts,
        data,
    })
}

// ── Phase 5f: bundled BPF toolchain (cargo-build-sbf) ────────────

/// Status report on whether the bundled Solana CLI is available.
/// Surfaced in the diagnostics page + read by lessons that gate on
/// "the deploy chapter requires the toolchain."
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SvmToolchainStatus {
    /// True if the `cargo-build-sbf` binary exists at the expected
    /// resources path. Doesn't run it — that's a separate command.
    pub installed: bool,
    /// Filesystem path the bundle was looked up at, for debugging.
    pub expected_path: String,
    /// `solana --version` output (if installed). Empty otherwise.
    pub version: String,
}

/// Result of a `cargo-build-sbf` invocation. Returns paths to the
/// produced .so files so the JS side can read them as bytes for
/// `svm_deploy_program`.
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SvmBuildResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    /// Absolute paths to the .so files the build produced. Typical
    /// layout: `<project>/target/deploy/<crate_name>.so`.
    pub so_paths: Vec<String>,
    pub duration_ms: u64,
}

/// Resolve the bundled `cargo-build-sbf` binary path from Tauri's
/// resource dir. The fetch-solana-cli script extracts to
/// `<resources>/solana/bin/cargo-build-sbf`. Returns None when the
/// resource doesn't exist (toolchain not bundled — likely a dev
/// build that skipped `npm run fetch:solana`).
fn resolve_cargo_build_sbf(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    let resource_dir = app.path().resource_dir().ok()?;
    let exe = if cfg!(windows) {
        "cargo-build-sbf.exe"
    } else {
        "cargo-build-sbf"
    };
    let p = resource_dir.join("resources").join("solana").join("bin").join(exe);
    if p.exists() {
        Some(p)
    } else {
        None
    }
}

/// Resolve the `solana` CLI binary similarly. Used for the
/// status command's version check.
fn resolve_solana_cli(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    let resource_dir = app.path().resource_dir().ok()?;
    let exe = if cfg!(windows) { "solana.exe" } else { "solana" };
    let p = resource_dir.join("resources").join("solana").join("bin").join(exe);
    if p.exists() {
        Some(p)
    } else {
        None
    }
}

/// Report whether the bundled Solana toolchain is available.
/// Fast — only does a filesystem check + a single `--version`
/// invocation (which itself is sub-100ms).
#[tauri::command]
pub fn svm_toolchain_status(app: tauri::AppHandle) -> SvmToolchainStatus {
    let cli = resolve_solana_cli(&app);
    let build_sbf = resolve_cargo_build_sbf(&app);
    let installed = cli.is_some() && build_sbf.is_some();

    let expected_path = build_sbf
        .as_ref()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|| {
            let resource_dir = app.path().resource_dir().ok();
            let pb = resource_dir
                .map(|d| d.join("resources").join("solana").join("bin").join("cargo-build-sbf"))
                .unwrap_or_else(|| std::path::PathBuf::from("(unknown resource dir)"));
            pb.display().to_string()
        });

    let version = if let Some(cli_path) = cli {
        std::process::Command::new(&cli_path)
            .arg("--version")
            .output()
            .ok()
            .and_then(|o| {
                if o.status.success() {
                    Some(String::from_utf8_lossy(&o.stdout).trim().to_string())
                } else {
                    None
                }
            })
            .unwrap_or_default()
    } else {
        String::new()
    };

    SvmToolchainStatus {
        installed,
        expected_path,
        version,
    }
}

/// Compile a Rust BPF program. `project_path` must be a directory
/// containing a `Cargo.toml` configured for the SBF target. Shells
/// out to the bundled `cargo-build-sbf` binary, captures
/// stdout/stderr, and returns paths to any .so files produced.
///
/// Lessons that ship a Rust program use this to compile the
/// learner's source on-demand. The resulting .so bytes can then be
/// read on the JS side and passed to `svm_deploy_program` to load
/// into LiteSVM.
///
/// Returns success=false (rather than throwing) when the build
/// fails — the JS side surfaces stdout/stderr in the test panel
/// so the learner can debug compile errors. Network / filesystem
/// errors that prevent even attempting the build still throw.
#[tauri::command]
pub fn svm_build_bpf(
    app: tauri::AppHandle,
    project_path: String,
) -> Result<SvmBuildResult, String> {
    let started = std::time::Instant::now();
    let cargo_build_sbf = resolve_cargo_build_sbf(&app).ok_or_else(|| {
        "cargo-build-sbf not found in bundle — was `npm run fetch:solana` run \
         during the build? Check `<resources>/solana/bin/cargo-build-sbf`."
            .to_string()
    })?;

    let project = std::path::PathBuf::from(&project_path);
    if !project.exists() {
        return Err(format!("project path does not exist: {project_path}"));
    }
    let cargo_toml = project.join("Cargo.toml");
    if !cargo_toml.exists() {
        return Err(format!(
            "no Cargo.toml at {project_path} — pass a project root that has one"
        ));
    }

    let output = std::process::Command::new(&cargo_build_sbf)
        .current_dir(&project)
        // `--no-default-features` keeps the build lean — the lesson
        // template's Cargo.toml shouldn't depend on default features
        // from `solana-program` that drag in extra crates.
        .output()
        .map_err(|e| format!("failed to launch cargo-build-sbf: {e}"))?;

    // Walk target/deploy/ for any .so files the build produced.
    let deploy_dir = project.join("target").join("deploy");
    let mut so_paths = Vec::new();
    if deploy_dir.exists() {
        if let Ok(entries) = std::fs::read_dir(&deploy_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().is_some_and(|e| e == "so") {
                    so_paths.push(path.display().to_string());
                }
            }
        }
    }

    Ok(SvmBuildResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        so_paths,
        duration_ms: started.elapsed().as_millis() as u64,
    })
}

// ── Helpers ──────────────────────────────────────────────────────

/// Synthetic-event signature: `synth-<kind>-<random>` so dock UI
/// can distinguish "real tx with a real signature" from "we faked a
/// receipt for an action like airdrop that doesn't have one."
fn synth_signature(kind: &str) -> String {
    use rand::RngCore;
    let mut bytes = [0u8; 4];
    rand::thread_rng().fill_bytes(&mut bytes);
    let hex: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
    format!("synth-{kind}-{hex}")
}

/// Wallclock in ms since Unix epoch. Used as the `timestamp_ms`
/// field on `TxSnapshot` so the dock can render "5s ago" relative
/// times.
fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}
