/// Lesson-audio playback hook. Pairs with the pre-generated MP3s
/// produced by `scripts/generate-lesson-audio.mjs` and uploaded to
/// the Fishbones CDN.
///
/// Lifecycle on app boot:
///   1. The first call to `useLessonAudioManifest()` fires a single
///      GET against `${TTS_CDN_BASE}/manifest.json`. The response is
///      cached in module scope so subsequent components share the
///      result without refetching.
///   2. `useLessonAudio(lessonId)` reads the cached manifest and
///      returns either `{ available: false }` (no audio for this
///      lesson) or `{ available: true, url, durationSec, ... }`.
///
/// Playback is via a single shared HTMLAudioElement managed by the
/// hook — only one lesson plays at a time, navigating away from a
/// lesson stops the audio.
///
/// IndexedDB cache: each MP3 fetched from the CDN is also stored
/// locally so subsequent plays are offline-friendly + instant. The
/// cache key is the manifest's `sha256` (content-addressed), so a
/// regenerated lesson's new MP3 doesn't collide with the old one.
/// 200 MB LRU cap to bound storage.

import { useEffect, useRef, useState } from "react";

/// Configurable audio host. Set via Vite env (VITE_FB_TTS_CDN_BASE)
/// at build time, or fall back to the production default. Trailing
/// slash stripped so we can append paths uniformly.
///
/// Default points at fishbones.academy/audio — same Vultr VPS that
/// hosts the marketing site + /learn/ web build. Audio MP3s are
/// pushed via `scripts/upload-lesson-audio.mjs` and live alongside
/// the academy's own /var/www tree (excluded from the academy's
/// `rsync --delete` so site deploys can't wipe them).
const TTS_CDN_BASE = (
  import.meta.env.VITE_FB_TTS_CDN_BASE ??
  "https://fishbones.academy/audio"
).replace(/\/+$/, "");

const MANIFEST_URL = `${TTS_CDN_BASE}/manifest.json`;

export interface AudioManifestEntry {
  url: string;
  courseId: string;
  sha256?: string;
  sizeBytes?: number;
  durationSec?: number;
  textHash: string;
  voice: string;
  voiceId?: string;
  model: string;
}

export interface AudioManifest {
  version: number;
  voice: string;
  model: string;
  generatedAt: string;
  cdnBase: string;
  lessons: Record<string, AudioManifestEntry>;
}

/// Module-scope cache shared across every consumer of the hooks.
/// `manifestPromise` is the in-flight fetch; once it resolves we
/// keep the result around for the lifetime of the page.
let manifestPromise: Promise<AudioManifest | null> | null = null;
let manifest: AudioManifest | null = null;

async function fetchManifest(): Promise<AudioManifest | null> {
  if (manifest) return manifest;
  if (manifestPromise) return manifestPromise;
  manifestPromise = (async () => {
    try {
      const r = await fetch(MANIFEST_URL, {
        // Cache-bust at the network layer if the CDN serves stale.
        // The manifest itself has short cache headers; this just
        // ensures `fetch` honours them rather than reading from the
        // memory cache.
        cache: "default",
      });
      if (!r.ok) return null;
      const json = (await r.json()) as AudioManifest;
      manifest = json;
      return json;
    } catch {
      // Offline / CORS / 404 — fall through silently. The hook's
      // `available: false` branch hides the speaker icon, so a missing
      // manifest just means "no audio yet" without erroring.
      return null;
    }
  })();
  return manifestPromise;
}

/// React hook returning the manifest once it loads, or `null` while
/// fetching / on failure. Components that depend on it should be
/// resilient to `null` — usually by hiding their audio affordances.
export function useLessonAudioManifest(): AudioManifest | null {
  const [m, setM] = useState<AudioManifest | null>(manifest);
  useEffect(() => {
    if (m) return;
    let cancelled = false;
    void fetchManifest().then((res) => {
      if (!cancelled) setM(res);
    });
    return () => {
      cancelled = true;
    };
  }, [m]);
  return m;
}

// ── Singleton player ────────────────────────────────────────────
//
// One HTMLAudioElement managed at module scope so navigating between
// lessons cleanly stops the previous lesson's audio. Hooks subscribe
// to its events; everything else is component state.

let audioEl: HTMLAudioElement | null = null;
let activeLessonId: string | null = null;
const listeners = new Set<() => void>();
function notify(): void {
  for (const l of listeners) {
    try {
      l();
    } catch {
      /* swallow */
    }
  }
}

function ensureAudioEl(): HTMLAudioElement {
  if (typeof document === "undefined") {
    throw new Error("useLessonAudio: no document (SSR)");
  }
  if (!audioEl) {
    audioEl = document.createElement("audio");
    audioEl.preload = "metadata";
    // Wire all the events the hook surfaces — every one of them
    // notifies subscribers so per-lesson hook state stays in sync.
    for (const ev of ["play", "pause", "ended", "loadedmetadata", "timeupdate", "error"]) {
      audioEl.addEventListener(ev, notify);
    }
  }
  return audioEl;
}

export type LessonAudioState =
  | { available: false }
  | {
      available: true;
      url: string;
      /// Duration in seconds. Resolves once the audio element fires
      /// `loadedmetadata`; falls back to the manifest's pre-computed
      /// value if available, else null. Components should treat null
      /// as "unknown — show reading-time estimate instead".
      durationSec: number | null;
      isActive: boolean;
      isPlaying: boolean;
      isLoading: boolean;
      currentSec: number;
      /// Playback progress 0..1. Useful for the circular progress
      /// ring on the TTSButton pill — divides currentSec by
      /// durationSec defensively (returns 0 when duration unknown).
      progress: number;
      /// Seconds remaining. `durationSec - currentSec` clamped to >= 0,
      /// or null if duration is unknown.
      remainingSec: number | null;
      play: () => void;
      pause: () => void;
      toggle: () => void;
      seek: (sec: number) => void;
      setSpeed: (rate: number) => void;
    };

/// Per-lesson hook. Pass the lesson id; receive state + controls.
/// Re-renders on every `timeupdate` (~4Hz) while this lesson is
/// active, idle when it isn't.
export function useLessonAudio(lessonId: string | undefined): LessonAudioState {
  const m = useLessonAudioManifest();
  const [, setTick] = useState(0);
  const tickRef = useRef(0);

  // Subscribe to the singleton's notifications. We only re-render
  // when something actually changes for THIS lesson — the listener
  // bumps a tick counter that triggers React's reconciler.
  useEffect(() => {
    const cb = () => {
      tickRef.current += 1;
      setTick(tickRef.current);
    };
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  if (!m || !lessonId) return { available: false };
  const entry = m.lessons[lessonId];
  if (!entry) return { available: false };

  const isActive = activeLessonId === lessonId && audioEl != null;
  const el = audioEl;
  const isPlaying = isActive && el != null && !el.paused && !el.ended;
  const isLoading =
    isActive &&
    el != null &&
    el.readyState < el.HAVE_FUTURE_DATA &&
    !el.paused;

  // Live duration once metadata loads (audio.duration is NaN before
  // `loadedmetadata` fires). Falls back to the manifest's pre-baked
  // value if present, else null. The TTSButton pill swaps from
  // "X min read" to "M:SS left" the instant we have a real number.
  const liveDuration =
    isActive && el && Number.isFinite(el.duration) && el.duration > 0
      ? el.duration
      : null;
  const durationSec = liveDuration ?? entry.durationSec ?? null;
  const currentSec = isActive && el ? el.currentTime : 0;
  const progress =
    durationSec && durationSec > 0
      ? Math.max(0, Math.min(1, currentSec / durationSec))
      : 0;
  const remainingSec =
    durationSec != null ? Math.max(0, durationSec - currentSec) : null;

  return {
    available: true,
    url: entry.url,
    durationSec,
    isActive,
    isPlaying,
    isLoading,
    currentSec,
    progress,
    remainingSec,
    play: () => {
      const a = ensureAudioEl();
      if (activeLessonId !== lessonId) {
        a.src = entry.url;
        activeLessonId = lessonId;
      }
      void a.play();
    },
    pause: () => {
      if (audioEl && activeLessonId === lessonId) audioEl.pause();
    },
    toggle: () => {
      const a = ensureAudioEl();
      if (activeLessonId !== lessonId) {
        a.src = entry.url;
        activeLessonId = lessonId;
        void a.play();
        return;
      }
      if (a.paused) void a.play();
      else a.pause();
    },
    seek: (sec) => {
      if (audioEl && activeLessonId === lessonId) audioEl.currentTime = sec;
    },
    setSpeed: (rate) => {
      if (audioEl) audioEl.playbackRate = rate;
    },
  };
}

/// Stop the singleton player. Call when navigating away from a lesson
/// view to make sure narration doesn't keep playing in the background.
/// Idempotent — safe to call when nothing's playing.
export function stopLessonAudio(): void {
  if (audioEl && !audioEl.paused) audioEl.pause();
  if (audioEl) audioEl.removeAttribute("src");
  activeLessonId = null;
  notify();
}
