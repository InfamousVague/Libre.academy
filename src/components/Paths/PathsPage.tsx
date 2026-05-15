/// Curated learning-paths surface. Two views, one component:
///
///   - LIST: a card per path (role icon, blurb, overall progress).
///     Clicking a card drills into the detail tree.
///   - DETAIL: a horizontally-scrollable tree of the selected path
///     — trunk steps left-to-right, forks fanning into stacked
///     branch lanes. See `PathDetail`.
///
/// Selection is local state (not an App route) so the back button
/// is trivial and we don't have to thread a second route id
/// through App.tsx. Progress is computed fresh from `completed`
/// every render via the shared `pathProgress` helpers.

import { useMemo, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { arrowRight } from "@base/primitives/icon/icons/arrow-right";
import "@base/primitives/icon/icon.css";

import { LEARNING_PATHS } from "../../data/paths";
import type { Course } from "../../data/types";
import { useT } from "../../i18n/i18n";
import {
  indexCourses,
  resolvePathProgress,
} from "./pathProgress";
import { PATH_ICON } from "./pathIcons";
import PathDetail from "./PathDetail";
import "./PathsPage.css";

interface Props {
  /// All installed courses. Steps resolve their `courseId` against
  /// this list. Optional so the page still renders (everything as
  /// "not installed") when no list is plumbed through.
  courses?: Course[];
  /// Per-lesson completion set (keys: `${courseId}:${lessonId}`).
  completed?: Set<string>;
  /// Open / resume an INSTALLED course (parent owns "resume at
  /// which lesson").
  onOpenCourse?: (courseId: string) => void;
  /// Route to Discover so the learner can install a step's course
  /// that isn't in their library yet.
  onBrowseCatalog?: () => void;
}

export default function PathsPage({
  courses = [],
  completed = new Set(),
  onOpenCourse,
  onBrowseCatalog,
}: Props) {
  const t = useT();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const byId = useMemo(() => indexCourses(courses), [courses]);

  const cards = useMemo(
    () =>
      LEARNING_PATHS.map((path) => ({
        path,
        progress: resolvePathProgress(path, byId, completed),
      })),
    [byId, completed],
  );

  const selected = selectedId
    ? LEARNING_PATHS.find((p) => p.id === selectedId)
    : null;

  if (selected) {
    return (
      <PathDetail
        path={selected}
        byId={byId}
        completed={completed}
        onBack={() => setSelectedId(null)}
        onOpenCourse={onOpenCourse}
        onBrowseCatalog={onBrowseCatalog}
      />
    );
  }

  return (
    <div className="libre-paths-page">
      <header className="libre-paths-page__header">
        <h1 className="libre-paths-page__title">{t("paths.title")}</h1>
        <p className="libre-paths-page__subtitle">{t("paths.subtitle")}</p>
      </header>

      <div className="libre-paths-page__grid">
        {cards.map(({ path, progress }) => (
          <button
            key={path.id}
            type="button"
            className={
              "libre-path-card" +
              (progress.allComplete ? " libre-path-card--complete" : "")
            }
            onClick={() => setSelectedId(path.id)}
            aria-label={t("paths.ariaPath", {
              title: path.title,
              pct: `${progress.pct}%`,
            })}
          >
            <div className="libre-path-card__head">
              <span className="libre-path-card__icon" aria-hidden>
                <Icon
                  icon={PATH_ICON[path.icon]}
                  size="lg"
                  color="currentColor"
                />
              </span>
              <div className="libre-path-card__head-text">
                <h2 className="libre-path-card__title">{path.title}</h2>
                <p className="libre-path-card__blurb">{path.blurb}</p>
              </div>
              <span className="libre-path-card__open" aria-hidden>
                <Icon icon={arrowRight} size="sm" color="currentColor" />
              </span>
            </div>

            <div className="libre-path-card__progress">
              <div className="libre-path-card__bar" aria-hidden>
                <div
                  className="libre-path-card__bar-fill"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <div className="libre-path-card__progress-meta">
                <span className="libre-path-card__pct">
                  {t("paths.percentComplete", { pct: `${progress.pct}%` })}
                </span>
                <span className="libre-path-card__coverage">
                  {t("paths.coursesInstalled", {
                    installed: progress.installed,
                    total: progress.count,
                  })}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
