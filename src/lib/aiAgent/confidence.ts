/// Confidence + clarification primitives.
///
/// The agent's system prompt instructs the model to suffix every
/// assistant message with a self-rated confidence tag:
///
///   <confidence>0.85</confidence>
///
/// Range is 0.0 (no idea) to 1.0 (certain). The agent loop parses
/// the tag, strips it from the visible content, and surfaces the
/// number to the UI's confidence meter. Low values (< 0.5) gate
/// destructive tools behind a "the model isn't sure — really do
/// this?" confirmation step regardless of the auto-approve
/// setting.
///
/// Why a tag in content instead of a structured field: Ollama's
/// `/api/chat` doesn't expose model-emitted metadata channels
/// beyond `tool_calls`. We could pack confidence into a
/// `report_confidence` tool call, but that doubles the agent's
/// turn count and confuses smaller models that struggle with
/// tool-orchestration overhead. A pure-text tag the model reads
/// and writes in the same place it writes the rest of its reply
/// is reliable across every checkpoint we've tried.

/// Result of parsing one assistant message for confidence info.
export interface ConfidenceParse {
  /// Stripped content with the tag removed. Pass this to the chat
  /// UI so the user doesn't see the tag in their bubble.
  cleaned: string;
  /// Parsed confidence in [0, 1]. `null` when the model didn't
  /// emit a tag — the UI shows a neutral "unrated" indicator in
  /// that case rather than guessing a default.
  confidence: number | null;
  /// Optional reason the model gave for its confidence (when the
  /// model includes a `reason="..."` attribute on the tag). The
  /// clarification UI surfaces this so the user knows WHY the
  /// model is unsure.
  reason: string | null;
}

// Tolerant regex — the inner capture accepts ANY non-empty,
// non-tag content (numbers, percentages, negative numbers, even
// garbage). The numericness check happens in the parser; matching
// the tag at the regex level instead means we always STRIP the
// tag from the visible content, even when the value is bogus.
// Without this tolerance, a stray `<confidence>oops</confidence>`
// would leak into the chat bubble verbatim.
const CONFIDENCE_RE =
  /<confidence(?:\s+reason="([^"]*)")?\s*>\s*([^<]*?)\s*<\/confidence>/i;

/// Pull the confidence tag out of an assistant message. If the
/// model emitted multiple tags (rare; usually a hallucination),
/// the FIRST one wins and the rest are stripped silently.
export function parseConfidence(content: string): ConfidenceParse {
  if (!content) {
    return { cleaned: content, confidence: null, reason: null };
  }
  const match = CONFIDENCE_RE.exec(content);
  if (!match) {
    return { cleaned: content, confidence: null, reason: null };
  }
  const raw = parseFloat(match[2]);
  if (!Number.isFinite(raw)) {
    // Garbage in the tag — strip it so the chat shows clean text
    // but report no confidence.
    return {
      cleaned: content.replace(CONFIDENCE_RE, "").trim(),
      confidence: null,
      reason: match[1] ?? null,
    };
  }
  // Some checkpoints emit percentages instead of fractions
  // (`<confidence>85</confidence>` meaning 85 / 100). Normalise.
  const normalized = raw > 1 ? Math.min(raw / 100, 1) : Math.max(raw, 0);
  // Strip every confidence tag, not just the first match — the
  // model occasionally repeats itself.
  const cleaned = content
    .replace(new RegExp(CONFIDENCE_RE.source, "gi"), "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
  return {
    cleaned,
    confidence: normalized,
    reason: match[1]?.trim() || null,
  };
}

/// Classification thresholds. The UI renders three buckets;
/// destructive-tool gating uses the lowest one.
export function classifyConfidence(
  confidence: number | null,
): "unrated" | "low" | "medium" | "high" {
  if (confidence === null) return "unrated";
  if (confidence < 0.5) return "low";
  if (confidence < 0.8) return "medium";
  return "high";
}

/// Whether a confidence value is low enough to trigger an extra
/// confirmation gate. Used by the agent loop to elevate the
/// approval requirement on destructive tools when the model
/// reports low certainty.
export function isLowConfidence(confidence: number | null): boolean {
  return confidence !== null && confidence < 0.5;
}

/// Permissive streaming-confidence parser. The `parseConfidence`
/// above only matches a CLOSED `<confidence>X</confidence>` tag —
/// good for the post-turn canonical content, useless while
/// tokens are still arriving (the closing `</confidence>` won't
/// land until the last chunks). This variant catches the value
/// as soon as `<confidence>X` appears in the content, even
/// without the close tag.
///
/// Used by the React hook's onChunk handler to drive the HUD's
/// confidence meter in real time. Returns null when no opening
/// tag + numeric value has streamed in yet.
export function parseStreamingConfidence(
  content: string,
): number | null {
  if (!content) return null;
  // Accept either:
  //   <confidence>0.85          (still streaming, no close yet)
  //   <confidence reason="...">0.85
  //   <confidence>0.85</confidence>  (already closed)
  //   <confidence>-0.3          (negative — clamped to 0 below)
  // Pulls the number, normalises percentage form (>1) to a
  // fraction, clamps negative to 0. The leading `-?` lets us
  // match negatives so we can clamp rather than ignore them —
  // a missing match would leave the HUD stuck on the prior
  // value when the model emits a bogus negative.
  const re =
    /<confidence(?:\s+[^>]*)?>\s*(-?[0-9]*\.?[0-9]+)/i;
  const m = re.exec(content);
  if (!m) return null;
  const raw = parseFloat(m[1]);
  if (!Number.isFinite(raw)) return null;
  return raw > 1 ? Math.min(raw / 100, 1) : Math.max(raw, 0);
}

/// Rough character-to-token approximation for the HUD's live
/// token counter. Ollama's actual `eval_count` is reported only
/// at the end of the turn — until then we estimate from the
/// length of the streaming content. The 4-chars-per-token ratio
/// is the standard rule-of-thumb for English code/text and
/// matches qwen2.5-coder's tokenizer to within ~15% on
/// real-world test runs (close enough for a HUD readout that
/// snaps to the exact figure once the turn completes).
export function estimateTokens(content: string): number {
  if (!content) return 0;
  return Math.max(1, Math.round(content.length / 4));
}

/// Heuristic confidence update from an observed tool result.
/// The model RARELY emits a `<confidence>` tag reliably — small
/// open-weights checkpoints skip it half the time — so the HUD
/// meter would just sit on "—" through the whole run if we only
/// trusted self-reports. Instead, we derive a running confidence
/// from what we OBSERVE: each successful tool call nudges the
/// bar up; each failure pulls it down; the magnitude depends on
/// the prior value so a string of successes can't push past the
/// ceiling and one bad result can't tank an otherwise-clean run.
///
/// The function is a simple exponential moving average toward a
/// per-event target:
///   - success → target 0.85 (high confidence)
///   - failure → target 0.30 (low confidence, gate destructive
///                            tools)
///
/// Smoothing factor 0.35 means each new event contributes ~35%
/// of the new value; the prior contributes 65%. That's slow
/// enough to be visible (the bar moves a notch per event) but
/// fast enough to actually settle within a 5-tool run.
///
/// Called from the React hook's `onToolResult` so the meter
/// updates immediately after every chip flips ok/fail.
export function deriveConfidenceFromTool(
  prior: number | null,
  toolOk: boolean,
): number {
  const target = toolOk ? 0.85 : 0.3;
  // First observation: snap to the target directly. The "prior"
  // would otherwise default to 0.7 (the "balanced" neutral),
  // which makes a single success only nudge to 0.755 — visually
  // indistinguishable from the neutral default on the first
  // event. Snapping the first event makes the meter actually
  // move on the FIRST tool result.
  if (prior === null) return target;
  const alpha = 0.35;
  const next = prior * (1 - alpha) + target * alpha;
  return Math.max(0, Math.min(1, next));
}
