/// Celebration cue — historically a full-screen transparent-WebM
/// overlay of falling gold coins ("coin-burst") that fired on every
/// achievement unlock / section complete / etc. Retired May 2026
/// because the visual was overusing screen-time-as-reward and the
/// repeated coin shower started reading as "ka-ching" mobile-game
/// noise rather than punctuation.
///
/// The exports below are kept as no-ops (besides the haptic
/// accompaniment) so the integrated lifecycle in AchievementModal +
/// SectionCompleteSummary doesn't have to re-plumb. Specifically:
///
///   - `celebrate(...)` / `celebrateWith(...)` resolve immediately
///     and fire a three-beat haptic so motion-free devices still
///     get the unlock signal.
///   - `accelerateActiveCelebrations()` / `dismissActiveCelebrations()`
///     are no-ops — there are no active videos to tear down.
///   - `clearCelebrations()` sweeps any leftover overlay DOM the
///     previous build may have left behind on a stale localStorage /
///     hot-reload state. Cheap defensive cleanup.
///
/// `CelebrationEffect` stays exported as `"coin-burst"` for type
/// compatibility with the developer-pane tester (which is itself
/// scheduled for removal alongside this lib's retirement).

import type { ConfettiPreset } from "./confetti";
import { fireHapticSequence } from "./haptics";

export type CelebrationEffect = "coin-burst";

export interface CelebrateOptions {
  effect?: CelebrationEffect;
  weights?: Partial<Record<CelebrationEffect, number>>;
  src?: string;
}

/// Public API — see file header. Fires the three-beat haptic
/// accompaniment (which is silent on devices without haptic
/// hardware) and resolves immediately. The `_preset` / `_target` /
/// `_opts` args are accepted only for source-compatibility with
/// every existing call site; nothing inside this function reads
/// them.
export function celebrate(
  _preset: ConfettiPreset,
  _target?: { x: number; y: number } | HTMLElement,
  _opts: CelebrateOptions = {},
): Promise<void> {
  // Haptic-only signal. The visual coin shower was retired; the
  // haptic stays because tactile feedback on unlock is a quiet,
  // non-disruptive reward and survives the visual purge.
  fireHapticSequence([
    ["impact-medium", 0],
    ["impact-light", 320],
    ["notification-success", 720],
  ]);
  return Promise.resolve();
}

/// Force a specific effect — the implementation is the same no-op
/// pass-through as `celebrate`. Kept for source compatibility with
/// the (now-decommissioned) celebration tester pane.
export function celebrateWith(
  effect: CelebrationEffect,
  preset: ConfettiPreset = "medium",
  target?: { x: number; y: number } | HTMLElement,
): Promise<void> {
  return celebrate(preset, target, { effect });
}

/// No-op — kept so AchievementModal's dismiss path can keep calling
/// this without a conditional import. There are no live videos to
/// accelerate.
export function accelerateActiveCelebrations(_rate: number): void {
  /* no-op — coin-burst retired */
}

/// No-op — kept so AchievementModal + SectionCompleteSummary's
/// dismiss paths can keep calling this. There are no live videos
/// to tear down.
export function dismissActiveCelebrations(): void {
  /* no-op — coin-burst retired */
}

/// Sweep any leftover celebration overlay DOM. The previous build
/// mounted video + canvas elements at z-index 9999 on the body root;
/// if a user upgrades from an older version mid-celebration, this
/// makes sure the orphan DOM gets cleaned up on the next clear call.
export function clearCelebrations(): void {
  if (typeof document === "undefined") return;
  for (const el of document.querySelectorAll(
    'video[aria-hidden="true"][style*="z-index: 9999"]',
  )) {
    el.remove();
  }
  for (const el of document.querySelectorAll(
    'canvas[aria-hidden="true"][style*="z-index: 9999"]',
  )) {
    el.remove();
  }
}
