/// React-side wrapper around the agent loop in `lib/aiAgent/loop.ts`.
///
/// The pure loop module owns the protocol: turn dispatch, tool
/// gating, confidence parsing, retry detection, token accounting.
/// This file's job is to:
///
///   1. Stand up the Tauri transport so the loop has a way to
///      talk to Ollama.
///   2. Bridge the loop's callbacks (onChunk, approveToolCall,
///      requestClarification, …) to React state setters so the
///      panel re-renders.
///   3. Maintain the message log, pending approvals, timeline,
///      and run-usage stats as React state.
///   4. Expose the `send` / `approve` / `deny` / `reset` /
///      `loadMessages` API the existing AiAssistant + TraySurface
///      callers rely on — same shape they had before the
///      refactor, so this is a drop-in replacement.

import { useCallback, useMemo, useRef, useState } from "react";
import type { ToolApproval, ToolCall, ToolDef, ToolResult } from "../lib/aiTools/types";
import { runAgentLoop } from "../lib/aiAgent/loop";
import { createTauriTransport } from "../lib/aiAgent/transport";
import { EMPTY_RUN_USAGE, type RunUsage, type TurnUsage } from "../lib/aiAgent/usage";
import {
  loadSettings,
  resolveEffortParams,
  type AiAgentSettings,
} from "../lib/aiAgent/settings";
import type { AgentMessage as InternalAgentMessage } from "../lib/aiAgent/types";

/// Re-export the message type at this module's path so the
/// existing import sites (`import type { AgentMessage } from
/// "../../hooks/useAiAgent"`) keep working without touching
/// every caller. The shape itself is unchanged across the
/// refactor — augmented user payloads, structured tool calls,
/// confidence + usage on assistant rows.
export type AgentMessage = InternalAgentMessage;

/// One pending approval — a tool call the model proposed that
/// requires user confirmation before the handler runs. Same
/// shape the panel was reading before the refactor.
export interface PendingToolCall {
  call: ToolCall;
  tool: ToolDef;
  approval: ToolApproval;
}

/// One in-flight clarification request — the model called
/// `request_user_input` and we're waiting for the user to type
/// an answer. The panel renders a clarification sheet for each
/// entry; the user's submit resolves the underlying promise so
/// the agent loop can continue.
export interface PendingClarification {
  id: string;
  question: string;
  context?: string;
}

export interface UseAiAgent {
  messages: AgentMessage[];
  streaming: boolean;
  pending: PendingToolCall[];
  /// Pending clarification request (model asked the user a
  /// question via `request_user_input`). At most one is active
  /// at a time — the loop awaits the answer before continuing.
  clarification: PendingClarification | null;
  lastReply: string;
  timeline: ToolResult[];
  error: string | null;
  /// Aggregated token usage across every turn of the current
  /// agent run. Resets to zeros when the user starts a new
  /// conversation via `reset` or `loadMessages`. The token strip
  /// in the agent panel reads this for the HUD.
  usage: RunUsage;
  /// The most-recent assistant turn's self-reported confidence
  /// (0..1). null when the run hasn't emitted a tag yet (the
  /// model didn't include one). The confidence meter in the UI
  /// reads this.
  confidence: number | null;
  /// Current settings (auto-approve etc). Reads-through to
  /// localStorage on mount; in-memory only after that. Update
  /// via `updateSettings`.
  settings: AiAgentSettings;
  send: (prompt: string, augmented?: string) => Promise<void>;
  approve: (toolCallId: string) => void;
  deny: (toolCallId: string) => void;
  /// Submit the user's answer to an open clarification request.
  answerClarification: (answer: string) => void;
  /// Cancel an open clarification request — the loop reads the
  /// cancellation as a tool error and the model decides whether
  /// to abandon or pivot.
  cancelClarification: () => void;
  reset: () => void;
  loadMessages: (messages: AgentMessage[]) => void;
  updateSettings: (next: AiAgentSettings) => void;
}

export function useAiAgent(params: {
  systemPrompt: string;
  tools: readonly ToolDef[];
  model?: string;
  initialMessages?: AgentMessage[];
}): UseAiAgent {
  const { systemPrompt, tools, model, initialMessages } = params;
  const [messages, setMessages] = useState<AgentMessage[]>(
    () => initialMessages ?? [],
  );
  const [streaming, setStreaming] = useState(false);
  const [pending, setPending] = useState<PendingToolCall[]>([]);
  const [clarification, setClarification] =
    useState<PendingClarification | null>(null);
  const [timeline, setTimeline] = useState<ToolResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<RunUsage>(EMPTY_RUN_USAGE);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [settings, setSettings] = useState<AiAgentSettings>(() =>
    loadSettings(),
  );

  // Read-through ref so the loop's callbacks (which are closed
  // over at run-start) always see the latest settings even if
  // the user flips auto-approve mid-run.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Approval resolver bag — same shape as before the refactor.
  // Each entry maps tool call id → resolver of the inner promise
  // the loop is awaiting.
  const approvalResolversRef = useRef<
    Map<string, (decision: "approved" | "denied") => void>
  >(new Map());
  const clarificationResolverRef = useRef<{
    resolve: (answer: string) => void;
    reject: (err: Error) => void;
  } | null>(null);

  // Singleton Tauri transport. Building one per render would
  // allocate fresh closures with no benefit; it's stateless
  // anyway.
  const transport = useMemo(() => createTauriTransport(), []);

  const approve = useCallback((toolCallId: string) => {
    const fn = approvalResolversRef.current.get(toolCallId);
    if (fn) fn("approved");
  }, []);
  const deny = useCallback((toolCallId: string) => {
    const fn = approvalResolversRef.current.get(toolCallId);
    if (fn) fn("denied");
  }, []);

  const answerClarification = useCallback((answer: string) => {
    const r = clarificationResolverRef.current;
    if (!r) return;
    r.resolve(answer);
    clarificationResolverRef.current = null;
    setClarification(null);
  }, []);
  const cancelClarification = useCallback(() => {
    const r = clarificationResolverRef.current;
    if (!r) return;
    r.reject(new Error("User cancelled clarification."));
    clarificationResolverRef.current = null;
    setClarification(null);
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setPending([]);
    setClarification(null);
    setTimeline([]);
    setError(null);
    setUsage(EMPTY_RUN_USAGE);
    setConfidence(null);
    approvalResolversRef.current.clear();
    clarificationResolverRef.current = null;
  }, []);

  const loadMessages = useCallback((msgs: AgentMessage[]) => {
    setMessages(msgs);
    setPending([]);
    setClarification(null);
    setTimeline([]);
    setError(null);
    setUsage(EMPTY_RUN_USAGE);
    setConfidence(null);
    approvalResolversRef.current.clear();
    clarificationResolverRef.current = null;
  }, []);

  const updateSettings = useCallback((next: AiAgentSettings) => {
    setSettings(next);
    // Fire-and-forget save; lib/aiAgent/settings.ts handles
    // localStorage quota / disabled-storage failures internally.
    void Promise.resolve().then(async () => {
      const { saveSettings } = await import("../lib/aiAgent/settings");
      saveSettings(next);
    });
  }, []);

  const send = useCallback(
    async (prompt: string, augmented?: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || streaming) return;
      setError(null);
      setTimeline([]);
      setStreaming(true);
      setUsage(EMPTY_RUN_USAGE);
      setConfidence(null);

      // Synthesise the assistant placeholder ahead of the loop so
      // chunk events have something to land in. The loop's
      // onTurnEnd callback will overwrite it with the canonical
      // assistant message (including tool calls + confidence) on
      // the same turn — this placeholder is just for the streaming
      // text to accrete into.
      const newUserMsg: AgentMessage = {
        role: "user",
        content: trimmed,
        ...(augmented && augmented.trim() !== trimmed
          ? { augmented: augmented.trim() }
          : {}),
      };
      setMessages((prev) => [
        ...prev,
        newUserMsg,
        { role: "assistant", content: "" },
      ]);

      // Streaming chunk handler — append to the trailing
      // placeholder. The loop builds the final canonical assistant
      // message via onTurnEnd which OVERWRITES this — we only need
      // the chunk handler so the user sees text appearing
      // immediately rather than waiting for the full response.
      const onChunk = (chunk: string) => {
        setMessages((prev) => {
          for (let i = prev.length - 1; i >= 0; i--) {
            if (prev[i].role === "assistant") {
              const next = [...prev];
              next[i] = {
                ...prev[i],
                content: (prev[i] as Extract<
                  AgentMessage,
                  { role: "assistant" }
                >).content + chunk,
              };
              return next;
            }
          }
          return prev;
        });
      };

      try {
        await runAgentLoop({
          initialMessages: messages,
          systemPrompt,
          model: model ?? "qwen2.5-coder:7b",
          tools,
          userPrompt: trimmed,
          augmented,
          transport,
          maxTurns: settingsRef.current.maxTurns,
          // Forward the user's `effort` rung as concrete model
          // params. `resolveEffortParams` maps fast/balanced/
          // thorough → temperature + num_ctx + num_predict.
          effortParams: resolveEffortParams(settingsRef.current.effort),
          hooks: {
            onTurnStart: (idx) => {
              // For turn 0 the placeholder was already added
              // before runAgentLoop started (we needed something
              // to render between "user clicked send" and the
              // first chunk landing). For turn 1+, append a
              // fresh placeholder so the next turn's onChunk
              // events have a clean target — otherwise tokens
              // for turn 2 would accrete into turn 1's already-
              // finalised assistant message.
              if (idx === 0) return;
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "" },
              ]);
            },
            onChunk,
            onTurnEnd: (_idx, assistant) => {
              // Each turn has its own placeholder (turn 0's was
              // added before runAgentLoop ran; turn 1+ was
              // added by onTurnStart). Either way, the latest
              // assistant message in the log IS the placeholder
              // for THIS turn — overwrite it with the canonical
              // assistant row carrying tool calls + cleaned
              // content + confidence + usage.
              setMessages((prev) => {
                for (let i = prev.length - 1; i >= 0; i--) {
                  if (prev[i].role === "assistant") {
                    const next = [...prev];
                    next[i] = assistant;
                    return next;
                  }
                }
                return [...prev, assistant];
              });
              if (assistant.confidence !== undefined) {
                setConfidence(assistant.confidence);
              }
              if (assistant.usage) {
                setUsage((prev) => mergeTurnUsage(prev, assistant.usage!));
              }
            },
            approveToolCall: async (call, tool) => {
              // Auto-approve fast path: skip the chip entirely.
              // The `pauseOnLowConfidence` setting overrides — if
              // the model reports < 0.5 we still gate. We pass
              // confidence via the loop's hook signature though;
              // the loop ALSO does its own low-confidence check
              // and elevates auto tools to gated when triggered,
              // so we don't double-implement that logic here.
              if (settingsRef.current.autoApprove) {
                return "approved";
              }
              return new Promise<"approved" | "denied">((resolve) => {
                approvalResolversRef.current.set(call.id, (decision) => {
                  approvalResolversRef.current.delete(call.id);
                  setPending((prev) =>
                    prev.map((p) =>
                      p.call.id === call.id
                        ? { ...p, approval: { kind: decision } }
                        : p,
                    ),
                  );
                  if (decision === "denied") {
                    window.setTimeout(() => {
                      setPending((prev) =>
                        prev.filter((p) => p.call.id !== call.id),
                      );
                    }, 350);
                  }
                  resolve(decision);
                });
                setPending((prev) => [
                  ...prev,
                  { call, tool, approval: { kind: "pending" } },
                ]);
              });
            },
            onToolStart: (call) => {
              setPending((prev) =>
                prev.map((p) =>
                  p.call.id === call.id
                    ? { ...p, approval: { kind: "running" } }
                    : p,
                ),
              );
            },
            onToolResult: (result) => {
              setTimeline((prev) => [...prev, result]);
              setMessages((prev) => [
                ...prev,
                {
                  role: "tool",
                  toolCallId: result.toolCallId,
                  name: result.name,
                  content: result.content,
                },
              ]);
              window.setTimeout(() => {
                setPending((prev) =>
                  prev.filter((p) => p.call.id !== result.toolCallId),
                );
              }, 250);
            },
            requestClarification: async (question, context) => {
              const id = `clar_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`;
              setClarification({ id, question, context });
              return new Promise<string>((resolve, reject) => {
                clarificationResolverRef.current = { resolve, reject };
              });
            },
            onRunComplete: (summary) => {
              setUsage(summary.usage);
              if (summary.finalConfidence !== null) {
                setConfidence(summary.finalConfidence);
              }
              if (summary.endedBy === "maxTurns") {
                setError(
                  "Agent hit the maximum turn limit. Increase it in settings if you need more, or rephrase.",
                );
              }
            },
          },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setStreaming(false);
      }
    },
    [systemPrompt, messages, streaming, model, tools, transport],
  );

  const lastReply = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && m.content) return m.content;
    }
    return "";
  }, [messages]);

  return {
    messages,
    streaming,
    pending,
    clarification,
    lastReply,
    timeline,
    error,
    usage,
    confidence,
    settings,
    send,
    approve,
    deny,
    answerClarification,
    cancelClarification,
    reset,
    loadMessages,
    updateSettings,
  };
}

/// Fold a single turn's usage into the running total. Same logic
/// as `accumulateUsage` in lib/aiAgent/usage.ts but inlined here
/// because the React setter takes the prev value directly.
function mergeTurnUsage(prior: RunUsage, turn: TurnUsage): RunUsage {
  return {
    turns: prior.turns + 1,
    promptTokens: prior.promptTokens + (turn.promptTokens ?? 0),
    completionTokens: prior.completionTokens + (turn.completionTokens ?? 0),
    durationMs: prior.durationMs + (turn.durationMs ?? 0),
  };
}
