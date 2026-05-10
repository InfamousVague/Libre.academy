/// Summary card surfaced when the learner finishes a chapter or a
/// whole book. Two flavours, distinguished by the `kind` prop:
///
///   - `chapter` — slides up over the lesson view, dismissable, used
///     for chapter-end mini-celebrations. Sound: `complete-section`.
///   - `book` — full-screen modal takeover with the book cover
///     floating up + tilting, used for "you finished a whole book"
///     moments. Sound: `complete-book`. Sustained confetti wash.
///
/// Both renderings share the same data model: course title, optional
/// subtitle ("Chapter 4 / 12"), the XP earned in this section, the
/// streak day count, and any achievements freshly unlocked alongside.
///
/// The component is presentational only — the engine that decides
/// "show this card now" lives in the parent (App.tsx). The parent
/// computes the section delta when the last lesson in a chapter or
/// course flips complete.

import { useEffect } from "react";
import { Icon } from "@base/primitives/icon";
import { x as xIcon } from "@base/primitives/icon/icons/x";
import { flame } from "@base/primitives/icon/icons/flame";
import { coins } from "@base/primitives/icon/icons/coins";
import { bookCheck } from "@base/primitives/icon/icons/book-check";

import type { Achievement } from "../../data/achievements";
import { celebrate } from "../../lib/celebrate";
import { playSound } from "../../lib/sfx";
import ModalBackdrop from "../Shared/ModalBackdrop";
import AchievementBadge from "./AchievementBadge";
import "./Achievements.css";

interface Props {
  kind: "chapter" | "book";
  /// Display title — for chapters, "Chapter 4 / 12" or
  /// "Section title". For books, the book title itself.
  heading: string;
  /// Optional subtitle, e.g. course name when kind is "chapter".
  subheading?: string;
  /// Cover URL for the "book" kind. Ignored for chapter.
  coverUrl?: string;
  /// XP earned across the lessons in this section. Renders as
  /// a "+N XP" pill when provided.
  xpEarned?: number;
  /// Current streak — included in the summary as warm flavour
  /// ("17 day streak") if non-zero.
  streakDays?: number;
  /// Achievements that unlocked in the same beat. The card stages
  /// each as a small inline badge so the user sees the section win
  /// AND the achievement(s) it triggered in one place.
  unlocks?: readonly Achievement[];
  onDismiss: () => void;
}

export default function SectionCompleteSummary({
  kind,
  heading,
  subheading,
  coverUrl,
  xpEarned,
  streakDays,
  unlocks,
  onDismiss,
}: Props) {
  // Sound + confetti on first paint. Use a tiny timeout so the
  // browser actually paints the card before the audio fires —
  // otherwise the cue feels detached on slower machines.
  useEffect(() => {
    const t = setTimeout(() => {
      if (kind === "book") {
        playSound("complete-book");
        void celebrate("large", { x: 0.5, y: 0.35 });
        // Second burst at the 1.6 s mark so the wash sustains for
        // the full sound cue.
        setTimeout(() => {
          void celebrate("medium", { x: 0.5, y: 0.35 });
        }, 1600);
      } else {
        playSound("complete-section");
        void celebrate("small", { x: 0.5, y: 0.35 });
      }
    }, 60);
    return () => clearTimeout(t);
  }, [kind]);

  const body = (
    <div className={`fb-ach-summary fb-ach-summary--${kind}`}>
      {kind === "book" && coverUrl ? (
        <div className="fb-ach-summary__cover">
          <img src={coverUrl} alt="" draggable={false} />
        </div>
      ) : (
        <div className="fb-ach-summary__sigil" aria-hidden>
          <Icon
            icon={kind === "book" ? bookCheck : flame}
            size="2xl"
            color="currentColor"
          />
        </div>
      )}
      <div className="fb-ach-summary__head">
        <span className="fb-ach-summary__eyebrow">
          {kind === "book" ? "Book complete" : "Section complete"}
        </span>
        <h2 className="fb-ach-summary__title">{heading}</h2>
        {subheading ? (
          <span className="fb-ach-summary__sub">{subheading}</span>
        ) : null}
      </div>
      <div className="fb-ach-summary__stats">
        {xpEarned !== undefined && xpEarned > 0 ? (
          <span className="fb-ach-summary__stat">
            <Icon icon={coins} size="sm" color="currentColor" />
            <strong>+{xpEarned}</strong> XP
          </span>
        ) : null}
        {streakDays !== undefined && streakDays > 0 ? (
          <span className="fb-ach-summary__stat">
            <Icon icon={flame} size="sm" color="currentColor" />
            <strong>{streakDays}</strong> day streak
          </span>
        ) : null}
      </div>
      {unlocks && unlocks.length > 0 ? (
        <div className="fb-ach-summary__unlocks">
          <span className="fb-ach-summary__unlocks-eyebrow">
            Unlocked alongside
          </span>
          <ul className="fb-ach-summary__unlocks-list">
            {unlocks.map((a) => (
              <li key={a.id} className="fb-ach-summary__unlock">
                <AchievementBadge achievement={a} size="sm" />
                <span className="fb-ach-summary__unlock-text">
                  <strong>{a.title}</strong>
                  <em>{a.blurb}</em>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <button
        type="button"
        className="fb-ach-summary__cta"
        onClick={onDismiss}
      >
        Keep going
      </button>
      <button
        type="button"
        className="fb-ach-summary__close"
        aria-label="Dismiss"
        onClick={onDismiss}
      >
        <Icon icon={xIcon} size="xs" color="currentColor" />
      </button>
    </div>
  );

  // Book-complete is a full-screen takeover (modal). Chapter-complete
  // sits in the lesson view as an inline card the parent positions.
  if (kind === "book") {
    return (
      <ModalBackdrop onDismiss={onDismiss} zIndex={140}>
        {body}
      </ModalBackdrop>
    );
  }
  return body;
}
