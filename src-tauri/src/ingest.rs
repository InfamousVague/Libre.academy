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
use serde::Serialize;
use tauri::Manager;

#[derive(Debug, serde::Serialize)]
pub struct ExtractResult {
    pub text: String,
    /// Populated when pdftotext isn't on PATH so the UI can prompt the user.
    pub error: Option<String>,
}

#[derive(Debug, serde::Serialize)]
pub struct StatResult {
    pub bytes: u64,
}

#[derive(Debug, serde::Serialize)]
pub struct ExtractImagesResult {
    /// Relative file names (not full paths) of the images that were written
    /// into `dest_dir`. Ordered by page, then by position on page — the
    /// pipeline's prose can reference them as figure-N.ext if it wants a
    /// stable identifier.
    pub images: Vec<String>,
    /// Directory the images were written to. Absolute path.
    pub dir: String,
    /// Populated when `pdfimages` isn't available on PATH so the UI can
    /// prompt the user to install poppler-utils.
    pub error: Option<String>,
}

/// Cheap metadata read for the ingest progress UI so we can show "reading
/// 142 MB PDF" before handing off to pdftotext (which otherwise runs silent
/// for tens of seconds on large books).
#[tauri::command]
pub fn stat_file(path: String) -> Result<StatResult, String> {
    match std::fs::metadata(&path) {
        Ok(m) => Ok(StatResult { bytes: m.len() }),
        Err(e) => Err(format!("stat {path}: {e}")),
    }
}

/// Extract every image embedded in the PDF into `dest_dir`, using the
/// `pdfimages` binary (poppler-utils) with `-all` so native-format (PNG,
/// JPEG, etc.) images come through without a lossy re-encode. Returns the
/// list of written filenames so the ingest pipeline can reference them
/// from lesson markdown.
///
/// Runs as a Tauri command rather than a Node subprocess because the
/// pipeline runs inside the webview and can't shell out directly; the same
/// reason `extract_pdf_text` lives here.
#[tauri::command]
pub fn extract_pdf_images(
    app: tauri::AppHandle,
    path: String,
    book_id: String,
) -> ExtractImagesResult {
    // Images live inside the same ingest-cache tree the pipeline already
    // uses, so clearing a book's cache nukes its images too. Per-book dir
    // keeps the cache browsable if someone opens it in Finder.
    let dest_dir: String = match app.path().app_data_dir() {
        Ok(d) => d
            .join("ingest-cache")
            .join(&book_id)
            .join("images")
            .to_string_lossy()
            .into_owned(),
        Err(e) => {
            return ExtractImagesResult {
                images: Vec::new(),
                dir: String::new(),
                error: Some(format!("couldn't resolve app data dir: {e}")),
            };
        }
    };
    if let Err(e) = std::fs::create_dir_all(&dest_dir) {
        return ExtractImagesResult {
            images: Vec::new(),
            dir: dest_dir,
            error: Some(format!("couldn't create dest dir: {e}")),
        };
    }
    // `-all` writes each image in its native format with a `-N-M` suffix
    // (page-index, per-page-index). `img` is the filename prefix we
    // strip when building the returned list.
    let prefix = "img";
    let output = match Command::new("pdfimages")
        .arg("-all")
        .arg(&path)
        .arg(format!("{dest_dir}/{prefix}"))
        .output()
    {
        Ok(o) => o,
        Err(e) => {
            let hint = if e.kind() == std::io::ErrorKind::NotFound {
                "pdfimages not found on PATH — install poppler-utils first (on macOS: `brew install poppler`).".to_string()
            } else {
                format!("failed to launch pdfimages: {e}")
            };
            return ExtractImagesResult {
                images: Vec::new(),
                dir: dest_dir,
                error: Some(hint),
            };
        }
    };
    if !output.status.success() {
        return ExtractImagesResult {
            images: Vec::new(),
            dir: dest_dir,
            error: Some(format!(
                "pdfimages exited with status {}: {}",
                output.status,
                String::from_utf8_lossy(&output.stderr)
            )),
        };
    }

    // Read the dir and return everything matching our prefix, sorted for a
    // stable reference order across runs. We don't filter by extension —
    // `pdfimages -all` can emit PNG, JPG, TIFF, JBIG2, etc depending on
    // what's embedded; downstream consumers get to decide what's renderable.
    let mut images: Vec<String> = match std::fs::read_dir(&dest_dir) {
        Ok(entries) => entries
            .filter_map(|e| e.ok())
            .filter_map(|e| e.file_name().into_string().ok())
            .filter(|n| n.starts_with(prefix))
            .collect(),
        Err(e) => {
            return ExtractImagesResult {
                images: Vec::new(),
                dir: dest_dir,
                error: Some(format!("couldn't list dest dir: {e}")),
            };
        }
    };
    images.sort();

    ExtractImagesResult {
        images,
        dir: dest_dir,
        error: None,
    }
}

/// Common Homebrew prefixes where `pdftotext` might live. macOS GUI apps
/// launched from Finder/Launchpad get a minimal inherited PATH (`/usr/bin:
/// /bin:/usr/sbin:/sbin`) that does NOT include Homebrew. When the bare
/// `pdftotext` lookup fails we try each of these in order before giving
/// up. Covers Apple Silicon (/opt/homebrew), Intel Macs (/usr/local), and
/// Linuxbrew.
const BREW_PATHS: &[&str] = &[
    "/opt/homebrew/bin/pdftotext",
    "/usr/local/bin/pdftotext",
    "/home/linuxbrew/.linuxbrew/bin/pdftotext",
];

/// Same Homebrew prefix list but for the sibling `pdftoppm` binary we
/// use to render book covers. Lives in the same poppler-utils package
/// as pdftotext, so if one is present the other usually is too — we
/// still probe independently in case someone custom-built one.
const BREW_PPM_PATHS: &[&str] = &[
    "/opt/homebrew/bin/pdftoppm",
    "/usr/local/bin/pdftoppm",
    "/home/linuxbrew/.linuxbrew/bin/pdftoppm",
];

/// Locate a runnable `pdftotext` binary. Returns the first candidate that
/// actually exists on disk, or `None` if nothing matched (user hasn't
/// installed poppler at all).
fn find_pdftotext() -> Option<String> {
    // Try the plain name first — works when the app was launched from a
    // shell (`npm run tauri:dev`) that already has brew on PATH.
    if Command::new("pdftotext")
        .arg("-v")
        .output()
        .is_ok()
    {
        return Some("pdftotext".to_string());
    }
    // Fall back to common Homebrew prefixes. This is the path for a
    // notarized .app launched from /Applications where PATH is stripped.
    for candidate in BREW_PATHS {
        if std::path::Path::new(candidate).exists() {
            return Some((*candidate).to_string());
        }
    }
    None
}

/// Locate a runnable `pdftoppm` binary. Same fallback pattern as
/// `find_pdftotext` — covers the macOS `.app` case where Homebrew
/// prefixes aren't on the inherited PATH.
fn find_pdftoppm() -> Option<String> {
    if Command::new("pdftoppm").arg("-v").output().is_ok() {
        return Some("pdftoppm".to_string());
    }
    for candidate in BREW_PPM_PATHS {
        if std::path::Path::new(candidate).exists() {
            return Some((*candidate).to_string());
        }
    }
    None
}

#[tauri::command]
pub fn extract_pdf_text(path: String) -> ExtractResult {
    let binary = match find_pdftotext() {
        Some(b) => b,
        None => {
            return ExtractResult {
                text: String::new(),
                error: Some(
                    "pdftotext not found — install poppler first (on macOS: `brew install poppler`). \
                     If poppler IS installed but you're seeing this, please report the Homebrew \
                     prefix you use so we can include it in the lookup fallback list."
                        .to_string(),
                ),
            };
        }
    };

    // -layout preserves column boundaries + form feeds (chapter breaks) which
    // the downstream parser relies on.
    let output = match Command::new(&binary)
        .arg("-layout")
        .arg(&path)
        .arg("-") // write to stdout
        .output()
    {
        Ok(o) => o,
        Err(e) => {
            return ExtractResult {
                text: String::new(),
                error: Some(format!("failed to launch {binary}: {e}")),
            };
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

// ---- PDF cover extraction ---------------------------------------------------

/// Shape returned to the frontend from `extract_pdf_cover`. The frontend
/// uses `fetched_at` as a cache-buster when swapping covers in place.
#[derive(Debug, Serialize)]
pub struct CoverResult {
    /// When non-empty, absolute path to the written cover PNG (useful
    /// for logging; the frontend loads bytes via `load_course_cover`).
    pub path: String,
    /// Epoch millis at write-time so the frontend can blow past any
    /// previously-cached blob URL / object URL and render fresh.
    pub fetched_at: u64,
    /// Populated on failure — surfaced in the UI.
    pub error: Option<String>,
}

/// Render page 1 of `pdf_path` as a PNG and write it to
/// `<courses_dir>/<course_id>/cover.png`. Overwrites any existing cover
/// at that path (re-running is idempotent / safe to invoke from the
/// "Fetch cover artwork…" button in Course Settings).
///
/// Rendering DPI of 150 gives roughly 900×1350 on a standard 6×9"
/// paperback — plenty for the 180×270 shelf-card display size while
/// keeping the on-disk file under ~200 KB.
///
/// Only page 1 is used. Covers-on-page-2 edge cases (books that start
/// with a blank colophon) can be handled by the user pointing the
/// "Fetch cover artwork…" button at a better PDF.
#[tauri::command]
pub fn extract_pdf_cover(
    app: tauri::AppHandle,
    pdf_path: String,
    course_id: String,
) -> CoverResult {
    let binary = match find_pdftoppm() {
        Some(b) => b,
        None => {
            return CoverResult {
                path: String::new(),
                fetched_at: 0,
                error: Some(
                    "pdftoppm not found — install poppler first (on macOS: `brew install poppler`)."
                        .to_string(),
                ),
            };
        }
    };

    // The course folder must already exist (import pipeline creates it
    // as a side-effect of the first `save_course` call). If it doesn't,
    // create it now so running this command on a pristine install still
    // works (the frontend may not have saved anything yet when we're
    // called via the import-dialog fast path).
    let courses_dir = match crate::courses::courses_dir(&app) {
        Ok(d) => d,
        Err(e) => {
            return CoverResult {
                path: String::new(),
                fetched_at: 0,
                error: Some(format!("courses_dir: {e}")),
            };
        }
    };
    let course_dir = courses_dir.join(&course_id);
    if let Err(e) = std::fs::create_dir_all(&course_dir) {
        return CoverResult {
            path: String::new(),
            fetched_at: 0,
            error: Some(format!("create course dir: {e}")),
        };
    }

    let final_path = course_dir.join("cover.png");

    // pdftoppm writes to `<prefix>-NNN.png`. We give it a temp prefix
    // inside the course dir, then rename the single emitted file to the
    // canonical name.
    let temp_prefix = course_dir.join(".cover-tmp");
    // -f 1 -l 1 = first page only. -r 150 = 150 dpi. -png = PNG output.
    let output = match Command::new(&binary)
        .arg("-f").arg("1")
        .arg("-l").arg("1")
        .arg("-r").arg("150")
        .arg("-png")
        .arg(&pdf_path)
        .arg(&temp_prefix)
        .output()
    {
        Ok(o) => o,
        Err(e) => {
            return CoverResult {
                path: String::new(),
                fetched_at: 0,
                error: Some(format!("failed to launch {binary}: {e}")),
            };
        }
    };
    if !output.status.success() {
        return CoverResult {
            path: String::new(),
            fetched_at: 0,
            error: Some(format!(
                "pdftoppm exited with status {}: {}",
                output.status,
                String::from_utf8_lossy(&output.stderr)
            )),
        };
    }

    // pdftoppm's output filename: `<prefix>-<page>.png`. For page 1 with
    // no zero-padding it's `<prefix>-1.png`. Recent poppler versions
    // default to zero-padding to the length of the max-page number —
    // since we render only page 1 that's still `-1.png`, but we glob
    // defensively just in case.
    let rendered = match std::fs::read_dir(&course_dir)
        .ok()
        .and_then(|entries| {
            entries
                .filter_map(|e| e.ok())
                .map(|e| e.path())
                .find(|p| {
                    p.file_name()
                        .and_then(|s| s.to_str())
                        .map(|n| n.starts_with(".cover-tmp-") && n.ends_with(".png"))
                        .unwrap_or(false)
                })
        }) {
        Some(p) => p,
        None => {
            return CoverResult {
                path: String::new(),
                fetched_at: 0,
                error: Some("pdftoppm produced no output file".to_string()),
            };
        }
    };

    if let Err(e) = std::fs::rename(&rendered, &final_path) {
        return CoverResult {
            path: String::new(),
            fetched_at: 0,
            error: Some(format!("rename cover: {e}")),
        };
    }

    // pdftoppm at 150 dpi on a 2:3 book-cover page produces ~1200x1800
    // PNGs (~3 MB). Optimise to 480×720 JPEG q85 so the on-disk
    // footprint and the base64 IPC payload both stay tiny (~50-100 KB).
    // The helper deletes the source cover.png and emits cover.jpg —
    // we update final_path to follow the rename so the CoverResult
    // points at the file the frontend will actually load.
    let final_path = optimize_cover_in_place(&final_path).unwrap_or(final_path);

    // Stamp coverFetchedAt into course.json if it exists. This is what
    // makes the field consistent on-disk — meaning when the course is
    // later exported as a .fishbones, the JSON INSIDE the archive
    // already carries the marker, and a fresh import on another
    // machine sees it without needing the source PDF available.
    //
    // If course.json doesn't exist yet (the AI-ingest path calls this
    // command before the first save_course lands), the helper skips —
    // the pipeline's next save will write course.json fresh WITHOUT
    // the marker, but that's fine because the cover file itself is
    // the source of truth; `load_course_cover` always probes the
    // filesystem rather than trusting the JSON field.
    let fetched_at = stamp_cover_fetched_at(&course_dir);
    CoverResult {
        path: final_path.to_string_lossy().into_owned(),
        fetched_at,
        error: None,
    }
}

/// Format-agnostic entry point for the importer. Dispatches on the
/// file extension so the frontend doesn't need to know whether a
/// given book is PDF or EPUB — it just calls `extract_source_text`
/// and gets back the same `ExtractResult` shape either way.
#[tauri::command]
pub fn extract_source_text(path: String) -> ExtractResult {
    if crate::epub_ingest::is_epub_path(&path) {
        return crate::epub_ingest::extract_epub_text_impl(&path);
    }
    extract_pdf_text(path)
}

/// Max cover dimensions written to disk. The library shelf renders at
/// ~170-260px wide, sidebar carousel at 74px — so 480×720 covers 2x
/// retina with headroom. Combined with JPEG q85 re-encoding,
/// `optimize_cover_in_place` shrinks a 1024×1536 PNG (~3.5 MB) to
/// ~50-100 KB — a 30-50× win that cuts `load_course_cover`'s base64
/// IPC payload by the same factor and makes library + discover load
/// instantly instead of stuttering through multi-megabyte transfers.
const COVER_MAX_WIDTH: u32 = 480;
const COVER_MAX_HEIGHT: u32 = 720;
/// JPEG quality for the optimised cover. 85 is a sweet spot for
/// photographic content (most covers are AI-generated illustrations
/// or scanned book photos) — visually lossless at the render size,
/// 5-10× smaller than PNG of the same image.
const COVER_JPEG_QUALITY: u8 = 85;

/// Decode the image at `src_path`, downsample to fit within
/// COVER_MAX_WIDTH × COVER_MAX_HEIGHT (aspect-ratio preserved), and
/// re-encode as JPEG q85 to `cover.jpg` in the SAME directory. Deletes
/// the source file when it had a different name (e.g. the legacy
/// `cover.png` writers leave behind), so each course folder ends up
/// with a single `cover.jpg` regardless of how the cover arrived.
///
/// Returns the final path (`<dir>/cover.jpg`) on success, or `None`
/// on any failure — failures are logged as warnings and the source
/// is left in place so a too-big cover degrades gracefully rather
/// than disappearing entirely.
///
/// Idempotent: re-running on a file that's already at-or-below the
/// max dimensions still triggers a re-encode (the new file replaces
/// the old in the same step), but the result is byte-identical for
/// already-shrunk inputs and the operation is fast (<50ms per cover).
pub fn optimize_cover_in_place(src_path: &std::path::Path) -> Option<std::path::PathBuf> {
    let reader = match image::ImageReader::open(src_path) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("[cover] skip optimise for {src_path:?}: open failed: {e}");
            return None;
        }
    };
    let reader = match reader.with_guessed_format() {
        Ok(r) => r,
        Err(e) => {
            eprintln!("[cover] skip optimise for {src_path:?}: probe failed: {e}");
            return None;
        }
    };
    let img = match reader.decode() {
        Ok(i) => i,
        Err(e) => {
            eprintln!("[cover] skip optimise for {src_path:?}: decode failed: {e}");
            return None;
        }
    };
    let resized = if img.width() > COVER_MAX_WIDTH || img.height() > COVER_MAX_HEIGHT {
        img.resize(
            COVER_MAX_WIDTH,
            COVER_MAX_HEIGHT,
            image::imageops::FilterType::Lanczos3,
        )
    } else {
        img
    };

    let dst_path = match src_path.parent() {
        Some(p) => p.join("cover.jpg"),
        None => {
            eprintln!("[cover] skip optimise for {src_path:?}: no parent dir");
            return None;
        }
    };

    // JPEG encode at quality 85. The image crate's `save_with_format`
    // uses default quality 75; we go through `JpegEncoder` explicitly
    // so the constant lives in code and tracks the migration script
    // (`scripts/optimize-covers.mjs`) which uses the same number.
    //
    // RGB8 conversion is required because JPEG can't carry alpha;
    // the source PNGs from PDF rendering / OpenAI / EPUBs may carry
    // a transparent border which we flatten to white implicitly via
    // the JPEG encoder's default. Pre-converting to RGB8 makes the
    // intent explicit and avoids a runtime "alpha not supported"
    // error inside the encoder.
    let rgb = resized.to_rgb8();
    let mut buf = Vec::new();
    {
        let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(
            &mut buf,
            COVER_JPEG_QUALITY,
        );
        if let Err(e) = rgb.write_with_encoder(encoder) {
            eprintln!("[cover] failed to encode JPEG for {src_path:?}: {e}");
            return None;
        }
    }
    if let Err(e) = std::fs::write(&dst_path, &buf) {
        eprintln!("[cover] failed to write {dst_path:?}: {e}");
        return None;
    }

    // Clean up the source if it had a different filename. Keeps the
    // course folder canonical (one cover.jpg) and avoids stale-PNG
    // confusion in zips repacked from this folder.
    if src_path != dst_path && src_path.exists() {
        if let Err(e) = std::fs::remove_file(src_path) {
            eprintln!(
                "[cover] failed to remove legacy {src_path:?} after optimise: {e}"
            );
        }
    }

    Some(dst_path)
}

/// Write `coverFetchedAt` into `<course_dir>/course.json` if that file
/// exists. Returns the epoch-millis stamp it recorded (or 0 on clock
/// failure). Shared by every cover-writing command so the on-disk
/// marker stays consistent regardless of how the cover arrived (PDF
/// render, EPUB manifest, AI generation, user import).
pub fn stamp_cover_fetched_at(course_dir: &std::path::Path) -> u64 {
    let fetched_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let course_json_path = course_dir.join("course.json");
    if course_json_path.exists() {
        if let Ok(bytes) = std::fs::read(&course_json_path) {
            if let Ok(mut value) = serde_json::from_slice::<serde_json::Value>(&bytes) {
                if let Some(obj) = value.as_object_mut() {
                    obj.insert(
                        "coverFetchedAt".to_string(),
                        serde_json::Value::from(fetched_at),
                    );
                    if let Ok(next) = serde_json::to_vec_pretty(&value) {
                        let _ = std::fs::write(&course_json_path, next);
                    }
                }
            }
        }
    }
    fetched_at
}

/// User-supplied image → course cover. Accepts PNG/JPEG/WebP/GIF (the
/// `image` crate features we compiled in), decodes, re-encodes as PNG,
/// and writes to `<courses_dir>/<course_id>/cover.png`. Returns the
/// same `CoverResult` shape as `extract_pdf_cover` so the frontend
/// handler is uniform across every cover source.
#[tauri::command]
pub fn import_course_cover(
    app: tauri::AppHandle,
    image_path: String,
    course_id: String,
) -> CoverResult {
    let courses_dir = match crate::courses::courses_dir(&app) {
        Ok(d) => d,
        Err(e) => {
            return CoverResult {
                path: String::new(),
                fetched_at: 0,
                error: Some(format!("courses_dir: {e}")),
            };
        }
    };
    let course_dir = courses_dir.join(&course_id);
    if let Err(e) = std::fs::create_dir_all(&course_dir) {
        return CoverResult {
            path: String::new(),
            fetched_at: 0,
            error: Some(format!("create course dir: {e}")),
        };
    }

    let img = match image::ImageReader::open(&image_path) {
        Ok(r) => match r.with_guessed_format() {
            Ok(r) => match r.decode() {
                Ok(img) => img,
                Err(e) => {
                    return CoverResult {
                        path: String::new(),
                        fetched_at: 0,
                        error: Some(format!(
                            "decode image: {e}. Supported formats: PNG, JPEG, WebP, GIF.",
                        )),
                    };
                }
            },
            Err(e) => {
                return CoverResult {
                    path: String::new(),
                    fetched_at: 0,
                    error: Some(format!("probe image format: {e}")),
                };
            }
        },
        Err(e) => {
            return CoverResult {
                path: String::new(),
                fetched_at: 0,
                error: Some(format!("open image: {e}")),
            };
        }
    };

    // Write the user's image at full resolution to a scratch
    // `cover.png` so `optimize_cover_in_place` (which resizes +
    // re-encodes to 480×720 JPEG q85) handles the heavy lifting in
    // one place. The helper deletes the scratch file and returns the
    // canonical `cover.jpg` path which we report back to the frontend.
    let scratch = course_dir.join("cover.png");
    if let Err(e) = img.save_with_format(&scratch, image::ImageFormat::Png) {
        return CoverResult {
            path: String::new(),
            fetched_at: 0,
            error: Some(format!("write scratch cover.png: {e}")),
        };
    }
    let final_path = match optimize_cover_in_place(&scratch) {
        Some(p) => p,
        None => {
            return CoverResult {
                path: String::new(),
                fetched_at: 0,
                error: Some("failed to optimise cover".to_string()),
            };
        }
    };

    let fetched_at = stamp_cover_fetched_at(&course_dir);
    CoverResult {
        path: final_path.to_string_lossy().into_owned(),
        fetched_at,
        error: None,
    }
}

/// Sibling of `extract_source_text` for cover extraction. EPUBs carry
/// their cover in the manifest so we skip the poppler shell-out
/// entirely; PDFs keep going through pdftoppm.
#[tauri::command]
pub fn extract_source_cover(
    app: tauri::AppHandle,
    source_path: String,
    course_id: String,
) -> CoverResult {
    if crate::epub_ingest::is_epub_path(&source_path) {
        return crate::epub_ingest::extract_epub_cover_impl(&app, &source_path, &course_id);
    }
    extract_pdf_cover(app, source_path, course_id)
}

/// Read the cover image for a course (if one exists) and return it as
/// a base64 data URL that the frontend can drop straight into
/// `<img src>`. Returns `None` when no cover is present — callers
/// render their fallback tile in that case.
///
/// Format preference is `cover.jpg` (the optimised 480×720 q85 form
/// produced by `optimize_cover_in_place` and `optimize-covers.mjs`)
/// over `cover.png` (the legacy 1024×1536 form left over from older
/// installs / hand-built packs). The returned data URL carries the
/// matching MIME so the browser doesn't sniff or fail.
///
/// Lookup order:
///   1. `<app-data>/courses/<course_id>/cover.{jpg,png}` — installed copy.
///   2. `<resources>/bundled-packs/<course_id>.fishbones` (or `.kata`)
///      — extract `cover.{jpg,png}` straight out of the archive.
///   3. Fallback scan of every `.fishbones` archive looking for one
///      whose inner `course.json` matches `course_id`.
///
/// Step 2 + 3 give the catalog placeholders (Discover view) real
/// cover artwork without needing a separate IPC. They also serve as
/// a graceful fallback when the on-disk cover went missing for any
/// reason — the bundled archive is the canonical source of truth.
#[tauri::command]
pub fn load_course_cover(
    app: tauri::AppHandle,
    course_id: String,
) -> Result<Option<String>, String> {
    use base64::Engine;

    fn encode_data_url(bytes: &[u8], mime: &str) -> String {
        let b64 = base64::engine::general_purpose::STANDARD.encode(bytes);
        format!("data:{mime};base64,{b64}")
    }

    // 1. Installed copy — fastest path, single stat per format.
    if let Ok(courses_dir) = crate::courses::courses_dir(&app) {
        let course_dir = courses_dir.join(&course_id);
        // Prefer JPEG (the optimised form). PNG kept as a fallback so
        // installs from before the migration still render until they're
        // re-extracted from the bundled archive on next reinstall.
        for (filename, mime) in [
            ("cover.jpg", "image/jpeg"),
            ("cover.png", "image/png"),
        ] {
            let cover_path = course_dir.join(filename);
            if cover_path.exists() {
                let bytes =
                    std::fs::read(&cover_path).map_err(|e| format!("read cover: {e}"))?;
                return Ok(Some(encode_data_url(&bytes, mime)));
            }
        }
    }

    // 2 + 3. Pull from the bundled archive. Discover-view placeholders
    // and any first-launch UI that renders before the seed extract
    // finishes both rely on this branch.
    let resource_dir = match app.path().resource_dir() {
        Ok(p) => p.join("resources").join("bundled-packs"),
        Err(_) => return Ok(None),
    };
    if !resource_dir.exists() {
        return Ok(None);
    }
    // 2. Filename match — fast path.
    for ext in crate::courses::ARCHIVE_EXTS {
        let archive = resource_dir.join(format!("{course_id}.{ext}"));
        if archive.is_file() {
            if let Ok(Some((bytes, mime))) = read_cover_from_archive(&archive) {
                return Ok(Some(encode_data_url(&bytes, mime)));
            }
        }
    }
    // 3. Scan every archive looking for a matching inner id. Last-
    // resort path; only used when the on-disk filename diverges from
    // the inner course.id (rare).
    if let Ok(read_dir) = std::fs::read_dir(&resource_dir) {
        for entry in read_dir.flatten() {
            let path = entry.path();
            if !path.is_file() {
                continue;
            }
            if !crate::courses::is_archive_ext(path.extension().and_then(|s| s.to_str())) {
                continue;
            }
            // Cheaply check the id first so we don't repeatedly
            // base64-encode covers that don't match.
            if let Ok(id) = crate::courses::peek_archive_id(&path) {
                if id == course_id {
                    if let Ok(Some((bytes, mime))) = read_cover_from_archive(&path) {
                        return Ok(Some(encode_data_url(&bytes, mime)));
                    }
                }
            }
        }
    }

    Ok(None)
}

/// Batch variant of `load_course_cover` — takes a list of course ids
/// and returns a map of id → data-URL (or `null` for courses without
/// covers). Library mount calls this with every visible course id
/// up front, then walks the result to populate the per-card cover
/// cache. ONE round-trip across the IPC bus instead of N parallel
/// invokes, which cuts library cold-start by hundreds of ms in
/// practice — even though Promise.all dispatched the originals in
/// parallel, Tauri 2's command pipeline serialises through a single
/// dispatcher and the per-message overhead adds up.
///
/// File reads are still sequential server-side; on SSDs that's a few
/// ms total for the typical library size and isn't worth a thread-
/// pool. Bumping to rayon::par_iter() is an option if libraries grow
/// past ~100 courses.
#[tauri::command]
pub fn load_course_covers(
    app: tauri::AppHandle,
    course_ids: Vec<String>,
) -> Result<std::collections::HashMap<String, Option<String>>, String> {
    let mut out = std::collections::HashMap::with_capacity(course_ids.len());
    for id in course_ids {
        // Reuse the single-cover path so the resolution rules
        // (installed → bundled-by-name → bundled-by-id) stay in one
        // place. Errors fall through as `None` — the per-card UI's
        // fallback tile renders for any course missing a cover.
        let value = load_course_cover(app.clone(), id.clone()).unwrap_or(None);
        out.insert(id, value);
    }
    Ok(out)
}

/// Pull a cover image (anywhere in the archive) out of a `.fishbones`.
/// Returns `Ok(None)` when the archive doesn't carry one — common for
/// older / hand-built packs that pre-date cover artwork.
///
/// Two-pass scan: first pass looks for `cover.jpg` (the optimised
/// modern form), second pass falls back to `cover.png` (legacy
/// archives that haven't been re-packed through the migration
/// script). Returns `(bytes, mime)` so the caller can build the
/// right data URL.
fn read_cover_from_archive(
    archive: &std::path::Path,
) -> anyhow::Result<Option<(Vec<u8>, &'static str)>> {
    fn extract(
        archive: &std::path::Path,
        suffix: &str,
    ) -> anyhow::Result<Option<Vec<u8>>> {
        let file = std::fs::File::open(archive)?;
        let mut zip = zip::ZipArchive::new(file)?;
        for i in 0..zip.len() {
            let mut entry = zip.by_index(i)?;
            if entry.is_dir() {
                continue;
            }
            if entry.name().ends_with(suffix) {
                let mut buf = Vec::new();
                std::io::Read::read_to_end(&mut entry, &mut buf)?;
                return Ok(Some(buf));
            }
        }
        Ok(None)
    }

    if let Some(bytes) = extract(archive, "cover.jpg")? {
        return Ok(Some((bytes, "image/jpeg")));
    }
    if let Some(bytes) = extract(archive, "cover.png")? {
        return Ok(Some((bytes, "image/png")));
    }
    Ok(None)
}
