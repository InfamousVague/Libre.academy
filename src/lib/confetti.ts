/// Tiny dependency-free confetti / particle system.
///
/// One canvas per page, sized to the viewport, fixed-positioned at
/// pointer-events:none so clicks pass through. Particles are
/// rectangular ribbons (matches the brand's ribbon-snake covers),
/// spawned in waves with per-spawn colour palettes, simulated under
/// a basic physics step (gravity + air drag + 2-axis rotation), and
/// removed when off-screen.
///
/// API
///   - `confetti(opts)` — fire one burst (default 60 particles,
///     centered on the viewport top-third). Returns a promise that
///     resolves when the last particle from this burst expires —
///     useful when a caller wants to fire confetti, then await its
///     "done" beat before sequencing the next animation.
///   - `confettiBurst(preset, target?)` — preset shorthand for
///     `small` / `medium` / `large` matching the achievement tier
///     vocabulary in `acheive_prompts.md`.
///   - `clearConfetti()` — abort any in-flight burst, useful for
///     tests or page-route changes.
///
/// `prefers-reduced-motion`: when set, every burst short-circuits to
/// a single static glyph fade-in/out, no physics. We don't disable
/// the cue entirely — the visual confirmation of "you unlocked
/// something" still matters; just the bouncing is what motion-
/// sensitive users want suppressed.
///
/// Performance: an idle canvas costs nothing (we tear down the rAF
/// loop when no particles are alive). At 60 particles per burst,
/// each frame draws 60 fillRect calls — well inside the budget on
/// any device that can render the rest of the app.

export type ConfettiPreset = "small" | "medium" | "large";

export interface ConfettiOptions {
  /// Particle count. Overrides the preset. Default 60.
  count?: number;
  /// Origin in normalised viewport coords (0..1). Default
  /// `{ x: 0.5, y: 0.25 }` — centered horizontally, top-quarter
  /// vertically (where most modal headers sit).
  origin?: { x: number; y: number };
  /// Spread cone half-angle in degrees from "straight up" (negative
  /// y in canvas coords). Default 50 — fan covers most of the upper
  /// hemisphere.
  spreadDeg?: number;
  /// Initial speed range (px/frame@60fps). Default [6, 14].
  speed?: [number, number];
  /// Hex colour palette. Default a warm Libre-aligned set; pass tier
  /// colours for tier-themed bursts.
  palette?: string[];
  /// Override the seed for the rng (useful in tests). Default uses
  /// `Math.random()`.
  seed?: number;
}

const DEFAULT_PALETTE = [
  "#ffc857", // gold
  "#cd7f32", // bronze
  "#b9f2ff", // platinum
  "#f37239", // libre coral
  "#fff5e6", // cream
];

const PRESET_COUNT: Record<ConfettiPreset, number> = {
  small: 16,
  medium: 60,
  large: 140,
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  // Two-axis rotation: spin (in-plane) + tumble (out-of-plane —
  // simulated by squashing the rectangle's vertical scale by cos
  // of the tumble angle so the ribbon "flips" as it falls).
  rot: number;
  rotSpeed: number;
  tumble: number;
  tumbleSpeed: number;
  width: number;
  height: number;
  colour: string;
  /// Lifetime so we can fade the last 20 % alpha-wise instead of
  /// popping particles out abruptly.
  age: number;
  ttl: number;
}

let canvas: HTMLCanvasElement | null = null;
let cctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let rafHandle: number | null = null;
let lastFrameTs = 0;
const pendingDoneResolvers: Array<() => void> = [];

function ensureCanvas(): boolean {
  if (typeof document === "undefined") return false;
  if (canvas && cctx) return true;
  canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  // Same band as celebrate.ts — above page chrome (80) but below
  // modal backdrops (200) so confetti fires behind a popped modal
  // rather than over the panel artwork. One up from celebrate's 90
  // so layered confetti+celebrate (rare) draws confetti in front.
  canvas.style.zIndex = "91";
  canvas.setAttribute("aria-hidden", "true");
  cctx = canvas.getContext("2d");
  if (!cctx) {
    canvas = null;
    return false;
  }
  resize();
  document.body.appendChild(canvas);
  // Track viewport changes so the particle field re-anchors. We use
  // visualViewport when available (handles mobile soft-keyboard
  // flexes) and fall back to window.
  window.addEventListener("resize", resize);
  return true;
}

function resize(): void {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  if (cctx) cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function reducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function makeRng(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let s = seed | 0 || 1;
  return () => {
    // mulberry32 — fine for visual randomness, deterministic for tests
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/// Internal: spawn `count` particles around an origin.
function spawn(opts: Required<Pick<ConfettiOptions, "count" | "origin" | "spreadDeg" | "speed" | "palette">> & { rng: () => number }): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const ox = opts.origin.x * w;
  const oy = opts.origin.y * h;
  const spreadRad = (opts.spreadDeg * Math.PI) / 180;
  for (let i = 0; i < opts.count; i++) {
    // Direction in [-π/2 - spread, -π/2 + spread] — i.e. fan around
    // straight up (-y). Random within the cone.
    const angle = -Math.PI / 2 + (opts.rng() * 2 - 1) * spreadRad;
    const speed =
      opts.speed[0] + opts.rng() * (opts.speed[1] - opts.speed[0]);
    const colour =
      opts.palette[Math.floor(opts.rng() * opts.palette.length)];
    particles.push({
      x: ox + (opts.rng() - 0.5) * 8,
      y: oy + (opts.rng() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: opts.rng() * Math.PI * 2,
      rotSpeed: (opts.rng() - 0.5) * 0.2,
      tumble: opts.rng() * Math.PI * 2,
      tumbleSpeed: (opts.rng() - 0.5) * 0.3,
      width: 6 + opts.rng() * 6,
      height: 10 + opts.rng() * 8,
      colour,
      age: 0,
      ttl: 90 + Math.floor(opts.rng() * 60),
    });
  }
}

const GRAVITY = 0.18; // px/frame²
const DRAG = 0.985; // velocity multiplier per frame

function step(now: number): void {
  if (!cctx || !canvas) return;
  const dtRatio = lastFrameTs ? Math.min(2, (now - lastFrameTs) / 16.67) : 1;
  lastFrameTs = now;
  cctx.clearRect(0, 0, canvas.width, canvas.height);
  const next: Particle[] = [];
  for (const p of particles) {
    p.vy += GRAVITY * dtRatio;
    p.vx *= DRAG;
    p.vy *= DRAG;
    p.x += p.vx * dtRatio;
    p.y += p.vy * dtRatio;
    p.rot += p.rotSpeed * dtRatio;
    p.tumble += p.tumbleSpeed * dtRatio;
    p.age += dtRatio;

    // Cull when off screen below or fully aged out.
    if (p.y - p.height > window.innerHeight) continue;
    if (p.age > p.ttl) continue;

    // Fade alpha over the last 20 % of life.
    const fadeFrom = p.ttl * 0.8;
    const alpha =
      p.age < fadeFrom ? 1 : Math.max(0, 1 - (p.age - fadeFrom) / (p.ttl - fadeFrom));

    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rot);
    // Tumble = vertical squash by |cos(tumble)| so the ribbon flips
    cctx.scale(1, Math.abs(Math.cos(p.tumble)));
    cctx.fillStyle = p.colour;
    cctx.globalAlpha = alpha;
    cctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
    cctx.restore();

    next.push(p);
  }
  particles = next;

  if (particles.length > 0) {
    rafHandle = requestAnimationFrame(step);
  } else {
    rafHandle = null;
    lastFrameTs = 0;
    // Drain queued resolvers — every burst's promise resolves when
    // the field actually empties (so callers can sequence on "done").
    while (pendingDoneResolvers.length > 0) {
      const fn = pendingDoneResolvers.shift();
      fn?.();
    }
  }
}

/// Reduced-motion fallback: no physics, just a static dot field
/// fades in and back out near the origin. Same call shape so
/// callers don't have to special-case.
function staticBurst(origin: { x: number; y: number }, palette: string[]): void {
  if (!ensureCanvas() || !cctx || !canvas) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const ox = origin.x * w;
  const oy = origin.y * h;
  const start = performance.now();
  const dur = 800;
  const dots = palette.slice(0, 6).map((c, i) => ({
    c,
    angle: (i / 6) * Math.PI * 2,
    r: 22 + (i % 2 ? 6 : 0),
  }));
  const draw = (t: number) => {
    if (!cctx || !canvas) return;
    const elapsed = t - start;
    cctx.clearRect(0, 0, canvas.width, canvas.height);
    if (elapsed >= dur) return;
    const f = elapsed / dur;
    // Quick easeOut alpha bell — peaks at 0.4, fades to 0.
    const alpha = f < 0.4 ? f / 0.4 : 1 - (f - 0.4) / 0.6;
    cctx.globalAlpha = alpha;
    for (const d of dots) {
      cctx.fillStyle = d.c;
      cctx.beginPath();
      cctx.arc(
        ox + Math.cos(d.angle) * d.r * (0.6 + f),
        oy + Math.sin(d.angle) * d.r * (0.6 + f),
        4,
        0,
        Math.PI * 2,
      );
      cctx.fill();
    }
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}

/// Fire one confetti burst. Returns a promise that resolves when the
/// burst's particles have all expired (or immediately under reduced
/// motion).
export function confetti(opts: ConfettiOptions = {}): Promise<void> {
  if (!ensureCanvas()) return Promise.resolve();
  const palette = opts.palette ?? DEFAULT_PALETTE;
  const origin = opts.origin ?? { x: 0.5, y: 0.25 };
  if (reducedMotion()) {
    staticBurst(origin, palette);
    return Promise.resolve();
  }
  const rng = makeRng(opts.seed);
  spawn({
    count: opts.count ?? 60,
    origin,
    spreadDeg: opts.spreadDeg ?? 50,
    speed: opts.speed ?? [6, 14],
    palette,
    rng,
  });
  if (rafHandle === null) {
    lastFrameTs = 0;
    rafHandle = requestAnimationFrame(step);
  }
  return new Promise<void>((resolve) => pendingDoneResolvers.push(resolve));
}

/// Convenience wrapper for tier-themed bursts. `target` lets the
/// caller anchor the burst on a specific element (the toast, the
/// modal badge, the streak chip) rather than the default top-third
/// of the viewport.
export function confettiBurst(
  preset: ConfettiPreset,
  target?: { x: number; y: number } | HTMLElement,
  palette?: string[],
): Promise<void> {
  let origin: { x: number; y: number } | undefined;
  if (target instanceof HTMLElement) {
    const rect = target.getBoundingClientRect();
    origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
  } else if (target && typeof target === "object") {
    origin = target;
  }
  return confetti({
    count: PRESET_COUNT[preset],
    origin,
    palette,
    speed: preset === "large" ? [8, 18] : preset === "medium" ? [6, 14] : [4, 10],
    spreadDeg: preset === "large" ? 60 : preset === "medium" ? 50 : 40,
  });
}

/// Abort any in-flight burst. Tests + route changes call this so
/// pending rAF doesn't trail a leftover canvas across pages.
export function clearConfetti(): void {
  particles = [];
  if (rafHandle !== null) {
    cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }
  if (cctx && canvas) {
    cctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  while (pendingDoneResolvers.length > 0) {
    const fn = pendingDoneResolvers.shift();
    fn?.();
  }
}
