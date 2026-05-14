/// Course outline tree view, shown in the Libre activity bar
/// container. Renders the CURRENT course's chapters → lessons with
/// completion check marks pulled from the shared progress.sqlite.
///
/// We deliberately don't list ALL installed courses here — that's
/// the desktop app's job. The extension's outline is always
/// scoped to whichever course the user opened via the URI handler
/// / command palette / quick-pick. This keeps the sidebar tightly
/// useful and avoids duplicating the desktop's library view.
import * as vscode from "vscode";
import { completedLessonIdsForCourse } from "../data/progressStore";
import { isExerciseLike } from "../data/types";
import type { Chapter, Course, Lesson } from "../data/types";
import { getCurrentLessonContext } from "./lessonPanel";

class OutlineProvider implements vscode.TreeDataProvider<OutlineNode> {
  private _onDidChange = new vscode.EventEmitter<OutlineNode | undefined>();
  /// VSCode listens on this event to know when to re-query the
  /// tree. We fire it on `refresh()` — typically after a
  /// completion lands or the user switches courses.
  readonly onDidChangeTreeData = this._onDidChange.event;

  refresh(): void {
    this._onDidChange.fire(undefined);
  }

  getTreeItem(node: OutlineNode): vscode.TreeItem {
    return node.toTreeItem();
  }

  getChildren(node?: OutlineNode): OutlineNode[] {
    const ctx = getCurrentLessonContext();
    if (!ctx) {
      /// No current course — render a single info row prompting
      /// the user to open one. Tree views can't directly host
      /// text/buttons in the empty state, so we use a single
      /// labelled node that runs the open command when clicked.
      return [OutlineNode.empty()];
    }
    if (!node) {
      /// Root: list chapters under the current course. The course
      /// itself isn't a node — it's the view title (set
      /// elsewhere).
      const completed = completedLessonIdsForCourse(ctx.course.id);
      return ctx.course.chapters.map(
        (ch, idx) => OutlineNode.chapter(ctx.course, ch, idx, completed),
      );
    }
    return node.children();
  }
}

/// Wraps a chapter or lesson in a TreeItem. Two-kind union encoded
/// as a single class because the shape's tiny — splitting into two
/// classes per kind would be more cermony than it's worth.
class OutlineNode {
  private constructor(
    private kind: "empty" | "chapter" | "lesson",
    private label: string,
    private opts: {
      course?: Course;
      chapter?: Chapter;
      chapterIdx?: number;
      lesson?: Lesson;
      completed?: Set<string>;
      isComplete?: boolean;
    } = {},
  ) {}

  static empty(): OutlineNode {
    return new OutlineNode(
      "empty",
      "Open a lesson to see the outline…",
    );
  }

  static chapter(
    course: Course,
    chapter: Chapter,
    idx: number,
    completed: Set<string>,
  ): OutlineNode {
    return new OutlineNode("chapter", chapter.title, {
      course,
      chapter,
      chapterIdx: idx,
      completed,
    });
  }

  static lesson(
    course: Course,
    lesson: Lesson,
    isComplete: boolean,
  ): OutlineNode {
    return new OutlineNode("lesson", lesson.title, {
      course,
      lesson,
      isComplete,
    });
  }

  children(): OutlineNode[] {
    if (this.kind === "chapter" && this.opts.chapter && this.opts.course) {
      const completed = this.opts.completed ?? new Set();
      return this.opts.chapter.lessons.map((l) =>
        OutlineNode.lesson(this.opts.course!, l, completed.has(l.id)),
      );
    }
    return [];
  }

  toTreeItem(): vscode.TreeItem {
    if (this.kind === "empty") {
      const item = new vscode.TreeItem(
        this.label,
        vscode.TreeItemCollapsibleState.None,
      );
      item.command = {
        command: "libre.openLesson",
        title: "Open a Libre lesson",
      };
      item.iconPath = new vscode.ThemeIcon("book");
      return item;
    }
    if (this.kind === "chapter") {
      const item = new vscode.TreeItem(
        this.label,
        vscode.TreeItemCollapsibleState.Expanded,
      );
      const completed = this.opts.completed ?? new Set();
      const lessons = this.opts.chapter?.lessons ?? [];
      const done = lessons.filter((l) => completed.has(l.id)).length;
      item.description = `${done} / ${lessons.length}`;
      item.iconPath = new vscode.ThemeIcon(
        done === lessons.length && lessons.length > 0
          ? "check-all"
          : "folder",
      );
      return item;
    }
    /// Lesson
    const item = new vscode.TreeItem(
      this.label,
      vscode.TreeItemCollapsibleState.None,
    );
    const lesson = this.opts.lesson!;
    item.description = lesson.kind === "reading"
      ? "Reading"
      : lesson.kind === "quiz"
        ? "Quiz"
        : isExerciseLike(lesson)
          ? "Exercise"
          : "";
    item.iconPath = new vscode.ThemeIcon(
      this.opts.isComplete ? "pass-filled" : iconForKind(lesson.kind),
    );
    item.command = {
      command: "libre.openLessonById",
      title: "Open lesson",
      arguments: [this.opts.course!.id, lesson.id],
    };
    return item;
  }
}

function iconForKind(kind: Lesson["kind"]): string {
  switch (kind) {
    case "reading":
      return "book";
    case "exercise":
    case "mixed":
      return "beaker";
    case "quiz":
      return "question";
    default:
      return "circle-outline";
  }
}

let provider: OutlineProvider | null = null;

export function registerOutline(context: vscode.ExtensionContext): void {
  provider = new OutlineProvider();
  const view = vscode.window.createTreeView("libre.outline", {
    treeDataProvider: provider,
    showCollapseAll: true,
  });
  context.subscriptions.push(view);
  /// Internal command behind the lesson rows — keeps the
  /// command-palette command (`libre.openLesson`) focused on the
  /// no-args quick-pick flow.
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "libre.openLessonById",
      async (courseId: string, lessonId: string) => {
        const { loadCourse, findLesson } = await import("../data/courseStore");
        const course = await loadCourse(courseId);
        if (!course) return;
        const found = findLesson(course, lessonId);
        if (!found) return;
        const { openLesson } = await import("./lessonPanel");
        await openLesson(course, found.lesson);
      },
    ),
  );
}

/// Tell the outline view to re-query its data. Cheap — VSCode will
/// only re-render the visible rows.
export function refreshOutline(): void {
  provider?.refresh();
}
