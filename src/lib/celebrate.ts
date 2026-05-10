/// Random-effect celebration cue. Replaces direct `confettiBurst`
/// calls at every "you unlocked something" surface so the visual
/// language stays surprising — confetti is still one option, but it
/// shows up roughly 1 in 6 unlocks instead of every time.
///
/// The pool of effects, per call:
///
///   1. confetti      — the existing ribbon-rectangle storm
///                      (delegates to lib/confetti.ts)
///   2. comet-streak  — one or two bright coral comets whip up across
///                      the viewport with fading tails — single
///                      dramatic trajectory rather than a particle
///                      cloud
///   3. ribbon-swoosh — 4-6 coral ribbon arcs sweep outward from the
///                      origin in a flexed-bow pattern, then settle
///   4. coin-shower   — gold coin discs cascade widely with tumble +
///                      bounce; reads as "treasure" not "party"
///   5. pulse-rings   — three concentric ribbon rings expand from
///                      origin and fade (the calm option)
///   6. petal-drift   — coral and cream petals fall slowly from above
///                      origin with rotation + sin-wave wobble — the
///                      gentlest, most organic option
///
/// All effects:
///   - run on the same fixed-position canvas overlay (one per page)
///   - respect prefers-reduced-motion via the shared static-dot
///     fallback
///   - return a Promise that resolves when the effect's particles
///     have all expired
///   - accept the same `(preset, target?)` signature as the old
///     `confettiBurst` so call sites get a one-line swap
///
/// Effect selection is weighted — calmer effects (pulse, petal)
/// fire more often than the showy ones (confetti, coin-shower) so
/// the every-other-unlock cadence reads as varied without being
/// loud. Override the weights by passing `{ effect: "...", weight: 1 }`
/// in opts to force a specific effect (useful in onboarding flows
/// where a designer wants the bigger gesture).

import { confettiBurst, type ConfettiPreset } from "./confetti";

export type CelebrationEffect =
  | "confetti"
  | "comet-streak"
  | "ribbon-swoosh"
  | "coin-shower"
  | "pulse-rings"
  | "petal-drift";

/// Default weights — higher = more likely. The calm effects out-vote
/// the loud ones so a typical unlock burst feels novel without being
/// an assault. Confetti gets a low weight precisely because the user
/// asked for it to feel less ubiquitous.
const DEFAULT_WEIGHTS: Record<CelebrationEffect, number> = {
  confetti: 1,
  "comet-streak": 2,
  "ribbon-swoosh": 2,
  "coin-shower": 1,
  "pulse-rings": 3,
  "petal-drift": 3,
};

export interface CelebrateOptions {
  /// Force a specific effect — useful when a designer wants to
  /// guarantee a particular cue (e.g. coin-shower for the "first
  /// XP earned" toast). Skips the weighted random pick.
  effect?: CelebrationEffect;
  /// Override the weight table (per-call). Effects with weight 0 are
  /// excluded from the pick. Anything missing keeps its default.
  weights?: Partial<Record<CelebrationEffect, number>>;
}

// ─── Shared canvas (one per page) ────────────────────────────────
// Borrowed from confetti.ts but kept independent so the two can
// coexist without one resetting the other's transform. Both layer
// fixed-position with pointer-events:none, and both clean up their
// own particles once empty.

let canvas: HTMLCanvasElement | null = null;
let cctx: CanvasRenderingContext2D | null = null;
let rafHandle: number | null = null;
let lastFrameTs = 0;
const tickers: Array<(now: number, dt: number) => boolean> = [];

function ensureCanvas(): boolean {
  if (typeof document === "undefined") return false;
  if (canvas && cctx) return true;
  canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  // One above the confetti canvas so layered effects (rare) sit on
  // top, rather than under, the existing storm.
  canvas.style.zIndex = "9998";
  canvas.setAttribute("aria-hidden", "true");
  cctx = canvas.getContext("2d");
  if (!cctx) {
    canvas = null;
    return false;
  }
  resize();
  document.body.appendChild(canvas);
  window.addEventListener("resize", resize);
  return true;
}

function resize(): void {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  if (cctx) cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function reducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/// Drive the rAF loop while at least one ticker remains alive. Each
/// ticker returns `true` to keep going, `false` when it's done; on
/// false it's removed from the list. When the list empties, the
/// loop stops and the canvas clears.
function tick(now: number): void {
  if (!cctx || !canvas) return;
  const dt = lastFrameTs ? Math.min(2, (now - lastFrameTs) / 16.67) : 1;
  lastFrameTs = now;
  cctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = tickers.length - 1; i >= 0; i--) {
    const alive = tickers[i](now, dt);
    if (!alive) tickers.splice(i, 1);
  }
  if (tickers.length > 0) {
    rafHandle = requestAnimationFrame(tick);
  } else {
    rafHandle = null;
    lastFrameTs = 0;
  }
}

function startTicker(fn: (now: number, dt: number) => boolean): void {
  tickers.push(fn);
  if (rafHandle === null) {
    lastFrameTs = 0;
    rafHandle = requestAnimationFrame(tick);
  }
}

// ─── Brand palette ───────────────────────────────────────────────

const CORAL = "#f37239";
const CORAL_DEEP = "#d94c1f";
const AMBER = "#ffc857";
const CREAM = "#fff5e6";
const PEACH = "#ffd4a3";
const ROSE = "#ff9b8a";

const RIBBON_PALETTE = [CORAL, CORAL_DEEP, AMBER, PEACH, ROSE];
const COIN_PALETTE = ["#f7c948", "#ffd97a", "#e09a1d", "#fff1b0"];

// ─── Effect: comet streak ────────────────────────────────────────
// One or two coral comets whip up across the viewport with fading
// tails. Single-trajectory drama instead of a particle cloud — gives
// the variety pool a "swoosh moment" that reads as motion-narrative
// rather than the omnidirectional bursts every other effect is.
//
// Each comet keeps a short ring-buffer of past positions (the trail);
// the renderer walks the trail back-to-front drawing line segments
// with progressively lower alpha. Head is a bright disc on top.

interface Comet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number; // small lateral curve so the trajectory arcs
  ay: number;
  trail: Array<{ x: number; y: number }>;
  trailMax: number;
  size: number;
  colour: string;
  age: number;
  ttl: number;
}

function effectCometStreak(origin: { x: number; y: number }, count: number): Promise<void> {
  if (!ensureCanvas() || !cctx || !canvas) return Promise.resolve();
  const ox = origin.x * window.innerWidth;
  const oy = origin.y * window.innerHeight;
  const comets: Comet[] = [];
  // Spawn comets in alternating directions so two-or-three of them
  // criss-cross the viewport rather than streaming the same way.
  for (let i = 0; i < count; i++) {
    // Aim around -π/2 (straight up) but rotate each comet a wider
    // step so they fan distinctly across the upper hemisphere.
    const fan = ((i / Math.max(1, count - 1)) - 0.5) * 1.6;
    const angle = -Math.PI / 2 + fan;
    const speed = 14 + Math.random() * 8;
    const swirl = (i % 2 === 0 ? -1 : 1) * (0.04 + Math.random() * 0.06);
    comets.push({
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      // Small constant acceleration perpendicular to the launch
      // angle = a curving arc instead of a straight line.
      ax: -Math.sin(angle) * swirl,
      ay: Math.cos(angle) * swirl,
      trail: [],
      trailMax: 16,
      size: 3 + Math.random() * 2,
      colour: i % 2 === 0 ? CORAL : AMBER,
      age: 0,
      ttl: 60 + Math.floor(Math.random() * 18),
    });
  }
  return new Promise<void>((resolve) => {
    startTicker((_now, dt) => {
      const ctx = cctx!;
      let alive = false;
      for (const c of comets) {
        c.age += dt;
        if (c.age > c.ttl) continue;
        // Push current position into the trail, then advance.
        c.trail.push({ x: c.x, y: c.y });
        if (c.trail.length > c.trailMax) c.trail.shift();
        c.vx += c.ax * dt;
        c.vy += c.ay * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        const f = c.age / c.ttl;
        const fade = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3;
        // Walk the trail back-to-front with progressive alpha so the
        // tail fades smoothly rather than ending in a hard cap.
        ctx.save();
        ctx.lineCap = "round";
        ctx.strokeStyle = c.colour;
        for (let i = 1; i < c.trail.length; i++) {
          const prev = c.trail[i - 1];
          const cur = c.trail[i];
          const seg = i / c.trail.length;
          ctx.globalAlpha = seg * 0.85 * fade;
          ctx.lineWidth = c.size * (0.4 + seg * 0.8);
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(cur.x, cur.y);
          ctx.stroke();
        }
        // Bright head — a small filled disc with a soft outer glow
        // (radial gradient) so the leading point reads as energy, not
        // just the end of a line.
        const grad = ctx.createRadialGradient(
          c.x, c.y, 0,
          c.x, c.y, c.size * 4,
        );
        grad.addColorStop(0, c.colour);
        grad.addColorStop(0.5, c.colour);
        grad.addColorStop(1, "rgba(243, 114, 57, 0)");
        ctx.globalAlpha = 0.9 * fade;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        alive = true;
      }
      if (!alive) {
        resolve();
        return false;
      }
      return true;
    });
  });
}

// ─── Effect: ribbon swoosh ───────────────────────────────────────
// 5 ribbon arcs flex outward from the origin like a bow opening.
// Each arc is a quadratic bezier whose progress runs 0→1 then fades.

interface RibbonArc {
  angle: number;
  spread: number;
  length: number;
  width: number;
  colour: string;
  age: number;
  ttl: number;
}

function effectRibbonSwoosh(origin: { x: number; y: number }, count: number): Promise<void> {
  if (!ensureCanvas() || !cctx || !canvas) return Promise.resolve();
  const ox = origin.x * window.innerWidth;
  const oy = origin.y * window.innerHeight;
  const arcs: RibbonArc[] = [];
  // Five ribbons fanning around an upward axis.
  for (let i = 0; i < count; i++) {
    const t = (i / Math.max(1, count - 1)) * 2 - 1; // -1..1
    arcs.push({
      angle: -Math.PI / 2 + t * 0.9, // around straight up
      spread: 0.55 + Math.random() * 0.25,
      length: 110 + Math.random() * 80,
      width: 5 + Math.random() * 4,
      colour: RIBBON_PALETTE[i % RIBBON_PALETTE.length],
      age: 0,
      ttl: 50 + Math.floor(Math.random() * 12),
    });
  }
  return new Promise<void>((resolve) => {
    startTicker((_now, dt) => {
      const ctx = cctx!;
      let alive = false;
      for (const a of arcs) {
        a.age += dt;
        if (a.age > a.ttl) continue;
        const f = Math.min(1, a.age / a.ttl);
        // easeOutBack so the arc whips out then settles
        const ease = easeOutBack(f);
        const tipX = ox + Math.cos(a.angle) * a.length * ease;
        const tipY = oy + Math.sin(a.angle) * a.length * ease;
        const ctrlX = ox + Math.cos(a.angle - a.spread) * a.length * 0.7 * ease;
        const ctrlY = oy + Math.sin(a.angle - a.spread) * a.length * 0.7 * ease;
        const fade = f < 0.6 ? 1 : 1 - (f - 0.6) / 0.4;
        ctx.save();
        ctx.globalAlpha = Math.max(0, fade);
        ctx.strokeStyle = a.colour;
        ctx.lineWidth = a.width;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
        ctx.stroke();
        ctx.restore();
        alive = true;
      }
      if (!alive) {
        resolve();
        return false;
      }
      return true;
    });
  });
}

function easeOutBack(t: number): number {
  const c1 = 1.6;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ─── Effect: coin shower ─────────────────────────────────────────
// Gold disc-shaped coins fall with gravity + tumble, bouncing once
// near the bottom of the viewport before settling out.

interface Coin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  spin: number;
  spinSpeed: number;
  colour: string;
  bounced: boolean;
  age: number;
  ttl: number;
}

function effectCoinShower(origin: { x: number; y: number }, count: number): Promise<void> {
  if (!ensureCanvas() || !cctx || !canvas) return Promise.resolve();
  const ox = origin.x * window.innerWidth;
  const oy = origin.y * window.innerHeight;
  const ground = window.innerHeight - 40;
  const coins: Coin[] = [];
  for (let i = 0; i < count; i++) {
    // Spawn region + initial lateral velocity widened so coins fan
    // out across the lower viewport instead of clustering near the
    // origin. `vx` ranges roughly ±8 instead of ±2 (4× the spread)
    // and the spawn x ranges ±90 instead of ±15 (6× the spread) so
    // the resulting cascade reads as a real "shower" instead of a
    // tight column.
    coins.push({
      x: ox + (Math.random() - 0.5) * 180,
      y: oy + (Math.random() - 0.5) * 24,
      vx: (Math.random() - 0.5) * 16,
      vy: -2 - Math.random() * 4,
      r: 5 + Math.random() * 4,
      spin: Math.random() * Math.PI,
      spinSpeed: (Math.random() - 0.5) * 0.4,
      colour: COIN_PALETTE[i % COIN_PALETTE.length],
      bounced: false,
      age: 0,
      ttl: 110 + Math.floor(Math.random() * 60),
    });
  }
  return new Promise<void>((resolve) => {
    startTicker((_now, dt) => {
      const ctx = cctx!;
      let alive = false;
      for (const c of coins) {
        c.age += dt;
        if (c.age > c.ttl) continue;
        c.vy += 0.34 * dt;
        c.vx *= 0.992;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.spin += c.spinSpeed * dt;
        if (!c.bounced && c.y > ground) {
          c.y = ground;
          c.vy *= -0.42;
          c.vx *= 0.7;
          c.bounced = true;
        }
        if (c.bounced && Math.abs(c.vy) < 0.2) {
          // Settle: just sit there fading.
        }
        const f = c.age / c.ttl;
        const fade = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3;
        ctx.save();
        ctx.translate(c.x, c.y);
        // Tumble = vertical squash by |cos(spin)| so the coin "flips"
        ctx.scale(1, Math.abs(Math.cos(c.spin)));
        ctx.globalAlpha = Math.max(0, fade);
        ctx.fillStyle = c.colour;
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, Math.PI * 2);
        ctx.fill();
        // Inner highlight ring for the "metallic" cue.
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, c.r * 0.65, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        alive = true;
      }
      if (!alive) {
        resolve();
        return false;
      }
      return true;
    });
  });
}

// ─── Effect: pulse rings ─────────────────────────────────────────
// Three concentric rings expand from origin and fade. Calm + ambient.

function effectPulseRings(origin: { x: number; y: number }, count: number): Promise<void> {
  if (!ensureCanvas() || !cctx || !canvas) return Promise.resolve();
  const ox = origin.x * window.innerWidth;
  const oy = origin.y * window.innerHeight;
  const rings = Array.from({ length: count }, (_, i) => ({
    delay: i * 8,
    age: 0,
    ttl: 50,
    maxRadius: 120 + i * 20,
    colour: i % 2 === 0 ? CORAL : AMBER,
    width: 3,
  }));
  return new Promise<void>((resolve) => {
    startTicker((_now, dt) => {
      const ctx = cctx!;
      let alive = false;
      for (const r of rings) {
        r.age += dt;
        const tt = r.age - r.delay;
        if (tt < 0 || tt > r.ttl) {
          if (tt < 0) alive = true; // still waiting
          continue;
        }
        const f = tt / r.ttl;
        const radius = f * r.maxRadius;
        const alpha = 1 - f;
        ctx.save();
        ctx.globalAlpha = alpha * 0.85;
        ctx.strokeStyle = r.colour;
        ctx.lineWidth = r.width * (1 - f * 0.5);
        ctx.beginPath();
        ctx.arc(ox, oy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        alive = true;
      }
      if (!alive) {
        resolve();
        return false;
      }
      return true;
    });
  });
}

// ─── Effect: petal drift ─────────────────────────────────────────
// Cherry-blossom-style coral and cream petals fall slowly from above
// the origin, rotating + drifting laterally with a sin-wave wobble.
// The most organic + gentle effect in the pool — replaces firefly's
// "calm" slot with something that has more shape than a dot.
//
// Petals spawn ABOVE the origin and fall PAST it (gravity-positive),
// so the effect frames the achievement as "blossoms drifting down on
// you" rather than "dots floating up away from the centre".

const PETAL_PALETTE = [CORAL, PEACH, ROSE, CREAM, "#ffd9c2"];

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  rotSpeed: number;
  colour: string;
  age: number;
  ttl: number;
  wobble: number;
  wobbleSpeed: number;
  wobbleAmp: number;
}

function effectPetalDrift(origin: { x: number; y: number }, count: number): Promise<void> {
  if (!ensureCanvas() || !cctx || !canvas) return Promise.resolve();
  const ox = origin.x * window.innerWidth;
  const oy = origin.y * window.innerHeight;
  const petals: Petal[] = [];
  for (let i = 0; i < count; i++) {
    petals.push({
      // Spawn in a wide arc above the origin so the petal field
      // covers the upper third of the viewport rather than streaming
      // from a single point.
      x: ox + (Math.random() - 0.5) * 320,
      y: oy - 40 - Math.random() * 120,
      // Tiny initial velocities — gravity dominates.
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0.4 + Math.random() * 0.6,
      size: 6 + Math.random() * 5,
      rot: Math.random() * Math.PI * 2,
      // Petals tumble slowly so the rotation reads as drift, not spin.
      rotSpeed: (Math.random() - 0.5) * 0.06,
      colour: PETAL_PALETTE[i % PETAL_PALETTE.length],
      age: 0,
      ttl: 130 + Math.floor(Math.random() * 80),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.03 + Math.random() * 0.03,
      wobbleAmp: 0.6 + Math.random() * 0.6,
    });
  }
  return new Promise<void>((resolve) => {
    startTicker((_now, dt) => {
      const ctx = cctx!;
      let alive = false;
      for (const p of petals) {
        p.age += dt;
        if (p.age > p.ttl) continue;
        // Slow falling gravity — petals are light, so the constant
        // is much smaller than the coin shower.
        p.vy += 0.012 * dt;
        // Air drag — keeps the lateral wobble from accumulating.
        p.vx *= 0.99;
        p.wobble += p.wobbleSpeed * dt;
        // Lateral wobble adds the "leaf falling" character — petals
        // sway side-to-side under their own air resistance.
        p.x += (p.vx + Math.sin(p.wobble) * p.wobbleAmp) * dt;
        p.y += p.vy * dt;
        p.rot += p.rotSpeed * dt;
        const t = p.age / p.ttl;
        // Slow fade-in over first 15 % so petals appear gracefully
        // from above rather than popping in; long bell-curve to fully
        // off in the last 30 %.
        const alpha =
          t < 0.15 ? t / 0.15 : t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // Tumble — squash the petal vertically by |cos(wobble*0.6)|
        // so it visually "flips" as it drifts.
        ctx.scale(1, 0.5 + 0.5 * Math.abs(Math.cos(p.wobble * 0.6)));
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = p.colour;
        // Teardrop / petal shape via two quadratic curves meeting at
        // top + bottom points. The shape reads as a stylised petal at
        // any size; bezier control points are tuned so the silhouette
        // doesn't read as a leaf or a flame.
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s, -s * 0.2, 0, s);
        ctx.quadraticCurveTo(-s, -s * 0.2, 0, -s);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        alive = true;
      }
      if (!alive) {
        resolve();
        return false;
      }
      return true;
    });
  });
}

// ─── Reduced-motion fallback ─────────────────────────────────────

function staticPuff(origin: { x: number; y: number }): Promise<void> {
  if (!ensureCanvas() || !cctx || !canvas) return Promise.resolve();
  const ox = origin.x * window.innerWidth;
  const oy = origin.y * window.innerHeight;
  const start = performance.now();
  const dur = 700;
  return new Promise<void>((resolve) => {
    const draw = (t: number) => {
      if (!cctx || !canvas) return;
      const elapsed = t - start;
      cctx.clearRect(0, 0, canvas.width, canvas.height);
      if (elapsed >= dur) {
        resolve();
        return;
      }
      const f = elapsed / dur;
      const alpha = f < 0.4 ? f / 0.4 : 1 - (f - 0.4) / 0.6;
      cctx.globalAlpha = alpha;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = 22 + (i % 2 ? 6 : 0);
        cctx.fillStyle = i % 2 === 0 ? CORAL : AMBER;
        cctx.beginPath();
        cctx.arc(ox + Math.cos(angle) * r * (0.6 + f), oy + Math.sin(angle) * r * (0.6 + f), 4, 0, Math.PI * 2);
        cctx.fill();
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  });
}

// ─── Public API ──────────────────────────────────────────────────

const PRESET_INTENSITY: Record<ConfettiPreset, { confettiCount: number; cometCount: number; ribbonCount: number; coinCount: number; pulseCount: number; petalCount: number }> = {
  // Comet count stays low (1-3) on purpose — comets are dramatic
  // single trajectories, not a particle cloud, so even the "large"
  // preset only needs a handful to fan across the upper viewport.
  small:  { confettiCount: 16, cometCount: 1, ribbonCount: 4, coinCount: 10, pulseCount: 2, petalCount: 12 },
  medium: { confettiCount: 60, cometCount: 2, ribbonCount: 6, coinCount: 22, pulseCount: 3, petalCount: 22 },
  large:  { confettiCount: 140, cometCount: 3, ribbonCount: 8, coinCount: 36, pulseCount: 4, petalCount: 34 },
};

function pickEffect(weights: Record<CelebrationEffect, number>): CelebrationEffect {
  const entries = Object.entries(weights).filter(([, w]) => w > 0) as Array<[CelebrationEffect, number]>;
  if (entries.length === 0) return "pulse-rings";
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [eff, w] of entries) {
    r -= w;
    if (r <= 0) return eff;
  }
  return entries[entries.length - 1][0];
}

function targetToOrigin(target: { x: number; y: number } | HTMLElement | undefined): { x: number; y: number } {
  if (!target) return { x: 0.5, y: 0.25 };
  if (typeof window !== "undefined" && target instanceof HTMLElement) {
    const rect = target.getBoundingClientRect();
    return {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
  }
  return target as { x: number; y: number };
}

/// Fire a randomly-chosen celebration effect. Drop-in replacement
/// for `confettiBurst` — same signature, broader visual vocabulary.
///
/// Returns a Promise that resolves when the chosen effect's
/// particles have all expired (or immediately under reduced motion).
export function celebrate(
  preset: ConfettiPreset,
  target?: { x: number; y: number } | HTMLElement,
  opts: CelebrateOptions = {},
): Promise<void> {
  const origin = targetToOrigin(target);
  if (reducedMotion()) return staticPuff(origin);
  const weights: Record<CelebrationEffect, number> = {
    ...DEFAULT_WEIGHTS,
    ...(opts.weights ?? {}),
  };
  const effect = opts.effect ?? pickEffect(weights);
  const count = PRESET_INTENSITY[preset];
  switch (effect) {
    case "confetti":
      return confettiBurst(preset, target);
    case "comet-streak":
      return effectCometStreak(origin, count.cometCount);
    case "ribbon-swoosh":
      return effectRibbonSwoosh(origin, count.ribbonCount);
    case "coin-shower":
      return effectCoinShower(origin, count.coinCount);
    case "pulse-rings":
      return effectPulseRings(origin, count.pulseCount);
    case "petal-drift":
      return effectPetalDrift(origin, count.petalCount);
  }
}

/// Force a specific effect — useful for tests or onboarding flows
/// where a designer wants to guarantee a particular cue.
export function celebrateWith(
  effect: CelebrationEffect,
  preset: ConfettiPreset,
  target?: { x: number; y: number } | HTMLElement,
): Promise<void> {
  return celebrate(preset, target, { effect });
}

/// Abort any in-flight effects. Pairs with route changes / tests.
export function clearCelebrations(): void {
  tickers.length = 0;
  if (rafHandle !== null) {
    cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }
  if (cctx && canvas) {
    cctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
