//! Top-level router.
//!
//! The Libre routes live under `/libre/` so the same host
//! (`api.mattssoftware.com`) can serve other APIs alongside this one
//! without collisions. Public endpoints (signup, login, the OAuth
//! start/callback dance, the public course feed) are merged at the
//! top; authenticated endpoints get the bearer-token middleware via
//! `route_layer`. `/health` and the Apple `.well-known` file stay at
//! the literal root — health is cheap to leave there for monitoring,
//! and Apple insists on the root path for domain verification.
//!
//! Endpoint summary:
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
//!   GET    /health                                   — liveness (root)
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
    let public = Router::new()
        .route("/health", get(health_check))
        .route("/libre/auth/signup", post(auth::signup))
        .route("/libre/auth/login", post(auth::login))
        // Password-reset request + confirm. Both endpoints are
        // unauthenticated — the request endpoint is gated by email
        // ownership (you only get the token if you can read the
        // inbox), the confirm endpoint by possession of that token.
        // The request handler always returns 204 regardless of
        // whether the email is registered, to avoid enumeration.
        .route(
            "/libre/auth/password-reset/request",
            post(auth::password_reset_request),
        )
        .route(
            "/libre/auth/password-reset/confirm",
            post(auth::password_reset_confirm),
        )
        // Direct id_token paths — clients call these when they have a
        // native-SDK token in hand.
        .route("/libre/auth/apple", post(auth::apple))
        .route("/libre/auth/google", post(auth::google))
        // Browser-OAuth start endpoints. Desktop opens these in the
        // system browser; the `start` redirects to the provider, the
        // provider redirects back to `callback`, and the callback
        // redirects into `libre://oauth/done?token=…`.
        .route(
            "/libre/auth/google/start",
            get(oauth_flow::google_start),
        )
        .route(
            "/libre/auth/google/callback",
            get(oauth_flow::google_callback),
        )
        .route(
            "/libre/auth/apple/start",
            get(oauth_flow::apple_start),
        )
        // Apple uses `response_mode=form_post`; tolerate GET too for
        // dev-mode hand-built URLs.
        .route(
            "/libre/auth/apple/callback",
            post(oauth_flow::apple_callback_post).get(oauth_flow::apple_callback_get),
        )
        .route("/libre/courses/public", get(courses::list_public))
        // Real-time sync WebSocket. Auth lives in the `?token=…`
        // query param (browsers can't set headers on a WS upgrade)
        // so this route stays in the public group; the handler
        // verifies the bearer before completing the upgrade.
        .route("/libre/sync/ws", get(sync::ws_upgrade))
        // Apple domain verification — must live at the literal root
        // path Apple fetches.
        .route(
            "/.well-known/apple-developer-domain-association.txt",
            get(well_known::apple_domain_association),
        );

    let protected = Router::new()
        .route("/libre/me", get(auth::me))
        .route("/libre/auth/logout", post(auth::logout))
        .route("/libre/auth/account", delete(auth::delete_account))
        .route(
            "/libre/progress",
            get(progress::list)
                .put(progress::upsert)
                .delete(progress::clear),
        )
        .route(
            "/libre/solutions",
            get(sync::list_solutions).put(sync::upsert_solutions),
        )
        .route(
            "/libre/settings",
            get(sync::list_settings).put(sync::upsert_settings),
        )
        .route(
            "/libre/courses",
            get(courses::list_mine).post(courses::upload),
        )
        .route(
            "/libre/courses/:id",
            get(courses::download).delete(courses::delete_course),
        )
        .route_layer(axum_middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ));

    public
        .merge(protected)
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
