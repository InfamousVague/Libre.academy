import { useEffect, useState } from "react";

const FLAG_KEY = "fishbones:devconsole";

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
    </section>
  );
}
