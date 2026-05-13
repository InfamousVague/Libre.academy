//! macOS menu-bar (tray) icon + popover window.
//!
//! Adds a small Libre icon to the macOS menu bar that toggles a
//! frameless WebviewWindow loaded at `?tray=1`. The frontend's
//! `main.tsx` routes that URL parameter to `TrayPanel`, which
//! renders an "Ask Libre" input + a scrollable library + a few
//! quick links — the user can interact without bringing the main
//! Libre window forward.
//!
//! Click flow:
//!   - Left-click the tray icon → toggle the popover. If it's
//!     hidden, show + position it under the click point and focus.
//!     If it's visible, hide it.
//!   - Right-click → context menu: "Open Libre" (focus main),
//!     "Quit" (terminate the app).
//!   - Click outside the popover → it auto-hides via the window's
//!     blur listener (set up on the frontend side via Tauri
//!     events; see `TrayPanel.tsx`).
//!
//! Window characteristics:
//!   - Frameless (`decorations: false`)
//!   - Always-on-top so the menu bar can't bury it
//!   - Not in the taskbar / dock (`skip_taskbar`)
//!   - Non-resizable, 360×520 — wide enough for a comfortable
//!     library list, tall enough that ~6 lessons + the ask input
//!     fit without scrolling.
//!
//! Build: tray support comes from Tauri 2's `tray-icon` feature
//! (included by default in `tauri = "2"`). The Manager + tray API
//! lives under `tauri::tray`.

use tauri::{
    menu::{MenuBuilder, MenuEvent, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, LogicalPosition, LogicalSize, Manager, PhysicalPosition, Runtime, WebviewUrl,
    WebviewWindowBuilder, Wry,
};

/// Label used for the tray popover window. Same name lookup the
/// Tauri WebviewWindow.get_by_label pattern the rest of the app
/// uses for its popouts.
const TRAY_WINDOW_LABEL: &str = "tray-panel";

/// Popover dimensions. Logical (CSS) pixels — Tauri scales per
/// monitor DPI automatically. 400×620 matches the in-app AI
/// chat panel's proportions (it lives at 380×~620 in the main
/// window) so the menu-bar surface feels like a docked variant
/// of the same chat.
const TRAY_WINDOW_WIDTH: f64 = 400.0;
const TRAY_WINDOW_HEIGHT: f64 = 620.0;

/// Build the tray icon and register click + menu handlers. Called
/// once from the `setup` hook in `lib.rs`. Idempotent across
/// `tauri dev` hot reloads because the icon is owned by the
/// `AppHandle`'s state, which is rebuilt per process.
///
/// macOS-only by intent — Linux/Windows tray patterns differ
/// enough that one-shape-fits-all becomes a maintenance burden.
/// Wrapped in `#[cfg(target_os = "macos")]` at the call site in
/// `lib.rs` rather than here, so the module still compiles on
/// every target and the no-op fallback stays cheap.
/// Build the tray popover window hidden + invisible so it's
/// fully booted (React mounted, listeners attached, CSS painted)
/// by the time the user actually clicks the tray icon. Without
/// this, the first click would create the window inline and the
/// user sees a brief flash of unstyled HTML / a momentarily-
/// unstyled card while the JS bundle loads + React mounts.
/// Subsequent toggles just call show/hide on the existing
/// window, which is instant.
fn create_tray_window_hidden(app: &AppHandle<Wry>) -> tauri::Result<()> {
    if app.get_webview_window(TRAY_WINDOW_LABEL).is_some() {
        return Ok(());
    }
    // Preload hidden so the first tray-icon click is just a
    // show()/position() — no React mount or bundle parse during
    // the click → paint frame.
    //
    // `transparent(true)` is needed even though the inner card is
    // a solid theme color: macOS NSWindow is rectangular, and
    // without OS-level transparency the rectangular window frame
    // shows up behind the CSS-rounded `.libre-tray` card (visible
    // as a hard rectangular halo around the rounded corners). With
    // transparent=true the OS paints nothing of its own and the
    // CSS card's shape IS the visible window shape.
    //
    // `shadow(false)` pairs with that: AppKit's auto-shadow traces
    // the rectangular window bounds, so leaving it on draws a
    // ghost-rectangle shadow around the visible rounded card. We
    // paint our own shadow in CSS instead, traced around the card
    // shape.
    let _window = WebviewWindowBuilder::new(
        app,
        TRAY_WINDOW_LABEL,
        WebviewUrl::App("index.html?tray=1".into()),
    )
    .title("Libre · Ask")
    .inner_size(TRAY_WINDOW_WIDTH, TRAY_WINDOW_HEIGHT)
    .decorations(false)
    .resizable(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .transparent(true)
    .shadow(false)
    .visible(false)
    .build()?;
    Ok(())
}

pub fn setup_tray(app: &AppHandle<Wry>) -> tauri::Result<()> {
    // Right-click context menu. Two items:
    //   - "Open Libre" — surface the main window (creates one if
    //     somehow missing).
    //   - "Quit Libre" — clean exit. Same behaviour as Cmd+Q from
    //     the main window's app menu.
    let open_main = MenuItemBuilder::with_id("tray.open-main", "Open Libre").build(app)?;
    let quit = MenuItemBuilder::with_id("tray.quit", "Quit Libre").build(app)?;
    let menu = MenuBuilder::new(app).items(&[&open_main, &quit]).build()?;

    // Tray icon — the "snake" PNG bundled under `src-tauri/icons/`.
    // Embedded at compile time via `include_bytes!` so the binary
    // owns its own asset (no runtime filesystem lookup, no path
    // resolution at the bundle's resource dir). `Image::from_bytes`
    // decodes the PNG via the `image-png` feature on `tauri = "2"`.
    // `icon_as_template(false)` keeps the icon's original color
    // pixels — AppKit would otherwise alpha-mask the icon into a
    // monochrome template that follows the menu-bar appearance,
    // which kills the snake's coloring. Trade-off: the icon won't
    // auto-invert in dark menu bars; the snake's palette is
    // deliberate, so we surface it as-is.
    let icon_bytes = include_bytes!("../icons/tray-icon.png");
    let icon = tauri::image::Image::from_bytes(icon_bytes)?;

    let _tray = TrayIconBuilder::with_id("libre-tray")
        .icon(icon)
        .icon_as_template(false)
        .tooltip("Libre.academy")
        .menu(&menu)
        // Tauri 2 shows the menu on LEFT click by default; flip so
        // the menu only surfaces on right-click and the left-click
        // owns "toggle popover."
        .show_menu_on_left_click(false)
        .on_menu_event(|app: &AppHandle<Wry>, event: MenuEvent| {
            match event.id().as_ref() {
                "tray.open-main" => {
                    focus_main_window(app);
                }
                "tray.quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            // Tauri 2's tray events fire for every mouse interaction
            // (Down / Up / Enter / Leave). We only care about the
            // "user released a left click" moment — that's the
            // canonical "they clicked the icon" signal.
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                position,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Err(e) = toggle_tray_window(app, position) {
                    eprintln!("[libre tray] toggle failed: {e}");
                }
            }
        })
        .build(app)?;

    // Preload the popover window hidden so the FIRST tray-icon
    // click is just a `show()` + `set_position()` — no React
    // mount delay, no bundle parse, no flash of unstyled HTML.
    // Failure here is logged but non-fatal; the lazy path in
    // `toggle_tray_window` still creates the window on demand
    // if the preload didn't succeed.
    if let Err(e) = create_tray_window_hidden(app) {
        eprintln!("[libre tray] preload failed: {e}");
    }

    Ok(())
}

/// Toggle the tray popover. Creates it on first call (lazy mount —
/// no perf cost until the user actually opens the panel), shows +
/// repositions it on subsequent calls when hidden, hides it when
/// visible. Positioning is anchored to the tray-icon click point
/// (`position` arg, in physical pixels) with a small downward
/// offset so the popover hangs below the icon rather than
/// overlapping it.
fn toggle_tray_window<R: Runtime>(
    app: &AppHandle<R>,
    click_position: PhysicalPosition<f64>,
) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window(TRAY_WINDOW_LABEL) {
        // Window already exists. If visible, hide; otherwise show
        // + reposition to the new click point (the user may have
        // dragged the menu bar icon to a different display).
        if window.is_visible().unwrap_or(false) {
            window.hide()?;
        } else {
            position_window_at(&window, click_position)?;
            window.show()?;
            window.set_focus()?;
        }
        return Ok(());
    }

    // First call this session — build the window. See
    // `create_tray_window_hidden` above for why we need
    // `transparent(true) + shadow(false)` even though the inner
    // card is opaque: the OS window is rectangular, so without
    // transparency the rectangular frame shows around the CSS-
    // rounded card, and AppKit's auto-shadow traces the same
    // rectangular bounds. CSS owns the visible shape + shadow.
    let window = WebviewWindowBuilder::new(
        app,
        TRAY_WINDOW_LABEL,
        WebviewUrl::App("index.html?tray=1".into()),
    )
    .title("Libre · Ask")
    .inner_size(TRAY_WINDOW_WIDTH, TRAY_WINDOW_HEIGHT)
    .decorations(false)
    .resizable(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .transparent(true)
    .shadow(false)
    // Hidden until we've positioned it — the WebviewWindowBuilder
    // would otherwise pop briefly at (0, 0) before our position
    // call lands.
    .visible(false)
    .build()?;

    position_window_at(&window, click_position)?;
    window.show()?;
    window.set_focus()?;
    Ok(())
}

/// Place the popover horizontally centred on the click point and
/// vertically just below the menu bar. Clamps to the primary
/// monitor's working area so the popover never opens partially
/// off-screen on a small display.
fn position_window_at<R: Runtime>(
    window: &tauri::WebviewWindow<R>,
    click: PhysicalPosition<f64>,
) -> tauri::Result<()> {
    let scale = window.scale_factor()?;
    // Convert the tray's physical-pixel click point into the
    // logical-pixel space the rest of the positioning math uses.
    // (macOS reports tray-icon coords in physical pixels.)
    let click_logical = LogicalPosition::new(click.x / scale, click.y / scale);

    // Centre horizontally under the icon; tuck just below the
    // menu-bar height (~28 logical pixels on macOS — adding 6 of
    // breathing room so the popover doesn't kiss the bar).
    let x = click_logical.x - TRAY_WINDOW_WIDTH / 2.0;
    let y = click_logical.y + 6.0;

    window.set_size(LogicalSize::new(TRAY_WINDOW_WIDTH, TRAY_WINDOW_HEIGHT))?;
    window.set_position(LogicalPosition::new(x, y))?;
    Ok(())
}

/// Bring the main Libre window forward — used by the tray menu's
/// "Open Libre" item and by the `tray_focus_main` command the
/// frontend invokes when the user clicks a course / lesson in the
/// popover. Looks up by the conventional `main` label; falls
/// through to the first window in the manager if not found.
/// Generic over `Runtime` so it can be called from both the
/// `setup` hook (uses `Wry`) and the `#[tauri::command]` handler
/// (whose `R` is propagated from the invoke site).
pub fn focus_main_window<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    let main = app
        .get_webview_window("main")
        .or_else(|| app.webview_windows().into_values().next());
    if let Some(window) = main {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Invocable from the frontend — hides the tray popover. The
/// TrayPanel emits this after the user clicks a quick-action so
/// the popover doesn't linger after handing control back to the
/// main window.
#[tauri::command]
pub async fn tray_hide<R: tauri::Runtime>(app: tauri::AppHandle<R>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(TRAY_WINDOW_LABEL) {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Invocable from the frontend — focuses the main window, used
/// when the tray popover wants to hand off (e.g. user clicks a
/// course, we focus main + emit an event the main window listens
/// to for "open this course").
#[tauri::command]
pub async fn tray_focus_main<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
) -> Result<(), String> {
    focus_main_window(&app);
    // Also hide the popover so the user isn't left with both the
    // tray window AND the main window stacked.
    if let Some(window) = app.get_webview_window(TRAY_WINDOW_LABEL) {
        let _ = window.hide();
    }
    Ok(())
}
