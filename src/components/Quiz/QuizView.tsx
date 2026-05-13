import { useEffect, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { check } from "@base/primitives/icon/icons/check";
import "@base/primitives/icon/icon.css";
import type { QuizLesson, QuizQuestion } from "../../data/types";
import { normalizeAnswer } from "../../data/types";
import { onCommand as onVerifierCommand } from "../../lib/verify/bus";
import { fireHaptic } from "../../lib/haptics";
import "./QuizView.css";

interface Props {
  lesson: QuizLesson;
  onComplete: () => void;
}

type QuestionState =
  | { status: "unanswered" }
  | { status: "correct" }
  | { status: "wrong" };

/// Renders a checkpoint quiz. Each question can be answered independently;
/// the lesson counts as complete only when every question is correct. Wrong
/// answers reveal the explanation and allow retry. No scoring — concept
/// retention is the point, not hitting a number.
export default function QuizView({ lesson, onComplete }: Props) {
  const [state, setState] = useState<QuestionState[]>(() =>
    lesson.questions.map(() => ({ status: "unanswered" })),
  );

  const allCorrect = state.every((s) => s.status === "correct");

  function setQuestionState(index: number, next: QuestionState) {
    // Per-question haptic: success on correct, warning on wrong.
    // Fires BEFORE the state commit so the buzz feels like cause-
    // of-flip rather than reaction-to-flip. We don't haptic on
    // unanswered (the "reset to try again" path) because the
    // user didn't take a definitive action there.
    if (next.status === "correct") {
      void fireHaptic("notification-success");
    } else if (next.status === "wrong") {
      void fireHaptic("notification-warning");
    }
    setState((prev) => {
      const copy = prev.slice();
      copy[index] = next;
      const done = copy.every((s) => s.status === "correct");
      if (done && !allCorrect) {
        // All green — bubble completion up. Fire a celebration
        // haptic alongside; the engine throttle will collapse
        // the success buzz above + this completion into a
        // single perceptible event when the last answer is the
        // one that completes the quiz.
        void fireHaptic("completion");
        // Bubble completion up in a microtask so the state
        // update commits first.
        queueMicrotask(onComplete);
      }
      return copy;
    });
  }

  /// Watch-mode verifier wiring: when the cmd+K verify-course
  /// coroutine dispatches `answerQuiz` for this lesson, mark every
  /// question correct one at a time so the user can see the chips
  /// flip green in sequence (rather than snapping all at once). The
  /// completion bubble fires automatically via the existing
  /// `setQuestionState` "all green" check.
  useEffect(() => {
    const off = onVerifierCommand((cmd) => {
      if (cmd.type !== "answerQuiz") return;
      if (cmd.lessonId !== lesson.id) return;
      lesson.questions.forEach((_, i) => {
        // 220ms stagger keeps the visual rhythm slow enough to read
        // but fast enough that a 10-question quiz still finishes
        // in a couple of seconds.
        setTimeout(() => setQuestionState(i, { status: "correct" }), i * 220);
      });
    });
    return off;
    // setQuestionState closes over `allCorrect` from the latest
    // render, which is what we want — re-binding when allCorrect
    // changes lets the listener pick up the freshest closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, lesson.questions.length, allCorrect]);

  return (
    <div className="libre-quiz">
      <div className="libre-quiz-progress">
        {lesson.questions.map((_, i) => (
          <span
            key={i}
            className={`libre-quiz-pip libre-quiz-pip--${state[i].status}`}
            aria-hidden
          />
        ))}
        <span className="libre-quiz-progress-label">
          {state.filter((s) => s.status === "correct").length} / {lesson.questions.length}
        </span>
      </div>

      {lesson.questions.map((q, i) => (
        <QuestionCard
          key={i}
          index={i}
          question={q}
          state={state[i]}
          onResult={(status) => setQuestionState(i, { status })}
        />
      ))}

      {allCorrect && (
        <div className="libre-quiz-done">nice — checkpoint cleared</div>
      )}
    </div>
  );
}

function QuestionCard({
  index,
  question,
  state,
  onResult,
}: {
  index: number;
  question: QuizQuestion;
  state: QuestionState;
  onResult: (status: "correct" | "wrong") => void;
}) {
  // "Ask Libre" badge — fires the same `libre:ask-ai` event
  // the lesson reader's code-block badges use, with `kind: "quiz"`
  // so the AiAssistant builds a hint-not-answer prompt for the
  // local LLM.
  function askAi() {
    window.dispatchEvent(
      new CustomEvent("libre:ask-ai", {
        detail: { kind: "quiz", prompt: question.prompt },
      }),
    );
  }
  return (
    <div className={`libre-quiz-card libre-quiz-card--${state.status}`}>
      <div className="libre-quiz-num">{index + 1}</div>
      <div className="libre-quiz-q-body">
        <div className="libre-quiz-prompt-row">
          <div className="libre-quiz-prompt">{question.prompt}</div>
          <button
            type="button"
            className="libre-quiz-ask"
            onClick={askAi}
            title="Discuss this question with the local assistant"
            aria-label="Ask Libre for a hint"
          >
            ?
          </button>
        </div>
        {question.kind === "mcq" ? (
          <McqAnswer question={question} state={state} onResult={onResult} />
        ) : (
          <ShortAnswer question={question} state={state} onResult={onResult} />
        )}
        {state.status !== "unanswered" && question.explanation && (
          <div className="libre-quiz-explanation">{question.explanation}</div>
        )}
      </div>
    </div>
  );
}

function McqAnswer({
  question,
  state,
  onResult,
}: {
  question: Extract<QuizQuestion, { kind: "mcq" }>;
  state: QuestionState;
  onResult: (status: "correct" | "wrong") => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const committed = state.status !== "unanswered";

  function submit(i: number) {
    if (committed) return;
    setPicked(i);
    onResult(i === question.correctIndex ? "correct" : "wrong");
  }

  return (
    <div className="libre-quiz-options">
      {question.options.map((opt, i) => {
        const isPicked = i === picked;
        const isCorrect = i === question.correctIndex;
        const classes = [
          "libre-quiz-option",
          committed && isCorrect ? "libre-quiz-option--correct" : "",
          committed && isPicked && !isCorrect ? "libre-quiz-option--wrong" : "",
        ].join(" ");
        return (
          <button
            key={i}
            className={classes}
            onClick={() => submit(i)}
            disabled={committed && state.status === "correct"}
          >
            <span className="libre-quiz-option-letter">{String.fromCharCode(65 + i)}</span>
            <span>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function ShortAnswer({
  question,
  state,
  onResult,
}: {
  question: Extract<QuizQuestion, { kind: "short" }>;
  state: QuestionState;
  onResult: (status: "correct" | "wrong") => void;
}) {
  const [value, setValue] = useState("");
  const committed = state.status === "correct";

  function submit() {
    if (committed) return;
    const normalized = normalizeAnswer(value);
    const ok = question.accept.some((a) => normalizeAnswer(a) === normalized);
    onResult(ok ? "correct" : "wrong");
  }

  return (
    <div className="libre-quiz-short">
      <input
        className="libre-quiz-short-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="type your answer"
        disabled={committed}
      />
      <button
        className="libre-quiz-short-submit"
        onClick={submit}
        disabled={committed || !value.trim()}
      >
        {committed ? (
          <Icon icon={check} size="xs" color="currentColor" />
        ) : (
          "check"
        )}
      </button>
    </div>
  );
}
