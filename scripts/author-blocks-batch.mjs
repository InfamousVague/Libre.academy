#!/usr/bin/env node
/// Helper for `apply-blocks.mjs` — turns a JS array of authored
/// payloads into per-lesson JSON files under `.blocks-manual/`. The
/// indirection exists so the human authoring source can use ordinary
/// JS template literals (where `\\` is one backslash, `\n` is a
/// newline, and quoting is sane) instead of hand-escaped JSON. Run
/// it after editing the BATCHES table below.
///
/// Usage:
///   node scripts/author-blocks-batch.mjs           # write everything
///   node scripts/author-blocks-batch.mjs --course X # one course's slice
///
/// After this writes the manual files, run
/// `node scripts/apply-blocks.mjs --course X` to validate (round-trip
/// check) + cache + patch the lesson.

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MANUAL = join(ROOT, ".blocks-manual");
const STAGED = join(ROOT, "public", "starter-courses");

/// Cache of parsed course JSON, keyed by course id, for the
/// `splice()` helper below. Loading 17 multi-MB JSON files for each
/// lesson would burn IO; one read per course is plenty.
const COURSE_CACHE = new Map();
async function loadCourse(courseId) {
  if (COURSE_CACHE.has(courseId)) return COURSE_CACHE.get(courseId);
  const text = await readFile(join(STAGED, `${courseId}.json`), "utf-8");
  const c = JSON.parse(text);
  COURSE_CACHE.set(courseId, c);
  return c;
}

async function getSolution(courseId, lessonId) {
  const c = await loadCourse(courseId);
  for (const ch of c.chapters ?? []) {
    for (const l of ch.lessons ?? []) {
      if (l.id === lessonId) return l.solution;
    }
  }
  throw new Error(`lesson not found: ${courseId}/${lessonId}`);
}

/// Build a payload by starting from the canonical solution and
/// punching `[[SLOT <name>]]` markers in place of the target
/// substrings. Each replacement is `{ target, name, hint, decoys }`;
/// `target` is the verbatim substring to remove from the solution
/// (and also doubles as the slot's `answer`, so we get round-trip
/// correctness by construction). Replacing only the FIRST occurrence
/// keeps each marker's home unambiguous — multi-occurrence is
/// supported by the renderer but easier to reason about one-to-one.
///
/// Throws if a target isn't in the solution. Intentional: catches
/// drift between author intent and the live solution at write time,
/// instead of silently writing a manual file whose round-trip would
/// later fail.
export async function splice(courseId, lessonId, replacements, prompt) {
  let template = await getSolution(courseId, lessonId);
  const slots = [];
  for (const r of replacements) {
    const { target, name, hint, decoys } = r;
    const idx = template.indexOf(target);
    if (idx < 0) {
      throw new Error(
        `[${courseId}/${lessonId}] target not found in solution: ${JSON.stringify(target.slice(0, 80))}`,
      );
    }
    template =
      template.slice(0, idx) +
      `[[SLOT ${name}]]` +
      template.slice(idx + target.length);
    slots.push({ name, answer: target, hint, decoys });
  }
  return { template, slots, prompt };
}

/// Per-batch authored payloads. Each entry is the RAW model-shape
/// payload — `{ template, slots: [{ name, answer, hint, decoys }],
/// prompt? }` — exactly what the Anthropic round-trip would have
/// returned. The downstream `apply-blocks.mjs` script runs the same
/// `postProcess` on this that the original `generate-blocks.mjs`
/// would, so authoring mistakes (drifted indentation, missing slot,
/// etc.) are caught on apply, not silently shipped.
///
/// Convention: use template literals (backticks) for the `template`
/// field, since solutions span multiple lines. Within a backtick
/// literal:
///   - `\\` is ONE backslash (use `\\\\` if you need two literal
///     backslashes in the output)
///   - `\n` is a newline (use it freely)
///   - backticks themselves need `\``
///
/// Sanity check while authoring: the assembled template (with each
/// `[[SLOT name]]` replaced by its answer) must equal the lesson's
/// `solution` modulo trailing-whitespace differences. apply-blocks
/// will reject mismatches with a line-number diff.
const BATCHES = {
  // ── mastering-ethereum ──────────────────────────────────────────
  "mastering-ethereum": {
    "ch04-smart-contracts-evm-require-with-custom-message": splice("mastering-ethereum", "ch04-smart-contracts-evm-require-with-custom-message", [
      { target: `_minimumAge > 0`, name: "init_pos", hint: "predicate", decoys: [`_minimumAge >= 0`, `_minimumAge != 0`, `_minimumAge < 100`] },
      { target: `age >= minimumAge`, name: "age_check", hint: "predicate", decoys: [`age > minimumAge`, `age == minimumAge`, `minimumAge >= age`] },
      { target: `"Too young"`, name: "young_msg", hint: "literal", decoys: [`"Underage"`, `"Invalid age"`, `"Min age failed"`] },
    ], "Pick the constructor positivity check, the age guard, and the error message."),

    "ch04-smart-contracts-evm-payable-function-gates-on-minimum-value": splice("mastering-ethereum", "ch04-smart-contracts-evm-payable-function-gates-on-minimum-value", [
      { target: `0.01 ether`, name: "min_donation", hint: "literal", decoys: [`0.001 ether`, `1 ether`, `0.01 wei`] },
      { target: `msg.value < minimumDonation`, name: "underfunded", hint: "predicate", decoys: [`msg.value <= minimumDonation`, `msg.value > minimumDonation`, `minimumDonation > msg.value`] },
      { target: `revert DonationTooSmall();`, name: "small_revert", hint: "revert", decoys: [`revert("Too small");`, `require(false);`, `throw DonationTooSmall();`] },
      { target: `address(this).balance`, name: "self_balance", hint: "balance", decoys: [`address(this).value`, `this.balance`, `msg.value`] },
    ], "Pick the minimum donation, the underfunded check, the custom-error revert, and the contract balance."),

    "ch08-smart-contracts-and-vyper-vyper-erc-20-minimal-port": splice("mastering-ethereum", "ch08-smart-contracts-and-vyper-vyper-erc-20-minimal-port", [
      { target: `decimals = 18`, name: "decimals_init", hint: "literal", decoys: [`decimals = 6`, `decimals = 8`, `decimals = 0`] },
      { target: `to == address(0)`, name: "zero_check", hint: "predicate", decoys: [`to != address(0)`, `to == msg.sender`, `to == 0`] },
      { target: `balanceOf[msg.sender] < amount`, name: "bal_check", hint: "predicate", decoys: [`balanceOf[msg.sender] <= amount`, `balanceOf[to] < amount`, `amount > balanceOf[msg.sender]`] },
      { target: `emit Transfer(msg.sender, to, amount);`, name: "transfer_event", hint: "event", decoys: [`emit Transfer(to, msg.sender, amount);`, `emit Transfer(amount, msg.sender, to);`, `Transfer(msg.sender, to, amount);`] },
    ], "Pick the decimals, zero-address check, balance check, and Transfer emit."),

    "ch04-smart-contracts-evm-withdraw-pattern-with-pull-model": splice("mastering-ethereum", "ch04-smart-contracts-evm-withdraw-pattern-with-pull-model", [
      { target: `balances[msg.sender] += msg.value;`, name: "deposit_inc", hint: "deposit", decoys: [`balances[msg.sender] = msg.value;`, `balances[to] += msg.value;`, `balances[msg.sender] -= msg.value;`] },
      { target: `balances[msg.sender] < amount`, name: "withdraw_check", hint: "predicate", decoys: [`balances[msg.sender] <= amount`, `balances[msg.sender] > amount`, `amount > balances[to]`] },
      { target: `(bool success, ) = msg.sender.call{value: amount}("");`, name: "send_call", hint: "low-level", decoys: [`msg.sender.transfer(amount);`, `(bool success, ) = address(this).call{value: amount}("");`, `payable(msg.sender).send(amount);`] },
    ], "Pick the deposit increment, the balance check, and the low-level send."),

    "ch09-smart-contract-security-dos-via-unbounded-loop-gas-grief-fix": splice("mastering-ethereum", "ch09-smart-contract-security-dos-via-unbounded-loop-gas-grief-fix", [
      { target: `count > len ? len : count`, name: "bounded_count", hint: "ternary", decoys: [`len`, `count`, `count < len ? len : count`] },
      { target: `whitelist.pop();`, name: "pop_call", hint: "array", decoys: [`whitelist.length--;`, `whitelist[i] = address(0);`, `delete whitelist[i];`] },
      { target: `if (msg.sender != owner) revert Unauthorized();`, name: "owner_guard", hint: "modifier", decoys: [`if (msg.sender == owner) revert Unauthorized();`, `require(msg.sender == owner);`, `if (tx.origin != owner) revert Unauthorized();`] },
    ], "Pick the bounded toRemove, the pop call, and the owner guard."),

    "ch09-smart-contract-security-integer-overflow-check-pre-0-8-safemath-replay": splice("mastering-ethereum", "ch09-smart-contract-security-integer-overflow-check-pre-0-8-safemath-replay", [
      { target: `unchecked { c = a + b; }`, name: "unchecked_add", hint: "block", decoys: [`c = a + b;`, `unchecked { c = a - b; }`, `c = unchecked(a + b);`] },
      { target: `require(c >= a, "overflow");`, name: "overflow_check", hint: "guard", decoys: [`require(c > a, "overflow");`, `require(c <= a, "overflow");`, `assert(c >= a);`] },
    ], "Pick the unchecked add and the SafeMath-style overflow guard."),

    "ch09-smart-contract-security-tx-origin-vs-msg-sender-phishing-trap-fix": splice("mastering-ethereum", "ch09-smart-contract-security-tx-origin-vs-msg-sender-phishing-trap-fix", [
      { target: `tx.origin == owner`, name: "vuln_check", hint: "vulnerable", decoys: [`tx.origin != owner`, `msg.sender == owner`, `tx.origin == tx.sender`] },
      { target: `if (msg.sender != owner) revert Unauthorized();`, name: "secure_check", hint: "secure", decoys: [`if (tx.origin != owner) revert Unauthorized();`, `if (msg.sender == owner) revert Unauthorized();`, `require(tx.origin == owner);`] },
    ], "Pick the vulnerable tx.origin check and the secure msg.sender guard."),

    "ch04-smart-contracts-evm-erc-20-approve-transferfrom-flow": splice("mastering-ethereum", "ch04-smart-contracts-evm-erc-20-approve-transferfrom-flow", [
      { target: `allowance[msg.sender][spender] = amount;`, name: "approve_set", hint: "approve", decoys: [`allowance[spender][msg.sender] = amount;`, `allowance[msg.sender][spender] += amount;`, `_allowance[msg.sender][spender] = amount;`] },
      { target: `allowance[from][msg.sender] < amount`, name: "allow_check", hint: "predicate", decoys: [`allowance[from][to] < amount`, `allowance[msg.sender][from] < amount`, `allowance[from][msg.sender] <= amount`] },
      { target: `allowance[from][msg.sender] -= amount;`, name: "allow_dec", hint: "decrement", decoys: [`allowance[from][msg.sender] = 0;`, `allowance[msg.sender][from] -= amount;`, `_allowance[from][msg.sender] -= amount;`] },
      { target: `balanceOf[from] -= amount;`, name: "from_dec", hint: "decrement", decoys: [`balanceOf[msg.sender] -= amount;`, `balanceOf[to] -= amount;`, `balanceOf[from] = 0;`] },
    ], "Wire up approve, the allowance check, allowance decrement, and balance decrement."),

    "ch04-smart-contracts-evm-erc-20-burn-from-caller": splice("mastering-ethereum", "ch04-smart-contracts-evm-erc-20-burn-from-caller", [
      { target: `from != msg.sender`, name: "not_self", hint: "predicate", decoys: [`from == msg.sender`, `msg.sender != owner`, `from != address(0)`] },
      { target: `allowance[from][msg.sender] < amount`, name: "allow_check", hint: "predicate", decoys: [`allowance[msg.sender][from] < amount`, `allowance[from][msg.sender] <= amount`, `allowance[from][to] < amount`] },
      { target: `balanceOf[from] -= amount;`, name: "burn_dec", hint: "decrement", decoys: [`balanceOf[msg.sender] -= amount;`, `totalSupply -= amount;`, `balanceOf[from] = 0;`] },
    ], "Pick the self-burn check, allowance check, and the balance decrement."),

    "ch04-smart-contracts-evm-erc-20-mint-transfer-balanceof": splice("mastering-ethereum", "ch04-smart-contracts-evm-erc-20-mint-transfer-balanceof", [
      { target: `balanceOf[to] += amount;`, name: "mint_inc", hint: "balance", decoys: [`balanceOf[msg.sender] += amount;`, `balanceOf[to] = amount;`, `_balances[to] += amount;`] },
      { target: `totalSupply += amount;`, name: "supply_inc", hint: "supply", decoys: [`totalSupply = amount;`, `_totalSupply += amount;`, `totalSupply -= amount;`] },
      { target: `emit Transfer(address(0), to, amount);`, name: "mint_event", hint: "event", decoys: [`emit Transfer(to, address(0), amount);`, `emit Mint(to, amount);`, `Transfer(address(0), to, amount);`] },
    ], "Pick the balance bump, supply bump, and the mint Transfer event."),

    "ch04-smart-contracts-evm-erc-721-approve-getapproved": splice("mastering-ethereum", "ch04-smart-contracts-evm-erc-721-approve-getapproved", [
      { target: `_tokenApprovals[tokenId] = approved;`, name: "set_approval", hint: "set", decoys: [`_tokenApprovals[approved] = tokenId;`, `_owners[tokenId] = approved;`, `tokenApprovals[tokenId] = approved;`] },
      { target: `ownerOf[tokenId] == address(0)`, name: "exists_check", hint: "predicate", decoys: [`ownerOf[tokenId] != address(0)`, `tokenId == 0`, `_owners[tokenId] == address(0)`] },
      { target: `emit Approval(owner, approved, tokenId);`, name: "approval_event", hint: "event", decoys: [`emit Approval(approved, owner, tokenId);`, `emit Approval(msg.sender, approved, tokenId);`, `Approval(owner, approved, tokenId);`] },
    ], "Pick the approval setter, the existence check, and the Approval event."),

    "ch04-smart-contracts-evm-erc-721-mint-ownerof-transferfrom": splice("mastering-ethereum", "ch04-smart-contracts-evm-erc-721-mint-ownerof-transferfrom", [
      { target: `_nextTokenId++`, name: "id_inc", hint: "post-inc", decoys: [`++_nextTokenId`, `_nextTokenId += 1`, `_nextTokenId`] },
      { target: `owner == address(0)`, name: "exists_check", hint: "predicate", decoys: [`owner != address(0)`, `tokenId == 0`, `_owners[tokenId] == 0`] },
      { target: `msg.sender != from`, name: "auth_check", hint: "predicate", decoys: [`msg.sender == from`, `from != owner`, `msg.sender != to`] },
    ], "Pick the post-increment, the existence check, and the from-vs-sender auth."),

    "ch04-smart-contracts-evm-eip-712-permit-off-chain-sig-on-chain-consume": splice("mastering-ethereum", "ch04-smart-contracts-evm-eip-712-permit-off-chain-sig-on-chain-consume", [
      { target: `block.timestamp <= deadline`, name: "deadline_check", hint: "predicate", decoys: [`block.timestamp >= deadline`, `block.number <= deadline`, `deadline <= block.timestamp`] },
      { target: `ecrecover(digest, v, r, s)`, name: "recover_call", hint: "ecdsa", decoys: [`ecrecover(digest, r, s, v)`, `ecdsa(digest, v, r, s)`, `keccak256(digest, v, r, s)`] },
      { target: `signer == owner && signer != address(0)`, name: "sig_check", hint: "predicate", decoys: [`signer == owner`, `signer != address(0)`, `owner == address(0)`] },
      { target: `nonces[owner]++;`, name: "nonce_inc", hint: "replay", decoys: [`nonces[spender]++;`, `nonces[owner] = 0;`, `nonces[owner] += value;`] },
    ], "Pick the deadline check, ecrecover, signer check, and nonce increment."),

    "ch04-smart-contracts-evm-erc-1155-batch-balance-batch-transfer": splice("mastering-ethereum", "ch04-smart-contracts-evm-erc-1155-batch-balance-batch-transfer", [
      { target: `accounts.length == ids.length`, name: "len_match", hint: "predicate", decoys: [`accounts.length >= ids.length`, `accounts.length != ids.length`, `ids.length == values.length`] },
      { target: `from == msg.sender`, name: "owner_check", hint: "predicate", decoys: [`from != msg.sender`, `to == msg.sender`, `from == address(0)`] },
      { target: `_balances[from][id] >= amount`, name: "bal_check", hint: "predicate", decoys: [`_balances[from][id] > amount`, `_balances[to][id] >= amount`, `amount >= _balances[from][id]`] },
    ], "Pick the length-match, the owner check, and the balance check."),

    "ch04-smart-contracts-evm-erc-20-with-eip-2612-permit": splice("mastering-ethereum", "ch04-smart-contracts-evm-erc-20-with-eip-2612-permit", [
      { target: `block.timestamp <= deadline`, name: "deadline_check", hint: "predicate", decoys: [`block.timestamp >= deadline`, `block.number <= deadline`, `deadline <= block.timestamp`] },
      { target: `ecrecover(digest, v, r, s)`, name: "recover_call", hint: "ecdsa", decoys: [`ecrecover(digest, r, s, v)`, `ecdsa(digest, v, r, s)`, `keccak256(digest, v, r, s)`] },
      { target: `recovered != address(0) && recovered == owner`, name: "sig_check", hint: "predicate", decoys: [`recovered == owner`, `recovered != address(0)`, `owner == recovered && owner != address(0)`] },
      { target: `nonces[owner]++;`, name: "nonce_inc", hint: "replay", decoys: [`nonces[spender]++;`, `nonces[owner] = 0;`, `nonces[owner] += value;`] },
    ], "Pick the deadline check, ecrecover call, signer guard, and nonce increment."),

    "ch04-smart-contracts-evm-minimal-erc-4626-vault-deposit-redeem": splice("mastering-ethereum", "ch04-smart-contracts-evm-minimal-erc-4626-vault-deposit-redeem", [
      { target: `asset.transferFrom(msg.sender, address(this), assets)`, name: "pull_in", hint: "transferFrom", decoys: [`asset.transfer(address(this), assets)`, `asset.transferFrom(address(this), msg.sender, assets)`, `asset.approve(msg.sender, assets)`] },
      { target: `balanceOf[msg.sender] += shares;`, name: "shares_inc", hint: "balance", decoys: [`balanceOf[msg.sender] = shares;`, `totalSupply += shares;`, `balanceOf[msg.sender] -= shares;`] },
      { target: `balanceOf[msg.sender] >= shares`, name: "share_check", hint: "predicate", decoys: [`balanceOf[msg.sender] > shares`, `totalSupply >= shares`, `shares >= balanceOf[msg.sender]`] },
      { target: `asset.transfer(msg.sender, assets)`, name: "send_out", hint: "transfer", decoys: [`asset.transferFrom(msg.sender, address(this), assets)`, `asset.transfer(address(this), assets)`, `payable(msg.sender).transfer(assets)`] },
    ], "Pick the pull-in, the share increment, the share check, and the redeem transfer."),

    "ch05-erc20-transfer": splice("mastering-ethereum", "ch05-erc20-transfer", [
      { target: `'transfer(address,uint256)'`, name: "fn_sig", hint: "literal", decoys: [`'transfer(address,uint)'`, `'transfer(address)'`, `'transfer(uint256,address)'`] },
      { target: `addr.padStart(64, '0')`, name: "addr_pad", hint: "padding", decoys: [`addr.padEnd(64, '0')`, `addr.padStart(40, '0')`, `addr.padStart(64, ' ')`] },
      { target: `2n ** 256n`, name: "max_amount", hint: "bigint", decoys: [`2 ** 256`, `2n ** 255n`, `BigInt(2 ** 256)`] },
    ], "Pick the function signature, the 32-byte left-pad, and the 2^256 bigint."),

    "ch11-oracles-chainlink-style-price-feed-aggregator-mock": splice("mastering-ethereum", "ch11-oracles-chainlink-style-price-feed-aggregator-mock", [
      { target: `roundId++;`, name: "round_inc", hint: "round", decoys: [`++roundId;`, `roundId = roundId + 1;`, `roundId += newPrice;`] },
      { target: `(roundId, price, block.timestamp, block.timestamp, roundId)`, name: "round_data", hint: "tuple", decoys: [`(roundId, price, 0, 0, roundId)`, `(price, roundId, block.timestamp, block.timestamp, roundId)`, `(roundId, price, block.number, block.number, roundId)`] },
      { target: `return 8;`, name: "decimals_val", hint: "literal", decoys: [`return 18;`, `return 6;`, `return 0;`] },
    ], "Pick the roundId bump, the latestRoundData tuple, and the decimals value."),

    "ch11-oracles-stale-price-rejection-by-timestamp": splice("mastering-ethereum", "ch11-oracles-stale-price-rejection-by-timestamp", [
      { target: `MAX_AGE = 3600`, name: "max_age", hint: "constant", decoys: [`MAX_AGE = 60`, `MAX_AGE = 86400`, `MAX_AGE = 0`] },
      { target: `lastUpdate == 0 || block.timestamp - lastUpdate >= MAX_AGE`, name: "stale_check", hint: "predicate", decoys: [`block.timestamp - lastUpdate >= MAX_AGE`, `lastUpdate == 0`, `block.timestamp >= MAX_AGE`] },
      { target: `lastUpdate = block.timestamp;`, name: "stamp_set", hint: "stamp", decoys: [`lastUpdate = block.number;`, `lastUpdate = newPrice;`, `lastUpdate++;`] },
    ], "Pick the max-age constant, the stale predicate, and the timestamp set."),

    "ch04-smart-contracts-evm-commit-reveal-scheme-for-fair-lottery": splice("mastering-ethereum", "ch04-smart-contracts-evm-commit-reveal-scheme-for-fair-lottery", [
      { target: `block.timestamp < startTime + COMMIT_DURATION`, name: "commit_active", hint: "predicate", decoys: [`block.timestamp >= startTime + COMMIT_DURATION`, `block.timestamp <= startTime + REVEAL_DURATION`, `block.number < startTime + COMMIT_DURATION`] },
      { target: `keccak256(abi.encodePacked(secret, msg.sender))`, name: "commit_hash", hint: "hash", decoys: [`keccak256(abi.encode(secret, msg.sender))`, `keccak256(abi.encodePacked(secret))`, `keccak256(secret)`] },
      { target: `combinedEntropy ^= uint256(keccak256(abi.encodePacked(secret)));`, name: "entropy_xor", hint: "xor", decoys: [`combinedEntropy = uint256(keccak256(abi.encodePacked(secret)));`, `combinedEntropy += uint256(keccak256(abi.encodePacked(secret)));`, `combinedEntropy ^= uint256(secret);`] },
      { target: `combinedEntropy % count`, name: "winner_idx", hint: "mod", decoys: [`combinedEntropy / count`, `combinedEntropy & count`, `combinedEntropy % players.length`] },
    ], "Pick the commit-window guard, commit hash, entropy xor, and winner index."),

    "ch11-oracles-mock-vrf-verifiable-randomness-consumer": splice("mastering-ethereum", "ch11-oracles-mock-vrf-verifiable-randomness-consumer", [
      { target: `nextRequestId++`, name: "req_inc", hint: "post-inc", decoys: [`++nextRequestId`, `nextRequestId += 1`, `nextRequestId`] },
      { target: `consumer != address(0)`, name: "consumer_check", hint: "predicate", decoys: [`consumer == address(0)`, `consumer == msg.sender`, `requestId != 0`] },
      { target: `(randomWord % 6) + 1`, name: "dice_calc", hint: "math", decoys: [`randomWord % 6`, `(randomWord % 7) + 1`, `randomWord / 6`] },
      { target: `msg.sender == coordinator`, name: "coord_check", hint: "predicate", decoys: [`msg.sender != coordinator`, `tx.origin == coordinator`, `msg.sender == address(this)`] },
    ], "Pick the request id bump, the consumer guard, the dice math, and the coordinator check."),

    "ch11-oracles-request-response-oracle-with-callback": splice("mastering-ethereum", "ch11-oracles-request-response-oracle-with-callback", [
      { target: `msg.sender == owner`, name: "owner_check", hint: "predicate", decoys: [`msg.sender != owner`, `tx.origin == owner`, `msg.sender == address(this)`] },
      { target: `requester != address(0)`, name: "exists_check", hint: "predicate", decoys: [`requester == address(0)`, `requester == msg.sender`, `requestId != 0`] },
      { target: `delete pendingRequests[requestId];`, name: "del_req", hint: "cleanup", decoys: [`pendingRequests[requestId] = address(0);`, `delete pendingRequests;`, `pendingRequests[requestId] = 0;`] },
      { target: `ICallback(requester).oracleCallback(requestId, result)`, name: "cb_call", hint: "callback", decoys: [`requester.call(requestId, result)`, `ICallback(msg.sender).oracleCallback(requestId, result)`, `ICallback(requester).oracleCallback(result, requestId)`] },
    ], "Pick the owner-only guard, the request existence check, the cleanup, and the callback."),

    "ch12-decentralized-applications-viem-style-read-against-deployed-contract-using-": splice("mastering-ethereum", "ch12-decentralized-applications-viem-style-read-against-deployed-contract-using-", [
      { target: `value = 123;`, name: "init_val", hint: "literal", decoys: [`value = 0;`, `value = 1;`, `value = 100;`] },
      { target: `return value;`, name: "ret_val", hint: "return", decoys: [`return value + 1;`, `return 0;`, `return this.value();`] },
    ], "Pick the constructor's initial value and the getter's return."),

    "ch04-smart-contracts-evm-votable-proposal-yes-no-tally": splice("mastering-ethereum", "ch04-smart-contracts-evm-votable-proposal-yes-no-tally", [
      { target: `hasVoted[msg.sender]`, name: "voted_check", hint: "predicate", decoys: [`hasVoted[tx.origin]`, `voters[msg.sender]`, `hasVoted[msg.sender] == false`] },
      { target: `hasVoted[msg.sender] = true;`, name: "mark_voted", hint: "set", decoys: [`hasVoted[msg.sender] = false;`, `voters[msg.sender] = true;`, `hasVoted[tx.origin] = true;`] },
      { target: `if (support) {\n            yesVotes++;\n        } else {\n            noVotes++;\n        }`, name: "tally_branch", hint: "branch", decoys: [`if (support) yesVotes++; noVotes++;`, `support ? yesVotes++ : noVotes++;`, `if (!support) yesVotes++; else noVotes++;`] },
      { target: `yesVotes > noVotes`, name: "winning_check", hint: "predicate", decoys: [`yesVotes >= noVotes`, `yesVotes < noVotes`, `noVotes > yesVotes`] },
    ], "Pick the voted check, the mark, the tally branch, and the winning check."),

    "ch12-decentralized-applications-ens-namehash-derivation-solidity-side": splice("mastering-ethereum", "ch12-decentralized-applications-ens-namehash-derivation-solidity-side", [
      { target: `b[i] == 0x2e`, name: "dot_check", hint: "predicate", decoys: [`b[i] == "."`, `b[i] == 0x2f`, `b[i] != 0x2e`] },
      { target: `keccak256(_slice(b, start, i))`, name: "label_hash", hint: "hash", decoys: [`keccak256(b)`, `keccak256(abi.encodePacked(_slice(b, start, i)))`, `_slice(b, start, i)`] },
      { target: `keccak256(abi.encodePacked(node, hashes[labelIndex]))`, name: "fold_hash", hint: "hash", decoys: [`keccak256(abi.encode(node, hashes[labelIndex]))`, `keccak256(abi.encodePacked(hashes[labelIndex], node))`, `keccak256(node)`] },
    ], "Pick the dot byte check, the per-label hash, and the right-fold hash."),

    "ch12-decentralized-applications-ens-resolver-lookup-against-mock-registry": splice("mastering-ethereum", "ch12-decentralized-applications-ens-resolver-lookup-against-mock-registry", [
      { target: `reg.resolver(node)`, name: "reg_lookup", hint: "registry", decoys: [`registry.resolver(node)`, `reg.addr(node)`, `reg.resolver(name)`] },
      { target: `resolverAddr == address(0)`, name: "null_check", hint: "predicate", decoys: [`resolverAddr != address(0)`, `result == address(0)`, `node == bytes32(0)`] },
      { target: `res.addr(node)`, name: "addr_lookup", hint: "resolver", decoys: [`res.resolver(node)`, `resolverAddr.addr(node)`, `res.addr(name)`] },
    ], "Pick the registry lookup, the null guard, and the resolver address lookup."),

    "ch12-decentralized-applications-viem-style-write-via-walletclient-against-chain-": splice("mastering-ethereum", "ch12-decentralized-applications-viem-style-write-via-walletclient-against-chain-", [
      { target: `Proposal storage p = proposalsStorage.push();`, name: "alloc_proposal", hint: "storage", decoys: [`Proposal memory p = proposalsStorage.push();`, `Proposal storage p = proposalsStorage[id];`, `proposalsStorage.push(Proposal());`] },
      { target: `p.approved[msg.sender] = true;`, name: "approve_set", hint: "set", decoys: [`p.approved[tx.origin] = true;`, `approved[msg.sender] = true;`, `p.approved[msg.sender] = false;`] },
      { target: `p.approvalCount >= 2`, name: "quorum_check", hint: "predicate", decoys: [`p.approvalCount > 2`, `p.approvalCount >= 3`, `p.approvalCount == 2`] },
      { target: `payable(p.to).transfer(p.amount);`, name: "send_funds", hint: "send", decoys: [`p.to.transfer(p.amount);`, `payable(msg.sender).transfer(p.amount);`, `payable(p.to).send(p.amount);`] },
    ], "Pick the storage allocation, approval set, quorum check, and funds send."),

    "ch04-smart-contracts-evm-mini-governor-queue-delay-execute": splice("mastering-ethereum", "ch04-smart-contracts-evm-mini-governor-queue-delay-execute", [
      { target: `block.timestamp + DELAY`, name: "exec_after", hint: "stamp", decoys: [`block.number + DELAY`, `block.timestamp + 2 days`, `block.timestamp - DELAY`] },
      { target: `executeAfter == 0`, name: "not_queued", hint: "predicate", decoys: [`executeAfter != 0`, `executeAfter < block.timestamp`, `id == bytes32(0)`] },
      { target: `block.timestamp < executeAfter`, name: "not_ready", hint: "predicate", decoys: [`block.timestamp >= executeAfter`, `block.timestamp <= executeAfter`, `block.number < executeAfter`] },
      { target: `keccak256(abi.encode(target, value, data))`, name: "op_id", hint: "hash", decoys: [`keccak256(abi.encodePacked(target, value, data))`, `keccak256(abi.encode(target, data))`, `keccak256(target)`] },
    ], "Pick the execute-after stamp, the not-queued and not-ready guards, and the operation id."),

    "ch13-decentralized-finance-merkle-airdrop-with-claim-flow": splice("mastering-ethereum", "ch13-decentralized-finance-merkle-airdrop-with-claim-flow", [
      { target: `keccak256(abi.encodePacked(account, amount))`, name: "leaf_hash", hint: "hash", decoys: [`keccak256(abi.encode(account, amount))`, `keccak256(abi.encodePacked(amount, account))`, `keccak256(account)`] },
      { target: `computedHash < proofElement`, name: "order_check", hint: "predicate", decoys: [`computedHash > proofElement`, `computedHash == proofElement`, `proofElement < computedHash`] },
      { target: `computedHash != merkleRoot`, name: "root_check", hint: "predicate", decoys: [`computedHash == merkleRoot`, `merkleRoot != bytes32(0)`, `proofElement != merkleRoot`] },
    ], "Pick the leaf hash, the sorted-pair branch, and the root mismatch check."),

    "ch04-smart-contracts-evm-amm-swap-with-price-impact": splice("mastering-ethereum", "ch04-smart-contracts-evm-amm-swap-with-price-impact", [
      { target: `amountIn * 997`, name: "with_fee", hint: "math", decoys: [`amountIn * 1000`, `amountIn * 30`, `amountIn - 3`] },
      { target: `amountInWithFee * reserveOut`, name: "numerator", hint: "math", decoys: [`amountIn * reserveOut`, `amountInWithFee * reserveIn`, `amountInWithFee + reserveOut`] },
      { target: `reserveIn * 1000 + amountInWithFee`, name: "denominator", hint: "math", decoys: [`reserveIn + amountInWithFee`, `reserveIn * 997 + amountIn`, `reserveIn * 1000`] },
      { target: `numerator / denominator`, name: "result_calc", hint: "math", decoys: [`denominator / numerator`, `numerator * denominator`, `numerator - denominator`] },
    ], "Pick the with-fee, numerator, denominator, and the swap output."),

    "ch04-smart-contracts-evm-constant-product-amm-add-remove-liquidity": splice("mastering-ethereum", "ch04-smart-contracts-evm-constant-product-amm-add-remove-liquidity", [
      { target: `_sqrt(amountA * amountB)`, name: "init_shares", hint: "math", decoys: [`amountA + amountB`, `amountA * amountB`, `_sqrt(amountA + amountB)`] },
      { target: `(amountA * totalShares) / reserveA`, name: "calc_a_shares", hint: "math", decoys: [`(totalShares * reserveA) / amountA`, `(amountA * reserveA) / totalShares`, `amountA / reserveA`] },
      { target: `sA < sB ? sA : sB`, name: "min_pick", hint: "ternary", decoys: [`sA > sB ? sA : sB`, `sA + sB`, `sA == sB ? sA : 0`] },
    ], "Pick the initial-shares geometric mean, the proportional shares, and the min-pick."),

    "ch04-smart-contracts-evm-dutch-auction-decreasing-price-over-time": splice("mastering-ethereum", "ch04-smart-contracts-evm-dutch-auction-decreasing-price-over-time", [
      { target: `block.timestamp - startTime`, name: "elapsed_calc", hint: "stamp", decoys: [`startTime - block.timestamp`, `block.number - startTime`, `block.timestamp - duration`] },
      { target: `elapsed * discountRate`, name: "discount_calc", hint: "math", decoys: [`elapsed + discountRate`, `discountRate / elapsed`, `elapsed - discountRate`] },
      { target: `startPrice - discount`, name: "price_calc", hint: "math", decoys: [`startPrice + discount`, `discount - startPrice`, `startPrice / discount`] },
      { target: `msg.value == price`, name: "exact_pay", hint: "predicate", decoys: [`msg.value >= price`, `msg.value > price`, `msg.value < price`] },
    ], "Pick the elapsed time, discount math, current price, and exact-pay check."),

    "ch04-smart-contracts-evm-english-auction-with-bidder-refunds": splice("mastering-ethereum", "ch04-smart-contracts-evm-english-auction-with-bidder-refunds", [
      { target: `block.timestamp >= auctionEnd`, name: "ended_check", hint: "predicate", decoys: [`block.timestamp < auctionEnd`, `block.timestamp == auctionEnd`, `block.number >= auctionEnd`] },
      { target: `msg.value <= highestBid`, name: "low_bid", hint: "predicate", decoys: [`msg.value < highestBid`, `msg.value > highestBid`, `msg.value == highestBid`] },
      { target: `payable(previousBidder).transfer(previousBid);`, name: "refund_prev", hint: "refund", decoys: [`payable(previousBidder).send(previousBid);`, `previousBidder.transfer(previousBid);`, `payable(highestBidder).transfer(previousBid);`] },
      { target: `payable(seller).transfer(highestBid);`, name: "settle", hint: "send", decoys: [`payable(highestBidder).transfer(highestBid);`, `seller.transfer(highestBid);`, `payable(seller).send(highestBid);`] },
    ], "Pick the ended check, low-bid guard, refund, and seller payout."),

    "ch04-smart-contracts-evm-flash-loan-callback-round-trip": splice("mastering-ethereum", "ch04-smart-contracts-evm-flash-loan-callback-round-trip", [
      { target: `address(this).balance`, name: "self_bal", hint: "balance", decoys: [`address(this).value`, `this.balance`, `msg.sender.balance`] },
      { target: `(amount * fee) / 10000`, name: "owed_calc", hint: "math", decoys: [`amount * fee`, `(amount * fee) / 100`, `(amount + fee) / 10000`] },
      { target: `address(this).balance < before + owed`, name: "repay_check", hint: "predicate", decoys: [`address(this).balance < before`, `address(this).balance >= before + owed`, `before + owed > address(this).balance`] },
      { target: `lender.call{value: amount + owed}("")`, name: "repay_call", hint: "low-level", decoys: [`lender.call{value: amount}("")`, `lender.transfer(amount + owed)`, `payable(lender).send(amount + owed)`] },
    ], "Pick the balance read, owed math, repayment guard, and repay call."),

    "ch04-smart-contracts-evm-vesting-cliff-linear-unlock-with-claim": splice("mastering-ethereum", "ch04-smart-contracts-evm-vesting-cliff-linear-unlock-with-claim", [
      { target: `block.timestamp <= start + cliff`, name: "before_cliff", hint: "predicate", decoys: [`block.timestamp >= start + cliff`, `block.timestamp < start`, `block.number <= start + cliff`] },
      { target: `_balance + claimed`, name: "total_calc", hint: "math", decoys: [`_balance - claimed`, `_balance`, `claimed`] },
      { target: `(total * elapsed) / duration`, name: "vested_calc", hint: "math", decoys: [`(total * duration) / elapsed`, `total / duration`, `total * elapsed`] },
      { target: `vestedAmount() - claimed`, name: "claimable", hint: "math", decoys: [`vestedAmount() + claimed`, `vestedAmount()`, `claimed - vestedAmount()`] },
    ], "Pick the cliff guard, total math, vested ratio, and claimable diff."),

    "ch13-decentralized-finance-lending-market-deposit-borrow-accrue-interest": splice("mastering-ethereum", "ch13-decentralized-finance-lending-market-deposit-borrow-accrue-interest", [
      { target: `amount > collateral[msg.sender] / 2`, name: "ltv_check", hint: "predicate", decoys: [`amount > collateral[msg.sender]`, `amount >= collateral[msg.sender] / 2`, `amount < collateral[msg.sender] / 2`] },
      { target: `(principal[user] * 10 * elapsed) / (100 * 365 days)`, name: "interest_calc", hint: "math", decoys: [`(principal[user] * elapsed) / 365 days`, `principal[user] * 10 * elapsed`, `(principal[user] * 10) / (100 * elapsed)`] },
      { target: `principal[msg.sender] = getDebt(msg.sender);`, name: "compound_step", hint: "compound", decoys: [`principal[msg.sender] += getDebt(msg.sender);`, `principal[msg.sender] = 0;`, `getDebt(msg.sender) = principal[msg.sender];`] },
    ], "Pick the LTV gate, the interest math, and the compounding step."),

    "ch13-decentralized-finance-stablecoin-overcollateralized-mint-redeem": splice("mastering-ethereum", "ch13-decentralized-finance-stablecoin-overcollateralized-mint-redeem", [
      { target: `MIN_RATIO_BPS = 15000`, name: "min_ratio", hint: "constant", decoys: [`MIN_RATIO_BPS = 10000`, `MIN_RATIO_BPS = 100`, `MIN_RATIO_BPS = 150`] },
      { target: `(collateral[msg.sender] * PRICE) / 1 ether`, name: "usd_value", hint: "math", decoys: [`collateral[msg.sender] * PRICE`, `(collateral[msg.sender] * 1 ether) / PRICE`, `collateral[msg.sender] / PRICE`] },
      { target: `collateralValueUsd * 10000 < debt[msg.sender] * MIN_RATIO_BPS`, name: "ratio_check", hint: "predicate", decoys: [`collateralValueUsd < debt[msg.sender]`, `collateralValueUsd * MIN_RATIO_BPS < debt[msg.sender] * 10000`, `debt[msg.sender] * 10000 > collateralValueUsd`] },
      { target: `(amount * 1 ether) / PRICE`, name: "eth_calc", hint: "math", decoys: [`amount / PRICE`, `(amount * PRICE) / 1 ether`, `amount * PRICE`] },
    ], "Pick the 150% ratio, USD valuation, undercollateralised check, and the eth-out math."),

    "ch14-the-evm-extcodesize-check-for-contract-vs-eoa": splice("mastering-ethereum", "ch14-the-evm-extcodesize-check-for-contract-vs-eoa", [
      { target: `extcodesize(addr)`, name: "ext_size", hint: "yul", decoys: [`codesize()`, `extcodehash(addr)`, `addr.codesize`] },
      { target: `return size > 0;`, name: "is_contract", hint: "predicate", decoys: [`return size != 0;`, `return size == 0;`, `return size > 1;`] },
      { target: `if (size == 0) revert NotAContract();`, name: "require_contract", hint: "guard", decoys: [`if (size > 0) revert NotAContract();`, `if (size != 0) revert NotAContract();`, `require(size == 0);`] },
    ], "Pick the extcodesize call, the is-contract predicate, and the require-contract guard."),

    "ch14-the-evm-function-selector-decoder-msg-sig": splice("mastering-ethereum", "ch14-the-evm-function-selector-decoder-msg-sig", [
      { target: `lastSelector = msg.sig;`, name: "save_sig", hint: "selector", decoys: [`lastSelector = msg.data;`, `lastSelector = bytes4(msg.data);`, `msg.sig = lastSelector;`] },
      { target: `bytes4(keccak256(bytes(funcSig)))`, name: "selector_calc", hint: "hash", decoys: [`bytes4(keccak256(funcSig))`, `keccak256(bytes(funcSig))`, `bytes4(funcSig)`] },
      { target: `require(callCount > 0, "Underflow");`, name: "underflow_check", hint: "guard", decoys: [`require(callCount >= 0);`, `require(callCount != 0);`, `if (callCount == 0) revert();`] },
    ], "Pick the msg.sig save, the keccak-derived selector, and the underflow guard."),

    "ch04-smart-contracts-evm-assembly-add-with-overflow-check": splice("mastering-ethereum", "ch04-smart-contracts-evm-assembly-add-with-overflow-check", [
      { target: `result := add(a, b)`, name: "asm_add", hint: "yul", decoys: [`result := mul(a, b)`, `result := sub(a, b)`, `result := add(b, a)`] },
      { target: `overflowed := lt(result, a)`, name: "asm_overflow", hint: "yul", decoys: [`overflowed := gt(result, a)`, `overflowed := eq(result, a)`, `overflowed := lt(a, result)`] },
    ], "Pick the Yul add and the overflow lt-check."),

    "ch04-smart-contracts-evm-create2-constructor-immutable-args": splice("mastering-ethereum", "ch04-smart-contracts-evm-create2-constructor-immutable-args", [
      { target: `new Vault{salt: salt}(owner)`, name: "create2_call", hint: "create2", decoys: [`new Vault(owner)`, `new Vault{value: 0}(owner)`, `new Vault{salt: 0}(owner)`] },
      { target: `type(Vault).creationCode`, name: "init_code", hint: "type-helper", decoys: [`type(Vault).runtimeCode`, `Vault.creationCode`, `address(Vault).code`] },
      { target: `bytes1(0xff)`, name: "ff_byte", hint: "literal", decoys: [`0xff`, `bytes32(0xff)`, `bytes1(0xfe)`] },
      { target: `address(uint160(uint256(hash)))`, name: "addr_cast", hint: "cast", decoys: [`address(hash)`, `address(uint160(hash))`, `address(uint256(hash))`] },
    ], "Pick the CREATE2 invocation, the init code, the 0xff byte, and the hash→address cast."),

    "ch04-smart-contracts-evm-delegatecall-library-for-shared-storage-layout": splice("mastering-ethereum", "ch04-smart-contracts-evm-delegatecall-library-for-shared-storage-layout", [
      { target: `libAddress.code.length == 0`, name: "no_code", hint: "predicate", decoys: [`libAddress.code.length > 0`, `libAddress == address(0)`, `libAddress.balance == 0`] },
      { target: `libAddress.delegatecall(data)`, name: "delegate_call", hint: "low-level", decoys: [`libAddress.call(data)`, `libAddress.staticcall(data)`, `delegatecall(libAddress, data)`] },
      { target: `abi.encodeWithSignature("add(uint256,uint256)", a, b)`, name: "add_sig", hint: "encode", decoys: [`abi.encode("add(uint256,uint256)", a, b)`, `abi.encodeWithSelector("add", a, b)`, `abi.encodePacked("add(uint256,uint256)", a, b)`] },
    ], "Pick the empty-code guard, the delegatecall, and the encodeWithSignature."),

    "ch04-smart-contracts-evm-factory-with-create2-deterministic-addresses": splice("mastering-ethereum", "ch04-smart-contracts-evm-factory-with-create2-deterministic-addresses", [
      { target: `new Child{salt: salt}()`, name: "create2_call", hint: "create2", decoys: [`new Child()`, `new Child{value: 0}()`, `new Child{salt: 0}()`] },
      { target: `keccak256(type(Child).creationCode)`, name: "init_hash", hint: "hash", decoys: [`keccak256(Child.creationCode)`, `type(Child).creationCode`, `keccak256(type(Child).runtimeCode)`] },
      { target: `keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, initCodeHash))`, name: "addr_hash", hint: "hash", decoys: [`keccak256(abi.encode(bytes1(0xff), address(this), salt, initCodeHash))`, `keccak256(abi.encodePacked(address(this), salt, initCodeHash))`, `keccak256(abi.encodePacked(bytes1(0xff), salt, initCodeHash))`] },
    ], "Pick the CREATE2 call, the init-code hash, and the address-derivation hash."),

    "ch04-smart-contracts-evm-gas-efficient-packed-storage-3-fields-in-1-slot": splice("mastering-ethereum", "ch04-smart-contracts-evm-gas-efficient-packed-storage-3-fields-in-1-slot", [
      { target: `uint80(packed)`, name: "field_a", hint: "cast", decoys: [`uint80(packed >> 80)`, `uint256(packed)`, `packed & 0xff`] },
      { target: `uint80(packed >> 80)`, name: "field_b", hint: "shift", decoys: [`uint80(packed)`, `uint80(packed >> 160)`, `uint80(packed << 80)`] },
      { target: `uint80(packed >> 160)`, name: "field_c", hint: "shift", decoys: [`uint80(packed >> 80)`, `uint80(packed)`, `uint80(packed << 160)`] },
      { target: `uint256(_a) | (uint256(_b) << 80) | (uint256(_c) << 160)`, name: "pack_all", hint: "bitwise", decoys: [`uint256(_a) + uint256(_b) + uint256(_c)`, `(_a, _b, _c)`, `uint256(_a) & uint256(_b) & uint256(_c)`] },
    ], "Pick the three field reads and the pack-all bit expression."),

    "ch04-smart-contracts-evm-inline-assembly-read-storage-slot-directly": splice("mastering-ethereum", "ch04-smart-contracts-evm-inline-assembly-read-storage-slot-directly", [
      { target: `result := sload(0)`, name: "load0", hint: "yul", decoys: [`result := sload(1)`, `result := mload(0)`, `result := slot0`] },
      { target: `result := sload(1)`, name: "load1", hint: "yul", decoys: [`result := sload(0)`, `result := mload(1)`, `result := slot1`] },
      { target: `keccak256(abi.encode(key, uint256(2)))`, name: "map_slot", hint: "hash", decoys: [`keccak256(abi.encodePacked(key, uint256(2)))`, `keccak256(abi.encode(uint256(2), key))`, `keccak256(key)`] },
    ], "Pick the two sload reads and the mapping-slot derivation."),

    "ch04-smart-contracts-evm-minimal-proxy-clone-eip-1167": splice("mastering-ethereum", "ch04-smart-contracts-evm-minimal-proxy-clone-eip-1167", [
      { target: `0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000`, name: "eip1167_prefix", hint: "bytecode", decoys: [`0x3d602d80600a3d3981f3363d3d373d3d3d363d73`, `0x363d3d373d3d3d363d73000000000000000000000000000000000000000000000`, `0xff`] },
      { target: `shl(0x60, impl)`, name: "impl_shift", hint: "yul", decoys: [`shl(0x40, impl)`, `shr(0x60, impl)`, `impl`] },
      { target: `0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000`, name: "eip1167_suffix", hint: "bytecode", decoys: [`0x5af43d82803e903d91602b57fd5bf3`, `0xfd5bf30000000000000000000000000000000000000000000000000000000000`, `0x00`] },
      { target: `create(0, ptr, 0x37)`, name: "create_call", hint: "yul", decoys: [`create2(0, ptr, 0x37, 0)`, `create(0, ptr, 0x14)`, `create(value, ptr, 0x37)`] },
    ], "Pick the EIP-1167 prefix, the impl shift, the suffix, and the create call."),

    "ch04-smart-contracts-evm-transparent-proxy-with-admin-slot": splice("mastering-ethereum", "ch04-smart-contracts-evm-transparent-proxy-with-admin-slot", [
      { target: `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`, name: "impl_slot_const", hint: "constant", decoys: [`0x0`, `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103`, `keccak256("eip1967.proxy.implementation")`] },
      { target: `msg.sender == admin`, name: "admin_check", hint: "predicate", decoys: [`msg.sender != admin`, `tx.origin == admin`, `admin == address(0)`] },
      { target: `delegatecall(gas(), impl, 0, calldatasize(), 0, 0)`, name: "delegate_call", hint: "yul", decoys: [`call(gas(), impl, 0, 0, calldatasize(), 0, 0)`, `staticcall(gas(), impl, 0, calldatasize(), 0, 0)`, `delegatecall(gas(), impl, calldatasize(), 0, 0, 0)`] },
    ], "Pick the impl slot constant, the admin check, and the delegatecall."),

    "ch04-smart-contracts-evm-uups-upgrade-with-self-authorising-upgrade-fn": splice("mastering-ethereum", "ch04-smart-contracts-evm-uups-upgrade-with-self-authorising-upgrade-fn", [
      { target: `bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)`, name: "impl_slot", hint: "constant", decoys: [`keccak256('eip1967.proxy.implementation')`, `bytes32(uint256(keccak256('eip1967.proxy.implementation')))`, `bytes32(0)`] },
      { target: `delegatecall(gas(), impl, 0, calldatasize(), 0, 0)`, name: "delegate_call", hint: "yul", decoys: [`call(gas(), impl, 0, 0, calldatasize(), 0, 0)`, `staticcall(gas(), impl, 0, calldatasize(), 0, 0)`, `delegatecall(gas(), impl, calldatasize(), 0, 0, 0)`] },
      { target: `current == address(0)`, name: "init_check", hint: "predicate", decoys: [`current != address(0)`, `newImpl == address(0)`, `current == msg.sender`] },
    ], "Pick the EIP-1967 slot derivation, the delegatecall, and the init check."),

    "ch14-the-evm-yul-function-add-with-overflow-guard": splice("mastering-ethereum", "ch14-the-evm-yul-function-add-with-overflow-guard", [
      { target: `c := add(a, b)`, name: "yul_add", hint: "yul", decoys: [`c := mul(a, b)`, `c := sub(a, b)`, `c := add(b, a)`] },
      { target: `lt(c, a)`, name: "overflow_pred", hint: "yul", decoys: [`gt(c, a)`, `eq(c, a)`, `lt(a, c)`] },
      { target: `mstore(0x00, 0x35278d1200000000000000000000000000000000000000000000000000000000)`, name: "store_selector", hint: "yul", decoys: [`mstore(0x00, 0x0)`, `mstore(0x04, 0x35278d12)`, `sstore(0x00, 0x35278d12)`] },
      { target: `revert(0x00, 0x04)`, name: "revert_call", hint: "yul", decoys: [`revert(0x04, 0x00)`, `revert(0x00, 0x20)`, `return(0x00, 0x04)`] },
    ], "Pick the Yul add, overflow predicate, selector store, and revert."),

    "ch07-merkle-root": splice("mastering-ethereum", "ch07-merkle-root", [
      { target: `level.length > 1`, name: "loop_cond", hint: "predicate", decoys: [`level.length >= 1`, `level.length > 0`, `next.length > 1`] },
      { target: `i + 1 < level.length`, name: "has_pair", hint: "predicate", decoys: [`i + 1 <= level.length`, `i < level.length - 1`, `i + 1 > level.length`] },
      { target: `pairHash(level[i], level[i + 1])`, name: "hash_pair", hint: "hash", decoys: [`pairHash(level[i + 1], level[i])`, `keccak256(level[i] + level[i + 1])`, `pairHash(level[0], level[i])`] },
      { target: `level = next;`, name: "level_swap", hint: "swap", decoys: [`next = level;`, `level = level.concat(next);`, `level = next.slice();`] },
    ], "Pick the outer loop cond, the pair-existence check, the pair hash, and the level swap."),
  },

  // ── the-rust-programming-language ───────────────────────────────
  "the-rust-programming-language": {
    "verify-rust-installation": splice("the-rust-programming-language", "verify-rust-installation", [
      { target: `"rustc --version"`, name: "version_cmd", hint: "command", decoys: [`"rustc -V"`, `"cargo --version"`, `"rustup --version"`] },
      { target: `"rustup update"`, name: "update_cmd", hint: "command", decoys: [`"cargo update"`, `"rustup upgrade"`, `"rustc update"`] },
      { target: `"rustup self uninstall"`, name: "uninstall_cmd", hint: "command", decoys: [`"rustup uninstall"`, `"rustc self uninstall"`, `"cargo uninstall"`] },
    ], "Pick the toolchain commands."),

    "write-hello-world": splice("the-rust-programming-language", "write-hello-world", [
      { target: `"Hello, world!"`, name: "msg", hint: "literal", decoys: [`"Hello world!"`, `"hello, world!"`, `"Goodbye, world!"`] },
      { target: `&'static str`, name: "ret_type", hint: "type", decoys: [`String`, `&str`, `&'a str`] },
    ], "Pick the greeting and the static-str return type."),

    "create-cargo-project": splice("the-rust-programming-language", "create-cargo-project", [
      { target: `"Project: hello_cargo"`, name: "line1", hint: "literal", decoys: [`"Name: hello_cargo"`, `"hello_cargo"`, `"Project hello_cargo"`] },
      { target: `"Version: 0.1.0"`, name: "line2", hint: "literal", decoys: [`"Version: 1.0.0"`, `"v0.1.0"`, `"0.1.0"`] },
      { target: `"Ready to build!"`, name: "line3", hint: "literal", decoys: [`"Build complete"`, `"Ready"`, `"Building..."`] },
    ], "Drop in the three info strings."),

    "practice-cargo-commands": splice("the-rust-programming-language", "practice-cargo-commands", [
      { target: `"cargo run"`, name: "run_cmd", hint: "command", decoys: [`"cargo build && cargo run"`, `"rust run"`, `"cargo exec"`] },
      { target: `"cargo build"`, name: "build_cmd", hint: "command", decoys: [`"cargo compile"`, `"rust build"`, `"cargo make"`] },
      { target: `"cargo check"`, name: "check_cmd", hint: "command", decoys: [`"cargo verify"`, `"cargo lint"`, `"rustc check"`] },
    ], "Pick the cargo subcommands."),

    "create-hello-guessing-game": splice("the-rust-programming-language", "create-hello-guessing-game", [
      { target: `"Hello, Guessing Game!"`, name: "msg", hint: "literal", decoys: [`"Hello, world!"`, `"Guessing Game"`, `"Hello!"`] },
    ], "Pick the greeting message."),

    "read-and-print-input": splice("the-rust-programming-language", "read-and-print-input", [
      { target: `use std::io;`, name: "use_io", hint: "import", decoys: [`use std::input;`, `use io;`, `use std::io::Read;`] },
      { target: `String::new()`, name: "string_new", hint: "constructor", decoys: [`String::default()`, `String::from("")`, `Vec::new()`] },
      { target: `.read_line(&mut guess)`, name: "read_line", hint: "io", decoys: [`.read_to_string(&mut guess)`, `.read(&mut guess)`, `.readline(&mut guess)`] },
      { target: `.expect("Failed to read line")`, name: "expect_call", hint: "error", decoys: [`.unwrap()`, `.ok()`, `.expect("read error")`] },
    ], "Wire up the io import, String::new, read_line, and the expect call."),

    "generate-secret-number": splice("the-rust-programming-language", "generate-secret-number", [
      { target: `rand::random_range(1..=100)`, name: "rand_call", hint: "rng", decoys: [`rand::random()`, `rand::thread_rng().gen_range(1..=100)`, `rand::random_range(0..100)`] },
      { target: `let secret_number: u32`, name: "secret_decl", hint: "decl", decoys: [`let mut secret_number: u32`, `let secret_number: i32`, `const secret_number: u32`] },
    ], "Pick the rand call and the secret_number declaration."),

    "implement-comparison": splice("the-rust-programming-language", "implement-comparison", [
      { target: `use std::cmp::Ordering;`, name: "use_ord", hint: "import", decoys: [`use std::cmp;`, `use cmp::Ordering;`, `use std::Ordering;`] },
      { target: `guess.trim().parse()`, name: "parse_call", hint: "parse", decoys: [`guess.parse()`, `guess.trim().to_int()`, `parse(guess.trim())`] },
      { target: `guess.cmp(&secret_number)`, name: "cmp_call", hint: "compare", decoys: [`guess == secret_number`, `secret_number.cmp(&guess)`, `guess.compare(&secret_number)`] },
      { target: `Ordering::Less => println!("Too small!")`, name: "less_arm", hint: "arm", decoys: [`Ordering::Greater => println!("Too small!")`, `Less => println!("Too small!")`, `Ordering::Less => println!("Too big!")`] },
      { target: `Ordering::Equal => println!("You win!")`, name: "equal_arm", hint: "arm", decoys: [`Ordering::Eq => println!("You win!")`, `Equal => println!("You win!")`, `Ordering::Equal => println!("Tied!")`] },
    ], "Pick the Ordering import, the parse, the cmp call, and two switch arms."),

    "complete-guessing-game": splice("the-rust-programming-language", "complete-guessing-game", [
      { target: `loop {`, name: "loop_kw", hint: "keyword", decoys: [`while true {`, `for _ in 0.. {`, `repeat {`] },
      { target: `Ok(num) => num,`, name: "ok_arm", hint: "result", decoys: [`Ok(num) => continue,`, `Some(num) => num,`, `Ok(_) => num,`] },
      { target: `Err(_) => continue,`, name: "err_arm", hint: "result", decoys: [`Err(e) => return,`, `Err(_) => break,`, `None => continue,`] },
      { target: `break;`, name: "break_stmt", hint: "control", decoys: [`return;`, `continue;`, `panic!();`] },
    ], "Pick the loop keyword, the parse Ok/Err arms, and the break."),

    "fix-immutability-error": splice("the-rust-programming-language", "fix-immutability-error", [
      { target: `let mut x = 5;`, name: "mut_decl", hint: "decl", decoys: [`let x = 5;`, `let mut x: i32 = 5;`, `let mut x;`] },
      { target: `x = 6;`, name: "reassign", hint: "mutate", decoys: [`x := 6;`, `let x = 6;`, `x.set(6);`] },
    ], "Pick the mutable declaration and the reassignment."),

    "use-shadowing-to-transform": splice("the-rust-programming-language", "use-shadowing-to-transform", [
      { target: `input.trim()`, name: "trim_call", hint: "string", decoys: [`input.strip()`, `input.clean()`, `input.trim_end()`] },
      { target: `input.parse::<u32>().unwrap()`, name: "parse_unwrap", hint: "parse", decoys: [`input.parse::<i32>().unwrap()`, `u32::parse(input).unwrap()`, `input.to_u32().unwrap()`] },
      { target: `input * 2`, name: "double", hint: "math", decoys: [`input + 2`, `input * 2.0`, `2 * input.value`] },
    ], "Pick the trim, parse-with-turbofish, and double-the-input expressions."),

    "write-function-with-parameters": splice("the-rust-programming-language", "write-function-with-parameters", [
      { target: `name: &str`, name: "name_param", hint: "param", decoys: [`name: String`, `name: &String`, `name: str`] },
      { target: `quantity: u32`, name: "qty_param", hint: "param", decoys: [`quantity: i32`, `quantity: usize`, `quantity: u8`] },
      { target: `"Item: {name}, Quantity: {quantity}"`, name: "fmt_str", hint: "format", decoys: [`"Item: {}, Quantity: {}"`, `"{name} - {quantity}"`, `"Item={name} Quantity={quantity}"`] },
    ], "Pick the parameter types and the format string."),

    "fix-function-return-type": splice("the-rust-programming-language", "fix-function-return-type", [
      { target: `pub fn double(x: i32) -> i32`, name: "fn_sig", hint: "signature", decoys: [`pub fn double(x: i32)`, `pub fn double(x: i32) -> ()`, `pub fn double(x: i64) -> i32`] },
      { target: `x * 2`, name: "body", hint: "expr", decoys: [`x + 2`, `x * x`, `return x * 2;`] },
    ], "Pick the i32→i32 signature and the body expression."),

    "write-conditional-logic": splice("the-rust-programming-language", "write-conditional-logic", [
      { target: `if x > 0 {\n        1\n    } else if x < 0 {\n        -1\n    } else {\n        0\n    }`, name: "sign_body", hint: "branches", decoys: [`if x > 0 { 1 } else { -1 }`, `if x >= 0 { 1 } else { -1 }`, `match x.signum() { 1 => 1, -1 => -1, _ => 0 }`] },
    ], "Pick the if/else-if/else sign body."),

    "iterate-with-for-loop": splice("the-rust-programming-language", "iterate-with-for-loop", [
      { target: `[1, 2, 3, 4, 5]`, name: "arr_lit", hint: "literal", decoys: [`vec![1, 2, 3, 4, 5]`, `[1..6]`, `[1, 2, 3]`] },
      { target: `[i32; 5]`, name: "arr_type", hint: "type", decoys: [`Vec<i32>`, `&[i32]`, `[i32]`] },
      { target: `for element in arr`, name: "for_loop", hint: "loop", decoys: [`for element in arr.iter()`, `while let Some(element) = arr.next()`, `for element in &arr`] },
      { target: `"Element: {element}"`, name: "fmt_str", hint: "format", decoys: [`"Element: {}"`, `"{element}"`, `"Element {element}"`] },
    ], "Pick the array literal, type, for-loop, and format string."),

    "exercise-string-creation": splice("the-rust-programming-language", "exercise-string-creation", [
      { target: `String::from("hello")`, name: "str_from", hint: "constructor", decoys: [`"hello".to_string()`, `String::new("hello")`, `String("hello")`] },
      { target: `s.push_str(", world!");`, name: "push_call", hint: "string-op", decoys: [`s.push(", world!");`, `s += ", world!";`, `s.append(", world!");`] },
    ], "Pick the String::from constructor and the push_str append."),

    "exercise-move-error": splice("the-rust-programming-language", "exercise-move-error", [
      { target: `let s2 = s1.clone();`, name: "clone_decl", hint: "ownership", decoys: [`let s2 = &s1;`, `let s2 = s1;`, `let s2 = s1.copy();`] },
    ], "Pick the .clone() decl that fixes the move error."),

    "exercise-function-ownership": splice("the-rust-programming-language", "exercise-function-ownership", [
      { target: `mut s: String`, name: "mut_param", hint: "param", decoys: [`s: String`, `&mut s: String`, `s: &mut String`] },
      { target: `s.push_str(" world");`, name: "push_call", hint: "string-op", decoys: [`s += " world";`, `s.append(" world");`, `s.push(" world");`] },
      { target: `let s4 = print_and_return(s3);`, name: "ownership_chain", hint: "binding", decoys: [`let s4 = &print_and_return(s3);`, `print_and_return(s3);`, `let s4 = print_and_return(&s3);`] },
    ], "Pick the mut-param, the push_str call, and the chained ownership binding."),

    "exercise-references": splice("the-rust-programming-language", "exercise-references", [
      { target: `s: &String`, name: "ref_param", hint: "param", decoys: [`s: String`, `s: &str`, `s: &mut String`] },
      { target: `s.len()`, name: "len_call", hint: "method", decoys: [`s.length()`, `s.size()`, `len(s)`] },
      { target: `&s1`, name: "take_ref", hint: "reference", decoys: [`s1`, `&mut s1`, `s1.clone()`] },
    ], "Pick the &String parameter, the len() call, and the &s1 reference at the call site."),

    "exercise-first-word": splice("the-rust-programming-language", "exercise-first-word", [
      { target: `s.as_bytes()`, name: "as_bytes", hint: "convert", decoys: [`s.bytes()`, `s.to_bytes()`, `s.chars()`] },
      { target: `bytes.iter().enumerate()`, name: "iter_enum", hint: "iter", decoys: [`bytes.enumerate()`, `bytes.iter().count()`, `bytes.zip(0..)`] },
      { target: `b' '`, name: "byte_lit", hint: "literal", decoys: [`' '`, `0x20`, `" "`] },
      { target: `&s[0..i]`, name: "slice_expr", hint: "slice", decoys: [`s[0..i]`, `&s[..i]`, `s.slice(0, i)`] },
    ], "Pick the as_bytes, iter+enumerate, byte literal, and the slice expression."),

    "define-and-instantiate-struct": splice("the-rust-programming-language", "define-and-instantiate-struct", [
      { target: `title: String,`, name: "title_field", hint: "field", decoys: [`title: &str,`, `title: String;`, `pub title: String,`] },
      { target: `book: &Book`, name: "book_param", hint: "param", decoys: [`book: Book`, `book: &mut Book`, `&book: Book`] },
      { target: `&book.title`, name: "title_ref", hint: "field-ref", decoys: [`book.title`, `&book.author`, `book.title.clone()`] },
    ], "Pick the title field decl, the &Book parameter, and the &book.title return."),

    "field-init-shorthand": splice("the-rust-programming-language", "field-init-shorthand", [
      { target: `year: 0,`, name: "year_explicit", hint: "init", decoys: [`year: 1,`, `year: 2024,`, `year: None,`] },
      { target: `2023,`, name: "year_arg", hint: "literal", decoys: [`0,`, `2024,`, `552,`] },
    ], "Pick the explicit year:0 init and the 2023 argument."),

    "refactoring-to-structs": splice("the-rust-programming-language", "refactoring-to-structs", [
      { target: `rect.width * rect.height`, name: "area_formula", hint: "math", decoys: [`rect.width + rect.height`, `2 * (rect.width + rect.height)`, `rect.width / rect.height`] },
      { target: `..rect`, name: "struct_update", hint: "update", decoys: [`...rect`, `rect`, `&rect`] },
      { target: `make_square(20)`, name: "square_call", hint: "call", decoys: [`make_square()`, `make_square(20.0)`, `Rectangle::square(20)`] },
    ], "Pick the area formula, the struct-update syntax, and the make_square call."),

    "debug-printing-exercise": splice("the-rust-programming-language", "debug-printing-exercise", [
      { target: `#[derive(Debug)]`, name: "derive_debug", hint: "attr", decoys: [`#[derive(Display)]`, `#[debug]`, `#[derive(Debug, Clone)]`] },
      { target: `"Point is {:?}"`, name: "debug_fmt", hint: "format", decoys: [`"Point is {}"`, `"Point is {pt}"`, `"Point is {:#?}"`] },
      { target: `dbg!(15 * scale)`, name: "dbg_call", hint: "macro", decoys: [`println!(15 * scale)`, `eprintln!(15 * scale)`, `dbg(15 * scale)`] },
    ], "Pick the derive(Debug) attr, the {:?} format, and the dbg!() macro."),

    "implement-method-exercise": splice("the-rust-programming-language", "implement-method-exercise", [
      { target: `impl Circle {`, name: "impl_block", hint: "impl", decoys: [`impl Circle for Circle {`, `trait Circle {`, `Circle::impl {`] },
      { target: `&self`, name: "self_ref", hint: "receiver", decoys: [`self`, `&mut self`, `Self`] },
      { target: `2.0 * PI * self.radius`, name: "circ_formula", hint: "math", decoys: [`PI * self.radius * self.radius`, `PI * self.radius`, `2.0 * self.radius`] },
    ], "Pick the impl block, the &self receiver, and the circumference formula."),

    "associated-functions": splice("the-rust-programming-language", "associated-functions", [
      { target: `fn with_radius(radius: f64) -> Self`, name: "ctor_sig", hint: "signature", decoys: [`fn with_radius(&self, radius: f64) -> Self`, `fn with_radius(radius: f64) -> Circle`, `fn new(radius: f64) -> Self`] },
      { target: `Self { radius }`, name: "self_init", hint: "constructor", decoys: [`Circle { radius }`, `Self { radius: radius }`, `&Self { radius }`] },
      { target: `Circle::with_radius(5.0)`, name: "ctor_call", hint: "call", decoys: [`Circle.with_radius(5.0)`, `Circle::new(5.0)`, `Circle { radius: 5.0 }`] },
    ], "Pick the associated-fn signature, the Self constructor, and the Circle::with_radius call."),

    "create-enum-variants": splice("the-rust-programming-language", "create-enum-variants", [
      { target: `(TrafficLight::Red, TrafficLight::Yellow, TrafficLight::Green)`, name: "tuple_lit", hint: "tuple", decoys: [`(Red, Yellow, Green)`, `[TrafficLight::Red, TrafficLight::Yellow, TrafficLight::Green]`, `(TrafficLight::Yellow, TrafficLight::Red, TrafficLight::Green)`] },
    ], "Pick the three-variant tuple literal."),

    "define-enum-with-data": splice("the-rust-programming-language", "define-enum-with-data", [
      { target: `Say(String),`, name: "say_variant", hint: "variant", decoys: [`Say { msg: String },`, `Say,`, `Say(&str),`] },
      { target: `Move { x: i32, y: i32 },`, name: "move_variant", hint: "variant", decoys: [`Move(i32, i32),`, `Move { x: u32, y: u32 },`, `Move(Point),`] },
      { target: `Command::Say(msg) => format!("Say: {}", msg)`, name: "say_arm", hint: "arm", decoys: [`Command::Say(msg) => msg.clone()`, `Say(msg) => format!("Say: {}", msg)`, `Command::Say { msg } => format!("Say: {}", msg)`] },
      { target: `Command::Move { x, y } => format!("Move to ({}, {})", x, y)`, name: "move_arm", hint: "arm", decoys: [`Command::Move(x, y) => format!("Move to ({}, {})", x, y)`, `Command::Move { x, y } => format!("({}, {})", x, y)`, `Move { x, y } => format!("Move to ({}, {})", x, y)`] },
    ], "Pick the two data-bearing variants and the corresponding match arms."),

    "use-option-type": splice("the-rust-programming-language", "use-option-type", [
      { target: `Option<i32>`, name: "opt_type", hint: "type", decoys: [`Result<i32>`, `Option<&i32>`, `Some<i32>`] },
      { target: `Some(n)`, name: "some_match", hint: "pattern", decoys: [`Some(_)`, `n`, `Just(n)`] },
      { target: `n % 2 == 0`, name: "even_check", hint: "predicate", decoys: [`n / 2 == 0`, `n & 1 == 0`, `n % 2 != 0`] },
    ], "Pick the Option<i32>, the Some(n) match, and the even predicate."),

    "write-match-expression": splice("the-rust-programming-language", "write-match-expression", [
      { target: `TrafficLight::Red => 60,`, name: "red_arm", hint: "arm", decoys: [`TrafficLight::Red => 5,`, `Red => 60,`, `TrafficLight::Red => 30,`] },
      { target: `TrafficLight::Yellow => 5,`, name: "yellow_arm", hint: "arm", decoys: [`TrafficLight::Yellow => 60,`, `Yellow => 5,`, `TrafficLight::Yellow => 0,`] },
      { target: `TrafficLight::Green => 0,`, name: "green_arm", hint: "arm", decoys: [`TrafficLight::Green => 5,`, `Green => 0,`, `TrafficLight::Green => 60,`] },
    ], "Pick the three traffic-light wait-time arms."),

    "match-option-pattern": splice("the-rust-programming-language", "match-option-pattern", [
      { target: `Some(n) => n * 2,`, name: "some_arm", hint: "arm", decoys: [`Some(n) => n + 2,`, `Some(_) => 0,`, `Some(n) => 2 * n,`] },
      { target: `None => 0,`, name: "none_arm", hint: "arm", decoys: [`None => -1,`, `_ => 0,`, `None,`] },
    ], "Pick the Some/None match arms."),

    "use-if-let": splice("the-rust-programming-language", "use-if-let", [
      { target: `if let Some(n) = opt`, name: "if_let", hint: "control", decoys: [`if Some(n) == opt`, `if let n = opt.unwrap()`, `match opt { Some(n) }`] },
    ], "Pick the if-let pattern."),

    "create-package-exercise": splice("the-rust-programming-language", "create-package-exercise", [
      { target: `pub mod greeter`, name: "mod_decl", hint: "module", decoys: [`mod greeter`, `pub crate greeter`, `pub fn greeter`] },
      { target: `format!("Hello, {}!", name)`, name: "fmt_call", hint: "format", decoys: [`format!("Hello, {name}!")`, `format("Hello, {}!", name)`, `"Hello, ".to_string() + name + "!"`] },
      { target: `greeter::greet("World")`, name: "qualified_call", hint: "path", decoys: [`greeter.greet("World")`, `greet("World")`, `crate::greeter::greet("World")`] },
    ], "Pick the pub-mod decl, the format! call, and the qualified call."),

    "define-nested-modules": splice("the-rust-programming-language", "define-nested-modules", [
      { target: `pub mod hosting`, name: "hosting_mod", hint: "module", decoys: [`mod hosting`, `pub fn hosting`, `pub crate hosting`] },
      { target: `pub mod serving`, name: "serving_mod", hint: "module", decoys: [`mod serving`, `pub fn serving`, `pub crate serving`] },
      { target: `crate::front_of_house::hosting::seat_guest()`, name: "hosting_call", hint: "path", decoys: [`front_of_house::hosting::seat_guest()`, `crate::hosting::seat_guest()`, `super::front_of_house::hosting::seat_guest()`] },
    ], "Pick the two pub-mod decls and the absolute path call."),

    "fix-privacy-errors": splice("the-rust-programming-language", "fix-privacy-errors", [
      { target: `pub mod prep`, name: "prep_pub", hint: "module", decoys: [`mod prep`, `pub fn prep`, `pub use prep`] },
      { target: `pub fn chop_vegetables`, name: "chop_pub", hint: "function", decoys: [`fn chop_vegetables`, `pub mod chop_vegetables`, `pub static chop_vegetables`] },
      { target: `pub fn heat_stove`, name: "stove_pub", hint: "function", decoys: [`fn heat_stove`, `pub mod heat_stove`, `pub static heat_stove`] },
    ], "Make prep, chop_vegetables, and heat_stove pub."),

    "struct-visibility-exercise": splice("the-rust-programming-language", "struct-visibility-exercise", [
      { target: `pub struct Breakfast`, name: "struct_pub", hint: "visibility", decoys: [`struct Breakfast`, `pub mod Breakfast`, `pub enum Breakfast`] },
      { target: `pub toast: String,`, name: "toast_field", hint: "field", decoys: [`toast: String,`, `pub toast: &str,`, `pub toast: String;`] },
      { target: `seasonal_fruit: String,`, name: "fruit_field", hint: "field", decoys: [`pub seasonal_fruit: String,`, `seasonal_fruit: &str,`, `seasonal_fruit: String;`] },
      { target: `pub fn summer(toast: &str) -> Breakfast`, name: "summer_sig", hint: "signature", decoys: [`fn summer(toast: &str) -> Breakfast`, `pub fn summer(toast: String) -> Breakfast`, `pub fn summer(toast: &str) -> &Breakfast`] },
    ], "Pick the pub struct, the pub toast field, the private fruit field, and the summer signature."),

    "use-and-as-exercise": splice("the-rust-programming-language", "use-and-as-exercise", [
      { target: `use back_of_house::Breakfast;`, name: "use_breakfast", hint: "use", decoys: [`use back_of_house::*;`, `use back_of_house::breakfast;`, `use Breakfast;`] },
      { target: `use back_of_house::DietaryBreakfast as DietBreakfast;`, name: "use_alias", hint: "use", decoys: [`use back_of_house::DietaryBreakfast;`, `use DietaryBreakfast as DietBreakfast;`, `use back_of_house::DietaryBreakfast = DietBreakfast;`] },
      { target: `Breakfast::summer("Rye")`, name: "summer_call", hint: "call", decoys: [`back_of_house::Breakfast::summer("Rye")`, `Breakfast.summer("Rye")`, `Breakfast::new("Rye")`] },
    ], "Pick the use lines and the unqualified Breakfast call."),

    "organize-imports-exercise": splice("the-rust-programming-language", "organize-imports-exercise", [
      { target: `use back_of_house::{Breakfast, DietaryBreakfast as DietBreakfast};`, name: "grouped_use", hint: "use", decoys: [`use back_of_house::Breakfast; use back_of_house::DietaryBreakfast as DietBreakfast;`, `use back_of_house::*;`, `use back_of_house::{Breakfast as DietBreakfast, DietaryBreakfast};`] },
      { target: `use std::io::{self, Write};`, name: "io_use", hint: "use", decoys: [`use std::io::Write;`, `use std::{io, Write};`, `use std::io::*;`] },
      { target: `use std::collections::*;`, name: "glob_use", hint: "use", decoys: [`use std::collections;`, `use std::collections::HashMap;`, `use *;`] },
    ], "Pick the grouped use, the {self, Write} import, and the glob import."),

    "split-modules-exercise": splice("the-rust-programming-language", "split-modules-exercise", [
      { target: `use std::collections::HashMap;`, name: "hashmap_use", hint: "use", decoys: [`use HashMap;`, `use std::HashMap;`, `use std::collections::*;`] },
      { target: `use back_of_house::{Breakfast, DietaryBreakfast as DietBreakfast};`, name: "grouped_use", hint: "use", decoys: [`use back_of_house::Breakfast; use back_of_house::DietaryBreakfast as DietBreakfast;`, `use back_of_house::*;`, `use back_of_house::{Breakfast as DietBreakfast, DietaryBreakfast};`] },
      { target: `HashMap<String, u32>`, name: "ret_type", hint: "type", decoys: [`HashMap<&str, u32>`, `HashMap<String, i32>`, `Vec<(String, u32)>`] },
      { target: `HashMap::new()`, name: "hashmap_new", hint: "constructor", decoys: [`HashMap::default()`, `HashMap()`, `HashMap::with_capacity(0)`] },
    ], "Pick the HashMap import, the grouped use, the return type, and the constructor."),

    "create-and-populate-vector": splice("the-rust-programming-language", "create-and-populate-vector", [
      { target: `Vec::new()`, name: "vec_new", hint: "constructor", decoys: [`Vec::default()`, `vec![]`, `Vec::with_capacity(0)`] },
      { target: `v.push(10);`, name: "push10", hint: "method", decoys: [`v.append(10);`, `v += 10;`, `v.push_back(10);`] },
      { target: `v.push(20);`, name: "push20", hint: "method", decoys: [`v.append(20);`, `v += 20;`, `v.push_back(20);`] },
      { target: `v.push(30);`, name: "push30", hint: "method", decoys: [`v.append(30);`, `v += 30;`, `v.push_back(30);`] },
    ], "Pick the Vec::new constructor and the three push calls."),

    "safe-vector-access": splice("the-rust-programming-language", "safe-vector-access", [
      { target: `v.get(index)`, name: "get_call", hint: "method", decoys: [`v[index]`, `v.at(index)`, `v.fetch(index)`] },
      { target: `Some(&value) => Some(value),`, name: "some_arm", hint: "pattern", decoys: [`Some(value) => Some(value),`, `Some(&value) => value,`, `Some(value) => *value,`] },
      { target: `None => None,`, name: "none_arm", hint: "pattern", decoys: [`None => Some(0),`, `_ => None,`, `None => panic!(),`] },
    ], "Pick the .get() call and the Some/None match arms."),

    "modify-vector-elements": splice("the-rust-programming-language", "modify-vector-elements", [
      { target: `v: &mut Vec<i32>`, name: "mut_param", hint: "param", decoys: [`v: &Vec<i32>`, `v: Vec<i32>`, `v: &mut [i32]`] },
      { target: `*elem *= 2;`, name: "deref_mul", hint: "mutation", decoys: [`elem *= 2;`, `*elem = elem * 2;`, `elem.set(elem * 2);`] },
    ], "Pick the &mut Vec parameter and the deref-multiply mutation."),

    "build-a-string": splice("the-rust-programming-language", "build-a-string", [
      { target: `String::from("Hello")`, name: "str_init", hint: "constructor", decoys: [`"Hello".to_string()`, `String::new("Hello")`, `String("Hello")`] },
      { target: `s.push_str(", ");`, name: "push_comma", hint: "string-op", decoys: [`s.push(", ");`, `s += ", ";`, `s.append(", ");`] },
      { target: `s.push_str("Rust");`, name: "push_rust", hint: "string-op", decoys: [`s.push("Rust");`, `s += "Rust";`, `s.append("Rust");`] },
      { target: `s.push('!');`, name: "push_bang", hint: "string-op", decoys: [`s.push_str('!');`, `s.push("!");`, `s += '!';`] },
    ], "Pick the String::from init, the two push_str calls, and the single-char push."),

    "concatenate-strings": splice("the-rust-programming-language", "concatenate-strings", [
      { target: `format!("{first} {middle} {last}")`, name: "fmt_full", hint: "format", decoys: [`format!("{} {} {}", first, middle, last)`, `first + " " + middle + " " + last`, `[first, middle, last].join(" ")`] },
    ], "Pick the format! interpolation for full name."),

    "iterate-string-chars": splice("the-rust-programming-language", "iterate-string-chars", [
      { target: `s.chars().count()`, name: "count_call", hint: "method", decoys: [`s.len()`, `s.bytes().count()`, `s.size()`] },
      { target: `s.chars().next()`, name: "next_call", hint: "method", decoys: [`s.chars().first()`, `s.first_char()`, `s.chars().nth(0)`] },
      { target: `Option<char>`, name: "opt_char", hint: "type", decoys: [`Option<&char>`, `Option<u8>`, `char`] },
    ], "Pick the chars().count(), chars().next(), and the Option<char> return."),

    "create-a-hashmap": splice("the-rust-programming-language", "create-a-hashmap", [
      { target: `HashMap::new()`, name: "map_new", hint: "constructor", decoys: [`HashMap::default()`, `HashMap()`, `HashMap::with_capacity(0)`] },
      { target: `scores.insert(String::from("Sharks"), 45);`, name: "insert_sharks", hint: "method", decoys: [`scores["Sharks"] = 45;`, `scores.put("Sharks", 45);`, `scores.insert("Sharks", 45);`] },
      { target: `scores.get(team_name).copied()`, name: "get_copied", hint: "lookup", decoys: [`scores.get(team_name)`, `scores[team_name]`, `scores.get(team_name).cloned()`] },
    ], "Pick the HashMap::new, the first insert, and the get(...).copied() lookup."),

    "word-counter": splice("the-rust-programming-language", "word-counter", [
      { target: `text.split_whitespace()`, name: "split_call", hint: "iter", decoys: [`text.split(" ")`, `text.split_ascii_whitespace()`, `text.words()`] },
      { target: `map.entry(word.to_string()).or_insert(0)`, name: "entry_call", hint: "entry", decoys: [`map.get_or_insert(word.to_string(), 0)`, `map.entry(word).or_insert(0)`, `map.entry(word.to_string()).or_default()`] },
      { target: `*count += 1;`, name: "incr", hint: "mutation", decoys: [`count += 1;`, `*count = *count + 1;`, `count.add(1);`] },
    ], "Pick the split_whitespace iter, the entry+or_insert pattern, and the deref-increment."),

    "using-panic-macro": splice("the-rust-programming-language", "using-panic-macro", [
      { target: `panic!("{}", msg);`, name: "panic_call", hint: "macro", decoys: [`panic!(msg);`, `eprintln!("{}", msg);`, `unreachable!();`] },
    ], "Pick the panic! macro invocation."),

    "handling-result-with-match": splice("the-rust-programming-language", "handling-result-with-match", [
      { target: `File::open("hello.txt")`, name: "open_call", hint: "io", decoys: [`File::create("hello.txt")`, `open_file("hello.txt")`, `File::read("hello.txt")`] },
      { target: `Ok(_file) => String::from("File opened successfully"),`, name: "ok_arm", hint: "arm", decoys: [`Ok(_) => String::from("File opened successfully"),`, `Ok(_file) => "File opened successfully",`, `Some(_file) => String::from("File opened successfully"),`] },
      { target: `Err(error) => format!("Problem opening the file: {error:?}"),`, name: "err_arm", hint: "arm", decoys: [`Err(error) => format!("Error: {error}"),`, `Err(_) => format!("Problem opening the file"),`, `None => format!("Problem opening the file: {error:?}"),`] },
    ], "Pick the File::open call and the Ok/Err arms."),

    "nested-error-handling": splice("the-rust-programming-language", "nested-error-handling", [
      { target: `ErrorKind::NotFound`, name: "kind_notfound", hint: "kind", decoys: [`ErrorKind::Missing`, `ErrorKind::NotExists`, `Error::NotFound`] },
      { target: `File::create("hello.txt")`, name: "create_call", hint: "io", decoys: [`File::open("hello.txt")`, `File::new("hello.txt")`, `fs::create("hello.txt")`] },
      { target: `Err(e) => panic!("Problem creating the file: {e:?}"),`, name: "create_err", hint: "arm", decoys: [`Err(_) => panic!("Problem creating the file"),`, `Err(e) => panic!("{e:?}"),`, `Err(e) => println!("Problem creating the file: {e:?}"),`] },
    ], "Pick the ErrorKind::NotFound, the File::create, and the create-err arm."),

    "question-mark-operator": splice("the-rust-programming-language", "question-mark-operator", [
      { target: `Result<String, io::Error>`, name: "result_type", hint: "type", decoys: [`String`, `Option<String>`, `Result<String, Error>`] },
      { target: `File::open("hello.txt")?`, name: "open_q", hint: "?", decoys: [`File::open("hello.txt")`, `File::open("hello.txt")?.unwrap()`, `try!(File::open("hello.txt"))`] },
      { target: `username_file.read_to_string(&mut username)?`, name: "read_q", hint: "?", decoys: [`username_file.read_to_string(&mut username)`, `username_file.read(&mut username)?`, `read_to_string(&mut username)?`] },
      { target: `Ok(username)`, name: "ok_return", hint: "return", decoys: [`username`, `Some(username)`, `return username;`] },
    ], "Pick the Result type, the two ?-operator calls, and the Ok return."),

    "custom-types-for-validation": splice("the-rust-programming-language", "custom-types-for-validation", [
      { target: `value < 0.0 || value > 100.0`, name: "range_check", hint: "predicate", decoys: [`value < 0 || value > 100`, `value <= 0.0 || value >= 100.0`, `value < 0.0 && value > 100.0`] },
      { target: `Percentage { value }`, name: "struct_init", hint: "constructor", decoys: [`Percentage::new(value)`, `Percentage(value)`, `Self { value }`] },
      { target: `self.value`, name: "field_access", hint: "field", decoys: [`&self.value`, `self.0`, `value`] },
    ], "Pick the range check, the struct init, and the self.value field access."),

    "extract-largest-function": splice("the-rust-programming-language", "extract-largest-function", [
      { target: `&[i32]`, name: "slice_param", hint: "type", decoys: [`Vec<i32>`, `&Vec<i32>`, `[i32]`] },
      { target: `&list[0]`, name: "first_ref", hint: "init", decoys: [`list[0]`, `&list.first()`, `list.first().unwrap()`] },
      { target: `item > largest`, name: "compare", hint: "predicate", decoys: [`item >= largest`, `largest > item`, `*item > *largest`] },
    ], "Pick the &[i32] slice, the &list[0] init, and the item > largest predicate."),

    "write-generic-largest": splice("the-rust-programming-language", "write-generic-largest", [
      { target: `<T: PartialOrd>`, name: "generic_bound", hint: "generics", decoys: [`<T>`, `<T: Ord>`, `<T: PartialOrd + Copy>`] },
      { target: `&[T]`, name: "slice_t", hint: "type", decoys: [`Vec<T>`, `&[i32]`, `[T]`] },
      { target: `-> &T`, name: "ret_t", hint: "type", decoys: [`-> T`, `-> &mut T`, `-> Option<&T>`] },
    ], "Pick the PartialOrd bound, the &[T] slice, and the &T return."),

    "create-generic-struct": splice("the-rust-programming-language", "create-generic-struct", [
      { target: `Point<T, U>`, name: "generic_struct", hint: "type", decoys: [`Point<T>`, `Point<T, T>`, `Point`] },
      { target: `impl<T, U> Point<T, U>`, name: "impl_generic", hint: "impl", decoys: [`impl Point<T, U>`, `impl<T> Point<T, U>`, `impl<T, U> Point`] },
      { target: `&self.x`, name: "x_access", hint: "field", decoys: [`self.x`, `&self.y`, `self.x.clone()`] },
      { target: `&self.y`, name: "y_access", hint: "field", decoys: [`self.y`, `&self.x`, `self.y.clone()`] },
    ], "Pick the generic struct, the impl line, and the two getter bodies."),

    "implement-summary-trait": splice("the-rust-programming-language", "implement-summary-trait", [
      { target: `pub trait Summary`, name: "trait_decl", hint: "trait", decoys: [`pub fn Summary`, `pub interface Summary`, `pub struct Summary`] },
      { target: `fn summarize(&self) -> String;`, name: "trait_method", hint: "method", decoys: [`fn summarize(&self);`, `fn summarize() -> String;`, `fn summarize(self) -> String;`] },
      { target: `impl Summary for NewsArticle`, name: "impl_decl", hint: "impl", decoys: [`impl NewsArticle`, `impl Summary`, `impl Summary<NewsArticle>`] },
      { target: `format!("{}, by {} ({})", self.headline, self.author, self.location)`, name: "summary_fmt", hint: "format", decoys: [`format!("{} by {}", self.headline, self.author)`, `format!("{}, by {}", self.headline, self.author)`, `self.headline.to_string()`] },
    ], "Pick the trait, its method signature, the impl, and the format-string body."),
  },

  // ── challenges-elixir-handwritten ────────────────────────────────
  "challenges-elixir-handwritten": {
    "easy-binaries-30": splice("challenges-elixir-handwritten", "easy-binaries-30", [
      { target: "binary-size(8)", name: "sig_size", hint: "annotation", decoys: ["binary-size(7)", "binary-size(16)", "8-bytes"] },
      { target: "_chunk_length::32", name: "chunk_decl", hint: "binary", decoys: ["_chunk_length::8", "_chunk_length::binary-size(4)", "_chunk_length::integer-32"] },
      { target: `"IHDR"`, name: "ihdr", hint: "literal", decoys: [`"PNG"`, `"HDR"`, `"IEND"`] },
      { target: "width::unsigned-big-integer-size(32)", name: "width_decl", hint: "binary", decoys: ["width::integer-size(32)", "width::unsigned-little-integer-size(32)", "width::unsigned-big-integer-size(16)"] },
    ], "Pick the binary annotations for the PNG header chunks."),

    "easy-binaries-40": splice("challenges-elixir-handwritten", "easy-binaries-40", [
      { target: "magic", name: "bind_var", hint: "name", decoys: ["value", "header", "n"] },
      { target: "unsigned-big-integer-size(32)", name: "int_mod", hint: "annotation", decoys: ["integer-size(32)", "unsigned-little-integer-size(32)", "unsigned-big-integer-size(16)"] },
      { target: "_rest::binary", name: "rest_decl", hint: "binary", decoys: ["_rest::bytes", "_rest::bitstring", "_rest::string"] },
    ], "Pick the binding name, the int annotation, and the rest annotation."),

    "medium-binaries-30": splice("challenges-elixir-handwritten", "medium-binaries-30", [
      { target: "binary-size(8)", name: "sig_size", hint: "annotation", decoys: ["binary-size(7)", "binary-size(16)", "8-bytes"] },
      { target: "binary-size(4)", name: "chunk_size", hint: "annotation", decoys: ["binary-size(8)", "32", "integer-size(4)"] },
      { target: `"IHDR"`, name: "ihdr", hint: "literal", decoys: [`"PNG"`, `"HDR"`, `"IEND"`] },
      { target: "unsigned-big-integer-size(32)", name: "int_mod", hint: "annotation", decoys: ["integer-size(32)", "unsigned-little-integer-size(32)", "unsigned-big-integer-size(16)"] },
    ], "Pick the binary annotations for the PNG header chunks."),

    "medium-tuples-38": splice("challenges-elixir-handwritten", "medium-tuples-38", [
      { target: "List.keyfind(store, key, 0)", name: "keyfind_call", hint: "lookup", decoys: ["List.keyfind(store, key)", "Map.fetch(store, key)", "Enum.find(store, fn x -> elem(x, 0) == key end)"] },
      { target: "List.keyreplace(store, key, 0, {key, value})", name: "update_replace", hint: "update", decoys: ["List.keystore(store, key, 0, {key, value})", "List.replace(store, key, value)", "Map.put(store, key, value)"] },
      { target: "{^key, value}", name: "match_pin", hint: "pattern", decoys: ["{key, value}", "{key, _}", "{:ok, value}"] },
      { target: "{:error, :not_found}", name: "not_found", hint: "literal", decoys: [":not_found", "nil", `{:error, "not found"}`] },
      { target: "List.keydelete(store, key, 0)", name: "delete_call", hint: "delete", decoys: ["List.delete(store, key)", "Map.delete(store, key)", "List.keytake(store, key, 0)"] },
    ], "Wire up the keyfind/keyreplace/keydelete calls and the match-pin pattern."),

    "hard-strings-2": splice("challenges-elixir-handwritten", "hard-strings-2", [
      { target: `char == "]"`, name: "close_bracket_check", hint: "predicate", decoys: [`char == "["`, `char == ")"`, `char == "}"`] },
      { target: `char >= "0" and char <= "9"`, name: "digit_check", hint: "range", decoys: [`char in ?0..?9`, `char.isdigit`, `String.contains?("0123456789", char)`] },
      { target: "String.duplicate(content, num)", name: "repeat_call", hint: "string-op", decoys: ["String.repeat(content, num)", "Enum.repeat(content, num)", "String.duplicate(num, content)"] },
      { target: "String.to_integer(char)", name: "to_int_call", hint: "parse", decoys: ["Integer.parse(char)", "String.to_int(char)", "Integer.from_string(char)"] },
    ], "Pick the bracket predicate, digit range check, repeat call, and digit-to-int parse."),

    "hard-pipe-operator-5": splice("challenges-elixir-handwritten", "hard-pipe-operator-5", [
      { target: "Macro.expand_once(__CALLER__)", name: "macro_expand", hint: "macro", decoys: ["Macro.expand(__CALLER__)", "Macro.compile(__CALLER__)", "Macro.eval(__CALLER__)"] },
      { target: "{:ok, unquote(acc)}", name: "ok_wrap", hint: "tuple", decoys: ["{:result, acc}", "{:ok, acc}", "unquote(acc)"] },
      { target: "{:error, _} = err", name: "error_match", hint: "pattern", decoys: ["{:error, _}", "err = {:error, _}", "{:error, reason}"] },
      { target: "is_function(func)", name: "fn_guard", hint: "guard", decoys: ["is_atom(func)", "is_lambda(func)", "function?(func)"] },
    ], "Pick the macro expander, the ok-wrap, the error pattern, and the function guard."),

    "hard-binaries-10": splice("challenges-elixir-handwritten", "hard-binaries-10", [
      { target: ":binary.bin_to_list(old)", name: "to_list_old", hint: "convert", decoys: [":binary.to_list(old)", "String.to_charlist(old)", "Enum.to_list(old)"] },
      { target: "Enum.at(old, i - 1) == Enum.at(new, j - 1)", name: "lcs_eq", hint: "predicate", decoys: ["old[i - 1] == new[j - 1]", "Enum.at(old, i) == Enum.at(new, j)", "Enum.fetch(old, i) == Enum.fetch(new, j)"] },
      { target: "Map.get(table, {i - 1, j}, 0) >= Map.get(table, {i, j - 1}, 0)", name: "backtrack_branch", hint: "compare", decoys: ["Map.get(table, {i, j - 1}, 0) >= Map.get(table, {i - 1, j}, 0)", "Map.get(table, {i - 1, j}) > Map.get(table, {i, j - 1})", "i - 1 > j - 1"] },
      { target: ":binary.list_to_bin()", name: "from_list", hint: "convert", decoys: [":binary.from_list()", "Enum.into(<<>>)", "List.to_string()"] },
    ], "Wire up the LCS table comparison, the backtrack tie-break, and the bin↔list conversions."),

    "hard-lists-21": splice("challenges-elixir-handwritten", "hard-lists-21", [
      { target: "is_list(head)", name: "list_guard", hint: "guard", decoys: ["is_tuple(head)", "is_map(head)", "Enum.is_list(head)"] },
      { target: "depth + 1", name: "depth_step", hint: "recurse", decoys: ["depth", "depth - 1", "0"] },
      { target: "{head, depth}", name: "leaf_pair", hint: "tuple", decoys: ["{depth, head}", "[head, depth]", "%{value: head, depth: depth}"] },
    ], "Pick the list guard, the depth step, and the leaf-pair tuple."),

    "hard-binaries-30": splice("challenges-elixir-handwritten", "hard-binaries-30", [
      { target: "String.graphemes(pattern)", name: "graphemes_call", hint: "split", decoys: ["String.codepoints(pattern)", "String.split(pattern, \"\")", "String.to_charlist(pattern)"] },
      { target: "Map.get(memo, key)", name: "memo_get", hint: "memo", decoys: ["memo[key]", "Map.fetch(memo, key)", "Map.get_lazy(memo, key)"] },
      { target: `bit in ["0", "1"]`, name: "bit_guard", hint: "guard", decoys: [`bit == "0" or bit == "1"`, `bit in [0, 1]`, `is_bit(bit)`] },
      { target: "Enum.drop(value, consumed)", name: "drop_call", hint: "list", decoys: ["Enum.take(value, consumed)", "Enum.slice(value, consumed)", "value -- consumed"] },
    ], "Pick the grapheme split, the memo lookup, the bit guard, and the drop call."),

    "hard-pipe-operator-35": splice("challenges-elixir-handwritten", "hard-pipe-operator-35", [
      { target: "Enum.reduce_while", name: "reduce_kind", hint: "enum", decoys: ["Enum.reduce", "Enum.scan", "Enum.map_reduce"] },
      { target: "{:ok, value}", name: "init_acc", hint: "tuple", decoys: ["value", "{:start, value}", "{value, :ok}"] },
      { target: "{:cont, {:ok, result}}", name: "ok_cont", hint: "control", decoys: ["{:cont, result}", "{:halt, {:ok, result}}", "{:next, result}"] },
      { target: "{:halt, error}", name: "err_halt", hint: "control", decoys: ["{:cont, error}", "{:stop, error}", "error"] },
    ], "Pick the reducer kind, the initial accumulator, and the cont/halt control values."),
  },

  // ── challenges-haskell-handwritten ──────────────────────────────
  "challenges-haskell-handwritten": {
    "medium-lists-11": splice("challenges-haskell-handwritten", "medium-lists-11", [
      { target: "interleaveWith f [] _ = []", name: "empty_left", hint: "base-case", decoys: ["interleaveWith _ [] _ = []", "interleaveWith f [] ys = ys", "interleaveWith f [] _ = error \"empty\""] },
      { target: "map (f x) ys", name: "single_left", hint: "map", decoys: ["map f ys", "[f x y | y <- ys]", "ys"] },
      { target: "map (flip f y) xs", name: "single_right", hint: "map", decoys: ["map (f y) xs", "[f x y | x <- xs]", "xs"] },
      { target: "f x y : interleaveWith f xs ys", name: "recurse_step", hint: "cons", decoys: ["interleaveWith f xs ys", "f x y : f x y : interleaveWith f xs ys", "[f x y] ++ interleaveWith f xs ys"] },
    ], "Wire up the empty-list base case, the singleton special cases, and the cons recurse."),

    "medium-pattern-matching-14": splice("challenges-haskell-handwritten", "medium-pattern-matching-14", [
      { target: "Empty | Node Int Tree Tree", name: "tree_decl", hint: "adt", decoys: ["Leaf | Node Int", "Node Int (Tree, Tree)", "Empty | Branch Int Tree Tree"] },
      { target: "go acc Empty = 0", name: "empty_case", hint: "base", decoys: ["go _ Empty = 0", "go acc Empty = acc", "go acc Empty = []"] },
      { target: "go acc (Node val Empty Empty) = acc + val", name: "leaf_case", hint: "leaf", decoys: ["go acc (Node val _ _) = acc + val", "go _ (Node val Empty Empty) = val", "go acc (Node val Empty Empty) = acc"] },
      { target: "go (acc + val) left + go (acc + val) right", name: "branch_case", hint: "recurse", decoys: ["go acc left + go acc right", "go (acc + val) left", "go val left + go val right"] },
    ], "Pick the ADT declaration and the three pattern-match cases."),

    "medium-list-comprehensions-20": splice("challenges-haskell-handwritten", "medium-list-comprehensions-20", [
      { target: "[1..n]", name: "c_range", hint: "range", decoys: ["[1..n-1]", "[2..n]", "[0..n]"] },
      { target: "[1..c-1]", name: "b_range", hint: "range", decoys: ["[1..c]", "[1..n]", "[2..c-1]"] },
      { target: "[1..b]", name: "a_range", hint: "range", decoys: ["[1..b-1]", "[1..c]", "[1..n]"] },
      { target: "a*a + b*b == c*c", name: "pyth_pred", hint: "predicate", decoys: ["a^2 + b^2 == c^2", "a + b == c", "a*a + b*b <= c*c"] },
    ], "Pick the three nested ranges and the Pythagorean predicate."),

    "medium-folds-28": splice("challenges-haskell-handwritten", "medium-folds-28", [
      { target: "foldr step [acc] xs", name: "outer_fold", hint: "fold", decoys: ["foldl step [acc] xs", "scanr step [acc] xs", "foldr step acc xs"] },
      { target: "[f y x]", name: "step_init", hint: "init", decoys: ["[f x y]", "[acc]", "[]"] },
      { target: "reverse . fst . foldr step ([], acc)", name: "alt_pipeline", hint: "compose", decoys: ["fst . foldr step ([], acc)", "reverse . foldr step ([], acc)", "reverse . snd . foldr step ([], acc)"] },
      { target: "let new = f a x in (new:ys, new)", name: "step_let", hint: "let", decoys: ["let new = f x a in (new:ys, new)", "(f a x : ys, f a x)", "let new = f a x in (ys ++ [new], new)"] },
    ], "Pick the outer fold, the initializer, the alt pipeline, and the let-step."),

    "medium-higher-order-functions-35": splice("challenges-haskell-handwritten", "medium-higher-order-functions-35", [
      { target: "(\\x -> all ($ x) predicates)", name: "filter_lambda", hint: "lambda", decoys: ["(\\x -> any ($ x) predicates)", "(\\x -> map ($ x) predicates)", "(\\p -> all p values)"] },
    ], "Pick the lambda that applies every predicate to a candidate."),

    "medium-list-comprehensions-40": splice("challenges-haskell-handwritten", "medium-list-comprehensions-40", [
      { target: "[1..n]", name: "c_range", hint: "range", decoys: ["[1..n-1]", "[2..n]", "[0..n]"] },
      { target: "[1..c-1]", name: "b_range", hint: "range", decoys: ["[1..c]", "[1..n]", "[2..c-1]"] },
      { target: "[1..b-1]", name: "a_range", hint: "range", decoys: ["[1..b]", "[1..c]", "[1..n]"] },
      { target: "a*a + b*b == c*c", name: "pyth_pred", hint: "predicate", decoys: ["a^2 + b^2 == c^2", "a + b == c", "a*a + b*b <= c*c"] },
    ], "Pick the three nested ranges (note the strict a < b) and the Pythagorean predicate."),

    "hard-tuples-3": splice("challenges-haskell-handwritten", "hard-tuples-3", [
      { target: "(foldl f z (map fst ts), foldl f z (map snd ts))", name: "pair_zip", hint: "tuple", decoys: ["(foldr f z (map fst ts), foldr f z (map snd ts))", "(foldl f z ts, foldl f z ts)", "map (uncurry f) ts"] },
      { target: "[x | (x,_,_) <- ts]", name: "triple_first", hint: "comp", decoys: ["[fst3 t | t <- ts]", "map fst3 ts", "[x | (x,_,_,_) <- ts]"] },
      { target: "zipTuplesN f 0 ts", name: "zip2_call", hint: "call", decoys: ["zipTuplesN f ts 0", "zipTuplesN 0 f ts", "zipTuplesN ts f 0"] },
      { target: "zipTuplesN f 1 ts", name: "zip4_call", hint: "call", decoys: ["zipTuplesN f 0 ts", "zipTuplesN f 4 ts", "zipTuplesN ts f 1"] },
    ], "Pick the pair zip, the 3-tuple comprehension, and the two zipTuplesN call shapes."),

    "hard-list-comprehensions-10": splice("challenges-haskell-handwritten", "hard-list-comprehensions-10", [
      { target: "primeFactorDecompositions 1 = [[]]", name: "base_case", hint: "base", decoys: ["primeFactorDecompositions 1 = []", "primeFactorDecompositions 0 = [[]]", "primeFactorDecompositions 1 = [[1]]"] },
      { target: "nub $ sort $ decompose n", name: "dedup_pipeline", hint: "compose", decoys: ["sort $ nub $ decompose n", "decompose n", "nub (decompose n)"] },
      { target: "[m] : [sort (d:rest) | d <- divisors m, d > 1, d < m, rest <- decompose (m `div` d)]", name: "decompose_step", hint: "recurse", decoys: ["[sort (d:rest) | d <- divisors m, d > 1, d < m, rest <- decompose (m `div` d)]", "[m] : [d:rest | d <- divisors m, rest <- decompose (m `div` d)]", "[[m]]"] },
      { target: "[d | d <- [2..m], m `mod` d == 0]", name: "divisors_def", hint: "comp", decoys: ["[d | d <- [1..m], m `mod` d == 0]", "[d | d <- [2..m], d `mod` m == 0]", "[d | d <- [2..m-1], m `mod` d == 0]"] },
    ], "Pick the base case, the dedup pipeline, the recursive decompose step, and the divisors definition."),

    "hard-higher-order-functions-15": splice("challenges-haskell-handwritten", "hard-higher-order-functions-15", [
      { target: "newIORef ([], 0)", name: "init_cache", hint: "ioref", decoys: ["newIORef []", "newIORef ([], ttl)", "newMVar ([], 0)"] },
      { target: "if newCount > ttl", name: "ttl_check", hint: "guard", decoys: ["if newCount >= ttl", "if newCount == ttl", "if newCount < ttl"] },
      { target: "find (\\(k, _) -> k == arg) newCache", name: "lookup_call", hint: "find", decoys: ["lookup arg newCache", "filter (\\(k, _) -> k == arg) newCache", "find ((== arg) . fst) newCache"] },
      { target: "(arg, result) : newCache", name: "cache_cons", hint: "cons", decoys: ["newCache ++ [(arg, result)]", "(result, arg) : newCache", "[(arg, result)]"] },
    ], "Pick the cache init, the TTL check, the lookup, and the cache prepend."),

    "hard-list-comprehensions-20": splice("challenges-haskell-handwritten", "hard-list-comprehensions-20", [
      { target: "[1..n]", name: "c_range", hint: "range", decoys: ["[1..n-1]", "[2..n]", "[0..n]"] },
      { target: "[1..c-1]", name: "b_range", hint: "range", decoys: ["[1..c]", "[1..n]", "[2..c-1]"] },
      { target: "[1..b-1]", name: "a_range", hint: "range", decoys: ["[1..b]", "[1..c]", "[1..n]"] },
      { target: "a*a + b*b == c*c", name: "pyth_pred", hint: "predicate", decoys: ["a^2 + b^2 == c^2", "a + b == c", "a*a + b*b <= c*c"] },
      { target: "p a b c", name: "user_pred", hint: "predicate", decoys: ["p (a, b, c)", "p a b", "any p [a, b, c]"] },
    ], "Pick the three ranges, the Pythagorean predicate, and the user predicate application."),
  },

  // ── challenges-dart-handwritten ─────────────────────────────────
  "challenges-dart-handwritten": {
    "easy-sealed-classes-30": {
      template:
        `import 'dart:math';\n\n[[SLOT seal_kw]] class Shape {}\n\nclass Circle extends Shape {\n  final double radius;\n  Circle(this.radius);\n}\n\nclass Rectangle extends Shape {\n  final double width;\n  final double height;\n  Rectangle(this.width, this.height);\n}\n\nclass Triangle extends Shape {\n  final double base;\n  final double height;\n  Triangle(this.base, this.height);\n}\n\ndouble calculateArea(Shape shape) {\n  return switch (shape) {\n    [[SLOT circle_pattern]] => [[SLOT circle_area]],\n    Rectangle(width: var w, height: var h) => w * h,\n    Triangle(base: var b, height: var h) => [[SLOT triangle_area]],\n  };\n}`,
      slots: [
        { name: "seal_kw", answer: "sealed", hint: "modifier", decoys: ["abstract", "final", "mixin"] },
        { name: "circle_pattern", answer: "Circle(radius: var r)", hint: "pattern", decoys: ["Circle()", "Circle(r)", "Circle(var r)"] },
        { name: "circle_area", answer: "pi * r * r", hint: "formula", decoys: ["2 * pi * r", "pi * r", "r * r"] },
        { name: "triangle_area", answer: "(b * h) / 2", hint: "formula", decoys: ["b * h", "b + h / 2", "(b * h) * 2"] },
      ],
      prompt: "Pick the sealed-class modifier, the Circle destructure pattern, and the area formulas.",
    },

    "medium-sealed-classes-10": {
      template:
        `[[SLOT import_line]]\n\nsealed class Shape {}\n\n[[SLOT first_final]] class Circle extends Shape {\n  final double radius;\n  Circle(this.radius);\n}\n\nfinal class Rectangle extends Shape {\n  final double width;\n  final double height;\n  Rectangle(this.width, this.height);\n}\n\nfinal class Triangle extends Shape {\n  final double base;\n  final double height;\n  Triangle(this.base, this.height);\n}\n\ndouble calculateTotalArea(List<Shape> shapes) {\n  return shapes.fold([[SLOT fold_init]], (sum, shape) {\n    return sum + switch (shape) {\n      Circle(radius: var r) => pi * r * r,\n      Rectangle(width: var w, height: var h) => w * h,\n      Triangle(base: var b, height: var h) => [[SLOT triangle_area]],\n    };\n  });\n}`,
      slots: [
        { name: "import_line", answer: "import 'dart:math' show pi;", hint: "import", decoys: ["import 'dart:math';", "import 'package:math/math.dart';", "import 'dart:math' as m;"] },
        { name: "first_final", answer: "final", hint: "modifier", decoys: ["class", "abstract", "sealed"] },
        { name: "fold_init", answer: "0.0", hint: "literal", decoys: ["0", "0.0d", "1.0"] },
        { name: "triangle_area", answer: "(b * h) / 2", hint: "formula", decoys: ["b * h", "b + h / 2", "(b * h) * 2"] },
      ],
      prompt: "Drop the show-pi import, the final-class modifier, the fold's init value, and the triangle area formula.",
    },

    "medium-records-19": {
      template:
        `List<[[SLOT record_type]]> mergeRanges(List<({int start, int end})> ranges) {\n  if (ranges.isEmpty) return [];\n  \n  var sorted = List<({int start, int end})>.from(ranges);\n  sorted.sort((a, b) => [[SLOT sort_compare]]);\n  \n  var merged = <({int start, int end})>[sorted[0]];\n  \n  for (var i = 1; i < sorted.length; i++) {\n    var current = sorted[i];\n    var last = merged.last;\n    \n    if ([[SLOT overlap_check]]) {\n      merged[merged.length - 1] = (start: last.start, end: [[SLOT max_end]]);\n    } else {\n      merged.add(current);\n    }\n  }\n  \n  return merged;\n}`,
      slots: [
        { name: "record_type", answer: "({int start, int end})", hint: "record", decoys: ["Map<String, int>", "(int, int)", "Range"] },
        { name: "sort_compare", answer: "a.start.compareTo(b.start)", hint: "comparator", decoys: ["b.start.compareTo(a.start)", "a.compareTo(b)", "a.start - b.start"] },
        { name: "overlap_check", answer: "current.start <= last.end", hint: "predicate", decoys: ["current.start < last.end", "current.start >= last.end", "current.end <= last.start"] },
        { name: "max_end", answer: "current.end > last.end ? current.end : last.end", hint: "max", decoys: ["current.end", "last.end", "(current.end + last.end) / 2"] },
      ],
      prompt: "Type the record, build the comparator, the overlap predicate, and the max-end ternary.",
    },

    "medium-sealed-classes-30": {
      template:
        `[[SLOT import_line]]\n\n[[SLOT seal_kw]] class Shape {}\n\nclass Circle extends Shape {\n  final double radius;\n  Circle(this.radius);\n}\n\nclass Rectangle extends Shape {\n  final double width;\n  final double height;\n  Rectangle(this.width, this.height);\n}\n\nclass Triangle extends Shape {\n  final double base;\n  final double height;\n  Triangle(this.base, this.height);\n}\n\ndouble totalArea(List<Shape> shapes) {\n  return shapes.fold([[SLOT fold_init]], (sum, shape) {\n    return sum + switch (shape) {\n      Circle(radius: var r) => pi * r * r,\n      Rectangle(width: var w, height: var h) => w * h,\n      Triangle(base: var b, height: var h) => [[SLOT triangle_area]],\n    };\n  });\n}`,
      slots: [
        { name: "import_line", answer: "import 'dart:math';", hint: "import", decoys: ["import 'dart:math' show pi;", "import 'dart:core';", "import 'package:math/math.dart';"] },
        { name: "seal_kw", answer: "sealed", hint: "modifier", decoys: ["abstract", "final", "mixin"] },
        { name: "fold_init", answer: "0.0", hint: "literal", decoys: ["0", "0.0d", "1.0"] },
        { name: "triangle_area", answer: "(b * h) / 2", hint: "formula", decoys: ["b * h", "b + h / 2", "(b * h) * 2"] },
      ],
      prompt: "Pick the import line, the sealed modifier, the fold init, and the triangle area formula.",
    },
  },

  // ── challenges-ruby-handwritten ─────────────────────────────────
  "challenges-ruby-handwritten": {
    "medium-ranges-30": {
      template:
        `def merge_ranges(ranges)\n  return [] if ranges.empty?\n  \n  sorted = ranges.sort_by [[SLOT sort_block]]\n  merged = [sorted.first]\n  \n  sorted[1..-1].each do |current|\n    last = merged.last\n    \n    if [[SLOT overlap_check]]\n      merged[-1] = [[SLOT merged_replace]]\n    else\n      merged [[SLOT append_op]] current\n    end\n  end\n  \n  merged\nend`,
      slots: [
        { name: "sort_block", answer: "{ |r| r.begin }", hint: "block", decoys: ["{ |r| r.end }", "{ |r| r.size }", "{ |a, b| a.begin <=> b.begin }"] },
        { name: "overlap_check", answer: "current.begin <= last.end + 1", hint: "predicate", decoys: ["current.begin < last.end", "current.begin >= last.end", "last.end < current.begin"] },
        { name: "merged_replace", answer: "(last.begin..[last.end, current.end].max)", hint: "range", decoys: ["(current.begin..last.end)", "(last.begin..current.end)", "(last.begin..last.end)"] },
        { name: "append_op", answer: "<<", hint: "operator", decoys: ["+=", "+", "<<<"] },
      ],
      prompt: "Pick the sort block, the overlap predicate, the merged-range expression, and the append operator.",
    },

    "medium-regular-expressions-37": {
      template:
        `def extract_quoted(text)\n  text.[[SLOT scan_method]]([[SLOT regex_pattern]])\n      .[[SLOT flatten_call]]\nend`,
      slots: [
        { name: "scan_method", answer: "scan", hint: "regex", decoys: ["match", "gsub", "split"] },
        { name: "regex_pattern", answer: `/"((?:\\\\.|[^\\\\"])*)"/`, hint: "regex", decoys: [`/".*"/`, `/"([^"]+)"/`, `/[^"]+/`] },
        { name: "flatten_call", answer: "flatten", hint: "transform", decoys: ["compact", "uniq", "to_a"] },
      ],
      prompt: "Pick the regex method, the quoted-string pattern, and the flatten step.",
    },

    "medium-ranges-40": {
      template:
        `def merge_ranges(ranges)\n  return [] if ranges.empty?\n  \n  sorted = ranges.sort_by [[SLOT sort_block]]\n  merged = [[[SLOT initial_pick]]]\n  \n  sorted[1..-1].each do |current|\n    last = merged[-1]\n    \n    if [[SLOT overlap_check]]\n      merged[-1] = [[SLOT merged_replace]]\n    else\n      merged << current\n    end\n  end\n  \n  merged\nend`,
      slots: [
        { name: "sort_block", answer: "{ |r| r[0] }", hint: "block", decoys: ["{ |r| r[1] }", "{ |r| r.size }", "{ |a, b| a[0] <=> b[0] }"] },
        { name: "initial_pick", answer: "sorted[0]", hint: "head", decoys: ["sorted.first", "sorted[1]", "sorted"] },
        { name: "overlap_check", answer: "current[0] <= last[1] + 1", hint: "predicate", decoys: ["current[0] < last[1]", "current[0] >= last[1]", "last[1] < current[0]"] },
        { name: "merged_replace", answer: "[last[0], [last[1], current[1]].max]", hint: "array", decoys: ["[current[0], last[1]]", "[last[0], current[1]]", "[last[0], last[1]]"] },
      ],
      prompt: "Same merge-ranges puzzle, this time with array-of-pairs instead of Range objects.",
    },

    "hard-symbols-9": {
      template:
        `class SymbolGC\n  def initialize\n    @found = [[SLOT set_init]]\n    @live = Set.new\n  end\n\n  def register_code(snippet)\n    # Match :symbol and :'quoted symbol'\n    snippet.scan([[SLOT quoted_regex]]).each do |quoted, unquoted|\n      @found.add((quoted || unquoted).to_sym)\n    end\n    \n    # Match %i[sym1 sym2] and %I[sym1 sym2]\n    snippet.scan([[SLOT array_regex]]).each do |match|\n      match[0].split.each { |s| @found.add(s.to_sym) }\n    end\n    \n    # Match hash syntax key: value\n    snippet.scan(/([a-zA-Z_]\\w*):\\s+/).each do |match|\n      @found.add(match[0].to_sym)\n    end\n  end\n\n  def mark_live(*syms)\n    syms.each { |s| @live.add(s) }\n  end\n\n  def unreferenced\n    [[SLOT unref_calc]]\n  end\nend`,
      slots: [
        { name: "set_init", answer: "Set.new", hint: "container", decoys: ["[]", "Hash.new", "Array.new"] },
        { name: "quoted_regex", answer: `/:['"]([^'"]+)['"]|:([a-zA-Z_]\\w*)/`, hint: "regex", decoys: [`/:[a-z]+/`, `/:\\w+/`, `/:[a-zA-Z_]\\w*/i`] },
        { name: "array_regex", answer: `/%i\\[([^\\]]+)\\]/i`, hint: "regex", decoys: [`/%i\\[(.+)\\]/`, `/%I\\[([^\\]]+)\\]/`, `/%w\\[([^\\]]+)\\]/`] },
        { name: "unref_calc", answer: "(@found - @live).sort", hint: "diff", decoys: ["@found.sort", "(@live - @found).sort", "@found - @live"] },
      ],
      prompt: "Pick the Set initializer, the two symbol-shape regexes, and the unreferenced computation.",
    },
  },

  // ── challenges-zig-handwritten ──────────────────────────────────
  "challenges-zig-handwritten": {
    "easy-tagged-unions-9": {
      template:
        `const std = @import("std");\n\npub const Shape = [[SLOT union_kw]] {\n    rectangle: struct { width: f32, height: f32 },\n    circle: struct { radius: f32 },\n    triangle: struct { base: f32, height: f32 },\n};\n\npub fn calculateArea(shape: Shape) f32 {\n    return switch (shape) {\n        .rectangle => |r| [[SLOT rect_area]],\n        .circle => |c| [[SLOT circle_area]],\n        .triangle => |t| [[SLOT tri_area]],\n    };\n}`,
      slots: [
        { name: "union_kw", answer: "union(enum)", hint: "tagged", decoys: ["enum", "struct", "union"] },
        { name: "rect_area", answer: "r.width * r.height", hint: "formula", decoys: ["r.width + r.height", "r.width", "2 * r.width * r.height"] },
        { name: "circle_area", answer: "std.math.pi * c.radius * c.radius", hint: "formula", decoys: ["std.math.pi * c.radius", "2 * std.math.pi * c.radius", "c.radius * c.radius"] },
        { name: "tri_area", answer: "0.5 * t.base * t.height", hint: "formula", decoys: ["t.base * t.height", "(t.base + t.height) / 2", "0.5 * (t.base + t.height)"] },
      ],
      prompt: "Pick the tagged-union keyword and the area formula for each shape.",
    },

    "easy-enums-20": {
      template:
        `const std = @import("std");\n\npub const DayOfWeek = [[SLOT enum_kw]] {\n    monday,\n    tuesday,\n    wednesday,\n    thursday,\n    friday,\n    saturday,\n    sunday,\n};\n\npub fn dayToNumber(day: DayOfWeek) u8 {\n    return switch (day) {\n        .monday => [[SLOT monday_val]],\n        .tuesday => 2,\n        .wednesday => [[SLOT wednesday_val]],\n        .thursday => 4,\n        .friday => 5,\n        .saturday => 6,\n        .sunday => [[SLOT sunday_val]],\n    };\n}`,
      slots: [
        { name: "enum_kw", answer: "enum", hint: "kind", decoys: ["union(enum)", "struct", "union"] },
        { name: "monday_val", answer: "1", hint: "ordinal", decoys: ["0", "7", "M"] },
        { name: "wednesday_val", answer: "3", hint: "ordinal", decoys: ["2", "4", "W"] },
        { name: "sunday_val", answer: "7", hint: "ordinal", decoys: ["1", "0", "6"] },
      ],
      prompt: "Pick the enum kind and the missing day-of-week ordinals.",
    },

    "easy-tagged-unions-29": {
      template:
        `const std = @import("std");\n\npub const Circle = struct {\n    radius: f64,\n};\n\npub const Rectangle = struct {\n    width: f64,\n    height: f64,\n};\n\npub const Square = struct {\n    side: f64,\n};\n\npub const Shape = [[SLOT union_kw]] {\n    circle: Circle,\n    rectangle: Rectangle,\n    square: Square,\n};\n\npub fn area(shape: Shape) f64 {\n    return switch (shape) {\n        .circle => |c| [[SLOT circle_area]],\n        .rectangle => |r| [[SLOT rect_area]],\n        .square => |s| [[SLOT square_area]],\n    };\n}`,
      slots: [
        { name: "union_kw", answer: "union(enum)", hint: "tagged", decoys: ["enum", "struct", "union"] },
        { name: "circle_area", answer: "std.math.pi * c.radius * c.radius", hint: "formula", decoys: ["std.math.pi * c.radius", "2 * std.math.pi * c.radius", "c.radius * c.radius"] },
        { name: "rect_area", answer: "r.width * r.height", hint: "formula", decoys: ["r.width + r.height", "r.width", "2 * r.width * r.height"] },
        { name: "square_area", answer: "s.side * s.side", hint: "formula", decoys: ["s.side", "4 * s.side", "s.side + s.side"] },
      ],
      prompt: "Pick the tagged-union keyword and the area formula for each shape.",
    },

    "easy-tagged-unions-39": {
      template:
        `const std = @import("std");\n\npub const Flag = [[SLOT union_kw]] {\n    boolean: bool,\n    string: []const u8,\n    integer: i64,\n};\n\npub fn parseFlag(input: []const u8) Flag {\n    const equals_idx = [[SLOT index_call]] orelse {\n        return [[SLOT bool_default]];\n    };\n    \n    const value = input[equals_idx + 1..];\n    \n    const parsed = [[SLOT parse_call]] catch {\n        return .{ .string = value };\n    };\n    \n    return .{ .integer = parsed };\n}`,
      slots: [
        { name: "union_kw", answer: "union(enum)", hint: "tagged", decoys: ["enum", "struct", "union"] },
        { name: "index_call", answer: `std.mem.indexOfScalar(u8, input, '=')`, hint: "search", decoys: [`std.mem.indexOf(u8, input, "=")`, `input.indexOf('=')`, `std.mem.indexOfScalar(input, '=')`] },
        { name: "bool_default", answer: ".{ .boolean = true }", hint: "literal", decoys: [".{ .boolean = false }", "Flag{ .boolean = true }", ".boolean = true"] },
        { name: "parse_call", answer: "std.fmt.parseInt(i64, value, 10)", hint: "parse", decoys: ["std.fmt.parseInt(value, 10)", "std.fmt.parse(i64, value)", "i64.parse(value, 10)"] },
      ],
      prompt: "Pick the tagged-union keyword, the indexOfScalar search, the boolean default, and the parseInt call.",
    },

    "medium-tagged-unions-29": {
      template:
        `const std = @import("std");\n\npub const Expr = union(enum) {\n    number: i32,\n    add: [[SLOT add_struct]],\n    multiply: struct { left: *const Expr, right: *const Expr },\n};\n\npub fn eval(expr: Expr) i32 {\n    return switch (expr) {\n        .number => |n| [[SLOT num_eval]],\n        .add => |op| [[SLOT add_eval]],\n        .multiply => |op| [[SLOT mul_eval]],\n    };\n}\n`,
      slots: [
        { name: "add_struct", answer: "struct { left: *const Expr, right: *const Expr }", hint: "shape", decoys: ["struct { left: Expr, right: Expr }", "struct { *const Expr, *const Expr }", "struct { left: i32, right: i32 }"] },
        { name: "num_eval", answer: "n", hint: "value", decoys: ["0", "op.value", "expr"] },
        { name: "add_eval", answer: "eval(op.left.*) + eval(op.right.*)", hint: "recurse", decoys: ["op.left + op.right", "op.left.* + op.right.*", "eval(op.left) + eval(op.right)"] },
        { name: "mul_eval", answer: "eval(op.left.*) * eval(op.right.*)", hint: "recurse", decoys: ["op.left * op.right", "op.left.* * op.right.*", "eval(op.left) * eval(op.right)"] },
      ],
      prompt: "Build the add struct shape and the three switch arms of the recursive evaluator.",
    },

    "medium-tagged-unions-39": {
      template:
        `const std = @import("std");\n\npub const Expr = [[SLOT union_kw]] {\n    number: i32,\n    add: struct {\n        left: *const Expr,\n        right: *const Expr,\n    },\n    multiply: struct {\n        left: *const Expr,\n        right: *const Expr,\n    },\n};\n\npub fn evaluate(expr: Expr) i32 {\n    return switch (expr) {\n        .number => |n| [[SLOT num_eval]],\n        .add => |op| [[SLOT add_eval]],\n        .multiply => |op| [[SLOT mul_eval]],\n    };\n}\n`,
      slots: [
        { name: "union_kw", answer: "union(enum)", hint: "tagged", decoys: ["enum", "struct", "union"] },
        { name: "num_eval", answer: "n", hint: "value", decoys: ["0", "op.value", "expr"] },
        { name: "add_eval", answer: "evaluate(op.left.*) + evaluate(op.right.*)", hint: "recurse", decoys: ["op.left + op.right", "op.left.* + op.right.*", "evaluate(op.left) + evaluate(op.right)"] },
        { name: "mul_eval", answer: "evaluate(op.left.*) * evaluate(op.right.*)", hint: "recurse", decoys: ["op.left * op.right", "op.left.* * op.right.*", "evaluate(op.left) * evaluate(op.right)"] },
      ],
      prompt: "Build the tagged union and the three switch arms of the recursive evaluator.",
    },

    "hard-slices-1": {
      template:
        `const std = @import("std");\nconst Allocator = std.mem.Allocator;\n\npub fn slidingWindowMax(allocator: Allocator, arr: []const i32, k: usize) ![]i32 {\n    if (arr.len == 0 or k == 0) return try allocator.alloc(i32, 0);\n    \n    const result_len = arr.len - k + 1;\n    var result = try allocator.alloc(i32, result_len);\n    \n    // Deque stores indices - we'll use ArrayList as deque\n    var deque: std.ArrayList(usize) = .empty;\n    defer deque.deinit(allocator);\n    \n    // Process first window\n    var i: usize = 0;\n    while (i < k) : (i += 1) {\n        // Remove elements smaller than current from back\n        while (deque.items.len > 0 and [[SLOT back_check]]) {\n            _ = [[SLOT pop_call]];\n        }\n        try deque.append(allocator, i);\n    }\n    \n    result[0] = [[SLOT window_max]];\n    \n    // Process remaining windows\n    var result_idx: usize = 1;\n    while (i < arr.len) : (i += 1) {\n        // Remove indices outside current window from front\n        while (deque.items.len > 0 and [[SLOT front_check]]) {\n            _ = [[SLOT front_remove]];\n        }\n        \n        // Remove elements smaller than current from back\n        while (deque.items.len > 0 and arr[deque.items[deque.items.len - 1]] <= arr[i]) {\n            _ = deque.pop();\n        }\n        \n        try deque.append(allocator, i);\n        result[result_idx] = arr[deque.items[0]];\n        result_idx += 1;\n    }\n    \n    return result;\n}`,
      slots: [
        { name: "back_check", answer: "arr[deque.items[deque.items.len - 1]] <= arr[i]", hint: "predicate", decoys: ["arr[deque.items[0]] <= arr[i]", "deque.items[0] < arr[i]", "arr[i] >= deque.last()"] },
        { name: "pop_call", answer: "deque.pop()", hint: "deque", decoys: ["deque.popOrNull()", "deque.items.pop()", "deque.remove(deque.items.len - 1)"] },
        { name: "window_max", answer: "arr[deque.items[0]]", hint: "lookup", decoys: ["arr[deque.items[deque.items.len - 1]]", "arr[0]", "arr[deque[0]]"] },
        { name: "front_check", answer: "deque.items[0] <= i - k", hint: "predicate", decoys: ["deque.items[0] < i - k", "deque.items[0] >= i + k", "i - k <= 0"] },
        { name: "front_remove", answer: "deque.orderedRemove(0)", hint: "deque", decoys: ["deque.pop()", "deque.swapRemove(0)", "deque.removeFront()"] },
      ],
      prompt: "Wire up the deque's back/front checks, the pop/orderedRemove calls, and the window-max lookup.",
    },

    "hard-structs-14": {
      template:
        `const std = @import("std");\nconst Allocator = std.mem.Allocator;\n\npub const MemoryPool = struct {\n    memory: []u8,\n    block_size: usize,\n    block_count: usize,\n    free_list: []bool,\n    allocator: Allocator,\n    \n    pub fn init(block_size: usize, block_count: usize) !MemoryPool {\n        var gpa = [[SLOT dbg_alloc]];\n        const allocator = gpa.allocator();\n        \n        const aligned_size = [[SLOT align_call]];\n        const memory = try allocator.alloc(u8, aligned_size * block_count);\n        const free_list = try allocator.alloc(bool, block_count);\n        \n        for (free_list) |*slot| {\n            [[SLOT slot_init]]\n        }\n        \n        return MemoryPool{\n            .memory = memory,\n            .block_size = aligned_size,\n            .block_count = block_count,\n            .free_list = free_list,\n            .allocator = allocator,\n        };\n    }\n    \n    pub fn alloc(self: *MemoryPool) ?*anyopaque {\n        for (self.free_list, 0..) |is_free, i| {\n            if (is_free) {\n                self.free_list[i] = false;\n                const offset = i * self.block_size;\n                return @ptrCast(&self.memory[offset]);\n            }\n        }\n        return null;\n    }\n    \n    pub fn free(self: *MemoryPool, ptr: *anyopaque) !void {\n        const ptr_addr = @intFromPtr(ptr);\n        const base_addr = @intFromPtr(self.memory.ptr);\n        \n        if ([[SLOT bound_check]]) {\n            return error.InvalidPointer;\n        }\n        \n        const offset = ptr_addr - base_addr;\n        if (offset % self.block_size != 0) {\n            return error.InvalidPointer;\n        }\n        \n        const index = offset / self.block_size;\n        if (index >= self.block_count) {\n            return error.InvalidPointer;\n        }\n        \n        if (self.free_list[index]) {\n            return error.DoubleFree;\n        }\n        \n        self.free_list[index] = true;\n    }\n    \n    pub fn available(self: *const MemoryPool) usize {\n        var count: usize = 0;\n        for (self.free_list) |is_free| {\n            if (is_free) count += 1;\n        }\n        return count;\n    }\n    \n    pub fn deinit(self: *MemoryPool) void {\n        self.allocator.free(self.memory);\n        self.allocator.free(self.free_list);\n    }\n};`,
      slots: [
        { name: "dbg_alloc", answer: "std.heap.DebugAllocator(.{}){}", hint: "allocator", decoys: ["std.heap.GeneralPurposeAllocator(.{}){}", "std.heap.page_allocator", "std.testing.allocator"] },
        { name: "align_call", answer: "std.mem.alignForward(usize, block_size, @alignOf(usize))", hint: "align", decoys: ["block_size", "@alignOf(usize)", "std.mem.alignBackward(usize, block_size, @alignOf(usize))"] },
        { name: "slot_init", answer: "slot.* = true;", hint: "init", decoys: ["slot.* = false;", "slot = true;", "free_list[i] = true;"] },
        { name: "bound_check", answer: "ptr_addr < base_addr or ptr_addr >= base_addr + self.memory.len", hint: "guard", decoys: ["ptr_addr == base_addr", "ptr_addr > base_addr", "ptr_addr <= base_addr or ptr_addr > base_addr + self.memory.len"] },
      ],
      prompt: "Pick the debug allocator, the align-forward call, the free-list init, and the bounds check.",
    },

    "hard-error-unions-35": {
      template:
        `const std = @import("std");\n\npub fn parseStateMachine(commands: []const []const u8) !?[]const u8 {\n    var state: ?[]const u8 = null;\n    var counter: u32 = 0;\n\n    for (commands) |cmd| {\n        if (std.mem.eql(u8, cmd, "START")) {\n            if ([[SLOT start_already]]) return error.InvalidTransition;\n            state = "READY";\n        } else if (std.mem.startsWith(u8, cmd, "PROCESS ")) {\n            if (state == null or std.mem.eql(u8, state.?, "SHUTDOWN")) return error.InvalidTransition;\n            const arg = [[SLOT arg_slice]];\n            const n = [[SLOT parse_int]] catch return error.InvalidCommand;\n            if (n == 0 or n > 1000) return error.InvalidCommand;\n            if ([[SLOT overflow_check]]) return error.CounterOverflow;\n            counter += n;\n            state = "RUNNING";\n        } else if (std.mem.eql(u8, cmd, "STOP")) {\n            if (state == null or !std.mem.eql(u8, state.?, "RUNNING")) return error.InvalidTransition;\n            state = "READY";\n        } else if (std.mem.eql(u8, cmd, "SHUTDOWN")) {\n            if (state == null or !std.mem.eql(u8, state.?, "READY")) return error.InvalidTransition;\n            state = null;\n        } else {\n            return error.InvalidCommand;\n        }\n    }\n\n    return state;\n}`,
      slots: [
        { name: "start_already", answer: "state != null", hint: "guard", decoys: ["state == null", "state == \"READY\"", "counter > 0"] },
        { name: "arg_slice", answer: "cmd[8..]", hint: "slice", decoys: ["cmd[7..]", "cmd[9..]", "cmd[\"PROCESS \".len..]"] },
        { name: "parse_int", answer: "std.fmt.parseInt(u32, arg, 10)", hint: "parse", decoys: ["std.fmt.parse(u32, arg)", "std.fmt.parseInt(arg, 10)", "u32.parse(arg)"] },
        { name: "overflow_check", answer: "counter + n > 1000", hint: "limit", decoys: ["counter > 1000", "n > 1000", "counter + n >= 1000"] },
      ],
      prompt: "Wire up the START guard, the PROCESS arg slice, the parseInt call, and the overflow check.",
    },
  },

  // ── a-to-ts ─────────────────────────────────────────────────────
  "a-to-ts": {
    "format-greeting": {
      template:
        `\nfunction formatGreeting(name: [[SLOT param_type]]): [[SLOT return_type]] {\n  return [[SLOT body]];\n}\n\nmodule.exports = { formatGreeting };\n`,
      slots: [
        { name: "param_type", answer: "string", hint: "type", decoys: ["String", "any", "number"] },
        { name: "return_type", answer: "string", hint: "type", decoys: ["String", "any", "void"] },
        { name: "body", answer: '`Hello, ${name}!`', hint: "expression", decoys: ['"Hello, " + name + "!"', '"Hello, ${name}!"', '`Hello, name!`'] },
      ],
      prompt: "Type the parameter and return type, and pick the right interpolated greeting.",
    },

    "reverse-array": {
      template:
        `\nfunction reverseArray(nums: [[SLOT param_type]]): number[] {\n  return [[SLOT spread_expr]].[[SLOT array_method]]();\n}\n\nmodule.exports = { reverseArray };\n`,
      slots: [
        { name: "param_type", answer: "number[]", hint: "type", decoys: ["number", "Array<number>", "number[][]"] },
        { name: "spread_expr", answer: "[...nums]", hint: "copy", decoys: ["nums", "[nums]", "Array.of(nums)"] },
        { name: "array_method", answer: "reverse", hint: "method", decoys: ["sort", "reduce", "reversed"] },
      ],
      prompt: "Type the parameter, copy the array, then call the reverse method.",
    },

    "is-palindrome": {
      template:
        `\nfunction isPalindrome(s: string): boolean {\n  return s [[SLOT compare_op]] [[SLOT spread_str]].reverse().join([[SLOT joiner]]);\n}\n\nmodule.exports = { isPalindrome };\n`,
      slots: [
        { name: "compare_op", answer: "===", hint: "operator", decoys: ["==", "!=", ">="] },
        { name: "spread_str", answer: "[...s]", hint: "copy", decoys: ["s", "Array(s)", "[s]"] },
        { name: "joiner", answer: `""`, hint: "separator", decoys: [`" "`, `","`, `null`] },
      ],
      prompt: "Pick the strict-equality operator, the spread copy of the string, and the empty join separator.",
    },
  },

  // ── challenges-lua-handwritten ──────────────────────────────────
  "challenges-lua-handwritten": {
    "medium-string-patterns-26": {
      template:
        `function extract_quotes(text)\n  local results = [[SLOT init_results]]\n  local pattern = [[SLOT pattern]]\n  for match in text:[[SLOT iter]](pattern) do\n    local unescaped = match:gsub('\\\\(.)', [[SLOT unescape_replace]])\n    table.insert(results, unescaped)\n  end\n  return results\nend`,
      slots: [
        { name: "init_results", answer: "{}", hint: "table", decoys: ["nil", `""`, "()"] },
        { name: "pattern", answer: `'"([^"\\\\]*(\\\\.[^"\\\\]*)*)"`, hint: "regex", decoys: [`'"([^"]*)"'`, `'%b""'`, `'(.-)'`] },
        { name: "iter", answer: "gmatch", hint: "method", decoys: ["match", "find", "gsub"] },
        { name: "unescape_replace", answer: `'%1'`, hint: "capture", decoys: [`'%0'`, `'\\\\1'`, `'\\\\%1'`] },
      ],
      prompt: "Drop in the table init, the quoted-substring pattern, the iterator method, and the capture replacement.",
    },
  },

  // ── challenges-sway-handwritten ─────────────────────────────────
  "challenges-sway-handwritten": {
    "hard-string-utf8-40": {
      template:
        `contract;\n\npub fn is_char_boundary(bytes: Vec<u8>, index: u64) -> bool {\n    let len = bytes.len();\n    \n    // Index equal to length is a valid boundary (end of string)\n    if [[SLOT eq_check]] {\n        return true;\n    }\n    \n    // Index out of bounds\n    if [[SLOT gt_check]] {\n        return false;\n    }\n    \n    let byte = [[SLOT byte_get]];\n    \n    // Check if this byte is NOT a continuation byte (10xxxxxx)\n    // Continuation bytes have the pattern 10xxxxxx (0x80-0xBF)\n    // A valid character boundary must not start with 10xxxxxx\n    if (byte & [[SLOT mask_high]]) == [[SLOT cont_pattern]] {\n        return false;\n    }\n    \n    true\n}`,
      slots: [
        { name: "eq_check", answer: "index == len", hint: "predicate", decoys: ["index < len", "index <= len", "len == index"] },
        { name: "gt_check", answer: "index > len", hint: "predicate", decoys: ["index >= len", "index < 0", "len > index"] },
        { name: "byte_get", answer: "bytes.get(index).unwrap()", hint: "lookup", decoys: ["bytes[index]", "bytes.at(index)", "bytes.get(index)"] },
        { name: "mask_high", answer: "0xC0", hint: "mask", decoys: ["0x80", "0xFF", "0xE0"] },
        { name: "cont_pattern", answer: "0x80", hint: "pattern", decoys: ["0xC0", "0x00", "0x40"] },
      ],
      prompt: "Wire up the boundary checks and the UTF-8 continuation-byte mask test.",
    },
  },

  // ── challenges-move-handwritten ─────────────────────────────────
  "challenges-move-handwritten": {
    "hard-abilities-key-store-copy-drop-5": {
      template:
        `module challenge::abilities {\n    struct Resource has [[SLOT resource_abilities]] {\n        value: u64,\n    }\n    \n    struct Capability<[[SLOT phantom_param]]> has [[SLOT cap_abilities]] {}\n    \n    struct MasterKey has [[SLOT key_abilities]] {}\n    \n    public fun create_resource(value: u64): Resource {\n        Resource { value }\n    }\n    \n    public fun issue_capability<T: store>(_resource: &Resource): Capability<Resource> {\n        Capability<Resource> {}\n    }\n    \n    public fun read_with_capability(cap: &Capability<Resource>): u64 {\n        // In real implementation, cap would reference the actual resource\n        // For this kata, we demonstrate the type system works correctly\n        let _ = cap;\n        42 // Simplified - real implementation would need resource access\n    }\n    \n    public fun consume_with_key(resource: Resource, _key: &MasterKey): u64 {\n        let Resource { value } = resource;\n        value\n    }\n    \n    #[test]\n    fun test_resource_creation() {\n        let res = create_resource(100);\n        let Resource { value } = res;\n        assert!(value == 100, 0);\n    }\n    \n    #[test]\n    fun test_capability_copy() {\n        let res = create_resource(42);\n        let cap = issue_capability(&res);\n        let cap2 = copy cap; // Must compile - cap has copy ability\n        let _ = cap;\n        let _ = cap2;\n        let Resource { value: _ } = res;\n    }\n    \n    #[test]\n    fun test_master_key_drop() {\n        let key = MasterKey {};\n        let res = create_resource(99);\n        let value = consume_with_key(res, &key);\n        assert!(value == 99, 1);\n        // key automatically dropped - has drop ability\n    }\n    \n    #[test]\n    fun test_consumption_with_key() {\n        let key = MasterKey {};\n        let res = create_resource(256);\n        let extracted = consume_with_key(res, &key);\n        assert!(extracted == 256, 2);\n    }\n}`,
      slots: [
        { name: "resource_abilities", answer: "store", hint: "abilities", decoys: ["key", "key, store", "copy, drop"] },
        { name: "phantom_param", answer: "phantom T: store", hint: "generics", decoys: ["T", "T: copy", "phantom T"] },
        { name: "cap_abilities", answer: "copy, store", hint: "abilities", decoys: ["copy, drop", "key, store", "store"] },
        { name: "key_abilities", answer: "key, store, drop", hint: "abilities", decoys: ["key", "key, store", "copy, store, drop"] },
      ],
      prompt: "Pick the correct ability sets for the Resource, Capability, and MasterKey.",
    },

    "hard-modules-26": {
      template:
        `module challenge::vault {\n    struct Vault<T> has key {\n        owner: address,\n        data: T,\n    }\n\n    public fun new<T>(owner: address, data: T): Vault<T> {\n        [[SLOT vault_construct]]\n    }\n\n    public fun owner<T>(vault: &Vault<T>): address {\n        vault.owner\n    }\n\n    public fun borrow<T>(vault: &Vault<T>): &T {\n        [[SLOT borrow_ret]]\n    }\n\n    public fun update<T>(vault: &mut Vault<T>, new_data: T) {\n        vault.data = new_data;\n    }\n\n    public fun unwrap<T>(vault: Vault<T>): T {\n        let Vault { owner: _, data } = vault;\n        data\n    }\n}\n\nmodule challenge::access {\n    struct AdminCap has key, store {\n        id: u64,\n    }\n\n    public fun mint(id: u64): AdminCap {\n        AdminCap { id }\n    }\n\n    public fun verify(_cap: &AdminCap): bool {\n        true\n    }\n}\n\nmodule challenge::solution {\n    use challenge::vault::{Self, Vault};\n    use challenge::access::{Self, AdminCap};\n\n    const UNAUTHORIZED: u64 = 1;\n\n    public fun create_vault<T>(owner: address, data: T): Vault<T> {\n        vault::new(owner, data)\n    }\n\n    public fun read_vault<T>(vault: &Vault<T>, reader: address): &T {\n        assert!([[SLOT auth_check]], UNAUTHORIZED);\n        vault::borrow(vault)\n    }\n\n    public fun update_vault<T>(vault: &mut Vault<T>, cap: &AdminCap, new_data: T) {\n        assert!([[SLOT verify_check]], UNAUTHORIZED);\n        vault::update(vault, new_data);\n    }\n\n    public fun destroy_vault<T>(vault: Vault<T>, cap: &AdminCap): T {\n        assert!(access::verify(cap), UNAUTHORIZED);\n        vault::unwrap(vault)\n    }\n}`,
      slots: [
        { name: "vault_construct", answer: "Vault { owner, data }", hint: "constructor", decoys: ["Vault { data, owner }", "Vault::new(owner, data)", "new Vault(owner, data)"] },
        { name: "borrow_ret", answer: "&vault.data", hint: "reference", decoys: ["vault.data", "&vault", "&data"] },
        { name: "auth_check", answer: "vault::owner(vault) == reader", hint: "predicate", decoys: ["vault::owner(vault) != reader", "reader == vault.owner", "owner == reader"] },
        { name: "verify_check", answer: "access::verify(cap)", hint: "predicate", decoys: ["access::verify(_cap)", "cap.verify()", "verify(cap)"] },
      ],
      prompt: "Build the vault constructor, the borrow return, and the two access-control predicates.",
    },
  },

  // ── challenges-scala-handwritten ────────────────────────────────
  "challenges-scala-handwritten": {
    "hard-pattern-matching-35": {
      template:
        `def matchPath(pattern: String, path: String): Boolean = {\n  val patternSegs = pattern.split([[SLOT split_arg]]).toList\n  val pathSegs = path.split([[SLOT split_arg]]).toList\n  \n  def matches(ps: List[String], ts: List[String]): Boolean = (ps, ts) match {\n    case [[SLOT nil_case]] => true\n    case (Nil, _) => false\n    case ([[SLOT double_star]] :: pRest, _) =>\n      // ** can match 0 or more segments\n      // Try consuming 0, 1, 2, ... segments from target\n      (0 to ts.length).exists { n =>\n        matches(pRest, [[SLOT drop_call]])\n      }\n    case ([[SLOT single_star]] :: pRest, _ :: tRest) =>\n      // * matches exactly one segment\n      matches(pRest, tRest)\n    case ("*" :: _, Nil) => false\n    case (p :: pRest, t :: tRest) if p == t =>\n      // Literal match\n      matches(pRest, tRest)\n    case _ => false\n  }\n  \n  matches(patternSegs, pathSegs)\n}`,
      slots: [
        { name: "split_arg", answer: `"\\\\."`, hint: "regex", decoys: [`"."`, `"/"`, `"\\\\\\\\"`] },
        { name: "nil_case", answer: "(Nil, Nil)", hint: "pattern", decoys: ["(Nil, _)", "Nil", "(_, _)"] },
        { name: "double_star", answer: `"**"`, hint: "wildcard", decoys: [`"*"`, `"?"`, `"..."`] },
        { name: "single_star", answer: `"*"`, hint: "wildcard", decoys: [`"**"`, `"?"`, `"_"`] },
        { name: "drop_call", answer: "ts.drop(n)", hint: "list-op", decoys: ["ts.take(n)", "ts.tail", "ts(n)"] },
      ],
      prompt: "Wire up the split delimiter, the base case, the two wildcard literals, and the drop call.",
    },

    "hard-option-and-either-37": {
      template:
        `case class Config(port: Int, timeout: Int, mode: String, maxRetries: Option[Int])\n\ndef parseConfig(raw: Map[String, String]): Either[String, Config] = {\n  for {\n    portStr <- raw.get("port").toRight("Invalid port: missing")\n    port <- portStr.[[SLOT to_int]].toRight("Invalid port: not an integer")\n    _ <- [[SLOT cond_fn]](port >= 1 && port <= 65535, (), "Invalid port: out of range")\n    \n    timeoutStr <- raw.get("timeout").toRight("Invalid timeout: missing")\n    timeout <- timeoutStr.toIntOption.toRight("Invalid timeout: not an integer")\n    _ <- Either.cond(timeout > 0, (), "Invalid timeout: must be positive")\n    \n    modeStr <- raw.get("mode").toRight("Invalid mode: missing")\n    mode <- Either.cond(\n      [[SLOT mode_set]].contains(modeStr),\n      modeStr,\n      "Invalid mode: must be dev, staging, or prod"\n    )\n    \n    maxRetries <- raw.get("maxRetries") match {\n      case None => Right(None)\n      case Some(str) => \n        str.toIntOption\n          .toRight("Invalid maxRetries: not an integer")\n          .[[SLOT chain_op]] { n =>\n            Either.cond(n >= 0 && n <= 10, Some(n), "Invalid maxRetries: must be 0-10")\n          }\n    }\n  } yield Config(port, timeout, mode, maxRetries)\n}`,
      slots: [
        { name: "to_int", answer: "toIntOption", hint: "parse", decoys: ["toInt", "toLong", "toDouble"] },
        { name: "cond_fn", answer: "Either.cond", hint: "either", decoys: ["Option.cond", "Either.when", "if"] },
        { name: "mode_set", answer: `Set("dev", "staging", "prod")`, hint: "set", decoys: [`List("dev", "staging", "prod")`, `Array("dev", "staging", "prod")`, `Map("dev" -> "staging" -> "prod")`] },
        { name: "chain_op", answer: "flatMap", hint: "monad", decoys: ["map", "filter", "withFilter"] },
      ],
      prompt: "Pick the safe int parser, the Either guard, the mode whitelist, and the monadic chain operator.",
    },
  },

  // ── mastering-bitcoin ───────────────────────────────────────────
  "mastering-bitcoin": {
    "ch01-reading-double-spend": {
      template:
        `function trySpendTwice(sender, addressA, addressB, amount) {\n  // The mempool exhausts the small UTXO that backed the first send,\n  // so the second send (same sender, same amount) ends up trying to\n  // spend an UTXO that's already encumbered. The harness rejects.\n  const { txid: [[SLOT dest_alias]] } = chain.send(sender, addressA, amount);\n  let secondError = [[SLOT init_err]];\n  // Drain the sender to one UTXO so the second send genuinely runs\n  // out of inputs. We do this by sending the same large amount again\n  // expecting the second send to fail because the UTXO is already in\n  // the mempool / the sender's balance won't cover both.\n  try {\n    const huge = [[SLOT balance_fn]](sender.p2wpkhAddress);\n    chain.send(sender, addressB, huge + amount);\n  } catch (e) {\n    secondError = [[SLOT error_extract]];\n  }\n  return { firstTxid, secondError };\n}\n`,
      slots: [
        { name: "dest_alias", answer: "firstTxid", hint: "rename", decoys: ["txid", "secondTxid", "id"] },
        { name: "init_err", answer: "null", hint: "literal", decoys: ["undefined", `""`, "0"] },
        { name: "balance_fn", answer: "chain.balance", hint: "chain", decoys: ["chain.getBalance", "chain.utxos", "wallet.balance"] },
        { name: "error_extract", answer: "e instanceof Error ? e.message : String(e)", hint: "ternary", decoys: ["e.message", "String(e)", "e.toString()"] },
      ],
      prompt: "Wire up the destructure rename, the null init, the balance call, and the safe error-message extractor.",
    },

    "ch03-chain-fee-math": {
      template:
        `function sendWithFee() {\n  const { txid } = chain.send(\n    chain.accounts[[[SLOT sender_idx]]],\n    chain.accounts[[[SLOT recipient_idx]]].p2wpkhAddress,\n    [[SLOT amount]], // 1 BTC\n    [[SLOT fee]],        // explicit fee\n  );\n  [[SLOT mine_call]];\n  return txid;\n}\n`,
      slots: [
        { name: "sender_idx", answer: "0", hint: "index", decoys: ["1", "2", `"sender"`] },
        { name: "recipient_idx", answer: "3", hint: "index", decoys: ["0", "1", "2"] },
        { name: "amount", answer: "100_000_000n", hint: "bigint", decoys: ["1n", "1_000_000n", "100_000_000"] },
        { name: "fee", answer: "2_500n", hint: "bigint", decoys: ["0n", "1_000n", "25_000n"] },
        { name: "mine_call", answer: "chain.mine()", hint: "chain", decoys: ["chain.advance()", "chain.confirm()", "mine()"] },
      ],
      prompt: "Pick the sender/recipient indices, the bigint amounts, and the chain.mine() call.",
    },
  },

  // ── challenges-sql-handwritten ──────────────────────────────────
  "challenges-sql-handwritten": {
    "hard-subqueries-14": {
      template:
        `-- Schema setup\nCREATE TABLE employees (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  manager_id INTEGER,\n  salary INTEGER NOT NULL\n);\n\nINSERT INTO employees VALUES\n  (1, 'Alice', NULL, 150000),\n  (2, 'Bob', 1, 120000),\n  (3, 'Carol', 1, 110000),\n  (4, 'Dave', 2, 90000),\n  (5, 'Eve', 2, 85000);\n\n-- expect: 5 rows, {"id": 1, "name": "Alice", "depth": 0, "subordinate_count": 4, "total_salary_cost": 555000}\n-- expect: 5 rows, {"id": 2, "name": "Bob", "depth": 1, "subordinate_count": 2, "total_salary_cost": 295000}\n-- expect: 5 rows, {"id": 3, "name": "Carol", "depth": 1, "subordinate_count": 0, "total_salary_cost": 110000}\n-- expect: 5 rows, {"id": 4, "name": "Dave", "depth": 2, "subordinate_count": 0, "total_salary_cost": 90000}\n-- expect: 5 rows, {"id": 5, "name": "Eve", "depth": 2, "subordinate_count": 0, "total_salary_cost": 85000}\nWITH RECURSIVE\n  hierarchy AS (\n    SELECT id, name, manager_id, salary, [[SLOT init_depth_clause]]\n    FROM employees\n    WHERE [[SLOT null_check]]\n    UNION ALL\n    SELECT e.id, e.name, e.manager_id, e.salary, [[SLOT incr_clause]]\n    FROM employees e\n    JOIN hierarchy h ON e.manager_id = h.id\n  ),\n  subordinates AS (\n    SELECT h1.id AS manager_id, h2.id AS subordinate_id\n    FROM hierarchy h1\n    JOIN hierarchy h2 ON h2.depth > h1.depth\n    WHERE EXISTS (\n      WITH RECURSIVE path AS (\n        SELECT id, manager_id FROM employees WHERE id = h2.id\n        UNION ALL\n        SELECT e.id, e.manager_id FROM employees e JOIN path p ON e.id = p.manager_id\n      )\n      SELECT 1 FROM path WHERE id = h1.id\n    )\n  )\nSELECT\n  h.id,\n  h.name,\n  h.depth,\n  COALESCE((SELECT [[SLOT count_clause]] FROM subordinates WHERE manager_id = h.id), 0) AS subordinate_count,\n  h.salary + COALESCE((SELECT SUM(e2.salary) FROM subordinates s JOIN employees e2 ON s.subordinate_id = e2.id WHERE s.manager_id = h.id), 0) AS total_salary_cost\nFROM hierarchy h\n[[SLOT order_clause]];`,
      slots: [
        { name: "init_depth_clause", answer: "0 AS depth", hint: "seed", decoys: ["1 AS depth", "NULL AS depth", "'root' AS depth"] },
        { name: "null_check", answer: "manager_id IS NULL", hint: "predicate", decoys: ["manager_id IS NOT NULL", "manager_id = 0", "id = 1"] },
        { name: "incr_clause", answer: "h.depth + 1", hint: "recurse", decoys: ["h.depth - 1", "depth + 1", "h.depth"] },
        { name: "count_clause", answer: "COUNT(*)", hint: "aggregate", decoys: ["COUNT(id)", "COUNT(DISTINCT id)", "SUM(1)"] },
        { name: "order_clause", answer: "ORDER BY h.id", hint: "ordering", decoys: ["ORDER BY h.depth", "GROUP BY h.id", "ORDER BY h.id DESC"] },
      ],
      prompt: "Wire up the recursive CTE seed, the root-row filter, the recursion step, the aggregator, and the final ordering.",
    },
  },

  // ── learning-go ─────────────────────────────────────────────────
  "learning-go": {
    "create-go-module": {
      template:
        `package main\n\nimport (\n\t"strings"\n)\n\n// ParseGoMod extracts the module name from a go.mod file's contents.\nfunc ParseGoMod(contents string) string {\n\tlines := strings.[[SLOT split_fn]](contents, "\\n")\n\tfor _, line := range lines {\n\t\tline = strings.[[SLOT trim_fn]](line)\n\t\tif line == "" {\n\t\t\tcontinue\n\t\t}\n\t\tif strings.[[SLOT prefix_check]](line, [[SLOT prefix_str]]) {\n\t\t\treturn strings.TrimPrefix(line, "module ")\n\t\t}\n\t}\n\treturn ""\n}\n\nfunc main() {\n\tgomod := "module hello_world\\n\\ngo 1.20\\n"\n\tresult := ParseGoMod(gomod)\n\tprintln(result)\n}\n`,
      slots: [
        { name: "split_fn", answer: "Split", hint: "stringutil", decoys: ["SplitN", "Fields", "SplitAfter"] },
        { name: "trim_fn", answer: "TrimSpace", hint: "stringutil", decoys: ["Trim", "TrimLeft", "TrimRight"] },
        { name: "prefix_check", answer: "HasPrefix", hint: "stringutil", decoys: ["HasSuffix", "Contains", "EqualFold"] },
        { name: "prefix_str", answer: `"module "`, hint: "literal", decoys: [`"module"`, `"go "`, `"package "`] },
      ],
      prompt: "Fill in the strings package functions and the module-line prefix.",
    },

    "format-code-with-gofmt": {
      template:
        `package main\n\nimport (\n\t"fmt"\n)\n\nfunc BuildCommand() string {\n\treturn [[SLOT build_cmd]]\n}\n\nfunc RunBinary(moduleName string) string {\n\treturn [[SLOT run_concat]]\n}\n\nfunc main() {\n\tfmt.Println([[SLOT arg1]])\n\tfmt.Println([[SLOT arg2]])\n}\n`,
      slots: [
        { name: "build_cmd", answer: `"go build"`, hint: "literal", decoys: [`"go run"`, `"go install"`, `"build"`] },
        { name: "run_concat", answer: `"./" + moduleName`, hint: "expression", decoys: [`moduleName`, `"./" + moduleName + ".exe"`, `"./moduleName"`] },
        { name: "arg1", answer: "BuildCommand()", hint: "call", decoys: [`"BuildCommand"`, `BuildCommand`, `Build()`] },
        { name: "arg2", answer: `RunBinary("hello_world")`, hint: "call", decoys: [`RunBinary(moduleName)`, `RunBinary("hello world")`, `RunBinary()`] },
      ],
      prompt: "Drop in the build command, the run-path concat, and the two Println arguments.",
    },

    "function-with-multiple-returns": {
      template:
        `package main\n\nimport (\n\t"errors"\n\t"fmt"\n)\n\n// splitAndSum divides nums at pivot and returns sums of each half.\n// Returns an error if pivot is out of bounds.\nfunc splitAndSum(nums []int, pivot int) [[SLOT return_sig]] {\n\tif pivot < 0 || pivot >= len(nums) {\n\t\treturn 0, 0, [[SLOT err_construct]]("pivot out of bounds")\n\t}\n\tleftSum := 0\n\tfor i := 0; i < pivot; i++ {\n\t\tleftSum += nums[i]\n\t}\n\trightSum := 0\n\tfor i := pivot; i < len(nums); i++ {\n\t\trightSum += nums[i]\n\t}\n\treturn leftSum, rightSum, [[SLOT nil_kw]]\n}\n\nfunc main() {\n\tleft, right, err := splitAndSum([]int{1, 2, 3, 4, 5}, 2)\n\tif [[SLOT err_check]] {\n\t\tfmt.Println("Error:", err)\n\t} else {\n\t\tfmt.Println("Left:", left, "Right:", right)\n\t}\n}`,
      slots: [
        { name: "return_sig", answer: "(int, int, error)", hint: "signature", decoys: ["(int, int)", "(int, error)", "(int, int, string)"] },
        { name: "err_construct", answer: "errors.New", hint: "errors", decoys: ["fmt.Errorf", "errors.Wrap", "panic"] },
        { name: "nil_kw", answer: "nil", hint: "literal", decoys: ["null", "0", "false"] },
        { name: "err_check", answer: "err != nil", hint: "condition", decoys: ["err == nil", "err", "!err"] },
      ],
      prompt: "Wire up the multi-return signature, the error constructor, the nil success-return, and the error check.",
    },

    "check-cancellation-in-loop": {
      template:
        `package main\n\nimport (\n\t"context"\n\t"fmt"\n\t"time"\n)\n\n// SumUntilCancelled adds integers 1, 2, 3, ... in a loop.\n// Every 1000 iterations, it yields briefly and checks if ctx is cancelled.\n// Returns the partial sum and the cancellation error (or nil if never cancelled).\nfunc SumUntilCancelled(ctx context.Context) (int64, error) {\n\tvar sum int64\n\tvar i int64 = 1\n\n\tfor {\n\t\tsum += i\n\t\ti++\n\n\t\t// Check for cancellation every 1000 iterations. The tiny\n\t\t// Sleep matters on the Go Playground sandbox, whose virtual\n\t\t// clock doesn't advance during pure CPU loops — without it,\n\t\t// context.WithTimeout would never fire here and the program\n\t\t// would hit the playground's 5 s hard limit. On real Go it's\n\t\t// negligible.\n\t\tif i%[[SLOT period]] == 0 {\n\t\t\ttime.Sleep(time.Microsecond)\n\t\t\tif err := [[SLOT cause_fn]](ctx); err != nil {\n\t\t\t\treturn sum, err\n\t\t\t}\n\t\t}\n\t}\n}\n\nfunc main() {\n\t// Create a context that cancels after 100 milliseconds\n\tctx, cancel := [[SLOT timeout_fn]]([[SLOT bg_fn]](), 100*time.Millisecond)\n\t[[SLOT defer_kw]] cancel()\n\n\tsum, err := SumUntilCancelled(ctx)\n\tif err != nil {\n\t\tfmt.Println("Cancelled! Partial sum:", sum)\n\t\tfmt.Println("Error:", err)\n\t} else {\n\t\tfmt.Println("Completed without cancellation. Sum:", sum)\n\t}\n}\n`,
      slots: [
        { name: "period", answer: "1000", hint: "constant", decoys: ["100", "10000", "1"] },
        { name: "cause_fn", answer: "context.Cause", hint: "context", decoys: ["ctx.Err", "context.Err", "errors.Cause"] },
        { name: "timeout_fn", answer: "context.WithTimeout", hint: "context", decoys: ["context.WithDeadline", "context.WithCancel", "context.WithValue"] },
        { name: "bg_fn", answer: "context.Background", hint: "context", decoys: ["context.TODO", "context.New", "context.Empty"] },
        { name: "defer_kw", answer: "defer", hint: "keyword", decoys: ["go", "return", "func"] },
      ],
      prompt: "Drop the cancellation period, the cause extractor, and the WithTimeout / Background / defer wiring.",
    },

    "write-first-test": {
      template:
        `package main\n\nfunc Double(n int) int {\n\t[[SLOT return_kw]] [[SLOT multiplicand]] * [[SLOT multiplier]]\n}\n`,
      slots: [
        { name: "return_kw", answer: "return", hint: "keyword", decoys: ["func", "var", "if"] },
        { name: "multiplicand", answer: "n", hint: "param", decoys: ["result", "value", "x"] },
        { name: "multiplier", answer: "2", hint: "constant", decoys: ["1", "0", "10"] },
      ],
      prompt: "Build the doubling expression: return keyword, the parameter, the multiplier.",
    },

    "write-fuzz-test": {
      template:
        `package main\n\nimport (\n\t"errors"\n\t"strconv"\n)\n\n// ParseInt converts a string to an integer, returning an error for invalid input.\nfunc ParseInt(s string) (int, error) {\n\tif [[SLOT empty_check]] { return [[SLOT error_zero]], errors.New([[SLOT error_msg]]) }\n\treturn [[SLOT parse_fn]](s)\n}\n`,
      slots: [
        { name: "empty_check", answer: `s == ""`, hint: "condition", decoys: [`s == nil`, `s == "0"`, `*s == 0`] },
        { name: "error_zero", answer: "0", hint: "literal", decoys: ["-1", "nil", "1"] },
        { name: "error_msg", answer: `"empty string"`, hint: "literal", decoys: [`"invalid input"`, `"parse error"`, `"empty"`] },
        { name: "parse_fn", answer: "strconv.Atoi", hint: "stdlib", decoys: ["strconv.ParseInt", "strconv.Itoa", "fmt.Sscanf"] },
      ],
      prompt: "Drop in the empty-string guard, the zero return, the error message, and the parse function.",
    },

    "exercise-optimize-struct-layout": {
      template:
        `package main\n\nimport (\n\t"fmt"\n\t"unsafe"\n)\n\n// BadLayout has suboptimal field ordering (48 bytes).\ntype BadLayout struct {\n\tActive    bool\n\tTimestamp int64\n\tCount     int32\n\tName      [10]byte\n\tEnabled   bool\n\tValue     float64\n\tFlags     uint16\n}\n\n// OptimizedLayout — same fields, packed into 40 bytes (the minimum\n// achievable given Go's 8-byte alignment for the int64/float64 pair).\ntype OptimizedLayout struct {\n\t[[SLOT first_field]]\n\tValue     float64\n\tCount     int32\n\tFlags     uint16\n\tActive    bool\n\tEnabled   bool\n\tName      [10]byte\n}\n\n// LayoutInfo holds analysis results for a struct.\ntype LayoutInfo struct {\n\tTotalSize uintptr\n\tOffsets   map[string]uintptr\n}\n\n// AnalyzeLayout returns size + per-field offsets for the named layout.\nfunc AnalyzeLayout(layoutType string) LayoutInfo {\n\tinfo := LayoutInfo{Offsets: map[string]uintptr{}}\n\tswitch layoutType {\n\tcase "bad":\n\t\tvar b BadLayout\n\t\tinfo.TotalSize = unsafe.Sizeof(b)\n\t\tinfo.Offsets["Active"] = unsafe.Offsetof(b.Active)\n\t\tinfo.Offsets["Timestamp"] = unsafe.Offsetof(b.Timestamp)\n\t\tinfo.Offsets["Count"] = unsafe.Offsetof(b.Count)\n\t\tinfo.Offsets["Name"] = unsafe.Offsetof(b.Name)\n\t\tinfo.Offsets["Enabled"] = unsafe.Offsetof(b.Enabled)\n\t\tinfo.Offsets["Value"] = unsafe.Offsetof(b.Value)\n\t\tinfo.Offsets["Flags"] = unsafe.Offsetof(b.Flags)\n\tcase "optimized":\n\t\tvar o OptimizedLayout\n\t\tinfo.TotalSize = [[SLOT sizeof_fn]](o)\n\t\tinfo.Offsets["Timestamp"] = [[SLOT offsetof_fn]](o.Timestamp)\n\t\tinfo.Offsets["Value"] = unsafe.Offsetof(o.Value)\n\t\tinfo.Offsets["Count"] = unsafe.Offsetof(o.Count)\n\t\tinfo.Offsets["Flags"] = unsafe.Offsetof(o.Flags)\n\t\tinfo.Offsets["Active"] = unsafe.Offsetof(o.Active)\n\t\tinfo.Offsets["Enabled"] = unsafe.Offsetof(o.Enabled)\n\t\tinfo.Offsets["Name"] = unsafe.Offsetof(o.Name)\n\t}\n\treturn info\n}\n\nfunc main() {\n\tbad := AnalyzeLayout("bad")\n\topt := AnalyzeLayout("optimized")\n\tfmt.Printf("BadLayout: %d bytes\\n", bad.TotalSize)\n\tfmt.Printf("OptimizedLayout: %d bytes\\n", opt.TotalSize)\n\tfmt.Printf("Saved: %d bytes\\n", [[SLOT diff_calc]])\n}\n`,
      slots: [
        { name: "first_field", answer: "Timestamp int64", hint: "ordering", decoys: ["Active    bool", "Name      [10]byte", "Count     int32"] },
        { name: "sizeof_fn", answer: "unsafe.Sizeof", hint: "unsafe", decoys: ["unsafe.Alignof", "len", "cap"] },
        { name: "offsetof_fn", answer: "unsafe.Offsetof", hint: "unsafe", decoys: ["unsafe.Sizeof", "unsafe.Pointer", "reflect.Offsetof"] },
        { name: "diff_calc", answer: "bad.TotalSize-opt.TotalSize", hint: "expression", decoys: ["opt.TotalSize-bad.TotalSize", "bad.TotalSize+opt.TotalSize", "bad.TotalSize"] },
      ],
      prompt: "Order the optimized struct's first field, name the unsafe-package helpers, and compute the byte savings.",
    },
  },
};

async function main() {
  const args = process.argv.slice(2);
  let onlyCourse = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--course") onlyCourse = args[++i];
  }
  let written = 0;
  for (const [courseId, lessons] of Object.entries(BATCHES)) {
    if (onlyCourse && courseId !== onlyCourse) continue;
    const dir = join(MANUAL, courseId);
    await mkdir(dir, { recursive: true });
    for (const [lessonId, raw] of Object.entries(lessons)) {
      // A payload may be a plain object (literal-template entry) OR a
      // Promise<payload> returned by `splice()`. Await both kinds —
      // `await` on a non-thenable just yields the value.
      const payload = await raw;
      const path = join(dir, `${lessonId}.json`);
      await writeFile(path, JSON.stringify(payload, null, 2), "utf-8");
      written += 1;
      console.log(`  wrote ${courseId}/${lessonId}`);
    }
  }
  console.log(`\n[author-blocks-batch] wrote ${written} manual file(s).`);
  if (written === 0) {
    console.log("  (BATCHES is empty — edit this file to add payloads.)");
  }
}

main().catch((err) => {
  console.error("[author-blocks-batch] failed:", err);
  process.exit(1);
});
