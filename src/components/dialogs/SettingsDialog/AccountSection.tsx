import { useEffect, useState } from "react";
import { describeAuthProvider } from "./helpers";
import { resetAccount } from "../../../lib/resetAccount";
import type { UseLibreCloud } from "../../../hooks/useLibreCloud";

interface AccountSectionProps {
  user: {
    id: string;
    email: string | null;
    display_name: string | null;
    has_password: boolean;
    apple_linked: boolean;
    google_linked: boolean;
  };
  signingOut: boolean;
  deletingAccount: boolean;
  confirmDeleteAccount: boolean;
  onSignOut: () => void;
  onRequestDeleteConfirm: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  /// Cloud handle so the Start-fresh button can also wipe the
  /// learner's progress rows on the relay (best-effort — falls back
  /// to local-only when the relay route 404s or the device is
  /// offline).
  cloud: UseLibreCloud;
}

/// Account/Profile section. Rendered only when signed in. Surfaces the
/// learner's identity (display name + email + provider), a sign-out
/// button, and a click-to-confirm delete-account flow that mirrors the
/// destructive-action UX used by `confirmClearCourses` above.
export default function AccountSection({
  user,
  signingOut,
  deletingAccount,
  confirmDeleteAccount,
  onSignOut,
  onRequestDeleteConfirm,
  onCancelDelete,
  onConfirmDelete,
  cloud,
}: AccountSectionProps) {
  const displayName = user.display_name?.trim() || null;
  // Avatar initial — first character of the display name, falling back
  // to the email's local part. Always uppercase for visual consistency.
  // If neither is available we fall through to a generic person glyph.
  const initialSource = displayName || user.email || "";
  const initial = initialSource ? initialSource.charAt(0).toUpperCase() : "?";
  const providerLabel = describeAuthProvider(user);

  /// Start-fresh state machine. First click ARMS the button + starts
  /// a 5 s auto-disarm; second click within that window commits.
  /// Lots of friction on purpose — this nukes courses, completions,
  /// achievements, streaks, practice history, AND the cloud-side
  /// rows in one shot. Reload after the reset so the empty state
  /// renders against the freshly-seeded course set.
  const [freshArmed, setFreshArmed] = useState(false);
  const [freshBusy, setFreshBusy] = useState(false);
  const [freshMsg, setFreshMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!freshArmed) return;
    const id = window.setTimeout(() => setFreshArmed(false), 5000);
    return () => window.clearTimeout(id);
  }, [freshArmed]);

  return (
    <section>
      <h3 className="libre-settings-section">Account</h3>
      <p className="libre-settings-blurb">
        Your Libre cloud account. Lesson progress syncs across
        devices when signed in; nothing is uploaded otherwise.
      </p>

      <div className="libre-settings-account-card">
        <div className="libre-settings-account-avatar" aria-hidden>
          {initial}
        </div>
        <div className="libre-settings-account-meta">
          <div className="libre-settings-account-name">
            {displayName || user.email || "Signed in"}
          </div>
          {user.email && displayName && (
            <div className="libre-settings-account-email">{user.email}</div>
          )}
          <div className="libre-settings-account-provider">
            {providerLabel}
          </div>
        </div>
      </div>

      <div className="libre-settings-data-row">
        <div>
          <div className="libre-settings-data-label">Sign out</div>
          <div className="libre-settings-data-hint">
            Removes the cloud token from this device. Your local courses
            and progress stay; you can sign back in any time.
          </div>
        </div>
        <button
          className="libre-settings-secondary"
          onClick={onSignOut}
          disabled={signingOut || deletingAccount}
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>

      {/* ── Start fresh ────────────────────────────────────────
          The single consolidated reset surface. Replaces the four
          scattered buttons that used to live across Settings:
            - Data → Clear cache (ingest)
            - Data → Clear all courses
            - Developer → Reset unlocked achievements
            - Developer → Reset account to default
          One click here arms the action; a second click within 5 s
          commits. The reset wipes courses, completions, achievements,
          streak, shields, practice history, AND the cloud-side
          progress rows so other signed-in devices see the empty
          state on their next pull. Sign-in token, theme, and other
          preferences survive. Window reloads after success so the
          freshly-emptied state seeds cleanly on next mount.
      */}
      <div className="libre-settings-data-row">
        <div>
          <div className="libre-settings-data-label">Start fresh</div>
          <div className="libre-settings-data-hint">
            {freshArmed
              ? "Tap Confirm within 5 s to wipe every course, completion, achievement, streak, and cached progress on this device, plus the matching cloud rows. The page will reload with a freshly-seeded library."
              : freshBusy
              ? freshMsg ?? "Resetting…"
              : freshMsg
              ? freshMsg
              : "Wipes every course, completion, achievement, streak, and cached progress on this device, plus the matching cloud rows. Sign-in, theme, and preferences stay. Use Delete account below if you want to remove the account entirely."}
          </div>
        </div>
        <button
          className="libre-settings-danger"
          disabled={freshBusy || signingOut || deletingAccount}
          onClick={async () => {
            if (!freshArmed) {
              setFreshArmed(true);
              setFreshMsg(null);
              return;
            }
            setFreshArmed(false);
            setFreshBusy(true);
            setFreshMsg("Resetting…");
            try {
              const report = await resetAccount(cloud);
              setFreshMsg(report.message + " Reloading…");
              // Brief delay so the user sees the success line before
              // the window blanks for the reload. Same pattern the
              // sync-courses path uses elsewhere.
              setTimeout(() => window.location.reload(), 700);
            } catch (e) {
              setFreshMsg(
                `Reset failed: ${e instanceof Error ? e.message : String(e)}`,
              );
              setFreshBusy(false);
            }
          }}
        >
          {freshBusy
            ? "Resetting…"
            : freshArmed
            ? "Confirm"
            : "Start fresh"}
        </button>
      </div>

      <div className="libre-settings-data-row">
        <div>
          <div className="libre-settings-data-label">Delete account</div>
          <div className="libre-settings-data-hint">
            Permanently deletes your Libre cloud account, all synced
            progress, and any uploaded courses. Local files on this
            device are not affected. Cannot be undone.
          </div>
        </div>
        {confirmDeleteAccount ? (
          <div className="libre-settings-confirm">
            <button
              className="libre-settings-secondary"
              onClick={onCancelDelete}
              disabled={deletingAccount}
            >
              Cancel
            </button>
            <button
              className="libre-settings-danger"
              onClick={onConfirmDelete}
              disabled={deletingAccount}
            >
              {deletingAccount ? "Deleting…" : "Really delete"}
            </button>
          </div>
        ) : (
          <button
            className="libre-settings-danger"
            onClick={onRequestDeleteConfirm}
            disabled={signingOut}
          >
            Delete account
          </button>
        )}
      </div>
    </section>
  );
}
