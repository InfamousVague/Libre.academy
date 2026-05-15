/// Horizontal tree view for a single learning path.
///
/// Layout: a left-to-right "flow" the user scrolls horizontally.
/// Trunk steps render as a connected row of node cards. A `fork`
/// stage splits the trunk into vertically-stacked branch lanes
/// (alternative routes — "iOS / Android / Flutter"), each lane its
/// own horizontal mini-row, with a CSS bracket communicating the
/// split. Branches don't reconverge — each runs to its own end.
///
/// The page itself is the vertical scroll-owner (flex:1 / min-
/// height:0 / overflow-y:auto — the contract every direct child of
/// the overflow:hidden `.libre__main` must honour); the `__flow`
/// element owns the horizontal scroll.

import { Icon } from "@base/primitives/icon";
import { arrowLeft } from "@base/primitives/icon/icons/arrow-left";
import { chevronRight } from "@base/primitives/icon/icons/chevron-right";
import { circleCheck } from "@base/primitives/icon/icons/circle-check";
import { circleDashed } from "@base/primitives/icon/icons/circle-dashed";
import { circle } from "@base/primitives/icon/icons/circle";
import { plus } from "@base/primitives/icon/icons/plus";
import "@base/primitives/icon/icon.css";

import type { LearningPath } from "../../data/paths";
import type { Course } from "../../data/types";
import { useT } from "../../i18n/i18n";
import {
  aggregate,
  resolveBranch,
  resolveStep,
  type ResolvedStep,
  type StepState,
} from "./pathProgress";
import { PATH_ICON } from "./pathIcons";
import "./PathsPage.css";

interface Props {
  path: LearningPath;
  /// id→Course index, built once by the parent (PathsPage).
  byId: Map<string, Course>;
  completed: Set<string>;
  onBack: () => void;
  onOpenCourse?: (courseId: string) => void;
  onBrowseCatalog?: () => void;
}

const STEP_ICON: Record<StepState, string> = {
  complete: circleCheck,
  "in-progress": circleDashed,
  "not-started": circle,
  "not-installed": plus,
};

export default function PathDetail({
  path,
  byId,
  completed,
  onBack,
  onOpenCourse,
  onBrowseCatalog,
}: Props) {
  const t = useT();

  // Flatten trunk + branch steps once for the header rollup.
  const allResolved: ResolvedStep[] = [];
  for (const stage of path.stages) {
    if (stage.kind === "step") {
      allResolved.push(resolveStep(stage.step, byId, completed));
    } else {
      for (const b of stage.branches) {
        for (const s of b.steps) {
          allResolved.push(resolveStep(s, byId, completed));
        }
      }
    }
  }
  const overall = aggregate(allResolved);

  const openStep = (s: ResolvedStep) =>
    s.state === "not-installed"
      ? onBrowseCatalog?.()
      : onOpenCourse?.(s.courseId);

  const renderNode = (s: ResolvedStep, key: string) => {
    const installed = s.state !== "not-installed";
    return (
      <button
        key={key}
        type="button"
        className={`libre-path-node libre-path-node--${s.state}`}
        onClick={() => openStep(s)}
        title={
          installed
            ? t("paths.openCourse", { title: s.title })
            : t("paths.findInDiscover", { title: s.title })
        }
      >
        <span className="libre-path-node__status" aria-hidden>
          <Icon icon={STEP_ICON[s.state]} size="sm" color="currentColor" />
        </span>
        <span className="libre-path-node__title">
          {s.title}
          {s.state === "in-progress" && (
            <span className="libre-path-node__count">
              {" "}
              {s.done}/{s.total}
            </span>
          )}
        </span>
        <span className="libre-path-node__note">{s.note}</span>
      </button>
    );
  };

  // A horizontal run of nodes joined by chevron connectors. Used
  // for the trunk and inside each branch lane.
  const renderRun = (steps: ResolvedStep[], keyPrefix: string) => (
    <div className="libre-path-run">
      {steps.map((s, i) => (
        <div className="libre-path-run__cell" key={`${keyPrefix}:${i}`}>
          {i > 0 && (
            <span className="libre-path-connector" aria-hidden>
              <Icon icon={chevronRight} size="sm" color="currentColor" />
            </span>
          )}
          {renderNode(s, `${keyPrefix}:${i}`)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="libre-path-detail">
      <header className="libre-path-detail__header">
        <button
          type="button"
          className="libre-path-detail__back"
          onClick={onBack}
          aria-label={t("paths.back")}
        >
          <Icon icon={arrowLeft} size="sm" color="currentColor" />
          <span>{t("paths.back")}</span>
        </button>

        <div className="libre-path-detail__head-row">
          <span className="libre-path-detail__icon" aria-hidden>
            <Icon
              icon={PATH_ICON[path.icon]}
              size="lg"
              color="currentColor"
            />
          </span>
          <div className="libre-path-detail__head-text">
            <h1 className="libre-path-detail__title">{path.title}</h1>
            <p className="libre-path-detail__blurb">{path.blurb}</p>
          </div>
        </div>

        <div className="libre-path-detail__progress">
          <div className="libre-path-detail__bar" aria-hidden>
            <div
              className="libre-path-detail__bar-fill"
              style={{ width: `${overall.pct}%` }}
            />
          </div>
          <div className="libre-path-detail__progress-meta">
            <span className="libre-path-detail__pct">
              {t("paths.percentComplete", { pct: `${overall.pct}%` })}
            </span>
            <span>
              {t("paths.coursesInstalled", {
                installed: overall.installed,
                total: overall.count,
              })}
            </span>
          </div>
        </div>
      </header>

      {/* Horizontal scroll lane. `tabIndex` so keyboard users can
          focus the region and arrow-scroll it; the nodes inside
          are independently tabbable buttons. */}
      <div
        className="libre-path-detail__flow"
        role="group"
        aria-label={t("paths.flowAria", { title: path.title })}
        tabIndex={0}
      >
        {path.stages.map((stage, si) => {
          if (stage.kind === "step") {
            const s = resolveStep(stage.step, byId, completed);
            return (
              <div className="libre-path-stage" key={`stage:${si}`}>
                {si > 0 && (
                  <span className="libre-path-connector" aria-hidden>
                    <Icon
                      icon={chevronRight}
                      size="sm"
                      color="currentColor"
                    />
                  </span>
                )}
                {renderNode(s, `stage:${si}`)}
              </div>
            );
          }

          // Fork: split the trunk into stacked branch lanes.
          return (
            <div
              className="libre-path-stage libre-path-stage--fork"
              key={`stage:${si}`}
            >
              {si > 0 && (
                <span
                  className="libre-path-connector libre-path-connector--split"
                  aria-hidden
                >
                  <Icon
                    icon={chevronRight}
                    size="sm"
                    color="currentColor"
                  />
                </span>
              )}
              <div className="libre-path-fork">
                {stage.label && (
                  <div className="libre-path-fork__label">
                    {stage.label}
                  </div>
                )}
                <div className="libre-path-fork__branches">
                  {stage.branches.map((branch) => {
                    const { steps, progress } = resolveBranch(
                      branch,
                      byId,
                      completed,
                    );
                    return (
                      <div
                        className="libre-path-branch"
                        key={branch.id}
                      >
                        <div className="libre-path-branch__head">
                          <span className="libre-path-branch__label">
                            {branch.label}
                          </span>
                          <span className="libre-path-branch__pct">
                            {progress.pct}%
                          </span>
                        </div>
                        {renderRun(steps, `b:${branch.id}`)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
        {/* End cap so the last connector has somewhere to point and
            the flow has a clear terminus. */}
        <div className="libre-path-flow__end" aria-hidden>
          <span className="libre-path-connector" aria-hidden>
            <Icon icon={chevronRight} size="sm" color="currentColor" />
          </span>
          <span className="libre-path-flow__flag">
            {overall.allComplete ? t("paths.endDone") : t("paths.endGoal")}
          </span>
        </div>
      </div>
    </div>
  );
}
