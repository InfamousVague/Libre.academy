/// Tool-use contract for the Libre AI agent.
///
/// A "tool" is a typed function the model can call mid-conversation
/// to read or mutate app state. The model sees each tool's JSON
/// schema in its system prompt; when it emits a `tool_calls`
/// payload, the agent loop dispatches to the matching handler and
/// feeds the result back as a `tool`-role message before re-sending.
/// The model keeps calling tools until it has enough info to write
/// the final assistant message.
///
/// Permission policy:
///   - `auto: true`  — read-only or otherwise-safe tools, run
///                     without prompting the user.
///   - `auto: false` — tools that mutate state (open a lesson,
///                     mark complete, write a file). Surface a
///                     confirm-chip in the chat; the model waits
///                     on the user's approve / deny before the
///                     tool executes.
///
/// All handlers are async + return a JSON-serialisable result.
/// Errors bubble as strings the model can read and decide what to
/// do with — the loop doesn't retry implicitly because the model
/// itself is the right place to decide whether a failed tool call
/// should be retried, abandoned, or asked-about.

/// JSON-schema fragment describing one parameter. We don't bother
/// with the full JSON-Schema vocabulary — Ollama's `tools`
/// parameter is OpenAI-compatible and tolerates the small subset
/// we use (type, description, enum). Adding more (oneOf,
/// allOf, refs) wouldn't be readable to current open-weights
/// models anyway.
export interface ToolParamSchema {
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";
  description?: string;
  enum?: readonly string[];
  /// When `type === "array"`, the schema of each item. Required
  /// for the model to know what shape to emit.
  items?: ToolParamSchema;
  /// When `type === "object"`, the nested fields. Same shape as
  /// the top-level `ToolSchema.properties`, just one level deeper.
  /// Lets tools accept structured payloads (e.g. an `edits` array
  /// where each item is `{path, op, content}`).
  properties?: Record<string, ToolParamSchema>;
  /// Required-field list on nested objects. Matches the top-level
  /// `ToolSchema.required` semantics.
  required?: readonly string[];
}

export interface ToolSchema {
  type: "object";
  properties: Record<string, ToolParamSchema>;
  required?: readonly string[];
}

/// Tool definition. The handler is the only host-specific bit;
/// everything else is pure JSON the model reads to decide when to
/// call.
///
/// Handler arg is intentionally `any` — concrete tool definitions
/// can typeparam their own argument shape (e.g.
/// `{ courseId: string; lessonId: string }`) while the registry
/// stores them under a single uniform `ToolDef` type. The arg
/// value is parsed JSON from the model's tool-call payload at
/// dispatch time, so the runtime contract is whatever JSON shape
/// the model emits matching the declared `parameters` schema —
/// the type system can't enforce that from this side.
export interface ToolDef {
  name: string;
  description: string;
  parameters: ToolSchema;
  /// `auto` = run without user confirmation. Defaults to false
  /// (require confirmation) to keep the failure mode safe — adding
  /// a NEW tool that mutates state and forgetting to set
  /// `auto: false` would still gate behind the user's approval.
  auto?: boolean;
  /// Implementation. Receives the parsed args object the model
  /// emitted and returns whatever value should be serialised back
  /// to the model as the tool result. Strings are passed through
  /// verbatim; objects are JSON.stringify'd in the loop.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (args: any) => Promise<unknown>;
}

/// Wire format the model emits to request a tool call. Matches
/// the OpenAI / Ollama `tool_calls` shape — `name` + `arguments`
/// string that we parse into JSON.
export interface ToolCall {
  id: string;
  name: string;
  /// JSON-encoded args. Models occasionally emit slightly malformed
  /// JSON (trailing commas, single quotes); the loop tolerates the
  /// common variants via a JSON5-ish parse pass before giving up.
  arguments: string;
}

/// The result of executing one tool call. The loop sends one
/// `tool`-role message back to the model per ToolResult so the
/// model can correlate by `id`.
export interface ToolResult {
  toolCallId: string;
  name: string;
  /// JSON-stringified result or error message. Errors carry an
  /// `error: true` field so the model can pattern-match.
  content: string;
  /// Mirror of the handler's success state. Surfaced to the chat
  /// UI so failed tool calls render with a red border instead of
  /// the default neutral chip.
  ok: boolean;
}

/// Permission gate decision for a single tool call awaiting
/// approval. Drives the confirm-chip UI state.
///
/// The `running` state covers the gap between user-approves and
/// tool-result-lands. For slow tools (`run_sandbox_project` on a
/// compiled language can be 5-30s; `start_dev_server` waits for
/// vite to boot) the chip otherwise looks frozen on "approved"
/// for an arbitrary stretch. Flipping to `running` lets the UI
/// render a spinner / progress line so the user sees that
/// approval was registered + something is happening.
export type ToolApproval =
  | { kind: "pending" }
  | { kind: "approved" }
  | { kind: "running" }
  | { kind: "denied" };
