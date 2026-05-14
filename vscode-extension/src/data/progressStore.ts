/// Shared progress storage.
///
/// Opens the same `progress.sqlite` the desktop app's Rust
/// `progress_db` module writes — that's the cornerstone of the
/// VSCode/desktop integration: complete a lesson in either client and
/// the other sees the checkmark next time it queries.
///
/// Backing library: `node-sqlite3-wasm`. We deliberately don't use
/// `better-sqlite3` here even though it's faster — its native `.node`
/// binding has to match VSCode's bundled Electron Node ABI, which
/// changes with every VSCode release. WASM SQLite is 10–20× slower in
/// micro-benchmarks but our workload is two queries per user
/// interaction at most, so the perf gap is invisible while the
/// install ergonomics are dramatically better (zero native build).
///
/// Concurrency: SQLite's own file locking serialises writes across
/// processes, so a simultaneous write from VSCode + the desktop app
/// will queue rather than corrupt the file. We open the DB in WAL
/// mode to match the desktop side.
///
/// Schema (mirrors the desktop side):
///   completions (
///     course_id TEXT NOT NULL,
///     lesson_id TEXT NOT NULL,
///     completed_at INTEGER NOT NULL,
///     PRIMARY KEY (course_id, lesson_id)
///   )
///
/// The extension treats the schema as fixed — it only INSERT OR
/// IGNOREs rows here. Migrations are the desktop app's responsibility
/// (it owns the canonical schema definition).
import { Database } from "node-sqlite3-wasm";
import { progressDbPath } from "./paths";

/// Lazy-opened singleton handle. Opening the DB has IO cost so we
/// don't want a fresh handle per query. The handle's `close()` runs
/// from `dispose()` on extension deactivation.
let db: Database | null = null;

function open(): Database {
  if (db) return db;
  const path = progressDbPath();
  /// node-sqlite3-wasm's Database constructor creates the file if it
  /// doesn't exist — matches better-sqlite3's default + the desktop
  /// app's behaviour, so first-launch users (no desktop app yet)
  /// still get a working extension.
  const handle = new Database(path);
  /// WAL = better concurrent reads while another process writes; the
  /// desktop app also uses WAL so this stays consistent.
  handle.exec("PRAGMA journal_mode = WAL");
  /// `synchronous = NORMAL` matches the desktop default — durability
  /// for the next commit is the unit of work we care about, not the
  /// last byte before a power cut.
  handle.exec("PRAGMA synchronous = NORMAL");
  /// Create the table if it doesn't exist. The desktop app creates
  /// this on its own startup too; whichever app launches first wins,
  /// and the schema is identical so neither overrides the other.
  handle.exec(`
    CREATE TABLE IF NOT EXISTS completions (
      course_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      completed_at INTEGER NOT NULL,
      PRIMARY KEY (course_id, lesson_id)
    )
  `);
  db = handle;
  return handle;
}

/// Mark a lesson complete. Idempotent — re-marking an already-complete
/// lesson does nothing (preserves the original `completed_at`
/// timestamp). The desktop app behaves the same way; treating the
/// first completion as the canonical timestamp keeps the certificate
/// "issued" dates stable.
export function markComplete(courseId: string, lessonId: string): void {
  const handle = open();
  /// INSERT OR IGNORE rather than UPSERT: we want to preserve the
  /// earliest completion timestamp the user ever earned, not bump
  /// it forward every time they re-run the tests.
  ///
  /// node-sqlite3-wasm takes positional args as an array (unlike
  /// better-sqlite3's spread API), so we wrap the values in `[…]`.
  const stmt = handle.prepare(
    `INSERT OR IGNORE INTO completions (course_id, lesson_id, completed_at)
     VALUES (?, ?, ?)`,
  );
  stmt.run([courseId, lessonId, Date.now()]);
}

/// Return the set of lesson IDs the user has completed in this course.
/// Used by the outline tree view to render checkmarks. We return a Set
/// so the tree can do O(1) lookups while it walks chapters/lessons.
export function completedLessonIdsForCourse(courseId: string): Set<string> {
  const handle = open();
  const rows = handle
    .prepare(`SELECT lesson_id FROM completions WHERE course_id = ?`)
    .all([courseId]) as Array<{ lesson_id: string }>;
  return new Set(rows.map((r) => r.lesson_id));
}

/// True if a given lesson has been completed before. Hot path for the
/// "show next hint" / "open lesson" flow where we want to render the
/// done-state badge without pulling the full set.
export function isLessonComplete(courseId: string, lessonId: string): boolean {
  const handle = open();
  const row = handle
    .prepare(
      `SELECT COUNT(*) as count FROM completions
       WHERE course_id = ? AND lesson_id = ?`,
    )
    .get([courseId, lessonId]) as { count: number } | undefined | null;
  return (row?.count ?? 0) > 0;
}

/// Close the DB handle. Called on extension deactivate — VSCode is
/// shutting down (or reloading) so we should release the WAL file
/// lock cleanly rather than leaving it for the desktop app to step
/// over on a forced kill.
export function closeProgressDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
