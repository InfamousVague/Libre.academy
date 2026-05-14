import { openExternal } from "./openExternal";

/// Install a global click interceptor that routes every external
/// link click through `openExternal()` (which opens in the OS default
/// browser on desktop, or a new tab via `window.open` on web).
///
/// Background. The desktop Tauri WebView has no back button + no tab
/// bar — once it navigates to a third-party URL, the user is trapped
/// outside the app until they quit + relaunch. Same trap (milder)
/// exists on the web SPA: a same-tab `<a href="https://github.com/…">`
/// click drops the user on github.com with the browser back button
/// as their only escape, and pressing back means a cold IndexedDB
/// re-seed + bundle parse before they can resume. We want every
/// external click to leave the current surface intact.
///
/// Why a global interceptor (vs. wrapping every `<a>`). A wrapper
/// component would work in principle but the app already has dozens
/// of hardcoded `<a href target="_blank">` JSX sites, every lesson's
/// markdown-it output renders raw `<a>` tags via
/// `dangerouslySetInnerHTML`, and AI chat messages stream HTML that
/// can include links. Auditing + retrofitting every render path is
/// fragile + easy to regress. A document-level capture-phase listener
/// catches every link click regardless of who rendered the anchor
/// or how — JSX, markdown HTML, third-party libraries, future code.
///
/// Phasing. Capture phase on `document` runs BEFORE any element-level
/// bubble-phase handler. We `preventDefault` + `stopPropagation` after
/// dispatching, so downstream handlers (e.g. AiChatPanel's
/// scroller-level click listener) don't also try to open the same
/// URL. Internal hrefs (`libre://`, in-page anchors, same-origin SPA
/// routes) are deliberately left untouched so React Router and the
/// in-app `libre:` scheme keep working.
///
/// Modifier keys + middle-click. We treat every external link click
/// the same way: send it to the OS browser. On desktop there's no
/// in-app concept of "new tab", so cmd/ctrl/shift/middle-click would
/// otherwise either no-op or pop a new WebView window — neither is
/// the user's intent. On web, `openExternal` already maps to
/// `window.open(_blank)` which IS a new tab — equivalent to cmd-click.
/// To catch middle-click we also listen for `auxclick`.
///
/// Idempotent — calling more than once is a no-op (returns the same
/// detach fn). The caller in `main.tsx` only invokes once at boot.
let installed = false;
let detach: (() => void) | null = null;

export function installLinkInterceptor(): () => void {
  if (installed && detach) return detach;
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const handler = (ev: MouseEvent) => {
    // Don't fight upstream handlers that already claimed the event
    // (e.g. a React component that calls `preventDefault()` to
    // implement a custom action on its own link). If something
    // upstream wanted to swallow the click, respect that.
    if (ev.defaultPrevented) return;
    // Right-clicks are context-menu intents, not navigation —
    // leave them alone so the OS / browser native menu still works.
    if (ev.button === 2) return;

    // Walk up to the nearest anchor in case the click landed on a
    // child (e.g. `<code>` inside the link text, an inline `<img>`,
    // markdown's `<strong>`, etc.). `closest("a[href]")` handles
    // the case cleanly + ignores `<a>` tags without an href
    // (decorative anchors, in-page jump targets without value).
    const target = ev.target as Element | null;
    if (!target || typeof target.closest !== "function") return;
    const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return;

    const rawHref = anchor.getAttribute("href");
    if (!rawHref) return;

    // In-page anchors (`#section`) — leave to the browser's native
    // scroll-to-id behaviour. `javascript:` and `data:` schemes are
    // either dev hacks or attempted XSS; not our problem here, but
    // explicitly not "open externally". Empty hrefs are no-ops.
    if (
      rawHref.startsWith("#") ||
      rawHref.startsWith("javascript:") ||
      rawHref.startsWith("data:") ||
      rawHref.startsWith("blob:")
    ) {
      return;
    }

    // Custom in-app scheme — AiChatPanel's scroller-level listener
    // routes these to React's event bus (libre:open-course /
    // libre:open-lesson). Don't preventDefault, don't stopPropagation
    // — let it bubble to AiChatPanel's bubble-phase handler.
    if (rawHref.startsWith("libre://")) return;

    // Schemes that ALWAYS belong to the OS, regardless of origin:
    // mailto:, tel:, sms:, mailto:?... etc. Resolve via openExternal
    // so the system mail / phone / messages app handles them. Without
    // this branch, mailto: gets parsed below as "same origin" (no
    // origin to compare against) and the URL parser throws.
    if (
      rawHref.startsWith("mailto:") ||
      rawHref.startsWith("tel:") ||
      rawHref.startsWith("sms:")
    ) {
      ev.preventDefault();
      ev.stopPropagation();
      void openExternal(rawHref);
      return;
    }

    // Resolve relative URLs against the current location so we can
    // compare origins reliably. `new URL(rel, base)` is the spec-
    // correct way; bare `new URL(rel)` would throw on anything
    // without a scheme.
    let url: URL;
    try {
      url = new URL(rawHref, window.location.href);
    } catch {
      // Unparseable href — leave it alone, the browser will fail
      // the same way it would have without us.
      return;
    }

    // Tauri serves the app at `tauri://localhost` (or `https://tauri.
    // localhost` on Windows). The web build serves at the deployed
    // origin (e.g. `https://libre.academy`). In either case,
    // same-origin http(s) URLs are SPA navigation — let React Router
    // / the browser handle them. Different-origin OR non-http(s)
    // schemes are external and get the openExternal treatment.
    const isHttpish = url.protocol === "http:" || url.protocol === "https:";
    const isSameOrigin = url.origin === window.location.origin;
    if (isHttpish && isSameOrigin) return;

    // External. Block the default navigation (which on Tauri would
    // navigate the WebView itself + trap the user), stop the event
    // from bubbling to downstream handlers (so AiChatPanel's
    // scroller-level handler doesn't ALSO openUrl on the same href),
    // and shell out to the OS / new tab.
    ev.preventDefault();
    ev.stopPropagation();
    void openExternal(url.href);
  };

  // Capture phase so we run before any element-level bubble-phase
  // listener (AiChatPanel's, third-party libraries', etc.). `auxclick`
  // catches middle-click — same treatment.
  document.addEventListener("click", handler, true);
  document.addEventListener("auxclick", handler, true);

  installed = true;
  detach = () => {
    document.removeEventListener("click", handler, true);
    document.removeEventListener("auxclick", handler, true);
    installed = false;
    detach = null;
  };
  return detach;
}
