import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import "./Workbench.css";

interface Props {
  editor: ReactNode;
  output: ReactNode;
  /// Stored as a percentage (0–100) of the editor's share of the column.
  /// Default is 75 — three times as tall as the console, matching the
  /// "big editor, small output" feel most learners want.
  defaultEditorPct?: number;
  /// Key used to persist the user's drag into localStorage so it survives
  /// navigation and reloads. Pass a stable string per-layout (we use one
  /// key for the main window and a different one for the popped-out window).
  storageKey?: string;
}

const MIN_EDITOR_PCT = 20;
const MIN_OUTPUT_PCT = 10;

/// Two-pane vertical stack with a draggable divider. Editor on top, console
/// on the bottom. We persist the split ratio so it survives lesson changes.
export default function Workbench({
  editor,
  output,
  defaultEditorPct = 75,
  storageKey = "kata:workbench-split",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorPct, setEditorPct] = useState<number>(() => {
    if (typeof localStorage === "undefined") return defaultEditorPct;
    const stored = localStorage.getItem(storageKey);
    const n = stored ? parseFloat(stored) : NaN;
    return Number.isFinite(n) && n >= MIN_EDITOR_PCT && n <= 100 - MIN_OUTPUT_PCT
      ? n
      : defaultEditorPct;
  });
  const draggingRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Capture the pointer so drag keeps tracking even if it leaves the handle.
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    draggingRef.current = true;
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rel = (e.clientY - rect.top) / rect.height;
      const pct = Math.max(MIN_EDITOR_PCT, Math.min(100 - MIN_OUTPUT_PCT, rel * 100));
      setEditorPct(pct);
    },
    [],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      draggingRef.current = false;
    },
    [],
  );

  // Persist the split ratio whenever the user lets go — we don't want a
  // write on every pointermove tick.
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const id = setTimeout(() => {
      localStorage.setItem(storageKey, editorPct.toFixed(2));
    }, 200);
    return () => clearTimeout(id);
  }, [editorPct, storageKey]);

  return (
    <div className="fishbones-workbench" ref={containerRef}>
      <div
        className="fishbones-workbench-pane fishbones-workbench-pane--editor"
        style={{ height: `${editorPct}%` }}
      >
        {editor}
      </div>
      <div
        className="fishbones-workbench-divider"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize editor and console"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="fishbones-workbench-divider-grip" aria-hidden />
      </div>
      <div
        className="fishbones-workbench-pane fishbones-workbench-pane--output"
        style={{ height: `${100 - editorPct}%` }}
      >
        {output}
      </div>
    </div>
  );
}
