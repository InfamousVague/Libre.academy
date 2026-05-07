/// Web Speech API fallback for lesson narration. Mirrors the shape
/// of `useLessonAudio` so `TTSButton` can use either interchangeably:
/// the ElevenLabs hook has priority when its CDN manifest covers the
/// lesson, this hook fills the gap for everything else.
///
/// The Web Speech API isn't a perfect substitute — there's no real
/// `duration` until/unless we play, no reliable seek, voice quality
/// is engine-dependent, and Chrome ships a 15-second silence bug we
/// have to work around with a periodic `resume()` ping. But it's
/// FREE, runs entirely in-browser, and on Apple platforms the
/// Siri-quality voices are surprisingly good. That's the right
/// tradeoff while ElevenLabs regeneration is off the table.
///
/// Singleton coordination: `speechSynthesis` only allows one active
/// speaker per origin, so this hook keeps the active utterance
/// queue at module scope (same pattern as `useLessonAudio`'s shared
/// `<audio>` element). Switching lessons cancels the previous
/// queue cleanly.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  chunkForSynthesis,
  markdownToSpokenText,
} from "../lib/spokenText";
import type { LessonAudioState } from "./useLessonAudio";

/// Words per minute for the duration estimate. ElevenLabs Verity
/// reads at ~165 wpm; system voices average closer to 150 wpm.
/// We use 150 as a neutral midpoint so the "M:SS" label doesn't
/// overshoot the actual play time on Apple voices.
const WORDS_PER_MINUTE = 150;

/// Soft per-utterance length cap. Shorter than spoken-text default
/// because some Chromium engines truncate around 32KB and we want a
/// generous safety margin while still avoiding too many chunk
/// boundaries (each is a brief pause).
const MAX_CHUNK_CHARS = 1800;

// ── Singleton state ─────────────────────────────────────────────
//
// `speechSynthesis` is a per-origin global; only one queue can
// speak at a time. We mirror useLessonAudio's pattern: a module
// scope singleton drives the active queue, hooks subscribe to its
// notifications and re-render when state changes for THEIR lesson.

let activeLessonId: string | null = null;
let activeChunks: string[] = [];
let activeChunkIndex = 0;
let activeChunkDurations: number[] = [];
/// Sum of `activeChunkDurations[0..activeChunkIndex-1]` — keeps a
/// running total so currentSec is `elapsedBeforeCurrent + (now -
/// currentChunkStartedAt)`.
let elapsedBeforeCurrent = 0;
/// `performance.now()` of the current chunk's `speak()` call. Reset
/// to zero on pause; on resume we adjust so `currentSec` resumes
/// from where it left off.
let currentChunkStartedAt = 0;
/// Snapshot of `currentSec` taken at the moment of pause, so resume
/// math doesn't have to re-derive from the (now-stale) start
/// timestamp.
let pausedAtSec = 0;
const subscribers = new Set<() => void>();

function notify(): void {
  for (const cb of subscribers) {
    try {
      cb();
    } catch {
      /* swallow — a misbehaving subscriber shouldn't break the bus */
    }
  }
}

function ssAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

/// Word-count → seconds estimate. Preserves the same numeric
/// semantics as the ElevenLabs durationSec field so the progress
/// ring can index off either source uniformly.
function estimateChunkSec(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  return Math.max(0.5, (words / WORDS_PER_MINUTE) * 60);
}

/// Pick the user's best available English voice. On Apple platforms
/// (Tauri webview, iPad Safari) Siri-quality "Enhanced" or "Premium"
/// voices live alongside the legacy ones; we prefer them. On
/// Android/Chromium we fall back to whatever default the engine
/// exposes for `en-*`.
let _voicesLoaded = false;
function pickVoice(): SpeechSynthesisVoice | null {
  if (!ssAvailable()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const preferences: Array<(v: SpeechSynthesisVoice) => boolean> = [
    // Apple's Siri voices ship with names like "Siri Voice 1" / "Siri
    // Voice 4" on iPadOS 17+. Best quality available client-side.
    (v) => /siri/i.test(v.name) && v.lang.toLowerCase().startsWith("en"),
    // Apple "Premium" / "Enhanced" individual voices on macOS Sonoma+
    // (Ava, Allison, Joelle, Tom, Evan, Nathan, Noelle).
    (v) =>
      /(premium|enhanced)/i.test(v.name) &&
      v.lang.toLowerCase().startsWith("en"),
    // Named macOS / iOS voices known to be high-quality. In
    // pre-Siri-era macOS these are still the best non-default
    // English voices the OS ships.
    (v) =>
      /\b(samantha|karen|moira|daniel|fred|aaron|allison|ava|tom|evan)\b/i.test(
        v.name,
      ) && v.lang.toLowerCase().startsWith("en"),
    // Local-installed (offline) en-* voice — better than a network
    // voice on slow connections.
    (v) => v.localService && v.lang.toLowerCase().startsWith("en"),
    // Any en-US.
    (v) => v.lang.toLowerCase() === "en-us",
    // Any en-*.
    (v) => v.lang.toLowerCase().startsWith("en"),
  ];
  for (const pred of preferences) {
    const match = voices.find(pred);
    if (match) return match;
  }
  return voices[0] ?? null;
}

/// Some engines populate the voice list asynchronously after first
/// query. Wait for the `voiceschanged` event (with a safety timeout
/// so we don't hang on engines that already have voices loaded but
/// never fire the event).
function ensureVoicesLoaded(): Promise<void> {
  if (!ssAvailable() || _voicesLoaded) return Promise.resolve();
  if (window.speechSynthesis.getVoices().length > 0) {
    _voicesLoaded = true;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      _voicesLoaded = true;
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        onChange,
      );
      resolve();
    };
    const onChange = () => finish();
    window.speechSynthesis.addEventListener("voiceschanged", onChange);
    // Safety timeout: 1.5s is generous; in practice voices land in
    // < 100ms. Without the timeout the hook would hang on Safari
    // builds that ship voices preloaded but never fire the event.
    setTimeout(finish, 1500);
  });
}

/// Reset the singleton to "no active lesson". Used on natural end,
/// error, and when the consumer cancels.
function resetSingleton(): void {
  activeLessonId = null;
  activeChunks = [];
  activeChunkIndex = 0;
  activeChunkDurations = [];
  elapsedBeforeCurrent = 0;
  currentChunkStartedAt = 0;
  pausedAtSec = 0;
}

/// Cancel any in-flight speech and clear the singleton. Safe to
/// call when nothing is playing; idempotent.
export function stopFallbackNarration(): void {
  if (ssAvailable()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* swallow */
    }
  }
  resetSingleton();
  notify();
}

/// Speak the chunk at `activeChunkIndex`. On end, advances the
/// pointer and recurses (or resets if we hit the last chunk).
function speakCurrentChunk(): void {
  if (!ssAvailable()) return;
  if (activeChunkIndex >= activeChunks.length) {
    resetSingleton();
    notify();
    return;
  }
  const text = activeChunks[activeChunkIndex];
  const utt = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) {
    utt.voice = voice;
    utt.lang = voice.lang;
  }
  utt.rate = 1.0;
  utt.pitch = 1.0;
  utt.volume = 1.0;
  utt.onend = () => {
    // Only advance if we're still the active speaker for this lesson;
    // a `cancel()` mid-utterance also fires onend, so guard against
    // double-stepping.
    if (activeLessonId == null) return;
    elapsedBeforeCurrent += activeChunkDurations[activeChunkIndex] ?? 0;
    activeChunkIndex += 1;
    pausedAtSec = 0;
    currentChunkStartedAt = 0;
    if (activeChunkIndex >= activeChunks.length) {
      resetSingleton();
      notify();
      return;
    }
    speakCurrentChunk();
    notify();
  };
  utt.onerror = () => {
    // Silent abort — the singleton resets and the UI flips back to
    // idle. Errors are usually "interrupted" when the user toggles
    // off, which isn't worth a console warning.
    resetSingleton();
    notify();
  };
  currentChunkStartedAt = performance.now();
  pausedAtSec = 0;
  window.speechSynthesis.speak(utt);
  notify();
}

async function startFallbackNarration(
  lessonId: string,
  chunks: string[],
): Promise<void> {
  if (!ssAvailable() || chunks.length === 0) return;
  await ensureVoicesLoaded();
  // Cancel any prior queue before taking over the singleton; without
  // this, switching lessons mid-playback leaves the prior utterance
  // running until its natural end.
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* swallow */
  }
  activeLessonId = lessonId;
  activeChunks = chunks;
  activeChunkIndex = 0;
  activeChunkDurations = chunks.map(estimateChunkSec);
  elapsedBeforeCurrent = 0;
  speakCurrentChunk();
}

// ── Hook ────────────────────────────────────────────────────────

/// Web Speech API-backed lesson narration. Returns the same
/// `LessonAudioState` shape `useLessonAudio` does, so the consumer
/// can treat them as polymorphic. `available: false` when the
/// engine isn't present (very old Safari, headless tests) or when
/// no body text was provided.
export function useLessonAudioFallback(
  lessonId: string | undefined,
  body: string | undefined,
): LessonAudioState {
  const [, setTick] = useState(0);
  const tickRef = useRef(0);

  // Subscribe to the singleton notifications. Re-renders ride on a
  // tick counter the same way `useLessonAudio` does.
  useEffect(() => {
    const cb = () => {
      tickRef.current += 1;
      setTick(tickRef.current);
    };
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  // While THIS lesson is the active speaker, tick at 4Hz so the
  // currentSec / progress / remainingSec values move smoothly. The
  // SpeechSynthesisUtterance API doesn't fire timeupdate-equivalents,
  // so we poll the singleton's elapsed-time math instead.
  useEffect(() => {
    if (!ssAvailable() || activeLessonId !== lessonId) return;
    const handle = window.setInterval(() => {
      tickRef.current += 1;
      setTick(tickRef.current);
    }, 250);
    return () => window.clearInterval(handle);
  }, [lessonId]);

  // Memoise the chunks per lesson body. The preprocessor + chunker
  // are pure, so we never need to re-run them as long as the body
  // hasn't changed (lesson navigation re-mounts the component, so
  // body stability there is fine).
  const chunks = useMemo(() => {
    if (!body) return [] as string[];
    try {
      const spoken = markdownToSpokenText(body);
      return chunkForSynthesis(spoken, MAX_CHUNK_CHARS);
    } catch {
      return [] as string[];
    }
  }, [body]);

  const totalDuration = useMemo(
    () => chunks.reduce((sum, c) => sum + estimateChunkSec(c), 0),
    [chunks],
  );

  const available = ssAvailable() && chunks.length > 0 && !!lessonId;

  // Compute current playback state by reading the singleton.
  const isActive = !!lessonId && activeLessonId === lessonId;
  const isSpeaking = ssAvailable() && window.speechSynthesis.speaking;
  const isPaused = ssAvailable() && window.speechSynthesis.paused;
  const isPlaying = isActive && isSpeaking && !isPaused;

  let currentSec = 0;
  if (isActive) {
    if (isPaused) {
      currentSec = pausedAtSec;
    } else if (isPlaying && currentChunkStartedAt > 0) {
      const elapsedInChunk =
        (performance.now() - currentChunkStartedAt) / 1000;
      const cap = activeChunkDurations[activeChunkIndex] ?? 0;
      currentSec = elapsedBeforeCurrent + Math.min(elapsedInChunk, cap);
    } else {
      currentSec = elapsedBeforeCurrent;
    }
  }
  const durationSec = totalDuration;
  const remainingSec = Math.max(0, durationSec - currentSec);
  const progress =
    durationSec > 0 ? Math.max(0, Math.min(1, currentSec / durationSec)) : 0;

  const id = lessonId ?? "";
  const cachedChunks = chunks;
  const toggle = useCallback(() => {
    if (!ssAvailable() || !id || cachedChunks.length === 0) return;
    if (activeLessonId === id) {
      if (window.speechSynthesis.paused) {
        // Resume: shift the chunk start so the elapsed-time math
        // continues from `pausedAtSec` instead of the original
        // start moment.
        const inChunk = pausedAtSec - elapsedBeforeCurrent;
        currentChunkStartedAt = performance.now() - inChunk * 1000;
        pausedAtSec = 0;
        window.speechSynthesis.resume();
        notify();
        return;
      }
      if (window.speechSynthesis.speaking) {
        pausedAtSec = currentSec;
        window.speechSynthesis.pause();
        notify();
        return;
      }
    }
    void startFallbackNarration(id, cachedChunks);
  }, [id, cachedChunks, currentSec]);

  if (!available) return { available: false };

  // Surface the same control surface useLessonAudio does, even
  // though seek + setSpeed are no-ops on the speechSynthesis API
  // (the consumer doesn't actually wire those up on the TTSButton
  // pill, but we honour the contract so future callers don't crash).
  return {
    available: true,
    url: `webspeech://${id}`,
    durationSec,
    isActive,
    isPlaying,
    isLoading: false,
    currentSec,
    progress,
    remainingSec,
    play: toggle,
    pause: () => {
      if (!ssAvailable() || activeLessonId !== id) return;
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        pausedAtSec = currentSec;
        window.speechSynthesis.pause();
        notify();
      }
    },
    toggle,
    seek: () => {
      // No-op: speechSynthesis can't be scrubbed mid-utterance and
      // re-queueing from a midpoint would mean splitting the chunk
      // text on word boundaries, which gets gnarly fast for a
      // fallback path. The TTSButton doesn't expose seek anyway.
    },
    setSpeed: (rate: number) => {
      // Best-effort: rate change applies to NEW utterances only;
      // changing it mid-utterance is undefined per spec. We keep
      // it as a no-op for now since the UI doesn't expose a speed
      // slider on the fallback path.
      void rate;
    },
  };
}
