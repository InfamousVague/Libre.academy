/// One mounted chat-or-agent surface for the tray. Lives inside
/// TrayPanel and is keyed by `sessionId` from the parent, so
/// switching sessions remounts this whole subtree — which is
/// what lets the chat hook re-initialise its message state from
/// the new session's saved log. (React state initializers only
/// run once per mount; the only clean way to "load" different
/// initial messages is to make a fresh mount.)
///
/// All of the per-session plumbing — chat hook, agent hook, tool
/// registry, cross-window forwarding — lives here so that
/// remount cost is contained to the surface and the surrounding
/// TrayPanel header (status dot, sessions menu, mode toggle)
/// stays mounted across switches.

import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { useAiChatLocal, type ChatMessage } from "../../hooks/useAiChat";
import { useAiAgent, type AgentMessage } from "../../hooks/useAiAgent";
import { buildToolRegistry } from "../../lib/aiTools/tools";
import { useAgentScope } from "../../lib/aiTools/scope";
import AiChatPanel from "../AiAssistant/AiChatPanel";
import AiAgentPanel from "../AiAssistant/AiAgentPanel";
import type { Course } from "../../data/types";
import type { Completion } from "../../hooks/useProgress";
import type { TrayMessage } from "./useTraySessions";
import { useSandboxStreamWriter } from "./useSandboxStreamWriter";

interface Props {
  mode: "chat" | "agent";
  initialMessages: readonly TrayMessage[];
  onClose: () => void;
  /// Called whenever the surface's message log changes. The
  /// parent (`TrayPanel`) forwards to `useTraySessions.syncActive`
  /// so the session's stored snapshot stays current.
  onMessagesChange: (messages: TrayMessage[]) => void;
}

export default function TraySurface({
  mode,
  initialMessages,
  onClose,
  onMessagesChange,
}: Props) {
  // Per-mode initial message split. We branch up-front so the
  // hooks each get only the message shape they understand. State
  // initializers run once per mount; the parent re-keys the
  // surface on session swap, so a chat session never has agent
  // messages threaded in or vice versa.
  const chatInitial = mode === "chat"
    ? (initialMessages as ChatMessage[])
    : undefined;
  const agentInitial = mode === "agent"
    ? (initialMessages as AgentMessage[])
    : undefined;

  // Use the local hook directly (not the picker) because the tray
  // is always desktop — the platform-detection short-circuit in
  // `lib/platform.ts` rules tray out of "mobile".
  const chat = useAiChatLocal(undefined, chatInitial);

  // Mirror chat.messages back to the parent so the session
  // snapshot stays current. Only fires in chat mode — we don't
  // want the chat hook's (empty) state stomping over a stored
  // agent session.
  useEffect(() => {
    if (mode !== "chat") return;
    onMessagesChange(chat.messages);
  }, [chat.messages, mode, onMessagesChange]);

  // ── Agent context fetch ──────────────────────────────────
  //
  // The agent needs the catalog + completion data to fuel its
  // tools. The tray window is a separate WebviewWindow with no
  // access to main's React state, so we fetch via Tauri commands.
  // Static enough across a session that re-fetching only on
  // surface mount is fine (and one fetch per session swap is
  // tolerable noise).
  const [courses, setCourses] = useState<readonly Course[]>([]);
  const [completed, setCompleted] = useState<ReadonlySet<string>>(new Set());
  const [history] = useState<readonly Completion[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cs, comp] = await Promise.all([
          invoke<Course[]>("list_courses_summary").catch(() => [] as Course[]),
          invoke<string[]>("list_completions").catch(() => [] as string[]),
        ]);
        if (cancelled) return;
        setCourses(cs);
        setCompleted(new Set(comp));
      } catch {
        /* Tauri unavailable — agent runs with empty context */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const agentScope = useAgentScope();

  const agentTools = useMemo(
    () =>
      buildToolRegistry({
        courses,
        completed,
        history,
        scope: agentScope.scope,
        updateScope: agentScope.setScope,
        openLesson: (cid, lid) => {
          void emit("libre:tray-open-lesson", {
            courseId: cid,
            lessonId: lid,
          });
          void invoke("tray_focus_main");
        },
        openCourse: (cid) => {
          void emit("libre:tray-open-course", { courseId: cid });
          void invoke("tray_focus_main");
        },
      }),
    [courses, completed, history, agentScope.scope, agentScope.setScope],
  );

  // Agent system prompt. Two important behaviours encoded here:
  //
  //   1. Always create a sandbox project FIRST. That gives the
  //      stream-to-file parser a target. We're explicit because
  //      open-weights models will otherwise stream code as one
  //      giant inline block with no destination.
  //
  //   2. Format every file as a fenced code block whose info
  //      string carries the relative path:
  //          ```ts:src/main.ts
  //          // contents
  //          ```
  //      The `useSandboxStreamWriter` hook below watches the
  //      stream, parses these blocks token-by-token, and writes
  //      each one to the sandbox project as content arrives.
  //      The user watches the file populate live in the
  //      editor. Multiple files in one reply are supported —
  //      each fenced block with a `:` separator becomes its
  //      own file.
  const agentSystemPrompt = [
    "You are the Libre agent — running from the macOS menu bar popover.",
    "You have TOOLS for listing/searching courses, opening lessons, creating sandbox projects, running projects, and starting dev servers. USE THE TOOLS — the user opened you to get something done.",
    "",
    "WORKFLOW for building code in the sandbox:",
    "1. ALWAYS call `create_sandbox_project` FIRST with a sensible name + language + a placeholder starter file. This gives subsequent file writes a target.",
    "2. After the project exists, write each file as a markdown code fence whose info string includes the file path, like:",
    "",
    "   ```typescript:src/main.ts",
    "   import { foo } from './foo';",
    "   // ... full file contents ...",
    "   ```",
    "",
    "3. The user's editor streams in each file's content AS YOU TYPE IT, file-by-file. Multiple files per reply are fine — each fenced block with `<lang>:<path>` becomes its own file in the active project.",
    "4. Do NOT call `write_sandbox_file` for ordinary code — the streaming fence is faster and prettier. Reserve `write_sandbox_file` for tiny edits to existing files where streaming would feel jarring.",
    "5. After the last file, summarise what you wrote in 1-2 short sentences and tell the user how to run it.",
    "",
    "Keep replies tight (no rambling between files). Code fences must always carry a `<lang>:<path>` info string — bare ``` blocks without a path will NOT be streamed to the editor and the user won't see them.",
  ].join("\n");

  const agent = useAiAgent({
    systemPrompt: agentSystemPrompt,
    tools: agentTools,
    initialMessages: agentInitial,
  });

  // Mirror the agent's message log to the parent so the session
  // snapshot stays current. The agent's `timeline` + `pending`
  // are NOT persisted — they're per-run state that gets
  // recomputed on the next user turn. The underlying sandbox
  // projects / lessons the tools acted on already live in the
  // main window, so reopening an agent session shows the
  // conversation text and the user picks up from there.
  useEffect(() => {
    if (mode !== "agent") return;
    onMessagesChange(agent.messages);
  }, [agent.messages, mode, onMessagesChange]);

  // ── Stream-to-file parser ──────────────────────────────────
  //
  // Watch the LATEST assistant message's content as it streams
  // and route any fenced blocks with a `<lang>:<path>` info
  // string into the active sandbox project. The model is
  // instructed (in `agentSystemPrompt` above) to use this
  // format whenever it writes code, with `create_sandbox_project`
  // called first to give the parser a target project to write
  // into. The hook reads the project id from the
  // `libre:sandbox-focus` event that fires when that tool runs.
  //
  // We watch only the LATEST assistant message — older messages
  // are settled and re-running the parse over them would be
  // wasted work (and could cause spurious re-writes if the
  // model emitted the same code twice across turns).
  const latestAssistantContent = useMemo(() => {
    if (mode !== "agent") return "";
    for (let i = agent.messages.length - 1; i >= 0; i--) {
      const m = agent.messages[i];
      if (m.role === "assistant") return m.content ?? "";
    }
    return "";
  }, [agent.messages, mode]);
  useSandboxStreamWriter(latestAssistantContent);

  // ── Cross-window forwarding ─────────────────────────────────
  //
  // The agent's sandbox tools fire `libre:sandbox-focus` /
  // `libre:sandbox-refresh` CustomEvents inside the tray window.
  // Forward to main via Tauri so main's listeners see them.
  useEffect(() => {
    const onRefresh = () => {
      void emit("libre:tray-sandbox-refresh", {});
      void invoke("tray_focus_main");
    };
    const onFocus = (ev: Event) => {
      const detail = (
        ev as CustomEvent<{ projectId?: string; path?: string }>
      ).detail;
      if (!detail?.projectId) return;
      void emit("libre:tray-sandbox-focus", {
        projectId: detail.projectId,
        path: detail.path ?? null,
      });
      void invoke("tray_focus_main");
    };
    window.addEventListener("libre:sandbox-refresh", onRefresh);
    window.addEventListener("libre:sandbox-focus", onFocus);
    return () => {
      window.removeEventListener("libre:sandbox-refresh", onRefresh);
      window.removeEventListener("libre:sandbox-focus", onFocus);
    };
  }, []);

  if (mode === "chat") {
    return (
      <AiChatPanel
        open
        messages={chat.messages}
        streaming={chat.streaming}
        error={chat.error}
        probe={chat.probe}
        installStatus={chat.installStatus}
        setupBusy={chat.setupBusy}
        onSend={(p) => {
          const t = p.trim();
          if (!t) return;
          void chat.send(t);
        }}
        onClose={onClose}
        onReset={chat.reset}
        onRetryProbe={chat.refreshProbe}
        onInstallOllama={chat.installOllama}
        onStartOllama={chat.startOllama}
        onPullModel={chat.pullModel}
      />
    );
  }

  return (
    <AiAgentPanel
      open
      messages={agent.messages}
      streaming={agent.streaming}
      pending={agent.pending}
      timeline={agent.timeline}
      error={agent.error}
      scope={agentScope.scope}
      usage={agent.usage}
      confidence={agent.confidence}
      clarification={agent.clarification}
      settings={agent.settings}
      onSend={(p) => void agent.send(p)}
      onClose={onClose}
      onReset={agent.reset}
      onApprove={agent.approve}
      onDeny={agent.deny}
      onStop={agent.stop}
      onAnswerClarification={agent.answerClarification}
      onCancelClarification={agent.cancelClarification}
      onUpdateSettings={agent.updateSettings}
      onClearScope={agentScope.clear}
    />
  );
}
