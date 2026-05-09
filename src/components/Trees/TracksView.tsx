/// Tracks feature: a standalone view for curated linear paths,
/// promoted out of the Trees view's "tracks shelf" subsection so it
/// gets its own navigation-rail entry. Trees + Tracks are
/// complementary affordances:
///   - Trees show the full prerequisite DAG for a topic — the
///     learner picks their entry point and explores horizontally.
///   - Tracks are author-curated linear sequences through one or
///     more trees — the learner says "I want to ship X" and walks
///     the recipe.
///
/// They used to share a screen because the count of tracks was
/// small. Now that the catalog is filling out, putting Tracks
/// behind their own icon makes the affordance discoverable: a
/// learner browsing the rail sees "Tracks" and immediately knows
/// what kind of thing lives there, without first scrolling past a
/// long Trees grid.

import { useMemo, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { trainTrack } from "@base/primitives/icon/icons/train-track";
import "@base/primitives/icon/icon.css";
import type { Course } from "../../data/types";
import { TREES } from "../../data/trees";
import { TRACKS } from "../../data/tracks";
import { TrackDetail } from "./TrackDetail";
import TrackCard from "./TrackCard";
import "./TreesView.css";

interface Props {
  courses: readonly Course[];
  /// `${courseId}:${lessonId}` set — same shape used by the Sidebar
  /// + lesson reader for marking progress.
  completed: Set<string>;
  /// Open a specific lesson by id pair. Wired by App so clicking a
  /// step's matched lesson lands the learner inside the lesson
  /// reader / editor instead of dead-ending in the track view.
  onOpenLesson: (courseId: string, lessonId: string) => void;
}

export default function TracksView({
  courses,
  completed,
  onOpenLesson,
}: Props) {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
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

  return (
    <div className="fishbones-trees">
      <header className="fishbones-trees__header">
        <h1 className="fishbones-trees__title">Tracks</h1>
        <p className="fishbones-trees__blurb">
          Curated step-by-step paths. Pick the outcome you want and
          follow the sequence — each step lands on a real lesson in
          one of your installed books, with progress carried back
          into the rest of the app.
        </p>
      </header>

      {/* Reuse the same shelf shape Trees used for its inlined
          tracks subsection, just promoted to be the page's primary
          content instead of a row above the tree grid. The
          `--tracks` modifier carries the train-track accent. */}
      {TRACKS.length > 0 ? (
        <section className="fishbones-trees__section fishbones-trees__section--tracks">
          <div className="fishbones-trees__section-label fishbones-trees__section-label--tracks">
            <span className="fishbones-trees__section-icon" aria-hidden>
              <Icon
                icon={trainTrack}
                size="xs"
                color="currentColor"
                weight="bold"
              />
            </span>
            <span>All tracks</span>
            <span className="fishbones-trees__section-sublabel">
              · {TRACKS.length} curated path{TRACKS.length === 1 ? "" : "s"}
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
      ) : (
        <section className="fishbones-trees__section">
          <p className="fishbones-trees__blurb">
            No tracks defined yet. Tracks live in
            <code> src/data/tracks/</code> — author your own by
            picking a sequence of skill nodes from the existing
            trees.
          </p>
        </section>
      )}
    </div>
  );
}
