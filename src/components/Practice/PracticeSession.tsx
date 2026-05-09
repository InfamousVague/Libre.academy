/// One-card-at-a-time runner for a Practice session.
///
/// Owns the queue cursor, per-card committed state, and the
/// end-of-session summary. The `<PracticeView>` shell builds the
/// queue and hands it in; the session is otherwise self-contained.
///
/// Card lifecycle:
///   1. Mount — show the prompt + answer affordance.
///   2. Learner answers → call `gradeAttempt`, transition to
///      "committed" state, show explanation + Next button.
///   3. Click Next → advance the cursor.
///   4. Cursor past the end → show summary (got X/Y right, time
///      taken, deck breakdown, "Practice again" / "Back to deck").
///
/// We deliberately DON'T auto-advance after a correct answer —
/// the explanation and the "you got it!" feedback are part of the
/// learning, not a delay to skip. Correct cards reveal Next on
/// the same affordance the wrong cards do.

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { check as checkIcon } from "@base/primitives/icon/icons/check";
import { x as xIcon } from "@base/primitives/icon/icons/x";
import { arrowLeft } from "@base/primitives/icon/icons/arrow-left";
import { arrowRight } from "@base/primitives/icon/icons/arrow-right";
import { dumbbell } from "@base/primitives/icon/icons/dumbbell";
import "@base/primitives/icon/icon.css";
import {
  type QuizQuestion,
  normalizeAnswer,
} from "../../data/types";
import type { PracticeItem } from "./types";
import type { PracticeMode } from "./practiceQueue";
import { MODE_LABELS } from "./practiceQueue";
import { gradeAttempt } from "./practiceStore";
import { formatDueIn } from "./practiceSchedule";
import PracticeBlocks from "./PracticeBlocks";
import "./PracticeSession.css";

interface Props {
  /// Pre-built queue of items to play. Length determines the
  /// session card count.
  queue: PracticeItem[];
  /// Mode label shown in the session header. Doesn't affect
  /// behaviour — purely cosmetic context for the learner.
  mode: PracticeMode;
  /// Click "Open lesson" on a card → forwarded here so the App
  /// can switch to the lesson reader. Optional: when omitted,
  /// the link doesn't render.
  onOpenLesson?: (courseId: string, lessonId: string) => void;
  /// Click Back / Done → return to the deck view.
  onExit: () => void;
}

type CardOutcome =
  | { status: "open" }
  | { status: "correct"; nextDueMs: number }
  | { status: "wrong"; nextDueMs: number };

export default function PracticeSession({
  queue,
  mode,
  onOpenLesson,
  onExit,
}: Props) {
  const startedAt = useRef<number>(Date.now());
  const [cursor, setCursor] = useState(0);
  // One outcome per queue index. Built lazily as the learner plays.
  const [outcomes, setOutcomes] = useState<CardOutcome[]>(() =>
    queue.map(() => ({ status: "open" as const })),
  );

  const current = queue[cursor];
  const cardOutcome = outcomes[cursor];
  const isDone = cursor >= queue.length;

  function commitOutcome(correct: boolean) {
    if (!current) return;
    if (cardOutcome?.status !== "open") return;
    const rec = gradeAttempt(current, correct);
    const nextDueMs = Math.max(0, rec.dueAt - Date.now());
    setOutcomes((prev) => {
      const next = prev.slice();
      next[cursor] = correct
        ? { status: "correct", nextDueMs }
        : { status: "wrong", nextDueMs };
      return next;
    });
  }

  function advance() {
    setCursor((c) => c + 1);
  }

  // Keyboard: Enter advances on a committed card; Esc exits.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onExit();
        return;
      }
      if (e.key === "Enter") {
        if (cardOutcome && cardOutcome.status !== "open") {
          e.preventDefault();
          advance();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cardOutcome, onExit]);

  // ----- Render -----

  if (queue.length === 0) {
    return (
      <div className="fb-practice-session fb-practice-session--empty">
        <div className="fb-practice-session__scroll">
          <div className="fb-practice-session__inner">
            <div className="fb-practice-session__empty-icon" aria-hidden>
              <Icon icon={dumbbell} size="lg" color="currentColor" />
            </div>
            <h2>No items to practice in this slice.</h2>
            <p>
              Try a different mode, widen the course filter, or come back when
              more items are due.
            </p>
            <button className="fb-practice-session__exit" onClick={onExit}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="fb-practice-session">
        <div className="fb-practice-session__scroll">
          <SessionSummary
            queue={queue}
            outcomes={outcomes}
            elapsedMs={Date.now() - startedAt.current}
            onExit={onExit}
            onOpenLesson={onOpenLesson}
          />
        </div>
      </div>
    );
  }

  const correctCount = outcomes.filter((o) => o.status === "correct").length;
  const wrongCount = outcomes.filter((o) => o.status === "wrong").length;

  return (
    <div className="fb-practice-session">
      <div className="fb-practice-session__scroll">
        <div className="fb-practice-session__inner">
          <header className="fb-practice-session__header">
            <button
              type="button"
              className="fb-practice-session__back"
              onClick={onExit}
              aria-label="Back to practice deck"
            >
              <Icon icon={arrowLeft} size="xs" color="currentColor" />
              <span>Back</span>
            </button>
            <div className="fb-practice-session__progress">
              <div className="fb-practice-session__pip-row">
                {queue.map((_, i) => (
                  <span
                    key={i}
                    className={
                      "fb-practice-session__pip" +
                      (i === cursor ? " is-current" : "") +
                      (outcomes[i].status === "correct"
                        ? " is-correct"
                        : outcomes[i].status === "wrong"
                          ? " is-wrong"
                          : "")
                    }
                    aria-hidden
                  />
                ))}
              </div>
              <div className="fb-practice-session__progress-label">
                {cursor + 1} / {queue.length} · {MODE_LABELS[mode]}
              </div>
            </div>
            <div className="fb-practice-session__score">
              <span className="fb-practice-session__score-correct">
                <Icon icon={checkIcon} size="xs" color="currentColor" />{" "}
                {correctCount}
              </span>
              <span className="fb-practice-session__score-wrong">
                <Icon icon={xIcon} size="xs" color="currentColor" />{" "}
                {wrongCount}
              </span>
            </div>
          </header>

          <main className="fb-practice-session__card">
            <div className="fb-practice-session__card-meta">
              <span className="fb-practice-session__course">
                {current.courseTitle}
              </span>
              <span className="fb-practice-session__sep">·</span>
              <span className="fb-practice-session__lesson">
                {current.lessonTitle}
              </span>
              {current.language && (
                <span className="fb-practice-session__lang">
                  {current.language}
                </span>
              )}
            </div>

            {current.kind === "blocks" && current.blocks ? (
              <PracticeBlocks
                key={current.id}
                blocks={current.blocks}
                language={current.language}
                itemId={current.id}
                committed={cardOutcome?.status !== "open"}
                result={
                  cardOutcome?.status === "correct"
                    ? "correct"
                    : cardOutcome?.status === "wrong"
                      ? "wrong"
                      : undefined
                }
                onResult={commitOutcome}
              />
            ) : current.question ? (
              <QuizCard
                key={current.id}
                question={current.question}
                committed={cardOutcome?.status !== "open"}
                onResult={commitOutcome}
              />
            ) : (
              <div className="fb-practice-session__card-error">
                This item couldn't be loaded.
              </div>
            )}

            {cardOutcome && cardOutcome.status !== "open" && (
              <CardFeedback
                outcome={cardOutcome}
                item={current}
                onAdvance={advance}
                onOpenLesson={onOpenLesson}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuizCard — renders MCQ or short-answer.

function QuizCard({
  question,
  committed,
  onResult,
}: {
  question: QuizQuestion;
  committed: boolean;
  onResult: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [shortValue, setShortValue] = useState("");

  function submitMcq(i: number) {
    if (committed) return;
    if (question.kind !== "mcq") return;
    setPicked(i);
    onResult(i === question.correctIndex);
  }

  function submitShort() {
    if (committed) return;
    if (question.kind !== "short") return;
    if (!shortValue.trim()) return;
    const normalized = normalizeAnswer(shortValue);
    const ok = question.accept.some((a) => normalizeAnswer(a) === normalized);
    onResult(ok);
  }

  return (
    <div className="fb-practice-quiz">
      <div className="fb-practice-quiz__prompt">{question.prompt}</div>
      {question.kind === "mcq" ? (
        <div className="fb-practice-quiz__options">
          {question.options.map((opt, i) => {
            const isPicked = i === picked;
            const isCorrect = i === question.correctIndex;
            const klass = [
              "fb-practice-quiz__option",
              committed && isCorrect ? "is-correct" : "",
              committed && isPicked && !isCorrect ? "is-wrong" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={i}
                type="button"
                className={klass}
                onClick={() => submitMcq(i)}
                disabled={committed}
              >
                <span className="fb-practice-quiz__option-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="fb-practice-quiz__short">
          <input
            type="text"
            className="fb-practice-quiz__short-input"
            value={shortValue}
            onChange={(e) => setShortValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitShort();
            }}
            placeholder="type your answer"
            disabled={committed}
            autoFocus
          />
          <button
            type="button"
            className="fb-practice-quiz__short-submit"
            onClick={submitShort}
            disabled={committed || !shortValue.trim()}
          >
            Check
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CardFeedback — shown beneath the card after grading. Holds Next.

function CardFeedback({
  outcome,
  item,
  onAdvance,
  onOpenLesson,
}: {
  outcome: Exclude<CardOutcome, { status: "open" }>;
  item: PracticeItem;
  onAdvance: () => void;
  onOpenLesson?: (courseId: string, lessonId: string) => void;
}) {
  const explanation =
    item.question?.kind === "mcq" || item.question?.kind === "short"
      ? item.question.explanation
      : undefined;
  return (
    <div
      className={
        "fb-practice-feedback" +
        (outcome.status === "correct"
          ? " fb-practice-feedback--correct"
          : " fb-practice-feedback--wrong")
      }
    >
      <div className="fb-practice-feedback__verdict">
        {outcome.status === "correct" ? (
          <>
            <Icon icon={checkIcon} size="sm" color="currentColor" />
            <span>Correct — back in your queue {formatDueIn(outcome.nextDueMs)}</span>
          </>
        ) : (
          <>
            <Icon icon={xIcon} size="sm" color="currentColor" />
            <span>Not quite — you'll see this one again {formatDueIn(outcome.nextDueMs)}</span>
          </>
        )}
      </div>
      {explanation && (
        <div className="fb-practice-feedback__explain">{explanation}</div>
      )}
      <div className="fb-practice-feedback__actions">
        {onOpenLesson && (
          <button
            type="button"
            className="fb-practice-feedback__lesson-link"
            onClick={() => onOpenLesson(item.courseId, item.lessonId)}
          >
            Open original lesson →
          </button>
        )}
        <button
          type="button"
          className="fb-practice-feedback__next"
          onClick={onAdvance}
          autoFocus
        >
          Next
          <Icon icon={arrowRight} size="xs" color="currentColor" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SessionSummary — end-of-queue recap.

function SessionSummary({
  queue,
  outcomes,
  elapsedMs,
  onExit,
  onOpenLesson,
}: {
  queue: PracticeItem[];
  outcomes: CardOutcome[];
  elapsedMs: number;
  onExit: () => void;
  onOpenLesson?: (courseId: string, lessonId: string) => void;
}) {
  const correct = outcomes.filter((o) => o.status === "correct").length;
  const total = queue.length;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  const wrongItems = useMemo(
    () =>
      queue
        .map((item, i) => ({ item, outcome: outcomes[i] }))
        .filter((p) => p.outcome.status === "wrong"),
    [queue, outcomes],
  );
  const minutes = Math.max(1, Math.round(elapsedMs / 60000));

  return (
    <div className="fb-practice-summary">
      <div className="fb-practice-summary__hero">
        <div className="fb-practice-summary__big">
          {correct}/{total}
        </div>
        <div className="fb-practice-summary__caption">
          {accuracy >= 90
            ? "Strong session — that's the rhythm."
            : accuracy >= 70
              ? "Solid. The misses come back tomorrow."
              : "Some friction here. The deck remembers — those'll cycle back soon."}
        </div>
        <div className="fb-practice-summary__sub">
          {accuracy}% accuracy · {minutes} min
        </div>
      </div>

      {wrongItems.length > 0 && (
        <section className="fb-practice-summary__missed">
          <h3>Items to revisit</h3>
          <ul>
            {wrongItems.map(({ item }) => (
              <li key={item.id}>
                <div className="fb-practice-summary__missed-meta">
                  <span className="fb-practice-summary__missed-course">
                    {item.courseTitle}
                  </span>
                  <span className="fb-practice-summary__missed-sep">·</span>
                  <span>{item.lessonTitle}</span>
                </div>
                {onOpenLesson && (
                  <button
                    type="button"
                    onClick={() => onOpenLesson(item.courseId, item.lessonId)}
                  >
                    Open lesson →
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="fb-practice-summary__actions">
        <button
          type="button"
          className="fb-practice-summary__exit"
          onClick={onExit}
        >
          Back to deck
        </button>
      </div>
    </div>
  );
}
