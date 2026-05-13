/// Named pattern library for the haptic engine. The base service
/// (`src/lib/haptics.ts`) exposes 11 semantic intents tuned for the
/// common moments in the app; this module sits one layer up and
/// turns those intents into a richer expressive vocabulary that
/// designers and feature authors can compose without thinking about
/// raw millisecond durations.
///
/// Three concepts:
///
///   1. **Pattern** — a sequence of buzzes + pauses, expressed as
///      an array of `[durationMs, kind]` tuples where `kind` is
///      either "buzz" or "pause." Easier to read than the bare
///      `[ms, ms, ms]` `navigator.vibrate` format.
///
///   2. **Preset** — a named, curated pattern with a label + an
///      emoji-style glyph + a one-line description, designed for
///      a specific feeling ("heartbeat" / "morse-tap" / "wave" /
///      "knock-knock"). Presets are what shows up in the Settings
///      pattern picker.
///
///   3. **Composition** — patterns can be concatenated, repeated,
///      reversed, time-scaled, and intensity-scaled to derive new
///      patterns from old. Composition is pure-functional so a
///      pattern object can be safely passed around without
///      worrying about mutation.
///
/// This module is data + functions only — no side effects, no
/// React, no DOM. The haptics service consumes the materialised
/// `number[]` form via `materialisePattern()`.

// ─── Pattern data model ───────────────────────────────────────

/// A single beat in a pattern. `"buzz"` = the device vibrates;
/// `"pause"` = silence. Durations are milliseconds.
export type Beat = readonly [number, "buzz" | "pause"];

/// A pattern is just an ordered list of beats. By convention we
/// alternate buzz / pause so the navigator.vibrate format
/// translation is clean, but the materialiser tolerates
/// consecutive buzzes (it sums them).
export interface Pattern {
  /// Stable id used for telemetry + storage. Curated presets
  /// have lowercase-kebab names ("heartbeat", "knock-knock");
  /// user-defined patterns get a generated id like "custom-3".
  readonly id: string;
  /// Beats in order. Read-only by convention so callers don't
  /// mutate a shared preset.
  readonly beats: ReadonlyArray<Beat>;
}

/// Display metadata for a curated preset. Separate from `Pattern`
/// itself so user-defined patterns can reuse the pattern shape
/// without forcing a label + description on every custom entry.
export interface Preset extends Pattern {
  /// Human-readable name shown in the Settings picker.
  readonly label: string;
  /// Single emoji or short glyph (e.g. "💗" / "✦"). Renders to
  /// the left of the label as a quick visual identifier.
  readonly glyph: string;
  /// One-line description of when the pattern is appropriate.
  /// Helps designers + feature authors pick the right preset
  /// without auditioning every one.
  readonly description: string;
}

// ─── Curated preset library ───────────────────────────────────

/// Single light buzz — the chrome default. Use for taps that
/// don't warrant any rhythmic character.
const TAP: Preset = {
  id: "tap",
  label: "Tap",
  glyph: "•",
  description: "Single light buzz. The chrome default.",
  beats: [[10, "buzz"]],
};

/// Two short pulses with a brief gap — "I got that, took
/// action" confirmation. Slightly more committed than tap.
const DOUBLE_TAP: Preset = {
  id: "double-tap",
  label: "Double tap",
  glyph: "••",
  description: "Two short pulses — for confirming a deliberate choice.",
  beats: [
    [12, "buzz"],
    [60, "pause"],
    [12, "buzz"],
  ],
};

/// Three pulses, ascending in length — feels like momentum
/// building. Good for streak increments + level ups.
const ESCALATION: Preset = {
  id: "escalation",
  label: "Escalation",
  glyph: "·∙●",
  description: "Three pulses, growing — momentum building toward a peak.",
  beats: [
    [10, "buzz"],
    [70, "pause"],
    [18, "buzz"],
    [70, "pause"],
    [28, "buzz"],
  ],
};

/// Three pulses, descending in length — feels like a finale.
/// Good for course-complete / certificate-earned closure.
const DECAY: Preset = {
  id: "decay",
  label: "Decay",
  glyph: "●∙·",
  description: "Three pulses, shrinking — a finale settling down.",
  beats: [
    [32, "buzz"],
    [80, "pause"],
    [22, "buzz"],
    [80, "pause"],
    [12, "buzz"],
  ],
};

/// "Lub-dub" pair like a heartbeat. Distinctive enough to
/// reserve for streak-day milestones or motivational pulses.
const HEARTBEAT: Preset = {
  id: "heartbeat",
  label: "Heartbeat",
  glyph: "💗",
  description: "Lub-dub pulse — reserve for milestones and motivational beats.",
  beats: [
    [20, "buzz"],
    [80, "pause"],
    [30, "buzz"],
    [400, "pause"],
    [20, "buzz"],
    [80, "pause"],
    [30, "buzz"],
  ],
};

/// Morse-style "S" (· · ·) followed by "O" (— — —) — playful
/// distress signal that doubles as a "wait, this needs your
/// attention" cue without being alarming.
const SOS_TAP: Preset = {
  id: "sos-tap",
  label: "Attention",
  glyph: "·–·",
  description: "Morse-flavoured pattern for asynchronous attention requests.",
  beats: [
    [10, "buzz"], [60, "pause"],
    [10, "buzz"], [60, "pause"],
    [10, "buzz"], [200, "pause"],
    [40, "buzz"], [80, "pause"],
    [40, "buzz"], [80, "pause"],
    [40, "buzz"],
  ],
};

/// Sine-like wave — five gradually-rising-then-falling pulses.
/// Pairs nicely with confetti / coin-shower visuals.
const WAVE: Preset = {
  id: "wave",
  label: "Wave",
  glyph: "🌊",
  description: "Five-pulse wave — pairs with confetti / coin-shower visuals.",
  beats: [
    [8, "buzz"], [60, "pause"],
    [16, "buzz"], [60, "pause"],
    [24, "buzz"], [60, "pause"],
    [16, "buzz"], [60, "pause"],
    [8, "buzz"],
  ],
};

/// Knock-knock — two firm raps in quick succession with a
/// gap, then two more. Good for modal-needs-attention cues.
const KNOCK_KNOCK: Preset = {
  id: "knock-knock",
  label: "Knock-knock",
  glyph: "✊",
  description: "Two raps, pause, two more raps — for modal attention.",
  beats: [
    [25, "buzz"], [80, "pause"],
    [25, "buzz"], [320, "pause"],
    [25, "buzz"], [80, "pause"],
    [25, "buzz"],
  ],
};

/// Single firm impact then a long settle — feels like a stone
/// landing. Use for destructive confirmations and "you did the
/// thing" finality moments.
const STONE_DROP: Preset = {
  id: "stone-drop",
  label: "Stone drop",
  glyph: "💧",
  description: "One firm impact then a long settle — for finality moments.",
  beats: [
    [50, "buzz"],
    [200, "pause"],
    [15, "buzz"],
  ],
};

/// All curated presets in one array — order is the order they
/// appear in the Settings picker.
export const PRESETS: ReadonlyArray<Preset> = [
  TAP,
  DOUBLE_TAP,
  ESCALATION,
  DECAY,
  HEARTBEAT,
  WAVE,
  KNOCK_KNOCK,
  STONE_DROP,
  SOS_TAP,
];

/// Lookup by id. Returns undefined for unknown ids — callers
/// should fall back to a sensible default rather than throw,
/// since pattern ids may come from user-edited storage.
export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

// ─── Pattern composition ──────────────────────────────────────

/// Concatenate two patterns with an optional pause between
/// them. Useful for "I just earned XP AND levelled up — chain
/// the patterns instead of firing them as separate intents."
export function concat(a: Pattern, b: Pattern, gapMs: number = 120): Pattern {
  const gap: Beat[] = gapMs > 0 ? [[gapMs, "pause"]] : [];
  return {
    id: `${a.id}+${b.id}`,
    beats: [...a.beats, ...gap, ...b.beats],
  };
}

/// Repeat a pattern N times with an inter-repetition gap.
/// Used by the "streak milestone" path to repeat the heartbeat
/// once per day in the streak count.
export function repeat(
  p: Pattern,
  count: number,
  gapMs: number = 200,
): Pattern {
  if (count <= 1) return p;
  const beats: Beat[] = [];
  for (let i = 0; i < count; i++) {
    if (i > 0 && gapMs > 0) beats.push([gapMs, "pause"]);
    for (const b of p.beats) beats.push(b);
  }
  return { id: `${p.id}*${count}`, beats };
}

/// Play a pattern in reverse. Useful for symmetry on transition
/// pairs (open / close, in / out). Pauses stay where they are
/// in the reversed sequence; the visual character of the
/// reversal comes from the buzz ordering, not the pauses.
export function reverse(p: Pattern): Pattern {
  return { id: `${p.id}-rev`, beats: [...p.beats].reverse() };
}

/// Scale a pattern's time axis. `factor < 1` makes it faster,
/// `factor > 1` slows it down. Both buzzes and pauses scale —
/// the whole pattern stretches uniformly.
export function timeScale(p: Pattern, factor: number): Pattern {
  const f = Math.max(0.1, factor);
  return {
    id: `${p.id}@${f.toFixed(2)}`,
    beats: p.beats.map(([ms, kind]) => [Math.round(ms * f), kind] as Beat),
  };
}

/// Scale buzz durations only (pauses preserved). Used by the
/// engine to apply the user's intensity slider — pauses define
/// rhythm and shouldn't shift with intensity.
export function intensityScale(p: Pattern, intensity: number): Pattern {
  const k = Math.max(0, Math.min(1, intensity));
  return {
    id: `${p.id}~${k.toFixed(2)}`,
    beats: p.beats.map(
      ([ms, kind]) =>
        [kind === "buzz" ? Math.max(0, Math.round(ms * k)) : ms, kind] as Beat,
    ),
  };
}

// ─── Materialisation ──────────────────────────────────────────

/// Convert a `Pattern` to the `navigator.vibrate(number[])`
/// format. The web API expects alternating buzz/pause durations
/// starting with buzz; we coalesce consecutive same-kind beats
/// and prepend a 0-duration buzz if the pattern accidentally
/// starts with a pause (so the API doesn't reject the input).
export function materialisePattern(p: Pattern): number[] {
  const out: number[] = [];
  let expecting: "buzz" | "pause" = "buzz";
  for (const [ms, kind] of p.beats) {
    if (kind === expecting) {
      out.push(ms);
      expecting = expecting === "buzz" ? "pause" : "buzz";
    } else {
      // Insert a zero of the expected kind to maintain
      // alternation. e.g. two consecutive buzzes get a 0ms
      // pause stitched between them.
      out.push(0);
      out.push(ms);
      expecting = expecting === "buzz" ? "pause" : "buzz";
    }
  }
  // Strip trailing pause — useless to the navigator API.
  while (out.length > 0 && out.length % 2 === 0) out.pop();
  return out;
}

/// Total duration of a pattern in ms — used by the throttle
/// system to know when a pattern has "finished firing" so the
/// next intent doesn't overlap into the tail of the previous
/// one (which on iOS feels like one long buzz rather than two
/// distinct events).
export function patternDuration(p: Pattern): number {
  return p.beats.reduce((sum, [ms]) => sum + ms, 0);
}

// ─── User-defined patterns ────────────────────────────────────

/// localStorage key prefix for user-defined patterns. Format:
/// `libre:haptic-custom:<id>` → JSON-encoded Pattern.
const CUSTOM_STORAGE_PREFIX = "libre:haptic-custom:";

/// localStorage key for the ordered list of custom pattern ids.
/// Kept separate from the pattern bodies so we can list them
/// without parsing every body.
const CUSTOM_INDEX_KEY = "libre:haptic-custom-index";

/// Read every custom pattern the user has saved. Order matches
/// the index. Bodies that fail to parse are silently dropped —
/// they're best-effort and we'd rather lose one than break the
/// whole list.
export function listCustomPatterns(): Pattern[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const indexRaw = localStorage.getItem(CUSTOM_INDEX_KEY);
    if (!indexRaw) return [];
    const ids: string[] = JSON.parse(indexRaw);
    const out: Pattern[] = [];
    for (const id of ids) {
      const bodyRaw = localStorage.getItem(CUSTOM_STORAGE_PREFIX + id);
      if (!bodyRaw) continue;
      try {
        const parsed = JSON.parse(bodyRaw) as Pattern;
        if (Array.isArray(parsed?.beats)) out.push(parsed);
      } catch {
        /* skip malformed entry */
      }
    }
    return out;
  } catch {
    return [];
  }
}

/// Save (or replace) a custom pattern. The pattern's `id`
/// determines whether this is an insert or update.
export function saveCustomPattern(pattern: Pattern): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      CUSTOM_STORAGE_PREFIX + pattern.id,
      JSON.stringify(pattern),
    );
    // Append to the index if it's new.
    const indexRaw = localStorage.getItem(CUSTOM_INDEX_KEY);
    const ids: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    if (!ids.includes(pattern.id)) {
      ids.push(pattern.id);
      localStorage.setItem(CUSTOM_INDEX_KEY, JSON.stringify(ids));
    }
    window.dispatchEvent(new CustomEvent("libre:haptic-patterns-changed"));
  } catch {
    /* quota / private mode — ignore */
  }
}

/// Delete a custom pattern by id. No-op for unknown ids.
export function deleteCustomPattern(id: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(CUSTOM_STORAGE_PREFIX + id);
    const indexRaw = localStorage.getItem(CUSTOM_INDEX_KEY);
    if (!indexRaw) return;
    const ids: string[] = JSON.parse(indexRaw);
    const filtered = ids.filter((x) => x !== id);
    localStorage.setItem(CUSTOM_INDEX_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent("libre:haptic-patterns-changed"));
  } catch {
    /* ignore */
  }
}

/// Generate a new unique id for a user-defined pattern. Walks
/// the existing custom set to avoid collisions.
export function newCustomPatternId(): string {
  const existing = new Set(listCustomPatterns().map((p) => p.id));
  let n = 1;
  let candidate = `custom-${n}`;
  while (existing.has(candidate)) {
    n += 1;
    candidate = `custom-${n}`;
  }
  return candidate;
}
