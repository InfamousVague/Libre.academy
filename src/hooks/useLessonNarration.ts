/// Unified lesson-narration hook. Picks whichever narration source
/// is available for a given lesson — ElevenLabs CDN audio if the
/// manifest covers it, the Web Speech API fallback otherwise — and
/// returns the same `LessonAudioState` shape either way. Callers
/// (TTSButton + the lesson readers' cursor wiring) can treat the
/// result uniformly without branching.
///
/// Priority order:
///   1. `useLessonAudio`  — ElevenLabs MP3 via the CDN manifest.
///      Exact duration, real seek, IndexedDB cached. Wins when
///      available.
///   2. `useLessonAudioFallback` — Web Speech API on the lesson
///      body. Free, in-browser, lower fidelity. Picks up every
///      lesson the CDN doesn't cover (which post-VPS-wipe is
///      effectively all of them). Returns `available: false` when
///      the body text is missing or the engine is unavailable.
///
/// Both return `available: false` → caller renders the static
/// "X min read" chip.

import type { LessonAudioState } from "./useLessonAudio";
import { useLessonAudio } from "./useLessonAudio";
import { useLessonAudioFallback } from "./useLessonAudioFallback";

export function useLessonNarration(
  lessonId: string | undefined,
  fallbackText: string | undefined,
): LessonAudioState {
  const cdn = useLessonAudio(lessonId);
  const fallback = useLessonAudioFallback(lessonId, fallbackText);
  return cdn.available ? cdn : fallback;
}
