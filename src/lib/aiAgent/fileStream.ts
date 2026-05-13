/// Pure logic for the agent's per-chunk file-streaming pipeline.
///
/// The agent's assistant content carries `\`\`\`lang:path` fenced
/// blocks (one per file the model is writing). As tokens stream
/// in, this module:
///   1. Parses every fenced block from the accumulated content.
///   2. Diffs each block's content against what we wrote to disk
///      last tick.
///   3. Emits a planned set of writes — the host (React hook)
///      applies them via the sandbox save command.
///
/// Pulling this out of `useSandboxStreamWriter` makes it testable:
/// the test can feed sequential snapshots of streaming content
/// and assert that the planned writes match expectations.

import { parseFencedBlocks } from "./streaming";

/// One planned write. `bytes` is the byte count of the content
/// being written (useful for progress UI). `isNew` is true the
/// first time we see this path in the run — the host fires a
/// focus event so the editor opens the file.
export interface PlannedWrite {
  /// Project the file belongs to.
  projectId: string;
  /// Path within the project (e.g. `src/App.jsx`).
  path: string;
  /// Language tag (typically inferred from the fence's info
  /// string, falling back to extension).
  language: string;
  /// Full content for the file at this tick (we write whole
  /// files, not deltas — the sandbox doesn't support patches).
  content: string;
  /// Byte length, for the UI's progress strip.
  bytes: number;
  /// True when we saw the closing ```. UI uses this to flip the
  /// per-file chip from "writing…" to "wrote".
  closed: boolean;
  /// True when this is the first time we've seen this path. Host
  /// fires `libre:sandbox-focus` so the editor opens it.
  isNew: boolean;
  /// Language tag the parsed fence carried, before any fallback.
  /// Lets the host emit `libre:agent-file-write` with the
  /// language the model named.
  rawLang: string;
}

/// State the planner maintains across ticks. Caller threads this
/// in and gets back the next state value.
export interface StreamPlannerState {
  /// Project id currently in focus. `null` when nothing's been
  /// resolved yet (the host will resolve it via the create_sandbox_project
  /// tool result before the first fenced block lands in practice).
  projectId: string | null;
  /// Last-written content per path. Lets us skip no-op rewrites.
  lastContent: Map<string, string>;
  /// Closed-flag history per path. Lets us emit a write even when
  /// content is unchanged BUT the block just transitioned from
  /// open to closed — that's what the UI needs to flip the per-
  /// file chip from "writing…" to "wrote".
  lastClosed: Map<string, boolean>;
  /// The projectId the lastContent map belongs to. Tracked
  /// separately from `projectId` because the host can change
  /// `projectId` (e.g. by handling a focus event) while we still
  /// remember writes from a prior project — comparing this against
  /// the next `projectId` is what tells us "the project changed
  /// under us, wipe the cache before this tick's diff".
  lastContentProjectId: string | null;
  /// File path currently in focus inside the project. Bare
  /// fences (no `:path`) fall back to this.
  focusedPath: string | null;
}

export const EMPTY_PLANNER_STATE: StreamPlannerState = {
  projectId: null,
  lastContent: new Map(),
  lastClosed: new Map(),
  lastContentProjectId: null,
  focusedPath: null,
};

/// Sniff the assistant content for a `create_sandbox_project`
/// result payload. When models echo the tool result inline, the
/// streaming content carries `{"projectId":"...","ok":true,...}`;
/// we use that as a backup for the focus event so files in the
/// same turn as the create call still route correctly.
export function sniffProjectId(content: string): string | null {
  if (!content) return null;
  const m = /"projectId"\s*:\s*"([^"]+)"/.exec(content);
  return m ? m[1] : null;
}

/// Plan the writes for one streaming tick. Returns the planned
/// list + the updated state. Apply the writes, then thread the
/// state back in on the next tick.
export function planStreamWrites(
  state: StreamPlannerState,
  streamingContent: string,
): { writes: PlannedWrite[]; state: StreamPlannerState } {
  const next: StreamPlannerState = {
    projectId: state.projectId ?? sniffProjectId(streamingContent),
    lastContent: state.lastContent,
    lastClosed: state.lastClosed,
    lastContentProjectId: state.lastContentProjectId,
    focusedPath: state.focusedPath,
  };
  if (!next.projectId) return { writes: [], state: next };
  if (!streamingContent) return { writes: [], state: next };

  // If the project the lastContent cache belongs to differs from
  // the project we're about to write to, wipe the cache. Covers
  // two cases: (a) the host swapped focus mid-stream and we're
  // seeing a brand-new project; (b) the planner just adopted a
  // sniffed projectId for the first time. Without this we'd skip
  // writes for a fresh project on the grounds that "we've seen
  // this path before" — except the path was in a DIFFERENT
  // project.
  if (next.lastContentProjectId !== next.projectId) {
    next.lastContent = new Map();
    next.lastClosed = new Map();
    next.lastContentProjectId = next.projectId;
  }

  const parsed = parseFencedBlocks(streamingContent);
  if (parsed.length === 0) return { writes: [], state: next };

  // Path-less blocks fall back to the focused path. The first
  // bare block consumes the fallback; subsequent bare blocks
  // are dropped (we don't want to overwrite the focused file
  // with every bare block in a multi-bare-block stream).
  let usedFallback = false;
  const writes: PlannedWrite[] = [];
  for (const block of parsed) {
    let path = block.path;
    if (!path) {
      if (usedFallback) continue;
      if (!next.focusedPath) continue;
      path = next.focusedPath;
      usedFallback = true;
    }
    const language = block.lang || inferLanguage(path);
    const prevContent = next.lastContent.get(path);
    const prevClosed = next.lastClosed.get(path);
    // Two signals trigger a write:
    //   1. Content grew (or changed).
    //   2. Closed flag flipped (false → true).
    // Skipping when neither has changed prevents repeated saves
    // for an already-final block while still firing the closing
    // event when the model emits the close fence in a later tick.
    const contentChanged = prevContent !== block.content;
    const justClosed = block.closed && prevClosed !== true;
    if (!contentChanged && !justClosed) continue;
    const isNew = prevContent === undefined;
    next.lastContent.set(path, block.content);
    next.lastClosed.set(path, block.closed);
    writes.push({
      projectId: next.projectId,
      path,
      language,
      content: block.content,
      bytes: block.content.length,
      closed: block.closed,
      isNew,
      rawLang: block.lang,
    });
  }
  return { writes, state: next };
}

/// Light extension → language map. Mirrors the one in
/// `useSandboxStreamWriter.ts` so the planner stays self-contained.
export function inferLanguage(path: string): string {
  const lower = path.toLowerCase();
  const ext = lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
  switch (ext) {
    case ".ts":
    case ".tsx":
      return "typescript";
    case ".js":
    case ".jsx":
    case ".mjs":
    case ".cjs":
      return "javascript";
    case ".py":
      return "python";
    case ".rs":
      return "rust";
    case ".go":
      return "go";
    case ".rb":
      return "ruby";
    case ".swift":
      return "swift";
    case ".kt":
    case ".kts":
      return "kotlin";
    case ".java":
      return "java";
    case ".cs":
      return "csharp";
    case ".c":
    case ".h":
      return "c";
    case ".cpp":
    case ".cc":
    case ".hpp":
      return "cpp";
    case ".zig":
      return "zig";
    case ".html":
    case ".htm":
      return "html";
    case ".css":
      return "css";
    case ".scss":
      return "scss";
    case ".json":
      return "json";
    case ".md":
      return "markdown";
    case ".sh":
    case ".bash":
      return "bash";
    case ".sql":
      return "sql";
    case ".vue":
      return "vue";
    case ".svelte":
      return "svelte";
    case ".astro":
      return "astro";
    default:
      return "plain";
  }
}
