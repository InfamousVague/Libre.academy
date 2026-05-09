import { useCallback, useEffect, useState } from "react";
import "./AiCharacter.css";
import DnaHelix from "./DnaHelix";

interface Props {
  /// Whether the chat panel is open. Drives a subtle "pressed" pose so
  /// the button reads as toggle state rather than a static affordance.
  open: boolean;
  streaming: boolean;
  /// True while we're holding a "you just passed a lesson!" state.
  /// Wins over every state except the alert dot — a celebration
  /// outranks "panel just opened" but never cancels a hard error.
  celebrating?: boolean;
  /// Click handler. Toggles the chat panel open/closed. The parent
  /// owns panel state so the character can be triggered from other
  /// affordances too (e.g. a hint button on a failing test).
  onClick: () => void;
  /// When true, swap to the alert palette + render a small red dot.
  /// Used for "Ollama isn't reachable" / "model not installed".
  alert?: boolean;
}

/// Floating bottom-right entry point to the local AI tutor. Renders as
/// a gradient-filled disc with the Fishbones logo, anchored absolutely
/// to the viewport. State drives palette + animation speed, not asset
/// swaps — the disc is pure CSS so the whole assistant ships with zero
/// bundled image bytes.
///
/// Mood priority (top wins):
///   alert       → red palette + jittery glow + alert dot
///   celebrating → warm gold/pink palette + faster spin
///   streaming   → cyan/violet palette + medium spin (matches "thinking")
///   idle        → neutral cool palette + slow drift
/// Boost duration in ms after the orb is clicked. The DNA helix
/// snaps to a fast 0.5s strand-cycle, then eases back to whatever
/// the mood would dictate over the next minute. Interaction signal:
/// the orb visibly "wakes up" in response to the user's tap, then
/// settles back to its resting rhythm. Re-clicking resets the
/// timer so the user can keep it lively if they're in conversation.
const CLICK_BOOST_MS = 60_000;
/// Speed (in seconds per strand-jump cycle) at the peak of the boost
/// — i.e. immediately after a click. Lower = faster.
const CLICK_BOOST_PEAK_SPEED = 0.5;

/// Cubic-ease-out: starts moving fast in the early frames, slows
/// gracefully near the end. `t` is 0..1 over the boost window;
/// returns 0..1 with the easing applied. We use this to interpolate
/// between the peak boost speed and the mood baseline so the helix
/// doesn't snap back at the 60s mark — it eases.
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function AiCharacter({
  open,
  streaming,
  celebrating,
  onClick,
  alert,
}: Props) {
  let mood: "idle" | "streaming" | "celebrating" | "alert";
  if (alert) mood = "alert";
  else if (celebrating) mood = "celebrating";
  else if (streaming) mood = "streaming";
  else mood = "idle";

  // Mood-based baseline strand-jump cycle. The DNA helix's `speed`
  // prop reads in seconds per cycle (lower = faster).
  const baselineSpeed =
    mood === "streaming"
      ? 1.2
      : mood === "celebrating"
        ? 1
        : mood === "alert"
          ? 4
          : 16;

  // Click-boost state. `boostedAt` is the timestamp of the most
  // recent tap (or null if the boost has expired); `boostTick` is a
  // counter that we bump every second while the boost is active so
  // the speed interpolation re-renders even though `boostedAt`
  // itself doesn't change. Without the tick the speed prop would
  // freeze at the value at the moment of the click and never ease
  // back.
  const [boostedAt, setBoostedAt] = useState<number | null>(null);
  const [, setBoostTick] = useState(0);
  useEffect(() => {
    if (boostedAt == null) return;
    let cancelled = false;
    const interval = window.setInterval(() => {
      if (cancelled) return;
      const elapsed = Date.now() - boostedAt;
      if (elapsed >= CLICK_BOOST_MS) {
        setBoostedAt(null);
      } else {
        setBoostTick((t) => t + 1);
      }
    }, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [boostedAt]);

  // Compute the actual `speed` prop for the helix. When boosted we
  // interpolate between the peak boost speed (fast) and the mood
  // baseline using cubic-ease-out — the helix moves rapidly right
  // after the click and settles smoothly back to its resting rhythm.
  // No boost active = baseline straight through.
  let speed = baselineSpeed;
  if (boostedAt != null) {
    const elapsed = Date.now() - boostedAt;
    const t = Math.min(1, Math.max(0, elapsed / CLICK_BOOST_MS));
    const eased = easeOutCubic(t);
    speed =
      CLICK_BOOST_PEAK_SPEED +
      (baselineSpeed - CLICK_BOOST_PEAK_SPEED) * eased;
  }

  // Wrap the consumer's onClick so a click both toggles the panel
  // (parent state) AND restamps the boost timer. Re-clicking during
  // an active boost extends it — feels right when the user is
  // actively interacting with the assistant.
  const handleClick = useCallback(() => {
    setBoostedAt(Date.now());
    onClick();
  }, [onClick]);

  return (
    <button
      type="button"
      className={`fishbones-ai-character fishbones-ai-character--${mood} ${
        open ? "is-open" : ""
      }`}
      onClick={handleClick}
      aria-label={open ? "Close assistant" : "Open assistant"}
      aria-expanded={open}
      title={
        streaming
          ? "Thinking…"
          : alert
            ? "Local assistant needs setup"
            : open
              ? "Close assistant"
              : "How can I assist?"
      }
    >
      {/* "How can I assist?" tooltip floating to the LEFT of the
          orb. Hidden by default; revealed on hover via the CSS
          rule on the parent button (`:hover .fishbones-ai-character-tip`
          fades opacity 0 → 1). Mounted only when none of the
          state moods (open / streaming / alert / celebrating)
          would be telling a different story — those moods carry
          their own visual signal and the tooltip would compete
          with them. aria-hidden because the button's aria-label
          already carries the canonical text for screen readers. */}
      {!open && !streaming && !alert && !celebrating && (
        <span className="fishbones-ai-character-tip" aria-hidden>
          How can I assist?
        </span>
      )}
      {/* DNA double-helix glyph. Mood drives the baseline `speed`
          (thinking + celebrating push faster, alert slows to "locked
          / waiting on human", idle settles to the slowest 16s
          rhythm) and click-boost layers on top: tap the orb and the
          helix snaps to a 0.5s cycle for the next 60s, easing back
          to baseline via cubic-ease-out. The interpolated value
          comes out of the `speed` local computed above; the helix
          itself is colour-randomised at mount time — see DnaHelix
          for the palette + per-strand stagger maths. */}
      <DnaHelix className="fishbones-ai-character-icon" speed={speed} />
    </button>
  );
}
