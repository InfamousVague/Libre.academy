/// Scriptable Tauri stub for tests.
///
/// `installMockTauri` swaps out the `invoke` mock the setup file
/// installed with one driven by a per-test `MockScript`. The script
/// declares:
///   - command handlers (one per Rust `#[tauri::command]` the test
///     touches; usually `ai_chat_agent_turn` for agent tests +
///     `sandbox_save_project` etc. for stream-writer tests)
///   - event emissions (so chunk-stream listeners actually fire when
///     the test calls `emitEvent`)
///
/// Why script-based vs handler-by-handler: a typical agent-loop
/// test has 3-5 turns where the model proposes tools then writes a
/// reply. Scripting them in order ("turn 1 returns this tool call",
/// "turn 2 returns this text") reads naturally and matches how the
/// model's behavior is described in the system prompt; building one
/// generic mock per command would force every test to re-author the
/// "remember which turn we're on" dance.

import { vi, type Mock } from "vitest";

/// Per-call handler. Receives the args object the test code passed
/// to `invoke(cmd, args)` and returns whatever the real Rust side
/// would have returned. Throw to simulate a Rust error.
export type CmdHandler = (args: Record<string, unknown>) => unknown;

/// Event listener registered via `@tauri-apps/api/event`'s `listen`.
/// The mock records every active listener so a test can emit events
/// to them via `mockTauri.emit(eventName, payload)`.
type Listener = {
  event: string;
  fn: (ev: { payload: unknown }) => void;
};

export interface MockTauriHandle {
  /// Override (or add) a command handler at runtime. Useful for
  /// tests that want to swap behaviour between turns.
  setCommand: (name: string, handler: CmdHandler) => void;
  /// Emit a Tauri event to every active listener whose name matches.
  /// `payload` is whatever shape the real event would carry.
  emit: (event: string, payload: unknown) => void;
  /// Read the (mockable) invoke fn so tests can inspect call history
  /// via vitest's `.mock.calls` API.
  invoke: Mock;
  /// Same for listen, in case a test wants to check which channels
  /// were subscribed.
  listen: Mock;
  /// Reset all command handlers + listeners. Auto-called between
  /// tests by the `mockReset: true` vitest config but exposed for
  /// tests that want to wipe state mid-test.
  reset: () => void;
}

/// Install a fresh mock Tauri runtime for a single test. Call from
/// `beforeEach` so each test gets isolation.
export async function installMockTauri(
  commands: Record<string, CmdHandler> = {},
): Promise<MockTauriHandle> {
  const handlers = new Map<string, CmdHandler>();
  for (const [k, v] of Object.entries(commands)) handlers.set(k, v);
  const listeners: Listener[] = [];

  const invoke: Mock = vi.fn(async (cmd: string, args?: unknown) => {
    const handler = handlers.get(cmd);
    if (!handler) {
      throw new Error(
        `mock invoke("${cmd}") called without a handler. ` +
          "Register one via installMockTauri({ [cmd]: () => ... }).",
      );
    }
    return handler((args as Record<string, unknown>) ?? {});
  });

  const listen: Mock = vi.fn(
    async (event: string, fn: (ev: { payload: unknown }) => void) => {
      const entry: Listener = { event, fn };
      listeners.push(entry);
      return () => {
        const idx = listeners.indexOf(entry);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    },
  );

  // Swap the module-level mocks with our scriptable versions.
  // vi.doMock + dynamic import would be cleaner but the setup file
  // already established the module-level mocks; we just reach in
  // and replace the implementations.
  const core = await import("@tauri-apps/api/core");
  (core.invoke as Mock).mockImplementation(invoke);
  const event = await import("@tauri-apps/api/event");
  (event.listen as Mock).mockImplementation(listen);

  return {
    setCommand(name, handler) {
      handlers.set(name, handler);
    },
    emit(eventName, payload) {
      for (const l of listeners) {
        if (l.event === eventName) l.fn({ payload });
      }
    },
    invoke,
    listen,
    reset() {
      handlers.clear();
      listeners.length = 0;
      for (const [k, v] of Object.entries(commands)) handlers.set(k, v);
    },
  };
}

/// Scripted transport for the agent loop. Each entry corresponds to
/// one round-trip (one `ai_chat_agent_turn` call). The driver pops
/// entries off the front in order; if the test asks for more turns
/// than scripted, the mock throws so the test failure surfaces the
/// underrun cleanly.
export interface ScriptedTurn {
  /// The assistant's text content for this turn. Optional — pure
  /// tool-call turns can omit it.
  content?: string;
  /// Tool calls the model "emits" this turn. The agent loop will
  /// dispatch each one against the registered tool handlers.
  toolCalls?: Array<{
    id?: string;
    name: string;
    arguments: unknown; // serialised to JSON by the helper
  }>;
  /// Optional usage stats the transport reports. Defaults to a
  /// realistic-looking accumulator so token-counter tests see
  /// non-zero values.
  usage?: { promptTokens?: number; completionTokens?: number };
  /// Tokens to emit through the chunk-stream channel during this
  /// turn, in order. Used to test streaming-pipeline behaviour
  /// (sandbox-file-write, etc.) without spinning Ollama.
  streamChunks?: string[];
}

/// Build the `ai_chat_agent_turn` handler that walks through a
/// scripted list of turns. Pop from the front on each call; if the
/// test wants more turns than scripted, throw a clear error.
export function buildScriptedAgentTurn(
  script: ScriptedTurn[],
  options?: {
    /// Optional event emitter for streaming chunks. When provided
    /// AND a turn has `streamChunks` AND the caller passed a
    /// `streamId`, the handler emits each chunk through
    /// `ai-chat-chunk:<streamId>` before returning the final
    /// content. Lets tests exercise the streaming UI too.
    emit?: (event: string, payload: unknown) => void;
  },
): CmdHandler {
  let turnIdx = 0;
  return async (args) => {
    const turn = script[turnIdx];
    if (!turn) {
      throw new Error(
        `scripted agent loop ran out of turns (asked for turn ${turnIdx + 1}, only ${script.length} scripted)`,
      );
    }
    turnIdx += 1;

    const streamId = args.streamId as string | undefined;
    if (streamId && turn.streamChunks && options?.emit) {
      for (const chunk of turn.streamChunks) {
        options.emit(`ai-chat-chunk:${streamId}`, { token: chunk });
      }
    }

    return {
      content: turn.content ?? "",
      tool_calls: turn.toolCalls?.map((tc, i) => ({
        id: tc.id ?? `mock_call_${turnIdx}_${i}`,
        function: {
          name: tc.name,
          arguments:
            typeof tc.arguments === "string"
              ? tc.arguments
              : JSON.stringify(tc.arguments ?? {}),
        },
      })),
      usage: turn.usage
        ? {
            prompt_tokens: turn.usage.promptTokens ?? 100,
            completion_tokens: turn.usage.completionTokens ?? 50,
          }
        : undefined,
    };
  };
}
