/// Renders the current lesson's prose + objectives in a webview side
/// panel. For exercise lessons we ALSO write the starter file to a
/// per-lesson workspace folder and open it in a native editor next to
/// the webview, so the learner reads on the right and codes on the
/// left in the familiar split-pane flow.
///
/// Lifecycle: one webview at a time, addressable via `currentPanel`.
/// Re-calling `openLesson` with a different lesson reuses the existing
/// panel (no flicker, no second tab) — the panel's content is just
/// re-rendered via `panel.webview.html = ...`.
import * as vscode from "vscode";
import MarkdownIt from "markdown-it";
import { setupExerciseWorkspace } from "../exercise/workbench";
import { isLessonComplete } from "../data/progressStore";
import { isExerciseLike } from "../data/types";
import type { Course, Lesson, ExerciseLesson } from "../data/types";

let currentPanel: vscode.WebviewPanel | null = null;
/// Tracks the lesson + course currently rendered. The command handlers
/// (run tests, mark complete, next lesson) read this so they don't
/// need to drag a (course, lesson) tuple through every code path.
let currentCourse: Course | null = null;
let currentLesson: Lesson | null = null;

const md = new MarkdownIt({ html: false, linkify: true, breaks: false });

export interface LessonContext {
  course: Course;
  lesson: Lesson;
}

export function getCurrentLessonContext(): LessonContext | null {
  if (!currentCourse || !currentLesson) return null;
  return { course: currentCourse, lesson: currentLesson };
}

export async function openLesson(course: Course, lesson: Lesson): Promise<void> {
  currentCourse = course;
  currentLesson = lesson;

  /// Update context keys so menus + keybindings can light up on the
  /// right lesson kind. These are read by `when` clauses in
  /// `contributes.menus` / `contributes.keybindings`.
  await vscode.commands.executeCommand(
    "setContext",
    "libre.currentLessonId",
    lesson.id,
  );
  await vscode.commands.executeCommand(
    "setContext",
    "libre.currentLessonIsExercise",
    isExerciseLike(lesson),
  );
  await vscode.commands.executeCommand(
    "setContext",
    "libre.currentLessonIsReading",
    lesson.kind === "reading",
  );

  if (currentPanel) {
    /// Reuse the existing webview so we don't pile up panels every
    /// time the learner clicks Next. Re-rendering is cheap (the
    /// markdown body is the only meaningful payload).
    currentPanel.title = lesson.title;
    currentPanel.webview.html = renderLessonHtml(course, lesson);
    currentPanel.reveal(vscode.ViewColumn.Two, true);
  } else {
    currentPanel = vscode.window.createWebviewPanel(
      "libre.lesson",
      lesson.title,
      { viewColumn: vscode.ViewColumn.Two, preserveFocus: true },
      {
        enableScripts: false,
        /// Retain the webview's state when it's not visible so the
        /// scroll position is preserved if the user toggles to a
        /// different tab and back. The page is static markdown so
        /// there's no JS state to worry about either way.
        retainContextWhenHidden: true,
      },
    );
    currentPanel.webview.html = renderLessonHtml(course, lesson);
    currentPanel.onDidDispose(() => {
      currentPanel = null;
      currentCourse = null;
      currentLesson = null;
    });
  }

  /// For exercise/mixed lessons, prepare the workbench (starter file
  /// on disk) and open it in a native editor next to the webview.
  /// Reading lessons skip this entirely — just the webview is enough.
  if (isExerciseLike(lesson)) {
    try {
      await setupExerciseWorkspace(course, lesson as ExerciseLesson);
    } catch (err) {
      void vscode.window.showWarningMessage(
        `Libre: couldn't open the exercise workspace — ${(err as Error).message ?? String(err)}`,
      );
    }
  }
}

/// Build the webview HTML. Inline CSS keeps the bundle small and the
/// rendering deterministic — no flash-of-unstyled-content while a
/// separate CSS file loads.
function renderLessonHtml(course: Course, lesson: Lesson): string {
  const bodyHtml = md.render(lesson.body ?? "");
  const objectivesHtml = renderObjectives(lesson.objectives);
  const hintsHtml = renderHints(lesson);
  const complete = isLessonComplete(course.id, lesson.id);
  const kindBadge = renderKindBadge(lesson, complete);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(lesson.title)}</title>
<style>${LESSON_CSS}</style>
</head>
<body>
  <header class="libre-lesson-header">
    <div class="libre-lesson-breadcrumbs">
      <span class="libre-lesson-course">${escapeHtml(course.title)}</span>
    </div>
    <h1 class="libre-lesson-title">${escapeHtml(lesson.title)}</h1>
    ${kindBadge}
  </header>
  ${objectivesHtml}
  <article class="libre-lesson-body">${bodyHtml}</article>
  ${hintsHtml}
</body>
</html>`;
}

function renderObjectives(objectives?: string[]): string {
  if (!objectives || objectives.length === 0) return "";
  const items = objectives.map((o) => `<li>${escapeHtml(o)}</li>`).join("");
  return `<section class="libre-lesson-objectives">
    <h2>You'll learn</h2>
    <ul>${items}</ul>
  </section>`;
}

function renderHints(lesson: Lesson): string {
  if (!isExerciseLike(lesson)) return "";
  const ex = lesson as ExerciseLesson;
  if (!ex.hints || ex.hints.length === 0) return "";
  /// v1: render hints as a `<details>` accordion. v2 plan is a
  /// progressive reveal (click 1 = hint 0, click 2 = hints 0+1) like
  /// the desktop app does — that needs scripting in the webview which
  /// we'd rather avoid until there's demand.
  const items = ex.hints
    .map(
      (h, i) =>
        `<details class="libre-hint"><summary>Hint ${i + 1}</summary>${md.render(
          h,
        )}</details>`,
    )
    .join("");
  return `<section class="libre-lesson-hints">
    <h2>Hints</h2>
    ${items}
  </section>`;
}

function renderKindBadge(lesson: Lesson, complete: boolean): string {
  const label =
    lesson.kind === "reading"
      ? "Reading"
      : lesson.kind === "quiz"
        ? "Quiz"
        : "Exercise";
  const status = complete ? `<span class="libre-lesson-status">✓ Complete</span>` : "";
  return `<div class="libre-lesson-meta">
    <span class="libre-lesson-kind libre-lesson-kind--${lesson.kind}">${label}</span>
    ${status}
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
}

/// Inlined webview stylesheet. Uses VSCode's CSS theme variables (the
/// `--vscode-*` family) so the lesson reads as a native VSCode panel
/// — matches the user's chosen colour theme without us shipping a
/// palette.
const LESSON_CSS = `
:root {
  color-scheme: var(--vscode-color-scheme, light dark);
}
body {
  font-family: var(--vscode-editor-font-family, system-ui, -apple-system, sans-serif);
  font-size: var(--vscode-editor-font-size, 14px);
  line-height: 1.6;
  color: var(--vscode-editor-foreground);
  background: var(--vscode-editor-background);
  padding: 24px 32px 64px;
  max-width: 760px;
  margin: 0 auto;
}
.libre-lesson-header {
  border-bottom: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.2));
  padding-bottom: 16px;
  margin-bottom: 20px;
}
.libre-lesson-breadcrumbs {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--vscode-descriptionForeground, rgba(128, 128, 128, 0.8));
  text-transform: uppercase;
}
.libre-lesson-title {
  font-size: 28px;
  font-weight: 700;
  margin: 6px 0 12px;
  letter-spacing: -0.015em;
}
.libre-lesson-meta {
  display: flex;
  gap: 10px;
  align-items: center;
}
.libre-lesson-kind {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: var(--vscode-badge-background, rgba(128, 128, 128, 0.18));
  color: var(--vscode-badge-foreground, inherit);
}
.libre-lesson-status {
  font-size: 12px;
  color: var(--vscode-testing-iconPassed, #4caf50);
  font-weight: 600;
}
.libre-lesson-objectives {
  border-left: 3px solid var(--vscode-textLink-foreground, #4ea0e8);
  padding: 8px 16px;
  margin: 0 0 20px;
  background: var(--vscode-textBlockQuote-background, rgba(128, 128, 128, 0.08));
  border-radius: 0 6px 6px 0;
}
.libre-lesson-objectives h2 {
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin: 0 0 6px;
  color: var(--vscode-descriptionForeground);
}
.libre-lesson-objectives ul {
  margin: 0;
  padding-left: 20px;
}
.libre-lesson-body h1,
.libre-lesson-body h2,
.libre-lesson-body h3,
.libre-lesson-body h4 {
  font-weight: 700;
  margin: 24px 0 12px;
  line-height: 1.25;
}
.libre-lesson-body h1 { font-size: 22px; }
.libre-lesson-body h2 { font-size: 18px; }
.libre-lesson-body h3 { font-size: 16px; }
.libre-lesson-body p {
  margin: 12px 0;
}
.libre-lesson-body code {
  background: var(--vscode-textCodeBlock-background, rgba(128, 128, 128, 0.12));
  padding: 1px 6px;
  border-radius: 4px;
  font-family: var(--vscode-editor-font-family, ui-monospace, monospace);
  font-size: 0.92em;
}
.libre-lesson-body pre {
  background: var(--vscode-textCodeBlock-background, rgba(128, 128, 128, 0.12));
  padding: 12px 14px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 14px 0;
}
.libre-lesson-body pre code {
  background: transparent;
  padding: 0;
  border-radius: 0;
}
.libre-lesson-body table {
  border-collapse: collapse;
  margin: 14px 0;
  width: 100%;
  font-size: 0.93em;
}
.libre-lesson-body th,
.libre-lesson-body td {
  border: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.2));
  padding: 6px 10px;
  text-align: left;
}
.libre-lesson-body th {
  background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.08));
  font-weight: 600;
}
.libre-lesson-body blockquote {
  border-left: 3px solid var(--vscode-textBlockQuote-border, rgba(128, 128, 128, 0.4));
  margin: 14px 0;
  padding: 4px 16px;
  color: var(--vscode-descriptionForeground);
}
.libre-lesson-hints {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.2));
}
.libre-lesson-hints h2 {
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vscode-descriptionForeground);
  margin: 0 0 12px;
}
.libre-hint {
  background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.06));
  border: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.2));
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 6px;
}
.libre-hint summary {
  cursor: pointer;
  font-weight: 600;
}
`;
