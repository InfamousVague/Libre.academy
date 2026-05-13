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
