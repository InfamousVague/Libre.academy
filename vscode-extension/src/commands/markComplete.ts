/// `libre.markComplete` — manual checkmark for reading lessons where
/// there's no tests to run. Wired to a toolbar button when a reading
/// lesson is open (see the `editor/title` contribution in
/// package.json).
import * as vscode from "vscode";
import { markComplete } from "../data/progressStore";
import { getCurrentLessonContext } from "../views/lessonPanel";
import { refreshOutline } from "../views/outline";

export async function markLessonComplete(): Promise<void> {
  const ctx = getCurrentLessonContext();
  if (!ctx) {
    void vscode.window.showInformationMessage(
      "Libre: open a lesson first.",
    );
    return;
  }
  markComplete(ctx.course.id, ctx.lesson.id);
  refreshOutline();
  void vscode.window
    .showInformationMessage(
      `✓ ${ctx.lesson.title} — marked complete.`,
      "Next lesson",
    )
    .then((picked) => {
      if (picked === "Next lesson") {
        void vscode.commands.executeCommand("libre.nextLesson");
      }
    });
}
