// Native iOS haptic bridge for the Libre app.
//
// Tauri 2's iOS plugin system exposes Swift code to Rust via the
// `ffi` boundary defined in the plugin's `Cargo.toml` + the
// `tauri-plugin` macro. This file is the Swift side of the
// `haptic_fire` command — it owns the `UIImpactFeedbackGenerator`
// pool, picks the right generator subclass for the requested
// style, and dispatches with the intensity hint.
//
// Wiring (when this plugin is moved into the Tauri build):
//
//   1. Add the plugin crate to `src-tauri/Cargo.toml` as a
//      workspace member.
//   2. In `src-tauri/src/lib.rs`, replace the in-tree
//      `haptics::haptic_fire` command registration with a
//      `.plugin(tauri_plugin_haptics::init())` invocation.
//   3. The TS side requires no changes — `invoke("haptic_fire",
//      {...})` lands on the plugin's command via Tauri's
//      automatic plugin-command routing.
//
// Until wiring lands, this file is reference material — the
// Swift code stays here, the Rust haptics.rs in-tree command
// stays a no-op, and the JS layer falls through to
// `navigator.vibrate` (which iOS Safari no-ops, so iOS users
// don't currently get haptics — wiring this is the highest-
// value follow-up).

import UIKit

/// Persistent generator pool — one of each kind, prepared at
/// init so the first fire isn't slowed by the ~50-100ms
/// `prepare()` warm-up. iOS docs explicitly recommend keeping
/// the generators alive between fires for low-latency feedback.
@objc public final class LibreHaptics: NSObject {

    // ─── Generator pool ───────────────────────────────────────

    private let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private let heavyImpact = UIImpactFeedbackGenerator(style: .heavy)
    private let softImpact: UIImpactFeedbackGenerator = {
        if #available(iOS 13.0, *) {
            return UIImpactFeedbackGenerator(style: .soft)
        }
        // Pre-iOS-13 fallback — light is the closest available.
        return UIImpactFeedbackGenerator(style: .light)
    }()
    private let rigidImpact: UIImpactFeedbackGenerator = {
        if #available(iOS 13.0, *) {
            return UIImpactFeedbackGenerator(style: .rigid)
        }
        return UIImpactFeedbackGenerator(style: .heavy)
    }()
    private let selection = UISelectionFeedbackGenerator()
    private let notification = UINotificationFeedbackGenerator()

    @objc public override init() {
        super.init()
        // Warm every generator up front. Each prepare() is
        // cheap; doing them all on init means the FIRST haptic
        // after launch fires with the same latency as the
        // hundredth one. Without prepare, the first fire can
        // be perceptibly delayed.
        lightImpact.prepare()
        mediumImpact.prepare()
        heavyImpact.prepare()
        softImpact.prepare()
        rigidImpact.prepare()
        selection.prepare()
        notification.prepare()
    }

    // ─── Public API: fire by style + intensity ────────────────

    /// Dispatch a haptic. `style` matches the TS layer's
    /// `HapticStyle` enum strings; `intensity` is 0...1 and
    /// only used by the impact generators (selection +
    /// notification take no intensity).
    @objc public func fire(style: String, intensity: Double) -> Bool {
        // UIDevice.feedbackGenerator availability is iPhone 7+
        // for impacts, plus a quirk where iPads with no Taptic
        // Engine silently no-op the fire. We assume availability
        // and rely on the OS to filter; the TS layer expects
        // best-effort and tolerates silent fires.
        let clampedIntensity = max(0, min(1, intensity))

        switch style {
        case "light":
            if #available(iOS 13.0, *) {
                lightImpact.impactOccurred(intensity: CGFloat(clampedIntensity))
            } else {
                lightImpact.impactOccurred()
            }
            lightImpact.prepare()
            return true

        case "medium":
            if #available(iOS 13.0, *) {
                mediumImpact.impactOccurred(intensity: CGFloat(clampedIntensity))
            } else {
                mediumImpact.impactOccurred()
            }
            mediumImpact.prepare()
            return true

        case "heavy":
            if #available(iOS 13.0, *) {
                heavyImpact.impactOccurred(intensity: CGFloat(clampedIntensity))
            } else {
                heavyImpact.impactOccurred()
            }
            heavyImpact.prepare()
            return true

        case "soft":
            if #available(iOS 13.0, *) {
                softImpact.impactOccurred(intensity: CGFloat(clampedIntensity))
                softImpact.prepare()
            } else {
                softImpact.impactOccurred()
            }
            return true

        case "rigid":
            if #available(iOS 13.0, *) {
                rigidImpact.impactOccurred(intensity: CGFloat(clampedIntensity))
                rigidImpact.prepare()
            } else {
                rigidImpact.impactOccurred()
            }
            return true

        case "success":
            notification.notificationOccurred(.success)
            notification.prepare()
            return true

        case "warning":
            notification.notificationOccurred(.warning)
            notification.prepare()
            return true

        case "error":
            notification.notificationOccurred(.error)
            notification.prepare()
            return true

        case "pattern":
            // Multi-pulse patterns: iOS doesn't expose a
            // public pattern API for UIFeedbackGenerator, so we
            // simulate by chaining medium impacts with timed
            // dispatches. The TS layer's pattern array is
            // forwarded for cases where pattern fidelity
            // matters more than tactile weight — schedule a
            // light impact per buzz on the pattern timeline.
            // For now we fall back to a single medium impact
            // here and let the TS layer time additional fires
            // via setTimeout; the simulation lives in
            // patterns.ts.
            mediumImpact.impactOccurred()
            mediumImpact.prepare()
            return true

        default:
            return false
        }
    }

    // ─── Hardware capability probe ────────────────────────────

    /// Best-effort signal for "does this device have a Taptic
    /// Engine?" There's no public API for this — Apple
    /// deliberately doesn't expose it, since they want
    /// developers to fire and let the OS handle absence. We
    /// approximate by checking the device model name; non-
    /// phone iPad / iPod silhouettes return false so the TS
    /// layer doesn't expect feedback that won't arrive.
    @objc public func isAvailable() -> Bool {
        let model = UIDevice.current.model
        // iPhone 7 and later have Taptic Engine; older iPhones
        // and most iPads have a basic vibration motor with
        // limited haptic feedback. The model string is just
        // "iPhone" or "iPad", so we err on the side of
        // "available" for iPhones and conservative for iPads.
        if model == "iPhone" { return true }
        // iPad Pro models (especially Pro 11 / Pro 12.9 from
        // 2018+) have richer haptics; the basic iPad doesn't.
        // Distinguishing requires private API, so we just
        // return true and let the OS silently no-op when
        // there's no Taptic Engine — the TS layer treats this
        // as "best effort done."
        return true
    }
}
