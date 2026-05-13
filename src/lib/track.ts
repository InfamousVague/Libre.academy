/// Typed convenience wrappers around `analytics.trackEvent`.
///
/// Every event in the dashboard maps to one function here. Keeps
/// the call sites tight (`track.lessonRun({...})` vs the longer
/// `void import("./analytics").then(({ trackEvent }) => ...)`
/// pattern) and makes the prop shapes type-checked at the call
/// site instead of stringly-typed inside each handler.
///
/// Build-target gate: every wrapper short-circuits on `!isWeb`
/// before doing anything. Vite inlines `isWeb` at build time so
/// the desktop / iOS bundles fully eliminate the analytics import
/// — confirmed via the existing pattern in App.tsx.
///
/// Adding a new event: add a method here, pick a prop shape that
/// you'll commit to (Plausible's UI breaks down events by prop
/// values, so the keys are part of the schema), and call from
/// every site that should fire it. If two call sites would fire
/// different prop shapes, that's a signal they should be two
/// different events.

import { isWeb } from "./platform";

type Props = Record<string, string | number | boolean>;

/// Internal: the dynamic-import pattern the rest of the app uses.
/// The cancel-on-build-target check happens here so the wrapper
/// methods below can stay one-liners.
function fire(name: string, props?: Props): void {
  if (!isWeb) return;
  void import("./analytics").then(({ trackEvent }) => {
    trackEvent(name, props);
  });
}

export const track = {
  // ── Acquisition ─────────────────────────────────────────────
  /// User clicked a "Download for X" button — either on the
  /// floating install banner, the welcome screen primary CTA,
  /// or anywhere else `DownloadButton` mounts. Props let us
  /// see the OS split without needing per-OS goals.
  installClick(os: "macos" | "windows" | "linux"): void {
    fire("install.click", { os });
  },

  // ── Activation ──────────────────────────────────────────────
  /// User created a new account. `method` distinguishes which
  /// flow (OAuth provider vs email signup); the OAuth case
  /// fires from the deep-link landing handler in App.tsx.
  signup(method: "apple" | "google" | "email"): void {
    fire("signup", { method });
  },
  /// Existing user signed in. Same prop shape as `signup` so
  /// the dashboard can break out flow popularity.
  signin(method: "apple" | "google" | "email"): void {
    fire("signin", { method });
  },
  /// User installed a course from the library / catalog /
  /// import dialog. `source` records WHERE the install
  /// originated so we can compare discoverability paths.
  courseInstall(props: {
    courseId: string;
    source: "library" | "discover" | "import" | "agent";
  }): void {
    fire("course.install", props);
  },

  // ── Engagement ──────────────────────────────────────────────
  /// LessonView mounted with a specific lesson. Paired with
  /// `lesson.complete` for funnel analysis ("what % of lessons
  /// started get finished?"). Fires once per mount, NOT once
  /// per re-render.
  lessonStart(props: {
    courseId: string;
    lessonId: string;
    kind: string;
  }): void {
    fire("lesson.start", props);
  },
  /// User clicked Run. Captures both success and failure paths
  /// so we can compute pass-rate per course / language.
  lessonRun(props: {
    courseId: string;
    lessonId: string;
    language: string;
    passed: boolean;
  }): void {
    fire("lesson.run", props);
  },
  /// AI assistant panel opened (orb clicked or otherwise
  /// programmatically surfaced). `mode` distinguishes chat
  /// from agent without forcing two separate events.
  aiOpen(mode: "chat" | "agent"): void {
    fire("ai.open", { mode });
  },
  /// User submitted a prompt. `context` distinguishes where
  /// the assistant is running (in a lesson, the sandbox, the
  /// tray, or free-form) so we can see which surfaces drive
  /// the most actual usage.
  aiSend(props: {
    mode: "chat" | "agent";
    context: "lesson" | "sandbox" | "tray" | "free";
  }): void {
    fire("ai.send", props);
  },
};
