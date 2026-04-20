//! In-app PDF ingest plumbing.
//!
//! The frontend picks a file via the Tauri dialog plugin, then calls
//! `extract_pdf_text(path)` which shells out to the system `pdftotext`
//! (poppler-utils). We return the raw text; the frontend (TypeScript)
//! handles chapter / section splitting using the same logic as the standalone
//! ingest CLI. This keeps the parsing code in one language.
//!
//! If `pdftotext` isn't installed we return a clear error so the UI can
//! show a one-click-install hint.

use std::process::Command;

#[derive(Debug, serde::Serialize)]
pub struct ExtractResult {
    pub text: String,
    /// Populated when pdftotext isn't on PATH so the UI can prompt the user.
    pub error: Option<String>,
}

#[tauri::command]
pub fn extract_pdf_text(path: String) -> ExtractResult {
    // -layout preserves column boundaries + form feeds (chapter breaks) which
    // the downstream parser relies on.
    let output = match Command::new("pdftotext")
        .arg("-layout")
        .arg(&path)
        .arg("-") // write to stdout
        .output()
    {
        Ok(o) => o,
        Err(e) => {
            let hint = if e.kind() == std::io::ErrorKind::NotFound {
                "pdftotext not found on PATH — install poppler-utils first (on macOS: `brew install poppler`).".to_string()
            } else {
                format!("failed to launch pdftotext: {e}")
            };
            return ExtractResult { text: String::new(), error: Some(hint) };
        }
    };

    if !output.status.success() {
        return ExtractResult {
            text: String::new(),
            error: Some(format!(
                "pdftotext exited with status {}: {}",
                output.status,
                String::from_utf8_lossy(&output.stderr)
            )),
        };
    }

    ExtractResult {
        text: String::from_utf8_lossy(&output.stdout).into_owned(),
        error: None,
    }
}
