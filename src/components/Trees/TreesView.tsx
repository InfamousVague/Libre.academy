/// Trees feature: the top-level view that lets the learner pick
/// which skill tree to walk, then renders the chosen tree's DAG.
///
/// Navigation: `<TreesView>` is mounted as a top-level destination
/// from the sidebar. It owns its own internal "currently-viewing"
/// state — clicking a tree card from the shelf opens that tree;
/// clicking the back chevron returns to the shelf. We could push
/// this into App-level routing later (?tree=foundations) but it's
/// not worth the URL plumbing yet.

import { useMemo, useState } from "react";
import type { Course } from "../../data/types";
import {
  TREES,
  layoutTree,
  isSkillComplete,
  isSkillUnlocked,
  suggestNextSkill,
  treeProgressPercent,
  resolveSkillMatch,
  type SkillTree,
  type SkillNode,
} from "../../data/trees";
import "./TreesView.css";

interface Props {
  courses: readonly Course[];
  /// Same `${courseId}:${lessonId}` set the rest of the app uses.
  completed: Set<string>;
  /// Open a specific lesson — same shape as Sidebar's onSelectLesson.
  /// Wired by App so clicking a skill node's matched lesson takes
  /// the learner directly into that lesson's reader.
  onOpenLesson: (courseId: string, lessonId: string) => void;
}

export default function TreesView({ courses, completed, onOpenLesson }: Props) {
  const [activeTreeId, setActiveTreeId] = useState<string | null>(null);
  const activeTree = useMemo(
    () => TREES.find((t) => t.id === activeTreeId) ?? null,
    [activeTreeId],
  );

  if (activeTree) {
    return (
      <TreeDetail
        tree={activeTree}
        courses={courses}
        completed={completed}
        onBack={() => setActiveTreeId(null)}
        onOpenLesson={onOpenLesson}
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
          Map out the path from where you are to where you want to be. Each
          tree is a DAG of skills — finish the prerequisites and the next node
          unlocks.
        </p>
      </header>

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

interface TreeCardProps {
  tree: SkillTree;
  completed: Set<string>;
  onOpen: () => void;
}

function TreeCard({ tree, completed, onOpen }: TreeCardProps) {
  const pct = treeProgressPercent(tree, completed);
  const totalNodes = tree.nodes.length;
  const gaps = tree.nodes.filter((n) => n.matches.length === 0).length;
  return (
    <button
      type="button"
      className="fishbones-trees__card"
      style={{ "--tree-accent": tree.accent } as React.CSSProperties}
      onClick={onOpen}
    >
      <div className="fishbones-trees__card-head">
        <span className="fishbones-trees__card-tag">{tree.short}</span>
        <span className="fishbones-trees__card-pct">{pct}%</span>
      </div>
      <div className="fishbones-trees__card-title">{tree.title}</div>
      <div className="fishbones-trees__card-blurb">{tree.description}</div>
      <div className="fishbones-trees__card-meta">
        <span>
          {totalNodes} skills
          {gaps > 0 && ` · ${gaps} gap${gaps === 1 ? "" : "s"}`}
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

// ── Tree detail (vertical DAG) ───────────────────────────────────

interface TreeDetailProps {
  tree: SkillTree;
  courses: readonly Course[];
  completed: Set<string>;
  onBack: () => void;
  onOpenLesson: (courseId: string, lessonId: string) => void;
}

function TreeDetail({
  tree,
  courses,
  completed,
  onBack,
  onOpenLesson,
}: TreeDetailProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const layout = useMemo(() => layoutTree(tree), [tree]);
  const byId = useMemo(() => {
    const m = new Map<string, SkillNode>();
    for (const n of tree.nodes) m.set(n.id, n);
    return m;
  }, [tree]);
  const nextUp = useMemo(
    () => suggestNextSkill(tree, completed),
    [tree, completed],
  );
  const pct = treeProgressPercent(tree, completed);

  // Group nodes by depth → render one row per depth band.
  const rows = useMemo(() => {
    const map = new Map<number, typeof layout>();
    for (const n of layout) {
      const arr = map.get(n.depth) ?? [];
      arr.push(n);
      map.set(n.depth, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([depth, nodes]) => ({ depth, nodes }));
  }, [layout]);

  const selected = selectedId ? byId.get(selectedId) ?? null : null;

  return (
    <div
      className="fishbones-trees fishbones-trees--detail"
      style={{ "--tree-accent": tree.accent } as React.CSSProperties}
    >
      <header className="fishbones-trees__detail-head">
        <button
          type="button"
          className="fishbones-trees__back"
          onClick={onBack}
        >
          ← All trees
        </button>
        <div className="fishbones-trees__detail-meta">
          <h1 className="fishbones-trees__detail-title">{tree.title}</h1>
          <p className="fishbones-trees__detail-blurb">{tree.description}</p>
        </div>
        <div className="fishbones-trees__detail-progress">
          <div className="fishbones-trees__detail-pct">{pct}%</div>
          <div className="fishbones-trees__detail-pct-label">
            {tree.nodes.filter((n) => isSkillComplete(n, completed)).length}/
            {tree.nodes.length} skills
          </div>
        </div>
      </header>

      <div className="fishbones-trees__dag">
        {rows.map((row) => (
          <div key={row.depth} className="fishbones-trees__dag-row">
            {row.nodes.map((n) => {
              const complete = isSkillComplete(n, completed);
              const unlocked = isSkillUnlocked(n, byId, completed);
              const isNext = nextUp?.id === n.id;
              const isGap = n.matches.length === 0;
              return (
                <button
                  key={n.id}
                  type="button"
                  className={[
                    "fishbones-trees__node",
                    complete && "fishbones-trees__node--complete",
                    !unlocked && "fishbones-trees__node--locked",
                    isNext && "fishbones-trees__node--next",
                    isGap && "fishbones-trees__node--gap",
                    selectedId === n.id &&
                      "fishbones-trees__node--selected",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setSelectedId(n.id)}
                  title={
                    !unlocked
                      ? `Locked — finish ${n.prereqs.join(", ")} first`
                      : isGap
                        ? `Coming soon — ${n.gapNote ?? "content needed"}`
                        : n.summary
                  }
                >
                  <span className="fishbones-trees__node-label">{n.label}</span>
                  {complete && (
                    <span className="fishbones-trees__node-check" aria-hidden>
                      ✓
                    </span>
                  )}
                  {!unlocked && (
                    <span className="fishbones-trees__node-lock" aria-hidden>
                      🔒
                    </span>
                  )}
                  {isGap && unlocked && (
                    <span
                      className="fishbones-trees__node-gap-mark"
                      aria-hidden
                    >
                      …
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {selected && (
        <SkillPanel
          node={selected}
          tree={tree}
          courses={courses}
          completed={completed}
          unlocked={isSkillUnlocked(selected, byId, completed)}
          isNext={nextUp?.id === selected.id}
          onClose={() => setSelectedId(null)}
          onOpenLesson={onOpenLesson}
        />
      )}
    </div>
  );
}

// ── Skill detail panel (right-rail) ──────────────────────────────

interface SkillPanelProps {
  node: SkillNode;
  tree: SkillTree;
  courses: readonly Course[];
  completed: Set<string>;
  unlocked: boolean;
  isNext: boolean;
  onClose: () => void;
  onOpenLesson: (courseId: string, lessonId: string) => void;
}

function SkillPanel({
  node,
  courses,
  completed,
  unlocked,
  isNext,
  onClose,
  onOpenLesson,
}: SkillPanelProps) {
  const isGap = node.matches.length === 0;
  const completedHere = isSkillComplete(node, completed);
  return (
    <aside className="fishbones-trees__panel" role="complementary">
      <header className="fishbones-trees__panel-head">
        <div className="fishbones-trees__panel-pre">
          {isNext && !completedHere && (
            <span className="fishbones-trees__panel-flag">Next up</span>
          )}
          {completedHere && (
            <span className="fishbones-trees__panel-flag fishbones-trees__panel-flag--done">
              Complete
            </span>
          )}
          {!unlocked && (
            <span className="fishbones-trees__panel-flag fishbones-trees__panel-flag--locked">
              Locked
            </span>
          )}
          {isGap && (
            <span className="fishbones-trees__panel-flag fishbones-trees__panel-flag--gap">
              Coming soon
            </span>
          )}
        </div>
        <button
          type="button"
          className="fishbones-trees__panel-close"
          onClick={onClose}
          aria-label="Close skill"
        >
          ✕
        </button>
      </header>
      <h2 className="fishbones-trees__panel-title">{node.label}</h2>
      <p className="fishbones-trees__panel-summary">{node.summary}</p>

      {!unlocked && (
        <div className="fishbones-trees__panel-locked">
          Finish these first:
          <ul>
            {node.prereqs.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {isGap && unlocked && (
        <div className="fishbones-trees__panel-gap">
          <strong>No lesson yet.</strong>{" "}
          {node.gapNote ?? "Content for this skill is on the roadmap."}
        </div>
      )}

      {!isGap && (
        <div className="fishbones-trees__panel-lessons">
          <div className="fishbones-trees__panel-lessons-label">Lessons</div>
          {node.matches.map((m) => {
            const resolved = resolveSkillMatch(m, courses);
            const key = `${m.courseId}:${m.lessonId}`;
            const done = completed.has(key);
            return (
              <button
                key={key}
                type="button"
                className={`fishbones-trees__panel-lesson ${
                  done ? "fishbones-trees__panel-lesson--done" : ""
                } ${
                  !unlocked ? "fishbones-trees__panel-lesson--locked" : ""
                }`}
                disabled={!unlocked || !resolved}
                onClick={() => {
                  if (unlocked && resolved) {
                    onOpenLesson(m.courseId, m.lessonId);
                  }
                }}
              >
                <div className="fishbones-trees__panel-lesson-title">
                  {resolved?.lessonTitle ?? m.lessonId}
                </div>
                <div className="fishbones-trees__panel-lesson-course">
                  {resolved?.course.title ?? m.courseId}
                  {!resolved && " (not installed)"}
                </div>
                {done && (
                  <span className="fishbones-trees__panel-lesson-check" aria-hidden>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
