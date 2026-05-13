/// Per-route SEO meta updater.
///
/// Libre is a single-page app — index.html ships one static SEO
/// block (see the head of `index.html`) and every in-app route
/// renders against the same HTML shell. To get per-route titles,
/// descriptions, and canonical URLs (so a learner sharing
/// "/?view=library" gets a meaningful unfurl on Slack / Discord
/// / iMessage), we update `document.title` + the runtime meta
/// tags from a useEffect that runs on the matching view.
///
/// Call this from any view component with the route's title +
/// short description; the hook handles the rest. On unmount /
/// route change it restores the previous values, so popping back
/// out of a deep page (e.g. closing a lesson tab) doesn't leave
/// the wrong title sticking in the browser tab.
///
/// Safe on every build target. The `document` access is gated by
/// a typeof check so SSR-style tooling (vitest-jsdom, Vite preview
/// pre-renders) doesn't crash.

import { useEffect } from "react";

interface MetaInput {
  /// Page title — becomes `<title>` text + the og:title /
  /// twitter:title fallbacks. Should be human-readable; the hook
  /// prepends the brand suffix so callers can pass the bare title
  /// ("A to TS · Functions") and not have to remember the suffix
  /// convention.
  title: string;
  /// Short description — set on `<meta name="description">` and the
  /// og / twitter description tags. Aim for ~140 chars; Google
  /// truncates descriptions past ~155.
  description?: string;
  /// Canonical URL for this view. If omitted, falls back to
  /// `window.location.href` (preserves query-string state so deep
  /// links to specific lessons share cleanly).
  canonical?: string;
  /// Optional og:image override — useful for course pages (book
  /// covers) and certificate pages (the certificate ticket image).
  /// When omitted the index.html default image stays in place.
  image?: string;
}

const TITLE_SUFFIX = " · Libre.academy";

/// Set `<title>` + the SEO meta tags for the current view. Reverts
/// on cleanup so navigation between views doesn't leak stale
/// metadata into surfaces that don't call the hook themselves.
export function useMeta(meta: MetaInput | null | undefined): void {
  useEffect(() => {
    if (!meta) return;
    if (typeof document === "undefined") return;

    const prevTitle = document.title;
    // `null` so we can restore the empty-content state on cleanup
    // if a tag didn't previously exist (instead of leaving our
    // injected value behind).
    const prev: Record<string, string | null> = {};

    document.title = meta.title.endsWith(TITLE_SUFFIX)
      ? meta.title
      : `${meta.title}${TITLE_SUFFIX}`;

    const updates: Array<[
      string,
      "name" | "property",
      string | undefined,
    ]> = [
      ["description", "name", meta.description],
      ["og:title", "property", meta.title],
      ["og:description", "property", meta.description],
      ["og:url", "property", meta.canonical ?? window.location.href],
      ["og:image", "property", meta.image],
      ["twitter:title", "name", meta.title],
      ["twitter:description", "name", meta.description],
      ["twitter:image", "name", meta.image],
    ];

    for (const [key, attr, value] of updates) {
      if (value == null) continue;
      const tag = upsertMeta(key, attr);
      prev[key] = tag.getAttribute("content");
      tag.setAttribute("content", value);
    }

    if (meta.canonical) {
      const link =
        (document.querySelector("link[rel=canonical]") as HTMLLinkElement | null) ??
        appendLink("canonical");
      prev["link:canonical"] = link.getAttribute("href");
      link.setAttribute("href", meta.canonical);
    }

    return () => {
      document.title = prevTitle;
      for (const [key, attr] of updates) {
        if (prev[key] == null) continue;
        const tag = document.querySelector(`meta[${attr}="${key}"]`);
        if (tag) tag.setAttribute("content", prev[key] ?? "");
      }
      if (prev["link:canonical"] != null) {
        const link = document.querySelector(
          "link[rel=canonical]",
        ) as HTMLLinkElement | null;
        if (link) link.setAttribute("href", prev["link:canonical"]);
      }
    };
  }, [
    meta?.title,
    meta?.description,
    meta?.canonical,
    meta?.image,
  ]);
}

/// Find an existing meta tag or create one. Tags can be keyed by
/// either `name` (description / twitter:*) or `property` (og:*) —
/// the attribute is the second arg.
function upsertMeta(
  key: string,
  attr: "name" | "property",
): HTMLMetaElement {
  let tag = document.querySelector(
    `meta[${attr}="${key}"]`,
  ) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  return tag;
}

function appendLink(rel: string): HTMLLinkElement {
  const link = document.createElement("link");
  link.setAttribute("rel", rel);
  document.head.appendChild(link);
  return link;
}
