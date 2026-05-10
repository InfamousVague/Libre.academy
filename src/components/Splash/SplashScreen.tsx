/// Boot-time splash overlay. Two-stage video sequence:
///
///   1. `splash.mp4` plays once start-to-end (intro animation, ~5 s).
///   2. While the app is still loading, `splash_loop.mp4` plays in
///      its place — a pre-rendered boomerang loop containing the
///      intro's final two seconds REVERSED then FORWARD, so the
///      first frame of the loop matches the last frame of the intro
///      (the swap is invisible) and the loop reads as smooth
///      reverse-then-forward "breathing" at native playback speed.
///   3. `ready` + intro-played + `minDisplayMs` floor satisfied →
///      fade out + unmount.
///
/// Why a pre-rendered loop instead of rAF-seeking the intro:
/// H.264 only supports forward decoding from keyframes — seeking
/// `currentTime` backward forces the decoder to jump to the prior
/// keyframe and decode forward to the target, which produces
/// stutter and dropped frames at any non-trivial frame rate.
/// Shipping a real reversed-then-forward video file lets the
/// browser play it forward at 1x natively, which is the smoothest
/// path on every engine. The two clips share their last/first
/// frame so the handoff is visually seamless.
///
/// Loop pipeline (re-run when splash.mp4 changes):
///   ffmpeg -i splash.mp4 -ss 3.04 -t 2.0 -an forward.mp4
///   ffmpeg -i forward.mp4 -vf reverse -an reverse.mp4
///   ffmpeg -i reverse.mp4 -i forward.mp4 \
///     -filter_complex "[0:v][1:v]concat=n=2:v=1[v]" \
///     -map "[v]" -c:v libx264 -crf 23 -preset slow -movflags +faststart \
///     -an public/splash_loop.mp4
///
/// Graceful degradation:
///   - The intro + loop are muted + autoplay + playsInline so iOS /
///     Safari don't block the first cue. Audio in the source files
///     is ignored.
///   - If the loop file is missing (older deploy), we fall back to
///     freezing on the intro's last frame. Same dismissal flow
///     either way.
///   - `minDisplayMs` (default 2400 ms) prevents a returning-user
///     flash where the splash blinks for ~80 ms and disappears.
///   - `maxDisplayMs` (default 12 000 ms) is a watchdog so a hung
///     readiness signal doesn't trap the user.
///   - `prefers-reduced-motion`: the loop is suppressed and the
///     intro's last frame is held statically instead.

import { useEffect, useRef, useState } from "react";
import "./SplashScreen.css";

interface Props {
  /// Public-relative URL of the intro clip. Defaults to `/splash.mp4`.
  introSrc?: string;
  /// Public-relative URL of the boomerang-loop clip. Defaults to
  /// `/splash_loop.mp4`. Missing file → freeze on the intro's last
  /// frame as a graceful fallback.
  loopSrc?: string;
  /// `true` once the parent says everything we need is cached and
  /// the main UI is safe to reveal. The splash still won't dismiss
  /// until BOTH this flag is true AND the intro has played fully.
  ready: boolean;
  /// Don't dismiss before this many ms have elapsed since mount,
  /// even if both signals are satisfied early. Prevents a
  /// returning-user flash.
  minDisplayMs?: number;
  /// Hard watchdog — if the splash hasn't dismissed by this many
  /// ms after mount, force it off so a flaky cover fetch can't
  /// trap the user.
  maxDisplayMs?: number;
  /// Fired exactly once after the fade-out finishes. Parent uses
  /// it to unmount the splash from the tree.
  onDismissed: () => void;
}

type Stage = "intro" | "looping" | "fading" | "gone";

const FADE_MS = 360;

/// Slow both the intro and the boomerang loop to 75 % of native rate.
/// On a fast desktop the intro was finishing before the lazy bundle
/// resolved and then freezing on the loop — visually fine, but the
/// "still loading" feel was lost because the video had clearly
/// stopped advancing. Stretching to 1.33× duration keeps perceived
/// motion alive across the whole boot window. Index.html sets the
/// same rate on its inline preloader video so the handoff is
/// continuous; if you change one, change both.
const PLAYBACK_RATE = 0.75;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function SplashScreen({
  introSrc = "/splash.mp4",
  loopSrc = "/splash_loop.mp4",
  ready,
  minDisplayMs = 2400,
  maxDisplayMs = 12_000,
  onDismissed,
}: Props) {
  const [stage, setStage] = useState<Stage>("intro");
  /// True once `splash.mp4` has fired its `ended` event at least once.
  /// Required (alongside `ready` + the minDisplayMs floor) before we
  /// can dismiss — yanking the splash mid-intro feels jarring.
  const [introPlayed, setIntroPlayed] = useState(false);
  /// Tracks whether the loop file is reachable. If the `<video>`'s
  /// onError fires we flip this to false and the component falls
  /// back to freezing on the intro's last frame.
  const [loopAvailable, setLoopAvailable] = useState(true);
  const mountedAtRef = useRef<number>(performance.now());
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const loopVideoRef = useRef<HTMLVideoElement>(null);

  // Force the splash playback rate on both video elements as soon as
  // they mount. `defaultPlaybackRate` covers any reload triggered by
  // a src change; `playbackRate` covers the currently-playing instance.
  // Done in its own effect so it fires once per ref attachment, before
  // the `ended` listener wires up for the intro. Setting it during
  // playback is cheap — the browser doesn't re-decode, just adjusts
  // its presentation cadence.
  useEffect(() => {
    const v = introVideoRef.current;
    if (v) {
      v.playbackRate = PLAYBACK_RATE;
      v.defaultPlaybackRate = PLAYBACK_RATE;
    }
    const lv = loopVideoRef.current;
    if (lv) {
      lv.playbackRate = PLAYBACK_RATE;
      lv.defaultPlaybackRate = PLAYBACK_RATE;
    }
  }, []);

  // Stage 1 → 2 transition: when the intro fires `ended`, hand off
  // to the loop file (or freeze on the intro's last frame under
  // reduced-motion / missing-loop conditions).
  useEffect(() => {
    const v = introVideoRef.current;
    if (!v) return;
    const onEnded = () => {
      setIntroPlayed(true);
      if (prefersReducedMotion() || !loopAvailable) {
        // Hold on the final frame. The browser keeps painting
        // whatever the video was showing on its pause moment.
        try {
          v.pause();
        } catch {
          /* already paused — ignore */
        }
        return;
      }
      setStage("looping");
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [loopAvailable]);

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

  // Kick the loop video into playback when we swap to it. Browsers
  // sometimes leave a preload="auto" video paused even after the
  // src has buffered — calling play() explicitly avoids the rare
  // black-frame stall after the intro ends.
  useEffect(() => {
    if (stage !== "looping") return;
    const v = loopVideoRef.current;
    if (!v) return;
    // Re-assert the slowed rate. Some browsers reset playbackRate
    // when the element transitions from preload to active playback,
    // and a 1.0x loop chasing a 0.75x intro is a visible jump.
    v.playbackRate = PLAYBACK_RATE;
    void v.play().catch(() => {
      /* autoplay-with-audio policies don't apply to a muted video,
         but if a synchronous play call ever fails for some other
         reason (e.g. detached element) we silently degrade — the
         intro stays frozen on its last frame, which still reads
         as a graceful hold. */
      setLoopAvailable(false);
    });
  }, [stage]);

  if (stage === "gone") return null;

  return (
    <div
      className={`fb-splash${stage === "fading" ? " fb-splash--fading" : ""}`}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      {/* Intro clip. Visible during the `intro` stage; hidden once
          we swap to the looping clip. Stays in the DOM so the final
          frame remains visible in the brief window between the two
          videos cross-fading. */}
      <video
        ref={introVideoRef}
        className={`fb-splash__video ${stage !== "looping" ? "fb-splash__video--active" : ""}`}
        src={introSrc}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
      {/* Boomerang loop. Preloaded so the swap is seamless. `loop`
          attribute makes the browser handle the seamless repeat
          natively — no JS scheduling, no rAF, no decode-on-seek
          stutter. `onError` (e.g. 404) flips loopAvailable so the
          fallback path kicks in. */}
      <video
        ref={loopVideoRef}
        className={`fb-splash__video ${stage === "looping" ? "fb-splash__video--active" : ""}`}
        src={loopSrc}
        muted
        playsInline
        loop
        preload="auto"
        aria-hidden
        onError={() => setLoopAvailable(false)}
      />
      <span className="fb-splash__sr-label">Loading Libre…</span>
    </div>
  );
}
