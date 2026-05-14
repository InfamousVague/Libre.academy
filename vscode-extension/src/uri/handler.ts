/// Handles `vscode://libre-academy.libre/open?course=<id>&lesson=<id>`
/// URIs invoked by the desktop app's "Open in VSCode" button (and by
/// any other deeplink consumer — e.g. a Markdown link in docs that
/// drops the learner into a specific lesson).
///
/// The URI format is intentionally minimal: just two query parameters.
/// If `lesson` is omitted we open the first lesson of the course; if
/// `course` is missing too we fall back to a quick-pick of installed
/// courses so the deeplink can never be a dead end.
///
/// Activation: the extension manifest declares `onUri` as an activation
/// event. VSCode wakes the extension, then routes any incoming URI
/// through `registerUriHandler`'s callback below.
import * as vscode from "vscode";
import { clearCourseCache, findLesson, loadCourse, listCourseIds } from "../data/courseStore";
import { openLesson } from "../views/lessonPanel";

export function registerUriHandler(context: vscode.ExtensionContext): void {
  const handler = vscode.window.registerUriHandler({
    handleUri: async (uri) => {
      await routeUri(uri);
    },
  });
  context.subscriptions.push(handler);
}

/// Public entry point for both the URI handler and the
/// `libre.openLesson` command palette flow (which builds a synthetic
/// `vscode-libre:` URI from the user's quick-pick selection).
export async function routeUri(uri: vscode.Uri): Promise<void> {
  /// `vscode://<publisher>.<name>/<path>?<query>` — VSCode strips the
  /// scheme + publisher/extension prefix before handing us the URI, so
  /// we read just the path + query here.
  const params = parseQuery(uri.query);
  let courseId = params.get("course");
  const lessonId = params.get("lesson");

  /// Drop any cached parse so a freshly-installed course (or a course
  /// updated by the desktop app between launches) loads fresh. The
  /// cost of one re-parse on URI open is negligible vs. the
  /// confusion of a stale outline.
  clearCourseCache();

  if (!courseId) {
    const picked = await pickInstalledCourse();
    if (!picked) return;
    courseId = picked;
  }

  const course = await loadCourse(courseId);
  if (!course) {
    void vscode.window.showErrorMessage(
      `Libre: course "${courseId}" isn't installed. Open the desktop app to install it, then try again.`,
    );
    return;
  }

  /// Resolve the target lesson. If the URI didn't carry a lesson id,
  /// or it pointed to a lesson that no longer exists (course got
  /// re-versioned), drop to the first lesson of the first chapter so
  /// the deeplink still lands on something readable.
  let target = lessonId ? findLesson(course, lessonId) : null;
  if (!target) {
    const firstChapter = course.chapters[0];
    const firstLesson = firstChapter?.lessons[0];
    if (!firstLesson) {
      void vscode.window.showErrorMessage(
        `Libre: course "${course.title}" has no lessons yet.`,
      );
      return;
    }
    target = { chapterIdx: 0, lessonIdx: 0, lesson: firstLesson };
  }

  await openLesson(course, target.lesson);
}

/// Show a quick-pick of installed courses so the user can hand-pick
/// one when the URI didn't specify (or when called from the
/// `libre.openLesson` command without context).
async function pickInstalledCourse(): Promise<string | undefined> {
  const ids = await listCourseIds();
  if (ids.length === 0) {
    void vscode.window.showInformationMessage(
      "Libre: no courses installed yet. Open the Libre desktop app to install courses, then come back here.",
    );
    return undefined;
  }
  /// We could lazily load each course.json to show titles here, but
  /// the cost is acceptable for a one-shot picker and the title is
  /// substantially friendlier than the kebab-case id.
  const items = await Promise.all(
    ids.map(async (id) => {
      const course = await loadCourse(id);
      return {
        label: course?.title ?? id,
        description: id,
        courseId: id,
      };
    }),
  );
  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: "Pick a Libre course to open…",
    matchOnDescription: true,
  });
  return picked?.courseId;
}

/// Hand-roll the query parser — `URLSearchParams` works fine in the
/// extension host but only after a `new URL(uri.toString())` round-
/// trip, which can throw on opaque URIs. The hand-rolled version is
/// shorter and never throws on malformed input.
function parseQuery(query: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!query) return out;
  for (const pair of query.split("&")) {
    const eq = pair.indexOf("=");
    if (eq === -1) {
      out.set(decodeURIComponent(pair), "");
    } else {
      out.set(
        decodeURIComponent(pair.slice(0, eq)),
        decodeURIComponent(pair.slice(eq + 1)),
      );
    }
  }
  return out;
}
