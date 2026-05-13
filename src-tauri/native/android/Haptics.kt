// Native Android haptic bridge for the Libre app.
//
// Companion to Haptics.swift — same `haptic_fire` command, same
// TS contract, different platform code path. Tauri 2's Android
// plugin system surfaces Kotlin via the JNI bridge; this file
// is the Kotlin side of the bridge that runs on Android phones
// and Chrome OS devices.
//
// API levels:
//   - API 31+ (Android 12+): use `VibrationEffect.createPredefined`
//     for the closest-to-iOS feel — `EFFECT_TICK` / `EFFECT_CLICK`
//     / `EFFECT_HEAVY_CLICK` / `EFFECT_DOUBLE_CLICK` map cleanly
//     to our intent vocabulary.
//   - API 26-30: `VibrationEffect.createOneShot` + custom
//     pattern timing; we lose the "predefined" weight but pick
//     amplitude per fire so the feel is close.
//   - API < 26: legacy `Vibrator.vibrate(long)` / `vibrate(pattern, -1)`
//     fall back. Durations are tuned to mimic the iOS feel as
//     best the older API allows.
//
// Wiring is identical to iOS — add the plugin crate, register
// it in lib.rs, and the JS `invoke("haptic_fire", ...)` call
// lands here automatically.

package academy.libre.haptics

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

class LibreHaptics(private val context: Context) {

    // ─── Vibrator acquisition ─────────────────────────────────

    /// Cached vibrator reference. API 31 introduced VibratorManager
    /// for multi-vibrator devices (foldables); pre-31 we go
    /// directly to Vibrator.
    private val vibrator: Vibrator? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = context.getSystemService(
                Context.VIBRATOR_MANAGER_SERVICE
            ) as? VibratorManager
            manager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    // ─── Public API: fire by style + intensity ────────────────

    /// Returns true when the haptic was dispatched (the device
    /// has a vibrator AND the API accepted the effect). The JS
    /// layer uses this to decide whether to also try its
    /// navigator.vibrate fallback — `false` means "go ahead and
    /// try the web API too".
    fun fire(style: String, intensity: Double, pattern: LongArray?): Boolean {
        val v = vibrator ?: return false
        if (!v.hasVibrator()) return false

        val clampedIntensity = intensity.coerceIn(0.0, 1.0)
        val amplitude = (clampedIntensity * 255).toInt().coerceIn(1, 255)

        return when (style) {
            "light" -> fireImpact(v, duration = 8L, amplitude = amplitude)
            "medium" -> fireImpact(v, duration = 18L, amplitude = amplitude)
            "heavy" -> fireImpact(v, duration = 28L, amplitude = amplitude)
            "soft" -> fireImpact(v, duration = 14L, amplitude = (amplitude * 0.8).toInt().coerceIn(1, 255))
            "rigid" -> fireImpact(v, duration = 12L, amplitude = amplitude)
            "success" -> firePredefinedOrPattern(
                v,
                predefined = VibrationEffect.EFFECT_DOUBLE_CLICK,
                fallback = longArrayOf(0, 20, 40, 28),
                amplitude = amplitude,
            )
            "warning" -> firePredefinedOrPattern(
                v,
                predefined = VibrationEffect.EFFECT_HEAVY_CLICK,
                fallback = longArrayOf(0, 40, 60, 40),
                amplitude = amplitude,
            )
            "error" -> firePredefinedOrPattern(
                v,
                // No "error" predefined effect — use HEAVY_CLICK
                // doubled via pattern for the heaviest feel.
                predefined = null,
                fallback = longArrayOf(0, 70, 35, 70),
                amplitude = amplitude,
            )
            "pattern" -> firePattern(v, pattern ?: longArrayOf(0, 20), amplitude)
            else -> false
        }
    }

    fun isAvailable(): Boolean {
        return vibrator?.hasVibrator() == true
    }

    // ─── Helpers ──────────────────────────────────────────────

    private fun fireImpact(v: Vibrator, duration: Long, amplitude: Int): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createOneShot(duration, amplitude))
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(duration)
            }
            true
        } catch (_: Throwable) {
            false
        }
    }

    private fun firePredefinedOrPattern(
        v: Vibrator,
        predefined: Int?,
        fallback: LongArray,
        amplitude: Int,
    ): Boolean {
        return try {
            if (
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
                predefined != null
            ) {
                v.vibrate(VibrationEffect.createPredefined(predefined))
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val amps = IntArray(fallback.size) { i ->
                    // Even indices are pauses (amplitude 0), odd
                    // are buzzes at the requested amplitude. The
                    // pattern array convention is "first value
                    // is a delay" so we honour that.
                    if (i == 0) 0 else if (i % 2 == 1) amplitude else 0
                }
                v.vibrate(VibrationEffect.createWaveform(fallback, amps, -1))
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(fallback, -1)
            }
            true
        } catch (_: Throwable) {
            false
        }
    }

    private fun firePattern(v: Vibrator, pattern: LongArray, amplitude: Int): Boolean {
        if (pattern.isEmpty()) return false
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val amps = IntArray(pattern.size) { i ->
                    if (i == 0) 0 else if (i % 2 == 1) amplitude else 0
                }
                v.vibrate(VibrationEffect.createWaveform(pattern, amps, -1))
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(pattern, -1)
            }
            true
        } catch (_: Throwable) {
            false
        }
    }
}
