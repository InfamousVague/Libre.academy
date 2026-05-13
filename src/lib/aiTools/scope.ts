/// Agent working scope — the analogue of Claude Code's "session
/// directory" or Cursor's "rules + included files." Restricts what
/// the agent is allowed to read or modify, and surfaces a clear
/// "you are working on X" signal to the user.
///
/// Scope has four knobs:
///   - `activeProjectId`     : the project the agent treats as
///                             default when one isn't explicitly
///                             named. Surface in the header chip.
///   - `allowedProjectIds`   : empty Set = every installed project
///                             is in scope; non-empty = whitelist.
///   - `allowedPathPatterns` : empty array = every path under an
///                             allowed project is writable; non-
///                             empty = only paths matching at
///                             least one pattern are writable.
///                             Glob-like: `src/**`, `*.ts`,
///                             `package.json`.
///   - `readOnlyPaths`       : explicit deny-write list. Always
///                             applied even when allowedPathPatterns
///                             is empty. Use for "you can read this
///                             but don't change it" cases.
///
/// Enforcement: the registry's write/delete/run/patch tools call
/// `enforceWrite` and `enforceProject` before mutating; a denial
/// returns an error result the model can react to ("I tried to
/// touch foo/bar but it's outside scope — ask the user to extend
/// scope or change focus").
///
/// Persistence: serialised to localStorage so the scope survives a
/// reload. Survives across agent sessions too — the user shouldn't
/// have to re-narrow scope every time they reopen the assistant.

import { useCallback, useEffect, useMemo, useState } from "react";

export interface AgentScope {
  activeProjectId: string | null;
  allowedProjectIds: ReadonlySet<string>;
  allowedPathPatterns: readonly string[];
  readOnlyPaths: readonly string[];
}

export const EMPTY_SCOPE: AgentScope = {
  activeProjectId: null,
  allowedProjectIds: new Set(),
  allowedPathPatterns: [],
  readOnlyPaths: [],
};

const STORAGE_KEY = "libre:ai-agent-scope";

/// Read / write the agent scope reactively. State is persisted to
/// localStorage so the next session loads with the same scope.
/// Returns the live scope value plus a small surface of helpers:
///   - `setScope(next)`            : replace the whole scope.
///   - `setActiveProject(id)`      : focus on one project.
///   - `extend({ projects?, patterns? })`
///                                  : broaden allowed lists.
///   - `addReadOnly(paths)`         : add to the deny-write list.
///   - `clear()`                    : reset to EMPTY_SCOPE.
export function useAgentScope(): {
  scope: AgentScope;
  setScope: (next: AgentScope) => void;
  setActiveProject: (id: string | null) => void;
  extend: (delta: {
    projectIds?: readonly string[];
    pathPatterns?: readonly string[];
  }) => void;
  addReadOnly: (paths: readonly string[]) => void;
  clear: () => void;
} {
  const [scope, setScopeRaw] = useState<AgentScope>(() => loadFromStorage());

  // Persist any change. Wrap in try/catch because private-mode
  // browsers can throw on localStorage writes.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activeProjectId: scope.activeProjectId,
          allowedProjectIds: Array.from(scope.allowedProjectIds),
          allowedPathPatterns: scope.allowedPathPatterns,
          readOnlyPaths: scope.readOnlyPaths,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [scope]);

  const setScope = useCallback((next: AgentScope) => {
    setScopeRaw(next);
  }, []);

  const setActiveProject = useCallback((id: string | null) => {
    setScopeRaw((prev) => ({ ...prev, activeProjectId: id }));
  }, []);

  const extend = useCallback(
    (delta: {
      projectIds?: readonly string[];
      pathPatterns?: readonly string[];
    }) => {
      setScopeRaw((prev) => {
        const nextProjects = new Set(prev.allowedProjectIds);
        for (const id of delta.projectIds ?? []) nextProjects.add(id);
        const nextPatterns = [
          ...prev.allowedPathPatterns,
          ...(delta.pathPatterns ?? []),
        ];
        return {
          ...prev,
          allowedProjectIds: nextProjects,
          allowedPathPatterns: dedupe(nextPatterns),
        };
      });
    },
    [],
  );

  const addReadOnly = useCallback((paths: readonly string[]) => {
    setScopeRaw((prev) => ({
      ...prev,
      readOnlyPaths: dedupe([...prev.readOnlyPaths, ...paths]),
    }));
  }, []);

  const clear = useCallback(() => setScopeRaw(EMPTY_SCOPE), []);

  return useMemo(
    () => ({
      scope,
      setScope,
      setActiveProject,
      extend,
      addReadOnly,
      clear,
    }),
    [scope, setScope, setActiveProject, extend, addReadOnly, clear],
  );
}

function loadFromStorage(): AgentScope {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_SCOPE;
    const parsed = JSON.parse(raw) as Partial<{
      activeProjectId: string | null;
      allowedProjectIds: string[];
      allowedPathPatterns: string[];
      readOnlyPaths: string[];
    }>;
    return {
      activeProjectId: parsed.activeProjectId ?? null,
      allowedProjectIds: new Set(parsed.allowedProjectIds ?? []),
      allowedPathPatterns: parsed.allowedPathPatterns ?? [],
      readOnlyPaths: parsed.readOnlyPaths ?? [],
    };
  } catch {
    return EMPTY_SCOPE;
  }
}

function dedupe<T>(arr: readonly T[]): T[] {
  return Array.from(new Set(arr));
}

/// Decide whether a tool is allowed to operate on `projectId`.
/// Returns null when allowed; a human-readable reason string when
/// blocked (used as the tool's error message back to the model).
export function enforceProject(
  scope: AgentScope,
  projectId: string,
): string | null {
  if (scope.allowedProjectIds.size === 0) return null;
  if (scope.allowedProjectIds.has(projectId)) return null;
  return `Project '${projectId}' is outside the current agent scope. Ask the user to extend scope (extend_scope) or change focus (set_active_project) before editing it.`;
}

/// Decide whether a tool is allowed to write to `path` inside a
/// project that's already passed `enforceProject`. Two checks:
///   1. read-only deny-list (always wins);
///   2. allowed-pattern list (when non-empty, path must match).
/// Patterns are minimal globs: `*` matches anything except `/`,
/// `**` matches anything including `/`. Anchored to the start of
/// the path, no anchor at end (so `src/` matches `src/main.ts`).
export function enforceWrite(
  scope: AgentScope,
  path: string,
): string | null {
  for (const ro of scope.readOnlyPaths) {
    if (matchGlob(path, ro)) {
      return `Path '${path}' is in the read-only scope list. The user marked it untouchable — ask before editing.`;
    }
  }
  if (scope.allowedPathPatterns.length === 0) return null;
  for (const pat of scope.allowedPathPatterns) {
    if (matchGlob(path, pat)) return null;
  }
  return `Path '${path}' doesn't match any allowed path pattern in the agent scope. Allowed: ${scope.allowedPathPatterns.join(", ")}. Ask the user to extend scope (extend_scope) if you need to edit this file.`;
}

/// Bare-bones glob matcher. Compiles `pattern` to a regex and tests
/// `path` against it. Supports:
///   `*`  → match anything except `/`
///   `**` → match anything including `/`
///   literal chars match themselves
/// Not anchored at the end (so `src/` matches `src/foo/bar.ts`).
function matchGlob(path: string, pattern: string): boolean {
  // Escape regex metachars, then replace our glob escapes back
  // with regex equivalents. Order matters: handle `**` before
  // `*` so the more-specific token wins.
  const re = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "::DOUBLESTAR::")
    .replace(/\*/g, "[^/]*")
    .replace(/::DOUBLESTAR::/g, ".*");
  return new RegExp(`^${re}`).test(path);
}
