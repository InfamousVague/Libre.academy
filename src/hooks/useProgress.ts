import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface Completion {
  course_id: string;
  lesson_id: string;
  /// Unix timestamp (seconds) when the learner completed the lesson.
  completed_at: number;
}

/// Syncs the "completed lessons" Set to a SQLite table in the app data dir
/// via Tauri commands. The Set is the source of truth while the app is open;
/// on first mount we rehydrate from the DB, and markCompleted writes through.
/// `history` gives the same data as a timestamped array, for streak / XP math.
///
/// Falls back gracefully when not running under Tauri (e.g. vitest / running
/// `vite` standalone) so tests can mount components that use this hook.
export function useProgress() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Completion[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await invoke<Completion[]>("list_completions");
        if (cancelled) return;
        const s = new Set<string>();
        for (const r of rows) s.add(`${r.course_id}:${r.lesson_id}`);
        setCompleted(s);
        setHistory(rows);
      } catch {
        // Not in Tauri or DB unavailable — stay with the empty set.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function markCompleted(courseId: string, lessonId: string) {
    const key = `${courseId}:${lessonId}`;
    setCompleted((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    // Also append to the local history so streak/XP react instantly without
    // waiting for a re-fetch. Uses client-side now() which may drift from
    // the DB's server-side now() by a second; harmless for stats display.
    setHistory((prev) => {
      if (prev.some((r) => r.course_id === courseId && r.lesson_id === lessonId)) return prev;
      return [
        ...prev,
        {
          course_id: courseId,
          lesson_id: lessonId,
          completed_at: Math.floor(Date.now() / 1000),
        },
      ];
    });
    // Fire-and-forget persistence; the optimistic UI update above already
    // reflects the new state, and the DB is best-effort.
    invoke("mark_completion", { courseId, lessonId }).catch(() => {});
  }

  return { completed, history, markCompleted, loaded };
}
