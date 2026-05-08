/// Trees feature: the top-level view that lets the learner pick
/// which skill tree to walk, then renders the chosen tree's DAG.
///
/// Navigation: `<TreesView>` is mounted as a top-level destination
/// from the sidebar. It owns its own internal "currently-viewing"
/// state — clicking a tree card from the shelf opens that tree;
/// clicking the back chevron returns to the shelf. We could push
/// this into App-level routing later (?tree=foundations) but it's
/// not worth the URL plumbing yet.
///
/// The shelf has THREE sections:
///   1. **Tracks** — Codecademy-style curated journeys. Show first
///      because they're the most opinionated path for a learner who
///      doesn't yet know what they want to do.
///   2. **Start here** — beginner trees (Foundations).
///   3. **Specialties** — every other tree.

import { useMemo, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { trainTrack } from "@base/primitives/icon/icons/train-track";
import "@base/primitives/icon/icon.css";
import type { Course } from "../../data/types";
import { TREES } from "../../data/trees";
import { TRACKS } from "../../data/tracks";
import { TreeDetail } from "./TreeDetail";
import { TrackDetail } from "./TrackDetail";
import TreeCard from "./TreeCard";
import TrackCard from "./TrackCard";
import "./TreesView.css";

// Re-export so the fishbones.academy marketing site (and any other
// external caller importing from this path) keeps working after the
// internal split into TreeDetail.tsx / SkillPanel.tsx / etc.
export { TreeDetail } from "./TreeDetail";
export type { TreeDetailProps } from "./TreeDetail";

interface Props {
  courses: readonly Course[];
  /// Same `${courseId}:${lessonId}` set the rest of the app uses.
  completed: Set<string>;
  /// Open a specific lesson — same shape as Sidebar's onSelectLesson.
  /// Wired by App so clicking a skill node's matched lesson takes
  /// the learner directly into that lesson's reader.
  onOpenLesson: (courseId: string, lessonId: string) => void;
  /// Batch-install handler for the SkillPanel's "Install N missing
  /// books on this path" button. Forwarded straight to TreeDetail —
  /// see its prop docs for the contract.
  onInstallMissingCourses?: (courseIds: string[]) => Promise<void>;
}

export default function TreesView({
  courses,
  completed,
  onOpenLesson,
  onInstallMissingCourses,
}: Props) {
  // Two parallel "currently-open" states — at most one of these is
  // non-null at a time. Clicking a tree card sets `activeTreeId`;
  // clicking a track card sets `activeTrackId`. Back from either
  // detail view clears the relevant one.
  const [activeTreeId, setActiveTreeId] = useState<string | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const activeTree = useMemo(
    () => TREES.find((t) => t.id === activeTreeId) ?? null,
    [activeTreeId],
  );
  const activeTrack = useMemo(
    () => TRACKS.find((t) => t.id === activeTrackId) ?? null,
    [activeTrackId],
  );

  if (activeTrack) {
    return (
      <TrackDetail
        track={activeTrack}
        trees={TREES}
        courses={courses}
        completed={completed}
        onBack={() => setActiveTrackId(null)}
        onOpenLesson={onOpenLesson}
      />
    );
  }

  if (activeTree) {
    return (
      <TreeDetail
        tree={activeTree}
        courses={courses}
        completed={completed}
        onBack={() => setActiveTreeId(null)}
        onOpenLesson={onOpenLesson}
        onInstallMissingCourses={onInstallMissingCourses}
      />
    );
  }

  const beginnerTrees = TREES.filter((t) => t.audience === "beginner");
  const specialtyTrees = TREES.filter((t) => t.audience === "specialty");

  return (
    <div className="fishbones-trees">
      <header className="fishbones-trees__header">
        <h1 className="fishbones-trees__title">Skill Trees</h1>
        <p className="fishbones-trees__blurb">
          Map out the path from where you are to where you want to be. Pick a
          curated <strong>track</strong> if you know the outcome you want, or
          dive into a tree to explore the full skill graph.
        </p>
      </header>

      {/* Tracks shelf — opinionated career-shaped paths. Goes first
          because for a learner who doesn't know where to start, this
          is the answer they're looking for. */}
      {TRACKS.length > 0 && (
        <section className="fishbones-trees__section fishbones-trees__section--tracks">
          <div className="fishbones-trees__section-label fishbones-trees__section-label--tracks">
            <span
              className="fishbones-trees__section-icon"
              aria-hidden
            >
              <Icon icon={trainTrack} size="xs" color="currentColor" weight="bold" />
            </span>
            <span>Tracks</span>
            <span className="fishbones-trees__section-sublabel">
              · curated career paths
            </span>
          </div>
          <div className="fishbones-trees__grid fishbones-trees__grid--tracks">
            {TRACKS.map((t) => (
              <TrackCard
                key={t.id}
                track={t}
                trees={TREES}
                completed={completed}
                onOpen={() => setActiveTrackId(t.id)}
              />
            ))}
          </div>
        </section>
      )}

      {beginnerTrees.length > 0 && (
        <section className="fishbones-trees__section">
          <div className="fishbones-trees__section-label">Start here</div>
          <div className="fishbones-trees__grid">
            {beginnerTrees.map((t) => (
              <TreeCard
                key={t.id}
                tree={t}
                completed={completed}
                onOpen={() => setActiveTreeId(t.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="fishbones-trees__section">
        <div className="fishbones-trees__section-label">Specialties</div>
        <div className="fishbones-trees__grid">
          {specialtyTrees.map((t) => (
            <TreeCard
              key={t.id}
              tree={t}
              completed={completed}
              onOpen={() => setActiveTreeId(t.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
