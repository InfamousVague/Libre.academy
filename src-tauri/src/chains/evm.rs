//! EVM chain runtime — wraps the `revm` crate.
//!
//! `revm` is the same execution engine reth + Foundry use; we get
//! real EVM opcode execution, gas accounting, and full state
//! tracking against an in-memory database. ~50× faster than the
//! `@ethereumjs/vm` JS implementation we used before, and shares
//! the validator-grade behaviour with production tools.
//!
//! ### Architecture
//!
//! `EvmState` holds an in-memory `CacheDB` plus the 10 pre-funded
//! EOA addresses (the same set anvil's `--accounts 10` would
//! print, so a learner who copies an address from anvil docs into
//! their lesson code sees a match). The state lives behind an
//! `Arc<Mutex<>>` registered as Tauri state at app startup; every
//! command locks it for the duration of its operation.
//!
//! Each tx creates a fresh `Context` wrapping a borrow of the
//! cache DB, executes via `transact_commit`, and the resulting
//! state changes are persisted back to the cache. The cost of
//! rebuilding the context per tx is negligible (microseconds).
//!
//! ### What lands in this file across the phase rollout
//!
//! - **Phase 5d.1** (this commit): state struct + `evm_init` /
//!   `evm_get_snapshot` / `evm_reset` / `evm_balance` /
//!   `evm_set_balance`. Just enough to verify the wiring.
//! - **Phase 5d.2**: `evm_send_tx` (raw value transfer + data),
//!   `evm_deploy` (deploy bytecode + ctor args), `evm_call`
//!   (read-only eth_call), `evm_get_logs`, `evm_get_code`.
//! - **Phase 5d.3**: `evm_mine`, `evm_warp`, `evm_snapshot` /
//!   `evm_revert`, `evm_block_number` / `evm_block_timestamp`.
//!
//! ### Wire format
//!
//! Wei balances exceed JS's safe-integer ceiling for any realistic
//! amount, so they're serialised as decimal strings. Addresses
//! and bytecode use 0x-prefixed lowercase hex. Block numbers fit
//! in u64 for any chain we'd realistically simulate.

use std::collections::{HashMap, VecDeque};
use std::str::FromStr;
use std::sync::Arc;

use alloy_primitives::{Address, Bytes, TxKind, U256};
use parking_lot::Mutex;
use revm::context::TxEnv;
use revm::context::result::{ExecutionResult, Output};
use revm::database::{CacheDB, EmptyDB};
use revm::state::AccountInfo;
use revm::{Context, ExecuteCommitEvm, ExecuteEvm, MainBuilder, MainContext};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use super::state::{emit_snapshot, ChainSnapshot};

// ── Snapshot wire types ──────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EvmAccountSnapshot {
    /// 0x-prefixed checksummed address.
    pub address: String,
    /// 0x-prefixed private key. Pre-funded EOAs are the well-known
    /// anvil set so a learner who's followed an anvil tutorial sees
    /// matching keys.
    pub private_key: String,
    /// Wei balance as a decimal string (u256 max exceeds js safe int).
    pub balance_wei: String,
    /// Tx-counter for this account.
    pub nonce: String,
    /// Display label — `accounts[0]` is "Default sender".
    pub label: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EvmContractSnapshot {
    pub address: String,
    /// Lesson-supplied name from the deploy invocation. Multiple
    /// deploys of the same `name` show up as separate entries.
    pub name: String,
    pub deployed_at_block: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum EvmTxKind {
    Deploy,
    Call,
    ValueTransfer,
    Faucet,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum EvmTxStatus {
    Success,
    Reverted,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EvmTxSnapshot {
    /// 0x-prefixed 32-byte keccak hash. For Faucet entries (which
    /// don't go through a real tx) we synthesise a `0xfaucet…`
    /// placeholder so the dock can distinguish them.
    pub hash: String,
    pub kind: EvmTxKind,
    pub from: String,
    pub to: Option<String>,
    /// Function name when known (call into an instrumented contract);
    /// None otherwise.
    pub fn_name: Option<String>,
    pub value_wei: String,
    pub status: EvmTxStatus,
    pub block_number: String,
    /// Wallclock at which the tx ran on the host. Milliseconds since
    /// the Unix epoch — fits in JS's safe-integer range.
    pub timestamp_ms: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EvmSnapshot {
    pub scope: String,
    pub block_number: String,
    pub block_timestamp: String,
    pub accounts: Vec<EvmAccountSnapshot>,
    pub contracts: Vec<EvmContractSnapshot>,
    pub txs: Vec<EvmTxSnapshot>,
    pub revision: u64,
}

impl ChainSnapshot for EvmSnapshot {
    fn channel(&self) -> &'static str {
        "evm"
    }
    fn bump_revision(&mut self) {
        self.revision = self.revision.saturating_add(1);
    }
}

// ── Pre-funded account set (anvil's well-known mnemonic) ─────────

/// The 10 accounts derived from anvil's default mnemonic
/// `"test test test test test test test test test test test junk"`
/// at derivation path `m/44'/60'/0'/0/N`. Hardcoded as
/// `(privkey_hex, address_checksum)` pairs so we don't pull the
/// HD-wallet derivation crates just for bootstrap.
///
/// The privkey list matches the JS frontend's `DEFAULT_PRIVKEYS`
/// in `runtimes/evm/types.ts`. Matching the anvil convention means
/// any third-party tutorial or test that hardcodes one of these
/// addresses works out of the box.
const ANVIL_ACCOUNTS: &[(&str, &str)] = &[
    (
        "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        "f39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    ),
    (
        "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        "70997970C51812dc3A010C7d01b50e0d17dc79C8",
    ),
    (
        "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
        "3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    ),
    (
        "7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
        "90F79bf6EB2c4f870365E785982E1f101E93b906",
    ),
    (
        "47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
        "15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    ),
    (
        "8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
        "9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    ),
    (
        "92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
        "976EA74026E726554dB657fA54763abd0C3a0aa9",
    ),
    (
        "4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
        "14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    ),
    (
        "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
        "23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    ),
    (
        "2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dfd1c6311b",
        "a0Ee7A142d267C1f36714E4a8F75612F20a79720",
    ),
];

/// Default per-account funding: 1,000,000 ETH = 10^24 wei. Same
/// generous balance the JS chain used; lessons that test "what
/// happens if you can't afford X" override per-account via
/// `setBalance`.
const DEFAULT_BALANCE_WEI: U256 = U256::from_limbs([
    // 10^24 wei = 0xd3c21bcecceda1000000
    // Stored low-to-high in U256's u64 limbs.
    0xd3c2_1bce_cced_a100_0000u128 as u64,
    (0xd3c2_1bce_cced_a100_0000u128 >> 64) as u64,
    0,
    0,
]);

const RECENT_TXS_LIMIT: usize = 30;
const RECENT_CONTRACTS_LIMIT: usize = 20;

// ── State struct ─────────────────────────────────────────────────

/// Wraps the cache DB + the 10 pre-funded EOAs + the snapshot we
/// push to the frontend. Held behind an `Arc<Mutex<>>` registered
/// as Tauri state at app startup; commands lock it for the
/// duration of the operation.
pub struct EvmState {
    /// Account state DB. We pass a fresh `Context` wrapping a
    /// borrow of this on every tx — cheap relative to the cost of
    /// running the EVM, and avoids the type-juggling of holding a
    /// fully-typed `Context` through the lifetime of the state.
    pub db: CacheDB<EmptyDB>,
    /// Pre-funded EOAs in the same order anvil prints them.
    /// `accounts[0]` is the default sender.
    pub accounts: Vec<EvmAccountSnapshot>,
    /// Map of address → privkey for tx signing. Built from
    /// `accounts` once at boot; lookups happen on every send_tx.
    /// Keyed by the lowercase non-prefixed hex string for stable
    /// equality.
    #[allow(dead_code)] // used in 5d.2 for tx signing
    pub privkeys: HashMap<String, [u8; 32]>,
    /// Current block number. Bumped by `evm_mine`. Real chains
    /// would bump per-tx; for a learning chain we let the lesson
    /// author control mining explicitly so balance / log assertions
    /// are stable.
    pub block_number: u64,
    /// Current block timestamp (unix seconds). Bumped by `evm_warp`
    /// and by `evm_mine` (which adds 12s per block — post-merge
    /// slot interval).
    pub block_timestamp: u64,
    /// Pending timestamp delta. `evm_warp` accumulates here; the
    /// next `evm_mine` flushes it into `block_timestamp`. Mirrors
    /// hardhat's `evm_setNextBlockTimestamp` accumulation behaviour.
    pub pending_warp_seconds: u64,
    /// Snapshot store for `evm_snapshot` / `evm_revert`. Anvil/
    /// hardhat semantics: revert(id) invalidates all snapshots
    /// taken after the reverted-to point. We use a VecDeque to
    /// preserve insertion order so we can drop suffixes on revert.
    pub snapshots: VecDeque<(String, CacheDB<EmptyDB>, u64, u64)>,
    pub snapshot: EvmSnapshot,
}

impl EvmState {
    /// Build a fresh chain. Called at app startup and on every
    /// `evm_reset` invocation.
    pub fn new() -> Self {
        let mut db = CacheDB::new(EmptyDB::default());
        let mut accounts = Vec::with_capacity(ANVIL_ACCOUNTS.len());
        let mut privkeys = HashMap::with_capacity(ANVIL_ACCOUNTS.len());

        for (i, (pk_hex, addr_hex)) in ANVIL_ACCOUNTS.iter().enumerate() {
            let addr = Address::from_str(&format!("0x{addr_hex}")).expect("valid hardcoded address");
            // Seed the cache DB with the account info — balance
            // pre-funded, nonce zero. Production EVM usage would
            // also set code (empty for EOAs) which AccountInfo
            // defaults to.
            // `..Default::default()` future-proofs against new
            // AccountInfo fields revm adds in minor releases (38.x
            // added `account_id`; 39.x might add more).
            let info = AccountInfo {
                balance: DEFAULT_BALANCE_WEI,
                nonce: 0,
                code_hash: alloy_primitives::keccak256([]),
                code: None,
                ..Default::default()
            };
            db.insert_account_info(addr, info);

            // Decode the privkey hex into 32 bytes. Hardcoded so the
            // unwrap is sound.
            let pk_bytes: [u8; 32] = hex::decode(pk_hex)
                .expect("valid hardcoded privkey hex")
                .try_into()
                .expect("32-byte privkey");
            privkeys.insert(format!("0x{}", addr_hex.to_lowercase()), pk_bytes);

            accounts.push(EvmAccountSnapshot {
                address: format!("0x{addr_hex}"),
                private_key: format!("0x{pk_hex}"),
                balance_wei: DEFAULT_BALANCE_WEI.to_string(),
                nonce: "0".to_string(),
                label: if i == 0 {
                    "Default sender".to_string()
                } else {
                    format!("Account {i}")
                },
            });
        }

        let snapshot = EvmSnapshot {
            scope: "singleton".to_string(),
            block_number: "0".to_string(),
            block_timestamp: "0".to_string(),
            accounts,
            contracts: Vec::new(),
            txs: Vec::new(),
            revision: 0,
        };

        Self {
            db,
            accounts: snapshot.accounts.clone(),
            privkeys,
            block_number: 0,
            block_timestamp: 0,
            pending_warp_seconds: 0,
            snapshots: VecDeque::new(),
            snapshot,
        }
    }

    /// Rebuild the snapshot's account balances + nonces from the
    /// live cache DB. Cheap (10 lookups). Called after every
    /// state-mutating command.
    pub fn rebuild_account_state(&mut self) {
        for acc in self.snapshot.accounts.iter_mut() {
            if let Ok(addr) = Address::from_str(&acc.address) {
                // `load_account` on CacheDB is infallible (creates
                // an empty entry on miss), so it's not an `if let
                // Ok(_)` pattern even though the signature returns
                // `Result` for the Database trait.
                let info = self.db.load_account(addr).expect("CacheDB::load_account is infallible");
                acc.balance_wei = info.info.balance.to_string();
                acc.nonce = info.info.nonce.to_string();
            }
        }
        // Mirror back to our convenience field.
        self.accounts = self.snapshot.accounts.clone();
    }

    /// Push a tx event into the recent-tx ring buffer.
    #[allow(dead_code)] // wired up in 5d.2
    pub fn push_tx(&mut self, tx: EvmTxSnapshot) {
        let mut txs = vec![tx];
        txs.extend(self.snapshot.txs.iter().take(RECENT_TXS_LIMIT - 1).cloned());
        self.snapshot.txs = txs;
    }

    /// Push a contract-deploy event into the ring buffer (de-duped
    /// on `address`; redeploys at the same address — rare but
    /// possible via CREATE2 — replace the prior entry).
    #[allow(dead_code)] // wired up in 5d.2
    pub fn push_contract(&mut self, c: EvmContractSnapshot) {
        let without: Vec<_> = self
            .snapshot
            .contracts
            .iter()
            .filter(|x| x.address != c.address)
            .cloned()
            .collect();
        let mut contracts = vec![c];
        contracts.extend(without.into_iter().take(RECENT_CONTRACTS_LIMIT - 1));
        self.snapshot.contracts = contracts;
    }
}

pub type SharedEvm = Arc<Mutex<EvmState>>;

// ── Tauri commands (Phase 5d.1 — minimum viable surface) ─────────

#[tauri::command]
pub fn evm_init(state: State<'_, SharedEvm>) -> EvmSnapshot {
    state.lock().snapshot.clone()
}

#[tauri::command]
pub fn evm_get_snapshot(state: State<'_, SharedEvm>) -> EvmSnapshot {
    state.lock().snapshot.clone()
}

#[tauri::command]
pub fn evm_reset(app: AppHandle, state: State<'_, SharedEvm>) -> EvmSnapshot {
    let mut guard = state.lock();
    *guard = EvmState::new();
    guard.snapshot.bump_revision();
    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    snap
}

/// Read the current wei balance for an arbitrary address. Returns
/// "0" for accounts that don't exist (matches the geth/anvil
/// behaviour of normalising missing accounts to a zero balance).
/// Decimal-string return because U256 can exceed JS's safe-integer
/// range.
#[tauri::command]
pub fn evm_balance(state: State<'_, SharedEvm>, address: String) -> Result<String, String> {
    let addr = Address::from_str(&address)
        .map_err(|e| format!("invalid address {address:?}: {e}"))?;
    let mut guard = state.lock();
    match guard.db.load_account(addr) {
        Ok(info) => Ok(info.info.balance.to_string()),
        Err(_) => Ok("0".to_string()),
    }
}

/// Set an account's wei balance directly. Same as anvil's
/// `anvil_setBalance` — for funding test characters that don't
/// need a real EOA. Synthesises a `Faucet` tx-snapshot row so the
/// dock surfaces the action.
#[tauri::command]
pub fn evm_set_balance(
    app: AppHandle,
    state: State<'_, SharedEvm>,
    address: String,
    wei: String,
) -> Result<EvmSnapshot, String> {
    let addr = Address::from_str(&address)
        .map_err(|e| format!("invalid address {address:?}: {e}"))?;
    let new_balance = U256::from_str(&wei)
        .map_err(|e| format!("invalid wei {wei:?}: {e}"))?;

    let mut guard = state.lock();
    let mut info = guard
        .db
        .load_account(addr)
        .map(|a| a.info.clone())
        .unwrap_or_default();
    info.balance = new_balance;
    guard.db.insert_account_info(addr, info);

    // Read block_number into a local before push_tx (which takes &mut
    // self) so we don't have an overlapping immutable+mutable borrow.
    let block_number_str = guard.block_number.to_string();
    guard.push_tx(EvmTxSnapshot {
        hash: synth_tx_hash("faucet"),
        kind: EvmTxKind::Faucet,
        from: "0x0000000000000000000000000000000000000000".to_string(),
        to: Some(address.clone()),
        fn_name: None,
        value_wei: new_balance.to_string(),
        status: EvmTxStatus::Success,
        block_number: block_number_str,
        timestamp_ms: now_ms(),
    });
    guard.rebuild_account_state();
    guard.snapshot.bump_revision();

    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    Ok(snap)
}

// ── Phase 5d.2: tx execution ─────────────────────────────────────

/// Result of a state-mutating tx — what the frontend needs to render
/// the dock + drive test assertions. Logs are returned to the
/// caller so test code can inspect events without a separate
/// `evm_get_logs` round-trip.
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EvmTxResult {
    /// 0x-prefixed tx hash. Synthetic for now (revm doesn't sign;
    /// we hash the (block, tx-index, caller) tuple in 5d.3 — for
    /// 5d.2 we use a random placeholder).
    pub hash: String,
    pub status: EvmTxStatus,
    /// 0x-prefixed return data. For deploy txs this is the deployed
    /// runtime bytecode; for calls it's the function's return value.
    pub output: String,
    pub gas_used: String,
    pub block_number: String,
    /// Logs emitted during execution. Each is `(address, topics[], data)`
    /// in 0x-hex. The frontend's viem layer parses topics + data
    /// against the lesson's known ABIs.
    pub logs: Vec<EvmLogWire>,
    /// On deploy: the address of the new contract. None on Call txs.
    pub deployed_address: Option<String>,
    /// New post-tx snapshot. Saves a round-trip — every tx-mutating
    /// command returns this so the frontend's chainService can
    /// adoptSnapshot eagerly without waiting for the event.
    pub snapshot: EvmSnapshot,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EvmLogWire {
    pub address: String,
    pub topics: Vec<String>,
    pub data: String,
}

/// Send an arbitrary transaction. `to == None` means contract
/// creation (a CREATE tx); `to == Some(addr)` is a CALL — the
/// `data` is calldata for the receiving contract or unused for a
/// pure value transfer. Same tx model the EIP-1559 / EIP-2930
/// transactions use.
///
/// `from` MUST be one of the 10 pre-funded EOAs — we look up its
/// nonce from the cache DB but DON'T sign (revm doesn't validate
/// signatures in our usage; the privkey list is here for the
/// frontend's viem layer when it builds raw txs against the
/// transport adapter).
#[tauri::command]
pub fn evm_send_tx(
    app: AppHandle,
    state: State<'_, SharedEvm>,
    from: String,
    to: Option<String>,
    value_wei: String,
    data_hex: String,
    fn_name: Option<String>,
    contract_name: Option<String>,
) -> Result<EvmTxResult, String> {
    let from_addr = Address::from_str(&from)
        .map_err(|e| format!("invalid from address {from:?}: {e}"))?;
    let value = U256::from_str(&value_wei)
        .map_err(|e| format!("invalid value_wei {value_wei:?}: {e}"))?;
    let data = decode_hex_data(&data_hex)?;

    let kind = match &to {
        Some(addr_str) => {
            let to_addr = Address::from_str(addr_str)
                .map_err(|e| format!("invalid to address {addr_str:?}: {e}"))?;
            TxKind::Call(to_addr)
        }
        None => TxKind::Create,
    };

    let mut guard = state.lock();
    let block_number = guard.block_number;

    // Build a fresh Context wrapping a borrow of the cache DB. revm's
    // builder pattern wants ownership of the db; using `&mut` works
    // via the Database trait's blanket impl. Cheap relative to tx
    // execution.
    let result = {
        let mut evm = Context::mainnet()
            .with_db(&mut guard.db)
            .build_mainnet();
        let tx = TxEnv {
            caller: from_addr,
            kind,
            value,
            data: Bytes::from(data),
            gas_limit: 30_000_000,  // generous; learning chain
            gas_price: 0,
            ..Default::default()
        };
        evm.transact_commit(tx)
            .map_err(|e| format!("evm execution failed: {e:?}"))?
    };

    // Pull out the result. Three variants — Success, Revert, Halt.
    // The latter two are both "the tx didn't apply" from the
    // learner's perspective; we surface both as Reverted with the
    // halt reason in the error text.
    //
    // revm 38: field is `gas` (not `gas_used`); Success has `logs`
    // as a separate sibling, not inside output. We pull logs out
    // here in the same match so we don't need a second clone.
    let (status, output_bytes, gas_used, deployed_addr, logs) = match result {
        ExecutionResult::Success { output, gas, logs, .. } => {
            let (output_bytes, deployed_addr) = match output {
                Output::Call(b) => (b.to_vec(), None),
                Output::Create(b, addr) => (b.to_vec(), addr.map(|a| format!("{a:#x}"))),
            };
            let log_wire: Vec<EvmLogWire> = logs
                .iter()
                .map(|l| EvmLogWire {
                    address: format!("{:#x}", l.address),
                    topics: l.data.topics().iter().map(|t| format!("{t:#x}")).collect(),
                    data: format!("0x{}", hex::encode(l.data.data.as_ref())),
                })
                .collect();
            (EvmTxStatus::Success, output_bytes, gas, deployed_addr, log_wire)
        }
        ExecutionResult::Revert { output, gas, .. } => {
            (EvmTxStatus::Reverted, output.to_vec(), gas, None, Vec::new())
        }
        ExecutionResult::Halt { reason, gas, .. } => {
            // Halts (out-of-gas, stack overflow, etc.) — surface as
            // a hard error. The caller can pull the reason out of
            // the error message.
            return Err(format!("evm halt: {reason:?} (gas used {gas})"));
        }
    };

    // Synthesise a tx hash for now. Phase 5d.3 will compute a real
    // one from (block_number, tx_index_in_block) + signing.
    let hash = synth_tx_hash("tx");

    let kind_label = if to.is_none() {
        EvmTxKind::Deploy
    } else if value > U256::ZERO && data_hex == "0x" {
        EvmTxKind::ValueTransfer
    } else {
        EvmTxKind::Call
    };

    let tx_snapshot = EvmTxSnapshot {
        hash: hash.clone(),
        kind: kind_label.clone(),
        from: from.clone(),
        to: deployed_addr.clone().or(to.clone()),
        fn_name: fn_name.clone(),
        value_wei: value.to_string(),
        status: status.clone(),
        block_number: block_number.to_string(),
        timestamp_ms: now_ms(),
    };
    guard.push_tx(tx_snapshot);

    // For deploy txs, also push a contract snapshot so the dock's
    // contract list reflects the new bytecode. `contract_name` is
    // the lesson-supplied label.
    if let (Some(addr), Some(name)) = (&deployed_addr, &contract_name) {
        guard.push_contract(EvmContractSnapshot {
            address: addr.clone(),
            name: name.clone(),
            deployed_at_block: block_number.to_string(),
        });
    }

    guard.rebuild_account_state();
    guard.snapshot.bump_revision();
    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);

    Ok(EvmTxResult {
        hash,
        status,
        output: format!("0x{}", hex::encode(&output_bytes)),
        gas_used: gas_used.to_string(),
        block_number: block_number.to_string(),
        logs,
        deployed_address: deployed_addr,
        snapshot: snap,
    })
}

/// Read-only `eth_call`-style execution. State is NOT applied — runs
/// against a temporary clone of the cache DB and discards the result.
/// Use for view functions (read calls) that shouldn't bump nonces or
/// burn gas from the caller's POV.
///
/// `from` is optional — defaults to the zero address (anvil's
/// behaviour for unsigned reads). Any address works since the call
/// doesn't need a real signature.
#[tauri::command]
pub fn evm_call(
    state: State<'_, SharedEvm>,
    to: String,
    data_hex: String,
    from: Option<String>,
) -> Result<String, String> {
    let to_addr = Address::from_str(&to)
        .map_err(|e| format!("invalid to address {to:?}: {e}"))?;
    let data = decode_hex_data(&data_hex)?;
    let caller = from
        .as_deref()
        .map(Address::from_str)
        .transpose()
        .map_err(|e| format!("invalid from address: {e}"))?
        .unwrap_or_default();

    let mut guard = state.lock();
    let mut evm = Context::mainnet()
        .with_db(&mut guard.db)
        .build_mainnet();
    let tx = TxEnv {
        caller,
        kind: TxKind::Call(to_addr),
        value: U256::ZERO,
        data: Bytes::from(data),
        gas_limit: 30_000_000,
        gas_price: 0,
        ..Default::default()
    };
    // `transact` (not `transact_commit`) executes without applying
    // state. Returns ResultAndState — we drop the state, keep the
    // result.
    let result = evm
        .transact(tx)
        .map_err(|e| format!("evm call failed: {e:?}"))?;

    match result.result {
        ExecutionResult::Success { output, .. } => {
            let bytes = match output {
                Output::Call(b) => b.to_vec(),
                Output::Create(b, _) => b.to_vec(),
            };
            Ok(format!("0x{}", hex::encode(&bytes)))
        }
        ExecutionResult::Revert { output, .. } => {
            // Revert data is the encoded revert reason — surface
            // it back to the caller so viem can decode the
            // selector + args.
            Err(format!("execution reverted: 0x{}", hex::encode(output.as_ref())))
        }
        ExecutionResult::Halt { reason, .. } => Err(format!("evm halt: {reason:?}")),
    }
}

/// Read deployed bytecode at an address. Returns `"0x"` for
/// addresses that aren't contracts (matches `eth_getCode`'s
/// convention).
#[tauri::command]
pub fn evm_get_code(state: State<'_, SharedEvm>, address: String) -> Result<String, String> {
    let addr = Address::from_str(&address)
        .map_err(|e| format!("invalid address {address:?}: {e}"))?;
    let mut guard = state.lock();
    let info = guard
        .db
        .load_account(addr)
        .map_err(|e| format!("load_account failed: {e:?}"))?;
    let code = info.info.code.clone().unwrap_or_default();
    Ok(format!("0x{}", hex::encode(code.bytes_slice())))
}

// ── Phase 5d.3: block ops ────────────────────────────────────────

/// Mine `blocks` empty blocks. Each block bumps `block_number` by 1
/// and `block_timestamp` by 12 seconds (post-merge slot interval),
/// PLUS any pending `evm_warp` delta which is flushed on the first
/// mined block of the call.
///
/// Mirrors anvil's `evm_mine` / hardhat's `hardhat_mine`. Lessons
/// that test time-locked behaviour mine + warp explicitly between
/// txs.
#[tauri::command]
pub fn evm_mine(
    app: AppHandle,
    state: State<'_, SharedEvm>,
    blocks: Option<u64>,
) -> Result<EvmSnapshot, String> {
    let n = blocks.unwrap_or(1);
    if n == 0 {
        // No-op; returning the current snapshot keeps the API
        // contract clean (caller always gets a snapshot back).
        return Ok(state.lock().snapshot.clone());
    }

    let mut guard = state.lock();
    let pending_warp = guard.pending_warp_seconds;
    guard.pending_warp_seconds = 0;
    // First block consumes the pending warp; subsequent blocks add
    // the standard 12s slot interval.
    guard.block_timestamp = guard.block_timestamp.saturating_add(pending_warp);
    guard.block_timestamp = guard.block_timestamp.saturating_add(12 * n);
    guard.block_number = guard.block_number.saturating_add(n);

    guard.snapshot.block_number = guard.block_number.to_string();
    guard.snapshot.block_timestamp = guard.block_timestamp.to_string();
    guard.snapshot.bump_revision();

    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    Ok(snap)
}

/// Bump the timestamp delta that the next mined block will apply.
/// Idempotent across calls until the next `evm_mine` — multiple
/// warps without a mine accumulate. Mirrors anvil's
/// `evm_setNextBlockTimestamp` accumulation behaviour.
#[tauri::command]
pub fn evm_warp(
    app: AppHandle,
    state: State<'_, SharedEvm>,
    seconds: String,
) -> Result<EvmSnapshot, String> {
    let delta: u64 = seconds
        .parse()
        .map_err(|e| format!("invalid seconds {seconds:?}: {e}"))?;

    let mut guard = state.lock();
    guard.pending_warp_seconds = guard.pending_warp_seconds.saturating_add(delta);
    // We don't bump revision here — pending warp is invisible until
    // a block is mined.
    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    Ok(snap)
}

/// Read the current block number. Cheap read — no lock contention
/// concerns since it's a single u64 load.
#[tauri::command]
pub fn evm_block_number(state: State<'_, SharedEvm>) -> String {
    state.lock().block_number.to_string()
}

/// Read the current block timestamp (does NOT include pending warp).
#[tauri::command]
pub fn evm_block_timestamp(state: State<'_, SharedEvm>) -> String {
    state.lock().block_timestamp.to_string()
}

/// Take a snapshot of the chain state. Returns an opaque ID that
/// `evm_revert` can later restore to. Snapshots are stored in
/// insertion order — `evm_revert(id)` invalidates all snapshots
/// taken AFTER the reverted-to point (anvil/hardhat semantics).
///
/// Storage cost: ~10-50KB per snapshot. We don't enforce a cap;
/// lessons that take many snapshots without reverting can blow
/// memory but that's a lesson-author concern.
#[tauri::command]
pub fn evm_snapshot(state: State<'_, SharedEvm>) -> String {
    use rand::RngCore;
    let mut bytes = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut bytes);
    let id = format!("snap-{}", hex::encode(bytes));

    let mut guard = state.lock();
    let db_clone = guard.db.clone();
    let bn = guard.block_number;
    let bt = guard.block_timestamp;
    guard.snapshots.push_back((id.clone(), db_clone, bn, bt));
    id
}

/// Restore the chain to a previously-snapshotted state. Returns
/// `true` if the snapshot was found and applied; `false` if the
/// id is unknown or already consumed by an earlier revert (anvil
/// semantics — reverting to snapshot N invalidates N+1, N+2, ...).
#[tauri::command]
pub fn evm_revert(
    app: AppHandle,
    state: State<'_, SharedEvm>,
    id: String,
) -> Result<bool, String> {
    let mut guard = state.lock();
    let pos = guard.snapshots.iter().position(|(x, _, _, _)| x == &id);
    let Some(pos) = pos else {
        return Ok(false);
    };

    // Drain everything from `pos` onwards. The found snapshot is the
    // first drained item — pull it for the restore. Following snapshots
    // get dropped (anvil-style invalidation).
    let mut tail: VecDeque<_> = guard.snapshots.drain(pos..).collect();
    let (_id, db, bn, bt) = tail
        .pop_front()
        .expect("position checked just above");
    drop(tail); // explicit drop for clarity — invalidated snapshots

    guard.db = db;
    guard.block_number = bn;
    guard.block_timestamp = bt;
    guard.pending_warp_seconds = 0;
    guard.snapshot.block_number = bn.to_string();
    guard.snapshot.block_timestamp = bt.to_string();
    guard.rebuild_account_state();
    guard.snapshot.bump_revision();

    let snap = guard.snapshot.clone();
    drop(guard);
    emit_snapshot(&app, &snap);
    Ok(true)
}

/// Decode a 0x-prefixed hex string into bytes. Empty `0x` (no payload)
/// is the most common case — value-only transfers carry no data.
fn decode_hex_data(s: &str) -> Result<Vec<u8>, String> {
    let stripped = s.strip_prefix("0x").unwrap_or(s);
    if stripped.is_empty() {
        return Ok(Vec::new());
    }
    hex::decode(stripped).map_err(|e| format!("invalid hex {s:?}: {e}"))
}

// ── Helpers ──────────────────────────────────────────────────────

fn synth_tx_hash(kind: &str) -> String {
    use rand::RngCore;
    let mut bytes = [0u8; 8];
    rand::thread_rng().fill_bytes(&mut bytes);
    let hex: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
    // Pad to a 32-byte (64-hex-char) hash so the wire format matches
    // a real tx hash. Frontend never inspects the bytes; the prefix
    // is purely for human-debug clarity.
    let prefix = format!("{kind:0<8}");
    let prefix_hex: String = prefix.bytes().map(|b| format!("{b:02x}")).collect();
    format!("0x{prefix_hex}{hex}{}", "0".repeat(64 - 16 - 16))
}

fn now_ms() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}
