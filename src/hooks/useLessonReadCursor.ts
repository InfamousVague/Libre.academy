/// Drives the "narration cursor" — the visual highlight + auto-scroll
/// that follows the TTS audio through a reading lesson. The cursor
/// is paragraph-granular, using the rendered HTML's `data-tts-block`
/// annotations (added by `renderMarkdown` step 6) as anchors.
///
/// Design (revised after the v1 MutationObserver pair was found to
/// freeze the app on lesson entry):
///   - Block boundaries are computed from each annotated element's
///     `data-tts-len` (text length). Cumulative-sum + normalize gives
///     us per-block end-fractions in [0..1] that a given audio
///     `progress` can be linearly searched against.
///   - Recomputation is keyed on the rendered `html` string. The
///     consumer passes the same html it feeds into
///     `dangerouslySetInnerHTML`, and our DOM-reading effect re-runs
///     whenever that string identity changes. We deliberately do NOT
///     use a MutationObserver — the v1 design did, and even with
///     `subtree: false` the article-level observer interacted badly
///     with the React-mounted descendants the lesson body hydrates
///     (InlineSandbox via createRoot, glossary popovers, code-block
///     "Ask Libre" badges). The html string is a complete signal
///     because `annotateTtsBlocks` runs inside `renderMarkdown` and
///     bakes the data-attributes into the string — there's no
///     post-render DOM rewrite we'd need to react to.
///   - Class application is owned by the hook so the highlight
///     survives lesson-body re-renders. Effect dep is
///     `[article, currentBlock, html]` — `html` covers the
///     dangerouslySetInnerHTML rebuild that would otherwise leave
///     `.libre-tts-current` orphaned on a detached node.
///   - User-scroll detection: any scroll event outside a known
///     "programmatic-scroll window" pauses auto-scroll for
///     `pauseAfterUserScrollMs` so the narration cursor doesn't
///     fight a learner scrolling ahead.
///
/// Char-weighted timing is an approximation (TTS pacing isn't
/// strictly proportional to character count — Verity speeds up on
/// short sentences, slows on technical jargon) but is dramatically
/// better than uniform spacing on lessons with code blocks. The TTS
/// pipeline replaces a fenced code block with a one-sentence summary
/// (~50–100 chars), so we cap `<pre>` block weights at 80 chars
/// during boundary computation — uniform weighting would stall the
/// cursor on code while audio breezed through the summary.

import { useEffect, useMemo, useRef, useState } from "react";

interface BlockBoundary {
  /// `data-tts-block` index assigned by `annotateTtsBlocks`.
  index: number;
  /// Cumulative end-fraction in [0..1]. The first block ends at the
  /// fraction of total chars it occupies; subsequent blocks add to
  /// the running cumsum. Last block always ends at 1.
  endFrac: number;
}

interface UseCursorOpts {
  /// The scroll container that wraps the rendered prose. Used both
  /// for user-scroll detection (so we know when to pause auto-scroll)
  /// and as the reference frame for the in-viewport check before
  /// auto-scrolling. Pass null on the first render.
  scrollContainer: HTMLElement | null;
  /// The article element that holds the rendered HTML (the parent of
  /// the `data-tts-block` elements). We re-walk its children whenever
  /// `html` changes.
  article: HTMLElement | null;
  /// The exact HTML string currently committed via
  /// `dangerouslySetInnerHTML` on the article. Drives boundary
  /// recomputation and class re-application — when this string
  /// identity changes, the hook assumes the article's children have
  /// been replaced. Pass `null` while markdown render is in flight.
  html: string | null;
  /// Audio progress in [0..1]. When this is undefined / NaN / 0 the
  /// hook returns `currentBlock: null` (no cursor shown).
  progress: number;
  /// Whether audio is actively playing (drives auto-scroll). Pausing
  /// stops the scroll-follow but the cursor stays visible at the
  /// last position.
  isPlaying: boolean;
  /// How long to disable auto-scroll after a user-initiated scroll.
  /// Default 6s — long enough that scrolling a couple of paragraphs
  /// up to re-read something doesn't get yanked back, short enough
  /// that the learner can re-engage by just sitting still.
  pauseAfterUserScrollMs?: number;
}

interface UseCursorResult {
  /// 0-indexed block currently being narrated, or null when audio
  /// progress is idle / unknown. Matches `data-tts-block="<N>"`.
  /// Surfaced for tests / debug overlays / sentence-level extensions
  /// — the hook applies the `.libre-tts-current` class itself.
  currentBlock: number | null;
  /// Total annotated blocks in the article (helpful for debugging).
  totalBlocks: number;
}

/// Class applied to whichever `[data-tts-block]` element matches the
/// current narration position. Stylesheets read this name; tests
/// can match against it. Centralised here so consumer JSX doesn't
/// have to repeat it.
const CURRENT_CLASS = "libre-tts-current";

const DEFAULT_PAUSE = 6_000;
/// Code-block length cap. The TTS pipeline replaces a fenced code
/// block with a one-sentence summary (~50–100 chars), so the audio
/// time spent on a code block is much smaller than the rendered
/// `<pre>`'s text length suggests. We cap `<pre>` blocks at this
/// many chars during boundary computation so the cursor doesn't
/// stall on them.
const CODE_BLOCK_LEN_CAP = 80;

export function useLessonReadCursor(opts: UseCursorOpts): UseCursorResult {
  const {
    scrollContainer,
    article,
    html,
    progress,
    isPlaying,
    pauseAfterUserScrollMs = DEFAULT_PAUSE,
  } = opts;

  // ── Boundary computation ─────────────────────────────────────────
  // Re-walk the article's `[data-tts-block]` annotations whenever the
  // rendered HTML changes. No MutationObserver — see file header.
  const [boundaries, setBoundaries] = useState<BlockBoundary[]>([]);
  useEffect(() => {
    if (!article || !html) {
      setBoundaries((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    const els = Array.from(
      article.querySelectorAll<HTMLElement>("[data-tts-block]"),
    );
    if (els.length === 0) {
      setBoundaries((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    const lens = els.map((el) => {
      const declared = parseInt(el.getAttribute("data-tts-len") ?? "0", 10);
      // Code blocks: cap at the typical summary length so they don't
      // dominate the timing.
      if (el.tagName === "PRE") {
        return Math.min(declared || 1, CODE_BLOCK_LEN_CAP);
      }
      // Empty paragraphs (rare — image-only) get a tiny non-zero
      // weight so they don't divide-by-zero anywhere.
      return Math.max(declared, 1);
    });
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    const next: BlockBoundary[] = els.map((el, i) => {
      acc += lens[i];
      return {
        index: parseInt(el.getAttribute("data-tts-block") ?? `${i}`, 10),
        endFrac: acc / total,
      };
    });
    setBoundaries(next);
  }, [article, html]);

  // ── Current block resolution ─────────────────────────────────────
  const currentBlock = useMemo(() => {
    if (!boundaries.length) return null;
    if (!Number.isFinite(progress) || progress <= 0) return null;
    const p = Math.min(1, progress);
    // Linear scan — boundaries.length is small (typical lesson <30
    // blocks), no need for binary search.
    for (let i = 0; i < boundaries.length; i++) {
      if (p < boundaries[i].endFrac) return boundaries[i].index;
    }
    return boundaries[boundaries.length - 1].index;
  }, [boundaries, progress]);

  // ── User-scroll detection ────────────────────────────────────────
  // Pauses auto-scroll for `pauseAfterUserScrollMs` after any scroll
  // event that fires OUTSIDE a known programmatic-scroll window.
  const lastUserScrollAt = useRef<number>(0);
  const programmaticUntil = useRef<number>(0);
  useEffect(() => {
    if (!scrollContainer) return;
    const onScroll = () => {
      if (Date.now() < programmaticUntil.current) return;
      lastUserScrollAt.current = Date.now();
    };
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", onScroll);
  }, [scrollContainer]);

  // ── Class application ────────────────────────────────────────────
  // Track the currently-highlighted DOM node in a ref so we only
  // mutate when the *target* changes, not on every dep flip. The
  // earlier "remove everything then reapply" pattern produced a
  // brief no-class window every render and could leave the highlight
  // gone if anything (CSS animation, reflow from a sibling effect)
  // raced the readd. With the ref, an effect re-run that resolves
  // to the same target is a no-op.
  //
  // When `html` changes the article's children are rebuilt, so the
  // previously-classed element is now detached. We detect that with
  // `article.contains(...)` and forget the stale ref before querying
  // the new tree.
  //
  // No cleanup function is registered. With React.StrictMode (on in
  // dev), every effect with a cleanup gets the setup → cleanup →
  // setup dance on mount; a cleanup that removes the highlight class
  // would erase it during that window even when the inputs haven't
  // actually changed. The class lives on a node that's part of the
  // article tree — when the article unmounts (lesson change / reader
  // teardown), the element and its class go with it, so no manual
  // cleanup is needed.
  const classedElRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!article) return;
    // If the previously-classed element was detached (innerHTML
    // rebuild from a new html string), forget it. Don't touch its
    // classList — the node is GC-bound, and reading its classList
    // could throw on some engines if the node was adopted.
    if (
      classedElRef.current &&
      !article.contains(classedElRef.current)
    ) {
      classedElRef.current = null;
    }
    const target =
      currentBlock != null
        ? article.querySelector<HTMLElement>(
            `[data-tts-block="${currentBlock}"]`,
          )
        : null;
    if (classedElRef.current === target) return;
    if (classedElRef.current) {
      classedElRef.current.classList.remove(CURRENT_CLASS);
    }
    if (target) {
      target.classList.add(CURRENT_CLASS);
    }
    classedElRef.current = target;
  }, [article, currentBlock, html]);

  // ── Auto-scroll behaviour ───────────────────────────────────────
  // Scrolls the current block into view whenever it CHANGES (and
  // we're allowed to). Defensive layers that grew out of an iOS
  // WKWebView freeze on play:
  //   1. Track the last block we scrolled to in a ref so the effect
  //      becomes a no-op when re-runs are caused by `isPlaying`
  //      flipping rather than the block actually advancing.
  //   2. Skip when the element is already inside the scroll
  //      container's viewport.
  //   3. Use `behavior: "auto"` (instant) instead of `"smooth"` —
  //      iOS WKWebView's smooth-scroll on the document scroller is
  //      buggy in older releases.
  //   4. Defer the scroll to the next animation frame so we don't
  //      compete with the class-application effect for the same
  //      paint cycle.
  const lastScrolledBlock = useRef<number | null>(null);
  useEffect(() => {
    if (!isPlaying || currentBlock == null || !article || !scrollContainer)
      return;
    if (lastScrolledBlock.current === currentBlock) return;
    if (Date.now() - lastUserScrollAt.current < pauseAfterUserScrollMs)
      return;
    const el = article.querySelector<HTMLElement>(
      `[data-tts-block="${currentBlock}"]`,
    );
    if (!el) return;
    lastScrolledBlock.current = currentBlock;

    // Already-in-viewport check: if the element is comfortably inside
    // the scroller's visible area, don't scroll at all. Avoids the
    // first-block no-op scroll and reduces churn while the learner is
    // mid-paragraph.
    const cRect = scrollContainer.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const fullyVisible =
      eRect.top >= cRect.top && eRect.bottom <= cRect.bottom;
    if (fullyVisible) return;

    programmaticUntil.current = Date.now() + 600;
    const raf = requestAnimationFrame(() => {
      try {
        el.scrollIntoView({ behavior: "auto", block: "center" });
      } catch {
        /* very old engines don't support options object — ignore */
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [
    currentBlock,
    isPlaying,
    article,
    scrollContainer,
    pauseAfterUserScrollMs,
  ]);

  return { currentBlock, totalBlocks: boundaries.length };
}
