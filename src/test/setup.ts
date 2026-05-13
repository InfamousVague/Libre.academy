/// Vitest setup. Runs once per test file before any `it` block.
///
/// Two responsibilities:
///   1. Provide a jsdom DOM that React Testing Library can hang off
///      of (vitest auto-applies it via `environment: "jsdom"` — this
///      file just covers globals jsdom doesn't ship with).
///   2. Stub Tauri's `invoke` / `listen` APIs so hooks importing
///      `@tauri-apps/api/*` don't blow up the moment a test loads
///      them. Real tests that need scripted Ollama responses use
///      the `installMockTauri` helper in `src/test/mockTauri.ts`;
///      this file just ensures the *default* mode is "every Tauri
///      call rejects with a clear error" so a test that forgets to
///      mock surfaces an actionable failure instead of an obscure
///      undefined-method crash.

import { vi } from "vitest";

// `requestAnimationFrame` polyfill — jsdom ships a stub that's
// good enough, but some of the streaming code uses `cancelAnimationFrame`
// AGAINST an id of `0` (sentinel for "nothing scheduled") and jsdom's
// stub doesn't silently ignore that. Use the setImmediate-style
// shim that Node guarantees works.
if (typeof globalThis.requestAnimationFrame !== "function") {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16) as unknown as number;
}
if (typeof globalThis.cancelAnimationFrame !== "function") {
  globalThis.cancelAnimationFrame = (id: number) =>
    clearTimeout(id as unknown as NodeJS.Timeout);
}

// `localStorage` polyfill — jsdom's localStorage implementation
// can race with vitest's worker reset between test files, leaving
// the global stubbed to `{}` (which has no `.clear` method). A
// hand-rolled `Map`-backed Storage is good enough for our tests
// and dodges the race entirely. Only install when the global is
// missing or doesn't have the Storage methods we use.
const needsPolyfill =
  typeof globalThis.localStorage !== "object" ||
  globalThis.localStorage === null ||
  typeof (globalThis.localStorage as { clear?: unknown }).clear !==
    "function";
if (needsPolyfill) {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(k) {
      return store.has(k) ? (store.get(k) as string) : null;
    },
    key(i) {
      return Array.from(store.keys())[i] ?? null;
    },
    removeItem(k) {
      store.delete(k);
    },
    setItem(k, v) {
      store.set(k, String(v));
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    writable: true,
    configurable: true,
  });
}

// Default Tauri stub. Tests that need scripted responses replace
// this via `installMockTauri` inside their `beforeEach`. Top-level
// tests that don't touch IPC are fine — they never hit these.
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async (cmd: string) => {
    throw new Error(
      `Tauri invoke("${cmd}") called in test without a mock. ` +
        "Use installMockTauri from src/test/mockTauri.ts.",
    );
  }),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(async () => () => {}),
}));
