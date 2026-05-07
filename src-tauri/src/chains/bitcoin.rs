//! Bitcoin chain runtime — in-process UTXO state machine using the
//! `bitcoin` crate (rust-bitcoin) for protocol primitives.
//!
//! ### Why not bundled bitcoind?
//!
//! Considered + rejected. Bundling `bitcoind -regtest` would give us
//! the most "authentic" path (real consensus, real Script
//! interpreter, learners can attach `bitcoin-cli`). But it adds:
//!   - ~50MB binary per platform per build
//!   - Process lifecycle (spawn at app start, kill on exit, restart
//!     on crash, port allocation to avoid collisions)
//!   - JSON-RPC client layer + the bitcoincore-rpc crate
//!   - ~5s startup wait per app launch
//!   - `--datadir` management on disk
//!
//! Versus this in-process approach:
//!   - Zero startup time
//!   - Architectural symmetry with SVM (litesvm) + EVM (revm)
//!   - rust-bitcoin gives us real protocol parsing/encoding,
//!     real signature verification, real bech32 addresses,
//!     real script template recognition
//!   - We DO NOT have a real Script interpreter — that stays on the
//!     JS side via `@bitauth/libauth`. Lessons that touch
//!     Script semantics use `chain.script.run` which the runtime
//!     wires to libauth, not to this Rust chain.
//!
//! ### State + concurrency
//!
//! `BitcoinState` holds the UTXO set + mempool + recent blocks. All
//! mutating commands lock the `Arc<Mutex<>>` for the duration of
//! the operation. Tx validation happens inside the lock so the
//! mempool can never see a partial state.
//!
//! ### Pre-funded accounts
//!
//! 10 P2WPKH accounts (matching the JS impl's convention). Each
//! gets a synthetic genesis-coinbase output worth 50 BTC. The
//! coinbase tx itself isn't a real coinbase (no maturity gating,
//! arbitrary inputs) — it's a UTXO bootstrap.
//!
//! ### What lands in this file across the phase rollout
//!
//! - **Phase 5e.1** (this commit): state struct + bootstrap +
//!   `btc_init` / `btc_get_snapshot` / `btc_reset` / `btc_balance`
//!   / `btc_utxos`.
//! - **Phase 5e.2**: `btc_send` (high-level), `btc_broadcast`
//!   (raw tx hex), `btc_mine`, `btc_flush_mempool`.
//! - **Phase 5e.3**: `btc_snapshot` / `btc_revert`,
//!   `btc_get_tx`, `btc_get_height`, `btc_mempool`.
//! - **Phase 5e.4**: Frontend rewire of `lib/bitcoin/chainService.ts`
//!   + `runtimes/bitcoin/buildChain.ts`. Deferred to follow-up turn
//!   for the same reason 5d.4 is — buildChain.ts is large and
//!   needs careful surgery.

use std::collections::{HashMap, VecDeque};
use std::str::FromStr;
use std::sync::Arc;

use bitcoin::address::NetworkChecked;
use bitcoin::ecdsa::Signature as EcdsaSignature;
use bitcoin::hashes::Hash;
use bitcoin::secp256k1::{Message, Secp256k1, SecretKey};
use bitcoin::sighash::{EcdsaSighashType, SighashCache};
use bitcoin::{
    absolute::LockTime, transaction::Version, Address, Amount, Network, OutPoint, PublicKey,
    ScriptBuf, Sequence, Transaction, TxIn, TxOut, Txid, Witness,
};
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use super::state::{emit_snapshot, ChainSnapshot};

// ── Snapshot wire types ──────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BitcoinAccountWire {
    /// 0x-prefixed 32-byte hex.
    pub private_key: String,
    /// 0x-prefixed compressed 33-byte hex.
    pub public_key: String,
    /// 0x-prefixed 20-byte hash160(publicKey).
    pub pubkey_hash: String,
    /// Legacy P2PKH address (regtest format: starts with `m`/`n`).
    pub p2pkh_address: String,
    /// Native SegWit P2WPKH (regtest: `bcrt1q...`). Default address
    /// `chain.send` and the dock UI use.
    pub p2wpkh_address: String,
    pub label: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BitcoinUtxoWire {
    /// 0x-prefixed 32-byte txid (NOTE: rust-bitcoin renders txids
    /// as plain hex; we add the `0x` prefix on the wire to match
    /// the existing JS API surface).
    pub txid: String,
    pub vout: u32,
    /// Decimal-string sats — JS safe-int safe at 2^53 but bigint-string
    /// is the canonical wire format we use everywhere else.
    pub value: String,
    pub script_pub_key: String,
    pub height: u32,
    pub address: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum BitcoinTxKind {
    Coinbase,
    P2pkh,
    P2wpkh,
    P2sh,
    P2wsh,
    Other,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BitcoinTxWire {
    pub txid: String,
    pub kind: BitcoinTxKind,
    /// `null` for coinbase (newly minted).
    pub fee_sats: Option<String>,
    pub total_in_sats: String,
    pub total_out_sats: String,
    pub in_count: u32,
    pub out_count: u32,
    /// `null` while in mempool.
    pub block_height: Option<u32>,
    pub timestamp: u64,
    /// 0x-prefixed raw tx bytes — saves the dock from re-fetching
    /// when the user pops the tx-details panel.
    pub raw_hex: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BitcoinBlockWire {
    pub height: u32,
    pub hash: String,
    pub prev_hash: String,
    pub timestamp: u64,
    pub txids: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BitcoinSnapshot {
    pub scope: String,
    pub height: u32,
    pub tip_hash: String,
    pub accounts: Vec<BitcoinAccountWire>,
    pub utxos: Vec<BitcoinUtxoWire>,
    pub mempool: Vec<BitcoinTxWire>,
    pub txs: Vec<BitcoinTxWire>,
    pub blocks: Vec<BitcoinBlockWire>,
    pub revision: u64,
}

impl ChainSnapshot for BitcoinSnapshot {
    fn channel(&self) -> &'static str {
        "bitcoin"
    }
    fn bump_revision(&mut self) {
        self.revision = self.revision.saturating_add(1);
    }
}

// ── Internal state ───────────────────────────────────────────────

const ACCOUNT_FUNDING_SATS: u64 = 50 * 100_000_000; // 50 BTC per account
const RECENT_UTXOS_LIMIT: usize = 30;
const RECENT_TXS_LIMIT: usize = 30;
const RECENT_BLOCKS_LIMIT: usize = 30;

/// Internal account record — keeps the secp256k1 secret key for
/// signing, plus the rust-bitcoin Address (network-checked for
/// regtest) so the wire-format conversion is cheap.
pub struct BitcoinAccount {
    pub secret: SecretKey,
    pub public: PublicKey,
    pub pubkey_hash: [u8; 20],
    pub p2pkh: Address<NetworkChecked>,
    pub p2wpkh: Address<NetworkChecked>,
    pub label: String,
}

/// Wraps the UTXO set + mempool + blocks + the tracked accounts.
/// Held behind an `Arc<Mutex<>>` registered as Tauri state at
/// startup; commands lock for the duration of the operation.
pub struct BitcoinState {
    pub utxos: HashMap<OutPoint, TxOut>,
    pub utxo_height: HashMap<OutPoint, u32>,
    /// Recent UTXO additions for the dock — last N by insertion. The
    /// canonical UTXO set above is the truth; this is the display
    /// projection.
    pub recent_utxo_keys: Vec<OutPoint>,
    pub mempool: Vec<Transaction>,
    pub mempool_seen: HashMap<Txid, u64>,
    pub blocks: Vec<MinedBlock>,
    pub txs_by_id: HashMap<Txid, BitcoinTxWire>,
    pub accounts: Vec<BitcoinAccount>,
    pub height: u32,
    pub tip_hash: [u8; 32],
    /// Snapshot store for `btc_snapshot` / `btc_revert`. Bitcoin
    /// chain state is heavier than EVM (full UTXO map + mempool +
    /// block list + tx index) — each clone is ~10-100KB depending
    /// on how much activity there's been. Anvil-style invalidation:
    /// reverting to N drops N+1, N+2, ...
    pub snapshots: VecDeque<BitcoinStateSnapshot>,
    pub snapshot: BitcoinSnapshot,
}

/// Captured state for snapshot/revert. Holds clones of every mutable
/// field — restoring is just an assignment.
#[derive(Clone)]
pub struct BitcoinStateSnapshot {
    pub id: String,
    pub utxos: HashMap<OutPoint, TxOut>,
    pub utxo_height: HashMap<OutPoint, u32>,
    pub recent_utxo_keys: Vec<OutPoint>,
    pub mempool: Vec<Transaction>,
    pub mempool_seen: HashMap<Txid, u64>,
    pub blocks: Vec<MinedBlock>,
    pub txs_by_id: HashMap<Txid, BitcoinTxWire>,
    pub height: u32,
    pub tip_hash: [u8; 32],
}

#[derive(Clone)]
pub struct MinedBlock {
    pub height: u32,
    pub hash: [u8; 32],
    pub prev_hash: [u8; 32],
    pub timestamp: u64,
    pub txids: Vec<Txid>,
}

impl BitcoinState {
    /// Build a fresh chain. 10 pre-funded P2WPKH accounts, each
    /// holding a single 50-BTC UTXO from a synthetic genesis
    /// coinbase. Called at app startup and on every `btc_reset`
    /// invocation.
    pub fn new() -> Self {
        let secp = Secp256k1::new();
        let mut accounts = Vec::with_capacity(10);
        let mut rng = bitcoin::secp256k1::rand::thread_rng();

        for i in 0..10 {
            let secret = SecretKey::new(&mut rng);
            let public = PublicKey::new(secret.public_key(&secp));
            // hash160(pubkey_compressed) — the 20-byte digest used in
            // both P2PKH and P2WPKH outputs.
            let pubkey_hash_inner = bitcoin::hashes::hash160::Hash::hash(&public.to_bytes());
            let pubkey_hash: [u8; 20] = *pubkey_hash_inner.as_ref();

            let p2pkh = Address::p2pkh(public, Network::Regtest);
            // p2wpkh requires a "compressed pubkey" wrapper that's
            // typed-distinct from PublicKey for safety reasons —
            // `CompressedPublicKey::try_from` enforces compression.
            let compressed = bitcoin::CompressedPublicKey::try_from(public)
                .expect("freshly-derived secp256k1 pubkey is always compressed");
            let p2wpkh = Address::p2wpkh(&compressed, Network::Regtest);

            accounts.push(BitcoinAccount {
                secret,
                public,
                pubkey_hash,
                p2pkh,
                p2wpkh,
                label: if i == 0 {
                    "Default sender".to_string()
                } else {
                    format!("Account {i}")
                },
            });
        }

        // Bootstrap UTXO set: build a synthetic "genesis coinbase"
        // tx with one output per account, each holding 50 BTC.
        // It's not a real coinbase (no maturity gating, no PoW
        // reward calculation) — just a deterministic UTXO source
        // every account starts with.
        let coinbase_outputs: Vec<TxOut> = accounts
            .iter()
            .map(|acc| TxOut {
                value: Amount::from_sat(ACCOUNT_FUNDING_SATS),
                script_pubkey: acc.p2wpkh.script_pubkey(),
            })
            .collect();
        let coinbase_tx = Transaction {
            version: Version::TWO,
            lock_time: LockTime::ZERO,
            input: vec![TxIn {
                previous_output: OutPoint::null(),
                script_sig: ScriptBuf::from(b"fishbones-bootstrap".to_vec()),
                sequence: Sequence::MAX,
                witness: Witness::new(),
            }],
            output: coinbase_outputs.clone(),
        };
        let coinbase_txid = coinbase_tx.compute_txid();

        let mut utxos = HashMap::new();
        let mut utxo_height = HashMap::new();
        let mut recent_utxo_keys = Vec::new();
        for (vout, output) in coinbase_outputs.into_iter().enumerate() {
            let outpoint = OutPoint {
                txid: coinbase_txid,
                vout: vout as u32,
            };
            utxos.insert(outpoint, output);
            utxo_height.insert(outpoint, 0);
            recent_utxo_keys.push(outpoint);
        }

        let coinbase_wire = tx_to_wire(&coinbase_tx, BitcoinTxKind::Coinbase, None, Some(0));
        let mut txs_by_id = HashMap::new();
        txs_by_id.insert(coinbase_txid, coinbase_wire.clone());

        // Genesis block holds the bootstrap coinbase.
        let genesis_hash = hash_block(0, &[0u8; 32], &[coinbase_txid], 0);
        let genesis_block = MinedBlock {
            height: 0,
            hash: genesis_hash,
            prev_hash: [0u8; 32],
            timestamp: 0,
            txids: vec![coinbase_txid],
        };

        let snapshot = BitcoinSnapshot {
            scope: "singleton".to_string(),
            height: 0,
            tip_hash: format!("0x{}", hex::encode(genesis_hash)),
            accounts: accounts.iter().map(account_to_wire).collect(),
            utxos: recent_utxo_keys
                .iter()
                .filter_map(|op| utxo_to_wire(op, utxos.get(op)?, *utxo_height.get(op).unwrap_or(&0)))
                .collect(),
            mempool: Vec::new(),
            txs: vec![coinbase_wire],
            blocks: vec![block_to_wire(&genesis_block)],
            revision: 0,
        };

        Self {
            utxos,
            utxo_height,
            recent_utxo_keys,
            mempool: Vec::new(),
            mempool_seen: HashMap::new(),
            blocks: vec![genesis_block],
            txs_by_id,
            accounts,
            height: 0,
            tip_hash: genesis_hash,
            snapshots: VecDeque::new(),
            snapshot,
        }
    }
}

pub type SharedBtc = Arc<Mutex<BitcoinState>>;

// ── Wire conversion helpers ──────────────────────────────────────

fn account_to_wire(a: &BitcoinAccount) -> BitcoinAccountWire {
    BitcoinAccountWire {
        private_key: format!("0x{}", hex::encode(a.secret.secret_bytes())),
        public_key: format!("0x{}", hex::encode(a.public.to_bytes())),
        pubkey_hash: format!("0x{}", hex::encode(a.pubkey_hash)),
        p2pkh_address: a.p2pkh.to_string(),
        p2wpkh_address: a.p2wpkh.to_string(),
        label: a.label.clone(),
    }
}

fn utxo_to_wire(op: &OutPoint, out: &TxOut, height: u32) -> Option<BitcoinUtxoWire> {
    // Derive a human-readable address from the script if it matches a
    // standard template (P2PKH / P2WPKH / P2SH / P2WSH). Non-standard
    // scripts get None — frontend renders the raw script.
    let address = Address::from_script(&out.script_pubkey, Network::Regtest)
        .ok()
        .map(|a| a.to_string());
    Some(BitcoinUtxoWire {
        txid: format!("0x{}", op.txid),
        vout: op.vout,
        value: out.value.to_sat().to_string(),
        script_pub_key: format!("0x{}", hex::encode(out.script_pubkey.as_bytes())),
        height,
        address,
    })
}

fn tx_to_wire(
    tx: &Transaction,
    kind: BitcoinTxKind,
    total_in_sats: Option<u64>,
    block_height: Option<u32>,
) -> BitcoinTxWire {
    let total_out_sats: u64 = tx.output.iter().map(|o| o.value.to_sat()).sum();
    let total_in = total_in_sats.unwrap_or(0);
    let fee_sats = match (kind.clone(), total_in_sats) {
        (BitcoinTxKind::Coinbase, _) => None,
        (_, Some(in_sats)) => Some(in_sats.saturating_sub(total_out_sats).to_string()),
        (_, None) => None,
    };

    // Serialise the raw tx for the dock's "decode" view. Uses the
    // standard tx serialization (with witness data when present).
    let raw_bytes = bitcoin::consensus::encode::serialize(tx);

    BitcoinTxWire {
        txid: format!("0x{}", tx.compute_txid()),
        kind,
        fee_sats,
        total_in_sats: total_in.to_string(),
        total_out_sats: total_out_sats.to_string(),
        in_count: tx.input.len() as u32,
        out_count: tx.output.len() as u32,
        block_height,
        timestamp: now_ms(),
        raw_hex: format!("0x{}", hex::encode(&raw_bytes)),
    }
}

fn block_to_wire(b: &MinedBlock) -> BitcoinBlockWire {
    BitcoinBlockWire {
        height: b.height,
        hash: format!("0x{}", hex::encode(b.hash)),
        prev_hash: format!("0x{}", hex::encode(b.prev_hash)),
        timestamp: b.timestamp,
        txids: b.txids.iter().map(|t| format!("0x{t}")).collect(),
    }
}

/// Synthetic block hash. Real Bitcoin computes
/// `dsha256(version || prev_hash || merkle_root || timestamp || bits || nonce)`;
/// for the learning chain we don't simulate PoW so we use a
/// simplified `dsha256(prev_hash || merkle-stand-in || height)`
/// deterministic hash. Lessons about real PoW will call out the
/// simplification.
fn hash_block(height: u32, prev_hash: &[u8; 32], txids: &[Txid], timestamp: u64) -> [u8; 32] {
    use bitcoin::hashes::sha256d;
    let mut data = Vec::with_capacity(32 + 32 + 4 + 8);
    data.extend_from_slice(prev_hash);
    for txid in txids {
        data.extend_from_slice(&txid.to_byte_array());
    }
    data.extend_from_slice(&height.to_le_bytes());
    data.extend_from_slice(&timestamp.to_le_bytes());
    let h = sha256d::Hash::hash(&data);
    *h.as_ref()
}

fn now_ms() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

// ── Tauri commands (Phase 5e.1 — minimum viable surface) ─────────

#[tauri::command]
pub fn btc_init(state: State<'_, SharedBtc>) -> BitcoinSnapshot {
    state.lock().snapshot.clone()
}

#[tauri::command]
pub fn btc_get_snapshot(state: State<'_, SharedBtc>) -> BitcoinSnapshot {
    state.lock().snapshot.clone()
}

#[tauri::command]
pub fn btc_reset(app: AppHandle, state: State<'_, SharedBtc>) -> BitcoinSnapshot {
    let mut guard = state.lock();
    *guard = BitcoinState::new();
    guard.snapshot.bump_revision();
    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    snap
}

/// Read the spendable balance for an address. Walks the UTXO set
/// summing outputs locked to that address. O(N) in UTXO-set size —
/// fine for a learning chain (10s of UTXOs typical), would need an
/// address index for production.
#[tauri::command]
pub fn btc_balance(state: State<'_, SharedBtc>, address: String) -> Result<String, String> {
    // Parse + network-check the address against regtest. Wrong-network
    // addresses fail loud here so callers can surface a clear error
    // instead of silently returning 0.
    let parsed = Address::from_str(&address)
        .map_err(|e| format!("invalid address {address:?}: {e}"))?
        .require_network(Network::Regtest)
        .map_err(|e| format!("address {address:?} not regtest-format: {e}"))?;
    let target_script = parsed.script_pubkey();

    let guard = state.lock();
    let total: u64 = guard
        .utxos
        .iter()
        .filter(|(_, out)| out.script_pubkey == target_script)
        .map(|(_, out)| out.value.to_sat())
        .sum();
    Ok(total.to_string())
}

/// List UTXOs. With `address` set, filters to outputs locked to that
/// address; without, returns the full set (truncated to recent N for
/// dock efficiency).
#[tauri::command]
pub fn btc_utxos(
    state: State<'_, SharedBtc>,
    address: Option<String>,
) -> Result<Vec<BitcoinUtxoWire>, String> {
    let target_script = match address {
        Some(addr_str) => Some(
            Address::from_str(&addr_str)
                .map_err(|e| format!("invalid address {addr_str:?}: {e}"))?
                .require_network(Network::Regtest)
                .map_err(|e| format!("address {addr_str:?} not regtest-format: {e}"))?
                .script_pubkey(),
        ),
        None => None,
    };

    let guard = state.lock();
    let mut out = Vec::new();
    for op in &guard.recent_utxo_keys {
        let Some(txout) = guard.utxos.get(op) else { continue };
        if let Some(ref target) = target_script {
            if &txout.script_pubkey != target {
                continue;
            }
        }
        let height = *guard.utxo_height.get(op).unwrap_or(&0);
        if let Some(wire) = utxo_to_wire(op, txout, height) {
            out.push(wire);
        }
    }
    out.truncate(RECENT_UTXOS_LIMIT);
    Ok(out)
}

// ── Phase 5e.2: tx execution + mining ────────────────────────────

/// Result returned by `btc_send` / `btc_broadcast`. Carries the txid
/// + the post-tx snapshot for eager-adopt on the frontend.
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BitcoinSendResult {
    pub txid: String,
    pub snapshot: BitcoinSnapshot,
}

/// High-level "move sats from account A to address B" command.
/// Picks UTXOs greedily, builds a P2WPKH tx with one output to the
/// recipient + an optional change output back to the sender, signs
/// each input via BIP143 sighash + ECDSA, and pushes to the
/// mempool. The tx is NOT mined automatically — call `btc_mine`
/// after to confirm.
///
/// `from_index` is the index into the pre-funded `accounts` vec.
/// We don't accept arbitrary signing — for raw txs use
/// `btc_broadcast` with a hex you've signed yourself.
#[tauri::command]
pub fn btc_send(
    app: AppHandle,
    state: State<'_, SharedBtc>,
    from_index: usize,
    to_address: String,
    amount_sats: String,
    fee_sats: Option<String>,
) -> Result<BitcoinSendResult, String> {
    let amount: u64 = amount_sats
        .parse()
        .map_err(|e| format!("invalid amount_sats {amount_sats:?}: {e}"))?;
    let fee: u64 = fee_sats
        .as_deref()
        .map(str::parse::<u64>)
        .transpose()
        .map_err(|e| format!("invalid fee_sats: {e}"))?
        .unwrap_or(1000);

    let to = Address::from_str(&to_address)
        .map_err(|e| format!("invalid to_address {to_address:?}: {e}"))?
        .require_network(Network::Regtest)
        .map_err(|e| format!("to_address {to_address:?} not regtest-format: {e}"))?;

    let mut guard = state.lock();

    // Look up the sender keypair + p2wpkh script.
    let from_acc = guard
        .accounts
        .get(from_index)
        .ok_or_else(|| format!("from_index {from_index} out of range (have {})", guard.accounts.len()))?;
    let from_secret = from_acc.secret;
    let from_public = from_acc.public;
    let from_script = from_acc.p2wpkh.script_pubkey();

    // Pick UTXOs greedily until we have enough to cover amount + fee.
    let target_amount = amount.checked_add(fee)
        .ok_or_else(|| format!("amount + fee overflow"))?;
    let mut picked: Vec<(OutPoint, TxOut)> = Vec::new();
    let mut total_in: u64 = 0;
    for (op, txout) in guard.utxos.iter() {
        if txout.script_pubkey == from_script {
            picked.push((*op, txout.clone()));
            total_in = total_in.saturating_add(txout.value.to_sat());
            if total_in >= target_amount {
                break;
            }
        }
    }
    if total_in < target_amount {
        return Err(format!(
            "insufficient funds: account {from_index} has {total_in} sats, need {target_amount}",
        ));
    }

    let change = total_in - target_amount;

    // Build the unsigned tx structure.
    let inputs: Vec<TxIn> = picked
        .iter()
        .map(|(op, _)| TxIn {
            previous_output: *op,
            script_sig: ScriptBuf::new(),
            sequence: Sequence::ENABLE_RBF_NO_LOCKTIME,
            witness: Witness::new(),
        })
        .collect();
    let mut outputs: Vec<TxOut> = vec![TxOut {
        value: Amount::from_sat(amount),
        script_pubkey: to.script_pubkey(),
    }];
    if change > 546 {
        // Dust threshold for P2WPKH is 294 sats; we use 546 (legacy
        // dust) as a conservative cutoff. Smaller change rolls into
        // the fee instead of producing a dust output.
        outputs.push(TxOut {
            value: Amount::from_sat(change),
            script_pubkey: from_script.clone(),
        });
    }
    let mut tx = Transaction {
        version: Version::TWO,
        lock_time: LockTime::ZERO,
        input: inputs,
        output: outputs,
    };

    // Sign each input with BIP143 sighash + ECDSA. P2WPKH uses the
    // p2pkh script as its sighash script (the so-called
    // `script_code` for P2WPKH is `OP_DUP OP_HASH160 <pkhash>
    // OP_EQUALVERIFY OP_CHECKSIG`). We use `SighashCache::p2wpkh_signature_hash`
    // which encapsulates BIP143's exact rules.
    let secp = Secp256k1::new();
    let mut sighasher = SighashCache::new(&mut tx);
    let mut signatures: Vec<(usize, Vec<u8>)> = Vec::with_capacity(picked.len());
    for (i, (_, prev_out)) in picked.iter().enumerate() {
        let sighash = sighasher
            .p2wpkh_signature_hash(
                i,
                &from_script,
                prev_out.value,
                EcdsaSighashType::All,
            )
            .map_err(|e| format!("sighash compute failed for input {i}: {e:?}"))?;
        let msg = Message::from_digest(sighash.to_byte_array());
        let sig = secp.sign_ecdsa(&msg, &from_secret);
        let mut sig_bytes = sig.serialize_der().to_vec();
        sig_bytes.push(EcdsaSighashType::All as u8);
        signatures.push((i, sig_bytes));
    }

    // Apply the witnesses. Drop the SighashCache borrow first so we
    // can mutate tx again.
    drop(sighasher);
    let pubkey_bytes = from_public.to_bytes();
    for (i, sig_bytes) in signatures {
        // P2WPKH witness shape is [signature, pubkey].
        let _sig = EcdsaSignature::from_slice(&sig_bytes)
            .map_err(|e| format!("malformed ecdsa sig bytes: {e:?}"))?;
        tx.input[i].witness = Witness::from_slice(&[&sig_bytes[..], &pubkey_bytes[..]]);
    }

    // Validate + push to mempool. We reuse the broadcast path so the
    // validation logic lives in one place.
    let txid = push_to_mempool(&mut guard, tx, total_in, false)?;

    guard.snapshot.bump_revision();
    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    Ok(BitcoinSendResult {
        txid: format!("0x{}", txid),
        snapshot: snap,
    })
}

/// Push a pre-built raw tx hex into the mempool. Validates UTXO
/// existence + value conservation; does NOT validate witness scripts
/// (use `script.run` on the JS side for that). Throws on validation
/// failure.
#[tauri::command]
pub fn btc_broadcast(
    app: AppHandle,
    state: State<'_, SharedBtc>,
    raw_tx_hex: String,
) -> Result<BitcoinSendResult, String> {
    let tx_bytes = decode_btc_hex(&raw_tx_hex)?;
    let tx: Transaction = bitcoin::consensus::encode::deserialize(&tx_bytes)
        .map_err(|e| format!("tx parse failed: {e:?}"))?;

    let mut guard = state.lock();

    // Sum inputs by looking up each previous output in the UTXO set.
    let mut total_in: u64 = 0;
    for (i, txin) in tx.input.iter().enumerate() {
        let prev = guard.utxos.get(&txin.previous_output).ok_or_else(|| {
            format!(
                "input {i} references unknown UTXO {:?}:{}",
                txin.previous_output.txid, txin.previous_output.vout
            )
        })?;
        total_in = total_in.saturating_add(prev.value.to_sat());
    }
    let total_out: u64 = tx.output.iter().map(|o| o.value.to_sat()).sum();
    if total_out > total_in {
        return Err(format!(
            "value-conservation violation: outputs {total_out} > inputs {total_in}",
        ));
    }

    let txid = push_to_mempool(&mut guard, tx, total_in, false)?;

    guard.snapshot.bump_revision();
    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    Ok(BitcoinSendResult {
        txid: format!("0x{}", txid),
        snapshot: snap,
    })
}

/// Mine `n` blocks (default 1). Each call pulls everything from the
/// mempool into a single new block — the first block of an
/// `n > 1` call has the txns; subsequent blocks are empty (just
/// the synthetic coinbase placeholder, no rewards). Real mining
/// would limit by block-size; we don't enforce a limit since the
/// learning chain rarely produces more than a handful of mempool
/// txs at a time.
#[tauri::command]
pub fn btc_mine(
    app: AppHandle,
    state: State<'_, SharedBtc>,
    blocks: Option<u32>,
) -> Result<Vec<BitcoinBlockWire>, String> {
    let n = blocks.unwrap_or(1);
    if n == 0 {
        return Ok(Vec::new());
    }

    let mut guard = state.lock();
    let mut produced = Vec::with_capacity(n as usize);

    for block_idx in 0..n {
        let height = guard.height + 1;
        let prev_hash = guard.tip_hash;

        // First block of the call drains the mempool; subsequent
        // blocks are empty.
        let mempool_txs: Vec<Transaction> = if block_idx == 0 {
            std::mem::take(&mut guard.mempool)
        } else {
            Vec::new()
        };
        let mempool_txids: Vec<Txid> = mempool_txs.iter().map(|t| t.compute_txid()).collect();

        // Apply the txs: spend their inputs, add their outputs to the
        // UTXO set. Validation already happened at broadcast time.
        for tx in &mempool_txs {
            for txin in &tx.input {
                guard.utxos.remove(&txin.previous_output);
                guard.utxo_height.remove(&txin.previous_output);
            }
            let txid = tx.compute_txid();
            for (vout, txout) in tx.output.iter().enumerate() {
                let op = OutPoint {
                    txid,
                    vout: vout as u32,
                };
                guard.utxos.insert(op, txout.clone());
                guard.utxo_height.insert(op, height);
                guard.recent_utxo_keys.insert(0, op);
            }
            // Mark mined in tx index.
            if let Some(wire) = guard.txs_by_id.get_mut(&txid) {
                wire.block_height = Some(height);
            }
        }
        guard.recent_utxo_keys.truncate(RECENT_UTXOS_LIMIT);

        // Mempool drained — clear the seen-set entries that are now
        // mined.
        for txid in &mempool_txids {
            guard.mempool_seen.remove(txid);
        }

        let timestamp = now_ms();
        let block_hash = hash_block(height, &prev_hash, &mempool_txids, timestamp);
        let block = MinedBlock {
            height,
            hash: block_hash,
            prev_hash,
            timestamp,
            txids: mempool_txids,
        };
        let block_wire = block_to_wire(&block);
        guard.blocks.push(block.clone());
        if guard.blocks.len() > RECENT_BLOCKS_LIMIT {
            let drain_count = guard.blocks.len() - RECENT_BLOCKS_LIMIT;
            guard.blocks.drain(..drain_count);
        }
        guard.height = height;
        guard.tip_hash = block_hash;

        produced.push(block_wire);
    }

    // Rebuild snapshot view fields from the live state.
    rebuild_snapshot_views(&mut guard);
    guard.snapshot.bump_revision();
    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    Ok(produced)
}

/// Drop the entire mempool without mining. Useful for tests that
/// want to discard a tx that "would have failed" and continue.
#[tauri::command]
pub fn btc_flush_mempool(app: AppHandle, state: State<'_, SharedBtc>) -> BitcoinSnapshot {
    let mut guard = state.lock();
    guard.mempool.clear();
    guard.mempool_seen.clear();
    rebuild_snapshot_views(&mut guard);
    guard.snapshot.bump_revision();
    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    snap
}

// ── Internal helpers ─────────────────────────────────────────────

/// Validate + add a tx to the mempool. `total_in` precomputed by
/// caller (it walked the inputs to look up UTXO values).
/// `is_coinbase` is reserved for future use; for now we only
/// accept non-coinbase mempool entries.
fn push_to_mempool(
    state: &mut BitcoinState,
    tx: Transaction,
    total_in: u64,
    _is_coinbase: bool,
) -> Result<Txid, String> {
    let txid = tx.compute_txid();
    if state.mempool_seen.contains_key(&txid) {
        return Err(format!("duplicate tx {txid:?} already in mempool"));
    }

    // Classify the tx for the dock badge. We look at the FIRST output
    // since that's the one the user is reasoning about ("I sent to
    // a SegWit address"). Mixed-type txs are tagged by output kind.
    let kind = classify_tx_kind(&tx);
    let wire = tx_to_wire(&tx, kind, Some(total_in), None);

    state.txs_by_id.insert(txid, wire.clone());
    state.mempool_seen.insert(txid, now_ms());
    state.mempool.push(tx);

    rebuild_snapshot_views(state);
    Ok(txid)
}

/// Classify a tx by the script type of its primary output. Used for
/// the dock's tx-row badge ("p2wpkh", "p2sh", etc.).
fn classify_tx_kind(tx: &Transaction) -> BitcoinTxKind {
    let Some(first_out) = tx.output.first() else {
        return BitcoinTxKind::Other;
    };
    let s = &first_out.script_pubkey;
    if s.is_p2wpkh() {
        BitcoinTxKind::P2wpkh
    } else if s.is_p2pkh() {
        BitcoinTxKind::P2pkh
    } else if s.is_p2sh() {
        BitcoinTxKind::P2sh
    } else if s.is_p2wsh() {
        BitcoinTxKind::P2wsh
    } else {
        BitcoinTxKind::Other
    }
}

/// Refresh the snapshot's display projections (utxos, mempool, txs,
/// blocks) from the canonical state. Cheap (10s of items typical).
fn rebuild_snapshot_views(state: &mut BitcoinState) {
    state.snapshot.height = state.height;
    state.snapshot.tip_hash = format!("0x{}", hex::encode(state.tip_hash));

    state.snapshot.utxos = state
        .recent_utxo_keys
        .iter()
        .filter_map(|op| {
            let txout = state.utxos.get(op)?;
            let h = *state.utxo_height.get(op).unwrap_or(&0);
            utxo_to_wire(op, txout, h)
        })
        .take(RECENT_UTXOS_LIMIT)
        .collect();

    state.snapshot.mempool = state
        .mempool
        .iter()
        .filter_map(|tx| state.txs_by_id.get(&tx.compute_txid()).cloned())
        .collect();

    // Recent confirmed txs — collected from txs_by_id where
    // block_height is set, sorted by timestamp descending.
    let mut confirmed: Vec<&BitcoinTxWire> = state
        .txs_by_id
        .values()
        .filter(|w| w.block_height.is_some())
        .collect();
    confirmed.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    state.snapshot.txs = confirmed
        .into_iter()
        .take(RECENT_TXS_LIMIT)
        .cloned()
        .collect();

    state.snapshot.blocks = state
        .blocks
        .iter()
        .rev()
        .take(RECENT_BLOCKS_LIMIT)
        .map(block_to_wire)
        .collect();
}

fn decode_btc_hex(s: &str) -> Result<Vec<u8>, String> {
    let stripped = s.strip_prefix("0x").unwrap_or(s);
    hex::decode(stripped).map_err(|e| format!("invalid hex {s:?}: {e}"))
}

// ── Phase 5e.3: snapshot/revert + queries ────────────────────────

/// Take a snapshot of the chain state. Returns an opaque ID
/// `btc_revert` can later restore to. Snapshots are stored in
/// insertion order; reverting to N invalidates N+1, N+2, ...
/// (anvil-style semantics — same shape EVM uses).
///
/// Bitcoin chain state is heavier than EVM's (full UTXO map +
/// mempool + blocks); each snapshot is ~10-100KB. We don't enforce
/// a cap. Lessons that take many snapshots without reverting can
/// blow memory but that's a lesson-author concern.
#[tauri::command]
pub fn btc_snapshot(state: State<'_, SharedBtc>) -> String {
    use rand::RngCore;
    let mut bytes = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut bytes);
    let id = format!("btc-snap-{}", hex::encode(bytes));

    let mut guard = state.lock();
    let snap = BitcoinStateSnapshot {
        id: id.clone(),
        utxos: guard.utxos.clone(),
        utxo_height: guard.utxo_height.clone(),
        recent_utxo_keys: guard.recent_utxo_keys.clone(),
        mempool: guard.mempool.clone(),
        mempool_seen: guard.mempool_seen.clone(),
        blocks: guard.blocks.clone(),
        txs_by_id: guard.txs_by_id.clone(),
        height: guard.height,
        tip_hash: guard.tip_hash,
    };
    guard.snapshots.push_back(snap);
    id
}

/// Restore the chain to a previously-snapshotted state. Returns
/// `true` if the snapshot was found + applied; `false` if the id
/// is unknown or already consumed by an earlier revert.
#[tauri::command]
pub fn btc_revert(
    app: AppHandle,
    state: State<'_, SharedBtc>,
    id: String,
) -> Result<bool, String> {
    let mut guard = state.lock();
    let pos = guard.snapshots.iter().position(|s| s.id == id);
    let Some(pos) = pos else {
        return Ok(false);
    };

    // Drain everything from `pos` onwards. The found snapshot is the
    // first drained; everything after gets dropped (anvil-style
    // invalidation).
    let mut tail: VecDeque<_> = guard.snapshots.drain(pos..).collect();
    let target = tail.pop_front().expect("position checked just above");
    drop(tail);

    guard.utxos = target.utxos;
    guard.utxo_height = target.utxo_height;
    guard.recent_utxo_keys = target.recent_utxo_keys;
    guard.mempool = target.mempool;
    guard.mempool_seen = target.mempool_seen;
    guard.blocks = target.blocks;
    guard.txs_by_id = target.txs_by_id;
    guard.height = target.height;
    guard.tip_hash = target.tip_hash;

    rebuild_snapshot_views(&mut guard);
    guard.snapshot.bump_revision();
    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    Ok(true)
}

/// Look up a single tx by its 0x-prefixed txid. Returns `None` if
/// the chain has never seen the tx (mempool or mined).
#[tauri::command]
pub fn btc_get_tx(state: State<'_, SharedBtc>, txid: String) -> Result<Option<BitcoinTxWire>, String> {
    let bytes = decode_btc_hex(&txid)?;
    if bytes.len() != 32 {
        return Err(format!("txid must be 32 bytes, got {}", bytes.len()));
    }
    // rust-bitcoin's Txid is a wrapper around a 32-byte sha256d hash.
    // It serialises as little-endian when displayed but FromHex /
    // from_byte_array consumes big-endian. We use from_byte_array
    // with a manual byte-flip to match the wire's display form.
    let mut le = [0u8; 32];
    le.copy_from_slice(&bytes);
    let parsed_txid = Txid::from_byte_array(le);
    let guard = state.lock();
    Ok(guard.txs_by_id.get(&parsed_txid).cloned())
}

/// Read the current tip height. Cheap — single u32 load.
#[tauri::command]
pub fn btc_get_height(state: State<'_, SharedBtc>) -> u32 {
    state.lock().height
}

/// Return the current mempool. The dock UI subscribes to snapshot
/// events for the live view; this is for tests that want the
/// mempool right now without waiting for an event round-trip.
#[tauri::command]
pub fn btc_mempool(state: State<'_, SharedBtc>) -> Vec<BitcoinTxWire> {
    let guard = state.lock();
    guard
        .mempool
        .iter()
        .filter_map(|tx| guard.txs_by_id.get(&tx.compute_txid()).cloned())
        .collect()
}
