/// Mobile reader. Just markdown — body rendered through the same
/// `renderMarkdown` helper the desktop LessonReader uses, so callouts,
/// code highlighting, and tables come out consistent. No glossary
/// popovers, no inline sandboxes, no enrichment chrome — readability
/// over richness on a 6" screen.

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { renderMarkdown } from "../components/Lesson/markdown";
import TTSButton from "../components/Lesson/TTSButton";
import { estimateReadingMinutes } from "../components/Lesson/readingTime";
import { stopLessonAudio } from "../hooks/useLessonAudio";
import { stopFallbackNarration } from "../hooks/useLessonAudioFallback";
import { useLessonNarration } from "../hooks/useLessonNarration";
import { useLessonReadCursor } from "../hooks/useLessonReadCursor";
import "./MobileReader.css";

interface Props {
  body: string;
  /// Lesson id — drives the TTS button's audio lookup against the
  /// pre-generated manifest. When the manifest doesn't have a
  /// matching entry the button silently doesn't render, so it's
  /// safe to always pass.
  lessonId?: string;
  /// Retained for prop-shape compatibility with the dispatch but no
  /// longer wired to a button — the lesson's bottom Next nav now
  /// owns "mark complete + advance" across every lesson kind, same
  /// as desktop's handleNext.
  onContinue?: () => void;
}

export default function MobileReader({ body, lessonId }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  // Reuse the desktop reader's word-count heuristic so the meta-pill
  // shows a consistent "X min read" estimate across surfaces.
  const readingMinutes = useMemo(() => estimateReadingMinutes(body || ""), [body]);

  // ── TTS narration cursor (mobile) ────────────────────────────────
  // Mobile's scroll container is the document/page itself, since the
  // reader fills the viewport. We feed `document.scrollingElement`
  // to the cursor hook so user-scroll detection works against the
  // actual scroller. The cursor hook owns class application + a
  // viewport-checked auto-scroll, all keyed off the rendered `html`
  // string (no MutationObserver — see useLessonReadCursor for why).
  const [articleEl, setArticleEl] = useState<HTMLElement | null>(null);
  // Drive the cursor off whichever narration source is actually
  // playing (ElevenLabs CDN when the manifest covers it, Web Speech
  // API on the body otherwise). Without the unified read, the
  // cursor would freeze at progress=0 whenever the fallback is
  // active.
  const audio = useLessonNarration(lessonId, body);
  const audioProgress = audio.available ? audio.progress : 0;
  const audioPlaying = audio.available ? audio.isPlaying : false;
  useLessonReadCursor({
    scrollContainer:
      typeof document !== "undefined"
        ? (document.scrollingElement as HTMLElement | null)
        : null,
    article: articleEl,
    html,
    progress: audioProgress,
    isPlaying: audioPlaying,
  });

  useEffect(() => {
    let cancelled = false;
    void renderMarkdown(body).then((rendered) => {
      if (!cancelled) setHtml(rendered);
    });
    return () => {
      cancelled = true;
    };
  }, [body]);

  // Imperatively populate the article's innerHTML when it changes.
  // See the comment on the `<article>` element below for why we do
  // this instead of using `dangerouslySetInnerHTML`.
  // useLayoutEffect so the children are present before paint — with
  // useEffect there'd be a frame of empty article on first render.
  useLayoutEffect(() => {
    if (!articleEl || html == null) return;
    if (articleEl.innerHTML !== html) {
      articleEl.innerHTML = html;
    }
  }, [articleEl, html]);

  // Stop the singleton TTS player when this reader unmounts (the
  // user navigated away from the lesson). Without it the narration
  // keeps playing in the background after a lesson change. Tear
  // down BOTH narration paths — ElevenLabs CDN audio and the Web
  // Speech API fallback — since either could be the active source
  // for this lesson.
  useEffect(() => {
    return () => {
      stopLessonAudio();
      stopFallbackNarration();
    };
  }, [lessonId]);

  // Skeleton-while-loading: render a 4-line shimmer block that
  // matches typical paragraph + heading rhythm so the layout
  // doesn't pop when the markdown finishes rendering. Keeps the
  // user's scroll-position predictable on a slow first paint.
  if (html === null) {
    return (
      <div className="m-reader">
        <div
          className="m-reader__skeleton"
          aria-hidden
          aria-busy="true"
          aria-label="Loading lesson"
        >
          <span className="m-reader__skel-line m-reader__skel-line--head" />
          <span className="m-reader__skel-line" />
          <span className="m-reader__skel-line m-reader__skel-line--short" />
          <span className="m-reader__skel-line" />
        </div>
      </div>
    );
  }

  return (
    <div className="m-reader">
      {/* Combined narration + read-time pill at the top of the
          prose. Falls back to a static "X min read" chip when no
          audio is available, so the meta strip is never empty.
          Audio-driven state (play/pause + circular progress ring +
          "M:SS left") takes over the moment the lesson has a
          manifest entry. */}
      {lessonId && (
        <div className="m-reader__tts">
          <TTSButton
            lessonId={lessonId}
            estimatedReadMinutes={readingMinutes}
            fallbackText={body}
          />
        </div>
      )}
      <article
        ref={setArticleEl}
        // `m-reader__prose--enter` arms the staggered fade-rise
        // animation on the article's direct children (paragraphs,
        // headings, code blocks). The CSS uses a per-child delay
        // so prose composes itself top-to-bottom rather than
        // popping in as one block. `prefers-reduced-motion` short-
        // circuits the animation in the same stylesheet.
        className="m-reader__prose m-reader__prose--enter"
        // innerHTML is set imperatively in the [articleEl, html]
        // effect below — `dangerouslySetInnerHTML` here would pass a
        // fresh object literal every render and React rebuilds the
        // article's children even when the underlying string is
        // unchanged, detaching the TTS cursor's highlight on every
        // audio timeupdate.
      />
    </div>
  );
}
