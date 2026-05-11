/* Self-contained floating dev console.
 *
 * Loaded by index.html as a parser-blocking <script> in <head>, so
 * its console + error hooks are installed before main.tsx (the
 * React module bundle) starts evaluating. That's the whole point —
 * we need to see early errors on iPad where Safari Web Inspector
 * isn't an option ("Loading Libre…" stuck on the splash).
 *
 * Captures everything that hits the page:
 *   - console.log / info / warn / error / debug
 *   - window 'error' (uncaught throws + script-load failures)
 *   - window 'unhandledrejection' (rejected promises with no .catch)
 *
 * The panel UI only mounts when the flag is set — patches are
 * always-on (cheap), so logs are buffered from page load whether or
 * not the panel is showing. Toggling the flag with the 5-tap
 * gesture mounts the panel LIVE (no reload) and the buffer flushes
 * into the log body, so you immediately see whatever the app
 * already logged.
 *
 * UI is a single floating panel with a header (drag handle, copy /
 * clear / minimize / close buttons) and a scrolling log body. A
 * resize handle in the bottom-right corner lets you drag-to-size.
 * Position + size + minimize state persist in localStorage so a
 * launch-time toggle doesn't lose your layout. Everything is
 * vanilla JS / DOM — no framework dep, no build step, runs the
 * moment the script tag executes.
 *
 * Three ways to surface the panel:
 *   1. localStorage["libre:devconsole"] = "1" — persistent
 *   2. URL param ?devconsole=1 / =0                — flips the flag
 *      (and ?devconsole=0 explicitly clears it)
 *   3. Five-tap on the top-left 80×80 region in 2.5s — magic gesture.
 *      The only way to flip the flag from inside the iPad app
 *      without rebuilding.
 *
 * To dismiss: tap the × button on the panel (clears the flag and
 * unmounts) or run `localStorage.removeItem("libre:devconsole")`
 * and reload.
 */

(function () {
  "use strict";

  // Singleton guard — script may load twice during HMR / re-injection.
  if (window.__fbDevConsole) return;
  window.__fbDevConsole = true;

  // ── Configuration ──────────────────────────────────────────────
  var STORAGE_KEY_POS = "fb:devconsole:pos-v1";
  var STORAGE_KEY_SIZE = "fb:devconsole:size-v1";
  var STORAGE_KEY_MIN = "fb:devconsole:minimized-v1";
  var STORAGE_KEY_FLAG = "libre:devconsole";
  var MAX_LOGS = 1000;

  // 5-tap gesture: tap the top-left TAP_REGION_PX×TAP_REGION_PX
  // square TAPS_NEEDED times within TAP_WINDOW_MS to toggle the
  // panel. Anything outside the corner resets the count, so a
  // normal tap on the sidebar can't accidentally arm it.
  //
  // Bumped from 80×80 to 120×120 because the original was hard to
  // hit reliably on iPad — the corner of the screen is partially
  // occluded by the home indicator gesture zone in landscape and
  // by the status bar in portrait, and the user can't see whether
  // their taps are being detected (the whole reason this gesture
  // exists is the app being stuck on the preloader with no way to
  // open Web Inspector). The visible tap-counter badge below makes
  // the larger region safe — even an accidental top-left tap that
  // shows "1/5" is harmless, and the badge fades on its own.
  var TAP_WINDOW_MS = 3000;
  var TAP_REGION_PX = 120;
  var TAPS_NEEDED = 5;

  // ── Flag helpers ───────────────────────────────────────────────
  function isFlagSet() {
    try { return localStorage.getItem(STORAGE_KEY_FLAG) === "1"; }
    catch (e) { return false; }
  }
  function setFlag(on) {
    try {
      if (on) localStorage.setItem(STORAGE_KEY_FLAG, "1");
      else localStorage.removeItem(STORAGE_KEY_FLAG);
    } catch (e) { /* private mode / quota */ }
  }

  // URL param flip: ?devconsole=1 sets the flag, ?devconsole=0
  // clears it. Runs once at script load — useful for desktop where
  // you can edit the URL bar; useless on iPad (Tauri doesn't
  // surface a URL bar) where the 5-tap gesture is the path in.
  try {
    var url = new URL(window.location.href);
    var p = url.searchParams.get("devconsole");
    if (p === "1") setFlag(true);
    else if (p === "0") setFlag(false);
  } catch (e) { /* ignore */ }

  // ── Log buffer ─────────────────────────────────────────────────
  var logs = [];
  var bodyEl = null; // body element, set after mount
  var panelEl = null; // root element of the mounted panel, null when unmounted

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }
  function fmtTime(ts) {
    var d = new Date(ts);
    return (
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes()) +
      ":" +
      pad(d.getSeconds()) +
      "." +
      String(d.getMilliseconds() + 1000).slice(1)
    );
  }

  function stringify(v, seen) {
    if (v === undefined) return "undefined";
    if (v === null) return "null";
    var t = typeof v;
    if (t === "string") return v;
    if (t === "number" || t === "boolean") return String(v);
    if (t === "function") return v.toString();
    if (v instanceof Error) {
      return v.stack || v.message || String(v);
    }
    seen = seen || [];
    if (seen.indexOf(v) !== -1) return "[Circular]";
    seen = seen.concat([v]);
    try {
      // Try to JSON-serialise; falls back if it has BigInts or
      // exotic prototypes.
      return JSON.stringify(v, function (_k, val) {
        if (typeof val === "bigint") return val.toString() + "n";
        return val;
      }, 2);
    } catch (e) {
      try {
        return Object.prototype.toString.call(v);
      } catch (e2) {
        return "[Unserializable]";
      }
    }
  }

  function pushLog(level, args) {
    var arr = Array.prototype.slice.call(args);
    var msg = arr.map(function (a) { return stringify(a); }).join(" ");
    logs.push({ ts: Date.now(), level: level, msg: msg });
    if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
    if (bodyEl) appendRow(logs[logs.length - 1]);
  }

  // ── Console patch ──────────────────────────────────────────────
  var orig = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug ? console.debug.bind(console) : console.log.bind(console),
  };
  console.log = function () { orig.log.apply(null, arguments); pushLog("log", arguments); };
  console.info = function () { orig.info.apply(null, arguments); pushLog("info", arguments); };
  console.warn = function () { orig.warn.apply(null, arguments); pushLog("warn", arguments); };
  console.error = function () { orig.error.apply(null, arguments); pushLog("error", arguments); };
  console.debug = function () { orig.debug.apply(null, arguments); pushLog("debug", arguments); };

  // ── Window error capture ───────────────────────────────────────
  window.addEventListener("error", function (e) {
    var where =
      (e.filename || "<no file>") +
      ":" +
      (e.lineno || "?") +
      ":" +
      (e.colno || "?");
    var stack = e.error && e.error.stack ? e.error.stack : "(no stack)";
    pushLog("error", ["Uncaught: " + (e.message || ""), "at " + where, stack]);
  });
  window.addEventListener("unhandledrejection", function (e) {
    var reason = e.reason;
    var msg;
    if (reason instanceof Error) {
      msg = reason.stack || reason.message || String(reason);
    } else {
      msg = stringify(reason);
    }
    pushLog("error", ["Unhandled rejection:", msg]);
  });

  // ── Persistence helpers ────────────────────────────────────────
  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      /* swallow — quota / private mode */
    }
  }

  // ── DOM ────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById("fb-devconsole-style")) return;
    var style = document.createElement("style");
    style.id = "fb-devconsole-style";
    style.textContent = [
      ".fb-devconsole {",
      "  position: fixed;",
      "  z-index: 99999;",
      "  background: rgba(15, 16, 22, 0.96);",
      "  color: #e8e8ec;",
      "  font: 12px/1.45 -apple-system, ui-monospace, SFMono-Regular, Menlo, monospace;",
      "  border: 1px solid rgba(255,255,255,0.18);",
      "  border-radius: 8px;",
      "  box-shadow: 0 12px 32px rgba(0,0,0,0.55);",
      "  display: flex;",
      "  flex-direction: column;",
      "  overflow: hidden;",
      "  user-select: none;",
      "  -webkit-user-select: none;",
      "  backdrop-filter: blur(12px) saturate(140%);",
      "  -webkit-backdrop-filter: blur(12px) saturate(140%);",
      "}",
      ".fb-devconsole.is-minimized { resize: none; height: auto !important; }",
      ".fb-devconsole.is-minimized .fb-devconsole__body, .fb-devconsole.is-minimized .fb-devconsole__resize { display: none; }",
      ".fb-devconsole__header {",
      "  display: flex;",
      "  align-items: center;",
      "  gap: 6px;",
      "  padding: 6px 8px;",
      "  background: rgba(255,255,255,0.04);",
      "  border-bottom: 1px solid rgba(255,255,255,0.08);",
      "  cursor: move;",
      "  -webkit-touch-callout: none;",
      "}",
      ".fb-devconsole__title { flex: 1; font-weight: 600; letter-spacing: 0.3px; opacity: 0.85; }",
      ".fb-devconsole__btn {",
      "  background: transparent;",
      "  color: inherit;",
      "  border: 1px solid rgba(255,255,255,0.16);",
      "  border-radius: 4px;",
      "  font: inherit;",
      "  font-size: 11px;",
      "  padding: 2px 8px;",
      "  cursor: pointer;",
      "  -webkit-tap-highlight-color: transparent;",
      "}",
      ".fb-devconsole__btn:hover { background: rgba(255,255,255,0.08); }",
      ".fb-devconsole__btn:active { background: rgba(255,255,255,0.14); }",
      ".fb-devconsole__body {",
      "  flex: 1;",
      "  min-height: 0;",
      "  overflow: auto;",
      "  padding: 4px 0;",
      "  -webkit-overflow-scrolling: touch;",
      "  user-select: text;",
      "  -webkit-user-select: text;",
      "}",
      ".fb-devconsole__row {",
      "  display: flex;",
      "  gap: 8px;",
      "  padding: 2px 8px;",
      "  white-space: pre-wrap;",
      "  word-break: break-word;",
      "  border-left: 3px solid transparent;",
      "}",
      ".fb-devconsole__row.--log { color: #d8d8de; }",
      ".fb-devconsole__row.--info { color: #9bd3ff; border-left-color: rgba(155,211,255,0.6); }",
      ".fb-devconsole__row.--warn { color: #ffd07a; border-left-color: rgba(255,208,122,0.7); background: rgba(255,208,122,0.05); }",
      ".fb-devconsole__row.--error { color: #ff8a8a; border-left-color: rgba(255,138,138,0.8); background: rgba(255,138,138,0.06); }",
      ".fb-devconsole__row.--debug { color: #a8a8b0; }",
      ".fb-devconsole__ts { flex-shrink: 0; opacity: 0.45; font-variant-numeric: tabular-nums; }",
      ".fb-devconsole__msg { flex: 1; min-width: 0; }",
      ".fb-devconsole__resize {",
      "  position: absolute;",
      "  right: 0;",
      "  bottom: 0;",
      "  width: 16px;",
      "  height: 16px;",
      "  cursor: nwse-resize;",
      "  background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.25) 60%, transparent 60%, transparent 70%, rgba(255,255,255,0.25) 70%, rgba(255,255,255,0.25) 80%, transparent 80%);",
      "  touch-action: none;",
      "}",
      "@media (max-width: 480px) {",
      "  .fb-devconsole { font-size: 11px; }",
      "  .fb-devconsole__btn { padding: 4px 8px; font-size: 11px; }",
      "}",
    ].join("\n");
    document.head.appendChild(style);
  }

  function escapeText(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function appendRow(entry) {
    if (!bodyEl) return;
    var row = document.createElement("div");
    row.className = "fb-devconsole__row --" + entry.level;
    var ts = document.createElement("span");
    ts.className = "fb-devconsole__ts";
    ts.textContent = fmtTime(entry.ts);
    var msg = document.createElement("span");
    msg.className = "fb-devconsole__msg";
    msg.textContent = entry.msg;
    row.appendChild(ts);
    row.appendChild(msg);
    bodyEl.appendChild(row);
    // Trim oldest DOM rows if we've exceeded MAX_LOGS too.
    while (bodyEl.children.length > MAX_LOGS) {
      bodyEl.removeChild(bodyEl.firstChild);
    }
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function renderAll() {
    if (!bodyEl) return;
    bodyEl.innerHTML = "";
    for (var i = 0; i < logs.length; i++) appendRow(logs[i]);
  }

  // ── Drag + resize ──────────────────────────────────────────────
  function getEventCoords(e) {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function bindDrag(panel, handle) {
    var dragging = false;
    var origin = { mx: 0, my: 0, px: 0, py: 0 };

    function onDown(e) {
      // Ignore drag start on buttons inside the header so clicking
      // copy/clear/etc. doesn't initiate a drag.
      if (e.target && e.target.closest && e.target.closest(".fb-devconsole__btn")) return;
      dragging = true;
      var c = getEventCoords(e);
      var rect = panel.getBoundingClientRect();
      origin = { mx: c.x, my: c.y, px: rect.left, py: rect.top };
      e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      var c = getEventCoords(e);
      var nx = origin.px + (c.x - origin.mx);
      var ny = origin.py + (c.y - origin.my);
      // Clamp to viewport so the panel can't drift fully off-screen.
      var maxX = window.innerWidth - 60;
      var maxY = window.innerHeight - 30;
      nx = Math.max(-(panel.offsetWidth - 60), Math.min(maxX, nx));
      ny = Math.max(0, Math.min(maxY, ny));
      panel.style.left = nx + "px";
      panel.style.top = ny + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      e.preventDefault();
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      writeJSON(STORAGE_KEY_POS, {
        left: panel.style.left,
        top: panel.style.top,
      });
    }
    handle.addEventListener("mousedown", onDown);
    handle.addEventListener("touchstart", onDown, { passive: false });
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
  }

  function bindResize(panel, handle) {
    var resizing = false;
    var origin = { mx: 0, my: 0, w: 0, h: 0 };
    function onDown(e) {
      resizing = true;
      var c = getEventCoords(e);
      var rect = panel.getBoundingClientRect();
      origin = { mx: c.x, my: c.y, w: rect.width, h: rect.height };
      e.preventDefault();
      e.stopPropagation();
    }
    function onMove(e) {
      if (!resizing) return;
      var c = getEventCoords(e);
      var w = Math.max(220, origin.w + (c.x - origin.mx));
      var h = Math.max(120, origin.h + (c.y - origin.my));
      panel.style.width = w + "px";
      panel.style.height = h + "px";
      e.preventDefault();
    }
    function onUp() {
      if (!resizing) return;
      resizing = false;
      writeJSON(STORAGE_KEY_SIZE, {
        width: panel.style.width,
        height: panel.style.height,
      });
    }
    handle.addEventListener("mousedown", onDown);
    handle.addEventListener("touchstart", onDown, { passive: false });
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
  }

  // ── Mount ──────────────────────────────────────────────────────
  function mount() {
    injectStyles();

    var panel = document.createElement("div");
    panel.className = "fb-devconsole";

    // Restore persisted position + size, otherwise default to a
    // bottom-left placement that's out of the way of the AI orb
    // (which sits bottom-right).
    var pos = readJSON(STORAGE_KEY_POS, null);
    var size = readJSON(STORAGE_KEY_SIZE, null);
    if (pos && pos.left && pos.top) {
      panel.style.left = pos.left;
      panel.style.top = pos.top;
    } else {
      panel.style.left = "16px";
      panel.style.bottom = "16px";
    }
    if (size && size.width && size.height) {
      panel.style.width = size.width;
      panel.style.height = size.height;
    } else {
      panel.style.width = "min(420px, calc(100vw - 32px))";
      panel.style.height = "min(300px, 50vh)";
    }

    var header = document.createElement("div");
    header.className = "fb-devconsole__header";

    var title = document.createElement("span");
    title.className = "fb-devconsole__title";
    title.textContent = "Console";
    header.appendChild(title);

    function makeBtn(label, onClick) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "fb-devconsole__btn";
      b.textContent = label;
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        onClick();
      });
      header.appendChild(b);
      return b;
    }

    makeBtn("Copy", function () {
      var text = logs
        .map(function (e) {
          return "[" + fmtTime(e.ts) + "] " + e.level.toUpperCase() + ": " + e.msg;
        })
        .join("\n");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    });
    makeBtn("Clear", function () {
      logs.length = 0;
      if (bodyEl) bodyEl.innerHTML = "";
    });
    var minBtn = makeBtn("–", function () {
      var minimized = panel.classList.toggle("is-minimized");
      writeJSON(STORAGE_KEY_MIN, minimized);
      minBtn.textContent = minimized ? "+" : "–";
    });
    makeBtn("×", function () {
      // Clear the flag so it doesn't reappear on next load. The
      // singleton guard stays — `window.__fbDevConsole` remains
      // true so the 5-tap gesture handler we installed at script
      // start keeps working without re-running the setup IIFE.
      setFlag(false);
      unmount();
    });

    panel.appendChild(header);

    bodyEl = document.createElement("div");
    bodyEl.className = "fb-devconsole__body";
    panel.appendChild(bodyEl);

    var resize = document.createElement("div");
    resize.className = "fb-devconsole__resize";
    panel.appendChild(resize);

    document.body.appendChild(panel);

    // Restore minimized state.
    var minimized = !!readJSON(STORAGE_KEY_MIN, false);
    if (minimized) {
      panel.classList.add("is-minimized");
      minBtn.textContent = "+";
    }

    // Track the live panel so unmount() / the 5-tap toggle can find
    // it without rummaging through the DOM.
    panelEl = panel;

    // Render everything captured before mount — when the user 5-taps
    // to surface the console mid-session, all the buffered logs from
    // before the panel existed flush in immediately. That's the
    // whole reason patches run unconditionally at script load.
    renderAll();

    bindDrag(panel, header);
    bindResize(panel, resize);
  }

  // Tear the panel down without losing buffered logs or unwiring the
  // console patches. Called by the × button and by the 5-tap gesture
  // when toggling off. The next mount() (re-toggle on, or next page
  // load with the flag set) restores everything.
  function unmount() {
    if (!panelEl) return;
    if (panelEl.parentNode) panelEl.parentNode.removeChild(panelEl);
    panelEl = null;
    bodyEl = null;
  }

  // Defer-aware mount. Script lives in <head> so document.body may
  // not exist yet at IIFE time; on first call we wait for DOM ready,
  // subsequent calls (5-tap toggling on after a previous unmount)
  // run synchronously since the body is definitely there by then.
  function ensureMounted() {
    if (panelEl) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function once() {
        document.removeEventListener("DOMContentLoaded", once);
        // Re-check the flag on DOMContentLoaded — the user might
        // have 5-tapped twice in quick succession before DOM was
        // ready, leaving the flag off; in that case skip the mount.
        if (isFlagSet()) mount();
      });
    } else {
      mount();
    }
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (e) {
      console.warn("[devconsole] copy failed:", e);
    }
  }

  // ── 5-tap-on-top-left magic gesture (invisible) ────────────────
  // The official enable path is Settings → Developer → "Show dev
  // console" toggle (which calls window.__fbDevConsole_toggle).
  // The 5-tap gesture stays bound as a silent fallback for the
  // iPad-preloader-stall case where Settings isn't reachable —
  // tap the top-left TAP_REGION_PX × TAP_REGION_PX corner
  // TAPS_NEEDED times within TAP_WINDOW_MS to summon / dismiss.
  // No visual indicator: production users shouldn't see a pink
  // box, and the gesture's so awkward to trigger by accident that
  // a counter UI isn't necessary for normal use.
  //
  // Bound to `document` AND `window` (capture phase) on three
  // event families (pointerdown / touchstart / mousedown) so iPad
  // WKWebView's occasional drop of document-level touch events on
  // full-viewport divs (the preloader) doesn't break the gesture.
  // A 50ms dedupe collapses synthetic event chains — one finger
  // that fires pointerdown → touchstart → mousedown counts as ONE
  // tap.
  (function bindCornerTap() {
    var taps = [];
    var lastTapAt = 0;

    function onTap(e) {
      var now = Date.now();
      if (now - lastTapAt < 50) return;

      var x, y;
      var t =
        (e.touches && e.touches[0]) ||
        (e.changedTouches && e.changedTouches[0]);
      if (t) { x = t.clientX; y = t.clientY; }
      else if (typeof e.clientX === "number") { x = e.clientX; y = e.clientY; }
      else return;

      if (x > TAP_REGION_PX || y > TAP_REGION_PX) {
        taps = [];
        return;
      }

      lastTapAt = now;
      taps = taps.filter(function (ts) { return now - ts < TAP_WINDOW_MS; });
      taps.push(now);

      if (taps.length >= TAPS_NEEDED) {
        taps = [];
        toggleConsole();
      }
    }

    var opts = { capture: true, passive: true };
    var types = ["pointerdown", "touchstart", "mousedown"];
    var targets = [document, window];
    for (var i = 0; i < targets.length; i++) {
      for (var j = 0; j < types.length; j++) {
        try {
          targets[i].addEventListener(types[j], onTap, opts);
        } catch (e) {
          targets[i].addEventListener(types[j], onTap, true);
        }
      }
    }
  })();

  // Public toggle API for the Settings → Developer pane and any
  // other UI that wants to flip the panel without touching
  // localStorage directly. Returns the new state ("on" | "off").
  function toggleConsole() {
    if (panelEl) {
      setFlag(false);
      unmount();
      return "off";
    }
    setFlag(true);
    ensureMounted();
    return "on";
  }
  window.__fbDevConsole_toggle = toggleConsole;
  window.__fbDevConsole_isOpen = function () {
    return !!panelEl;
  };

  // Mount on first load if the flag is on. Console patches and the
  // tap gesture handler above are already armed regardless — we're
  // only deciding whether to show the panel right now.
  if (isFlagSet()) ensureMounted();
})();
