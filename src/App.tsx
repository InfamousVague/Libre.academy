import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { Course, Lesson, isExerciseKind, isQuiz } from "./data/types";
import { makeBus, openPoppedWorkbench, closePoppedWorkbench } from "./lib/workbenchSync";
import { deriveSolutionFiles } from "./lib/workbenchFiles";
import { Icon } from "@base/primitives/icon";
import { libraryBig } from "@base/primitives/icon/icons/library-big";
import "@base/primitives/icon/icon.css";
import Sidebar from "./components/Sidebar/Sidebar";
import TopBar from "./components/TopBar/TopBar";
import LessonReader from "./components/Lesson/LessonReader";
import LessonNav from "./components/Lesson/LessonNav";
import EditorPane from "./components/Editor/EditorPane";
import OutputPane from "./components/Output/OutputPane";
import Workbench from "./components/Workbench/Workbench";
import ImportDialog from "./components/ImportDialog/ImportDialog";
import BulkImportDialog from "./components/ImportDialog/BulkImportDialog";
import SettingsDialog from "./components/SettingsDialog/SettingsDialog";
import CourseLibrary from "./components/Library/CourseLibrary";
import ConfirmDialog from "./components/ConfirmDialog/ConfirmDialog";
import CourseSettingsModal from "./components/CourseSettings/CourseSettingsModal";
import FloatingIngestPanel from "./components/IngestPanel/FloatingIngestPanel";
import ProfileView from "./components/Profile/ProfileView";
import PlaygroundView from "./components/Playground/PlaygroundView";
import GeneratePackDialog from "./components/ChallengePack/GeneratePackDialog";
import { useIngestRun } from "./hooks/useIngestRun";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import QuizView from "./components/Quiz/QuizView";
import { runFiles, isPassing, type RunResult } from "./runtimes";
import { useProgress } from "./hooks/useProgress";
import { useCourses } from "./hooks/useCourses";
import { useStreakAndXp } from "./hooks/useStreakAndXp";
import { useWorkbenchFiles } from "./hooks/useWorkbenchFiles";
import "./App.css";

interface OpenCourse {
  courseId: string;
  lessonId: string;
}

export default function App() {
  const { courses, loaded: coursesLoaded, refresh: refreshCourses } = useCourses();

  const [openTabs, setOpenTabs] = useState<OpenCourse[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  // Pending delete request queued by the library / sidebar context menu.
  // Kept in state rather than firing window.confirm() directly so we can
  // render an app-styled modal with Escape + backdrop-click dismissal.
  const [pendingDelete, setPendingDelete] = useState<{
    courseId: string;
    courseTitle: string;
  } | null>(null);

  /// Completion state lives in SQLite; the hook loads on mount and writes
  /// through on markCompleted. Keys are `${courseId}:${lessonId}`.
  const { completed, history, markCompleted } = useProgress();
  const stats = useStreakAndXp(history, courses);

  /// Ingest run lifted to app level so it survives ImportDialog dismissal.
  /// Every per-lesson save triggers onCourseSaved, which re-fetches the
  /// courses list — the sidebar fills in with new lessons as the pipeline
  /// generates them. Debounced via useCourses' own internal handling.
  const {
    run: ingest,
    start: startIngest,
    startBulk: startBulkIngest,
    startRegenExercises,
    startGenerateChallengePack,
    startEnrichCourse,
    cancel: cancelIngest,
    dismiss: dismissIngest,
  } = useIngestRun({ onCourseSaved: () => { refreshCourses(); } });

  /// Course-id of the course whose settings modal is open. `null` when
  /// no settings modal is showing. Opened from the sidebar's right-click
  /// "Course settings…" action.
  const [courseSettingsId, setCourseSettingsId] = useState<string | null>(null);

  /// Which main-pane route is showing. "courses" is the default (welcome /
  /// inline library / lesson view depending on tab state). "profile" and
  /// "playground" are dedicated destinations triggered from the sidebar
  /// iconbar. Selecting a lesson anywhere forces back to "courses" so the
  /// learner isn't stuck on a side view after clicking a sidebar item.
  const [view, setView] = useState<"courses" | "profile" | "playground">(
    "courses",
  );

  /// Challenge-pack generation dialog visibility. Opened from the Profile
  /// page's "Generate challenge pack" CTA; runs through useIngestRun when
  /// submitted and closes itself.
  const [genPackOpen, setGenPackOpen] = useState(false);

  // On fresh launch (courses loaded, no tabs yet), open the first lesson
  // of the first course as a convenience. Skipped on re-mount once the
  // learner has actively opened/closed tabs — closing the last tab should
  // NOT auto-re-open it, the learner wanted the library view. The ref is
  // flipped after the first auto-open OR after any manual selectLesson
  // call so repeated close-all cycles don't keep re-opening.
  const didAutoOpen = useRef(false);
  useEffect(() => {
    if (didAutoOpen.current) return;
    if (coursesLoaded && courses.length > 0 && openTabs.length === 0) {
      didAutoOpen.current = true;
      const first = courses[0];
      const firstLessonId = first.chapters[0]?.lessons[0]?.id;
      if (firstLessonId) {
        setOpenTabs([{ courseId: first.id, lessonId: firstLessonId }]);
      }
    }
  }, [coursesLoaded, courses, openTabs.length]);

  const activeTab = openTabs[activeTabIndex];
  const activeCourse = courses.find((c) => c.id === activeTab?.courseId) ?? null;
  const activeLesson = findLesson(activeCourse, activeTab?.lessonId);

  function selectLesson(courseId: string, lessonId: string) {
    // Once the learner has explicitly opened something, the auto-open-
    // first-lesson effect stands down — they're driving.
    didAutoOpen.current = true;
    // Selecting a lesson always routes back to courses view — otherwise
    // we'd switch the sidebar's active tab silently while the main pane
    // still shows Profile / Playground. That's disorienting.
    setView("courses");
    const existing = openTabs.findIndex((t) => t.courseId === courseId);
    if (existing >= 0) {
      const updated = [...openTabs];
      updated[existing] = { courseId, lessonId };
      setOpenTabs(updated);
      setActiveTabIndex(existing);
    } else {
      setOpenTabs([...openTabs, { courseId, lessonId }]);
      setActiveTabIndex(openTabs.length);
    }
  }

  /// Ask for a destination then shell out to the Rust `export_course` command,
  /// which zips the course folder (course.json + any sibling assets) into a
  /// `.fishbones` archive. We derive a default filename from the course title
  /// so the save sheet starts on a useful name.
  async function exportCourse(courseId: string, courseTitle: string) {
    try {
      const defaultName = slugify(courseTitle) + ".fishbones";
      const destination = await save({
        defaultPath: defaultName,
        filters: [{ name: "Fishbones course", extensions: ["fishbones", "kata"] }],
        title: `Export "${courseTitle}"`,
      });
      if (!destination) return; // user cancelled
      await invoke("export_course", { courseId, destination });
    } catch (e) {
      // Keep this simple — surface via alert for now. A toast would be nicer
      // but there's no toast system yet; the happy path just succeeds silently.
      const msg = e instanceof Error ? e.message : String(e);
      alert(`Export failed: ${msg}`);
    }
  }

  /// Open a course from the Library view. Reuses the `selectLesson` path
  /// (which upserts an open tab) and targets the first lesson if the
  /// course isn't already open.
  function openCourseFromLibrary(courseId: string) {
    const c = courses.find((x) => x.id === courseId);
    if (!c) return;
    const existing = openTabs.find((t) => t.courseId === courseId);
    const lessonId = existing?.lessonId ?? c.chapters[0]?.lessons[0]?.id;
    if (!lessonId) return;
    selectLesson(courseId, lessonId);
    setLibraryOpen(false);
  }

  /// Queue a delete for confirmation. The actual deletion runs in
  /// `performDelete` once the user clicks Delete in the ConfirmDialog.
  function deleteCourseFromLibrary(courseId: string, courseTitle: string) {
    setPendingDelete({ courseId, courseTitle });
  }

  /// Actually wipe the course: remove the course dir, drop open tabs, clear
  /// the book's ingest cache so a re-import starts fresh. Errors on cache
  /// clear are swallowed because cache may already be gone; the course
  /// delete is the important part.
  async function performDelete(courseId: string) {
    try {
      await invoke("delete_course", { courseId });
      await invoke("cache_clear", { bookId: courseId }).catch((e) => {
        console.warn("[fishbones] cache_clear after delete failed:", e);
      });
      setOpenTabs((prev) => prev.filter((t) => t.courseId !== courseId));
      await refreshCourses();
    } catch (e) {
      console.error("[fishbones] delete_course failed:", e);
    } finally {
      setPendingDelete(null);
    }
  }

  /// Import a previously-exported `.fishbones` (or legacy `.kata`) archive.
  /// Opens the native file picker filtered to both extensions, then hands the
  /// absolute path to the Rust `import_course` command which unzips into the
  /// courses dir. On success we refresh the sidebar and jump to the first
  /// lesson.
  async function importCourseArchive() {
    try {
      const picked = await openDialog({
        multiple: false,
        filters: [{ name: "Fishbones course", extensions: ["fishbones", "kata"] }],
      });
      if (typeof picked !== "string") return; // user cancelled
      const courseId = await invoke<string>("import_course", {
        archivePath: picked,
      });
      const fresh = await refreshCourses();
      const imported = fresh.find((c) => c.id === courseId);
      if (!imported || imported.chapters.length === 0) return;
      const firstLessonId = imported.chapters[0].lessons[0]?.id;
      if (!firstLessonId) return;
      setOpenTabs((prev) => {
        const without = prev.filter((t) => t.courseId !== courseId);
        const next = [...without, { courseId, lessonId: firstLessonId }];
        setActiveTabIndex(next.length - 1);
        return next;
      });
      setLibraryOpen(false);
    } catch (e) {
      console.error("[fishbones] import_course failed:", e);
      alert(
        `Couldn't import course archive: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  function closeTab(index: number) {
    const next = openTabs.filter((_, i) => i !== index);
    setOpenTabs(next);
    if (activeTabIndex >= next.length) {
      setActiveTabIndex(Math.max(0, next.length - 1));
    } else if (activeTabIndex > index) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  }

  const tabs = openTabs.map((t) => {
    const c = courses.find((x) => x.id === t.courseId);
    return {
      id: t.courseId,
      label: c?.title ?? t.courseId,
      language: c?.language ?? "javascript",
    };
  });

  return (
    <div className="fishbones">
      <TopBar
        tabs={tabs}
        activeIndex={activeTabIndex}
        onActivate={setActiveTabIndex}
        onClose={closeTab}
        stats={stats}
        onOpenProfile={() => setView("profile")}
      />

      <div className="fishbones__body">
        <Sidebar
          courses={courses}
          activeCourseId={view === "courses" ? activeCourse?.id : undefined}
          activeLessonId={view === "courses" ? activeLesson?.id : undefined}
          completed={completed}
          onSelectLesson={selectLesson}
          onLibrary={() => setLibraryOpen(true)}
          onImport={() => setImportOpen(true)}
          onBulkImport={() => setBulkImportOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onProfile={() => setView("profile")}
          onPlayground={() => setView("playground")}
          activeView={view}
          onExportCourse={exportCourse}
          onDeleteCourse={deleteCourseFromLibrary}
          onCourseSettings={(id) => setCourseSettingsId(id)}
        />

        <main className="fishbones__main">
          {view === "profile" ? (
            <ProfileView
              courses={courses}
              completed={completed}
              history={history}
              stats={stats}
              onOpenLesson={selectLesson}
              onGeneratePack={() => setGenPackOpen(true)}
            />
          ) : view === "playground" ? (
            <PlaygroundView />
          ) : courses.length === 0 && coursesLoaded ? (
            <div className="fishbones__welcome">
              <div className="fishbones__welcome-inner">
                <div className="fishbones__welcome-glyph" aria-hidden>
                  <Icon icon={libraryBig} size="2xl" color="currentColor" weight="light" />
                </div>
                <h1 className="fishbones__welcome-title">Welcome to Fishbones</h1>
                <p className="fishbones__welcome-blurb">
                  Turn any technical book into an interactive course. Pick a PDF
                  to import, and Fishbones will split it into lessons, generate
                  exercises, and let you code along chapter by chapter.
                </p>
                <div className="fishbones__welcome-actions">
                  <button
                    className="fishbones__welcome-primary"
                    onClick={() => setImportOpen(true)}
                  >
                    Import a PDF
                  </button>
                  <button
                    className="fishbones__welcome-secondary"
                    onClick={() => setSettingsOpen(true)}
                  >
                    Open Settings
                  </button>
                </div>
                <p className="fishbones__welcome-hint">
                  You'll need an Anthropic API key in Settings for the AI-assisted
                  structuring pipeline. Without one, imports fall back to simple
                  section splits.
                </p>
              </div>
            </div>
          ) : openTabs.length === 0 ? (
            // No tabs open (all closed, or freshly launched before first
            // tab was created) — render the library inline so the learner
            // has a launching pad instead of a blank pane.
            <CourseLibrary
              mode="inline"
              courses={courses}
              completed={completed}
              onDismiss={() => { /* inline mode has no dismiss affordance */ }}
              onOpen={(id) => openCourseFromLibrary(id)}
              onImport={() => setImportOpen(true)}
              onImportArchive={importCourseArchive}
              onExport={exportCourse}
              onDelete={deleteCourseFromLibrary}
            />
          ) : activeLesson && activeCourse ? (
            <LessonView
              // Key on course+lesson so the editor/code state and quiz answers
              // fully reset when navigating via Prev/Next — otherwise React
              // would reuse stale component state across lessons.
              key={`${activeCourse.id}:${activeLesson.id}`}
              courseId={activeCourse.id}
              lesson={activeLesson}
              neighbors={findNeighbors(activeCourse, activeLesson.id)}
              isCompleted={completed.has(`${activeCourse.id}:${activeLesson.id}`)}
              onComplete={() => markCompleted(activeCourse.id, activeLesson.id)}
              onNavigate={(lessonId) => selectLesson(activeCourse.id, lessonId)}
            />
          ) : (
            <div className="fishbones__empty">
              <p>Pick a lesson from the sidebar to get started.</p>
            </div>
          )}
        </main>
      </div>

      {settingsOpen && <SettingsDialog onDismiss={() => setSettingsOpen(false)} />}

      {libraryOpen && (
        <CourseLibrary
          courses={courses}
          completed={completed}
          onDismiss={() => setLibraryOpen(false)}
          onOpen={openCourseFromLibrary}
          onImport={() => {
            setLibraryOpen(false);
            setImportOpen(true);
          }}
          onImportArchive={importCourseArchive}
          onExport={exportCourse}
          onDelete={deleteCourseFromLibrary}
        />
      )}

      {genPackOpen && (
        <GeneratePackDialog
          onDismiss={() => setGenPackOpen(false)}
          onStart={(opts) => {
            startGenerateChallengePack(opts);
            setGenPackOpen(false);
          }}
        />
      )}

      {courseSettingsId && (() => {
        const course = courses.find((c) => c.id === courseSettingsId);
        if (!course) return null;
        return (
          <CourseSettingsModal
            course={course}
            onDismiss={() => setCourseSettingsId(null)}
            onExport={() => exportCourse(course.id, course.title)}
            onDelete={() => deleteCourseFromLibrary(course.id, course.title)}
            onRegenerateExercises={() => startRegenExercises(course.id, course.title)}
            onEnrichLessons={() => startEnrichCourse(course.id, course.title)}
          />
        );
      })()}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete "${pendingDelete.courseTitle}"?`}
          message={
            `This removes the course, all lesson progress, and the ingest cache from disk. ` +
            `Re-importing the same PDF later will run the full AI pipeline from scratch.\n\n` +
            `This can't be undone.`
          }
          confirmLabel="Delete course"
          cancelLabel="Keep"
          danger
          onConfirm={() => performDelete(pendingDelete.courseId)}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {bulkImportOpen && (
        <BulkImportDialog
          onDismiss={() => setBulkImportOpen(false)}
          onStartQueue={(items) => {
            // Hands off to the queue runner. FloatingIngestPanel shows
            // progress across the batch. Dialog dismisses itself.
            startBulkIngest(items);
          }}
        />
      )}

      {importOpen && (
        <ImportDialog
          onDismiss={() => setImportOpen(false)}
          onStartAiIngest={(opts) => {
            // Fire-and-forget — the pipeline runs detached and the floating
            // panel (below) shows progress. Dialog already closes itself.
            startIngest(opts);
          }}
          onSavedCourse={async (courseId) => {
            // Non-AI path: the deterministic splitter already saved the
            // course. Refresh the sidebar + jump to the first lesson.
            const fresh = await refreshCourses();
            const imported = fresh.find((c) => c.id === courseId);
            if (!imported || imported.chapters.length === 0) return;
            const firstLessonId = imported.chapters[0].lessons[0]?.id;
            if (!firstLessonId) return;
            setOpenTabs((prev) => {
              const without = prev.filter((t) => t.courseId !== courseId);
              const next = [...without, { courseId, lessonId: firstLessonId }];
              setActiveTabIndex(next.length - 1);
              return next;
            });
          }}
        />
      )}

      {ingest.status !== "idle" && (
        <FloatingIngestPanel
          run={ingest}
          onCancel={cancelIngest}
          onDismiss={dismissIngest}
          onOpen={(bookId) => {
            const c = courses.find((x) => x.id === bookId);
            if (!c || c.chapters.length === 0) return;
            const firstLessonId = c.chapters[0].lessons[0]?.id;
            if (!firstLessonId) return;
            setOpenTabs((prev) => {
              const without = prev.filter((t) => t.courseId !== bookId);
              const next = [...without, { courseId: bookId, lessonId: firstLessonId }];
              setActiveTabIndex(next.length - 1);
              return next;
            });
            dismissIngest();
          }}
        />
      )}
    </div>
  );
}

interface Neighbors {
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
}

function LessonView({
  courseId,
  lesson,
  neighbors,
  isCompleted,
  onComplete,
  onNavigate,
}: {
  courseId: string;
  lesson: Lesson;
  neighbors: Neighbors;
  isCompleted: boolean;
  onComplete: () => void;
  onNavigate: (lessonId: string) => void;
}) {
  const hasExercise = isExerciseKind(lesson);
  // Multi-file workbench state. We always deal in arrays here — legacy
  // single-file lessons get synthesized into a one-element array by
  // `deriveStarterFiles`. Storing an array even for the single-file case
  // keeps the EditorPane contract uniform.
  // `useWorkbenchFiles` reads from localStorage synchronously on first
  // render so reopening a lesson restores the learner's in-progress code
  // instead of snapping back to the starter. Reset clears the save and
  // returns to starter in one step.
  const { files, setFiles, resetToStarter } = useWorkbenchFiles(
    courseId,
    lesson,
    hasExercise,
  );
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  // When true, the workbench has been popped out into a separate window and
  // the main-window editor gets hidden in favor of a "currently popped out"
  // placeholder. Reset on lesson change via the parent's keyed remount.
  const [popped, setPopped] = useState(false);


  async function handleRun() {
    if (!hasExercise) return;
    setRunning(true);
    setResult(null);
    try {
      const tests = "tests" in lesson ? lesson.tests : undefined;
      const r = await runFiles(lesson.language, files, tests);
      setResult(r);
      if (isPassing(r)) onComplete();
    } finally {
      setRunning(false);
    }
  }

  /// Reset reverts every file to its starter content AND wipes the saved
  /// copy in localStorage so the next lesson-open also starts fresh. Safe
  /// to call always — the hook no-ops when the lesson isn't an exercise.
  function handleReset() {
    resetToStarter();
    setActiveFileIdx(0);
  }

  /// Reveal solution swaps the entire file set to the reference solution.
  /// Clears the run result so the learner sees a fresh state to run against;
  /// gated by EditorPane's confirmation dialog so it can't fire by accident.
  function handleRevealSolution() {
    if (hasExercise) {
      setFiles(deriveSolutionFiles(lesson));
      setActiveFileIdx(0);
      setResult(null);
    }
  }

  /// Per-file edit handler. Immutably replaces the content of files[index].
  /// React re-renders EditorPane with the new array; Monaco picks up the
  /// new value for the active file.
  function handleFileChange(index: number, next: string) {
    setFiles((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const copy = prev.slice();
      copy[index] = { ...copy[index], content: next };
      return copy;
    });
  }

  const hints =
    hasExercise && "hints" in lesson && lesson.hints ? lesson.hints : undefined;

  // Keep the main window and the popped-out window in sync. The bus chooses
  // Tauri events (for native multi-window) or BroadcastChannel (for vite
  // dev) under the hood — we only see a clean listen/emit API here.
  useEffect(() => {
    if (!hasExercise) return;
    const bus = makeBus(courseId, lesson.id);
    const unlisten = bus.listen((msg, from) => {
      if (from !== "popped") return;
      if (msg.type === "files") setFiles(msg.files);
      if (msg.type === "running") setRunning(true);
      if (msg.type === "result") {
        setResult(msg.result);
        setRunning(false);
      }
      if (msg.type === "complete") onComplete();
      // The popped window fires `hello` once it mounts so we can push it
      // our current files (otherwise it'd load with starter text even if
      // the user had edited here).
      if (msg.type === "hello") {
        bus.emit({ type: "files", files }, "main");
      }
      // Popped window is going away — flip the inline workbench back on
      // so the learner doesn't stare at a "popped out" placeholder over
      // an empty detached window.
      if (msg.type === "closed") {
        setPopped(false);
      }
    });
    return unlisten;
    // `files` intentionally omitted — we re-broadcast via the effect
    // below. Including it here would re-register the listener on every
    // keystroke and drop pending messages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lesson.id, hasExercise, onComplete]);

  useEffect(() => {
    if (!hasExercise) return;
    const bus = makeBus(courseId, lesson.id);
    bus.emit({ type: "files", files }, "main");
  }, [files, courseId, lesson.id, hasExercise]);

  /// Open the workbench in a detached window. Uses Tauri's WebviewWindow
  /// when available so the popped window lives inside the app; falls back
  /// to window.open for vite dev or if the capability is missing. We pass
  /// the current code through the URL so the popped window paints with
  /// the learner's in-progress code on first render — localStorage isn't
  /// reliably shared across Tauri webview windows.
  async function handlePopOut() {
    if (!hasExercise) return;
    try {
      await openPoppedWorkbench(courseId, lesson.id, lesson.title, files);
      setPopped(true);
    } catch (e) {
      console.error("[fishbones] pop-out failed:", e);
    }
  }

  /// Bring the workbench back into the main window. Closes the popped
  /// window too so we don't leave a zombie detached view. The popped
  /// window's `beforeunload` also emits `closed` which flips our state,
  /// but setting it here too makes the main-window transition instant
  /// instead of waiting for the round-trip.
  async function handleReopenInline() {
    setPopped(false);
    await closePoppedWorkbench(courseId, lesson.id);
  }

  // Reading-only lessons have no run/quiz gate — the Next button stands in
  // as the "I read this" affordance. Exercise/quiz lessons get marked complete
  // when the user actually solves them, so Next there is just navigation.
  const isReadingOnly = !hasExercise && !isQuiz(lesson);

  function handleNext() {
    if (!neighbors.next) return;
    if (isReadingOnly && !isCompleted) {
      onComplete();
    }
    onNavigate(neighbors.next.id);
  }
  function handlePrev() {
    if (neighbors.prev) onNavigate(neighbors.prev.id);
  }

  const nextLabel =
    isReadingOnly && !isCompleted && neighbors.next ? "mark read & next" : "next";

  const nav = (
    <LessonNav
      prev={neighbors.prev}
      next={neighbors.next}
      onPrev={handlePrev}
      onNext={handleNext}
      nextLabel={nextLabel}
    />
  );

  // Quiz lessons are rendered inline under the lesson prose with no editor /
  // output pane — the quiz widget handles its own answer flow. Column layout
  // so reader and quiz stack vertically inside a single scroll container.
  if (isQuiz(lesson)) {
    return (
      <div className="fishbones__lesson fishbones__lesson--column">
        <div className="fishbones__lesson-scroll">
          <LessonReader lesson={lesson} />
          <QuizView lesson={lesson} onComplete={onComplete} />
          <div className="fishbones__lesson-nav-wrap">{nav}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fishbones__lesson">
      <LessonReader lesson={lesson} footer={nav} />
      {hasExercise && !popped && (
        <Workbench
          editor={
            <EditorPane
              language={lesson.language}
              files={files}
              activeIndex={activeFileIdx}
              onActiveIndexChange={setActiveFileIdx}
              onChange={handleFileChange}
              onRun={handleRun}
              hints={hints}
              onReset={handleReset}
              onRevealSolution={handleRevealSolution}
              onPopOut={handlePopOut}
            />
          }
          output={<OutputPane result={result} running={running} />}
        />
      )}
      {hasExercise && popped && (
        <button
          className="fishbones__workbench-popped-pill"
          onClick={handleReopenInline}
          title="Close the popped window and dock the workbench back into this pane"
        >
          <span className="fishbones__workbench-popped-pill-icon" aria-hidden>
            ⇲
          </span>
          <span>pop back in</span>
        </button>
      )}
    </div>
  );
}

/// Flatten all chapters into a linear lesson list and return the siblings of
/// the given lessonId. Returning null at the ends lets the nav disable the
/// Prev/Next buttons without additional branching in the view.
function findNeighbors(course: Course, lessonId: string): Neighbors {
  const flat: Array<{ id: string; title: string }> = [];
  for (const ch of course.chapters) {
    for (const l of ch.lessons) flat.push({ id: l.id, title: l.title });
  }
  const idx = flat.findIndex((x) => x.id === lessonId);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx < flat.length - 1 ? flat[idx + 1] : null,
  };
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "course";
}

function findLesson(course: Course | null, lessonId: string | undefined): Lesson | null {
  if (!course || !lessonId) return null;
  for (const ch of course.chapters) {
    const found = ch.lessons.find((l) => l.id === lessonId);
    if (found) return found;
  }
  return null;
}
