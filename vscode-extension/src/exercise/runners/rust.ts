/// Rust test runner.
///
/// Strategy: assemble a minimal single-binary Cargo project on the
/// fly under `<workspaceDir>/.libre/cargo-scratch/`, drop the user's
/// `solution.rs` in as `src/lib.rs`, append the hidden test module,
/// and run `cargo test`. Single-binary because it's the cheapest
/// thing that gives us `cargo test`'s nicely-formatted output without
/// rebuilding from scratch every invocation (Cargo's incremental
/// cache lives under `target/`, which we keep across runs).
///
/// Single-file format expectation: the lesson's `starter` defines
/// the function(s) under test; the lesson's `tests` defines a
/// `#[cfg(test)] mod tests { ... }` block that imports them via
/// `use super::*;`. This matches the on-disk shape every Rustlings-
/// derived course uses.
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { readMaybe, spawnCapture, which } from "./util";
import type { RunInput, RunResult, Runner } from "./types";

export const rustRunner: Runner = {
  displayName: "Rust (cargo)",
  languages: ["rust"],
  async run(input: RunInput): Promise<RunResult> {
    const cargo = await which("cargo");
    if (!cargo) {
      return {
        status: "error",
        output:
          "`cargo` not found on PATH. Install the Rust toolchain from https://rustup.rs and reload the VSCode window.",
        summary: "Rust toolchain missing",
      };
    }

    /// Each lesson gets its own scratch project so `cargo test`'s
    /// target/ cache stays valid across runs (re-running with the
    /// same code shouldn't recompile std). The scratch dir survives
    /// across runs deliberately — only `src/` gets rewritten.
    const projectDir = path.join(input.scratchDir, "cargo-scratch");
    await fs.mkdir(projectDir, { recursive: true });
    await ensureCargoManifest(projectDir, input.course.id, input.lesson.id);

    const userCode = (await readMaybe(input.userFilePath)) ?? "";
    const tests = (await readMaybe(path.join(input.workspaceDir, ".libre", "tests.rs"))) ?? "";
    /// Append the tests verbatim. Rustlings-style tests reference
    /// `super::*` so the test mod must live INSIDE the same file as
    /// the user's solution — we don't put them in a separate file.
    const combined = userCode + "\n\n" + tests + "\n";
    const srcDir = path.join(projectDir, "src");
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(path.join(srcDir, "lib.rs"), combined, "utf8");

    /// `cargo test --quiet` collapses the build output so the panel
    /// only shows test pass/fail lines. We still get full failure
    /// detail (Cargo prints the assertion + backtrace verbatim).
    const result = await spawnCapture(cargo, ["test", "--quiet"], {
      cwd: projectDir,
      timeoutMs: 120_000,
      env: {
        ...process.env,
        /// Disable colourised output — VSCode's output channel
        /// renders ANSI escape codes as literal `[...]m`
        /// garbage.
        CARGO_TERM_COLOR: "never",
        /// Single test thread = deterministic output ordering, makes
        /// failure messages easier to read in a scrollback.
        RUST_TEST_THREADS: "1",
      },
    });

    const combinedOutput = trim(`${result.stdout}\n${result.stderr}`);
    if (result.timedOut) {
      return {
        status: "error",
        output:
          combinedOutput +
          "\n\nRunner timed out after 120s. The exercise might have an infinite loop, or a slow first-time compile — try again.",
        summary: "Timed out",
      };
    }
    const passed = result.exitCode === 0;
    return {
      status: passed ? "pass" : "fail",
      output: combinedOutput,
      exitCode: result.exitCode,
      summary: passed
        ? "All tests passed"
        : "Tests failed — see the Libre output panel",
    };
  },
};

/// Idempotently ensure a Cargo.toml exists in the scratch project.
/// We only write it on first call per lesson — if the user has
/// hand-edited the manifest we don't want to clobber it.
async function ensureCargoManifest(
  projectDir: string,
  courseId: string,
  lessonId: string,
): Promise<void> {
  const manifestPath = path.join(projectDir, "Cargo.toml");
  try {
    await fs.access(manifestPath);
    return;
  } catch {
    // doesn't exist yet
  }
  /// Library crate. The user's solution lives in src/lib.rs and
  /// the tests are a child `mod tests` of the same file. We use
  /// edition 2021 because every Rustlings-derived course we ship
  /// targets it; future courses can override via their own
  /// `files[]` workbench.
  const manifest = `[package]
name = "libre_${sanitiseCrateName(courseId)}_${sanitiseCrateName(lessonId)}"
version = "0.0.0"
edition = "2021"

[lib]
path = "src/lib.rs"

[profile.test]
opt-level = 0
debug = false
`;
  await fs.writeFile(manifestPath, manifest, "utf8");
  /// Tell git (if the user has the scratch dir under version
  /// control by accident) to ignore the build artefacts.
  await fs.writeFile(
    path.join(projectDir, ".gitignore"),
    "target/\n",
    "utf8",
  );
}

/// Crate names must be `[a-z0-9_]+`. Course/lesson ids are usually
/// already kebab-case, so we just lower-case and replace dashes.
function sanitiseCrateName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 48);
}

function trim(s: string): string {
  return s.replace(/\s+$/u, "");
}
