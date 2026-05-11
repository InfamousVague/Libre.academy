import { useEffect, useState } from "react";
import {
  celebrate,
  celebrateWith,
  type CelebrationEffect,
} from "../../../lib/celebrate";

const FLAG_KEY = "libre:devconsole";

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
export default function DeveloperPane() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(FLAG_KEY) === "1";
    } catch {
      return false;
    }
  });

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
      <h3 className="libre-settings-section">Developer</h3>
      <p className="libre-settings-blurb">
        A floating panel that captures every <code>console.log</code>,
        thrown error, and unhandled promise rejection from the moment
        the app loads. Useful for debugging boot stalls, slow
        navigations, and crashes — especially on iPad where Safari's
        Web Inspector isn't reachable. Drag the header to move,
        bottom-right corner to resize, "–" to minimise, "×" to close
        and disable.
      </p>
      <div className="libre-settings-data-row">
        <div>
          <div className="libre-settings-data-label">
            Show dev console
          </div>
          <div className="libre-settings-data-hint">
            {enabled
              ? "Console panel is visible (or about to be). Tap × on the panel header to dismiss."
              : "Console is hidden. Logs are still being captured — toggle on to see them."}
          </div>
        </div>
        <button
          type="button"
          className="libre-settings-secondary"
          onClick={toggle}
        >
          {enabled ? "Hide console" : "Show console"}
        </button>
      </div>
      <p className="libre-settings-blurb" style={{ marginTop: 18 }}>
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
        className="libre-settings-section"
        style={{ marginTop: 28 }}
      >
        Achievements (test)
      </h3>
      <p className="libre-settings-blurb">
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
          <div className="libre-settings-data-row" key={eff.id}>
            <div>
              <div className="libre-settings-data-label">{eff.label}</div>
              <div className="libre-settings-data-hint">{eff.hint}</div>
            </div>
            <button
              type="button"
              className="libre-settings-secondary"
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
        className="libre-settings-data-row"
        style={{ marginTop: 16 }}
      >
        <div>
          <div className="libre-settings-data-label">
            Random celebration
          </div>
          <div className="libre-settings-data-hint">
            Calls the same weighted random pick the achievement
            unlock path uses. Hit it a few times — the effect
            varies on each press.
          </div>
        </div>
        <button
          type="button"
          className="libre-settings-secondary"
          onClick={() => void celebrate("medium", { x: 0.5, y: 0.5 })}
        >
          Fire
        </button>
      </div>

      {/* The "Reset unlocked achievements" + "Reset account to
          default" rows that used to live here were folded into the
          single "Start fresh" affordance under Settings → Account
          on 2026-05-10 (see resetAccount.ts). One button now wipes
          courses + completions + achievements + streak + practice
          history + cached progress + the matching cloud rows in
          one shot, replacing the four scattered surfaces that
          previously did partial overlapping wipes. Developer-pane
          stays scoped to dev affordances (console toggle, achievement
          test panel) per the original "you're poking around under
          the hood" framing. */}
    </section>
  );
}
