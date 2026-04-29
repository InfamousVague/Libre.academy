import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { flame } from "@base/primitives/icon/icons/flame";
import { check } from "@base/primitives/icon/icons/check";
import { sparkles } from "@base/primitives/icon/icons/sparkles";
import { trophy } from "@base/primitives/icon/icons/trophy";
import { x as xIcon } from "@base/primitives/icon/icons/x";
import { panelLeftClose } from "@base/primitives/icon/icons/panel-left-close";
import { panelLeftOpen } from "@base/primitives/icon/icons/panel-left-open";
import "@base/primitives/icon/icon.css";
import type { StreakAndXp } from "../../hooks/useStreakAndXp";
import type { Completion } from "../../hooks/useProgress";
import type { Course } from "../../data/types";
import { ProgressRing } from "../Shared/ProgressRing";
import LanguageChip from "../LanguageChip/LanguageChip";
import TipDropdown from "../TipDropdown/TipDropdown";
import TopBarSearch from "../TopBarSearch/TopBarSearch";
import { isWeb } from "../../lib/platform";
import "./TopBar.css";

/// Semantic color tokens for the stats chips. Each row's uppercase label
/// is tinted to match its icon so the eye pairs them at a glance.
const STAT_COLORS = {
  streak: "#ff9b5e",   // warm orange — fire
  lessons: "#7cd97c",  // success green
  xp: "#e8c46b",       // warm gold
  longest: "#c79bff",  // soft purple — personal-record accent
} as const;

export interface Tab {
  id: string;
  label: string;
  language: string;
}

interface Props {
  tabs: Tab[];
  activeIndex: number;
  onActivate: (index: number) => void;
  onClose: (index: number) => void;
  /// Move a tab from one position to another. Called when the user
  /// drag-drops a tab within the strip; App.tsx splices openTabs to
  /// apply the new order. Activeness is maintained — the tab that
  /// was active before the drag stays active afterwards. Optional —
  /// when omitted, tabs are not draggable.
  onReorder?: (fromIndex: number, toIndex: number) => void;
  /// Learner's current streak + XP. Combined into a single trigger chip
  /// in the top bar — click to expand a detail dropdown. The chip is
  /// always rendered (even at level 1 / 0 streak) because the dropdown
  /// is also where unauthenticated learners pick up the cloud-sync
  /// sign-in CTA — hiding it would orphan that path.
  stats?: StreakAndXp;
  /// Lesson-completion log. Optional — when supplied, the dropdown
  /// renders a 4-week mini-heatmap so the learner sees their recent
  /// activity rhythm without leaving the bar. The full 20-week grid
  /// + per-language chart + badges live on the Profile page; this is
  /// a teaser. Omit to hide the heatmap (web embeds without a
  /// progress store).
  history?: Completion[];
  /// Called when the "View Profile" button at the bottom of the stats
  /// dropdown is clicked. Routes the main pane to the Profile view.
  onOpenProfile?: () => void;
  /// Whether the sidebar is currently collapsed. Drives the toggle
  /// button's icon so it always shows the *action* the click will
  /// perform (show panel when collapsed, hide panel when expanded).
  sidebarCollapsed?: boolean;
  /// Toggles sidebar visibility. Also mapped to Cmd/Ctrl+\ at the app
  /// level, but the button gives learners an obvious, discoverable path.
  onToggleSidebar?: () => void;

  /// Cloud-sync auth state, surfaced in the dropdown's account row.
  /// `signedIn=false` shows a "Sign in" button next to "View profile";
  /// `signedIn=true` shows the user identity + a "Sign out" link.
  /// Pass `undefined` (or omit) to hide the account row entirely —
  /// useful for embeds / non-Tauri builds where cloud isn't wired.
  signedIn?: boolean;
  userDisplayName?: string | null;
  userEmail?: string | null;
  /// Opens the sign-in modal. Only invoked when `signedIn === false`.
  onSignIn?: () => void;
  /// Best-effort logout (revokes the token server-side and clears local
  /// cache). Errors are swallowed in the hook; the chip just goes back
  /// to the signed-out state.
  onSignOut?: () => void;

  /// Opens the full CommandPalette modal (the surface that Cmd/Ctrl+K
  /// also binds to). Wired to the trailing ⌘K kbd hint inside the
  /// inline search input — visitors who need actions like "Open
  /// settings" or "Import a book" still have a path to them. Omit to
  /// hide the kbd hint trigger.
  onOpenSearch?: () => void;

  /// Course list — feeds the inline search input's result pool. The
  /// input is hidden if not supplied, so embeds without courses can
  /// pass `undefined` to suppress the search affordance. */
  courses?: Course[];
  /// Open a specific lesson. Same shape App.tsx already uses for
  /// selectLesson + sidebar tap-throughs; the search dropdown calls
  /// this when the user picks a lesson result.
  onOpenLesson?: (courseId: string, lessonId: string) => void;
}

/// Custom window top bar. The window is configured with
/// `titleBarStyle: "Overlay"` so the macOS traffic lights float over this bar
/// at the top-left. The bar doubles as a drag region via
/// `data-tauri-drag-region`. Individual clickable elements cancel drag by
/// NOT setting the attribute on themselves.
export default function TopBar({
  tabs,
  activeIndex,
  onActivate,
  onClose,
  onReorder,
  stats,
  history,
  onOpenProfile,
  sidebarCollapsed = false,
  onToggleSidebar,
  signedIn,
  userDisplayName,
  userEmail,
  onSignIn,
  onSignOut,
  onOpenSearch,
  courses,
  onOpenLesson,
}: Props) {
  // Always show the chip when stats are wired — the dropdown carries
  // both the level/streak detail and the cloud-sync sign-in path, so
  // hiding it for fresh learners would orphan the latter.
  const showStats = !!stats;

  // Drag-to-reorder state. `draggingIdx` is the source tab being
  // dragged; `overIdx` is the slot it would land in if dropped now.
  // Both clear on dragend / drop. We keep them as refs-on-state so a
  // re-render shows the live indicator (a 2px accent line on the
  // hovered slot's leading edge).
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const reorderable = !!onReorder;

  function handleDragStart(idx: number, e: React.DragEvent<HTMLButtonElement>) {
    if (!reorderable) return;
    setDraggingIdx(idx);
    // Required for Firefox to actually start the drag — and the data
    // payload is also useful if a future feature wants to drag tabs
    // out of the bar entirely (e.g. to spawn a popped-out window).
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  }

  function handleDragOver(idx: number, e: React.DragEvent<HTMLButtonElement>) {
    if (!reorderable || draggingIdx === null) return;
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = "move";
    if (overIdx !== idx) setOverIdx(idx);
  }

  function handleDrop(idx: number, e: React.DragEvent<HTMLButtonElement>) {
    if (!reorderable) return;
    e.preventDefault();
    const from = draggingIdx;
    setDraggingIdx(null);
    setOverIdx(null);
    if (from === null || from === idx) return;
    onReorder?.(from, idx);
  }

  function handleDragEnd() {
    setDraggingIdx(null);
    setOverIdx(null);
  }

  return (
    <div className="fishbones__topbar" data-tauri-drag-region>
      {/* On desktop: reserved gutter so the macOS traffic lights
          (which `titleBarStyle: "Overlay"` floats over the bar at
          x≈18) don't collide with the sidebar toggle. On web:
          there are no traffic lights, so we use the same width
          for a brand element — Fishbones logo + wordmark — that
          links back to the marketing site one path-segment up. */}
      {isWeb ? (
        <a
          href="../"
          className="fishbones__topbar-brand"
          aria-label="Fishbones Academy home"
          data-tauri-drag-region={false}
        >
          {/* Match the marketing-site nav: skinny fish-skeleton
              wordmark followed by the `.academy` TLD. Same asset
              ships at fishbones.academy/fishbones_skinny_white.png
              and inside the embedded /learn/ build. */}
          <img
            src={`${import.meta.env.BASE_URL}fishbones_skinny_white.png`}
            alt="Fishbones"
            className="fishbones__topbar-brand-icon"
          />
          <span className="fishbones__topbar-brand-tld">.academy</span>
        </a>
      ) : (
        <div className="fishbones__topbar-window-controls" data-tauri-drag-region />
      )}

      {onToggleSidebar && (
        <button
          type="button"
          className="fishbones__topbar-sidebar-toggle"
          onClick={onToggleSidebar}
          title={
            sidebarCollapsed
              ? "Show sidebar (⌘\\)"
              : "Hide sidebar (⌘\\)"
          }
          aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          aria-pressed={sidebarCollapsed}
        >
          <Icon
            icon={sidebarCollapsed ? panelLeftOpen : panelLeftClose}
            size="sm"
            color="currentColor"
          />
        </button>
      )}

      <div className="fishbones__topbar-tabs" data-tauri-drag-region>
        {tabs.map((tab, i) => {
          const isActive = i === activeIndex;
          const isDragging = draggingIdx === i;
          const isDragOver = overIdx === i && draggingIdx !== null && draggingIdx !== i;
          // Compute drop-side hint: if the dragged tab is moving
          // FORWARD (source < target) the drop happens AFTER the
          // hovered tab, so we draw the indicator on its trailing
          // edge. Backward drags drop BEFORE the hovered tab.
          const dropAfter = isDragOver && draggingIdx !== null && draggingIdx < i;
          return (
            <button
              key={tab.id}
              className={[
                "fishbones__tab",
                isActive && "fishbones__tab--active",
                isDragging && "fishbones__tab--dragging",
                isDragOver && "fishbones__tab--drag-over",
                dropAfter && "fishbones__tab--drop-after",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onActivate(i)}
              draggable={reorderable}
              onDragStart={(e) => handleDragStart(i, e)}
              onDragOver={(e) => handleDragOver(i, e)}
              onDrop={(e) => handleDrop(i, e)}
              onDragEnd={handleDragEnd}
              data-tauri-drag-region={false}
            >
              <LanguageChip
                language={tab.language}
                size="xs"
                iconOnly
                className="fishbones__tab-lang"
              />
              <span className="fishbones__tab-label">{tab.label}</span>
              <span
                className="fishbones__tab-close"
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(i);
                }}
              >
                <Icon icon={xIcon} size="xs" color="currentColor" />
              </span>
            </button>
          );
        })}
      </div>

      <div className="fishbones__topbar-actions">
        {/* Tip jar — inline dropdown with the dev's crypto wallets so
            learners on the desktop can chip in without leaving the
            app. The button intentionally sits left of the
            search/stats so it's not behind a Cmd/Ctrl-K-only path. */}
        <TipDropdown />

        {/* Inline search — real <input> with a dropdown of ranked
            course/lesson hits. The trailing ⌘K hint inside the input
            still pops the full CommandPalette for power-user actions
            (Open Settings, Import a book, …). Hidden if the embed
            doesn't supply courses. */}
        {courses && onOpenLesson && (
          <TopBarSearch
            courses={courses}
            onOpenLesson={onOpenLesson}
            onOpenFullSearch={onOpenSearch}
          />
        )}
        {showStats && (
          <StatsChip
            stats={stats!}
            history={history}
            onOpenProfile={onOpenProfile}
            signedIn={signedIn}
            userDisplayName={userDisplayName}
            userEmail={userEmail}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
          />
        )}
      </div>
    </div>
  );
}

/// Combined streak + level chip with a dropdown detail panel. Chip shows
/// streak flame + a small circular progress ring whose fill is XP-into-
/// current-level. Clicking expands a panel with the full numbers AND the
/// account row (sign-in / sign-out).
function StatsChip({
  stats,
  history,
  onOpenProfile,
  signedIn,
  userDisplayName,
  userEmail,
  onSignIn,
  onSignOut,
}: {
  stats: StreakAndXp;
  history?: Completion[];
  onOpenProfile?: () => void;
  signedIn?: boolean;
  userDisplayName?: string | null;
  userEmail?: string | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Click-outside + escape dismissal.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const levelProgress =
    stats.xpForLevel > 0 ? stats.xpIntoLevel / stats.xpForLevel : 0;
  const streakActive = stats.streakDays >= 1;
  const xpToNext = Math.max(0, stats.xpForLevel - stats.xpIntoLevel);

  /// 4-week mini heatmap. Calendar-aligned: each column = one Sun–Sat
  /// week, so rows correspond to stable weekdays. Future days in the
  /// current week render as invisible padding so today lands at its
  /// correct weekday row instead of the bottom of the column. Same
  /// rendering approach as the Profile page's full 20-week grid, just
  /// 4 weeks and 8px cells.
  const miniHeatmap = useMemo(() => {
    if (!history || history.length === 0) return null;
    const counts = new Map<string, number>();
    for (const c of history) {
      const d = new Date(c.completed_at * 1000);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      counts.set(
        `${d.getFullYear()}-${m}-${day}`,
        (counts.get(`${d.getFullYear()}-${m}-${day}`) ?? 0) + 1,
      );
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDow = today.getDay();
    const start = new Date(today);
    // 4-week calendar window ending in the current week.
    start.setDate(start.getDate() - todayDow - 3 * 7);
    const cells: Array<{
      key: string;
      count: number;
      label: string;
      isPad: boolean;
    }> = [];
    let activeDays = 0;
    for (let i = 0; i < 4 * 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (d > today) {
        cells.push({ key: `pad-${i}`, count: 0, label: "", isPad: true });
        continue;
      }
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${d.getFullYear()}-${m}-${day}`;
      const count = counts.get(key) ?? 0;
      if (count > 0) activeDays += 1;
      cells.push({
        key,
        count,
        label: `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${count}`,
        isPad: false,
      });
    }
    const peak = Math.max(1, ...cells.map((c) => c.count));
    return { cells, peak, activeDays };
  }, [history]);

  /// Next-milestone hint. Picks the closest still-locked achievement
  /// from the same set the Profile page renders, so the dropdown
  /// always points at "the next thing to unlock". Falls back silently
  /// when every milestone is unlocked.
  const nextMilestone = useMemo(() => {
    const targets: Array<{ label: string; target: number; actual: number; unit: string }> = [
      { label: "First lesson", target: 1, actual: stats.lessonsCompleted, unit: "lesson" },
      { label: "Ten lessons", target: 10, actual: stats.lessonsCompleted, unit: "lessons" },
      { label: "Century", target: 100, actual: stats.lessonsCompleted, unit: "lessons" },
      { label: "3-day streak", target: 3, actual: Math.max(stats.streakDays, stats.longestStreakDays), unit: "days" },
      { label: "Week strong", target: 7, actual: Math.max(stats.streakDays, stats.longestStreakDays), unit: "days" },
      { label: "Iron habit", target: 30, actual: Math.max(stats.streakDays, stats.longestStreakDays), unit: "days" },
      { label: "Apprentice", target: 5, actual: stats.level, unit: "level" },
      { label: "Adept", target: 10, actual: stats.level, unit: "level" },
      { label: "Mastered", target: 20, actual: stats.level, unit: "level" },
      { label: "1k XP", target: 1000, actual: stats.xp, unit: "XP" },
      { label: "10k XP", target: 10000, actual: stats.xp, unit: "XP" },
    ];
    // Closest = smallest remaining gap (target - actual), among locked.
    let best: typeof targets[number] | null = null;
    let bestGap = Infinity;
    for (const t of targets) {
      if (t.actual >= t.target) continue;
      const gap = t.target - t.actual;
      if (gap < bestGap) {
        bestGap = gap;
        best = t;
      }
    }
    return best;
  }, [stats]);

  return (
    <div
      className="fishbones__topbar-stats-wrap"
      ref={wrapRef}
      data-tauri-drag-region={false}
    >
      <button
        className={`fishbones__topbar-stats-trigger ${
          open ? "fishbones__topbar-stats-trigger--open" : ""
        }`}
        onClick={() => setOpen((v) => !v)}
        title={`Level ${stats.level} · ${stats.streakDays} day streak`}
      >
        <span
          className={`fishbones__topbar-streak ${
            streakActive ? "fishbones__topbar-streak--active" : ""
          }`}
        >
          <span className="fishbones__topbar-streak-flame" aria-hidden>
            <Icon icon={flame} size="xs" color="currentColor" weight="bold" />
          </span>
          <span className="fishbones__topbar-streak-count">{stats.streakDays}</span>
        </span>
        <ProgressRing
          progress={levelProgress}
          size={22}
          stroke={2.5}
          label={String(stats.level)}
        />
      </button>

      {open && (
        <div className="fishbones__topbar-stats-panel" role="dialog" aria-label="Progress stats">
          {/* Hero row. The ring's centre already shows the level
              number, so the right-hand body promotes the SIGNED-IN
              identity (name + email) instead of duplicating "Level N"
              as a heading. When the learner is signed out, we fall
              back to a plain Level heading so the row still has
              something to anchor against the ring. */}
          <div className="fishbones__topbar-stats-hero">
            <ProgressRing
              progress={levelProgress}
              size={72}
              stroke={5}
              label={String(stats.level)}
              sublabel="level"
            />
            <div className="fishbones__topbar-stats-hero-body">
              {signedIn === true && (userDisplayName?.trim() || userEmail) ? (
                <>
                  <div className="fishbones__topbar-stats-heading">
                    {userDisplayName?.trim() || userEmail}
                  </div>
                  {userEmail && userDisplayName?.trim() && (
                    <div className="fishbones__topbar-stats-sub">{userEmail}</div>
                  )}
                </>
              ) : (
                <>
                  <div className="fishbones__topbar-stats-heading">Level {stats.level}</div>
                  <div className="fishbones__topbar-stats-sub">
                    {stats.xpIntoLevel} / {stats.xpForLevel} XP
                  </div>
                </>
              )}
              <div className="fishbones__topbar-stats-to-next">
                {xpToNext === 0
                  ? "Ready to level up — complete any lesson!"
                  : `${xpToNext} XP to level ${stats.level + 1}`}
              </div>
            </div>
          </div>

          <div className="fishbones__topbar-stats-divider" aria-hidden />

          <div className="fishbones__topbar-stats-grid">
            <StatBlock
              icon={flame}
              color={STAT_COLORS.streak}
              label={streakActive ? "Current streak" : "Streak"}
              value={`${stats.streakDays} ${stats.streakDays === 1 ? "day" : "days"}`}
              hint={
                stats.longestStreakDays > stats.streakDays
                  ? `best · ${stats.longestStreakDays} days`
                  : streakActive
                  ? "keep it going"
                  : "complete a lesson today to start"
              }
            />
            <StatBlock
              icon={check}
              color={STAT_COLORS.lessons}
              label="Lessons done"
              value={String(stats.lessonsCompleted)}
              hint="across all courses"
            />
            <StatBlock
              icon={sparkles}
              color={STAT_COLORS.xp}
              label="Total XP"
              value={String(stats.xp)}
              hint="5 reading · 10 quiz · 20 exercise"
            />
            <StatBlock
              icon={trophy}
              color={STAT_COLORS.longest}
              label="Longest streak"
              value={`${stats.longestStreakDays} ${
                stats.longestStreakDays === 1 ? "day" : "days"
              }`}
              hint="personal record"
            />
          </div>

          {/* 4-week mini heatmap. Calendar-aligned, same 5-level
              ramp as the Profile page's full grid. The header shows
              the active-days count so the dropdown answers "is this
              real data?" without leaving the bar. View Profile
              upgrades to the full 20-week grid + per-language chart
              + badges. Hidden when `history` isn't wired. */}
          {miniHeatmap && (
            <div
              className="fishbones__topbar-stats-mini-heat"
              aria-label="Activity over the last 4 weeks"
            >
              <div className="fishbones__topbar-stats-mini-heat-head">
                <span className="fishbones__topbar-stats-mini-heat-label">
                  Recent activity
                </span>
                <span className="fishbones__topbar-stats-mini-heat-count">
                  {miniHeatmap.activeDays === 0
                    ? "no activity yet"
                    : `${miniHeatmap.activeDays} active day${miniHeatmap.activeDays === 1 ? "" : "s"} · last 4 weeks`}
                </span>
              </div>
              <div className="fishbones__topbar-stats-mini-heat-body">
                <div className="fishbones__topbar-stats-mini-heat-rowlabels" aria-hidden>
                  <span />
                  <span>M</span>
                  <span />
                  <span>W</span>
                  <span />
                  <span>F</span>
                  <span />
                </div>
                <div className="fishbones__topbar-stats-mini-heat-grid">
                  {miniHeatmap.cells.map((c) => {
                    if (c.isPad) {
                      return (
                        <span
                          key={c.key}
                          className="fishbones__topbar-stats-mini-heat-cell fishbones__topbar-stats-mini-heat-cell--pad"
                          aria-hidden
                        />
                      );
                    }
                    const lvl =
                      c.count <= 0
                        ? 0
                        : c.count >= miniHeatmap.peak
                        ? 4
                        : c.count / miniHeatmap.peak >= 0.7
                        ? 4
                        : c.count / miniHeatmap.peak >= 0.45
                        ? 3
                        : c.count / miniHeatmap.peak >= 0.2
                        ? 2
                        : 1;
                    return (
                      <span
                        key={c.key}
                        className={`fishbones__topbar-stats-mini-heat-cell fishbones__topbar-stats-mini-heat-cell--lvl-${lvl}`}
                        title={c.label}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Next-milestone teaser — points the learner at the closest
              still-locked achievement so the View Profile button has
              a concrete reward attached to it. Hidden when every
              milestone is unlocked. */}
          {nextMilestone && (
            <div className="fishbones__topbar-stats-next">
              <span className="fishbones__topbar-stats-next-label">Next</span>
              <span className="fishbones__topbar-stats-next-name">
                {nextMilestone.label}
              </span>
              <span className="fishbones__topbar-stats-next-progress">
                {nextMilestone.actual}/{nextMilestone.target}{" "}
                <span className="fishbones__topbar-stats-next-unit">
                  {nextMilestone.unit}
                </span>
              </span>
            </div>
          )}

          {/* Account row + View-profile CTA, anchored to the bottom of
              the popup. When the learner is signed out, "Sign in"
              becomes the primary call-to-action and "View profile"
              steps down to a secondary outline; when they're signed in,
              the identity + a quiet "Sign out" link replaces the row
              and "View profile" goes back to primary. */}
          {signedIn === false && onSignIn && (
            <div className="fishbones__topbar-stats-account">
              <div className="fishbones__topbar-stats-account-row">
                <button
                  type="button"
                  className="fishbones__topbar-stats-signin"
                  onClick={() => {
                    setOpen(false);
                    onSignIn();
                  }}
                >
                  Sign in
                </button>
                {onOpenProfile && (
                  <button
                    type="button"
                    className="fishbones__topbar-stats-view-profile fishbones__topbar-stats-view-profile--secondary"
                    onClick={() => {
                      setOpen(false);
                      onOpenProfile();
                    }}
                  >
                    View profile
                  </button>
                )}
              </div>
            </div>
          )}

          {signedIn === true && (
            <div className="fishbones__topbar-stats-account">
              {/* Identity card removed from this row — the hero block
                  above promotes name + email next to the level ring,
                  so duplicating it here was just visual noise. */}
              <div className="fishbones__topbar-stats-account-row">
                {onOpenProfile && (
                  <button
                    type="button"
                    className="fishbones__topbar-stats-view-profile"
                    onClick={() => {
                      setOpen(false);
                      onOpenProfile();
                    }}
                  >
                    View profile
                  </button>
                )}
                {onSignOut && (
                  <button
                    type="button"
                    className="fishbones__topbar-stats-signout"
                    onClick={() => {
                      setOpen(false);
                      onSignOut();
                    }}
                  >
                    Sign out
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Fallback for embeds that don't wire `signedIn` at all —
              keeps the old single-CTA shape so non-Tauri builds aren't
              broken. */}
          {signedIn === undefined && onOpenProfile && (
            <button
              type="button"
              className="fishbones__topbar-stats-view-profile"
              onClick={() => {
                setOpen(false);
                onOpenProfile();
              }}
            >
              View profile
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatBlock({
  icon,
  color,
  label,
  value,
  hint,
}: {
  icon: string;
  /// Hex color used for BOTH the icon and the uppercase label text so the
  /// visual pairing is obvious. The big value + hint stay in their
  /// neutral token colors so rows don't become overwhelming.
  color: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="fishbones__topbar-stats-block">
      <div className="fishbones__topbar-stats-block-label" style={{ color }}>
        <span className="fishbones__topbar-stats-block-icon" aria-hidden>
          <Icon icon={icon} size="xs" color="currentColor" weight="bold" />
        </span>
        {label}
      </div>
      <div className="fishbones__topbar-stats-block-value">{value}</div>
      <div className="fishbones__topbar-stats-block-hint">{hint}</div>
    </div>
  );
}

