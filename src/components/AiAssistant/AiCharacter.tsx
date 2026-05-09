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
/// runs at the rapid-spin speed for the full minute, then snaps
/// back to the mood baseline.
///
/// Why a snap back rather than a smooth ramp: the helix's strands
/// each carry a per-strand `--fb-dna-delay` computed against the
/// active speed (so the wave staggers correctly across the helix
/// length). Continuously changing `--fb-dna-speed` over time
/// forces every node + connecting bar's CSS animation to RESTART
/// at frame 0 — which reads as flickering every render. Snapping
/// the speed at exactly two moments (click, +60s) means just two
/// restarts per boost cycle: imperceptible at the click moment
/// (the user just initiated the boost so motion change is
/// expected), and fairly subtle at the 60s mark (the user is
/// almost certainly looking somewhere else by then).
const CLICK_BOOST_MS = 60_000;
/// Speed (in seconds per strand-jump cycle) while boosted —
/// immediately after a click and for the full duration. Lower =
/// faster. 2.0s is comfortably faster than the 16s idle baseline
/// (8× the rate, so the orb clearly reads as "active") without
/// crossing into frenetic-pulsing territory; the previous 0.5s
/// felt more anxious than alive.
const CLICK_BOOST_SPEED = 2.0;

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
  // recent tap (or null when the boost has expired). State only
  // changes at exactly two moments per boost cycle:
  //
  //   1. The click itself (boostedAt: null → Date.now())
  //   2. 60s later (boostedAt: number → null)
  //
  // No continuous re-renders in between — the CSS animations on the
  // helix nodes + connecting bars stay running uninterrupted for
  // the full minute. Earlier versions of this component ticked at
  // 1Hz to interpolate the speed gradually; that re-rendered the
  // speed prop every second, which forced every animation in the
  // helix to restart at frame 0. The visible flicker — including
  // when hovering, since hover landed on freshly-restarted frames
  // — was that interpolation, not anything inherent to hover.
  const [boostedAt, setBoostedAt] = useState<number | null>(null);
  useEffect(() => {
    if (boostedAt == null) return;
    const id = window.setTimeout(() => {
      setBoostedAt(null);
    }, CLICK_BOOST_MS);
    return () => window.clearTimeout(id);
  }, [boostedAt]);

  // Two-state speed: boosted = 0.5s, otherwise mood-baseline. The
  // user perceives a click → fast spin → snap back to normal at the
  // minute mark. Hover doesn't enter into this — `:hover` only
  // changes parent scale + tooltip opacity at the CSS layer; it
  // never re-renders this component, and the helix animations don't
  // restart on a parent transform.
  const speed = boostedAt != null ? CLICK_BOOST_SPEED : baselineSpeed;

  // Wrap the consumer's onClick so a click both toggles the panel
  // (parent state) AND restamps the boost timer. Re-clicking during
  // an active boost extends it — feels right when the user is
  // actively interacting with the assistant. State change to a new
  // timestamp re-runs the effect above, clearing the old timeout
  // and scheduling a fresh one.
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
          rhythm). Click-boost layers on top with a hard switch:
          tap the orb and the helix snaps to a 0.5s cycle for the
          next 60s, then snaps back. Two state changes per boost
          (click + 60s expiry), no continuous interpolation —
          continuous updates would restart the underlying CSS
          animations on every render and look glitchy. The helix
          itself is colour-randomised at mount time — see DnaHelix
          for the palette + per-strand stagger maths. */}
      <DnaHelix className="fishbones-ai-character-icon" speed={speed} />
    </button>
  );
}
