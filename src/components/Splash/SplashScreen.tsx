/// Boot-time splash overlay. Two-stage video sequence:
///
///   1. `splash.mp4` plays once start-to-end (intro animation, ~5 s).
///   2. While the app is still loading, the last `BOUNCE_WINDOW_SEC`
///      seconds of the same clip ping-pong back and forth — forward
///      to the final frame, reverse to the bounce-floor, repeat —
///      until `ready` flips true. The bounce stays on the same
///      asset, so no second video file ships with the app.
///   3. `ready` + intro-played + `minDisplayMs` floor satisfied →
///      fade out + unmount.
///
/// Why bounce instead of a separate idle clip: the intro's last
/// couple of seconds typically settle into a logo / brand beat that
/// reads fine as a hold pattern; reversing it produces a subtle
/// "breathing" loop without needing a second asset. Cheaper to ship,
/// trivially in-sync with the intro's final frame.
///
/// Reverse-playback note: HTML5 `<video>` doesn't reliably support
/// `playbackRate < 0` across all engines (Safari historically just
/// ignores it). The bounce instead drives the video frame-by-frame
/// via `requestAnimationFrame`, setting `currentTime` to a triangle-
/// wave position computed from elapsed wall time. Browsers handle
/// fine-grained seeks on a small MP4 in cache without dropping frames
/// for our 2-second window; if the device can't keep up, the worst
/// case is a slightly less smooth ping-pong, which is still fine
/// loading-screen material.
///
/// Graceful degradation:
///   - The intro is muted + autoplay + playsInline so iOS / Safari
///     don't block the first cue. Audio in the source file is
///     ignored.
///   - Slow first paint: the parent can pass `minDisplayMs` (default
///     2400 ms) so the splash never flashes for less than long
///     enough to be noticed. Helps when courses + covers load
///     instantly (returning user with everything cached).
///   - Cap: `maxDisplayMs` (default 12 000 ms) is a watchdog. If the
///     readiness signal never fires (network hang on cover fetch
///     etc.) the splash dismisses anyway so the user isn't stuck
///     staring at a loop forever.
///   - `prefers-reduced-motion`: the bounce stops at the final frame
///     and holds there instead of ping-ponging — preserves the same
///     dismissal flow without the constant motion.

import { useEffect, useRef, useState } from "react";
import "./SplashScreen.css";

interface Props {
  /// Public-relative URL of the intro clip. Defaults to `/splash.mp4`.
  introSrc?: string;
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

type Stage = "intro" | "bouncing" | "fading" | "gone";

const FADE_MS = 360;
/// How many seconds at the tail of the clip to ping-pong while we
/// wait for the readiness signal. Two seconds gives a noticeable
/// loop without exposing earlier parts of the intro that don't
/// read as a hold pattern.
const BOUNCE_WINDOW_SEC = 2;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function SplashScreen({
  introSrc = "/splash.mp4",
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
  const mountedAtRef = useRef<number>(performance.now());
  const videoRef = useRef<HTMLVideoElement>(null);

  // Stage 1 → 2 transition: when the intro fires `ended`, kick the
  // bounce loop into the last BOUNCE_WINDOW_SEC of the clip. The
  // rAF loop owns playback from here on; the native autoplay path
  // doesn't fire again.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnded = () => {
      setIntroPlayed(true);
      setStage("bouncing");
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, []);

  // Drive the bounce. We could use `playbackRate = -1` on browsers
  // that support it, but Safari (and Chromium prior to a relatively
  // recent fix) ignores negative rates. Frame-stepping via rAF +
  // `currentTime` is the portable path: each animation frame we
  // compute the target position as a triangle wave between
  // `floor = duration - BOUNCE_WINDOW_SEC` and `ceil = duration`,
  // pause the native playback so it can't fight us, and seek.
  useEffect(() => {
    if (stage !== "bouncing") return;
    const v = videoRef.current;
    if (!v) return;
    try {
      v.pause();
    } catch {
      /* already paused — ignore */
    }
    const duration = v.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      // Browser hasn't reported a duration yet (very rare — `ended`
      // fired, so the media has played through), so we can't drive
      // the bounce. Bail to a static hold on the final frame, which
      // matches the prefers-reduced-motion path.
      return;
    }
    if (prefersReducedMotion()) {
      // Hold on the final frame. No rAF loop; the video is paused
      // at `duration`, browsers paint that frame indefinitely.
      try {
        v.currentTime = duration;
      } catch {
        /* seek-after-ended is fine on every modern browser, but
           guard anyway — the worst case is the player keeps showing
           whatever frame it happened to land on. */
      }
      return;
    }
    const floor = Math.max(0, duration - BOUNCE_WINDOW_SEC);
    const span = duration - floor;
    // Triangle-wave period: span seconds forward + span seconds
    // reverse = 2*span. So `phase` in [0, span) is the forward
    // half; [span, 2*span) is the reverse half.
    const period = span * 2;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const phase = t % period;
      const pos =
        phase < span ? floor + phase : floor + span - (phase - span);
      try {
        v.currentTime = pos;
      } catch {
        /* If a seek throws (very rare — happens during teardown when
           the element's src is mid-unload), bail. The cleanup below
           cancels the next frame. */
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

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
      {/* Single video element drives both phases — native autoplay
          runs the intro start-to-end, then the bouncing effect's
          rAF loop takes over and seeks within the last BOUNCE_WINDOW
          seconds. The element is never unmounted between phases so
          the decoder keeps its warm state. */}
      <video
        ref={videoRef}
        className="fb-splash__video fb-splash__video--active"
        src={introSrc}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
      <span className="fb-splash__sr-label">Loading Libre…</span>
    </div>
  );
}
