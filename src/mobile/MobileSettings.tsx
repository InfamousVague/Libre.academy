/// Mobile settings — minimal. The desktop SettingsDialog has four
/// rails (AI & API, Theme, Data, Account). On mobile we drop AI & API
/// (no API-key entry workflow on phones, the hidden-tests pipeline
/// is a desktop affordance) and tighten the rest into one stack.
///
/// Sections:
///   - Account     — sign-in CTA when signed out, profile + sign-out when signed in
///   - About       — version, link to libre.academy
///   - Reset       — wipe local progress (with click-to-confirm)
///
/// Triggered from the bottom-tab bar's "Settings" button.

import { useState } from "react";
import type { UseLibreCloud } from "../hooks/useLibreCloud";
import type { RealtimeSyncHandle } from "../hooks/useRealtimeSync";
import type { Completion } from "../hooks/useProgress";
import type { Course } from "../data/types";
import SyncDebugPanel from "../components/dialogs/SettingsDialog/SyncDebugPanel";
import { applyTheme, loadTheme, THEMES, type ThemeName } from "../theme/themes";
import LanguageDropdown from "../components/LanguageDropdown/LanguageDropdown";
import "./MobileSettings.css";

interface Props {
  cloud: UseLibreCloud;
  /// Realtime sync hook handle. Drives the Sync diagnostics card —
  /// status badge, pending push counter, manual pull/push buttons,
  /// diff view. Optional for embeddings that don't run sync.
  realtime?: RealtimeSyncHandle;
  /// Local completion history. Source of truth for the "On this
  /// device" column of the sync diff.
  history?: readonly Completion[];
  /// Live course list — used to format diff entries with
  /// "Course Title · Lesson Title" instead of raw IDs.
  courses?: readonly Course[];
  onRequestSignIn: () => void;
  onResetProgress: () => Promise<void> | void;
  appVersion?: string;
}

export default function MobileSettings({
  cloud,
  realtime,
  history,
  courses,
  onRequestSignIn,
  onResetProgress,
  appVersion = "0.1.4",
}: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  // Theme picker state — initialise from the current persisted choice
  // (loadTheme reads localStorage). `applyTheme` writes-through on
  // every selection so the change persists across launches.
  const [theme, setTheme] = useState<ThemeName>(() => loadTheme());

  function handleThemeChange(next: ThemeName) {
    setTheme(next);
    applyTheme(next);
  }

  const signedIn = cloud.signedIn === true;
  const user =
    typeof cloud.user === "object" && cloud.user ? cloud.user : null;

  const onReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setResetting(true);
    try {
      await onResetProgress();
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  };

  return (
    <div className="m-set">
      <header className="m-set__head">
        <h1 className="m-set__title">Settings</h1>
      </header>

      <section className="m-set__section">
        <h3 className="m-set__section-title">Account</h3>
        {signedIn && user ? (
          <>
            <div className="m-set__row m-set__row--passive">
              <div className="m-set__row-text">
                <span className="m-set__row-title">{user.display_name}</span>
                <span className="m-set__row-meta">{user.email}</span>
              </div>
            </div>
            <button
              type="button"
              className="m-set__row m-set__row--button m-set__row--danger"
              onClick={async () => {
                setSigningOut(true);
                try {
                  await cloud.signOut();
                } finally {
                  setSigningOut(false);
                }
              }}
              disabled={signingOut}
            >
              <span className="m-set__row-title">
                {signingOut ? "Signing out…" : "Sign out"}
              </span>
            </button>
          </>
        ) : (
          <>
            <p className="m-set__blurb">
              Sign in to sync progress, streaks, and lesson history between
              devices. Libre runs entirely offline without an account —
              signing in is purely additive.
            </p>
            <button
              type="button"
              className="m-set__row m-set__row--button m-set__row--primary"
              onClick={onRequestSignIn}
            >
              <span className="m-set__row-title">Sign in</span>
            </button>
          </>
        )}
      </section>

      {signedIn && realtime && (
        <section className="m-set__section">
          <SyncDebugPanel
            cloud={cloud}
            realtime={realtime}
            history={history ?? []}
            describeLesson={(courseId, lessonId) => {
              const course = courses?.find((c) => c.id === courseId);
              if (!course) return `${courseId} · ${lessonId}`;
              for (const ch of course.chapters) {
                const lesson = ch.lessons.find((l) => l.id === lessonId);
                if (lesson) return `${course.title} · ${lesson.title}`;
              }
              return `${course.title} · ${lessonId}`;
            }}
          />
        </section>
      )}

      <section className="m-set__section">
        <h3 className="m-set__section-title">Theme</h3>
        <p className="m-set__blurb">
          App + editor colors. Picks land instantly and persist across
          launches; same library as the desktop app.
        </p>
        <ul className="m-set__theme-list" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={
                    "m-set__theme-row" + (active ? " is-active" : "")
                  }
                  onClick={() => handleThemeChange(t.id)}
                >
                  <span
                    className="m-set__theme-swatch"
                    data-theme={t.id}
                    aria-hidden
                  />
                  <span className="m-set__theme-text">
                    <span className="m-set__theme-label">{t.label}</span>
                    <span className="m-set__theme-desc">{t.description}</span>
                  </span>
                  {active && (
                    <span className="m-set__theme-check" aria-hidden>
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="m-set__section">
        <h3 className="m-set__section-title">Language</h3>
        <p className="m-set__blurb">
          Translates Libre-authored courses into your preferred language.
          Third-party books stay in their original language. Choice persists
          across launches and syncs to your other devices when signed in.
        </p>
        <LanguageDropdown variant="field" />
      </section>

      <section className="m-set__section">
        <h3 className="m-set__section-title">About</h3>
        <div className="m-set__row m-set__row--passive">
          <div className="m-set__row-text">
            <span className="m-set__row-title">Libre</span>
            <span className="m-set__row-meta">v{appVersion}</span>
          </div>
        </div>
        <a
          className="m-set__row m-set__row--link"
          href="https://libre.academy"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="m-set__row-title">libre.academy</span>
          <span className="m-set__row-chevron" aria-hidden>
            ↗
          </span>
        </a>
      </section>

      <section className="m-set__section">
        <h3 className="m-set__section-title">Data</h3>
        <p className="m-set__blurb">
          Wipes every "lesson complete" flag on this device. Cloud-synced
          progress on other devices isn't touched.
        </p>
        <button
          type="button"
          className={`m-set__row m-set__row--button${confirmReset ? " m-set__row--danger" : ""}`}
          onClick={onReset}
          disabled={resetting}
        >
          <span className="m-set__row-title">
            {resetting
              ? "Resetting…"
              : confirmReset
                ? "Tap again to confirm"
                : "Reset local progress"}
          </span>
        </button>
      </section>
    </div>
  );
}
