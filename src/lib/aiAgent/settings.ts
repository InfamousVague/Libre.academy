/// User-tunable settings that affect agent behaviour.
///
/// Persisted to `localStorage` under a single key (`libre.aiAgent.settings`)
/// so the Settings sheet's writes survive reloads. The shape is
/// JSON-friendly so we can roundtrip it without a schema migration
/// dance.
///
/// Defaults are conservative — destructive tools gated, low-
/// confidence prompts elevated, no auto-approve. Power users flip
/// the toggles on once they trust the agent.

export interface AiAgentSettings {
  /// When true, the agent loop dispatches every tool call without
  /// surfacing the approve / deny chip. The user opt-in to this is
  /// a deliberate "I trust the agent in my sandbox" choice; it
  /// short-circuits the safety gate that otherwise stops the loop
  /// on every destructive call.
  ///
  /// Even with auto-approve on, the agent STILL pauses for
  /// clarification when the model emits `request_user_input` — that
  /// path needs human input to make progress.
  autoApprove: boolean;
  /// When auto-approve is on, this setting controls whether LOW
  /// CONFIDENCE tool calls bypass the gate or still pause. Default
  /// true (the gate still fires for low-confidence calls) because
  /// the whole point of the confidence channel is to catch "the
  /// model is unsure even though it's auto-approving everything
  /// else".
  pauseOnLowConfidence: boolean;
  /// Whether to show the token-usage strip in the agent UI. Some
  /// users find it cluttery; off by default for first-time users.
  showTokens: boolean;
  /// Whether to show the confidence meter. On by default — it's
  /// one of the headline new features.
  showConfidence: boolean;
  /// Concurrency cap for parallel tool calls within a single turn.
  /// Reserved for a future enhancement; today the loop dispatches
  /// sequentially. Stored for forward compatibility.
  toolConcurrency: number;
  /// Maximum agent turns per run. The hard ceiling is 50 (anything
  /// higher and the UI can't render the timeline cleanly); the
  /// default of 20 covers ~95% of real-world workflows. Power users
  /// can crank it up for complex multi-file refactors.
  maxTurns: number;
}

export const DEFAULT_SETTINGS: AiAgentSettings = {
  autoApprove: false,
  pauseOnLowConfidence: true,
  showTokens: true,
  showConfidence: true,
  toolConcurrency: 1,
  maxTurns: 20,
};

const STORAGE_KEY = "libre.aiAgent.settings";

/// Load settings from localStorage, falling back to defaults for
/// any missing field. Safe to call from SSR / tests where
/// `localStorage` is absent.
export function loadSettings(): AiAgentSettings {
  if (typeof localStorage === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AiAgentSettings>;
    return mergeSettings(parsed);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/// Persist a settings object. Tolerates `localStorage` quota
/// exhaustion (silently noops) — the settings will roundtrip
/// through memory for the current session and re-fail to save on
/// the next change; better than crashing the panel on a full quota.
export function saveSettings(s: AiAgentSettings): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota / disabled — accept silent failure */
  }
}

/// Merge a partial settings object onto the defaults. Used by
/// `loadSettings` to handle forward-compat (older saved blobs
/// missing newer fields) and by the UI for in-place updates.
export function mergeSettings(
  partial: Partial<AiAgentSettings>,
): AiAgentSettings {
  return {
    autoApprove: partial.autoApprove ?? DEFAULT_SETTINGS.autoApprove,
    pauseOnLowConfidence:
      partial.pauseOnLowConfidence ?? DEFAULT_SETTINGS.pauseOnLowConfidence,
    showTokens: partial.showTokens ?? DEFAULT_SETTINGS.showTokens,
    showConfidence: partial.showConfidence ?? DEFAULT_SETTINGS.showConfidence,
    toolConcurrency: clampInt(
      partial.toolConcurrency ?? DEFAULT_SETTINGS.toolConcurrency,
      1,
      4,
    ),
    maxTurns: clampInt(partial.maxTurns ?? DEFAULT_SETTINGS.maxTurns, 1, 50),
  };
}

function clampInt(n: number, lo: number, hi: number): number {
  const v = Math.floor(n);
  if (!Number.isFinite(v)) return lo;
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}
