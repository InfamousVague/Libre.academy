import { useEffect, useState } from "react";
import { Icon } from "@base/primitives/icon";
import { chevronRight } from "@base/primitives/icon/icons/chevron-right";
import { chevronDown } from "@base/primitives/icon/icons/chevron-down";
import { bookOpen } from "@base/primitives/icon/icons/book-open";
import { code as codeIcon } from "@base/primitives/icon/icons/code";
import { helpCircle } from "@base/primitives/icon/icons/help-circle";
import { libraryBig } from "@base/primitives/icon/icons/library-big";
import { settings as settingsIcon } from "@base/primitives/icon/icons/settings";
import { filePlus } from "@base/primitives/icon/icons/file-plus";
import { files as filesIcon } from "@base/primitives/icon/icons/files";
import { download as downloadIcon } from "@base/primitives/icon/icons/download";
import { x as xIcon } from "@base/primitives/icon/icons/x";
import { userRound } from "@base/primitives/icon/icons/user-round";
import { terminal as terminalIcon } from "@base/primitives/icon/icons/terminal";
import { swords } from "@base/primitives/icon/icons/swords";
import "@base/primitives/icon/icon.css";
import type { Course, Chapter, Lesson, LanguageId } from "../../data/types";
import { isChallengePack } from "../../data/types";
import "./Sidebar.css";

/// Display name for a language id. Used by the "Rust challenges" style
/// section header so the learner sees which subset we're showing, not
/// a bare "Challenge packs" that's ambiguous when filtered.
function languageLabel(lang: LanguageId): string {
  switch (lang) {
    case "javascript":
      return "JavaScript";
    case "typescript":
      return "TypeScript";
    case "python":
      return "Python";
    case "rust":
      return "Rust";
    case "swift":
      return "Swift";
    case "go":
      return "Go";
  }
}

/// Maps a lesson kind to the glyph shown to the left of its title in the
/// sidebar. Keeping this in one place so adding a new lesson type is a
/// one-line change rather than hunting through LessonRow.
function iconForKind(kind: Lesson["kind"]) {
  switch (kind) {
    case "reading":
      return bookOpen;
    case "exercise":
    case "mixed":
      return codeIcon;
    case "quiz":
      return helpCircle;
  }
}

interface Props {
  courses: Course[];
  activeCourseId?: string;
  activeLessonId?: string;
  completed: Set<string>;
  onSelectLesson: (courseId: string, lessonId: string) => void;
  /// Opens the course library modal.
  onLibrary: () => void;
  /// Opens the import-from-PDF wizard directly.
  onImport: () => void;
  /// Opens the multi-PDF bulk import wizard — lets the learner queue
  /// several books for unattended overnight processing.
  onBulkImport?: () => void;
  onSettings: () => void;
  /// Profile route. When active, the `activeView === "profile"` flag lights
  /// up the chip so the learner has a clear anchor while they're looking
  /// at their stats page.
  onProfile?: () => void;
  /// Playground route — free-form coding sandbox, jsfiddle-style.
  onPlayground?: () => void;
  /// Which main-pane destination is currently showing. Used ONLY to draw
  /// an active state on the matching icon chip; clicking a chip calls
  /// its callback and lets the parent manage the state transition.
  activeView?: "courses" | "profile" | "playground";
  onExportCourse?: (courseId: string, courseTitle: string) => void;
  onDeleteCourse?: (courseId: string, courseTitle: string) => void;
  onCourseSettings?: (courseId: string) => void;
}

/// Floating left rail. Completion dots fill in as lessons get marked done
/// (unit test passes, mark-read, etc.). The chapter header shows `x / y`
/// lessons complete so users see progress at a glance.
export default function Sidebar({
  courses,
  activeCourseId,
  activeLessonId,
  completed,
  onSelectLesson,
  onLibrary,
  onImport,
  onBulkImport,
  onSettings,
  onProfile,
  onPlayground,
  activeView = "courses",
  onExportCourse,
  onDeleteCourse,
  onCourseSettings,
}: Props) {
  /// Open context menu state, positioned at the cursor when a course card
  /// is right-clicked. One menu at a time across the sidebar — opening a
  /// new one closes the previous. Clicking outside, pressing Escape, or
  /// scrolling the sidebar dismisses it.
  const [menu, setMenu] = useState<{
    courseId: string;
    courseTitle: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // `click` (not `mousedown`) so the click that opens a menu item still
    // hits the item before the dismiss fires. `contextmenu` dismiss on a
    // different card lets the new card open its own menu immediately.
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  return (
    <aside className="fishbones__sidebar">
      {/* Primary nav — vertical list with icon + label. Claude-Code-style:
          full-width rows, clear call-outs, no ambiguity about what each
          chip does. Routes (Profile / Playground) show an active state
          when their view is open; one-shot actions (Library / Import /
          Settings) stay neutral. */}
      <div className="fishbones__sidebar-nav">
        <SidebarNavItem
          icon={libraryBig}
          label="Library"
          onClick={onLibrary}
        />
        <SidebarNavItem
          icon={filePlus}
          label="Import from PDF"
          onClick={onImport}
        />
        {onBulkImport && (
          <SidebarNavItem
            icon={filesIcon}
            label="Bulk import"
            onClick={onBulkImport}
          />
        )}
        {onPlayground && (
          <SidebarNavItem
            icon={terminalIcon}
            label="Playground"
            onClick={onPlayground}
            active={activeView === "playground"}
          />
        )}
        {onProfile && (
          <SidebarNavItem
            icon={userRound}
            label="Profile"
            onClick={onProfile}
            active={activeView === "profile"}
          />
        )}
        <SidebarNavItem
          icon={settingsIcon}
          label="Settings"
          onClick={onSettings}
        />
      </div>

      <nav className="fishbones__nav">
        {(() => {
          // Partition into books vs challenge packs so they render under
          // distinct section headers. Order within each group is preserved
          // (newest-first comes from the caller). We still render a single
          // list when only one kind is present — no empty headers.
          const books = courses.filter((c) => !isChallengePack(c));
          const packs = courses.filter((c) => isChallengePack(c));

          const renderGroup = (
            course: Course,
          ): React.ReactElement => (
            <CourseGroup
              key={course.id}
              course={course}
              isActiveCourse={course.id === activeCourseId}
              activeLessonId={activeLessonId}
              completed={completed}
              onSelectLesson={onSelectLesson}
              onContextMenu={
                onExportCourse || onDeleteCourse || onCourseSettings
                  ? (e: React.MouseEvent) => {
                      e.preventDefault();
                      setMenu({
                        courseId: course.id,
                        courseTitle: course.title,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }
                  : undefined
              }
            />
          );

          // Active course (if any) is lifted to the top of the nav under
          // a "Current" header so the "which course am I in" question is
          // answered before the eye even reaches the list. When you ARE
          // focused on a course, the rest of the sidebar narrows to just
          // that language's challenge packs — other courses would be
          // noise you're not currently using, challenge packs in the
          // same language are the natural practice companion. When no
          // course is active (just launched, or on Profile / Playground),
          // we skip the Current header and show everything under the
          // normal sections so the learner can pick.
          const activeCourse =
            courses.find((c) => c.id === activeCourseId) ?? null;
          const inactiveBooks = books.filter((c) => c.id !== activeCourseId);
          const inactivePacks = packs.filter((c) => c.id !== activeCourseId);

          // Language-filtered packs when focused on a course. We match
          // the pack's primary language to the active course's language.
          const relevantPacks = activeCourse
            ? inactivePacks.filter((p) => p.language === activeCourse.language)
            : inactivePacks;

          return (
            <>
              {activeCourse && (
                <>
                  <div className="fishbones__nav-section">Current</div>
                  {renderGroup(activeCourse)}
                </>
              )}
              {!activeCourse && inactiveBooks.length > 0 && (
                <>
                  <div className="fishbones__nav-section">Courses</div>
                  {inactiveBooks.map(renderGroup)}
                </>
              )}
              {relevantPacks.length > 0 && (
                <>
                  <div className="fishbones__nav-section fishbones__nav-section--packs">
                    <span className="fishbones__nav-section-icon" aria-hidden>
                      <Icon icon={swords} size="xs" color="currentColor" />
                    </span>
                    {activeCourse
                      ? `${languageLabel(activeCourse.language)} challenges`
                      : "Challenge packs"}
                  </div>
                  {relevantPacks.map(renderGroup)}
                </>
              )}
            </>
          );
        })()}
      </nav>

      {menu && (onExportCourse || onDeleteCourse || onCourseSettings) && (
        <div
          className="fishbones__context-menu"
          // Position at cursor. Fixed positioning so scroll state doesn't
          // matter — the window-level click listener dismisses us anyway.
          style={{ left: menu.x, top: menu.y }}
          // Stop the click from bubbling to window and dismissing before
          // the item's onClick fires.
          onClick={(e) => e.stopPropagation()}
        >
          <div className="fishbones__context-menu-label">{menu.courseTitle}</div>
          {onCourseSettings && (
            <button
              className="fishbones__context-menu-item"
              onClick={() => {
                onCourseSettings(menu.courseId);
                setMenu(null);
              }}
            >
              <span className="fishbones__context-menu-icon" aria-hidden>
                <Icon icon={settingsIcon} size="xs" color="currentColor" />
              </span>
              Course settings…
            </button>
          )}
          {onExportCourse && (
            <button
              className="fishbones__context-menu-item"
              onClick={() => {
                onExportCourse(menu.courseId, menu.courseTitle);
                setMenu(null);
              }}
            >
              <span className="fishbones__context-menu-icon" aria-hidden>
                <Icon icon={downloadIcon} size="xs" color="currentColor" />
              </span>
              Export course…
            </button>
          )}
          {onDeleteCourse && (
            <>
              {/* Separator between non-destructive and destructive actions. */}
              <div className="fishbones__context-menu-sep" aria-hidden />
              <button
                className="fishbones__context-menu-item fishbones__context-menu-item--danger"
                onClick={() => {
                  onDeleteCourse(menu.courseId, menu.courseTitle);
                  setMenu(null);
                }}
              >
                <span className="fishbones__context-menu-icon" aria-hidden>
                  <Icon icon={xIcon} size="xs" color="currentColor" />
                </span>
                Delete course…
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}

function CourseGroup({
  course,
  isActiveCourse,
  activeLessonId,
  completed,
  onSelectLesson,
  onContextMenu,
}: {
  course: Course;
  isActiveCourse: boolean;
  activeLessonId?: string;
  completed: Set<string>;
  onSelectLesson: (courseId: string, lessonId: string) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}) {
  // The active course is always expanded — the learner is working inside
  // it and needs its tree visible. Inactive courses default collapsed;
  // clicking the row expands them inline so the learner can peek
  // without switching focus.
  const [expanded, setExpanded] = useState(isActiveCourse);

  const totalLessons = course.chapters.reduce((n, ch) => n + ch.lessons.length, 0);
  const doneLessons = course.chapters.reduce(
    (n, ch) => n + ch.lessons.filter((l) => completed.has(`${course.id}:${l.id}`)).length,
    0
  );
  const pct = totalLessons > 0 ? doneLessons / totalLessons : 0;

  // Active course: full card with progress bar, always expanded. The
  // elevated surface and the progress-bar treatment advertise "this is
  // the course you're in" unambiguously.
  if (isActiveCourse) {
    return (
      <div className="fishbones__course fishbones__course--active">
        <div
          className="fishbones__course-card fishbones__course-card--expanded fishbones__course-card--active"
          onContextMenu={onContextMenu}
        >
          <div className="fishbones__course-title fishbones__course-title--static">
            <span className="fishbones__course-active-dot" aria-hidden />
            <span className="fishbones__course-name">{course.title}</span>
            <span className="fishbones__course-progress">
              {doneLessons}/{totalLessons}
            </span>
          </div>
          <div className="fishbones__course-progress-bar" aria-hidden>
            <div
              className="fishbones__course-progress-fill"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
        </div>

        <div className="fishbones__course-body">
          {course.chapters.map((chapter) => (
            <ChapterBlock
              key={chapter.id}
              chapter={chapter}
              courseId={course.id}
              activeLessonId={activeLessonId}
              completed={completed}
              onSelectLesson={onSelectLesson}
            />
          ))}
        </div>
      </div>
    );
  }

  // Inactive course: compact single-line row that matches the top nav
  // item pattern (icon/caret + label + trailing count). Clicking the
  // row expands inline so the learner can still jump into a specific
  // lesson of a non-focused course without changing this one's "active"
  // state — selecting a lesson inside will promote it to active via
  // `onSelectLesson`, at which point the next render treats it as
  // active and shows the full card.
  return (
    <div className="fishbones__course fishbones__course--compact">
      <button
        className="fishbones__course-row"
        onClick={() => setExpanded(!expanded)}
        onContextMenu={onContextMenu}
      >
        <span className="fishbones__course-row-caret" aria-hidden>
          <Icon
            icon={expanded ? chevronDown : chevronRight}
            size="xs"
            color="currentColor"
            weight="bold"
          />
        </span>
        <span className="fishbones__course-name">{course.title}</span>
        <span className="fishbones__course-row-progress">
          {doneLessons}/{totalLessons}
        </span>
      </button>

      {expanded && (
        <div className="fishbones__course-body">
          {course.chapters.map((chapter) => (
            <ChapterBlock
              key={chapter.id}
              chapter={chapter}
              courseId={course.id}
              activeLessonId={undefined}
              completed={completed}
              onSelectLesson={onSelectLesson}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/// Vertical nav-list row at the top of the sidebar. Icon + label, full
/// width. `active` controls the highlighted pill state for persistent
/// destinations (Profile, Playground) so the learner always knows which
/// main-pane route they're on.
function SidebarNavItem({
  icon,
  label,
  onClick,
  active,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`fishbones__sidebar-nav-item ${active ? "fishbones__sidebar-nav-item--active" : ""}`}
      onClick={onClick}
    >
      <span className="fishbones__sidebar-nav-icon" aria-hidden>
        <Icon icon={icon} size="sm" color="currentColor" />
      </span>
      <span className="fishbones__sidebar-nav-label">{label}</span>
    </button>
  );
}

function ChapterBlock({
  chapter,
  courseId,
  activeLessonId,
  completed,
  onSelectLesson,
}: {
  chapter: Chapter;
  courseId: string;
  activeLessonId?: string;
  completed: Set<string>;
  onSelectLesson: (courseId: string, lessonId: string) => void;
}) {
  const done = chapter.lessons.filter((l) => completed.has(`${courseId}:${l.id}`)).length;
  const total = chapter.lessons.length;

  return (
    <div className="fishbones__chapter">
      <div className="fishbones__chapter-title">
        <span>{chapter.title}</span>
        <span className="fishbones__chapter-progress">
          {done}/{total}
        </span>
      </div>
      {chapter.lessons.map((lesson) => (
        <LessonRow
          key={lesson.id}
          lesson={lesson}
          isCompleted={completed.has(`${courseId}:${lesson.id}`)}
          isActive={lesson.id === activeLessonId}
          onSelect={() => onSelectLesson(courseId, lesson.id)}
          difficulty={
            lesson.kind === "exercise" || lesson.kind === "mixed"
              ? lesson.difficulty
              : undefined
          }
        />
      ))}
    </div>
  );
}

function LessonRow({
  lesson,
  isCompleted,
  isActive,
  onSelect,
  difficulty,
}: {
  lesson: Lesson;
  isCompleted: boolean;
  isActive: boolean;
  onSelect: () => void;
  /// Only present for challenge-pack exercise rows. Drives a colored dot
  /// (easy → green, medium → amber, hard → red) that replaces the default
  /// kind-based accent so a pack reads as ramp-up, not as ordered lessons.
  difficulty?: "easy" | "medium" | "hard";
}) {
  return (
    <button
      className={`fishbones__nav-item fishbones__lesson-item fishbones__lesson-item--${lesson.kind} ${
        isActive ? "fishbones__nav-item--active" : ""
      }`}
      onClick={onSelect}
    >
      <LessonStatusIcon
        kind={lesson.kind}
        completed={isCompleted}
        active={isActive}
        difficulty={difficulty}
      />
      <span className="fishbones__lesson-name">{lesson.title}</span>
    </button>
  );
}

/// Single icon slot to the left of the lesson title. The same kind-glyph
/// (book / code / help-circle) is rendered across every state — only the
/// circle around it changes:
///   - pending: hollow ring, icon is a barely-visible dim gray
///   - active: hollow ring brightened, icon slightly more visible + halo
///   - done:  filled white circle with a black icon inside (inverted)
/// Keeping the glyph persistent means a completed lesson still advertises
/// what it was (reading vs exercise vs quiz), just styled differently.
///
/// When `difficulty` is set (challenge-pack lessons), we ALSO add a
/// `--diff-*` modifier so CSS can tint the pending/active ring to the
/// difficulty color (green/amber/red). Completed state still inverts to
/// the filled white disc — once you've solved it, difficulty is history.
function LessonStatusIcon({
  kind,
  completed,
  active,
  difficulty,
}: {
  kind: Lesson["kind"];
  completed: boolean;
  active: boolean;
  difficulty?: "easy" | "medium" | "hard";
}) {
  const state = completed ? "done" : active ? "active" : "pending";
  const diffClass = difficulty ? ` fishbones__lesson-status--diff-${difficulty}` : "";
  return (
    <span
      className={`fishbones__lesson-status fishbones__lesson-status--${state} fishbones__lesson-status--${kind}${diffClass}`}
      aria-hidden
    >
      <Icon icon={iconForKind(kind)} size="xs" color="currentColor" />
    </span>
  );
}
