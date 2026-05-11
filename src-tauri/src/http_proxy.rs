//! HTTP proxy command for the in-app API tester (TradeDock).
//!
//! TradeDock runs from `http://localhost:1420` in dev and
//! `tauri://localhost` in prod. Both are unusual origins from the
//! perspective of third-party APIs (HelloTrade staging, public REST
//! endpoints, etc.), and those servers do NOT include our origin in
//! `Access-Control-Allow-Origin`. The webview's CORS enforcement
//! then drops the response before JS ever sees it, surfacing as
//! "Origin http://localhost:1420 is not allowed by
//! Access-Control-Allow-Origin" in the console.
//!
//! We can't ask every API the user might point the tester at to
//! whitelist a Tauri origin. Instead this Rust-side proxy makes the
//! request via `reqwest` — server-to-server HTTP, no browser, no
//! CORS — and hands the raw response back to the frontend as a
//! serializable struct.
//!
//! This is deliberately a thin, general-purpose proxy. The
//! TradeDock UI in `src/components/TradeDock/TradeDock.tsx`
//! restricts which URLs end up here in practice (mock mode is the
//! default; live mode is an explicit toggle). We still apply two
//! guardrails server-side:
//!   - Only `http` / `https` schemes (no `file://`, `gopher://`,
//!     etc. — reqwest would happily build a `file://` request if
//!     asked).
//!   - 30s total timeout (long enough for slow staging APIs;
//!     short enough that a hung request can't camp a tokio task).
//!
//! Response bodies are returned as a UTF-8 string. Binary payloads
//! get lossy-converted (replacement char for invalid sequences) —
//! the API tester is a JSON/text tool, downloading binaries was
//! never the intent.

use std::collections::HashMap;
use std::time::Duration;

use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use reqwest::Method;
use serde::{Deserialize, Serialize};

/// Wire-format response handed back to the frontend. Field names
/// match what `TradeDock`'s `RestState` expects so the existing
/// `setState({...})` call doesn't need any reshaping.
#[derive(Debug, Serialize)]
pub struct ProxyResponse {
    pub status: u16,
    #[serde(rename = "statusText")]
    pub status_text: String,
    pub headers: HashMap<String, String>,
    pub body: String,
}

/// Input shape from the frontend. `headers` is optional so the
/// caller can omit it for no-header GETs without sending `null`.
#[derive(Debug, Deserialize)]
pub struct ProxyRequest {
    pub method: String,
    pub url: String,
    #[serde(default)]
    pub headers: HashMap<String, String>,
    #[serde(default)]
    pub body: Option<String>,
}

/// Fire the request, return the response — or a string error
/// describing what blew up (DNS failure, TLS handshake, timeout,
/// invalid header value, etc.). The frontend distinguishes "got a
/// non-2xx response" (still a successful proxy call) from "couldn't
/// reach the server" (Err) the same way as a browser `fetch`: the
/// former returns the response with the bad status code; the latter
/// rejects.
#[tauri::command]
pub async fn proxy_http(req: ProxyRequest) -> Result<ProxyResponse, String> {
    // ── Scheme + method validation ────────────────────────────────
    //
    // Parse the URL first so we can reject anything that isn't
    // `http(s)`. reqwest would attempt `file://` requests otherwise,
    // which would let renderer code read local files via the proxy
    // — a real cross-context capability leak even though TradeDock
    // never asks for it.
    let parsed = url::Url::parse(&req.url)
        .map_err(|e| format!("invalid URL: {e}"))?;
    match parsed.scheme() {
        "http" | "https" => {}
        other => return Err(format!("unsupported URL scheme: {other}")),
    }

    let method = Method::from_bytes(req.method.as_bytes())
        .map_err(|e| format!("invalid HTTP method '{}': {e}", req.method))?;

    // ── Headers ───────────────────────────────────────────────────
    //
    // Build a HeaderMap from the flat string map. Skip entries with
    // empty names (would error during HeaderName::try_from); error
    // on malformed names or non-ASCII values so the user gets a
    // clear message instead of a silently-dropped header.
    let mut header_map = HeaderMap::new();
    for (name, value) in &req.headers {
        let trimmed = name.trim();
        if trimmed.is_empty() {
            continue;
        }
        let hname = HeaderName::from_bytes(trimmed.as_bytes())
            .map_err(|e| format!("invalid header name '{trimmed}': {e}"))?;
        let hval = HeaderValue::from_str(value)
            .map_err(|e| format!("invalid value for header '{trimmed}': {e}"))?;
        header_map.insert(hname, hval);
    }

    // ── Client ────────────────────────────────────────────────────
    //
    // Build a fresh client per call. We could cache one in app
    // state, but the API tester is interactive (one request per
    // user click), so the construction cost (a few ms) is dwarfed
    // by the network round-trip — and a per-call client keeps the
    // timeout / redirect policy self-contained without a State<>
    // parameter on the command.
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        // Follow redirects by default — matches browser fetch's
        // default `redirect: "follow"`. The tester is for
        // exploring third-party APIs, most of which do at least
        // one redirect (host → host with trailing slash, http →
        // https, etc.). Capped at 10 to prevent loops.
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| format!("failed to build HTTP client: {e}"))?;

    let mut builder = client.request(method, parsed).headers(header_map);

    // ── Body ──────────────────────────────────────────────────────
    //
    // GET/HEAD/DELETE traditionally don't carry a body, but some
    // APIs (Elasticsearch, certain WebDAV ops) accept one. We
    // honor whatever the caller hands us — TradeDock's UI already
    // restricts the body field for GET/DELETE on the frontend
    // side, so by the time a request reaches this command the
    // body is intentional.
    if let Some(body) = req.body {
        if !body.is_empty() {
            builder = builder.body(body);
        }
    }

    let resp = builder
        .send()
        .await
        .map_err(|e| format!("request failed: {e}"))?;

    // ── Response ──────────────────────────────────────────────────
    let status = resp.status();
    let status_code = status.as_u16();
    // canonical_reason returns None for non-standard codes (e.g.
    // 418 has one, 599 doesn't). Fall back to the numeric code so
    // the UI always has something to render.
    let status_text = status
        .canonical_reason()
        .map(|s| s.to_string())
        .unwrap_or_else(|| status_code.to_string());

    let mut out_headers = HashMap::new();
    for (k, v) in resp.headers().iter() {
        // Multi-value headers (Set-Cookie, etc.) collapse to the
        // last one — same lossy behavior the browser's Headers
        // object exposes via `forEach`. Sufficient for an API
        // tester; if we ever surface raw cookie inspection we'd
        // upgrade this to Vec<String>.
        out_headers.insert(
            k.as_str().to_string(),
            v.to_str().unwrap_or("").to_string(),
        );
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("failed to read response body: {e}"))?;
    let body = String::from_utf8_lossy(&bytes).into_owned();

    Ok(ProxyResponse {
        status: status_code,
        status_text,
        headers: out_headers,
        body,
    })
}
