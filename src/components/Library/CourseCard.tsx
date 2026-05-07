import { memo } from "react";
import type { Course } from "../../data/types";
import LanguageChip from "../LanguageChip/LanguageChip";

/// One info-dense library card. Renders either:
///
///   - **Library mode** (default): a clickable card with title /
///     author / progress bar / per-card actions (Reinstall / Export
///     / Delete). Right-clicking surfaces the same context menu the
///     sidebar uses.
///   - **Discover mode** (`placeholder` true): a non-clickable card
///     with an Install button instead of the progress meter, used in
///     the catalog browser to show books the user hasn't installed
///     yet. The same wrapper is reused so visual weight stays
///     identical between Library and Discover.
///
/// Extracted from `CourseLibrary.tsx` — the parent owns the data
/// fetching + filter state; this is a pure render of one tile.
interface Props {
  course: Course;
  total: number;
  done: number;
  pct: number;
  onOpen: () => void;
  /// Right-click handler — surfaces the card's context menu
  /// (Reinstall / Export / Settings / Reset / Delete). The parent
  /// `CourseLibrary` opens its own context menu component with the
  /// full action set; this card no longer renders inline buttons
  /// for those actions to keep the grid visually clean.
  onContextMenu?: (e: React.MouseEvent) => void;
  /// Discover-mode flag — swaps the progress meter for an Install
  /// button (or "Installing…" spinner). Passed through from the
  /// library's per-tile install handler so the same code path works
  /// in both views.
  placeholder?: boolean;
  installing?: boolean;
  onInstall?: () => void;
  /// Update-available indicator — a small dot in the card header
  /// when an updated bundled archive is on disk. Replaces the
  /// loud "Update" button the card used to render; the actual
  /// reinstall action now lives in the right-click context menu
  /// only, surfaced upstream via `onUpdateCourse`.
  hasUpdate?: boolean;
}

function CourseCardImpl({
  course,
  total,
  done,
  pct,
  onOpen,
  onContextMenu,
  placeholder,
  installing,
  onInstall,
  hasUpdate,
}: Props) {
  const chapters = course.chapters.length;
  const isCompleted = pct === 1;
  const status =
    pct === 0
      ? "not started"
      : isCompleted
        ? "completed"
        : `${Math.round(pct * 100)}%`;

  // Placeholder cards (Discover mode) have no progress, no chapters
  // yet — just metadata + the install affordance. We use the same
  // wrapper but render a different inner block.
  if (placeholder) {
    return (
      <div
        className="fishbones-library-card fishbones-library-card--placeholder"
        onContextMenu={onContextMenu}
      >
        <div className="fishbones-library-card-main">
          <div className="fishbones-library-card-header">
            <LanguageChip language={course.language} size="sm" />
            <span className="fishbones-library-card-status">Available</span>
          </div>
          <div className="fishbones-library-card-title">{course.title}</div>
          {course.author && (
            <div className="fishbones-library-card-author">by {course.author}</div>
          )}
          <div className="fishbones-library-card-meta">
            {chapters > 0
              ? `${chapters} chapter${chapters === 1 ? "" : "s"}`
              : "Catalog book"}
          </div>
        </div>
        <div className="fishbones-library-card-actions">
          <button
            type="button"
            className="fishbones-library-card-action fishbones-library-card-action--install"
            onClick={(e) => {
              e.stopPropagation();
              onInstall?.();
            }}
            disabled={installing || !onInstall}
            title="Add this book to your library"
          >
            {installing ? "Installing…" : "Install"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fishbones-library-card" onContextMenu={onContextMenu}>
      <button
        type="button"
        className="fishbones-library-card-main"
        onClick={onOpen}
      >
        <div className="fishbones-library-card-header">
          <LanguageChip language={course.language} size="sm" />
          {hasUpdate && (
            <span
              className="fishbones-library-card-update-dot"
              aria-label="Update available — right-click for actions"
              title="Update available — right-click for actions"
            />
          )}
          <span
            className={
              isCompleted
                ? "fishbones-library-card-status fishbones-library-card-status--completed"
                : "fishbones-library-card-status"
            }
          >
            {isCompleted && (
              // Crown icon — marks fully-finished courses on the
              // grid view. Inline SVG so we don't pull in an icon
              // library just for one glyph; sized to sit in the
              // baseline of the uppercase status text.
              <svg
                className="fishbones-library-card-status-icon"
                viewBox="0 0 24 24"
                width="11"
                height="11"
                fill="currentColor"
                aria-hidden
              >
                <path d="M3 7l4 5 5-7 5 7 4-5v11H3V7zm0 13h18v2H3z" />
              </svg>
            )}
            {status}
          </span>
        </div>
        <div className="fishbones-library-card-title">{course.title}</div>
        {course.author && (
          <div className="fishbones-library-card-author">by {course.author}</div>
        )}
        <div className="fishbones-library-card-progress" aria-hidden>
          <div
            className="fishbones-library-card-progress-fill"
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <div className="fishbones-library-card-meta">
          {done}/{total} lessons · {chapters} chapter{chapters === 1 ? "" : "s"}
        </div>
      </button>
    </div>
  );
}

/// Memo-wrapped because the library re-renders on every filter / sort /
/// search keystroke; without this each of those re-renders walks every
/// card's render function even when its props haven't changed. The
/// default shallow-equal works — every prop is a primitive, a stable
/// course-object reference, or a stable callback (parent uses
/// `useCallback` on the per-card handlers).
const CourseCard = memo(CourseCardImpl);
export default CourseCard;
