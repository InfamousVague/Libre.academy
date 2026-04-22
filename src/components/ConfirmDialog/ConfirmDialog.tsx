import { useEffect } from "react";
import "./ConfirmDialog.css";

interface Props {
  title: string;
  /// Body text. Short paragraph explaining what will happen. Multi-line
  /// strings are rendered as-is; use `<br/>` in a node if you need markup.
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /// When true, the confirm button gets the red destructive treatment.
  /// Use for deletes, irrecoverable data loss, etc.
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/// App-styled confirmation modal. Replaces window.confirm() so we get
/// consistent theming + better UX (escape to cancel, backdrop-click to
/// cancel, autofocus cancel for destructive actions so the "safe" path
/// is the default Enter target).
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  // Escape closes. Keyed off of mount so this only listens while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fishbones-confirm-backdrop" onClick={onCancel}>
      <div
        className="fishbones-confirm-panel"
        role="alertdialog"
        aria-labelledby="fishbones-confirm-title"
        aria-describedby="fishbones-confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fishbones-confirm-title" id="fishbones-confirm-title">
          {title}
        </div>
        <div className="fishbones-confirm-message" id="fishbones-confirm-message">
          {message}
        </div>
        <div className="fishbones-confirm-actions">
          <button
            type="button"
            className="fishbones-confirm-btn fishbones-confirm-btn--cancel"
            onClick={onCancel}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`fishbones-confirm-btn ${
              danger ? "fishbones-confirm-btn--danger" : "fishbones-confirm-btn--primary"
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
