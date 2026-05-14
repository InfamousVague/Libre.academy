/// Libre.academy VSCode extension entry point.
///
/// Activation: declared `onUri` in package.json, so VSCode wakes us up
/// the first time a `vscode://libre-academy.libre/...` URL fires (or
/// when the user invokes a `libre.*` command — `onCommand` activation
/// is implicit when commands are contributed).
///
/// The extension's surface area:
///   - URI handler: vscode://libre-academy.libre/open?course=X&lesson=Y
///   - Outline tree view in the Libre activity-bar container
///   - Lesson webview (markdown body + objectives + hints)
///   - Native editor for exercise files
///   - Commands: openLesson, runTests, markComplete, nextLesson,
///     revealSolution, showHint, refreshOutline
///   - Shared progress with the desktop app via progress.sqlite
import * as vscode from "vscode";
import { closeProgressDb } from "./data/progressStore";
import { gotoNextLesson } from "./commands/nextLesson";
import { markLessonComplete } from "./commands/markComplete";
import { runTests } from "./commands/runTests";
import { refreshOutline, registerOutline } from "./views/outline";
import { registerUriHandler, routeUri } from "./uri/handler";
import { clearCourseCache } from "./data/courseStore";
import { getCurrentLessonContext } from "./views/lessonPanel";

export function activate(context: vscode.ExtensionContext): void {
  registerUriHandler(context);
  registerOutline(context);
  registerCommands(context);
}

export function deactivate(): void {
  closeProgressDb();
}

function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("libre.openLesson", async () => {
      /// Command-palette entry point: same flow as the URI handler
      /// but with no params, so the quick-pick fires.
      await routeUri(vscode.Uri.parse("vscode://libre-academy.libre/open"));
    }),
    vscode.commands.registerCommand("libre.runTests", runTests),
    vscode.commands.registerCommand("libre.markComplete", markLessonComplete),
    vscode.commands.registerCommand("libre.nextLesson", gotoNextLesson),
    vscode.commands.registerCommand("libre.refreshOutline", () => {
      clearCourseCache();
      refreshOutline();
    }),
    vscode.commands.registerCommand("libre.revealSolution", async () => {
      const ctx = getCurrentLessonContext();
      if (!ctx) return;
      /// Hidden-by-design: surfaces the solution only on explicit
      /// invocation, with a confirmation step so accidental palette
      /// picks don't ruin a learner's progress. Renders the solution
      /// in a side-by-side editor (non-modifiable) so the user can
      /// diff it against their own code.
      const lesson = ctx.lesson;
      if (lesson.kind !== "exercise" && lesson.kind !== "mixed") return;
      const confirm = await vscode.window.showWarningMessage(
        `Reveal the reference solution for "${lesson.title}"? This won't change your progress, but seeing the answer skips part of the practice.`,
        { modal: true },
        "Show solution",
      );
      if (confirm !== "Show solution") return;
      const doc = await vscode.workspace.openTextDocument({
        content: lesson.solution,
        language: lesson.language,
      });
      await vscode.window.showTextDocument(doc, {
        viewColumn: vscode.ViewColumn.Three,
        preview: true,
      });
    }),
    vscode.commands.registerCommand("libre.showHint", async () => {
      const ctx = getCurrentLessonContext();
      if (!ctx) return;
      if (ctx.lesson.kind !== "exercise" && ctx.lesson.kind !== "mixed") return;
      const hints = ctx.lesson.hints ?? [];
      if (hints.length === 0) {
        void vscode.window.showInformationMessage(
          "Libre: this exercise doesn't ship with hints.",
        );
        return;
      }
      /// Just show all of them. Progressive reveal is nicer but
      /// needs panel state we don't keep yet — v2.
      const items: vscode.QuickPickItem[] = hints.map((h, i) => ({
        label: `Hint ${i + 1}`,
        detail: h,
      }));
      await vscode.window.showQuickPick(items, {
        placeHolder: "Pick a hint to read…",
        canPickMany: false,
      });
    }),
  );
}
