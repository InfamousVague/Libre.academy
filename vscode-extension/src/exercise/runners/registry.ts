/// Per-language runner lookup. Add a runner here and it becomes
/// available across the whole extension; the run-tests command
/// dispatches based on the lesson's `language` field.
///
/// MVP coverage: Rust, TypeScript/JavaScript, Python. Everything else
/// falls back to the "not supported yet" path, which surfaces a
/// "please use the desktop app for this language" message rather than
/// silently no-op'ing.
import { pythonRunner } from "./python";
import { rustRunner } from "./rust";
import { typescriptRunner } from "./typescript";
import type { Runner } from "./types";

const RUNNERS: Runner[] = [rustRunner, typescriptRunner, pythonRunner];

export function runnerFor(language: string): Runner | null {
  for (const r of RUNNERS) {
    if (r.languages.includes(language)) return r;
  }
  return null;
}

export function supportedLanguages(): string[] {
  return RUNNERS.flatMap((r) => r.languages);
}
