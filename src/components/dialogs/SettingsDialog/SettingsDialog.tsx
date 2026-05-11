import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Icon } from "@base/primitives/icon";
import { check as checkIcon } from "@base/primitives/icon/icons/check";
import "@base/primitives/icon/icon.css";
import { applyTheme, loadTheme, type ThemeName } from "../../../theme/themes";
import { resetAccount } from "../../../lib/resetAccount";
import type { UseLibreCloud } from "../../../hooks/useLibreCloud";
import type { RealtimeSyncHandle } from "../../../hooks/useRealtimeSync";
import type { Completion } from "../../../hooks/useProgress";
import type { Course } from "../../../data/types";
import ModalBackdrop from "../../Shared/ModalBackdrop";
import AccountSection from "./AccountSection";
import AiPane from "./AiPane";
import DeveloperPane from "./DeveloperPane";
import DiagnosticsPanel from "./DiagnosticsPanel";
import GeneralPane from "./GeneralPane";
import SoundPane from "./SoundPane";
import SyncDebugPanel from "./SyncDebugPanel";
import ThemePane from "./ThemePane";
import "./SettingsDialog.css";

interface Props {
  onDismiss: () => void;
  /// Cloud-sync hook instance (shared with App.tsx). Used to render
  /// the Account section. Required — SettingsDialog is only ever
  /// rendered inside App where `cloud` is in scope, so we don't
  /// bother making it optional.
  cloud: UseLibreCloud;
  /// Realtime sync hook handle (also from App.tsx). Drives the
  /// Sync section's status badge, pending-push counter, manual
  /// resync button, and diff view.
  realtime?: RealtimeSyncHandle;
  /// Local completion history. Source of truth for the "On this
  /// device" column of the Sync diff. Optional so the dialog still
  /// renders when called from a surface that doesn't have it.
  history?: readonly Completion[];
  /// Live course list — used to format Sync diff entries with
  /// "Course Title · Lesson Title" instead of raw IDs. Optional.
  courses?: readonly Course[];
  /// Open the sign-in modal. Wired from App.tsx so the Account
  /// section can offer a "Sign in" CTA to signed-out users without
  /// each section having to know about the modal-state plumbing.
  ///
  /// Optional: omitted on the web build, where OAuth has no path
  /// (Tauri-only). When undefined we hide the Account section's
  /// sign-in CTA entirely.
  onRequestSignIn?: () => void;
}

interface Settings {
  anthropic_api_key: string | null;
  anthropic_model: string;
  openai_api_key: string | null;
}

type SectionId =
  | "general"
  | "ai"
  | "theme"
  | "sounds"
  | "data"
  | "sync"
  | "diagnostics"
  | "developer"
  | "account";

interface SectionDef {
  id: SectionId;
  label: string;
  hint: string;
}

const BASE_SECTIONS: SectionDef[] = [
  { id: "general", label: "General", hint: "Version + updates" },
  { id: "ai", label: "AI & API", hint: "Anthropic key + model" },
  { id: "theme", label: "Theme", hint: "App + editor colors" },
  { id: "sounds", label: "Sounds", hint: "SFX + achievement cues" },
  { id: "data", label: "Data", hint: "Caches + courses" },
  { id: "sync", label: "Sync", hint: "Cloud diff + force pull/push" },
  { id: "diagnostics", label: "Resources", hint: "What's installed + what's not" },
  { id: "developer", label: "Developer", hint: "Floating console for debugging" },
];

const ACCOUNT_SECTION: SectionDef = {
  id: "account",
  label: "Account",
  hint: "Cloud sync · sign out",
};

/// Two-column settings dialog with a left-rail section nav and a right-side
/// scrollable pane. Keeps the panel at a bounded max-height so additional
/// sections never push the Save button off the screen.
export default function SettingsDialog({
  onDismiss,
  cloud,
  realtime,
  history,
  courses,
  onRequestSignIn,
}: Props) {
  const [section, setSection] = useState<SectionId>("general");
  const [apiKey, setApiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [model, setModel] = useState<string>("claude-sonnet-4-5");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncingCourses, setSyncingCourses] = useState(false);
  /// Last-sync result message. Held for ~4s after a manual sync so the
  /// learner can see the outcome ("1 new course added" / "Already up
  /// to date") before the row reverts to the idle state.
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeName>(() => loadTheme());
  // Account-section state. `confirmDeleteAccount` follows the same
  // two-tap-confirm pattern that the consolidated "Start fresh"
  // affordance uses so the destructive-action UX is consistent
  // across the dialog.
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Account is always in the rail — when signed out the section
  // shows a sign-in CTA so the entry point is discoverable before
  // the learner has an account. The `hint` swaps out depending on
  // sign-in state to give the rail a useful summary either way.
  //
  // Web build: drop the rail entry entirely. There's nothing to do
  // in the Account section without a sign-in path, and showing an
  // empty pane is worse than not advertising it.
  const accountAvailable = !!onRequestSignIn || cloud.signedIn;
  const sections = useMemo<SectionDef[]>(
    () => [
      ...BASE_SECTIONS,
      ...(accountAvailable
        ? [
            cloud.signedIn
              ? ACCOUNT_SECTION
              : { ...ACCOUNT_SECTION, hint: "Sign in to sync progress" },
          ]
        : []),
    ],
    [cloud.signedIn, accountAvailable],
  );

  // If the active section disappears (e.g. user signs out while the
  // dialog is open), fall back to General so we don't render a
  // dangling section pointer with no nav entry.
  useEffect(() => {
    if (!sections.find((s) => s.id === section)) {
      setSection("general");
    }
  }, [sections, section]);

  function handleThemeChange(next: ThemeName) {
    setTheme(next);
    applyTheme(next);
  }

  useEffect(() => {
    invoke<Settings>("load_settings")
      .then((s) => {
        setApiKey(s.anthropic_api_key ?? "");
        setOpenaiKey(s.openai_api_key ?? "");
        if (s.anthropic_model) setModel(s.anthropic_model);
      })
      .catch(() => { /* not in tauri — ignore */ });
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await invoke("save_settings", {
        settings: {
          anthropic_api_key: apiKey.trim() || null,
          anthropic_model: model,
          openai_api_key: openaiKey.trim() || null,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  // `clearAllCourses` + `clearIngestCache` were removed 2026-05-10
  // when the four scattered destructive surfaces (this Data section,
  // the Developer pane's two reset rows) were folded into the single
  // "Start fresh" affordance under Settings → Account. See
  // lib/resetAccount.ts for the consolidated wipe path — it does
  // both `cache_clear` and per-course `delete_course` itself.

  /// Sync newly-bundled course packs into the local install.
  ///
  /// Calls the Rust `refresh_bundled_courses` command which re-runs the
  /// seed routine in force-refresh mode: any NEW pack that landed in
  /// the binary's bundled-packs/ since the last sync gets seeded, and
  /// any EXISTING pack the user still has installed gets re-extracted
  /// so lesson / drill / cover updates land. User-deleted packs stay
  /// deleted (we respect their choice).
  ///
  /// On success we full-reload the window so `useCourses` picks up the
  /// fresh course folders without us having to plumb a refresh callback
  /// through props. Same pattern as `clearAllCourses` above.
  async function syncCourses() {
    setSyncingCourses(true);
    setSyncResult(null);
    setError(null);
    try {
      const report = await invoke<{
        new: number;
        refreshed: number;
        skipped_deleted: number;
      }>("refresh_bundled_courses");
      const parts: string[] = [];
      if (report.new > 0) {
        parts.push(`${report.new} new course${report.new === 1 ? "" : "s"}`);
      }
      if (report.refreshed > 0) {
        parts.push(`${report.refreshed} refreshed`);
      }
      const message =
        parts.length > 0 ? `Synced — ${parts.join(", ")}.` : "Already up to date.";
      setSyncResult(message);
      // If we actually changed something on disk, reload the window so
      // the course list re-fetches. Up-to-date case skips the reload to
      // avoid flickering the whole UI for a no-op.
      if (report.new > 0 || report.refreshed > 0) {
        // Brief delay so the user reads the success message before the
        // window blanks for the reload.
        setTimeout(() => window.location.reload(), 700);
      } else {
        // Clear the "already up to date" message after a few seconds.
        setTimeout(() => setSyncResult(null), 4000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncingCourses(false);
    }
  }

  return (
    <ModalBackdrop onDismiss={onDismiss}>
      <div className="libre-settings-panel">
        <div className="libre-settings-header">
          <span className="libre-settings-title">Settings</span>
          <button className="libre-settings-close" onClick={onDismiss}>×</button>
        </div>

        <div className="libre-settings-columns">
          <nav className="libre-settings-nav" aria-label="Settings sections">
            {sections.map((s) => (
              <button
                key={s.id}
                className={`libre-settings-nav-item ${
                  section === s.id ? "libre-settings-nav-item--active" : ""
                }`}
                onClick={() => setSection(s.id)}
              >
                <span className="libre-settings-nav-label">{s.label}</span>
                <span className="libre-settings-nav-hint">{s.hint}</span>
              </button>
            ))}
          </nav>

          <div className="libre-settings-body">
            {section === "general" && <GeneralPane />}

            {section === "ai" && (
              <AiPane
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                openaiKey={openaiKey}
                onOpenaiKeyChange={setOpenaiKey}
                model={model}
                onModelChange={setModel}
              />
            )}

            {section === "theme" && (
              <ThemePane theme={theme} onThemeChange={handleThemeChange} />
            )}
            {section === "sounds" && <SoundPane />}

            {section === "data" && (
              <section>
                <h3 className="libre-settings-section">Data</h3>
                <p className="libre-settings-blurb">
                  Pull in new bundled books, clear caches, or wipe local content.
                  Your API key and preferences stay.
                </p>
                <div className="libre-settings-data-row">
                  <div>
                    <div className="libre-settings-data-label">Sync latest courses</div>
                    <div className="libre-settings-data-hint">
                      Pulls newly-bundled books into your library and refreshes any
                      existing courses with the latest lessons + drills. Deleted
                      packs stay deleted.
                      {syncResult && (
                        <span className="libre-settings-data-success">
                          {" · "}
                          {syncResult}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="libre-settings-secondary"
                    onClick={syncCourses}
                    disabled={syncingCourses}
                  >
                    {syncingCourses ? "Syncing…" : "Sync now"}
                  </button>
                </div>
                {/* "Clear cache" + "Clear all courses" rows used to
                    live here. Folded into the single "Start fresh"
                    affordance under Settings → Account on 2026-05-10
                    (see lib/resetAccount.ts). One button now wipes
                    courses + ingest cache + completions + every
                    achievement + the matching cloud rows in one
                    shot. The Data section now stays scoped to
                    additive operations (Sync); destructive ones
                    moved to the natural home next to Sign-out and
                    Delete-account. */}
              </section>
            )}

            {section === "sync" && (
              realtime ? (
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
              ) : (
                <section>
                  <h3 className="libre-settings-section">Sync</h3>
                  <p className="libre-settings-blurb">
                    Sync diagnostics aren't available in this build.
                  </p>
                </section>
              )
            )}

            {section === "diagnostics" && <DiagnosticsPanel />}

            {section === "developer" && <DeveloperPane />}

            {section === "account" &&
              onRequestSignIn &&
              !(cloud.signedIn && typeof cloud.user === "object" && cloud.user) && (
                <SignedOutAccountSection
                  cloud={cloud}
                  onRequestSignIn={() => {
                    onRequestSignIn();
                    onDismiss();
                  }}
                />
              )}

            {section === "account" && cloud.signedIn && typeof cloud.user === "object" && cloud.user && (
              <AccountSection
                user={cloud.user}
                signingOut={signingOut}
                deletingAccount={deletingAccount}
                confirmDeleteAccount={confirmDeleteAccount}
                onSignOut={async () => {
                  setSigningOut(true);
                  setError(null);
                  try {
                    await cloud.signOut();
                    // Close the dialog so the user doesn't sit on an
                    // Account section that no longer applies. Defer one
                    // tick so React unmounts cleanly.
                    onDismiss();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : String(e));
                  } finally {
                    setSigningOut(false);
                  }
                }}
                onRequestDeleteConfirm={() => setConfirmDeleteAccount(true)}
                onCancelDelete={() => setConfirmDeleteAccount(false)}
                onConfirmDelete={async () => {
                  setDeletingAccount(true);
                  setError(null);
                  try {
                    await cloud.deleteAccount();
                    onDismiss();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : String(e));
                    setConfirmDeleteAccount(false);
                  } finally {
                    setDeletingAccount(false);
                  }
                }}
                cloud={cloud}
              />
            )}

            {error && <div className="libre-settings-error">{error}</div>}
          </div>
        </div>

        {/* Footer sits outside the scroll body so the Save button is always
            visible regardless of section length. Only the AI section has a
            committable field; on other sections the Save button is hidden
            to avoid implying unsaved state. */}
        <div className="libre-settings-footer">
          {saved && (
            <span className="libre-settings-saved">
              <Icon icon={checkIcon} size="xs" color="currentColor" />
              saved
            </span>
          )}
          {section === "ai" && (
            <button
              className="libre-settings-primary"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          )}
          {section !== "ai" && (
            <span className="libre-settings-footer-hint">
              Changes on this tab apply immediately.
            </span>
          )}
        </div>
      </div>
    </ModalBackdrop>
  );
}

/// Signed-out variant of the Account pane. Renders the sign-in CTA
/// (the original surface) PLUS the same "Start fresh" affordance the
/// signed-in `<AccountSection>` exposes — local data is wipeable
/// regardless of cloud auth, and a learner who isn't signed in
/// shouldn't have to make an account just to reset progress on the
/// device they're holding. Two-tap confirm UX matches the signed-in
/// version exactly so the muscle memory transfers either way.
function SignedOutAccountSection({
  cloud,
  onRequestSignIn,
}: {
  cloud: UseLibreCloud;
  onRequestSignIn: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(false), 5000);
    return () => window.clearTimeout(id);
  }, [armed]);
  return (
    <section>
      <h3 className="libre-settings-section">Account</h3>
      <p className="libre-settings-blurb">
        Sign in to sync progress, streaks, and lesson history between
        devices, upload your imported books, and share courses with
        friends. Libre works fully offline without an account —
        signing in is purely additive.
      </p>
      <button
        type="button"
        className="libre-settings-primary"
        onClick={onRequestSignIn}
      >
        Sign in
      </button>

      <div
        className="libre-settings-data-row"
        style={{ marginTop: 24 }}
      >
        <div>
          <div className="libre-settings-data-label">Start fresh</div>
          <div className="libre-settings-data-hint">
            {armed
              ? "Tap Confirm within 5 s to wipe every course, completion, achievement, streak, and cached progress on this device. The page will reload with a freshly-seeded library."
              : busy
              ? msg ?? "Resetting…"
              : msg
              ? msg
              : "Wipes every course, completion, achievement, streak, and cached progress on this device. Theme, language, and other preferences stay. (Cross-device sync needs a sign-in — without one this only resets the local copy.)"}
          </div>
        </div>
        <button
          className="libre-settings-danger"
          disabled={busy}
          onClick={async () => {
            if (!armed) {
              setArmed(true);
              setMsg(null);
              return;
            }
            setArmed(false);
            setBusy(true);
            setMsg("Resetting…");
            try {
              const report = await resetAccount(cloud);
              setMsg(report.message + " Reloading…");
              setTimeout(() => window.location.reload(), 700);
            } catch (e) {
              setMsg(
                `Reset failed: ${e instanceof Error ? e.message : String(e)}`,
              );
              setBusy(false);
            }
          }}
        >
          {busy ? "Resetting…" : armed ? "Confirm" : "Start fresh"}
        </button>
      </div>
    </section>
  );
}
