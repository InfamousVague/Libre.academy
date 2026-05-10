/// Boot-time splash overlay. Replaces the previous static spinner
/// bootloader with a two-stage video sequence:
///
///   1. `splash.mp4` plays once (intro animation, ~5 s).
///   2. `splash_idle.mp4` loops while we wait for the slowest of:
///      - the course list to load from disk + sync
///      - every cover JPEG to be cached locally (via `prefetchCovers`)
///   3. Both signals satisfied AND the intro has played → fade out
///      to reveal the app.
///
/// Why videos and not the previous FishbonesLoader spinner: the
/// loader read as "we're stuck" instead of "we're loading". A video
/// burns the same wall-clock time but reads as a deliberate brand
/// beat — and the idle clip gives us a graceful runway for slow
/// first-launch paths (cold disk, fresh sync, large catalog) without
/// any "is this thing on" anxiety.
///
/// Graceful degradation:
///   - `splash_idle.mp4` is optional. If the asset 404s (the user is
///     on an older deploy, or we haven't shipped the idle clip yet),
///     we hold on the intro's last frame instead.
///   - All videos are muted + autoplay so iOS / Safari don't block
///     them. The intro is short and the audio system is muted by
///     default in the early boot path anyway, so the silent intro
///     reads correctly even when sound effects are on later.
///   - Slow first paint: the parent can pass `minDisplayMs` (default
///     2400 ms) so we never flash the splash for less than long
///     enough to be visually noticed. Helps when courses + covers
///     load instantly (returning user with everything cached).
///   - Cap: `maxDisplayMs` (default 12 000 ms) is a watchdog. If the
///     readiness signal never fires (network hang on cover fetch,
///     etc.) we ditch the splash anyway so the user isn't stuck
///     staring at a loop forever.

import { useEffect, useRef, useState } from "react";
import "./SplashScreen.css";

interface Props {
  /// Public-relative URL of the intro clip. Defaults to `/splash.mp4`.
  introSrc?: string;
  /// Public-relative URL of the idle / loop clip. Defaults to
  /// `/splash_idle.mp4`. Falls back to holding on the intro's last
  /// frame when the asset is missing.
  idleSrc?: string;
  /// `true` once the parent says everything we need is cached and
  /// the main UI is safe to reveal. The splash still won't dismiss
  /// until BOTH this flag is true AND the intro has played fully.
  ready: boolean;
  /// Don't dismiss before this many ms have elapsed since mount,
  /// even if both signals are satisfied early. Prevents a
  /// returning-user flash where the splash blinks on for ~80 ms
  /// then disappears.
  minDisplayMs?: number;
  /// Hard watchdog — if the splash hasn't dismissed by this many
  /// ms after mount, force it off. Covers the "cover fetch hangs
  /// forever" case so the user isn't trapped.
  maxDisplayMs?: number;
  /// Fired exactly once after the fade-out finishes. The parent
  /// uses this to unmount the splash from the tree (rendering an
  /// unused `<video>` is a small but non-zero memory cost).
  onDismissed: () => void;
}

type Stage = "intro" | "idle" | "fading" | "gone";

const FADE_MS = 360;

export default function SplashScreen({
  introSrc = "/splash.mp4",
  idleSrc = "/splash_idle.mp4",
  ready,
  minDisplayMs = 2400,
  maxDisplayMs = 12_000,
  onDismissed,
}: Props) {
  const [stage, setStage] = useState<Stage>("intro");
  const [idleAvailable, setIdleAvailable] = useState<boolean | null>(null);
  /// True once `splash.mp4` has fired its `ended` event at least once.
  /// Required (alongside `ready` + the minDisplayMs floor) before we
  /// can dismiss — yanking the splash mid-intro feels jarring.
  const [introPlayed, setIntroPlayed] = useState(false);
  const mountedAtRef = useRef<number>(performance.now());
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const idleVideoRef = useRef<HTMLVideoElement>(null);

  // Probe whether the idle clip exists. A HEAD request beats a full
  // GET — the file might be a couple of MB and we don't want to
  // start downloading it speculatively just to find out. Browsers
  // happily cache the result so the actual <video> load right after
  // hits warm.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(idleSrc, { method: "HEAD" });
        if (!cancelled) setIdleAvailable(res.ok);
      } catch {
        if (!cancelled) setIdleAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idleSrc]);

  // Stage 1 → 2 transition: when the intro fires `ended`, switch to
  // the idle loop (or hold on intro's last frame if idle isn't
  // available yet / at all).
  useEffect(() => {
    const v = introVideoRef.current;
    if (!v) return;
    const onEnded = () => {
      setIntroPlayed(true);
      // If idle is known to exist, fade to it. If idle's still
      // probing, optimistically swap — onError will fall back. If
      // idle is known missing, freeze the intro on its last frame
      // (the browser will hold the final paint after pause()).
      if (idleAvailable !== false) {
        setStage("idle");
      } else {
        try {
          v.pause();
        } catch {
          /* paused before mount, or already paused — ignore */
        }
      }
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [idleAvailable]);

  // Watchdog: dismiss after maxDisplayMs no matter what.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setIntroPlayed(true); // unblock the dismiss path
      setStage("fading");
    }, maxDisplayMs);
    return () => window.clearTimeout(id);
  }, [maxDisplayMs]);

  // Dismiss trigger: ready + introPlayed + minDisplayMs elapsed.
  useEffect(() => {
    if (!ready || !introPlayed) return;
    const elapsed = performance.now() - mountedAtRef.current;
    const wait = Math.max(0, minDisplayMs - elapsed);
    const id = window.setTimeout(() => setStage("fading"), wait);
    return () => window.clearTimeout(id);
  }, [ready, introPlayed, minDisplayMs]);

  // Fade-out finishes → tell the parent to unmount us.
  useEffect(() => {
    if (stage !== "fading") return;
    const id = window.setTimeout(() => {
      setStage("gone");
      onDismissed();
    }, FADE_MS);
    return () => window.clearTimeout(id);
  }, [stage, onDismissed]);

  if (stage === "gone") return null;

  return (
    <div
      className={`fb-splash${stage === "fading" ? " fb-splash--fading" : ""}`}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      {/* Intro clip. Visible from mount through the first `ended`
          event; hidden once we swap to idle (but kept in the DOM so
          a future stage-rewind is cheap). */}
      <video
        ref={introVideoRef}
        className={`fb-splash__video ${stage === "intro" ? "fb-splash__video--active" : ""}`}
        src={introSrc}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
      {/* Idle clip. Only mounted once we know it exists (or while
          we're still probing). Looping silently. */}
      {idleAvailable !== false ? (
        <video
          ref={idleVideoRef}
          className={`fb-splash__video ${stage === "idle" ? "fb-splash__video--active" : ""}`}
          src={idleSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
          onError={() => setIdleAvailable(false)}
        />
      ) : null}
      <span className="fb-splash__sr-label">Loading Libre…</span>
    </div>
  );
}
