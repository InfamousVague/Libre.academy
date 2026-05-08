/// Card on the Tracks shelf inside TreesView. Visually a sibling of
/// `TreeCard` — same border / hover / progress-bar treatment, swapped
/// content (curated linear journey rather than full DAG).
///
/// Each card carries:
///   * the track's "Tracks" tag tinted with its accent (so the row of
///     tracks reads as a coherent set even with different accents),
///   * the racetrack glyph in the upper-left,
///   * track title + outcome subtitle,
///   * description (clamped to 3 lines so cards stay roughly equal
///     height regardless of how chatty the track copy is),
///   * a meta line with step count + estimated hours + difficulty,
///   * the same fill-bar treatment as TreeCard for progress.

import { Icon } from "@base/primitives/icon";
import { trainTrack } from "@base/primitives/icon/icons/train-track";
import "@base/primitives/icon/icon.css";
import {
  trackProgressPercent,
  type LearningTrack,
} from "../../data/tracks";
import type { SkillTree } from "../../data/trees";

interface TrackCardProps {
  track: LearningTrack;
  trees: readonly SkillTree[];
  completed: Set<string>;
  onOpen: () => void;
}

export default function TrackCard({
  track,
  trees,
  completed,
  onOpen,
}: TrackCardProps) {
  const pct = trackProgressPercent(track, trees, completed);
  const stepCount = track.steps.length;

  return (
    <button
      type="button"
      className="fishbones-trees__card fishbones-trees__track-card"
      style={{ "--tree-accent": track.accent } as React.CSSProperties}
      onClick={onOpen}
    >
      <div className="fishbones-trees__card-head">
        <span className="fishbones-trees__track-card-tag">
          <span
            className="fishbones-trees__track-card-icon"
            aria-hidden
          >
            <Icon icon={trainTrack} size="xs" color="currentColor" weight="bold" />
          </span>
          <span>{track.short}</span>
        </span>
        <span className="fishbones-trees__card-pct">{pct}%</span>
      </div>
      <div className="fishbones-trees__card-title">{track.title}</div>
      <div className="fishbones-trees__track-card-outcome">{track.outcome}</div>
      <div className="fishbones-trees__card-blurb">{track.description}</div>
      <div className="fishbones-trees__card-meta">
        <span>
          {stepCount} step{stepCount === 1 ? "" : "s"}
          {track.estimatedHours ? ` · ~${track.estimatedHours}h` : ""}
          {" · "}
          {track.difficulty}
        </span>
      </div>
      <div
        className="fishbones-trees__card-bar"
        aria-label={`${pct} percent complete`}
      >
        <div
          className="fishbones-trees__card-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
