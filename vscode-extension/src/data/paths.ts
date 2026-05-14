/// Resolves the platform-specific Libre data directories. Mirrors the
/// Tauri desktop app's logic in `src-tauri/src/courses.rs` so the
/// extension reads from the same `~/Library/Application Support/...`
/// (macOS) / `%APPDATA%/...` (Windows) / `~/.local/share/...` (Linux)
/// folder the desktop app writes to — that's the whole point of the
/// shared-progress contract.
///
/// All three paths are user-overridable via the `libre.coursesDir` and
/// `libre.progressDb` settings keys for power users with non-standard
/// installs (CI runners, sandboxed VMs, etc.).
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";

/// Bundle identifier matches `src-tauri/tauri.conf.json`'s
/// `identifier` field. The Rust app derives its data dir from this
/// string via `dirs::data_dir().join(identifier)`; we hard-code the
/// same value here so the two binaries land in the same folder.
const APP_ID = "com.mattssoftware.libre";

/// Root data dir for the desktop app on this OS.
export function libreDataDir(): string {
  const platform = process.platform;
  if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", APP_ID);
  }
  if (platform === "win32") {
    /// %APPDATA% (roaming) is where dirs::data_dir() lands on Windows.
    const appData = process.env.APPDATA;
    if (appData) return path.join(appData, APP_ID);
    return path.join(os.homedir(), "AppData", "Roaming", APP_ID);
  }
  /// Linux + everything else: XDG data dir, falling back to ~/.local/share.
  const xdg = process.env.XDG_DATA_HOME;
  const root = xdg && xdg.length > 0
    ? xdg
    : path.join(os.homedir(), ".local", "share");
  return path.join(root, APP_ID);
}

/// Where individual course folders live. Each course is a subdir
/// `<coursesDir>/<courseId>/course.json` (+ optional `cover.jpg`).
export function coursesDir(): string {
  const override = vscode.workspace
    .getConfiguration("libre")
    .get<string>("coursesDir");
  if (override && override.trim().length > 0) {
    return override;
  }
  return path.join(libreDataDir(), "courses");
}

/// Shared progress SQLite — same file the desktop app's `progress_db`
/// module opens.
export function progressDbPath(): string {
  const override = vscode.workspace
    .getConfiguration("libre")
    .get<string>("progressDb");
  if (override && override.trim().length > 0) {
    return override;
  }
  return path.join(libreDataDir(), "progress.sqlite");
}

/// Where the extension writes its per-lesson workspace files (user's
/// in-progress code, separate from the canonical starter inside
/// course.json). Lives under the libre data dir so it sits next to
/// courses + progress and is easy to back up / nuke as one tree.
///
///   <libreDataDir>/vscode-workspaces/<courseId>/<lessonId>/<file>
///
/// Per-lesson folders so multiple lessons in flight don't trample each
/// other's files; we never collapse to a single working file.
export function lessonWorkspaceDir(courseId: string, lessonId: string): string {
  return path.join(
    libreDataDir(),
    "vscode-workspaces",
    sanitiseSegment(courseId),
    sanitiseSegment(lessonId),
  );
}

/// Defensively strip path separators / `..` from id segments before
/// joining them into a filesystem path. Course IDs from `course.json`
/// are kebab-case ASCII in every shipped course we've seen, but we
/// don't want a maliciously-crafted id like `../../etc/passwd` to
/// escape the workspaces root.
function sanitiseSegment(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 128);
}
