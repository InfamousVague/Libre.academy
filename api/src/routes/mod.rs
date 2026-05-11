//! Top-level router.
//!
//! Every product endpoint is registered under BOTH `/fishbones/...`
//! (the legacy prefix) AND `/libre/...` (the new prefix) so the
//! brand-rename cutover is backward-compatible: already-deployed
//! clients keep hitting `/fishbones/*`, new client builds switch to
//! `/libre/*`, and both work simultaneously against the same handler.
//! Public endpoints (signup, login, OAuth start/callback, public
//! course feed) and protected endpoints (everything that needs a
//! bearer token) are each defined once as inner routers, then mounted
//! twice via `Router::nest`. `/health` and Apple's `.well-known` file
//! stay at the literal root — health is the uptime monitor's path
//! and Apple insists on the root for domain verification.
//!
//! Endpoint summary (each available under BOTH `/fishbones/<path>`
//! and `/libre/<path>` — only one prefix shown):
//!   POST   /libre/auth/signup                    — email + password
//!   POST   /libre/auth/login                     — email + password
//!   POST   /libre/auth/password-reset/request    — email link
//!   POST   /libre/auth/password-reset/confirm    — token + new password
//!   POST   /libre/auth/apple                     — Apple identity_token
//!   POST   /libre/auth/google                    — Google id_token
//!   GET    /libre/auth/google/start              — browser OAuth
//!   GET    /libre/auth/google/callback           — provider redirect
//!   GET    /libre/auth/apple/start               — browser OAuth
//!   POST   /libre/auth/apple/callback            — provider form_post
//!   GET    /libre/auth/apple/callback            —   (also tolerated)
//!   GET    /libre/me                             — current user
//!   POST   /libre/auth/logout                    — revoke this device
//!   DELETE /libre/auth/account                   — delete account
//!   GET    /libre/progress                       — full dump
//!   PUT    /libre/progress                       — bulk upsert
//!   GET    /libre/solutions                      — full dump
//!   PUT    /libre/solutions                      — bulk upsert (LWW)
//!   GET    /libre/settings                       — full dump
//!   PUT    /libre/settings                       — bulk upsert (LWW)
//!   GET    /libre/sync/ws?token=…                — realtime fan-out
//!   POST   /libre/courses                        — upload .libre
//!   GET    /libre/courses                        — own courses
//!   GET    /libre/courses/public                 — public feed
//!   GET    /libre/courses/:id                    — download archive
//!   DELETE /libre/courses/:id                    — delete
//!   GET    /health                                — liveness (root)
//!   GET    /.well-known/apple-developer-domain-association.txt (root)

mod auth;
mod courses;
mod middleware;
mod oauth;
mod oauth_flow;
mod progress;
mod sync;
mod well_known;

pub use middleware::auth_middleware;

use axum::{
    middleware as axum_middleware,
    routing::{delete, get, post},
    Json, Router,
};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use crate::state::AppState;

/// Build the full router. CORS is permissive — Caddy is the only thing
/// in front of us and the desktop / web clients cross-origin against
/// this server, so blocking origins here would just create false
/// negatives.
pub fn build_router(state: Arc<AppState>) -> Router {
    // Public + protected route groups defined ONCE under a relative
    // prefix-less layout (`/auth/signup`, `/me`, `/progress` etc.).
    // Each group is then mounted under BOTH `/fishbones` and `/libre`
    // path prefixes so old + new clients hit the same handlers.
    //
    // Backward-compat cutover plan:
    //   1. (this commit) Server registers BOTH prefixes — old
    //      `/fishbones/*` clients keep working, new `/libre/*`
    //      clients start working.
    //   2. Roll out client builds that call `/libre/*`. Older
    //      already-deployed clients (TestFlight, cached web tabs)
    //      keep calling `/fishbones/*` against the same server and
    //      keep working.
    //   3. Once telemetry shows the `/fishbones/*` traffic has
    //      drained (TestFlight expired, every prod web user has
    //      reloaded), drop the `/fishbones` mount and ship a
    //      slimmer server. `/libre/*` becomes the sole prefix.
    //
    // The /health route + /.well-known/apple-developer-domain-
    // association.txt stay at the literal root — they're not
    // namespaced by product (`/health` is the uptime monitor's
    // path; Apple fetches the well-known path verbatim).
    let public_endpoints = || {
        Router::new()
            .route("/auth/signup", post(auth::signup))
            .route("/auth/login", post(auth::login))
            // Password-reset request + confirm. Both endpoints are
            // unauthenticated — the request endpoint is gated by email
            // ownership (you only get the token if you can read the
            // inbox), the confirm endpoint by possession of that token.
            // The request handler always returns 204 regardless of
            // whether the email is registered, to avoid enumeration.
            .route(
                "/auth/password-reset/request",
                post(auth::password_reset_request),
            )
            .route(
                "/auth/password-reset/confirm",
                post(auth::password_reset_confirm),
            )
            // Direct id_token paths — clients call these when they have a
            // native-SDK token in hand.
            .route("/auth/apple", post(auth::apple))
            .route("/auth/google", post(auth::google))
            // Browser-OAuth start endpoints. Desktop opens these in the
            // system browser; the `start` redirects to the provider, the
            // provider redirects back to `callback`, and the callback
            // redirects into `libre://oauth/done?token=…`.
            .route("/auth/google/start", get(oauth_flow::google_start))
            .route(
                "/auth/google/callback",
                get(oauth_flow::google_callback),
            )
            .route("/auth/apple/start", get(oauth_flow::apple_start))
            // Apple uses `response_mode=form_post`; tolerate GET too for
            // dev-mode hand-built URLs.
            .route(
                "/auth/apple/callback",
                post(oauth_flow::apple_callback_post).get(oauth_flow::apple_callback_get),
            )
            .route("/courses/public", get(courses::list_public))
            // Real-time sync WebSocket. Auth lives in the `?token=…`
            // query param (browsers can't set headers on a WS upgrade)
            // so this route stays in the public group; the handler
            // verifies the bearer before completing the upgrade.
            .route("/sync/ws", get(sync::ws_upgrade))
    };

    let protected_endpoints = || {
        Router::new()
            .route("/me", get(auth::me))
            .route("/auth/logout", post(auth::logout))
            .route("/auth/account", delete(auth::delete_account))
            .route(
                "/progress",
                get(progress::list)
                    .put(progress::upsert)
                    .delete(progress::clear),
            )
            .route(
                "/solutions",
                get(sync::list_solutions).put(sync::upsert_solutions),
            )
            .route(
                "/settings",
                get(sync::list_settings).put(sync::upsert_settings),
            )
            .route(
                "/courses",
                get(courses::list_mine).post(courses::upload),
            )
            .route(
                "/courses/:id",
                get(courses::download).delete(courses::delete_course),
            )
            .route_layer(axum_middleware::from_fn_with_state(
                state.clone(),
                auth_middleware,
            ))
    };

    let root = Router::new()
        .route("/health", get(health_check))
        .route(
            "/.well-known/apple-developer-domain-association.txt",
            get(well_known::apple_domain_association),
        );

    root
        // Each group is mounted twice — once under the legacy prefix
        // and once under the new prefix. The closures above return a
        // fresh Router each call so we don't share routing state
        // between the two mounts.
        .nest("/fishbones", public_endpoints())
        .nest("/fishbones", protected_endpoints())
        .nest("/libre", public_endpoints())
        .nest("/libre", protected_endpoints())
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

/// GET /health — public liveness endpoint. Same shape as Tap's so any
/// existing uptime-monitor wiring keeps working.
async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "relay": "ok",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}
