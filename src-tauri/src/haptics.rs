//! Native haptic-feedback bridge for the Libre app.
//!
//! The TypeScript side (`src/lib/haptics.ts`) invokes the
//! `haptic_fire` command for every haptic event in the app. The
//! Rust side picks the right backend per target OS:
//!
//! - **iOS / iPadOS** — should call `UIImpactFeedbackGenerator`,
//!   `UISelectionFeedbackGenerator`, or `UINotificationFeedback-
//!   Generator` via objc bridging. This stub returns
//!   `available: false` so the TS side falls back to
//!   `navigator.vibrate()` (which iOS Safari no-ops, so the user
//!   gets no haptic — acceptable until the native impl lands).
//! - **Android** — should call `VibrationEffect.createPredefined`
//!   for newer API levels, or `Vibrator.vibrate(pattern)` on
//!   older ones. Again a stub here.
//! - **Desktop** — never reaches this command in the first place
//!   (the TS layer short-circuits on `isDesktop && !isMobile`).
//!   If a future use case wants desktop haptics (paired iPhone
//!   via Continuity, haptic gamepad), the platform check in
//!   `haptics.ts` is the place to relax it.
//!
//! Contract with the TS caller:
//! - Returns `Ok(NativeHapticResult)` ALWAYS. Failures bubble up
//!   as `available: false`, never as `Err`, so the TS bridge
//!   doesn't pollute the console with rejections every time it's
//!   invoked.
//! - The `available` flag tells the caller whether to attempt
//!   the web fallback. `fired: false, available: true` means
//!   "we have the hardware but the user has haptics off in OS
//!   settings, so don't fall back" — for now we always set
//!   `available: false` so the JS layer makes the decision.

use serde::{Deserialize, Serialize};

/// Mirror of the TS `IntentProfile.pattern` field. Either a
/// single duration in ms (one buzz) or an array of alternating
/// buzz / pause durations (multi-pulse pattern).
///
/// `dead_code` allow on the variant payloads — they're populated
/// by serde via the untagged-enum match (the durations come in
/// from the TS side intact) but the macOS impl currently no-ops
/// on `pattern`. Mobile builds (iOS / Android) will read them
/// once their native bridges land; suppressing the warning keeps
/// the cargo output clean in the meantime without losing the
/// information serde needs to round-trip.
#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum HapticPattern {
    Single(#[allow(dead_code)] u32),
    Sequence(#[allow(dead_code)] Vec<u32>),
}

/// Style hint forwarded from the TS layer — maps directly to
/// iOS's `UIImpactFeedbackGenerator.FeedbackStyle` (light /
/// medium / heavy / soft / rigid) OR a notification flavour
/// (success / warning / error). `pattern` is the catch-all for
/// multi-pulse intents the native APIs don't model directly;
/// the native impl should fall back to vibration-pattern when
/// it gets this value.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HapticStyle {
    Light,
    Medium,
    Heavy,
    Soft,
    Rigid,
    Success,
    Warning,
    Error,
    Pattern,
}

/// Returned to TS so the bridge knows whether the haptic
/// actually fired AND whether the device has the hardware. The
/// distinction matters because TS can fall back to
/// `navigator.vibrate()` when `available: false`, but should
/// NOT fall back when `fired: false, available: true` (the
/// user has haptics off in OS settings — falling back would
/// override their explicit choice).
#[derive(Debug, Serialize)]
pub struct NativeHapticResult {
    pub fired: bool,
    pub available: bool,
}

/// Top-level Tauri command. Wired in `lib.rs`'s
/// `generate_handler!`. See module-level docstring for the
/// per-platform contract.
#[allow(unused_variables)]
#[tauri::command]
pub async fn haptic_fire(
    intent: String,
    style: HapticStyle,
    intensity: f32,
    pattern: HapticPattern,
) -> Result<NativeHapticResult, String> {
    #[cfg(target_os = "ios")]
    {
        // TODO: native iOS impl — instantiate the right
        // UI*FeedbackGenerator subclass based on `style`,
        // `prepare()` once per app lifetime, then call
        // `impactOccurred(intensity:)` / `selectionChanged()` /
        // `notificationOccurred(.success|.warning|.error)`.
        // For now we report unavailable so the TS layer skips
        // the web fallback (which iOS Safari no-ops anyway).
        return Ok(NativeHapticResult {
            fired: false,
            available: false,
        });
    }

    #[cfg(target_os = "android")]
    {
        // TODO: native Android impl — VibrationEffect (API 26+)
        // with predefined constants where the style matches,
        // pattern array on older API levels. Until that lands
        // we let the TS layer drop to `navigator.vibrate()`
        // which Android Chrome honours.
        return Ok(NativeHapticResult {
            fired: false,
            available: false,
        });
    }

    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        // Desktop: TS short-circuits before reaching here, but
        // we still need to compile cleanly when the desktop
        // target builds the same module. Report unavailable so
        // the (rare) desktop call lands on the JS no-op path.
        Ok(NativeHapticResult {
            fired: false,
            available: false,
        })
    }
}
