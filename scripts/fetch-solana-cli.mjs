#!/usr/bin/env node
/// Download + extract the Solana / Agave CLI distribution for the
/// host platform into `src-tauri/resources/solana/`. Tauri's
/// `tauri build` step picks it up via the `bundle.resources` glob
/// in tauri.conf.json and ships it inside the app — at runtime,
/// `chains/svm.rs::svm_build_bpf` resolves
/// `<resources>/solana/bin/cargo-build-sbf` and shells out to it
/// for lessons that compile real Rust → BPF.
///
/// Strategy: download once and cache. The Agave distribution is
/// ~500MB unpacked (LLVM toolchain + linker + cargo-build-sbf +
/// `solana` CLI itself); re-fetching every build would be wasteful,
/// so we stash the tarball under `src-tauri/.cache/` and re-extract
/// from cache on subsequent runs.
///
/// Multi-platform: Tauri produces one bundle per build target, and
/// only the host platform's Solana CLI ships per build. CI that
/// targets multiple platforms re-runs this script per matrix job.
///
/// Pinning Agave to a stable release means `cargo-build-sbf`'s
/// behaviour against course-shipped Rust programs stays
/// reproducible. Bumping the version is fine — keep it on the
/// stable line (avoid edge / nightly).
///
/// Why bundle vs install-on-demand: the user picked "bundled" in
/// the architecture decision (~500MB extra binary footprint vs
/// frictionless lesson runs). Install-on-demand would require
/// network at lesson time and a multi-minute wait the first time
/// a learner clicks Run on a deploy-style exercise.

import {
  createWriteStream,
  existsSync,
} from "node:fs";
import { mkdir, readdir, rename, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TAURI_DIR = join(ROOT, "src-tauri");
const RESOURCES_DIR = join(TAURI_DIR, "resources", "solana");
const CACHE_DIR = join(TAURI_DIR, ".cache");

/// Pinned Agave release. Bumping is fine — keep it on the stable
/// line (`v2.0.x` / `v2.1.x` / etc., not edge / nightly). The
/// release tag is what the GitHub URL uses; `solana --version`
/// reports it once installed.
///
/// Latest stable as of Phase 5f authoring. Update when bumping —
/// frontend's diagnostics check reads the binary's `--version` to
/// detect stale installs.
const SOLANA_VERSION = "2.0.18";

function detectPlatform() {
  switch (process.platform) {
    case "darwin":
      return process.arch === "arm64"
        ? { triple: "aarch64-apple-darwin" }
        : { triple: "x86_64-apple-darwin" };
    case "linux":
      return process.arch === "arm64"
        ? { triple: "aarch64-unknown-linux-gnu" }
        : { triple: "x86_64-unknown-linux-gnu" };
    case "win32":
      // Agave only publishes x86_64 windows builds today. ARM users
      // can run the x64 binary under x86 emulation; that's a known
      // limitation upstream — we'd notice if Anza adds an aarch64
      // windows tarball and update here.
      return { triple: "x86_64-pc-windows-msvc" };
    default:
      throw new Error(`unsupported platform: ${process.platform}-${process.arch}`);
  }
}

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function fetchToFile(url, dst) {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`download failed: ${url} → ${res.status}`);
  }
  const total = Number(res.headers.get("content-length") || 0);
  let received = 0;
  let lastTick = 0;
  const reader = res.body.getReader();
  const writer = createWriteStream(dst);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    writer.write(value);
    const now = Date.now();
    if (now - lastTick > 250) {
      lastTick = now;
      const pct = total ? ((received / total) * 100).toFixed(1) : "?";
      process.stdout.write(
        `\r  downloading… ${(received / 1e6).toFixed(1)} MB${
          total ? ` / ${(total / 1e6).toFixed(1)} MB (${pct}%)` : ""
        }    `,
      );
    }
  }
  writer.end();
  await new Promise((r) => writer.on("close", r));
  process.stdout.write("\n");
}

function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("exit", (code) =>
      code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`)),
    );
    child.on("error", rej);
  });
}

async function extract(archive, dst) {
  await ensureDir(dst);
  // Agave ships as `.tar.bz2`. macOS / Linux tar handles bz2 with
  // `-j`. Windows' bsdtar (ships with Win10+) also handles it.
  // `--strip-components=1` collapses the wrapper directory the
  // archive contains (typically `solana-release/...`).
  await run("tar", ["-xjf", archive, "-C", dst, "--strip-components=1"]);
}

async function main() {
  const { triple } = detectPlatform();
  const filename = `solana-release-${triple}.tar.bz2`;
  const url = `https://github.com/anza-xyz/agave/releases/download/v${SOLANA_VERSION}/${filename}`;
  const cachePath = join(CACHE_DIR, `solana-${SOLANA_VERSION}-${triple}.tar.bz2`);

  console.log(`fetch-solana-cli`);
  console.log(`  platform: ${triple}`);
  console.log(`  version:  v${SOLANA_VERSION}`);
  console.log(`  url:      ${url}`);
  console.log(`  resources: ${RESOURCES_DIR}`);

  await ensureDir(CACHE_DIR);
  if (!existsSync(cachePath)) {
    console.log(`  caching to ${cachePath}…`);
    await fetchToFile(url, cachePath);
  } else {
    console.log(`  cache hit (${cachePath})`);
  }

  // Wipe + re-extract so a previous build's stale install doesn't
  // mix files with the new release. ~10s cost on warm cache.
  if (existsSync(RESOURCES_DIR)) {
    await rm(RESOURCES_DIR, { recursive: true, force: true });
  }
  console.log(`  extracting…`);
  await extract(cachePath, RESOURCES_DIR);

  // Sanity check — fail fast if the layout isn't what svm_build_bpf
  // expects. The Agave release tarball ships:
  //   bin/solana          — the main CLI
  //   bin/cargo-build-sbf — the BPF compiler driver
  //   bin/sbf-tools/      — LLVM toolchain
  //   bin/rust/           — pinned rustc for BPF target
  const cliExt = process.platform === "win32" ? ".exe" : "";
  const expected = [
    join(RESOURCES_DIR, "bin", `solana${cliExt}`),
    join(RESOURCES_DIR, "bin", `cargo-build-sbf${cliExt}`),
  ];
  for (const f of expected) {
    if (!existsSync(f)) {
      throw new Error(`expected ${f} after extract, not found`);
    }
  }
  console.log(`fetch-solana-cli OK`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
