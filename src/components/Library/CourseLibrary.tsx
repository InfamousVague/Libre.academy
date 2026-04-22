import { useMemo, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { libraryBig } from "@base/primitives/icon/icons/library-big";
import "@base/primitives/icon/icon.css";
import type { Course, LanguageId } from "../../data/types";
import "./CourseLibrary.css";

interface Props {
  courses: Course[];
  completed: Set<string>;
  onDismiss: () => void;
  onOpen: (courseId: string) => void;
  /// Opens the PDF import wizard.
  onImport: () => void;
  /// Opens a file picker for a previously-exported `.fishbones` (or legacy
  /// `.kata`) archive and unzips it into the courses dir. Optional — when omitted the button
  /// is hidden (e.g. in environments where the Tauri dialog plugin isn't
  /// available).
  onImportArchive?: () => void;
  onExport?: (courseId: string, courseTitle: string) => void;
  onDelete?: (courseId: string, courseTitle: string) => void;
  /// "modal" (default) — centered overlay with a dimmed backdrop; closed
  /// via the × button or clicking the backdrop.
  /// "inline" — renders inside the current container with no backdrop,
  /// suitable for the "no-tabs-open" empty state. The close × is hidden
  /// since there's no underlying view to return to.
  mode?: "modal" | "inline";
}

type SortKey = "name" | "progress" | "lessons";

const LANG_PILLS: Array<{ id: "all" | LanguageId; label: string }> = [
  { id: "all", label: "All" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "rust", label: "Rust" },
  { id: "swift", label: "Swift" },
];

/// Browse-all-courses screen. Full-pane modal with language filter chips,
/// sort dropdown, and a responsive grid of course cards. Each card shows
/// progress + lesson count and offers Open / Export / Delete via a hover
/// action row. Empty state invites the user to import their first book.
export default function CourseLibrary({
  courses,
  completed,
  onDismiss,
  onOpen,
  onImport,
  onImportArchive,
  onExport,
  onDelete,
  mode = "modal",
}: Props) {
  const isInline = mode === "inline";
  const [langFilter, setLangFilter] = useState<"all" | LanguageId>("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [query, setQuery] = useState("");

  // Pre-compute per-course progress so sorting + display share one walk.
  const enriched = useMemo(() => {
    return courses.map((c) => {
      let total = 0;
      let done = 0;
      for (const ch of c.chapters) {
        for (const l of ch.lessons) {
          total += 1;
          if (completed.has(`${c.id}:${l.id}`)) done += 1;
        }
      }
      return {
        course: c,
        total,
        done,
        pct: total > 0 ? done / total : 0,
      };
    });
  }, [courses, completed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched
      .filter((e) => langFilter === "all" || e.course.language === langFilter)
      .filter((e) =>
        q === ""
          ? true
          : e.course.title.toLowerCase().includes(q) ||
            (e.course.author ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "progress":
            return b.pct - a.pct;
          case "lessons":
            return b.total - a.total;
          case "name":
          default:
            return a.course.title.localeCompare(b.course.title);
        }
      });
  }, [enriched, langFilter, sortBy, query]);

  // Count courses per language so the filter chips can show badges and
  // hide languages with zero courses (unless they're the active filter).
  const countByLang = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of enriched) {
      m.set(e.course.language, (m.get(e.course.language) ?? 0) + 1);
    }
    return m;
  }, [enriched]);

  // The panel content is identical in both modes; only the wrapper differs:
  // modal wraps with a full-viewport backdrop, inline just renders in place.
  const panel = (
    <div
      className={`fishbones-library-panel ${isInline ? "fishbones-library-panel--inline" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
        <div className="fishbones-library-header">
          <div className="fishbones-library-titleblock">
            <span className="fishbones-library-title">Library</span>
            <span className="fishbones-library-subtitle">
              {courses.length} course{courses.length === 1 ? "" : "s"} on this machine
            </span>
          </div>
          <div className="fishbones-library-header-actions">
            {onImportArchive && (
              <button
                className="fishbones-library-import fishbones-library-import--secondary"
                onClick={onImportArchive}
                title="Import a previously-exported .fishbones course archive (legacy .kata also supported)"
              >
                Import archive…
              </button>
            )}
            <button className="fishbones-library-import" onClick={onImport}>
              Import from PDF…
            </button>
            {!isInline && (
              <button className="fishbones-library-close" onClick={onDismiss} aria-label="Close">
                ×
              </button>
            )}
          </div>
        </div>

        {courses.length > 0 && (
          <div className="fishbones-library-controls">
            <div className="fishbones-library-pills" role="tablist" aria-label="Filter by language">
              {LANG_PILLS.filter(
                (p) => p.id === "all" || p.id === langFilter || (countByLang.get(p.id) ?? 0) > 0,
              ).map((p) => {
                const count =
                  p.id === "all" ? courses.length : countByLang.get(p.id) ?? 0;
                return (
                  <button
                    key={p.id}
                    role="tab"
                    aria-selected={langFilter === p.id}
                    className={`fishbones-library-pill ${
                      langFilter === p.id ? "fishbones-library-pill--active" : ""
                    }`}
                    onClick={() => setLangFilter(p.id)}
                  >
                    {p.label}
                    <span className="fishbones-library-pill-count">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="fishbones-library-tools">
              <input
                type="search"
                className="fishbones-library-search"
                placeholder="Search title or author…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <label className="fishbones-library-sort">
                <span className="fishbones-library-sort-label">sort</span>
                <select
                  className="fishbones-library-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                >
                  <option value="name">Name (A–Z)</option>
                  <option value="progress">Progress</option>
                  <option value="lessons">Lesson count</option>
                </select>
              </label>
            </div>
          </div>
        )}

        <div className="fishbones-library-body">
          {courses.length === 0 ? (
            <div className="fishbones-library-empty">
              <div className="fishbones-library-empty-glyph" aria-hidden>
                <Icon icon={libraryBig} size="2xl" color="currentColor" weight="light" />
              </div>
              <div className="fishbones-library-empty-title">No courses yet</div>
              <div className="fishbones-library-empty-blurb">
                Import your first book to get started. Fishbones splits a PDF
                into lessons and generates exercises with the Claude API, or
                you can import a `.fishbones` course someone else shared.
              </div>
              <div className="fishbones-library-empty-actions">
                <button className="fishbones-library-empty-primary" onClick={onImport}>
                  Import from PDF…
                </button>
                {onImportArchive && (
                  <button
                    className="fishbones-library-empty-secondary"
                    onClick={onImportArchive}
                  >
                    Import .fishbones archive…
                  </button>
                )}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="fishbones-library-empty">
              <div className="fishbones-library-empty-title">No matches</div>
              <div className="fishbones-library-empty-blurb">
                Try clearing the filter or searching for a different title.
              </div>
            </div>
          ) : (
            <div className="fishbones-library-grid">
              {filtered.map((e) => (
                <CourseCard
                  key={e.course.id}
                  course={e.course}
                  total={e.total}
                  done={e.done}
                  pct={e.pct}
                  onOpen={() => onOpen(e.course.id)}
                  onExport={
                    onExport
                      ? () => onExport(e.course.id, e.course.title)
                      : undefined
                  }
                  onDelete={
                    onDelete
                      ? () => onDelete(e.course.id, e.course.title)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
    </div>
  );

  // In inline mode, render just the panel so it flows in its parent
  // container. In modal mode, wrap in a backdrop and intercept clicks.
  if (isInline) return panel;
  return (
    <div className="fishbones-library-backdrop" onClick={onDismiss}>
      {panel}
    </div>
  );
}

function CourseCard({
  course,
  total,
  done,
  pct,
  onOpen,
  onExport,
  onDelete,
}: {
  course: Course;
  total: number;
  done: number;
  pct: number;
  onOpen: () => void;
  onExport?: () => void;
  onDelete?: () => void;
}) {
  const chapters = course.chapters.length;
  const status =
    pct === 0
      ? "not started"
      : pct === 1
      ? "completed"
      : `${Math.round(pct * 100)}%`;

  return (
    <div className="fishbones-library-card">
      <button className="fishbones-library-card-main" onClick={onOpen}>
        <div className="fishbones-library-card-header">
          <span className={`fishbones-library-lang fishbones-library-lang--${course.language}`}>
            {langBadge(course.language)}
          </span>
          <span className="fishbones-library-card-status">{status}</span>
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
      <div className="fishbones-library-card-actions">
        {onExport && (
          <button
            className="fishbones-library-card-action"
            onClick={(e) => {
              e.stopPropagation();
              onExport();
            }}
            title="Export as .fishbones archive"
          >
            Export
          </button>
        )}
        {onDelete && (
          <button
            className="fishbones-library-card-action fishbones-library-card-action--danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete this course from disk"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function langBadge(language: LanguageId): string {
  switch (language) {
    case "javascript":
      return "JS";
    case "typescript":
      return "TS";
    case "python":
      return "PY";
    case "rust":
      return "RS";
    case "swift":
      return "SW";
    default:
      return String(language).slice(0, 2).toUpperCase();
  }
}
