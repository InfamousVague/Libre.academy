/// Token usage accounting.
///
/// Ollama's `/api/chat` returns `prompt_eval_count` and
/// `eval_count` on the final NDJSON line of a completion. We
/// surface both per-turn and accumulated-across-turns figures so
/// the UI can show:
///
///   - This-turn input tokens (everything we sent the model:
///     system + history + new user message + tool schemas).
///   - This-turn output tokens (what the model wrote back, both
///     visible content and the structured tool_calls).
///   - Run total — sum across every turn of an agent run, reset
///     when the user starts a new conversation.
///
/// The Rust side reads the counts off Ollama's stream and forwards
/// them on the `AgentTurnResponse` payload. This module is the
/// JS-side aggregator + formatters.

export interface TurnUsage {
  /// Input tokens for this single turn. `null` when the model
  /// didn't report it (some older Ollama builds skip the field).
  promptTokens: number | null;
  /// Output tokens for this single turn.
  completionTokens: number | null;
  /// Wall-clock duration for the request, in milliseconds. Ollama
  /// includes `total_duration` in nanoseconds; the Rust side
  /// divides for us.
  durationMs: number | null;
}

export interface RunUsage {
  /// Number of turns elapsed in this run.
  turns: number;
  /// Sum across every turn so far.
  promptTokens: number;
  completionTokens: number;
  /// Total time spent in `ai_chat_agent_turn`. Useful for
  /// surfacing "agent thought for 12s across 3 turns" in the UI.
  durationMs: number;
}

export const EMPTY_RUN_USAGE: RunUsage = {
  turns: 0,
  promptTokens: 0,
  completionTokens: 0,
  durationMs: 0,
};

/// Fold one turn's usage into the running total. Missing fields
/// (model didn't report them) are treated as zeros — better to
/// undercount than reset the total to NaN.
export function accumulateUsage(
  prior: RunUsage,
  turn: TurnUsage,
): RunUsage {
  return {
    turns: prior.turns + 1,
    promptTokens: prior.promptTokens + (turn.promptTokens ?? 0),
    completionTokens: prior.completionTokens + (turn.completionTokens ?? 0),
    durationMs: prior.durationMs + (turn.durationMs ?? 0),
  };
}

/// Pretty-print a token count for the UI ("1.2k", "847", "12.4k").
/// Three-digit precision is plenty for a status strip.
export function formatTokens(n: number): string {
  if (n < 1000) return n.toString();
  const kilos = n / 1000;
  if (kilos < 10) return `${kilos.toFixed(1)}k`;
  return `${Math.round(kilos)}k`;
}

/// Pretty-print a duration for the UI ("847ms", "12.4s", "2m 03s").
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const totalSec = Math.round(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}
