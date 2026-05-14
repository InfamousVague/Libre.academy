/// `libre.nextLesson` — advance to the next lesson in the current
/// course's reading order. Crosses chapter boundaries. Shown as a
/// toolbar button alongside Run Tests / Mark Complete; the user can
/// also call it via the keybinding (cmd+shift+→ on macOS).
import * as vscode from "vscode";
import { loadCourse, nextLessonOf } from "../data/courseStore";
import { openLesson } from "../views/lessonPanel";
import { getCurrentLessonContext } from "../views/lessonPanel";

export async function gotoNextLesson(): Promise<void> {
  const ctx = getCurrentLessonContext();
  if (!ctx) {
    void vscode.window.showInformationMessage(
      "Libre: open a lesson first.",
    );
    return;
  }
  /// Reload the course in case its on-disk contents changed since
  /// the panel was last opened (the desktop app may have re-installed
  /// it). The course store caches by id so the reload is cheap when
  /// nothing has changed.
  const course = await loadCourse(ctx.course.id);
  if (!course) return;
  const next = nextLessonOf(course, ctx.lesson.id);
  if (!next) {
    void vscode.window.showInformationMessage(
      `🎉 You've reached the end of ${course.title}.`,
    );
    return;
  }
  await openLesson(course, next.lesson);
}
