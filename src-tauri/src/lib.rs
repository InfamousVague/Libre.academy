//! Kata Tauri backend.
//!
//! V1 responsibilities are intentionally thin:
//!   - `run_subprocess(lang, code)` — escape hatch when in-browser sandboxes
//!     can't run a language (e.g. Swift). Implemented in Step 9 of PLAN.md.
//!   - Course filesystem access (scan + read course folders under app data dir).
//!   - SQLite for local progress tracking (Step 10).
//!
//! For now we expose a single `greet` command so `invoke('greet')` works from
//! the frontend and the build pipeline is proven end-to-end.

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! Welcome to Kata.")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
