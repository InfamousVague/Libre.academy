/// Menu-bar (macOS tray) popover host.
///
/// Loaded by `main.tsx` when the URL carries `?tray=1`; the Rust
/// `tray.rs` spawns the host WebviewWindow (400 × 620, frameless,
/// transparent for the rounded card shape).
///
/// Owns:
///   - The tray-level Ollama probe (drives the status dot in the
///     header — same indicator shown whether the user is on a
///     fresh empty session or mid-conversation).
///   - The multi-session store via `useTraySessions` —
///     localStorage-backed list of past chats / agent tasks the
///     user can switch between.
///   - A keyed `TraySurface` child — remounts on session-id /
///     mode change so the inner chat / agent hooks restart with
///     the right initial messages.
///   - Cross-window keyboard / focus / link plumbing (Esc closes
///     the popover, focus-loss hides it, libre:// links forward
///     to main).

import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import TrayHeader from "./TrayHeader";
import TraySurface from "./TraySurface";
import { useTraySessions } from "./useTraySessions";
import type { ProbeResult } from "../../hooks/useAiChat";
import type { TrayMessage } from "./useTraySessions";
import "./TrayPanel.css";

export default function TrayPanel() {
  const sessions = useTraySessions();

  // Standalone probe just for the header's status dot — runs
  // independent of any session so the dot lights up the moment
  // the tray opens, before the user picks an empty vs saved
  // session. Refetched on focus-gain so a user who installed
  // Ollama outside the app and refocused doesn't see a stale
  // "unreachable" dot.
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const raw = await invoke<{
          reachable: boolean;
          models: string[];
          has_default_model: boolean;
          error: string | null;
        }>("ai_chat_probe", { modelHint: null });
        if (cancelled) return;
        setProbe({
          reachable: raw.reachable,
          models: raw.models,
          hasDefaultModel: raw.has_default_model,
          error: raw.error,
        });
      } catch (e) {
        if (cancelled) return;
        setProbe({
          reachable: false,
          models: [],
          hasDefaultModel: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    };
    void run();
    // Re-probe on window focus — covers the "user installed
    // Ollama, comes back to the app, expects the dot to update"
    // flow. Tauri's onFocusChanged fires every focus toggle;
    // we filter to focus-gain only.
    let unFocus: (() => void) | undefined;
    (async () => {
      try {
        const { getCurrentWebviewWindow } = await import(
          "@tauri-apps/api/webviewWindow"
        );
        const win = getCurrentWebviewWindow();
        const unlisten = await win.onFocusChanged(({ payload: focused }) => {
          if (focused) void run();
        });
        if (cancelled) {
          unlisten();
        } else {
          unFocus = unlisten;
        }
      } catch {
        /* Tauri APIs unavailable — no-op outside the desktop shell. */
      }
    })();
    return () => {
      cancelled = true;
      unFocus?.();
    };
  }, []);

  /// Hide the popover (Tauri-side hide() — preserves window +
  /// React state for fast re-open).
  const handleClose = useCallback(() => {
    void invoke("tray_hide");
  }, []);

  // Esc dismisses the popover.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  // Auto-hide on blur. Standard macOS NSPopover behaviour:
  // clicking anywhere outside the popover dismisses it.
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        const { getCurrentWebviewWindow } = await import(
          "@tauri-apps/api/webviewWindow"
        );
        const win = getCurrentWebviewWindow();
        const unlisten = await win.onFocusChanged(({ payload: focused }) => {
          if (!focused) {
            void invoke("tray_hide");
          }
        });
        if (cancelled) {
          unlisten();
        } else {
          cleanup = unlisten;
        }
      } catch {
        /* Tauri APIs unavailable — no-op outside the desktop shell. */
      }
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  // libre:// link clicks from chat / agent surfaces. These bubble
  // up as window CustomEvents fired by `AiChatPanel`. Forward
  // through Tauri so the main window's listeners route them to
  // its course / lesson open path.
  useEffect(() => {
    const onCourse = (ev: Event) => {
      const id = (ev as CustomEvent<{ courseId?: string }>).detail?.courseId;
      if (!id) return;
      void emit("libre:tray-open-course", { courseId: id });
      void invoke("tray_focus_main");
    };
    const onLesson = (ev: Event) => {
      const detail = (
        ev as CustomEvent<{ courseId?: string; lessonId?: string }>
      ).detail;
      if (!detail?.courseId || !detail?.lessonId) return;
      void emit("libre:tray-open-lesson", {
        courseId: detail.courseId,
        lessonId: detail.lessonId,
      });
      void invoke("tray_focus_main");
    };
    window.addEventListener("libre:open-course", onCourse);
    window.addEventListener("libre:open-lesson", onLesson);
    return () => {
      window.removeEventListener("libre:open-course", onCourse);
      window.removeEventListener("libre:open-lesson", onLesson);
    };
  }, []);

  // Stable callback for the surface — keeps `TraySurface`'s
  // useEffect deps from re-firing on every parent re-render.
  const handleMessagesChange = useCallback(
    (msgs: TrayMessage[]) => {
      sessions.syncActive(msgs);
    },
    [sessions],
  );

  return (
    <div className="libre-tray" data-tray-mode={sessions.active.mode}>
      <TrayHeader
        mode={sessions.active.mode}
        setMode={sessions.setMode}
        probe={probe}
        sessions={sessions.sessions}
        activeId={sessions.active.id}
        onSelectSession={sessions.selectSession}
        onNewSession={() => sessions.newSession(sessions.active.mode)}
        onDeleteSession={sessions.deleteSession}
      />
      <TraySurface
        // `key` forces a fresh mount when the user picks a
        // different session, which lets the inner chat hook read
        // the new session's saved messages as initial state.
        // Including mode in the key handles the mode-flip case
        // where the underlying session id is the same but we
        // want the OTHER hook to come up.
        key={`${sessions.active.id}:${sessions.active.mode}`}
        mode={sessions.active.mode}
        initialMessages={sessions.active.messages}
        onClose={handleClose}
        onMessagesChange={handleMessagesChange}
      />
    </div>
  );
}
