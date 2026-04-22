import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type {
  WorkbenchFile,
  Lesson,
  ExerciseLesson,
  MixedLesson,
} from "../data/types";
import { deriveStarterFiles } from "../lib/workbenchFiles";

/// Per-lesson workbench persistence. Keeps the learner's in-progress code
/// in localStorage keyed on `{courseId, lessonId}` so reopening an exercise
/// restores exactly what they typed, not the starter. Reset returns to
/// starter AND clears the save so the next visit also starts clean.
///
/// The hook stores a "signature" of the starter alongside the files — when
/// a lesson is regenerated (same id, different file shape), the signatures
/// differ and we fall back to the new starter rather than rendering stale
/// content into mismatched filenames.

const STORAGE_PREFIX = "kata:workbench:v1:";

function storageKey(courseId: string, lessonId: string): string {
  return `${STORAGE_PREFIX}${courseId}:${lessonId}`;
}

/// Signature = sorted filenames joined. Content-agnostic on purpose: if the
/// lesson author tweaks a comment in the starter we still want to restore
/// the learner's edits. It's only the *shape* (file set) that invalidates.
function signatureOf(files: WorkbenchFile[]): string {
  return files
    .map((f) => f.name)
    .sort()
    .join("|");
}

interface PersistedWorkbench {
  signature: string;
  files: WorkbenchFile[];
  savedAt: number;
}

export interface UseWorkbenchFilesResult {
  files: WorkbenchFile[];
  setFiles: React.Dispatch<React.SetStateAction<WorkbenchFile[]>>;
  /// Reverts to the lesson's starter files AND clears the saved copy.
  resetToStarter: () => void;
}

export function useWorkbenchFiles(
  courseId: string,
  lesson: Lesson,
  hasExercise: boolean,
): UseWorkbenchFilesResult {
  // Recompute the starter whenever the lesson changes. Including only
  // `lesson.id` (rather than the full lesson object) keeps the memo stable
  // during edits that don't change the lesson shape. `hasExercise` has
  // already been checked upstream in LessonView — we cast the lesson to
  // the exercise union here so `deriveStarterFiles` accepts it.
  const starter = useMemo(
    () =>
      hasExercise
        ? deriveStarterFiles(lesson as ExerciseLesson | MixedLesson)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lesson.id, hasExercise],
  );

  // Synchronous read in the initializer so the first render already has the
  // restored content — avoids a flash of starter text on reopen.
  const [files, setFiles] = useState<WorkbenchFile[]>(() => {
    if (!hasExercise) return [];
    if (typeof localStorage === "undefined") return starter;
    try {
      const raw = localStorage.getItem(storageKey(courseId, lesson.id));
      if (!raw) return starter;
      const parsed = JSON.parse(raw) as PersistedWorkbench;
      if (parsed.signature !== signatureOf(starter)) return starter;
      if (!Array.isArray(parsed.files) || parsed.files.length === 0) return starter;
      return parsed.files;
    } catch {
      return starter;
    }
  });

  // When the parent keys this hook on `${courseId}:${lessonId}` (see App.tsx
  // LessonView), each new lesson gets a fresh hook instance so we don't need
  // to re-read storage mid-lifecycle. Still, keep a ref so the debounced
  // save effect always writes the latest files rather than the closure's
  // stale snapshot at the time of the last keystroke.
  const latestFilesRef = useRef(files);
  latestFilesRef.current = files;

  // Debounced write-through. 400ms settles fast typing without feeling laggy
  // when the learner hits Run right after an edit. Tracks the pending
  // timeout so the unmount flush below can cancel-and-write synchronously
  // if the learner navigates away mid-debounce.
  const pendingSaveRef = useRef<number | null>(null);
  const writeNow = useCallback(() => {
    if (!hasExercise) return;
    if (typeof localStorage === "undefined") return;
    try {
      const payload: PersistedWorkbench = {
        signature: signatureOf(starter),
        files: latestFilesRef.current,
        savedAt: Date.now(),
      };
      localStorage.setItem(
        storageKey(courseId, lesson.id),
        JSON.stringify(payload),
      );
    } catch {
      /* QuotaExceeded or private-mode — drop silently; in-memory state
         is still correct for the current session. */
    }
  }, [hasExercise, starter, courseId, lesson.id]);

  useEffect(() => {
    if (!hasExercise) return;
    if (typeof localStorage === "undefined") return;
    pendingSaveRef.current = window.setTimeout(() => {
      writeNow();
      pendingSaveRef.current = null;
    }, 400);
    return () => {
      if (pendingSaveRef.current !== null) {
        window.clearTimeout(pendingSaveRef.current);
        pendingSaveRef.current = null;
      }
    };
  }, [files, hasExercise, writeNow]);

  // Unmount flush — if the learner switches lessons (or closes the window)
  // mid-debounce, the cleanup above cancels the pending save. Without this,
  // the last burst of keystrokes would never hit disk. The separate
  // unmount-only effect runs AFTER the debounce cleanup so we can tell the
  // difference between "debounced save fired cleanly" (pendingSaveRef ===
  // null) and "cancelled mid-debounce" (ref still set by the unmount
  // observer below). We always flush on unmount to be safe — writing the
  // same bytes twice is a no-op from the learner's POV.
  useEffect(() => {
    return () => {
      writeNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetToStarter = useCallback(() => {
    setFiles(starter);
    try {
      localStorage.removeItem(storageKey(courseId, lesson.id));
    } catch {
      /* ignore — best-effort cleanup */
    }
  }, [starter, courseId, lesson.id]);

  return { files, setFiles, resetToStarter };
}
