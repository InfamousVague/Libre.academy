/// `libre.runTests` — assemble the user's current solution against
/// the lesson's hidden tests, run them, render the result.
///
/// Flow:
///   1. Save all dirty editors so the runner reads the latest user
///      code (a stale on-disk file is the most common "but it works
///      in my editor!" failure mode).
///   2. Look up the runner for the current lesson's language.
///   3. Run, capture output, append to the Libre output channel.
///   4. Pop a status toast (pass / fail / error) so the result is
///      visible without the user needing to manually open the
///      output panel — but the panel is always available for the
///      full transcript.
///   5. On pass: mark the lesson complete, refresh the outline view.
import * as path from "node:path";
import * as vscode from "vscode";
import { markComplete } from "../data/progressStore";
import { isExerciseLike } from "../data/types";
import { entryFilePath, lessonInternalDir } from "../exercise/workbench";
import { runnerFor } from "../exercise/runners/registry";
import { getCurrentLessonContext } from "../views/lessonPanel";
import { refreshOutline } from "../views/outline";

let outputChannel: vscode.OutputChannel | null = null;

function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Libre");
  }
  return outputChannel;
}

export async function runTests(): Promise<void> {
  const ctx = getCurrentLessonContext();
  if (!ctx) {
    void vscode.window.showInformationMessage(
      "Libre: open a lesson first (Command Palette → Libre: Open Lesson…)",
    );
    return;
  }
  const { course, lesson } = ctx;
  if (!isExerciseLike(lesson)) {
    void vscode.window.showInformationMessage(
      "Libre: this lesson isn't an exercise — there's nothing to run.",
    );
    return;
  }
  const runner = runnerFor(lesson.language);
  if (!runner) {
    void vscode.window.showWarningMessage(
      `Libre: the VSCode extension can't run ${lesson.language} lessons yet — try the desktop app for this one.`,
    );
    return;
  }

  /// Save dirty editors. We only save the user's solution file (not
  /// every dirty document in the workspace) so we don't accidentally
  /// touch unrelated open tabs.
  const userFilePath = entryFilePath(course.id, lesson.id, lesson.language);
  const editor = vscode.window.visibleTextEditors.find(
    (e) => e.document.uri.fsPath === userFilePath,
  );
  if (editor?.document.isDirty) {
    await editor.document.save();
  }

  const channel = getOutputChannel();
  channel.appendLine("");
  channel.appendLine(`▶ ${course.title} — ${lesson.title}`);
  channel.appendLine("─".repeat(40));

  /// Status bar feedback while the runner is in flight. cargo's
  /// first-time compile can take 30s+; without this the user has no
  /// signal anything is happening.
  const result = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Libre: running ${runner.displayName}…`,
      cancellable: false,
    },
    async () =>
      runner.run({
        course,
        lesson,
        userFilePath,
        workspaceDir: path.dirname(userFilePath),
        scratchDir: lessonInternalDir(course.id, lesson.id),
      }),
  );

  channel.appendLine(result.output);
  channel.appendLine("");
  channel.appendLine(`Result: ${result.status.toUpperCase()}`);
  if (result.exitCode !== null && result.exitCode !== undefined) {
    channel.appendLine(`Exit code: ${result.exitCode}`);
  }

  if (result.status === "pass") {
    markComplete(course.id, lesson.id);
    refreshOutline();
    /// Show in the foreground so the user sees the green checkmark
    /// even when the output channel is collapsed. Other statuses
    /// also need the output channel so we surface it for them.
    void vscode.window.showInformationMessage(
      `✓ ${lesson.title} — ${result.summary ?? "complete"}`,
      "Next lesson",
    ).then((picked) => {
      if (picked === "Next lesson") {
        void vscode.commands.executeCommand("libre.nextLesson");
      }
    });
  } else {
    channel.show(true);
    if (result.status === "fail") {
      void vscode.window.showWarningMessage(
        `Libre: ${result.summary ?? "tests failed"}`,
      );
    } else {
      void vscode.window.showErrorMessage(
        `Libre: ${result.summary ?? "runner error"}`,
      );
    }
  }
}
