/// SVM chain service — frontend RPC client for the Rust-side
/// LiteSVM backend.
///
/// **Architecture (Phase 5+)**: every chain mutation goes through a
/// Tauri `invoke()` to a Rust command in `src-tauri/src/chains/svm.rs`.
/// The chain state itself lives in Rust, behind an `Arc<Mutex<SvmState>>`
/// registered as Tauri state. This module's job is to mirror the
/// snapshot in JS for fast read access from the dock + test code,
/// and forward write requests via `invoke()`.
///
/// **Snapshot push**: on first `ensureInitialised()` we register a
/// Tauri event listener for `svm:snapshot`. Every Rust-side mutation
/// emits one of these with the new full snapshot; we replace our
/// local mirror and notify subscribers. Same `useSyncExternalStore`-
/// shaped contract the previous in-webview chainService had — only
/// the event source changed.
///
/// **Wire format**: lamports / slot / unix_timestamp arrive from
/// Rust as decimal strings (JSON can't carry u64 without precision
/// loss). `wireToSnapshot` parses them back to bigint before
/// publishing to subscribers.
///
/// **Desktop-only**: `invoke()` throws in the web build. Callers
/// should gate on the existing `shouldShowSvmDock` helper +
/// `desktopOnlyResult` runtime path before reaching this module.

import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { Address } from "@solana/kit";

// ── Public types ─────────────────────────────────────────────────

export interface AccountSnapshot {
  /// Base58-encoded Solana public key.
  address: Address;
  /// Lamports balance (1 SOL = 1e9 lamports).
  lamports: bigint;
  /// Display label — `signers[0]` is "Default sender".
  label: string;
}

export interface ProgramSnapshot {
  programId: Address;
  name: string;
  deployedAtSlot: bigint;
}

export type TxSnapshotKind = "transfer" | "invoke" | "deploy" | "airdrop";

export interface TxSnapshot {
  signature: string;
  kind: TxSnapshotKind;
  feePayer: Address;
  to?: Address;
  valueLamports: bigint;
  feeLamports: bigint;
  status: "success" | "failed";
  slot: bigint;
  /// Wall-clock time the tx ran on the host. Milliseconds since
  /// the Unix epoch (fits in JS's safe-integer range, kept as
  /// number — only lamport / slot / timestamp_seconds fields use
  /// the bigint string-marshaling pattern).
  timestamp: number;
}

export interface SvmChainSnapshot {
  scope: "singleton" | "ephemeral";
  slot: bigint;
  unixTimestamp: bigint;
  accounts: AccountSnapshot[];
  programs: ProgramSnapshot[];
  txs: TxSnapshot[];
  revision: number;
}

export interface SvmChainServiceListener {
  (snap: SvmChainSnapshot): void;
}

// ── Wire types (what Rust sends over invoke + events) ────────────

interface WireAccountSnapshot {
  address: string;
  lamports: string;
  label: string;
}

interface WireProgramSnapshot {
  programId: string;
  name: string;
  deployedAtSlot: string;
}

interface WireTxSnapshot {
  signature: string;
  kind: TxSnapshotKind;
  feePayer: string;
  to: string | null;
  valueLamports: string;
  feeLamports: string;
  status: "success" | "failed";
  slot: string;
  timestampMs: number;
}

interface WireSvmSnapshot {
  scope: string;
  slot: string;
  unixTimestamp: string;
  accounts: WireAccountSnapshot[];
  programs: WireProgramSnapshot[];
  txs: WireTxSnapshot[];
  revision: number;
}

function wireToSnapshot(w: WireSvmSnapshot): SvmChainSnapshot {
  return {
    scope: w.scope === "ephemeral" ? "ephemeral" : "singleton",
    slot: BigInt(w.slot),
    unixTimestamp: BigInt(w.unixTimestamp),
    accounts: w.accounts.map((a) => ({
      address: a.address as Address,
      lamports: BigInt(a.lamports),
      label: a.label,
    })),
    programs: w.programs.map((p) => ({
      programId: p.programId as Address,
      name: p.name,
      deployedAtSlot: BigInt(p.deployedAtSlot),
    })),
    txs: w.txs.map((t) => ({
      signature: t.signature,
      kind: t.kind,
      feePayer: t.feePayer as Address,
      to: t.to ? (t.to as Address) : undefined,
      valueLamports: BigInt(t.valueLamports),
      feeLamports: BigInt(t.feeLamports),
      status: t.status,
      slot: BigInt(t.slot),
      timestamp: t.timestampMs,
    })),
    revision: w.revision,
  };
}

// ── Internal state ───────────────────────────────────────────────

const AIRDROP_AMOUNT_LAMPORTS = 100n * 1_000_000_000n; // +100 SOL
const AIRDROP_COOLDOWN_MS = 5 * 60 * 1000;
const AIRDROP_KEY_PREFIX = "libre:svm-airdrop:";

let currentSnapshot: SvmChainSnapshot = emptySnapshot();
const listeners = new Set<SvmChainServiceListener>();
let initPromise: Promise<void> | null = null;
// We hold the unlisten handle to be polite — in practice we never
// call it (the chain service is a singleton for the lifetime of the
// app session). Kept assigned + referenced so the TS unused-var
// check passes and so a future "re-init on logout" path has the hook.
let unlistenSnapshot: UnlistenFn | null = null;
export function _disposeSnapshotListener(): void {
  if (unlistenSnapshot) {
    unlistenSnapshot();
    unlistenSnapshot = null;
  }
}

function emptySnapshot(): SvmChainSnapshot {
  return {
    scope: "singleton",
    slot: 0n,
    unixTimestamp: 0n,
    accounts: [],
    programs: [],
    txs: [],
    revision: 0,
  };
}

function notify(): void {
  for (const l of listeners) {
    try {
      l(currentSnapshot);
    } catch {
      /* one listener throwing must not break the rest */
    }
  }
}

/// Apply a fresh wire-snapshot from Rust. Updates local mirror +
/// fires every subscriber. Used by THREE sources:
///   1. Initial bootstrap (`svm_init` round-trip)
///   2. The Tauri event listener (push from any Rust mutation)
///   3. The invoke-wrappers below (eager adoption of the snapshot
///      the mutation command returns, so callers don't have to
///      wait for the asynchronously-delivered event before
///      `svmBalance()` reads see the new state)
///
/// Revision-debounced: skip the notify when the incoming snapshot's
/// revision is ≤ the current one. Prevents the duplicate dock
/// re-render every mutation would otherwise trigger (eager-adopt
/// from the invoke caller + push event arriving moments later with
/// the same payload).
function adoptSnapshot(wire: WireSvmSnapshot): void {
  if (wire.revision <= currentSnapshot.revision && currentSnapshot.revision > 0) {
    // Already seen this (or a newer) snapshot — no-op.
    return;
  }
  currentSnapshot = wireToSnapshot(wire);
  notify();
}

/// One-time bootstrap: fetch the initial snapshot via `svm_init`
/// and register a listener for `svm:snapshot` push events. Memoised
/// — repeat callers share the same in-flight promise. Idempotent
/// once resolved.
export async function ensureInitialised(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const wire = await invoke<WireSvmSnapshot>("svm_init");
      adoptSnapshot(wire);
      // Listen for push updates from any Rust-side mutation. We never
      // unlisten — the chain service is a singleton for the lifetime
      // of the app session.
      unlistenSnapshot = await listen<WireSvmSnapshot>(
        "svm:snapshot",
        (event) => adoptSnapshot(event.payload),
      );
    } catch (e) {
      // Reset the promise so the next caller can retry. Otherwise
      // a transient failure (e.g. Tauri not yet ready during HMR)
      // would permanently freeze the dock.
      initPromise = null;
      throw e;
    }
  })();
  return initPromise;
}

// ── Subscribe + read API ─────────────────────────────────────────

export function subscribe(l: SvmChainServiceListener): () => void {
  listeners.add(l);
  // Fire current state right away so the new subscriber gets a value
  // without waiting for the next mutation event. Mirrors the
  // useSyncExternalStore contract.
  try {
    l(currentSnapshot);
  } catch {
    /* swallow — see notify() */
  }
  // Lazy bootstrap: subscribing implicitly initialises. If a
  // component mounts the dock before any other code touches the
  // service, this is what kicks Rust off.
  void ensureInitialised().catch((e) => {
    console.warn("[svm] ensureInitialised failed:", e);
  });
  return () => {
    listeners.delete(l);
  };
}

export function getSnapshot(): SvmChainSnapshot {
  return currentSnapshot;
}

/// Helper: does the current snapshot reflect any non-bootstrap
/// activity? Used by potential "should we offer to reopen the
/// popout?" UX. Not used as a sticky activation signal (we learned
/// from the EVM/BTC dock fixes — that pattern bleeds the dock into
/// unrelated lessons).
export function svmChainHasActivity(snap: SvmChainSnapshot): boolean {
  if (snap.txs.length > 0) return true;
  if (snap.programs.length > 0) return true;
  if (snap.slot > 0n) return true;
  return false;
}

// ── Faucet (cooldown-rate-limited airdrop) ───────────────────────

export function airdropCooldownRemainingMs(address: Address): number {
  if (typeof localStorage === "undefined") return 0;
  const lastStr = localStorage.getItem(AIRDROP_KEY_PREFIX + address);
  if (!lastStr) return 0;
  const last = parseInt(lastStr, 10);
  if (!Number.isFinite(last)) return 0;
  const remaining = AIRDROP_COOLDOWN_MS - (Date.now() - last);
  return remaining > 0 ? remaining : 0;
}

/// Credit `AIRDROP_AMOUNT` lamports to the target address via
/// `svm_airdrop`. Cooldown-gated per-address (5 min default) so a
/// learner can't spam-click the dock button. Throws on cooldown
/// violation so the caller can show "wait Ns" feedback.
export async function requestAirdrop(address: Address): Promise<void> {
  const wait = airdropCooldownRemainingMs(address);
  if (wait > 0) {
    throw new Error(
      `Airdrop on cooldown — try again in ${Math.ceil(wait / 1000)}s`,
    );
  }
  await ensureInitialised();
  // Eager-adopt the returned snapshot so the dock + any local
  // reads see the new state immediately, without waiting for the
  // async event delivery. The event will arrive shortly with the
  // same revision and adoptSnapshot's debounce skips the duplicate.
  const wire = await invoke<WireSvmSnapshot>("svm_airdrop", {
    address,
    lamports: AIRDROP_AMOUNT_LAMPORTS.toString(),
  });
  adoptSnapshot(wire);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(AIRDROP_KEY_PREFIX + address, String(Date.now()));
    } catch {
      /* private mode / quota — best effort */
    }
  }
}

// ── Misc dock-facing actions ─────────────────────────────────────

/// Drop the chain's state + rebuild a fresh one. Wired to the dock's
/// "Reset" button. Synchronous result + push event handle the dock
/// refresh.
export async function resetSvmChain(): Promise<void> {
  await ensureInitialised();
  // svm_reset rebuilds the chain from scratch — revision starts back
  // at 1 (well, 0 then bumped to 1). adoptSnapshot's debounce sees
  // the lower revision and would skip; we work around by clearing
  // currentSnapshot to the empty baseline first so the new revision-1
  // snapshot still publishes.
  currentSnapshot = emptySnapshot();
  const wire = await invoke<WireSvmSnapshot>("svm_reset");
  adoptSnapshot(wire);
}

// ── Lesson-runtime-facing primitives ─────────────────────────────
//
// Used by `runtimes/solana.ts` to build the `svm` global the test
// sandbox sees. Kept in this module rather than the runtime file so
// there's exactly one Tauri-invoke surface for SVM operations.

export interface TransferResult {
  signature: string;
  feeLamports: bigint;
}

export async function svmTransfer(
  fromAddress: Address,
  toAddress: Address,
  lamports: bigint,
): Promise<TransferResult> {
  await ensureInitialised();
  const wire = await invoke<WireSvmSnapshot>("svm_transfer", {
    fromAddress,
    toAddress,
    lamports: lamports.toString(),
  });
  adoptSnapshot(wire);
  // The most-recent tx is the one we just sent. Pull it out for the
  // signature + actual fee so test code can assert on them.
  const tx = currentSnapshot.txs[0];
  return {
    signature: tx?.signature ?? "",
    feeLamports: tx?.feeLamports ?? 0n,
  };
}

export async function svmAirdrop(
  address: Address,
  lamports: bigint,
): Promise<void> {
  await ensureInitialised();
  const wire = await invoke<WireSvmSnapshot>("svm_airdrop", {
    address,
    lamports: lamports.toString(),
  });
  adoptSnapshot(wire);
}

export async function svmWarpSlot(slots: bigint): Promise<void> {
  await ensureInitialised();
  const wire = await invoke<WireSvmSnapshot>("svm_warp_slot", {
    slots: slots.toString(),
  });
  adoptSnapshot(wire);
}

export async function svmWarpTime(seconds: bigint): Promise<void> {
  await ensureInitialised();
  const wire = await invoke<WireSvmSnapshot>("svm_warp_time", {
    seconds: seconds.toString(),
  });
  adoptSnapshot(wire);
}

// ── Phase 5b+: arbitrary instructions + program deploy ──────────

/// Wire-format account meta for `svmSendTx`. Mirrors kit's
/// `AccountMeta` — `role` is a bitmask: bit 0 = writable, bit 1 = signer.
export interface SvmAccountMetaWire {
  address: Address;
  role: number;
}

/// Wire-format instruction. Build with kit's
/// `getTransferSolInstruction` (or any other kit instruction
/// builder), then pass the components in here.
export interface SvmInstructionWire {
  programAddress: Address;
  accounts: SvmAccountMetaWire[];
  /// Hex-encoded data (with or without `0x` prefix).
  dataHex: string;
}

export interface SvmSendTxResult {
  signature: string;
  status: "success" | "failed";
  logs: string[];
  feeLamports: bigint;
  /// Hex-encoded return data, if the last invoked program set any.
  returnDataHex: string | null;
}

interface WireSvmSendTxResult {
  signature: string;
  status: "success" | "failed";
  logs: string[];
  feeLamports: string;
  returnDataHex: string | null;
  snapshot: WireSvmSnapshot;
}

/// Send an arbitrary list of instructions through the Rust-side
/// litesvm. The fee payer + any signer accounts named in the
/// instructions MUST be one of the 10 pre-funded signers — Rust
/// resolves the keypair internally.
export async function svmSendTx(
  instructions: SvmInstructionWire[],
  feePayerAddress: Address,
): Promise<SvmSendTxResult> {
  await ensureInitialised();
  const wire = await invoke<WireSvmSendTxResult>("svm_send_tx", {
    instructions,
    feePayerAddress,
  });
  adoptSnapshot(wire.snapshot);
  return {
    signature: wire.signature,
    status: wire.status,
    logs: wire.logs,
    feeLamports: BigInt(wire.feeLamports),
    returnDataHex: wire.returnDataHex,
  };
}

/// Deploy a BPF program from raw .so bytes. `programIdAddress` is a
/// learner-controlled pubkey (typically a fresh keypair's address);
/// `programName` is the lesson-supplied label that appears in the
/// dock's Programs panel; `soBytes` is the raw .so file contents.
export async function svmDeployProgram(
  programIdAddress: Address,
  programName: string,
  soBytes: Uint8Array,
): Promise<void> {
  await ensureInitialised();
  // Hex-encode for the wire. Tauri's invoke serialises through JSON
  // which can't carry raw bytes — string is the lingua franca.
  const soBytesHex = `0x${Array.from(soBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
  const wire = await invoke<WireSvmSnapshot>("svm_deploy_program", {
    programIdAddress,
    programName,
    soBytesHex,
  });
  adoptSnapshot(wire);
}

// ── Phase 5f: bundled BPF toolchain status + build ──────────────

export interface SvmToolchainStatus {
  /// True iff `cargo-build-sbf` exists at the expected resources path.
  installed: boolean;
  /// Filesystem path the bundle was looked up at.
  expectedPath: string;
  /// `solana --version` output. Empty when not installed.
  version: string;
}

/// Check whether the bundled Solana CLI is available. Used by the
/// diagnostics page + the lesson runtime to gate "this lesson
/// requires the toolchain" upsell banners.
export async function svmToolchainStatus(): Promise<SvmToolchainStatus> {
  return await invoke<SvmToolchainStatus>("svm_toolchain_status");
}

export interface SvmBuildResult {
  success: boolean;
  stdout: string;
  stderr: string;
  /// Absolute paths to the .so files the build produced.
  soPaths: string[];
  durationMs: number;
}

/// Compile a Rust BPF program. `projectPath` must point at a
/// directory with a `Cargo.toml` set up for the SBF target.
/// Returns build output + paths to .so files for subsequent
/// `svmDeployProgram` calls.
export async function svmBuildBpf(projectPath: string): Promise<SvmBuildResult> {
  return await invoke<SvmBuildResult>("svm_build_bpf", { projectPath });
}

/// Synchronous balance read — pulled from the local snapshot mirror.
/// For an account that exists in the snapshot, this is the truth as
/// of the most recent push event. For an arbitrary address (e.g. a
/// fresh keypair the test code generated), call `svmBalanceFresh`
/// for a round-trip to Rust.
export function svmBalance(address: Address): bigint {
  return currentSnapshot.accounts.find((a) => a.address === address)?.lamports
    ?? 0n;
}

/// Round-trip Rust call for a balance read. Use when the address
/// might not be in the snapshot's tracked accounts (snapshot only
/// surfaces the 10 pre-funded signers + any new ones the test
/// explicitly adds).
export async function svmBalanceFresh(address: Address): Promise<bigint> {
  await ensureInitialised();
  const lamports = await invoke<string>("svm_balance", { address });
  return BigInt(lamports);
}

// ── Formatting helpers ───────────────────────────────────────────

/// Format lamports as a human-friendly SOL string. 9 decimal places
/// (Solana's full precision); trim trailing zeros for compactness.
export function formatSol(lamports: bigint): string {
  const sign = lamports < 0n ? "-" : "";
  const abs = lamports < 0n ? -lamports : lamports;
  const whole = abs / 1_000_000_000n;
  const frac = abs % 1_000_000_000n;
  if (frac === 0n) return `${sign}${whole.toString()}`;
  const fracStr = frac.toString().padStart(9, "0").replace(/0+$/, "");
  return `${sign}${whole.toString()}.${fracStr}`;
}

/// Compact base58 address — first 4 + last 4 chars with an ellipsis.
/// Same shape `shortAddr` uses for EVM hex.
export function shortAddr(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export const AIRDROP_COOLDOWN = AIRDROP_COOLDOWN_MS;
export const AIRDROP_AMOUNT = AIRDROP_AMOUNT_LAMPORTS;
