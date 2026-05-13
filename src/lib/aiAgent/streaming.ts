/// Pure parsers for the agent's streaming response.
///
/// The agent loop and the sandbox stream writer both need to pull
/// structured payloads out of free-form assistant content:
///
///   - The agent extracts tool calls the model emitted inline as
///     JSON when it ignored Ollama's `tools` channel. See
///     `extractInlineToolCalls`.
///   - The sandbox writer pulls every `\`\`\`lang:path` fenced block
///     so it can write each file to disk in real time. See
///     `parseFencedBlocks`.
///   - The agent confidence parser pulls a `<confidence>N</confidence>`
///     tag the model is instructed to emit so the UI can show how
///     sure it is. See `extractConfidence`.
///
/// Everything here is PURE — no React, no Tauri, no DOM. That's
/// what makes the test suite work without spinning the app.

import type { ToolCall, ToolDef } from "./types";

/// Walk `content` extracting every balanced top-level `{...}`
/// span. Top-level meaning: we skip OVER matched objects rather
/// than recursing into them, so a single outer object containing
/// nested ones is emitted once (not once per nested brace).
///
/// String-aware: `{` or `}` inside a JSON string literal doesn't
/// affect the depth counter. `\\` and `\"` are honoured so an
/// escaped quote inside a string doesn't prematurely end the
/// string scan.
///
/// Returns `{ span, start, end }` for each match — `start` is the
/// index of the opening `{`, `end` is the index immediately past
/// the closing `}` (so `content.slice(start, end) === span`).
/// Positions matter because the strip helper splices spans out of
/// the surrounding content.
export function findBalancedObjects(
  content: string,
): Array<{ span: string; start: number; end: number }> {
  const out: Array<{ span: string; start: number; end: number }> = [];
  let i = 0;
  while (i < content.length) {
    if (content[i] !== "{") {
      i += 1;
      continue;
    }
    let depth = 0;
    let inString = false;
    let escape = false;
    let j = i;
    let matched = false;
    for (; j < content.length; j++) {
      const c = content[j];
      if (escape) {
        escape = false;
        continue;
      }
      if (inString) {
        if (c === "\\") {
          escape = true;
          continue;
        }
        if (c === '"') inString = false;
        continue;
      }
      if (c === '"') {
        inString = true;
        continue;
      }
      if (c === "{") depth += 1;
      else if (c === "}") {
        depth -= 1;
        if (depth === 0) {
          matched = true;
          break;
        }
      }
    }
    if (matched) {
      out.push({ span: content.slice(i, j + 1), start: i, end: j + 1 });
      i = j + 1;
    } else {
      // Unbalanced — content ended before the object closed.
      // Stop; nothing useful remains.
      break;
    }
  }
  return out;
}

/// Inline tool-call extractor. Some open-weights models (smaller
/// Qwen / Llama checkpoints) ignore Ollama's `tools` channel and
/// instead emit tool calls as raw JSON in the assistant content,
/// either inside a code fence or as a bare top-level object. This
/// helper recovers them so the agent loop can still dispatch.
///
/// Two-pass scan:
///   1. Every fenced block (with OR without info string) — the
///      ENTIRE body is treated as a candidate, even when the
///      fence has a path tag (some models wrap their tool call
///      in a `\`\`\`jsx:src/App.jsx` fence by mistake).
///   2. Balanced top-level JSON objects in the prose — caught by
///      `findBalancedObjects`. Crucial: a regex with lazy `\}`
///      would stop at the FIRST `}` and produce unbalanced
///      candidates that fail `JSON.parse`. Always use the
///      balanced scanner.
export function extractInlineToolCalls(
  content: string,
  registry: readonly ToolDef[],
): ToolCall[] | undefined {
  if (!content) return undefined;
  const knownNames = new Set(registry.map((t) => t.name));
  const candidates: string[] = [];

  const fenceRe = /```[^\n]*\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(content)) !== null) candidates.push(m[1]);

  for (const { span } of findBalancedObjects(content)) {
    candidates.push(span);
  }

  const calls: ToolCall[] = [];
  const seenIds = new Set<string>();
  for (const raw of candidates) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      try {
        parsed = looseJsonParse(raw);
      } catch {
        continue;
      }
    }
    if (!parsed || typeof parsed !== "object") continue;
    const obj = parsed as {
      name?: unknown;
      arguments?: unknown;
      args?: unknown;
    };
    if (typeof obj.name !== "string") continue;
    if (!knownNames.has(obj.name)) continue;
    const args = obj.arguments ?? obj.args ?? {};
    const argsStr = typeof args === "string" ? args : JSON.stringify(args);
    // De-dupe — the same payload often appears in both a fenced
    // block AND as a bare object in the same response (model
    // double-wraps it). Hash on name + args so we run each call
    // once.
    const dedupKey = `${obj.name}|${argsStr}`;
    if (seenIds.has(dedupKey)) continue;
    seenIds.add(dedupKey);
    calls.push({
      id: `inline_${Date.now()}_${calls.length}`,
      name: obj.name,
      arguments: argsStr,
    });
  }
  return calls.length > 0 ? calls : undefined;
}

/// Strip the inline tool-call JSON from the assistant content
/// once we've extracted it, so the chat shows a clean message
/// (or empty, which renders as a "thinking…" breadcrumb)
/// instead of duplicating the payload above the running tool.
///
/// Two cases handled:
///   1. Any fenced block whose content parses as a tool-call
///      payload — strip the entire fence.
///   2. Top-level bare-object tool-call payloads — strip them
///      via the same balanced-brace scan the extractor uses.
///
/// Legitimate file fences (jsx / ts / py contents — not tool
/// calls) stay untouched because their content fails the
/// tool-call parse test.
export function stripInlineToolCallJson(content: string): string {
  if (!content) return content;
  let out = content;

  // Walk every fenced block; strip only those whose body is a
  // tool-call payload.
  const fenceRe = /```[^\n]*\n([\s\S]*?)```/g;
  const spans: Array<{ start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  fenceRe.lastIndex = 0;
  while ((m = fenceRe.exec(out)) !== null) {
    const body = m[1].trim();
    if (!body.startsWith("{") || !body.endsWith("}")) continue;
    try {
      const parsed = JSON.parse(body);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof (parsed as { name?: unknown }).name === "string" &&
        typeof (parsed as { arguments?: unknown }).arguments === "object"
      ) {
        spans.push({ start: m.index, end: m.index + m[0].length });
      }
    } catch {
      /* not JSON, skip */
    }
  }
  for (let i = spans.length - 1; i >= 0; i--) {
    out = out.slice(0, spans[i].start) + out.slice(spans[i].end);
  }

  // Top-level bare-object tool-call payloads via the balanced
  // scan. Same predicate as the fence pass — must have a string
  // `name` AND an object `arguments`. Without the `arguments`
  // check, real `package.json` contents like
  // `{"name":"x","version":"1.0.0"}` would false-positive (they
  // have a `name` field) and the strip would erase the file
  // body. We've seen this happen: agents writing package.json in
  // a bare fence inside their response would have the fence body
  // disappear from the chat bubble even though the file write
  // succeeded.
  const bareSpans = findBalancedObjects(out).filter(({ span }) => {
    try {
      const parsed = JSON.parse(span);
      if (
        parsed === null ||
        typeof parsed !== "object" ||
        typeof (parsed as { name?: unknown }).name !== "string"
      ) {
        return false;
      }
      const args = (parsed as { arguments?: unknown }).arguments;
      // `arguments` must be an object (or array — some models
      // emit positional args as a list). Anything else (missing,
      // null, primitive) means this isn't a tool call.
      return args !== undefined && args !== null && typeof args === "object";
    } catch {
      return false;
    }
  });
  for (let i = bareSpans.length - 1; i >= 0; i--) {
    out = out.slice(0, bareSpans[i].start) + out.slice(bareSpans[i].end);
  }
  return out.trim();
}

/// Parsed fenced code block. The CALLER decides what to do with
/// `path === null` blocks (typically: route to the focused file
/// when there's only one bare block, otherwise drop).
export interface ParsedBlock {
  lang: string;
  /// `null` for bare-language / bare fences.
  path: string | null;
  content: string;
  /// True when we saw the closing ```.
  closed: boolean;
}

/// Detect content that's actually a tool-call payload the model
/// emitted into a code fence instead of via the structured
/// `tool_calls` channel. Lets the writer refuse to overwrite a
/// real file path with tool-call JSON.
///
/// The check is strict: must be top-level JSON, must have a string
/// `name`, must have an object `arguments`, and the whole thing
/// must be <500 chars (so an unusual JSON config file with a
/// `name` field doesn't false-positive).
export function looksLikeToolCallPayload(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return false;
  if (trimmed.length > 500) return false;
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object") return false;
    const obj = parsed as { name?: unknown; arguments?: unknown };
    return (
      typeof obj.name === "string" &&
      obj.arguments !== undefined &&
      typeof obj.arguments === "object"
    );
  } catch {
    return false;
  }
}

/// Parse all fenced blocks (open + close, or open-only mid-stream)
/// from the assistant's accumulated content.
///
/// State machine: walks every `^\`\`\`...` marker, classifies as
/// open (has info string) or close (no info), pairs opens with
/// closes. A close without a preceding open is dropped (stray
/// close in prose). The trailing block can be open (still
/// streaming) — emitted with `closed: false`.
///
/// Tool-call-shaped blocks are rejected here so they don't reach
/// the file writer; the agent loop's `extractInlineToolCalls`
/// catches them separately.
export function parseFencedBlocks(content: string): ParsedBlock[] {
  if (!content) return [];
  const out: ParsedBlock[] = [];

  const markerRe = /^```([^\n]*)(?:\n|$)/gm;
  type Marker = {
    kind: "open" | "close";
    infoStart: number;
    afterMarker: number;
    info: string;
  };
  const markers: Marker[] = [];
  let m: RegExpExecArray | null;
  markerRe.lastIndex = 0;
  while ((m = markerRe.exec(content)) !== null) {
    const info = m[1].trim();
    markers.push({
      kind: info.length > 0 ? "open" : "close",
      infoStart: m.index,
      afterMarker: m.index + m[0].length,
      info,
    });
  }
  if (markers.length === 0) return out;

  let cursor = 0;
  while (cursor < markers.length) {
    const here = markers[cursor];
    if (here.kind !== "open") {
      cursor += 1;
      continue;
    }
    let closeIdx = -1;
    for (let j = cursor + 1; j < markers.length; j++) {
      if (markers[j].kind === "close") {
        closeIdx = j;
        break;
      }
    }
    const { lang, path } = splitInfoString(here.info);
    if (closeIdx === -1) {
      const body = content.slice(here.afterMarker);
      if (!looksLikeToolCallPayload(body)) {
        out.push({ lang, path, content: body, closed: false });
      }
      break;
    }
    const close = markers[closeIdx];
    let body = content.slice(here.afterMarker, close.infoStart);
    if (body.endsWith("\n")) body = body.slice(0, -1);
    if (!looksLikeToolCallPayload(body)) {
      out.push({ lang, path, content: body, closed: true });
    }
    cursor = closeIdx + 1;
  }
  return out;
}

/// Split an info-string into language + optional path. Tolerates
/// every variant the model might emit:
///   - `jsx:src/App.jsx`  → { lang: "jsx", path: "src/App.jsx" }
///   - `jsx src/App.jsx`  → same (some models use space, not colon)
///   - `jsx`              → { lang: "jsx", path: null }
///   - ``                 → { lang: "", path: null }
///   - `src/App.jsx`      → { lang: "", path: "src/App.jsx" }
///     (heuristic: a single token containing `/` or a `.` plus
///     more than 4 chars is a path, not a lang)
export function splitInfoString(info: string): {
  lang: string;
  path: string | null;
} {
  const trimmed = info.trim();
  if (!trimmed) return { lang: "", path: null };
  const colonIdx = trimmed.indexOf(":");
  if (colonIdx > 0) {
    return {
      lang: trimmed.slice(0, colonIdx).trim(),
      path: trimmed.slice(colonIdx + 1).trim() || null,
    };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return { lang: parts[0], path: parts.slice(1).join(" ") };
  }
  if (trimmed.includes("/") || (trimmed.includes(".") && trimmed.length > 4)) {
    return { lang: "", path: trimmed };
  }
  return { lang: trimmed, path: null };
}

/// Permissive JSON parse — accepts the common malformations
/// open-weights models occasionally emit (single quotes, trailing
/// commas).
export function looseJsonParse(s: string): unknown {
  const cleaned = s
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/'/g, '"');
  return JSON.parse(cleaned);
}

/// Last-resort recovery — when the model dumps a build's contents
/// directly into the chat as `\`\`\`lang:path` fences AND never
/// calls a tool, we synthesise the calls ourselves so the build
/// still lands in the sandbox.
///
/// This is the fix for the "AI just chats code at me instead of
/// creating files" failure mode. Smaller open-weights models
/// frequently ignore the structured tool channel AND the explicit
/// "ACT FIRST" system prompt; if we just render their text reply,
/// the user gets a wall of code in the chat with no project
/// created. Synthesising tool calls from the fences keeps the
/// end-to-end build flowing even when the model is bad at
/// tool-calling.
///
/// Strategy:
///   1. Parse every `lang:path` fenced block out of the content.
///      Bare-language fences without a path are skipped — we have
///      no idea where to write them.
///   2. If the conversation has already produced a `projectId`
///      (look for it in the prior tool messages), synthesise
///      one `write_sandbox_file` call per fence.
///   3. Otherwise synthesise a SINGLE `create_sandbox_project`
///      call with the files inlined (the tool supports a `files`
///      argument). Pick a project name + language from the user
///      prompt + the fence types.
///
/// `existingProjectId` and `userPromptHint` are caller-provided
/// context; the loop has access to both via its conversation
/// log + the current user message.
export interface FenceRecovery {
  toolCalls: ToolCall[];
  /// Updated content with the synthesised fences removed so the
  /// chat doesn't show the dumped code twice (once in the file
  /// chips, once in the bubble).
  cleanedContent: string;
}

export function synthesizeFromFences(
  content: string,
  registry: readonly ToolDef[],
  context: {
    existingProjectId: string | null;
    userPromptHint?: string;
  },
): FenceRecovery | null {
  if (!content) return null;
  // Walk every fence; only path-tagged ones survive (we can't
  // route a bare fence without a focused-file context, which the
  // loop doesn't have).
  const fenceRe = /^```([^\n]+)\n([\s\S]*?)```/gm;
  type Fence = {
    lang: string;
    path: string;
    body: string;
    start: number;
    end: number;
  };
  const fences: Fence[] = [];
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(content)) !== null) {
    const info = m[1].trim();
    // Re-use the splitter so colon AND space syntaxes both work.
    const parsed = splitInfoStringInternal(info);
    if (!parsed.path) continue;
    const body = m[2].trimEnd();
    // Reject tool-call payloads (they'd false-positive as a "file").
    if (looksLikeToolCallPayloadInternal(body)) continue;
    fences.push({
      lang: parsed.lang,
      path: parsed.path,
      body,
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  if (fences.length === 0) return null;

  const knownNames = new Set(registry.map((t) => t.name));
  const toolCalls: ToolCall[] = [];

  if (context.existingProjectId && knownNames.has("write_sandbox_file")) {
    // Project exists — write each file individually so the user
    // sees per-file progress chips and can disambiguate which
    // fence wrote which file.
    for (let i = 0; i < fences.length; i++) {
      const f = fences[i];
      toolCalls.push({
        id: `synth_${Date.now()}_${i}`,
        name: "write_sandbox_file",
        arguments: JSON.stringify({
          projectId: context.existingProjectId,
          path: f.path,
          content: f.body,
          language: f.lang || undefined,
        }),
      });
    }
  } else if (knownNames.has("create_sandbox_project")) {
    // No project yet — one create call with inline files. The
    // tool accepts a `files` array exactly for this case.
    const language = inferLanguageFromFences(fences, context.userPromptHint);
    const name = inferNameFromPrompt(context.userPromptHint);
    toolCalls.push({
      id: `synth_${Date.now()}_0`,
      name: "create_sandbox_project",
      arguments: JSON.stringify({
        name,
        language,
        files: fences.map((f) => ({
          path: f.path,
          content: f.body,
          language: f.lang || undefined,
        })),
      }),
    });
  } else {
    // Neither tool is registered (host wired a subset of the
    // registry). We can't recover — bail.
    return null;
  }

  // Strip the synthesised fences out of the content so the chat
  // bubble doesn't double-display them. Walk backwards to keep
  // earlier offsets stable.
  let cleaned = content;
  for (let i = fences.length - 1; i >= 0; i--) {
    cleaned = cleaned.slice(0, fences[i].start) + cleaned.slice(fences[i].end);
  }
  cleaned = cleaned.trim();
  return { toolCalls, cleanedContent: cleaned };
}

/// Public-API copy of the local helpers above. We can't reuse the
/// exported `splitInfoString` directly because it returns a
/// `path: string | null` union; the synthesiser already filtered
/// for `path != null` and wants the unioned-out type.
function splitInfoStringInternal(info: string): {
  lang: string;
  path: string | null;
} {
  return splitInfoString(info);
}
function looksLikeToolCallPayloadInternal(content: string): boolean {
  return looksLikeToolCallPayload(content);
}

/// Pick a language for the synthetic `create_sandbox_project`
/// call. Strategy: vote by file extension across the fenced
/// blocks; tiebreak using the user prompt's wording. Fallback is
/// `javascript` because every sandbox runner accepts it.
function inferLanguageFromFences(
  fences: Array<{ lang: string; path: string }>,
  userPrompt?: string,
): string {
  const votes: Record<string, number> = {};
  for (const f of fences) {
    const candidate = candidateLanguageFromPath(f.path, f.lang);
    if (candidate) votes[candidate] = (votes[candidate] ?? 0) + 1;
  }
  const top = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] > 0) return top[0];
  // Vote was empty (only `txt` fences etc). Check the prompt for a
  // common language word.
  const promptLower = (userPrompt ?? "").toLowerCase();
  const promptHits: Array<[string, string]> = [
    ["react", "react"],
    ["solid", "solid"],
    ["svelte", "svelte"],
    ["python", "python"],
    ["rust", "rust"],
    ["typescript", "typescript"],
    ["javascript", "javascript"],
    ["html", "web"],
  ];
  for (const [word, lang] of promptHits) {
    if (promptLower.includes(word)) return lang;
  }
  return "javascript";
}

function candidateLanguageFromPath(
  path: string,
  fenceLang: string,
): string | null {
  const lower = path.toLowerCase();
  if (lower.endsWith(".tsx") || lower.endsWith(".jsx")) {
    // React vs Solid vs Svelte ambiguity — prefer "react" unless
    // the fence lang explicitly says solid/svelte.
    if (fenceLang.toLowerCase().includes("solid")) return "solid";
    return "react";
  }
  if (lower.endsWith(".svelte")) return "svelte";
  if (lower.endsWith(".astro")) return "astro";
  if (lower.endsWith(".ts")) return "typescript";
  if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "javascript";
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".rs")) return "rust";
  if (lower.endsWith(".go")) return "go";
  if (lower.endsWith(".rb")) return "ruby";
  if (lower.endsWith(".java")) return "java";
  if (lower.endsWith(".kt")) return "kotlin";
  if (lower.endsWith(".swift")) return "swift";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "web";
  if (lower.endsWith(".lua")) return "lua";
  return null;
}

/// Pull a sensible project name out of the user's prompt. Heuristics:
/// 1. Strip the leading "build me a", "make me a", "create a" etc.
/// 2. Take the first 4 content words.
/// 3. Title-case them.
/// Falls back to "New project" when nothing remains.
function inferNameFromPrompt(prompt?: string): string {
  if (!prompt) return "New project";
  let words = prompt
    .replace(
      /^\s*(build|make|create|write|generate|please|can\s+you)\s+(me\s+|us\s+)?(a\s+|an\s+|the\s+)?/i,
      "",
    )
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  if (words.length === 0) return "New project";
  // Strip common trailing context that bloats the name.
  words = words.filter(
    (w) => !/^(in|using|with|for)$/i.test(w),
  );
  if (words.length === 0) return "New project";
  return words
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/// Scan a conversation's tool-role messages for a known
/// `create_sandbox_project` result and pull out its `projectId`.
/// Returns null when no successful creation lives in the log.
///
/// Used by the loop to decide whether the fence synthesiser
/// should call `create_sandbox_project` (no existing project) or
/// `write_sandbox_file` (existing project from a prior turn).
export function findExistingProjectId(
  toolMessages: Array<{ name: string; content: string }>,
): string | null {
  for (let i = toolMessages.length - 1; i >= 0; i--) {
    const m = toolMessages[i];
    if (m.name !== "create_sandbox_project") continue;
    try {
      const parsed = JSON.parse(m.content) as { projectId?: unknown };
      if (typeof parsed.projectId === "string") return parsed.projectId;
    } catch {
      /* not JSON, skip */
    }
  }
  return null;
}
