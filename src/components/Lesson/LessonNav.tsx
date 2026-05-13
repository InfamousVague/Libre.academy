import { Icon } from "@base/primitives/icon";
import { arrowLeft } from "@base/primitives/icon/icons/arrow-left";
import { arrowRight } from "@base/primitives/icon/icons/arrow-right";
import "@base/primitives/icon/icon.css";
import { ShortcutHint } from "../ShortcutHint/ShortcutHint";
import { useT } from "../../i18n/i18n";
import "./LessonNav.css";

interface NeighborLesson {
  id: string;
  title: string;
}

interface Props {
  prev: NeighborLesson | null;
  next: NeighborLesson | null;
  onPrev: () => void;
  onNext: () => void;
  /// Customize the next-button label. For reading-only lessons that aren't yet
  /// marked complete, this becomes something like "Mark read & next →" so the
  /// single button handles both actions.
  nextLabel?: string;
  /// When true, the Next button gets the holographic CTA treatment —
  /// reserved for the "mark read & next" variant on reading-only
  /// lessons that the learner is about to complete by clicking. The
  /// holo overlay reads as "this is the moment, take the action."
  /// Defaults false.
  nextIsCta?: boolean;
}

/// CSS `text-overflow: ellipsis` only trims at the end, which on a lesson
/// title like "Constructors and the new Keyword" hides the most useful bit —
/// the concept name. Split on the last word (or fall back to character count)
/// so the head can flex-shrink while the tail always stays visible, giving us
/// middle-ellipsis: "Constructors a… Keyword".
function splitForMiddleEllipsis(text: string): { head: string; tail: string } {
  const minTail = 4;
  const maxTail = 16;
  for (let i = text.length - minTail; i >= Math.max(1, text.length - maxTail); i--) {
    const ch = text[i];
    if (ch === " " || ch === "-" || ch === "/" || ch === ":") {
      return { head: text.slice(0, i), tail: text.slice(i) };
    }
  }
  const n = Math.min(8, Math.floor(text.length / 3));
  if (n <= 0) return { head: text, tail: "" };
  return { head: text.slice(0, -n), tail: text.slice(-n) };
}

function MiddleTitle({ text }: { text: string }) {
  const { head, tail } = splitForMiddleEllipsis(text);
  return (
    <span className="libre-lesson-nav-title" title={text}>
      <span className="libre-lesson-nav-title-head">{head}</span>
      {tail && <span className="libre-lesson-nav-title-tail">{tail}</span>}
    </span>
  );
}

/// Prev/Next bar that sits at the end of every lesson. Mirrors Codecademy's
/// linear progression feel — users can advance through a course without
/// opening the sidebar for every step, and reading-only lessons get marked
/// complete as part of pressing Next (see `nextLabel`).
export default function LessonNav({
  prev,
  next,
  onPrev,
  onNext,
  nextLabel,
  nextIsCta = false,
}: Props) {
  const t = useT();
  return (
    <nav className="libre-lesson-nav" aria-label={t("lessonNav.ariaLabel")}>
      <button
        type="button"
        className="libre-lesson-nav-btn libre-lesson-nav-btn--prev"
        onClick={onPrev}
        disabled={!prev}
        title={prev?.title}
      >
        <span className="libre-lesson-nav-arrow" aria-hidden>
          <Icon icon={arrowLeft} size="sm" color="currentColor" />
        </span>
        <span className="libre-lesson-nav-text">
          <span className="libre-lesson-nav-label">
            {t("lessonNav.previous")}
            {prev && <ShortcutHint actionId="lesson.prev" variant="muted" className="libre-shortcut-hint--gap" />}
          </span>
          {prev && <MiddleTitle text={prev.title} />}
        </span>
      </button>

      <button
        type="button"
        className={
          "libre-lesson-nav-btn libre-lesson-nav-btn--next " +
          (nextIsCta ? "libre-lesson-nav-btn--cta" : "")
        }
        onClick={onNext}
        disabled={!next}
        title={next?.title}
      >
        {/* Holographic foil retired — the rainbow snake-sparkle
            treatment is now scoped to certificates + the AI
            button so the Next CTA reads as a quiet flat surface. */}
        <span className="libre-lesson-nav-text libre-lesson-nav-text--right">
          <span className="libre-lesson-nav-label">
            {nextLabel ?? t("lessonNav.next")}
            {next && <ShortcutHint actionId="lesson.next" variant="muted" className="libre-shortcut-hint--gap" />}
          </span>
          {next && <MiddleTitle text={next.title} />}
        </span>
        <span className="libre-lesson-nav-arrow" aria-hidden>
          <Icon icon={arrowRight} size="sm" color="currentColor" />
        </span>
      </button>
    </nav>
  );
}
