/// Practice route — landing surface for the spaced-review feature.
///
/// Two states owned by this component:
///
///   1. **Deck view** (default): hero with due-counter ring, single
///      big primary CTA, four stat tiles, recent-misses revisit list,
///      and a collapsed customize panel for tweaking mode / course /
///      kind / length filters. Designed to feel like one tap away
///      from a session — defaults are good, the controls only
///      appear if the learner asks for them.
///
///   2. **Session view**: full-screen runner that owns the queue
///      cursor and grading. Returning from the session lands back
///      in the deck view with refreshed stats.
///
/// We deliberately keep PracticeView small. The primary tap is the
/// "Start practice" button at the top; everything else is either
/// stats (read-only context) or settings (collapsed).
///
/// Visual language mirrors `<ProfileView>`: same scroll wrapper
/// pattern, same `--color-*` tokens, same color-toned stat tiles
/// and section-title vocabulary.

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { dumbbell } from "@base/primitives/icon/icons/dumbbell";
import { layers } from "@base/primitives/icon/icons/layers";
import { clock } from "@base/primitives/icon/icons/clock";
import { sparkles } from "@base/primitives/icon/icons/sparkles";
import { check as checkIcon } from "@base/primitives/icon/icons/check";
import { sliders } from "@base/primitives/icon/icons/sliders";
import { chevronDown } from "@base/primitives/icon/icons/chevron-down";
import { chevronUp } from "@base/primitives/icon/icons/chevron-up";
import { history as historyIcon } from "@base/primitives/icon/icons/history";
import { brain } from "@base/primitives/icon/icons/brain";
import "@base/primitives/icon/icon.css";
import type { Course } from "../../data/types";
import type { Completion } from "../../hooks/useProgress";
import {
  groupItemsByCourse,
  harvestPracticeItems,
} from "./practiceHarvest";
import {
  buildQueue,
  MODE_BLURBS,
  MODE_LABELS,
  type PracticeMode,
} from "./practiceQueue";
import { loadAllRecords, summariseStats } from "./practiceStore";
import type { PracticeItem, PracticeRecord, PracticeStats } from "./types";
import PracticeSession from "./PracticeSession";
import "./PracticeView.css";

interface Props {
  courses: readonly Course[];
  /// `${courseId}:${lessonId}` set — same shape used everywhere
  /// else for completion tracking. Drives the harvester's
  /// "courses the learner has touched" filter.
  completed: Set<string>;
  /// Completion history — used to surface "newly learned" hints
  /// in the empty state. Optional; works without it.
  history?: readonly Completion[];
  /// Forwarded to the session so card feedback can deep-link
  /// back to the originating lesson.
  onOpenLesson?: (courseId: string, lessonId: string) => void;
}

const SESSION_LIMITS = [5, 10, 25] as const;

const KIND_LABELS: Record<PracticeItem["kind"], string> = {
  mcq: "Multiple choice",
  short: "Short answer",
  blocks: "Code blocks",
};

export default function PracticeView({
  courses,
  completed,
  history,
  onOpenLesson,
}: Props) {
  // Harvest is cheap; rerun whenever the inputs change so author
  // edits / new completions take effect without a refresh.
  const items = useMemo(
    () => harvestPracticeItems(courses, completed),
    [courses, completed],
  );

  // Records reload on a custom event the store dispatches after
  // each grade — that lets the session's grading update the deck
  // header live without prop drilling.
  const [records, setRecords] = useState<Map<string, PracticeRecord>>(() =>
    loadAllRecords(),
  );
  useEffect(() => {
    function refresh() {
      setRecords(loadAllRecords());
    }
    window.addEventListener("libre:practice-graded", refresh);
    return () => {
      window.removeEventListener("libre:practice-graded", refresh);
    };
  }, []);

  const stats: PracticeStats = useMemo(
    () => summariseStats(items, records),
    [items, records],
  );

  const courseGroups = useMemo(() => groupItemsByCourse(items), [items]);

  // ----- Filter state (everything below the hero is "advanced"
  // and sits behind the Customize toggle by default). -----
  const [mode, setMode] = useState<PracticeMode>("smart");
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedKinds, setSelectedKinds] = useState<
    Set<PracticeItem["kind"]>
  >(() => new Set());
  const [sessionLength, setSessionLength] = useState<number>(10);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  // Deck preview — count of cards that would actually be played.
  const previewSeed = hashSig(
    mode +
      ":" +
      Array.from(selectedCourses).sort().join(",") +
      ":" +
      Array.from(selectedKinds).sort().join(","),
  );
  const previewQueue = useMemo(
    () =>
      buildQueue(mode, items, records, {
        limit: sessionLength,
        courseIds: selectedCourses,
        kinds: selectedKinds,
        seed: previewSeed,
        now: Date.now(),
      }),
    [mode, items, records, sessionLength, selectedCourses, selectedKinds, previewSeed],
  );

  // Recent misses to revisit. Walk every record, find ones the
  // learner failed (most recent first), join against items so we
  // can show course + lesson titles, cap to 6.
  const recentMisses = useMemo(() => {
    const itemsById = new Map(items.map((it) => [it.id, it]));
    const misses: Array<{ item: PracticeItem; rec: PracticeRecord }> = [];
    records.forEach((rec) => {
      const item = itemsById.get(rec.id);
      if (!item) return;
      // "Missed recently" = last attempt was a miss → streak === 0
      // AND attempts > correct (i.e. at least one wrong).
      if (rec.streak !== 0) return;
      if (rec.attempts <= rec.correct) return;
      misses.push({ item, rec });
    });
    misses.sort((a, b) => b.rec.lastSeen - a.rec.lastSeen);
    return misses.slice(0, 6);
  }, [items, records]);

  // ----- Session state -----
  const [activeQueue, setActiveQueue] = useState<PracticeItem[] | null>(null);

  function startSession() {
    const queue = buildQueue(mode, items, records, {
      limit: sessionLength,
      courseIds: selectedCourses,
      kinds: selectedKinds,
      seed: Date.now(),
      now: Date.now(),
    });
    setActiveQueue(queue);
  }

  if (activeQueue) {
    return (
      <PracticeSession
        queue={activeQueue}
        mode={mode}
        onOpenLesson={onOpenLesson}
        onExit={() => setActiveQueue(null)}
      />
    );
  }

  // ----- Render: empty state -----
  if (items.length === 0) {
    return <EmptyState history={history} />;
  }

  const heroSub =
    stats.dueCount > 0
      ? `${stats.dueCount} card${stats.dueCount === 1 ? "" : "s"} due · spaced review across your books`
      : `${items.length} card${items.length === 1 ? "" : "s"} in deck · spaced review across your books`;

  return (
    <div className="libre-practice">
      <div className="libre-practice-scroll">
        <div className="libre-practice-inner">
          {/* Hero — title + subtitle + due-counter ring. Same shape
              as ProfileView so a learner moving between the two
              feels they're inside the same app. */}
          <section
            className="libre-practice-hero"
            aria-label="Practice overview"
          >
            <div className="libre-practice-hero-text">
              <h1 className="libre-practice-hero-title">Practice</h1>
              <p className="libre-practice-hero-sub">{heroSub}</p>
            </div>
            <DueRing
              due={stats.dueCount}
              total={Math.max(items.length, 1)}
              correctToday={stats.correctToday}
              attemptsToday={stats.attemptsToday}
            />
          </section>

          {/* Primary CTA — one tap to start a session. The button
              IS the page. Customize lives below; default settings
              ("Smart mix · 10 cards") are good enough that most
              sessions never touch the panel. */}
          <section className="libre-practice-cta">
            <div className="libre-practice-cta-meta">
              <span className="libre-practice-cta-label">Up next</span>
              <span className="libre-practice-cta-title">
                {previewQueue.length > 0 ? (
                  <>
                    {previewQueue.length} card
                    {previewQueue.length === 1 ? "" : "s"} ·{" "}
                    {MODE_LABELS[mode]}
                  </>
                ) : (
                  "Nothing queued in this slice"
                )}
              </span>
              <span className="libre-practice-cta-hint">
                {MODE_BLURBS[mode]}
              </span>
            </div>
            <button
              type="button"
              className="libre-practice-cta-button"
              onClick={startSession}
              disabled={previewQueue.length === 0}
            >
              Start
              <Icon icon={dumbbell} size="sm" color="currentColor" />
            </button>
          </section>

          {/* Color-toned stat tiles — same vocabulary as Profile. */}
          <div className="libre-practice-stats" role="list">
            <StatTile
              icon={layers}
              tone="cards"
              value={items.length}
              label="In deck"
            />
            <StatTile
              icon={clock}
              tone="due"
              value={stats.dueCount}
              label="Due now"
            />
            <StatTile
              icon={brain}
              tone="weak"
              value={stats.weakCount}
              label="Weak spots"
            />
            <StatTile
              icon={checkIcon}
              tone="done"
              value={`${stats.correctToday}/${stats.attemptsToday}`}
              label="Today"
            />
          </div>

          {/* Recent misses — soft prompt to revisit lessons where
              the learner just got something wrong. Quietly absent
              when the learner is on a hot streak (no recent
              misses). */}
          {recentMisses.length > 0 && (
            <section className="libre-practice-section">
              <div className="libre-practice-section-head">
                <h2 className="libre-practice-section-title">
                  To revisit
                </h2>
                <span className="libre-practice-section-sub">
                  Recently missed
                </span>
              </div>
              <ul className="libre-practice-misses">
                {recentMisses.map(({ item, rec }) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="libre-practice-miss-row"
                      onClick={() => onOpenLesson?.(item.courseId, item.lessonId)}
                      disabled={!onOpenLesson}
                    >
                      <span
                        className={`libre-practice-miss-kind libre-practice-miss-kind--${item.kind}`}
                        aria-hidden
                      />
                      <span className="libre-practice-miss-body">
                        <span className="libre-practice-miss-lesson">
                          {item.lessonTitle}
                        </span>
                        <span className="libre-practice-miss-course">
                          {item.courseTitle}
                        </span>
                      </span>
                      <span className="libre-practice-miss-meta">
                        {rec.correct}/{rec.attempts}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Customize — collapsed by default. The page is meant
              to feel "one tap away from practice" out of the box;
              the panel is for the learner who wants to drill a
              specific course or weak-spots only. */}
          <section className="libre-practice-section">
            <button
              type="button"
              className="libre-practice-customize-toggle"
              onClick={() => setCustomizeOpen((v) => !v)}
              aria-expanded={customizeOpen}
            >
              <Icon icon={sliders} size="sm" color="currentColor" />
              <span>Customize</span>
              <span className="libre-practice-customize-summary">
                {summariseFilters(
                  mode,
                  selectedCourses,
                  selectedKinds,
                  sessionLength,
                  courseGroups.length,
                )}
              </span>
              <Icon
                icon={customizeOpen ? chevronUp : chevronDown}
                size="xs"
                color="currentColor"
              />
            </button>

            {customizeOpen && (
              <div className="libre-practice-customize">
                <CustomizeRow label="Mode">
                  {(Object.keys(MODE_LABELS) as PracticeMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={
                        "libre-practice-pill" +
                        (mode === m ? " is-active" : "")
                      }
                      onClick={() => setMode(m)}
                    >
                      {MODE_LABELS[m]}
                    </button>
                  ))}
                </CustomizeRow>

                <CustomizeRow label="Length">
                  {SESSION_LIMITS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={
                        "libre-practice-pill" +
                        (sessionLength === n ? " is-active" : "")
                      }
                      onClick={() => setSessionLength(n)}
                    >
                      {n}
                    </button>
                  ))}
                </CustomizeRow>

                {courseGroups.length > 1 && (
                  <CustomizeRow
                    label="Courses"
                    onClear={
                      selectedCourses.size > 0
                        ? () => setSelectedCourses(new Set())
                        : undefined
                    }
                  >
                    {courseGroups.map((g) => {
                      const active = selectedCourses.has(g.courseId);
                      return (
                        <button
                          key={g.courseId}
                          type="button"
                          className={
                            "libre-practice-pill" +
                            (active ? " is-active" : "")
                          }
                          onClick={() => {
                            setSelectedCourses((prev) => {
                              const next = new Set(prev);
                              if (next.has(g.courseId))
                                next.delete(g.courseId);
                              else next.add(g.courseId);
                              return next;
                            });
                          }}
                        >
                          {g.courseTitle}
                          <span className="libre-practice-pill-count">
                            {g.count}
                          </span>
                        </button>
                      );
                    })}
                  </CustomizeRow>
                )}

                <CustomizeRow
                  label="Kinds"
                  onClear={
                    selectedKinds.size > 0
                      ? () => setSelectedKinds(new Set())
                      : undefined
                  }
                >
                  {(
                    Object.keys(KIND_LABELS) as PracticeItem["kind"][]
                  ).map((k) => {
                    const count = items.filter((it) => it.kind === k).length;
                    if (count === 0) return null;
                    const active = selectedKinds.has(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        className={
                          "libre-practice-pill" +
                          (active ? " is-active" : "")
                        }
                        onClick={() => {
                          setSelectedKinds((prev) => {
                            const next = new Set(prev);
                            if (next.has(k)) next.delete(k);
                            else next.add(k);
                            return next;
                          });
                        }}
                      >
                        {KIND_LABELS[k]}
                        <span className="libre-practice-pill-count">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </CustomizeRow>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CustomizeRow — labelled chip cluster used inside the customize panel.

function CustomizeRow({
  label,
  onClear,
  children,
}: {
  label: string;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="libre-practice-customize-row">
      <span className="libre-practice-customize-row-label">
        {label}
        {onClear && (
          <button
            type="button"
            className="libre-practice-customize-clear"
            onClick={onClear}
          >
            clear
          </button>
        )}
      </span>
      <div className="libre-practice-customize-pills">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DueRing — circular gauge for "due / total" + today's accuracy.
// Visual sibling of ProfileView's RingGauge but tuned for the Practice
// page's narrative ("how much do you owe the deck right now").

function DueRing({
  due,
  total,
  correctToday,
  attemptsToday,
}: {
  due: number;
  total: number;
  correctToday: number;
  attemptsToday: number;
}) {
  const pct = total > 0 ? Math.min(due / total, 1) : 0;
  const r = 42;
  const c = Math.round(2 * Math.PI * r * 100) / 100;
  const offset = c * (1 - pct);
  const accuracy =
    attemptsToday > 0 ? Math.round((correctToday / attemptsToday) * 100) : 0;
  return (
    <div className="libre-practice-ring libre-practice-ring--due">
      <svg
        viewBox="0 0 100 100"
        className="libre-practice-ring-svg"
        aria-hidden
      >
        <circle
          className="libre-practice-ring-track"
          cx="50"
          cy="50"
          r={r}
          fill="none"
        />
        <circle
          className="libre-practice-ring-fill"
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="libre-practice-ring-body">
        <span className="libre-practice-ring-icon" aria-hidden>
          <Icon icon={dumbbell} size="lg" color="currentColor" />
        </span>
        <span className="libre-practice-ring-value">{due}</span>
        <span className="libre-practice-ring-label">
          {attemptsToday > 0 ? `${accuracy}% today` : "Due"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatTile — lifted from ProfileView's design vocabulary.

function StatTile({
  icon,
  tone,
  value,
  label,
}: {
  icon: string;
  tone: "cards" | "due" | "weak" | "done";
  value: number | string;
  label: string;
}) {
  return (
    <div
      className={`libre-practice-stat libre-practice-stat--${tone}`}
      role="listitem"
    >
      <span className="libre-practice-stat-icon" aria-hidden>
        <Icon icon={icon} size="base" color="currentColor" />
      </span>
      <div className="libre-practice-stat-text">
        <span className="libre-practice-stat-value">{value}</span>
        <span className="libre-practice-stat-label">{label}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState — first-run / nothing-touched-yet message.

function EmptyState({ history }: { history?: readonly Completion[] }) {
  const recent = history?.length ?? 0;
  return (
    <div className="libre-practice">
      <div className="libre-practice-scroll">
        <div className="libre-practice-inner libre-practice-inner--empty">
          <div className="libre-practice-empty-icon" aria-hidden>
            <Icon icon={dumbbell} size="xl" color="currentColor" />
          </div>
          <h1 className="libre-practice-hero-title">
            {recent === 0 ? "Open a lesson to start the deck." : "Nothing to practise yet."}
          </h1>
          <p className="libre-practice-empty-blurb">
            Every quiz question and code-blocks puzzle you encounter in a
            lesson becomes a card here. Finish one — even just one — and the
            deck starts filling. The scheduler handles the rest: short
            sessions, spaced apart, biased toward whatever you got wrong
            recently.
          </p>
          {recent === 0 ? (
            <div className="libre-practice-empty-hint">
              <Icon icon={sparkles} size="xs" color="currentColor" />
              <span>
                Pick a book from <strong>Library</strong> or browse{" "}
                <strong>Discover</strong> to seed your deck.
              </span>
            </div>
          ) : (
            <div className="libre-practice-empty-hint">
              <Icon icon={historyIcon} size="xs" color="currentColor" />
              <span>
                You have completions logged but no quiz / blocks puzzles in
                them yet. Try a course with checkpoint quizzes or
                code-blocks challenges.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers.

function summariseFilters(
  mode: PracticeMode,
  selectedCourses: Set<string>,
  selectedKinds: Set<PracticeItem["kind"]>,
  sessionLength: number,
  courseCount: number,
): string {
  const parts: string[] = [MODE_LABELS[mode], `${sessionLength} cards`];
  if (selectedCourses.size > 0 && selectedCourses.size < courseCount) {
    parts.push(
      `${selectedCourses.size} course${selectedCourses.size === 1 ? "" : "s"}`,
    );
  }
  if (selectedKinds.size > 0) {
    parts.push(
      Array.from(selectedKinds)
        .map((k) => KIND_LABELS[k].toLowerCase())
        .join(", "),
    );
  }
  return parts.join(" · ");
}

function hashSig(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
