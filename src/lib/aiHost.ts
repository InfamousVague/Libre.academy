/// Helper for the configured AI-assistant host. The phone (and the
/// web build, when wired) talks to a remote Ollama daemon — typically
/// the user's own Mac running on their Tailscale tailnet — instead of
/// the localhost daemon the desktop binary calls via Tauri IPC.
///
/// The host is plain user-config: a Tailscale hostname like
/// `fishbones-mac.tailnet-123.ts.net`, a LAN IP like `192.168.1.42`,
/// or eventually a hosted-relay URL. Persisted in localStorage so it
/// survives launches without round-tripping the cloud-sync path
/// (which we don't want — the host is per-device, your phone and a
/// shared family iPad would target different Macs).

/// Storage key. Single source of truth — every reader / writer
/// imports `STORAGE_KEY` so a future rename here is one-line.
export const STORAGE_KEY = "fishbones:ai-host";

/// Default Ollama HTTP port. Overridable in the configured host
/// string itself if a user runs the daemon on a non-standard port
/// (`fishbones-mac.tailnet.ts.net:11500` works just by including the
/// port in the field).
const DEFAULT_PORT = 11434;

/// Read the configured host from localStorage. Returns `null` when
/// unset OR when localStorage is unavailable (private-mode Safari,
/// SSR, …) — callers should treat null as "not configured" and
/// degrade to a setup banner.
export function readAiHost(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (!v) return null;
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

/// Persist a host. Strips any leading scheme so the saved value is
/// just `<host>[:<port>]` — the consumer assembles the full URL.
/// Empty / whitespace-only values clear the entry.
export function writeAiHost(value: string): void {
  try {
    const cleaned = value
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");
    if (cleaned) {
      localStorage.setItem(STORAGE_KEY, cleaned);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* private-mode — drop the write silently */
  }
}

/// Build a full Ollama HTTP URL from the configured host.
///   `aiHostUrl()`            → `http://<host>:11434`
///   `aiHostUrl("/api/tags")` → `http://<host>:11434/api/tags`
///
/// Scheme is HTTPS when the saved host starts with one (the user can
/// front their Ollama with Caddy / nginx for TLS), HTTP otherwise.
/// Tailscale tailnet hostnames don't have public TLS by default, so
/// http is the right baseline — secure because the tailnet itself is
/// the encrypted layer.
///
/// Returns null when no host is configured so callers can branch
/// without re-implementing the read.
export function aiHostUrl(path = ""): string | null {
  const host = readAiHost();
  if (!host) return null;
  // If the user already typed a port, honour it; otherwise tack on
  // Ollama's default. We don't try to be clever about IPv6 brackets
  // — a literal `[fe80::...]:11434` works because indexOf(":") on
  // the bracketed form returns the position AFTER the closing `]`.
  const hasScheme = /^https?:\/\//i.test(host);
  const scheme = hasScheme ? "" : host.startsWith("https://") ? "" : "http://";
  const stripped = host.replace(/^https?:\/\//i, "");
  const hasPort = (() => {
    // Crude but correct for hostname:port + ipv4:port. IPv6 with port
    // would need brackets, e.g. [::1]:11434 — handle by checking for
    // a `:` AFTER the closing `]`.
    if (stripped.startsWith("[")) {
      const closeIdx = stripped.indexOf("]");
      if (closeIdx < 0) return false;
      return stripped.slice(closeIdx + 1).startsWith(":");
    }
    return stripped.includes(":");
  })();
  const withPort = hasPort ? stripped : `${stripped}:${DEFAULT_PORT}`;
  const cleanPath = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${scheme}${withPort}${cleanPath}`;
}
