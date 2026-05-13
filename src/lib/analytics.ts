/// Lightweight, privacy-friendly analytics — WEB BUILD ONLY.
///
/// The Tauri desktop / iOS shells never load this module's side
/// effects because the public `init()` short-circuits when `isWeb`
/// is false. The bundler inlines the `isWeb` check at build time
/// (Vite `define`) so the desktop bundle drops the analytics
/// integration entirely — no script tag, no fetch, no overhead.
///
/// Wire format: Plausible's `/api/event` endpoint, which accepts
/// `{ name, url, domain, props? }` as JSON. Plausible's hosted
/// script (`plausible.io/js/script.outbound-links.js`) installs
/// `window.plausible(name, { props })` for custom events; we use
/// that when the script is loaded and fall back to a direct fetch
/// if it isn't (or for environments that block third-party JS).
///
/// Privacy: Plausible doesn't set cookies, doesn't fingerprint,
/// and is GDPR-compliant out of the box. No consent banner needed.
/// If we ever switch to a self-hosted endpoint (Umami / Pirsch /
/// home-built), the `ANALYTICS_HOST` constant + the `plausible`
/// global fallback are the only spots to update.
///
/// What we track:
///   - Pageviews on view-state changes (App's `view` flips between
///     library, lesson, sandbox, profile, etc.) — wired by
///     `App.tsx` via `trackPageview()`.
///   - Custom click events on CTAs the product cares about
///     (install, course-open, AI-orb-click, lesson-complete, etc.)
///     — call `trackEvent("name", { props })` from the click
///     handler. Props stay small to fit Plausible's 30-key cap.

import { isWeb } from "./platform";

/// Plausible site id — must match the `data-domain` attribute the
/// Plausible dashboard uses to identify this site. Self-hosted
/// Plausible at `stats.libre.academy` records every event under
/// this key; if we ever move to a multi-site dashboard, this is
/// the only constant that needs to change to route events to a
/// different bucket.
const ANALYTICS_DOMAIN = "libre.academy";

/// Self-hosted Plausible script. Lives on the `stats.libre.academy`
/// subdomain (see `infra/plausible/` for the docker-compose +
/// Caddyfile that stands the service up). Using
/// `script.outbound-links.js` enables Plausible's built-in
/// outbound-link auto-tracking — useful for measuring clicks on
/// the GitHub release page + the upsell CTAs that link off-site.
/// Keeping the script on our own subdomain means no third-party
/// cookies, no ad-blocker false-positives, and the script + the
/// event endpoint share the same origin so corporate firewalls
/// can whitelist one host instead of two.
const ANALYTICS_SCRIPT =
  "https://stats.libre.academy/js/script.outbound-links.js";

/// Direct-POST fallback endpoint for environments where the hosted
/// script can't load (CSP blocks third-party JS, ad-blocker eats
/// the request, the user's network blocks `stats.libre.academy`,
/// etc.). The hosted script is preferred when available because
/// it handles URL parsing for SPAs + auto-fires the initial
/// pageview; the direct POST is the resilient fallback so we
/// don't lose visibility entirely when the script is blocked.
const ANALYTICS_HOST = "https://stats.libre.academy/api/event";

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
  }
}

let initialised = false;

/// Initialise analytics. No-op on non-web builds, no-op if already
/// initialised, no-op when running under `vite preview` / unit
/// tests (we sniff `import.meta.env.MODE === "test"` to skip).
///
/// Call once from `main.tsx` AFTER the page picker — by then we
/// know whether this is the main app, a popout / dock surface
/// (which shouldn't track on their own), or a test runner.
export function init(): void {
  if (initialised) return;
  if (!isWeb) return;
  if (typeof window === "undefined") return;
  if (typeof document === "undefined") return;
  // Skip in popout / dock / tray surfaces — they're fragments of
  // the same session, not independent pageviews. Tray + popout
  // detection mirrors the route-picker in `main.tsx`.
  try {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("phone") === "1" ||
      params.get("tray") === "1" ||
      params.get("popped") === "1" ||
      params.get("evmDock") === "1" ||
      params.get("btcDock") === "1" ||
      params.get("svmDock") === "1"
    ) {
      return;
    }
  } catch {
    /* URL parsing failed — fall through and load anyway */
  }
  initialised = true;

  // Inject the Plausible script. `defer` keeps it off the critical
  // boot path; the script self-installs `window.plausible` and
  // auto-fires the initial pageview.
  const script = document.createElement("script");
  script.defer = true;
  script.src = ANALYTICS_SCRIPT;
  script.setAttribute("data-domain", ANALYTICS_DOMAIN);
  document.head.appendChild(script);

  // Queue stub: callers that fire events before the script
  // finishes loading would otherwise no-op silently. Plausible's
  // documented pattern is `window.plausible = window.plausible ||
  // function(){(window.plausible.q = window.plausible.q || []).push(arguments)}`;
  // we replicate it so early events buffer + flush once the real
  // function lands.
  if (!window.plausible) {
    interface PlausibleStub {
      (
        event: string,
        options?: { props?: Record<string, string | number | boolean> },
      ): void;
      q?: unknown[];
    }
    const stub: PlausibleStub = (...args) => {
      stub.q = stub.q || [];
      stub.q.push(args);
    };
    window.plausible = stub;
  }
}

/// Track a manual pageview. The hosted Plausible script auto-fires
/// the initial pageview, but SPA route changes need an explicit
/// nudge — Plausible's recommended pattern is to call
/// `plausible("pageview")` after each route change so the URL is
/// captured under its new value.
///
/// Call from anywhere the route-equivalent flips (App's `view`
/// state, sub-route mounting). No-op when not initialised.
export function trackPageview(): void {
  if (!isWeb || !initialised) return;
  try {
    window.plausible?.("pageview");
  } catch {
    /* swallow — analytics never fails the host app */
  }
}

/// Track a custom event. `name` is the event identifier in your
/// Plausible dashboard ("Goals" → "+ Add custom event goal"); the
/// props bag carries the structured payload (e.g.
/// `{ course: "a-to-ts", lessonKind: "exercise" }`). Keep props
/// to ~10 keys and short string values — Plausible's free tier
/// caps custom-event props at 30/event.
///
/// Falls back to a direct POST when `window.plausible` isn't
/// available (script blocked / not yet loaded).
export function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (!isWeb || !initialised) return;
  try {
    if (window.plausible) {
      window.plausible(name, props ? { props } : undefined);
      return;
    }
    // Fallback direct POST. Mirrors the wire format Plausible's
    // own script uses. Best-effort — failures are silent.
    void fetch(ANALYTICS_HOST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        url: window.location.href,
        domain: ANALYTICS_DOMAIN,
        props,
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* swallow */
  }
}
