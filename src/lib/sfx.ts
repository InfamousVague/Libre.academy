/// Synthesized sound-effect library.
///
/// Every effect is generated at runtime from the Web Audio API —
/// oscillators feeding into a gain node shaped by an ADSR envelope.
/// We ship zero MP3s for sounds; the entire library is a few hundred
/// lines of code that produces something Duolingo-shaped on demand.
///
/// Why synthesise instead of bundle audio:
///   - Bundle bytes: ~0 KB on the wire vs. ~30-80 KB per cue × 12 cues.
///   - Latency: single-frame schedule on the audio context vs. fetch
///     + decode + buffer-load (~200ms cold start the first time).
///   - Tweak loop: change a frequency / envelope and reload — no
///     re-encoding audio in a DAW. Useful for design iteration.
///   - Theme-able: the same generator can play "warmer" or "colder"
///     timbre by tweaking the oscillator type without re-recording.
///
/// Trade-off: synthesised cues sound more abstract/electronic than
/// recorded foley would. Acceptable here because the brand voice is
/// already that direction (libre.academy is digital, not pastoral).
///
/// Settings:
///   - `localStorage["fb:sfx:enabled"]`: "1" / "0" — global mute.
///   - `localStorage["fb:sfx:volume"]`: float 0..1 — master gain.
///   Both are read once at module load and re-read on a custom
///   `fb:sfx:settings-changed` event. The settings pane fires the
///   event after writing so we don't depend on the cross-tab
///   `storage` event (which doesn't fire same-tab).
///
/// API:
///   - `playSound(name, opts?)` — fire-and-forget; never throws.
///   - `getSfxSettings()`, `setSfxSettings(...)` — settings pane uses
///     these; the change broadcast keeps the in-module cache in sync.
///   - `unlockAudioContext()` — call from the first user gesture
///     handler if you want the context warmed before the first cue
///     fires (avoids the iOS Safari "first sound is silent" beat).

export type SfxName =
  | "ping"
  | "chime"
  | "success"
  | "fanfare"
  | "arpeggio"
  | "streak-tick"
  | "streak-flame"
  | "xp-pop"
  | "level-up"
  | "complete-section"
  | "complete-book"
  | "freeze";

export interface PlayOptions {
  /// Per-call volume scale, 0..1. Multiplies into the master volume.
  /// Default 1 (use the master volume directly).
  volume?: number;
  /// Override the global mute for this single call. Used by the
  /// settings pane's "Test sound" buttons so the user can hear a
  /// preview even when mute is on.
  ignoreMute?: boolean;
}

const ENABLED_KEY = "fb:sfx:enabled";
const VOLUME_KEY = "fb:sfx:volume";
const SETTINGS_EVENT = "fb:sfx:settings-changed";

/// Module-private context. Lazily created on first sound; iOS
/// Safari requires a user-gesture-driven creation, so building the
/// context only when needed is the safer pattern.
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

/// In-module cache of settings. Refreshed on the custom event the
/// settings pane fires after writing, AND on the cross-tab storage
/// event for the (rare) case of two open windows. Both update the
/// same source of truth (localStorage), so the cache is just a
/// hot-path read avoidance.
let settingsCache: SfxSettings = readFromStorage();

export interface SfxSettings {
  enabled: boolean;
  /// 0..1
  volume: number;
}

function readFromStorage(): SfxSettings {
  if (typeof localStorage === "undefined") {
    return { enabled: true, volume: 0.6 };
  }
  const enabledRaw = localStorage.getItem(ENABLED_KEY);
  const enabled = enabledRaw === null ? true : enabledRaw === "1";
  const volumeRaw = localStorage.getItem(VOLUME_KEY);
  let volume = 0.6;
  if (volumeRaw !== null) {
    const n = Number.parseFloat(volumeRaw);
    if (Number.isFinite(n) && n >= 0 && n <= 1) volume = n;
  }
  return { enabled, volume };
}

if (typeof window !== "undefined") {
  // Two refresh paths: (a) same-tab settings UI dispatching the
  // custom event after write, (b) cross-tab `storage` events for
  // the unusual two-windows-open case. Both rebuild the cache from
  // localStorage rather than trusting event payloads — keeps the
  // event surface tiny and immune to schema drift.
  window.addEventListener(SETTINGS_EVENT, () => {
    settingsCache = readFromStorage();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === ENABLED_KEY || e.key === VOLUME_KEY) {
      settingsCache = readFromStorage();
    }
  });
}

export function getSfxSettings(): SfxSettings {
  return settingsCache;
}

export function setSfxSettings(next: Partial<SfxSettings>): void {
  if (typeof localStorage === "undefined") return;
  if (next.enabled !== undefined) {
    localStorage.setItem(ENABLED_KEY, next.enabled ? "1" : "0");
  }
  if (next.volume !== undefined) {
    const clamped = Math.max(0, Math.min(1, next.volume));
    localStorage.setItem(VOLUME_KEY, String(clamped));
  }
  settingsCache = readFromStorage();
  if (masterGain && ctx) {
    masterGain.gain.setValueAtTime(settingsCache.volume, ctx.currentTime);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  }
}

/// Create the AudioContext on demand. Must be called from a
/// user-gesture handler at least once (browser policy). After the
/// first successful resume the context stays alive for the page
/// session.
function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === "undefined") return null;
  // AudioContext is the standard name; webkitAudioContext is the
  // safari-prefixed legacy. Both implement the same interface.
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(settingsCache.volume, ctx.currentTime);
    masterGain.connect(ctx.destination);
    return ctx;
  } catch {
    return null;
  }
}

/// Attempt to resume the context. Browsers freeze the audio context
/// in suspended state on page load until the first user gesture; the
/// `resume()` returns a promise we can ignore — failure means the
/// next play call will retry.
export async function unlockAudioContext(): Promise<void> {
  const c = ensureContext();
  if (!c) return;
  if (c.state === "suspended") {
    try {
      await c.resume();
    } catch {
      /* swallow — next play call will retry */
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Synth primitives. Each generator returns the time (in ctx time)
// at which the cue finishes — useful for chaining. All envelopes
// peak at -12 dBFS (max gain ≤ 0.25) so layering on top of speech
// or music doesn't clip.
// ─────────────────────────────────────────────────────────────────

interface ToneSpec {
  freq: number;
  /// Start offset relative to the play time (seconds).
  start: number;
  /// Total tone duration (seconds). Includes attack + hold + release.
  duration: number;
  /// Peak gain (0..1). Multiplied into the per-call volume + master.
  peak: number;
  /// Attack time (s). Default 0.005.
  attack?: number;
  /// Release time (s). Default 0.06.
  release?: number;
  /// Oscillator type. Default "sine".
  type?: OscillatorType;
  /// Glide-end frequency. When set, the oscillator slides from
  /// `freq` to `glideTo` over the tone's duration (linearly).
  glideTo?: number;
}

function scheduleTone(
  c: AudioContext,
  destination: AudioNode,
  spec: ToneSpec,
  perCallScale: number,
): number {
  const startAt = c.currentTime + spec.start;
  const endAt = startAt + spec.duration;
  const osc = c.createOscillator();
  osc.type = spec.type ?? "sine";
  osc.frequency.setValueAtTime(spec.freq, startAt);
  if (spec.glideTo !== undefined) {
    osc.frequency.linearRampToValueAtTime(spec.glideTo, endAt);
  }
  const gain = c.createGain();
  const peak = spec.peak * perCallScale;
  const attack = spec.attack ?? 0.005;
  const release = spec.release ?? 0.06;
  // ADSR — attack ramp up, hold near-flat, release ramp down. We
  // skip a true sustain phase because most cues are short enough
  // that attack + decay-to-floor is plenty.
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + attack);
  gain.gain.setValueAtTime(peak, Math.max(startAt + attack, endAt - release));
  gain.gain.linearRampToValueAtTime(0, endAt);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(startAt);
  osc.stop(endAt + 0.01);
  return endAt;
}

interface NoiseSpec {
  start: number;
  duration: number;
  peak: number;
  /// Bandpass centre frequency (Hz). The noise gets shaped through
  /// a biquad to give it character (e.g. crackle, breath, hiss).
  bandpass: number;
  bandpassQ?: number;
  attack?: number;
  release?: number;
}

function scheduleNoise(
  c: AudioContext,
  destination: AudioNode,
  spec: NoiseSpec,
  perCallScale: number,
): number {
  const startAt = c.currentTime + spec.start;
  const endAt = startAt + spec.duration;
  // Generate one shot of white noise into a buffer, play it through
  // a bandpass to colour it. Cheaper than a noise oscillator and
  // gives more control over duration.
  const len = Math.max(1, Math.floor(spec.duration * c.sampleRate));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(spec.bandpass, startAt);
  filter.Q.setValueAtTime(spec.bandpassQ ?? 1.5, startAt);
  const gain = c.createGain();
  const peak = spec.peak * perCallScale;
  const attack = spec.attack ?? 0.005;
  const release = spec.release ?? 0.06;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + attack);
  gain.gain.setValueAtTime(peak, Math.max(startAt + attack, endAt - release));
  gain.gain.linearRampToValueAtTime(0, endAt);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  src.start(startAt);
  src.stop(endAt + 0.01);
  return endAt;
}

// ─────────────────────────────────────────────────────────────────
// Cue catalog. Each function takes the context + a destination gain
// node + per-call scale; the master gain is wired upstream.
// ─────────────────────────────────────────────────────────────────

type CuePlayer = (
  c: AudioContext,
  dest: AudioNode,
  perCallScale: number,
) => void;

const CUES: Record<SfxName, CuePlayer> = {
  ping(c, dest, s) {
    scheduleTone(c, dest, {
      freq: 880,
      glideTo: 1320,
      start: 0,
      duration: 0.22,
      peak: 0.18,
      attack: 0.004,
      release: 0.12,
      type: "sine",
    }, s);
  },

  chime(c, dest, s) {
    // Two-note perfect-fourth bell: E5 → A5
    scheduleTone(c, dest, {
      freq: 659,
      start: 0,
      duration: 0.36,
      peak: 0.20,
      attack: 0.008,
      release: 0.18,
      type: "sine",
    }, s);
    scheduleTone(c, dest, {
      freq: 880,
      start: 0.10,
      duration: 0.42,
      peak: 0.18,
      attack: 0.008,
      release: 0.22,
      type: "sine",
    }, s);
  },

  success(c, dest, s) {
    // Three-note ascending major triad: C5 → E5 → G5.
    [
      [523, 0.0],
      [659, 0.13],
      [784, 0.26],
    ].forEach(([f, t]) => {
      scheduleTone(c, dest, {
        freq: f,
        start: t,
        duration: 0.30,
        peak: 0.20,
        attack: 0.006,
        release: 0.14,
        type: "sine",
      }, s);
    });
  },

  fanfare(c, dest, s) {
    // Five-note ascending arpeggio + sustained drone behind it. The
    // arpeggio is triangle-wave for a brassier timbre; the drone is
    // a soft sine fifth below the tonic.
    [
      [523, 0.0],
      [659, 0.12],
      [784, 0.24],
      [1047, 0.36],
      [784, 0.52],
    ].forEach(([f, t]) => {
      scheduleTone(c, dest, {
        freq: f,
        start: t,
        duration: 0.30,
        peak: 0.18,
        attack: 0.006,
        release: 0.16,
        type: "triangle",
      }, s);
    });
    // Sustained C3 drone for warmth
    scheduleTone(c, dest, {
      freq: 261,
      start: 0,
      duration: 1.20,
      peak: 0.10,
      attack: 0.06,
      release: 0.4,
      type: "sine",
    }, s);
  },

  arpeggio(c, dest, s) {
    // Seven-note rising major scale (C5 → C6) with a soft reverb tail
    // approximation: each note's release is long so they bloom into
    // each other. Triangle for warmth.
    const notes = [523, 587, 659, 698, 784, 880, 1047];
    notes.forEach((f, i) => {
      scheduleTone(c, dest, {
        freq: f,
        start: i * 0.10,
        duration: 0.28,
        peak: 0.15,
        attack: 0.004,
        release: 0.22,
        type: "triangle",
      }, s);
    });
    // Tonic+fifth+octave wash at the end to feel "completed"
    scheduleTone(c, dest, {
      freq: 523,
      start: 0.7,
      duration: 0.9,
      peak: 0.10,
      attack: 0.05,
      release: 0.5,
      type: "sine",
    }, s);
    scheduleTone(c, dest, {
      freq: 1047,
      start: 0.7,
      duration: 0.9,
      peak: 0.06,
      attack: 0.05,
      release: 0.5,
      type: "sine",
    }, s);
  },

  "streak-tick"(c, dest, s) {
    scheduleTone(c, dest, {
      freq: 1100,
      start: 0,
      duration: 0.09,
      peak: 0.15,
      attack: 0.001,
      release: 0.04,
      type: "square",
    }, s);
  },

  "streak-flame"(c, dest, s) {
    // Filtered noise crackle + low pulse — fire metaphor.
    scheduleNoise(c, dest, {
      start: 0,
      duration: 0.50,
      peak: 0.16,
      bandpass: 500,
      bandpassQ: 0.8,
      attack: 0.02,
      release: 0.20,
    }, s);
    scheduleTone(c, dest, {
      freq: 110,
      glideTo: 165,
      start: 0,
      duration: 0.60,
      peak: 0.12,
      attack: 0.05,
      release: 0.30,
      type: "sawtooth",
    }, s);
  },

  "xp-pop"(c, dest, s) {
    // Quick sine glissando — feels like a +N XP pop.
    scheduleTone(c, dest, {
      freq: 660,
      glideTo: 990,
      start: 0,
      duration: 0.18,
      peak: 0.16,
      attack: 0.003,
      release: 0.10,
      type: "sine",
    }, s);
  },

  "level-up"(c, dest, s) {
    // Five-note rising arpeggio with a glissando sweep underneath.
    [
      [392, 0.0],
      [523, 0.10],
      [659, 0.20],
      [784, 0.30],
      [1047, 0.42],
    ].forEach(([f, t]) => {
      scheduleTone(c, dest, {
        freq: f,
        start: t,
        duration: 0.30,
        peak: 0.18,
        attack: 0.005,
        release: 0.18,
        type: "triangle",
      }, s);
    });
    // Glissando from a low fifth up to the tonic's octave
    scheduleTone(c, dest, {
      freq: 196,
      glideTo: 523,
      start: 0,
      duration: 0.95,
      peak: 0.08,
      attack: 0.04,
      release: 0.4,
      type: "sine",
    }, s);
  },

  "complete-section"(c, dest, s) {
    // Three-note descending chime, gentle.
    [
      [988, 0.0],
      [784, 0.18],
      [659, 0.36],
    ].forEach(([f, t]) => {
      scheduleTone(c, dest, {
        freq: f,
        start: t,
        duration: 0.32,
        peak: 0.18,
        attack: 0.006,
        release: 0.18,
        type: "sine",
      }, s);
    });
  },

  "complete-book"(c, dest, s) {
    // Extended fanfare: tonic + fifth + octave layered, then a
    // closing tonic chord.
    // Phase 1: rising arpeggio
    [
      [392, 0.0],
      [523, 0.12],
      [659, 0.24],
      [784, 0.36],
    ].forEach(([f, t]) => {
      scheduleTone(c, dest, {
        freq: f,
        start: t,
        duration: 0.30,
        peak: 0.18,
        attack: 0.006,
        release: 0.16,
        type: "triangle",
      }, s);
    });
    // Phase 2: sustained chord (C major triad, two octaves)
    [261, 392, 523, 784, 1047].forEach((f, i) => {
      scheduleTone(c, dest, {
        freq: f,
        start: 0.55,
        duration: 1.4,
        peak: 0.10 - i * 0.005,
        attack: 0.05,
        release: 0.6,
        type: "sine",
      }, s);
    });
    // Phase 3: a final crisp accent on the tonic octave
    scheduleTone(c, dest, {
      freq: 1047,
      start: 1.4,
      duration: 0.5,
      peak: 0.14,
      attack: 0.005,
      release: 0.30,
      type: "triangle",
    }, s);
  },

  freeze(c, dest, s) {
    // Sine sweep + crystalline shimmer. Sweep from A4 to A6 over the
    // duration; layer in a brittle high partial at the top.
    scheduleTone(c, dest, {
      freq: 440,
      glideTo: 1760,
      start: 0,
      duration: 0.8,
      peak: 0.15,
      attack: 0.02,
      release: 0.30,
      type: "sine",
    }, s);
    scheduleTone(c, dest, {
      freq: 2637,
      start: 0.10,
      duration: 0.30,
      peak: 0.06,
      attack: 0.005,
      release: 0.20,
      type: "sine",
    }, s);
  },
};

/// Fire a sound-effect cue. Resumes the AudioContext if suspended.
/// Never throws — sound is decorative and a failure here should
/// never break the page.
export function playSound(name: SfxName, opts: PlayOptions = {}): void {
  const settings = settingsCache;
  if (!settings.enabled && !opts.ignoreMute) return;
  if (settings.volume <= 0 && !opts.ignoreMute) return;
  const c = ensureContext();
  if (!c || !masterGain) return;
  // Browsers suspend the context when there's been no user
  // interaction. Resume non-blocking; the cue itself fires regardless
  // since `start(future)` queues onto the timeline either way.
  if (c.state === "suspended") {
    void c.resume().catch(() => undefined);
  }
  const cue = CUES[name];
  if (!cue) return;
  const scale = opts.volume === undefined ? 1 : Math.max(0, Math.min(1, opts.volume));
  try {
    cue(c, masterGain, scale);
  } catch {
    // Audio context can occasionally throw under unusual conditions
    // (e.g. running out of voices). Silently swallow — sound is
    // optional decoration.
  }
}

/// All cues, in display order. Used by the settings pane's "Test
/// each sound" row.
export const ALL_SFX: SfxName[] = [
  "ping",
  "chime",
  "success",
  "fanfare",
  "arpeggio",
  "level-up",
  "xp-pop",
  "streak-tick",
  "streak-flame",
  "complete-section",
  "complete-book",
  "freeze",
];

/// Friendly labels for the settings pane.
export const SFX_LABELS: Record<SfxName, string> = {
  ping: "Ping (UI tap)",
  chime: "Chime (bronze unlock)",
  success: "Success (silver unlock)",
  fanfare: "Fanfare (gold unlock)",
  arpeggio: "Arpeggio (platinum unlock)",
  "level-up": "Level up",
  "xp-pop": "XP pop (lesson complete)",
  "streak-tick": "Streak tick (day flip)",
  "streak-flame": "Streak milestone",
  "complete-section": "Section complete",
  "complete-book": "Book complete",
  freeze: "Streak freeze used",
};
