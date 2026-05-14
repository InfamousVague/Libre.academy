/// Python test runner.
///
/// Strategy: write the user's solution to a temp scratch file, drop
/// the hidden tests next to it (both inside `.libre/scratch/`), and
/// run `python -m unittest` against the tests file. The tests file
/// is expected to `from solution import *` — which works because we
/// always name the user's file `solution.py` and run from the
/// project directory.
///
/// We don't use pytest here even though it's more popular — pytest
/// isn't shipped with Python by default, and we'd rather not force
/// the learner to `pip install pytest` before running their first
/// exercise. `unittest` ships with CPython since forever, so the
/// runner Just Works on a fresh Python install.
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { readMaybe, resetScratch, spawnCapture, which } from "./util";
import type { RunInput, RunResult, Runner } from "./types";

export const pythonRunner: Runner = {
  displayName: "Python (unittest)",
  languages: ["python"],
  async run(input: RunInput): Promise<RunResult> {
    /// Prefer `python3` (most macOS / Linux installs alias it), fall
    /// back to `python` for Windows / pyenv setups where the binary
    /// is just `python`. Some installs only have one of the two —
    /// we check both so the toolchain-missing error doesn't fire
    /// spuriously.
    const python = (await which("python3")) ?? (await which("python"));
    if (!python) {
      return {
        status: "error",
        output:
          "No `python3` or `python` binary on PATH. Install Python 3.10+ from https://www.python.org and reload the VSCode window.",
        summary: "Python toolchain missing",
      };
    }

    const scratch = path.join(input.scratchDir, "py-scratch");
    await resetScratch(scratch);

    const userCode = (await readMaybe(input.userFilePath)) ?? "";
    const tests =
      (await readMaybe(path.join(input.workspaceDir, ".libre", "tests.py"))) ?? "";
    await fs.writeFile(path.join(scratch, "solution.py"), userCode, "utf8");
    await fs.writeFile(path.join(scratch, "test_solution.py"), tests, "utf8");

    /// `-m unittest` auto-discovers tests under `test_*.py`. `-v`
    /// gets us one line per test which renders nicely in the output
    /// channel. `-b` buffers stdout from the tests themselves so a
    /// passing test doesn't print noise (failures still print
    /// their captured output).
    const result = await spawnCapture(
      python,
      ["-m", "unittest", "discover", "-v", "-s", scratch, "-p", "test_*.py"],
      {
        cwd: scratch,
        timeoutMs: 60_000,
        env: {
          ...process.env,
          /// Disable bytecode caching — we rewrite solution.py on
          /// every run and don't want stale .pyc files to confuse
          /// the import system.
          PYTHONDONTWRITEBYTECODE: "1",
          /// Force UTF-8 output regardless of the user's locale so
          /// the output channel doesn't garble non-ASCII test names.
          PYTHONIOENCODING: "utf-8",
        },
      },
    );

    const combined = trim(`${result.stdout}\n${result.stderr}`);
    if (result.timedOut) {
      return {
        status: "error",
        output:
          combined +
          "\n\nRunner timed out after 60s. The exercise might have an infinite loop — try again.",
        summary: "Timed out",
      };
    }
    const passed = result.exitCode === 0;
    return {
      status: passed ? "pass" : "fail",
      output: combined,
      exitCode: result.exitCode,
      summary: passed
        ? "All tests passed"
        : "Tests failed — see the Libre output panel",
    };
  },
};

function trim(s: string): string {
  return s.replace(/\s+$/u, "");
}
