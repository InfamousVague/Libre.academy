import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Completion {
  course_id: string;
  lesson_id: string;
  completed_at: number;
}

/// Syncs the "completed lessons" Set to a SQLite table in the app data dir
/// via Tauri commands. The Set is the source of truth while the app is open;
/// on first mount we rehydrate from the DB, and markCompleted writes through.
///
/// Falls back gracefully when not running under Tauri (e.g. vitest / running
/// `vite` standalone) so tests can mount components that use this hook.
export function useProgress() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
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
    // Fire-and-forget persistence; the optimistic UI update above already
    // reflects the new state, and the DB is best-effort.
    invoke("mark_completion", { courseId, lessonId }).catch(() => {});
  }

  return { completed, markCompleted, loaded };
}
