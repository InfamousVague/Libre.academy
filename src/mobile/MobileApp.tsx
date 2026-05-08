/// Mobile root. Renders a totally separate tree from the desktop App
/// — no TopBar, no Sidebar, no editor, no Playground, no AI orb.
/// Four bottom tabs: Library / Lesson / Profile / Settings.
///
/// The desktop App.tsx short-circuits to <MobileApp /> when the
/// `isMobile` predicate fires, so we don't pay for any of the
/// desktop chrome on phone-sized devices. Reuses the same hooks
/// (`useCourses`, `useProgress`, `useFishbonesCloud`, `useStreakAndXp`)
/// so progress, streak/XP, and account state flow through the existing
/// storage and relay backends without per-platform branches.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCourses } from "../hooks/useCourses";
import { useProgress } from "../hooks/useProgress";
import { useFishbonesCloud } from "../hooks/useFishbonesCloud";
import { useRealtimeSync } from "../hooks/useRealtimeSync";
import { useStreakAndXp } from "../hooks/useStreakAndXp";
import {
  LIBRARY_INSTALLED_IDS_KEY,
  parseLibraryAllowlist,
  reconcilePerception,
  serializeLibraryAllowlist,
} from "../lib/librarySync";
import type { Course, Lesson } from "../data/types";
import MobileLibrary from "./MobileLibrary";
import MobileLesson from "./MobileLesson";
import MobileProfile from "./MobileProfile";
import MobileSettings from "./MobileSettings";
import MobileSearchPalette from "./MobileSearchPalette";
import SignInDialog from "../components/dialogs/SignInDialog/SignInDialog";
import MobileTabBar, { type MobileTab } from "../components/MobileTabBar/MobileTabBar";
import AiAssistant from "../components/AiAssistant/AiAssistant";
import FishbonesLoader from "../components/Shared/FishbonesLoader";
import "./MobileApp.css";

type View = "library" | "lesson" | "profile" | "settings";

interface ActiveLesson {
  course: Course;
  chapterIndex: number;
  lessonIndex: number;
}

export default function MobileApp() {
  const { courses: coursesAll, loaded, hydrateCourse } = useCourses();
  const { completed, history, markCompleted, resetProgress } = useProgress();
  const cloud = useFishbonesCloud();

  /// Cross-device library allowlist. Hydrated from localStorage on
  /// mount (so a cold-start before the cloud round-trips still shows
  /// the right set), updated by the realtime settings sync, and used
  /// to filter the visible course list. Null means "no published
  /// allowlist yet — render every local course" (mobile fresh-launch
  /// before any device has signed in).
  const [libraryAllowlist, setLibraryAllowlist] = useState<Set<string> | null>(
    () => {
      try {
        return parseLibraryAllowlist(localStorage.getItem(LIBRARY_INSTALLED_IDS_KEY));
      } catch {
        return null;
      }
    },
  );

  /// Visible course list = intersection of local IndexedDB courses
  /// and the cloud-synced allowlist. The allowlist exists so a phone
  /// that bootstrapped from the 19-course web seed doesn't display
  /// books the user removed on their desktop. When no allowlist has
  /// been published yet (fresh account), pass through unchanged so
  /// the user still sees something to start with.
  const courses = useMemo(() => {
    if (!libraryAllowlist) return coursesAll;
    return coursesAll.filter((c) => libraryAllowlist.has(c.id));
  }, [coursesAll, libraryAllowlist]);

  const stats = useStreakAndXp(history, courses);

  /// Real-time cross-device sync. Identical wiring to the desktop
  /// App.tsx — pulls progress / solutions / settings on sign-in,
  /// subscribes to the relay's WS bus, and exposes debounced push
  /// helpers that `markCompleted` below feeds into. Without this
  /// the phone stayed silent on the sync bus: the desktop's writes
  /// landed but the phone never echoed its own back, so a lesson
  /// marked complete on the phone never showed up on the desktop
  /// (and vice-versa).
  const realtime = useRealtimeSync({
    cloud,
    applyProgress: useCallback(
      (rows: Array<{ course_id: string; lesson_id: string }>) => {
        for (const r of rows) markCompleted(r.course_id, r.lesson_id);
      },
      [markCompleted],
    ),
    applySolutions: useCallback(
      (
        rows: Array<{ course_id: string; lesson_id: string; content: string }>,
      ) => {
        // Persist into the same workbench-localStorage key the desktop
        // uses, so the next mount of the lesson picks up the synced
        // version. Mobile doesn't render the workbench tab strip —
        // lessons run via a single solution string — but the storage
        // key shape is shared and deterministic.
        for (const r of rows) {
          try {
            const key = `kata:workbench:v1:${r.course_id}:${r.lesson_id}`;
            const previous = localStorage.getItem(key);
            const sig = previous
              ? (JSON.parse(previous) as { signature?: string }).signature ??
                ""
              : "";
            const parsed = JSON.parse(r.content) as unknown;
            const files = Array.isArray(parsed) ? parsed : null;
            if (!files) continue;
            localStorage.setItem(
              key,
              JSON.stringify({
                signature: sig,
                files,
                savedAt: Date.now(),
              }),
            );
          } catch {
            /* swallow — best-effort sync */
          }
        }
      },
      [],
    ),
    applySettings: useCallback(
      (rows: Array<{ key: string; value: string }>) => {
        for (const r of rows) {
          try {
            localStorage.setItem(r.key, r.value);
          } catch {
            /* swallow */
          }
          // The library allowlist piggybacks on the settings sync.
          // Re-parse and lift into React state so the visible-courses
          // memo invalidates and the library re-renders against the
          // freshly-pulled set without a focus-refresh round-trip.
          if (r.key === LIBRARY_INSTALLED_IDS_KEY) {
            setLibraryAllowlist(parseLibraryAllowlist(r.value));
          }
        }
      },
      [],
    ),
  });

  /// Mobile-side library push. Bidirectional by design — when the
  /// user adds or removes a course locally (e.g. a future "import
  /// course" path), we want desktop to learn about it. Gated on
  /// `libraryAllowlist !== null` so the 19-course first-launch seed
  /// doesn't clobber a desktop user's curated list before we've even
  /// pulled their value: mobile waits to see the cloud baseline,
  /// then reconciles by adding / removing only the IDs that actually
  /// changed locally vs the previous snapshot. That way a user
  /// installing a new course on the phone EXTENDS the cloud set
  /// instead of replacing it with the phone's local subset.
  const previousLocalIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!loaded) return;
    const localIds = coursesAll.map((c) => c.id);
    const previous = previousLocalIdsRef.current;
    previousLocalIdsRef.current = new Set(localIds);
    // First observation of the local list — initialise the ref but
    // don't push (we haven't seen any user action yet, just the
    // bootloader handing us the seed).
    if (previous === null) return;
    if (!cloud.signedIn || !libraryAllowlist) return;
    const next = reconcilePerception(libraryAllowlist, localIds, previous);
    const serializedNext = serializeLibraryAllowlist(next);
    const serializedCurrent = serializeLibraryAllowlist(libraryAllowlist);
    if (serializedNext === serializedCurrent) return;
    setLibraryAllowlist(next);
    try {
      localStorage.setItem(LIBRARY_INSTALLED_IDS_KEY, serializedNext);
    } catch {
      /* swallow */
    }
    realtime.pushSetting({
      key: LIBRARY_INSTALLED_IDS_KEY,
      value: serializedNext,
      updated_at: new Date().toISOString(),
    });
  }, [coursesAll, loaded, cloud.signedIn, libraryAllowlist, realtime]);
  const [view, setView] = useState<View>("library");
  const [active, setActive] = useState<ActiveLesson | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  // Cmd+K-style search overlay state. Lives at the app level (not
  // per-view) so any screen can pop the palette and any result can
  // navigate to a lesson without prop-drilling — and so the same
  // input survives a tab switch if the user dismisses without
  // selecting.
  const [searchOpen, setSearchOpen] = useState(false);

  // Hand off from index.html's inline preloader to our React loader.
  // Runs in a layout-effect (post-DOM-mutate, pre-paint) so the inline
  // preloader fades exactly when `<FishbonesLoader>` is on screen —
  // no black gap on cold-start. Safe to run once; the safety timeout
  // in main.tsx is a no-op if we got here first.
  useLayoutEffect(() => {
    document.body.classList.add("is-booted");
  }, []);

  const lesson: Lesson | null = useMemo(() => {
    if (!active) return null;
    const ch = active.course.chapters[active.chapterIndex];
    if (!ch) return null;
    return ch.lessons[active.lessonIndex] ?? null;
  }, [active]);

  const openLesson = async (course: Course, chapterIndex: number, lessonIndex: number) => {
    const hydrated = await hydrateCourse(course.id);
    setActive({ course: hydrated ?? course, chapterIndex, lessonIndex });
    setView("lesson");
  };

  const goNext = () => {
    if (!active) return;
    const ch = active.course.chapters[active.chapterIndex];
    if (!ch) return;
    if (active.lessonIndex + 1 < ch.lessons.length) {
      setActive({ ...active, lessonIndex: active.lessonIndex + 1 });
      return;
    }
    if (active.chapterIndex + 1 < active.course.chapters.length) {
      setActive({
        ...active,
        chapterIndex: active.chapterIndex + 1,
        lessonIndex: 0,
      });
    }
  };

  const goPrev = () => {
    if (!active) return;
    if (active.lessonIndex > 0) {
      setActive({ ...active, lessonIndex: active.lessonIndex - 1 });
      return;
    }
    if (active.chapterIndex > 0) {
      const prevCh = active.course.chapters[active.chapterIndex - 1];
      setActive({
        ...active,
        chapterIndex: active.chapterIndex - 1,
        lessonIndex: Math.max(0, prevCh.lessons.length - 1),
      });
    }
  };

  const hasPrev = active
    ? active.chapterIndex > 0 || active.lessonIndex > 0
    : false;
  const hasNext = active
    ? active.chapterIndex + 1 < active.course.chapters.length ||
      active.lessonIndex + 1 < active.course.chapters[active.chapterIndex].lessons.length
    : false;

  const onComplete = () => {
    if (!active || !lesson) return;
    void markCompleted(active.course.id, lesson.id);
    // Mirror to the realtime sync bus so the desktop (and other phones
    // signed into the same account) see this lesson tick green within
    // a network round-trip. Coalesced + fire-and-forget — the local
    // mark already succeeded, the relay echo is best-effort.
    realtime.pushProgress({
      course_id: active.course.id,
      lesson_id: lesson.id,
      completed_at: new Date().toISOString(),
    });
    goNext();
  };

  // Used by the Settings "Reset local progress" button. We reset the
  // hook's in-memory + storage state in one shot.
  const resetLocalProgress = async () => {
    await resetProgress();
  };

  // Map app view → tab id. The tab bar's "courses" segment is for the
  // active lesson; everything else is a 1:1 view-to-tab mapping.
  const activeTab: MobileTab =
    view === "lesson"
      ? "courses"
      : view === "profile"
        ? "profile"
        : view === "settings"
          ? "settings"
          : "library";

  return (
    <div className="m-app">
      {!loaded && (
        <div className="m-app__boot">
          <FishbonesLoader label="loading" />
        </div>
      )}

      <main className="m-app__main">
        {view === "library" && (
          <MobileLibrary
            courses={courses}
            completed={completed}
            onOpenLesson={openLesson}
            onOpenSearch={() => setSearchOpen(true)}
          />
        )}
        {view === "lesson" && active && lesson && (
          <MobileLesson
            course={active.course}
            chapterIndex={active.chapterIndex}
            lessonIndex={active.lessonIndex}
            lesson={lesson}
            completed={completed}
            onBack={() => setView("library")}
            onComplete={onComplete}
            onPrev={hasPrev ? goPrev : undefined}
            onNext={hasNext ? goNext : undefined}
            onJump={(ci, li) =>
              setActive({ course: active.course, chapterIndex: ci, lessonIndex: li })
            }
            isCompleted={completed.has(`${active.course.id}:${lesson.id}`)}
          />
        )}
        {view === "profile" && (
          <MobileProfile
            courses={courses}
            history={history}
            stats={stats}
            completed={completed}
            onOpenLesson={openLesson}
            onOpenSearch={() => setSearchOpen(true)}
          />
        )}
        {view === "settings" && (
          <MobileSettings
            cloud={cloud}
            onRequestSignIn={() => setSignInOpen(true)}
            onResetProgress={resetLocalProgress}
          />
        )}
      </main>

      <MobileTabBar
        active={activeTab}
        hasActiveLesson={active !== null}
        onLibrary={() => setView("library")}
        onLesson={() => {
          if (active) setView("lesson");
        }}
        onProfile={() => setView("profile")}
        onSettings={() => setView("settings")}
      />

      {/* Floating AI assistant. Same component as the desktop, but
          the underlying `useAiChat` hook autoselects the remote
          variant on mobile (see src/hooks/useAiChat.ts) — phone HTTPs
          straight to the user's configured Ollama host (typically a
          Mac on their Tailscale tailnet). When unconfigured the orb
          still mounts but probe reports unreachable, so the panel
          shows a "set the host in Settings" message rather than
          trying to drive a setup flow that wouldn't work on iOS. */}
      <AiAssistant
        lesson={active && lesson ? lesson : null}
        course={active?.course ?? null}
      />

      {signInOpen && (
        <SignInDialog
          cloud={cloud}
          onClose={() => setSignInOpen(false)}
        />
      )}

      <MobileSearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        courses={courses}
        onOpenLesson={openLesson}
      />
    </div>
  );
}
