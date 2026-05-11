//! Progress sync endpoints.
//!
//! Bidirectional sync semantics:
//! - GET returns every completion the API knows about for this user.
//!   The client merges into its local SQLite (keeping whichever
//!   `completed_at` is newer per (course_id, lesson_id) key).
//! - PUT accepts the full local list and upserts; the SQL helper
//!   already keeps the newer `completed_at` on conflict, so this is
//!   commutative across multiple devices syncing in any order.

use axum::{extract::State, http::StatusCode, Extension, Json};
use serde::Deserialize;
use std::sync::Arc;

use super::middleware::UserId;
use crate::db::ProgressRow;
use crate::state::AppState;
use crate::sync_bus::SyncEvent;

pub async fn list(
    State(state): State<Arc<AppState>>,
    Extension(UserId(user_id)): Extension<UserId>,
) -> Result<Json<Vec<ProgressRow>>, StatusCode> {
    state
        .db
        .list_progress(&user_id)
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[derive(Deserialize)]
pub struct UpsertBody {
    pub rows: Vec<ProgressRow>,
}

pub async fn upsert(
    State(state): State<Arc<AppState>>,
    Extension(UserId(user_id)): Extension<UserId>,
    Json(body): Json<UpsertBody>,
) -> Result<StatusCode, StatusCode> {
    if body.rows.len() > 5000 {
        // Cap the bulk size so a single request can't lock the db for
        // minutes. Clients with bigger histories should chunk.
        return Err(StatusCode::PAYLOAD_TOO_LARGE);
    }
    state
        .db
        .upsert_progress(&user_id, &body.rows)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    // Fan out to every other device this user has online. The
    // upsert helper doesn't return the diffed-applied set (progress
    // already merges via SQL `MAX`), so we forward the incoming rows
    // verbatim — receivers idempotently fold them into their local
    // store keyed by (course, lesson) so a no-op echo is harmless.
    if !body.rows.is_empty() {
        state
            .sync_bus
            .publish(&user_id, SyncEvent::Progress { rows: body.rows });
    }
    Ok(StatusCode::NO_CONTENT)
}

/// DELETE /fishbones/progress — wipes every completion row for this
/// user. Triggered by the desktop "Start fresh" Settings action; the
/// client paired wipe (local SQLite / IDB + cached state) runs in
/// parallel so the local + remote views converge to empty on this
/// device. Other devices pick up the empty state on their next GET
/// pull or full re-sign-in; we DON'T publish a SyncEvent here today
/// (no `progress_cleared` variant yet) so a connected sibling device
/// could re-fill the rows via its next bulk push. Adding a fan-out
/// variant is a follow-up — the user surfaces the limitation via the
/// "sign out + back in on each device" guidance in the reset toast.
///
/// Idempotent: rerunning when there are no rows returns 204 cleanly.
pub async fn clear(
    State(state): State<Arc<AppState>>,
    Extension(UserId(user_id)): Extension<UserId>,
) -> Result<StatusCode, StatusCode> {
    state
        .db
        .clear_progress(&user_id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}
