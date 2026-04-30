/// Two-state overlay paired with `useArchiveDrop`:
///
///   - When a `.fishbones`/`.kata` is being dragged over the app
///     window, render a full-window drop target ("Drop courses here")
///     so the user gets unambiguous feedback that the OS-level drag
///     is being recognised by the right surface.
///   - Once the drop happens, fade to a small bottom-center status
///     pill ("Importing 2 of 5…") that stays up until the queue
///     drains. Non-blocking — the rest of the app is interactable
///     while imports run.
///
/// Both states are decorative: the drop event itself is captured by
/// Tauri's webview, not by this component, so we set `pointer-events:
/// none` on the backdrop. This is the same pattern Slack / VS Code
/// use for drag previews.

import { Icon } from "@base/primitives/icon";
import { upload } from "@base/primitives/icon/icons/upload";
import { bookOpen } from "@base/primitives/icon/icons/book-open";
import "./ArchiveDropOverlay.css";

interface Props {
  /// Drag-over state from useArchiveDrop. When true, render the
  /// full-window drop target.
  isDragging: boolean;
  /// Import-in-flight state from useArchiveDrop. When true, render
  /// the bottom-center progress pill.
  isImporting: boolean;
  /// Progress payload from useArchiveDrop. Drives the "N of M" copy.
  progress: { current: number; total: number } | null;
}

export default function ArchiveDropOverlay({
  isDragging,
  isImporting,
  progress,
}: Props) {
  return (
    <>
      {/* Full-window drop target. Pointer-events disabled so the
          dashed-border glass surface doesn't intercept anything —
          the OS-level drag passes straight through to Tauri's
          webview drop handler. */}
      <div
        className={`fishbones-archive-drop ${
          isDragging ? "fishbones-archive-drop--active" : ""
        }`}
        aria-hidden={!isDragging}
      >
        <div className="fishbones-archive-drop__panel">
          <div className="fishbones-archive-drop__icon" aria-hidden>
            <Icon icon={upload} size="xl" color="currentColor" />
          </div>
          <div className="fishbones-archive-drop__title">
            Drop to add to your library
          </div>
          <div className="fishbones-archive-drop__sub">
            Accepts <code>.fishbones</code> and <code>.kata</code> archives.
          </div>
        </div>
      </div>

      {/* Bottom-center import progress pill. Independently rendered
          so a fast drop → import sequence can show progress without
          waiting for the dragging overlay to finish fading. */}
      {isImporting && progress && (
        <div className="fishbones-archive-toast" role="status" aria-live="polite">
          <span className="fishbones-archive-toast__icon" aria-hidden>
            <Icon icon={bookOpen} size="sm" color="currentColor" />
          </span>
          <span className="fishbones-archive-toast__label">
            {progress.total === 1
              ? "Importing course…"
              : `Importing ${progress.current} of ${progress.total}…`}
          </span>
          <span
            className="fishbones-archive-toast__bar"
            aria-hidden
            style={{
              ["--p" as string]: `${(progress.current / progress.total) * 100}%`,
            }}
          />
        </div>
      )}
    </>
  );
}
