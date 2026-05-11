import { useEffect, useState } from "react";
import {
  celebrate,
  celebrateWith,
  type CelebrationEffect,
} from "../../../lib/celebrate";
import { resetAccount } from "../../../lib/resetAccount";
import type { UseFishbonesCloud } from "../../../hooks/useFishbonesCloud";

const FLAG_KEY = "fishbones:devconsole";

/// Names + short descriptions for the six celebration effects shown
/// in the achievement-test panel below. Order matches the
/// `CelebrationEffect` union — see `src/lib/celebrate.ts` for the
/// rendering details.
const EFFECT_LABELS: Array<{
  id: CelebrationEffect;
  label: string;
  hint: string;
}> = [
  {
    id: "coin-burst",
    label: "Coin burst",
    hint: "Gold coins erupt from the centre and fall into a pile. Currently the only celebration effect — the magenta-keyed alternates were retired in favour of the cleaner green-keyed coin source.",
  },
];

/// Developer settings — currently just a toggle for the floating
/// dev console. The console (`public/devconsole.js`) loads on every
/// boot and patches `console.log` / `window.error` /
/// `unhandledrejection` so logs are buffered from page-zero, but the
/// PANEL only mounts when this flag is set. Toggling it on calls
/// `window.__fbDevConsole_toggle()` which mounts the panel
/// immediately and flushes the entire buffered log into it — so
/// you see what the app already logged from the very first render.
///
/// Why a separate pane: the console is a debugging affordance, not
/// a normal feature. Mixing it into General clutters the
/// most-visited section, and putting it under "Resources"
/// (DiagnosticsPanel) implies it's a one-time-look thing rather
/// than a stateful toggle. Its own section makes the boundary
/// explicit ("you're poking around under the hood now").
interface Props {
  /// Cloud handle. Reset-account uses `resetProgress` to wipe the
  /// relay-side rows alongside the local DB; the rest of the
  /// developer affordances are local-only and don't touch it.
  cloud: UseFishbonesCloud;
}

export default function DeveloperPane({ cloud }: Props) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(FLAG_KEY) === "1";
    } catch {
      return false;
    }
  });

  /// Two-tap confirm state for the destructive "Reset account"
  /// action. First click flips this to "armed" + starts a 5 s
  /// auto-disarm timer; second click within that window actually
  /// runs the reset. Lots of friction on purpose — this is the
  /// nuke button for every piece of earned progress.
  const [resetArmed, setResetArmed] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!resetArmed) return;
    const id = window.setTimeout(() => setResetArmed(false), 5000);
    return () => window.clearTimeout(id);
  }, [resetArmed]);

  // Re-sync if devconsole.js was toggled by another path (the
  // 5-tap fallback gesture, the panel's × button, or a second
  // tab) so the toggle doesn't lie about state. Polling at 1Hz is
  // fine for a settings dialog the user only has open briefly.
  useEffect(() => {
    const id = window.setInterval(() => {
      let live = false;
      try {
        live = localStorage.getItem(FLAG_KEY) === "1";
      } catch {
        live = false;
      }
      setEnabled((prev) => (prev === live ? prev : live));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  function toggle() {
    // Prefer the runtime API exposed by devconsole.js — it
    // mounts/unmounts the panel live without a reload AND flushes
    // the buffered logs into the panel on toggle-on.
    const api = (
      window as unknown as { __fbDevConsole_toggle?: () => "on" | "off" }
    ).__fbDevConsole_toggle;
    if (api) {
      const next = api();
      setEnabled(next === "on");
      return;
    }
    // Fallback: devconsole.js didn't load (CSP block, missing
    // bundle, etc.). Flip the flag and reload so the next boot
    // tries again.
    try {
      if (enabled) localStorage.removeItem(FLAG_KEY);
      else localStorage.setItem(FLAG_KEY, "1");
    } catch {
      /* private mode / quota — toggle silently fails */
    }
    setEnabled(!enabled);
    window.location.reload();
  }

  return (
    <section>
      <h3 className="fishbones-settings-section">Developer</h3>
      <p className="fishbones-settings-blurb">
        A floating panel that captures every <code>console.log</code>,
        thrown error, and unhandled promise rejection from the moment
        the app loads. Useful for debugging boot stalls, slow
        navigations, and crashes — especially on iPad where Safari's
        Web Inspector isn't reachable. Drag the header to move,
        bottom-right corner to resize, "–" to minimise, "×" to close
        and disable.
      </p>
      <div className="fishbones-settings-data-row">
        <div>
          <div className="fishbones-settings-data-label">
            Show dev console
          </div>
          <div className="fishbones-settings-data-hint">
            {enabled
              ? "Console panel is visible (or about to be). Tap × on the panel header to dismiss."
              : "Console is hidden. Logs are still being captured — toggle on to see them."}
          </div>
        </div>
        <button
          type="button"
          className="fishbones-settings-secondary"
          onClick={toggle}
        >
          {enabled ? "Hide console" : "Show console"}
        </button>
      </div>
      <p className="fishbones-settings-blurb" style={{ marginTop: 18 }}>
        <strong>Emergency fallback:</strong> if the app freezes before
        you can open Settings (the iPad-stuck-on-preloader case), tap
        the top-left corner of the screen 5 times within 2.5 seconds.
        Same toggle, no UI required.
      </p>

      {/* ── Achievement test panel ──────────────────────────────
          Lets a designer / developer sample each celebration cue
          without needing to actually earn an achievement, plus a
          reset-unlocks affordance for stepping through the unlock
          flow from a clean slate. Lives inside the Developer pane
          so it doesn't add visible chrome to the user-facing rails.
      */}
      <h3
        className="fishbones-settings-section"
        style={{ marginTop: 28 }}
      >
        Achievements (test)
      </h3>
      <p className="fishbones-settings-blurb">
        Sample each celebration effect, fire a random one (the live
        unlock path), or wipe the persisted unlocks so the next
        achievement event re-fires from scratch. The buttons here
        skip the achievement-engine — they just trigger the visual
        cue, so progress + persisted unlocks are unaffected unless
        you press <em>Reset</em>.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 8,
          marginTop: 8,
        }}
      >
        {EFFECT_LABELS.map((eff) => (
          <div className="fishbones-settings-data-row" key={eff.id}>
            <div>
              <div className="fishbones-settings-data-label">{eff.label}</div>
              <div className="fishbones-settings-data-hint">{eff.hint}</div>
            </div>
            <button
              type="button"
              className="fishbones-settings-secondary"
              onClick={() =>
                void celebrateWith(eff.id, "medium", { x: 0.5, y: 0.5 })
              }
            >
              Try
            </button>
          </div>
        ))}
      </div>

      <div
        className="fishbones-settings-data-row"
        style={{ marginTop: 16 }}
      >
        <div>
          <div className="fishbones-settings-data-label">
            Random celebration
          </div>
          <div className="fishbones-settings-data-hint">
            Calls the same weighted random pick the achievement
            unlock path uses. Hit it a few times — the effect
            varies on each press.
          </div>
        </div>
        <button
          type="button"
          className="fishbones-settings-secondary"
          onClick={() => void celebrate("medium", { x: 0.5, y: 0.5 })}
        >
          Fire
        </button>
      </div>

      <div className="fishbones-settings-data-row">
        <div>
          <div className="fishbones-settings-data-label">
            Reset unlocked achievements
          </div>
          <div className="fishbones-settings-data-hint">
            Clears <code>localStorage["fb:achievements:unlocked"]</code> so
            the next progress event treats every persisted milestone as
            freshly earned. Useful for re-running the unlock flow without
            hand-editing storage. Streaks, XP, and progress are NOT
            touched — only the unlocked-record list.
          </div>
        </div>
        <button
          type="button"
          className="fishbones-settings-secondary"
          onClick={() => {
            try {
              localStorage.removeItem("fb:achievements:unlocked");
            } catch {
              /* private mode / quota — silent fail is fine */
            }
            // Storage events don't fire in the writing tab, so nudge
            // any subscribed UI by dispatching a synthetic one with
            // the same key. The useAchievements cross-tab listener
            // re-reads + re-renders.
            try {
              window.dispatchEvent(
                new StorageEvent("storage", {
                  key: "fb:achievements:unlocked",
                }),
              );
            } catch {
              /* SSR / older browsers — ignore */
            }
          }}
        >
          Reset
        </button>
      </div>

      {/* ── Reset entire account ────────────────────────────────
          The big red door. Wipes EVERY piece of earned progress
          (completions, achievements, streak, shields, practice
          history, recents, notification markers) on this device
          AND, when signed in, calls the relay's DELETE so other
          devices sync the empty state on their next pull. Sign-in
          token, theme, locale, and other preferences survive — the
          intent is "fresh learner" not "fresh install". The button
          arms on first click and only commits on a second click
          within 5 s, so a stray tap can't nuke a year of progress.
      */}
      <h3
        className="fishbones-settings-section"
        style={{ marginTop: 28 }}
      >
        Account
      </h3>
      <p className="fishbones-settings-blurb">
        Wipe every earned-progress signal back to a fresh-learner
        state. Completions, achievements, streak, shields, practice
        history, and recents all go to zero — both on this device
        and on the relay so every other signed-in device picks up
        the empty state on its next sync. The account itself stays
        signed in; preferences (theme, language, view mode) are
        untouched. Use{" "}
        <em>Sign out → Delete account</em> in the Account pane if
        you want to nuke the account itself.
      </p>
      <div className="fishbones-settings-data-row">
        <div>
          <div className="fishbones-settings-data-label">
            Reset account to default
          </div>
          <div className="fishbones-settings-data-hint">
            {resetArmed
              ? "Tap Confirm within 5 s to wipe progress on this device + sync the empty state to your other signed-in devices."
              : resetMsg
              ? resetMsg
              : cloud.signedIn
              ? "Clears local + relay progress. The empty state will sync to your other devices on their next pull."
              : "Clears local progress only — sign in first if you also want to wipe the cloud copy across devices."}
          </div>
        </div>
        <button
          type="button"
          className="fishbones-settings-secondary"
          disabled={resetBusy}
          onClick={async () => {
            if (!resetArmed) {
              setResetArmed(true);
              setResetMsg(null);
              return;
            }
            setResetArmed(false);
            setResetBusy(true);
            setResetMsg("Resetting…");
            try {
              const report = await resetAccount(cloud);
              setResetMsg(report.message);
            } catch (e) {
              setResetMsg(
                `Reset failed: ${e instanceof Error ? e.message : String(e)}`,
              );
            } finally {
              setResetBusy(false);
            }
          }}
        >
          {resetBusy
            ? "Resetting…"
            : resetArmed
            ? "Confirm reset"
            : "Reset account"}
        </button>
      </div>
    </section>
  );
}
