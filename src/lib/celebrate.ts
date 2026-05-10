/// Random-effect celebration cue. Replaces direct `confettiBurst`
/// calls at every "you unlocked something" surface so the visual
/// language stays surprising — picks one of six full-frame
/// transparent-WebM overlays at random per call.
///
/// Each video is an alpha-channel WebM (VP8 + alpha) staged at
/// `public/celebrations/<id>.webm`. The browser plays them inline,
/// muted, autoplay, with `pointer-events: none` so clicks pass
/// through. The video element appends to the body once, plays its
/// 6-8 second loop, then removes itself + resolves the returned
/// Promise so callers can sequence on "done".
///
/// The pool of effects, per call:
///
///   1. coin-burst        — gold coins erupt + fall
///   2. confetti-cascade  — ribbon confetti rains + spirals
///   3. fireworks         — chromatic firework bursts
///   4. glass-shatter     — glass medallion fractures + glints
///   5. medallion-spin    — slow ribbon-medallion rotation
///   6. ribbon-vortex     — ribbon vortex inhales + blooms
///
/// All effects share one fixed-position container, sized to cover
/// the entire viewport, with `z-index: 90` so the video paints
/// behind the modal backdrop (z-index 200) and over page chrome
/// (sidebar/topbar at z-index 80).
///
/// Reduced-motion fallback: the static dot-puff helper from the
/// previous canvas-based pipeline still runs, so motion-sensitive
/// users get a single bloom + fade that respects their preference.

import { confettiBurst, type ConfettiPreset } from "./confetti";

export type CelebrationEffect =
  | "coin-burst"
  | "confetti-cascade"
  | "fireworks"
  | "glass-shatter"
  | "medallion-spin"
  | "ribbon-vortex";

/// Default weights — currently uniform. Each video is distinct
/// enough that any of them can fire at any time without feeling
/// repetitive, and collapsing weights to "all equal" matches the
/// design spec for these unlock animations specifically. Tune
/// per-call via `opts.weights` if a designer wants to bias toward
/// one (e.g. coin-burst for the "first XP earned" toast).
const DEFAULT_WEIGHTS: Record<CelebrationEffect, number> = {
  "coin-burst": 1,
  "confetti-cascade": 1,
  fireworks: 1,
  "glass-shatter": 1,
  "medallion-spin": 1,
  "ribbon-vortex": 1,
};

export interface CelebrateOptions {
  /// Force a specific effect — useful when a designer wants to
  /// guarantee a particular cue (e.g. coin-burst for the "first
  /// XP earned" toast). Skips the weighted random pick.
  effect?: CelebrationEffect;
  /// Override the weight table (per-call). Effects with weight 0
  /// are excluded from the pick. Anything missing keeps its default.
  weights?: Partial<Record<CelebrationEffect, number>>;
  /// Optional override path. When set, plays this URL instead of
  /// the standard `/celebrations/<id>.webm`. Used by tests + the
  /// developer test panel.
  src?: string;
}

// ─── Reduced-motion detection ───────────────────────────────────

function reducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ─── Reduced-motion fallback ────────────────────────────────────
// Single static dot-puff — same vocabulary the canvas pipeline used.
// Lives on its own canvas so it can coexist with any future inline
// effect without z-index gymnastics.

const CORAL = "#f37239";
const AMBER = "#ffc857";

function staticPuff(target?: { x: number; y: number } | HTMLElement): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const origin = targetToOrigin(target);
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "90";
  canvas.setAttribute("aria-hidden", "true");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  document.body.appendChild(canvas);
  const ox = origin.x * window.innerWidth;
  const oy = origin.y * window.innerHeight;
  const start = performance.now();
  const dur = 700;
  return new Promise<void>((resolve) => {
    const draw = (t: number) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (elapsed >= dur) {
        canvas.remove();
        resolve();
        return;
      }
      const f = elapsed / dur;
      const alpha = f < 0.4 ? f / 0.4 : 1 - (f - 0.4) / 0.6;
      ctx.globalAlpha = alpha;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = 22 + (i % 2 ? 6 : 0);
        ctx.fillStyle = i % 2 === 0 ? CORAL : AMBER;
        ctx.beginPath();
        ctx.arc(
          ox + Math.cos(angle) * r * (0.6 + f),
          oy + Math.sin(angle) * r * (0.6 + f),
          4, 0, Math.PI * 2,
        );
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  });
}

// ─── Video player ───────────────────────────────────────────────

/// Mount a transparent WebM overlay covering the viewport, play it
/// once, remove it, resolve. Centred + cover-fit so the video's
/// composition fills the screen without distortion.
///
/// Audio: the WebMs carry baked-in unlock sound effects (Opus 96 kb/s
/// at 48 kHz). We try unmuted autoplay first since the achievement
/// trigger always follows a user gesture (lesson submit, level
/// transition, etc.) which satisfies the browser's autoplay-with-
/// audio policy. If the play() promise rejects (rare — would mean
/// the gesture token expired), we retry muted so the visual still
/// fires; the user just loses the audio cue for that one unlock.
function playVideo(src: string): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  return new Promise<void>((resolve) => {
    const video = document.createElement("video");
    video.src = src;
    // Default to unmuted — the video's audio IS the achievement
    // sound now. The retry path below silently flips this if the
    // browser blocks unmuted autoplay.
    video.muted = false;
    video.playsInline = true;
    video.autoplay = true;
    video.controls = false;
    video.setAttribute("aria-hidden", "true");
    video.style.position = "fixed";
    video.style.inset = "0";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "contain";
    // Same z-band as the static puff: above page chrome (80) but
    // below modal backdrops (200) so videos paint behind a popped
    // achievement modal rather than over the badge artwork.
    video.style.zIndex = "90";
    video.style.pointerEvents = "none";

    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      video.remove();
      resolve();
    };
    video.addEventListener("ended", finish, { once: true });
    video.addEventListener("error", finish, { once: true });
    // Hard timeout in case `ended` never fires on a malformed asset.
    // The longest video in the pool is ~8 s; 12 s gives generous
    // headroom for a slow load before the cleanup kicks in.
    window.setTimeout(finish, 12_000);

    document.body.appendChild(video);
    // Try unmuted autoplay first; fall back to muted if the browser
    // blocks (NotAllowedError) so the visual cue still fires.
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => finish());
    });
  });
}

// ─── Public API ─────────────────────────────────────────────────

function pickEffect(weights: Record<CelebrationEffect, number>): CelebrationEffect {
  const entries = Object.entries(weights).filter(([, w]) => w > 0) as Array<[CelebrationEffect, number]>;
  if (entries.length === 0) return "ribbon-vortex";
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [eff, w] of entries) {
    r -= w;
    if (r <= 0) return eff;
  }
  return entries[entries.length - 1][0];
}

function targetToOrigin(target: { x: number; y: number } | HTMLElement | undefined): { x: number; y: number } {
  if (!target) return { x: 0.5, y: 0.5 };
  if (typeof window !== "undefined" && target instanceof HTMLElement) {
    const rect = target.getBoundingClientRect();
    return {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
  }
  return target as { x: number; y: number };
}

function srcFor(effect: CelebrationEffect): string {
  // Vite's BASE_URL prefix handles the embedded /learn/ build path
  // (/learn/celebrations/...) without any conditional logic at the
  // call site.
  const base =
    typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL
      : "/";
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmed}/celebrations/${effect}.webm`;
}

/// Fire a randomly-chosen unlock animation. Drop-in replacement for
/// the legacy `confettiBurst` — same `(preset, target?, opts?)`
/// signature, but the implementation now plays a transparent-WebM
/// overlay instead of a canvas particle system.
///
/// `preset` is preserved for API compatibility but doesn't change
/// the visual: each video is its own composition with a baked-in
/// intensity, so the size/loudness knob doesn't really apply. The
/// argument stays so callers don't have to change.
///
/// Returns a Promise that resolves when the video ends (or
/// immediately under reduced motion + the static-puff fallback).
export function celebrate(
  _preset: ConfettiPreset,
  target?: { x: number; y: number } | HTMLElement,
  opts: CelebrateOptions = {},
): Promise<void> {
  if (reducedMotion()) return staticPuff(target);
  if (opts.src) return playVideo(opts.src);
  const weights: Record<CelebrationEffect, number> = {
    ...DEFAULT_WEIGHTS,
    ...(opts.weights ?? {}),
  };
  const effect = opts.effect ?? pickEffect(weights);
  return playVideo(srcFor(effect));
}

/// Force a specific effect — useful for tests or onboarding flows
/// where a designer wants to guarantee a particular cue.
export function celebrateWith(
  effect: CelebrationEffect,
  preset: ConfettiPreset = "medium",
  target?: { x: number; y: number } | HTMLElement,
): Promise<void> {
  return celebrate(preset, target, { effect });
}

/// Abort any in-flight effects. Tests + route changes call this
/// so a pending video doesn't trail across navigation.
export function clearCelebrations(): void {
  if (typeof document === "undefined") return;
  // Remove every overlay video AND every fallback-puff canvas the
  // module has appended to the body. The CSS selector matches our
  // `aria-hidden="true"` + position:fixed, which is unique enough to
  // not snag unrelated elements; in practice only this module mounts
  // those exact attribute combos at the body root.
  for (const el of document.querySelectorAll(
    'video[aria-hidden="true"][style*="z-index: 90"]',
  )) {
    el.remove();
  }
  for (const el of document.querySelectorAll(
    'canvas[aria-hidden="true"][style*="z-index: 90"]',
  )) {
    el.remove();
  }
  // Also nudge the legacy confetti canvas in case anything still
  // references it.
  void confettiBurst; // keep import live (no-op reference)
}
