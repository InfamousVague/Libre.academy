/// Single source for "open this URL outside the app".
///
/// On desktop (Tauri) we shell out to the OS via
/// `@tauri-apps/plugin-opener`'s `openUrl` so the user's default
/// browser handles it. On web the same plugin import resolves to the
/// stub in `lib/tauri-stubs/plugin-opener.ts`, which falls back to
/// `window.open(url, "_blank", "noopener,noreferrer")` — a new tab,
/// not a same-tab navigation, so the SPA's React/IndexedDB state
/// stays alive.
///
/// Why this matters: the desktop WebView is a one-window-no-back-
/// button surface. If we let the WebView navigate to an external
/// URL, the user is trapped on the external site with no way to
/// return to the app short of quitting + relaunching. Same trap
/// (less severe but still annoying) exists on web — same-tab
/// navigation to a third-party site means losing in-flight editor
/// state + restarting the SPA cold on back-button. Routing every
/// external click through here side-steps both.
///
/// Returns once the openUrl promise settles (or immediately if the
/// dynamic import fails and we fall back to `window.open`).
/// Callers can `void openExternal(href)` — there's nothing useful
/// to await on.
export async function openExternal(url: string): Promise<void> {
  try {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
  } catch {
    // Last-resort fallback for the rare case the dynamic import
    // itself blows up (chunk fetch failure, stub mis-resolved on
    // an unusual platform target, etc.). A `_blank` window is still
    // better than swallowing the click.
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }
}
