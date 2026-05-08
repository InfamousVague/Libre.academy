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

  return (
    <button
      type="button"
      className={`fishbones-ai-character fishbones-ai-character--${mood} ${
        open ? "is-open" : ""
      }`}
      onClick={onClick}
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
      {/* Visible "How can I assist?" tooltip-style chip floating to
          the LEFT of the orb. Always-on for idle mood (the most
          common state when a learner first sees the assistant) so
          the affordance is discoverable on platforms where the
          browser-default `title` attribute doesn't fire — iOS has
          no hover, so the title alone meant the assistant was
          effectively unlabeled on phone. Hidden during streaming
          / celebrating / alert / open because those moods carry
          their own visual signal and a static label fights with
          them. aria-hidden because the button's aria-label already
          carries the canonical text for screen readers. */}
      {!open && !streaming && !alert && !celebrating && (
        <span className="fishbones-ai-character-tip" aria-hidden>
          How can I assist?
        </span>
      )}
      {/* DNA double-helix glyph (replaces the prior fish-skeleton
          mask). Mood drives `speed`: thinking + celebrating spin
          faster so the orb visibly leans in; idle + alert hold the
          baseline cycle so the orb feels calm or locked. The helix
          itself is colour-randomised at mount time — see DnaHelix
          for the palette + per-strand stagger maths. */}
      <DnaHelix
        className="fishbones-ai-character-icon"
        speed={
          mood === "streaming"
            ? 1.2
            : mood === "celebrating"
              ? 1
              : mood === "alert"
                ? 4
                : 2
        }
      />
    </button>
  );
}
