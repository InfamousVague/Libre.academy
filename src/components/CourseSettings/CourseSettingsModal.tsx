import { useMemo } from "react";
import type { Course } from "../../data/types";
import "./CourseSettingsModal.css";

interface Props {
  course: Course;
  onDismiss: () => void;
  onExport: () => void;
  onDelete: () => void;
  onRegenerateExercises: () => void;
  onEnrichLessons: () => void;
}

/// Per-course settings modal. Opened from the sidebar's right-click
/// context menu via "Course settings…" — gathers all the
/// course-scoped maintenance actions (regenerate content, export, delete)
/// in one place instead of scattering them across the context menu.
export default function CourseSettingsModal({
  course,
  onDismiss,
  onExport,
  onDelete,
  onRegenerateExercises,
  onEnrichLessons,
}: Props) {
  const stats = useMemo(() => {
    let lessons = 0;
    let exercises = 0;
    let quizzes = 0;
    let readings = 0;
    // "Enrichable" = any non-quiz lesson, since enrichment targets prose.
    // "Enriched" = already has both objectives + enrichment set.
    let enrichable = 0;
    let enriched = 0;
    for (const ch of course.chapters) {
      for (const l of ch.lessons) {
        lessons++;
        if (l.kind === "exercise" || l.kind === "mixed") exercises++;
        else if (l.kind === "quiz") quizzes++;
        else readings++;
        // Enrichment tracking — quizzes never enrich, anything else does.
        // "Enriched" requires BOTH fields present so we don't miscount a
        // lesson that only got one field through.
        if (l.kind !== "quiz") {
          enrichable++;
          if (
            Array.isArray(l.objectives) &&
            l.objectives.length > 0 &&
            l.enrichment
          ) {
            enriched++;
          }
        }
      }
    }
    return { lessons, exercises, quizzes, readings, enrichable, enriched };
  }, [course]);

  const enrichRemaining = stats.enrichable - stats.enriched;

  return (
    <div className="fishbones-coursesettings-backdrop" onClick={onDismiss}>
      <div
        className="fishbones-coursesettings-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fishbones-coursesettings-header">
          <div className="fishbones-coursesettings-titleblock">
            <div className="fishbones-coursesettings-title">Course settings</div>
            <div className="fishbones-coursesettings-course">{course.title}</div>
            {course.author && (
              <div className="fishbones-coursesettings-author">by {course.author}</div>
            )}
          </div>
          <button
            className="fishbones-coursesettings-close"
            onClick={onDismiss}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="fishbones-coursesettings-body">
          <section>
            <div className="fishbones-coursesettings-section">At a glance</div>
            <div className="fishbones-coursesettings-stats">
              <div>
                <div className="fishbones-coursesettings-stat-value">
                  {course.chapters.length}
                </div>
                <div className="fishbones-coursesettings-stat-label">chapters</div>
              </div>
              <div>
                <div className="fishbones-coursesettings-stat-value">{stats.lessons}</div>
                <div className="fishbones-coursesettings-stat-label">lessons</div>
              </div>
              <div>
                <div className="fishbones-coursesettings-stat-value">{stats.exercises}</div>
                <div className="fishbones-coursesettings-stat-label">exercises</div>
              </div>
              <div>
                <div className="fishbones-coursesettings-stat-value">{stats.readings}</div>
                <div className="fishbones-coursesettings-stat-label">readings</div>
              </div>
            </div>
          </section>

          <section>
            <div className="fishbones-coursesettings-section">Regenerate content</div>
            <div className="fishbones-coursesettings-row">
              <div className="fishbones-coursesettings-row-text">
                <div className="fishbones-coursesettings-row-label">
                  Regenerate exercises
                </div>
                <div className="fishbones-coursesettings-row-hint">
                  Re-run the AI generation for all {stats.exercises} exercise
                  lessons using the latest prompt. Readings and quizzes are
                  untouched. Progress shows in the floating panel and each
                  lesson saves as it completes — safe to cancel midway.
                </div>
              </div>
              <button
                className="fishbones-coursesettings-btn fishbones-coursesettings-btn--primary"
                onClick={() => {
                  onRegenerateExercises();
                  onDismiss();
                }}
                disabled={stats.exercises === 0}
              >
                Regenerate
              </button>
            </div>
          </section>

          <section>
            <div className="fishbones-coursesettings-section">
              Reading experience
            </div>
            <div className="fishbones-coursesettings-row">
              <div className="fishbones-coursesettings-row-text">
                <div className="fishbones-coursesettings-row-label">
                  Enrich lessons
                </div>
                <div className="fishbones-coursesettings-row-hint">
                  Generate learning objectives, glossary terms, and inline
                  symbol doc-links for {enrichRemaining} lesson
                  {enrichRemaining === 1 ? "" : "s"} that don't have them yet.
                  Much cheaper than regenerating — only the new reading-aid
                  fields are produced, the existing body / starter / solution
                  / tests are untouched. Safe to cancel midway: it resumes
                  where it left off on the next run.
                  {stats.enriched > 0 && (
                    <>
                      {" "}
                      ({stats.enriched} of {stats.enrichable} already enriched.)
                    </>
                  )}
                </div>
              </div>
              <button
                className="fishbones-coursesettings-btn fishbones-coursesettings-btn--primary"
                onClick={() => {
                  onEnrichLessons();
                  onDismiss();
                }}
                disabled={enrichRemaining === 0}
              >
                {enrichRemaining === 0 ? "All enriched" : "Enrich"}
              </button>
            </div>
          </section>

          <section>
            <div className="fishbones-coursesettings-section">Share</div>
            <div className="fishbones-coursesettings-row">
              <div className="fishbones-coursesettings-row-text">
                <div className="fishbones-coursesettings-row-label">Export as .fishbones</div>
                <div className="fishbones-coursesettings-row-hint">
                  Save the course as a portable `.fishbones` archive. Anyone
                  with Fishbones can import it.
                </div>
              </div>
              <button
                className="fishbones-coursesettings-btn"
                onClick={() => {
                  onExport();
                  onDismiss();
                }}
              >
                Export…
              </button>
            </div>
          </section>

          <section>
            <div className="fishbones-coursesettings-section fishbones-coursesettings-section--danger">
              Danger zone
            </div>
            <div className="fishbones-coursesettings-row">
              <div className="fishbones-coursesettings-row-text">
                <div className="fishbones-coursesettings-row-label">Delete course</div>
                <div className="fishbones-coursesettings-row-hint">
                  Removes the course, all lesson progress, and the ingest
                  cache from disk. Can't be undone.
                </div>
              </div>
              <button
                className="fishbones-coursesettings-btn fishbones-coursesettings-btn--danger"
                onClick={() => {
                  onDelete();
                  onDismiss();
                }}
              >
                Delete…
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
