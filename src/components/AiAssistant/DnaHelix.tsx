/// Animated CSS double-helix glyph. Pure markup + CSS — no SVG, no
/// canvas, no bundled bytes. Adapted from jh3y's CodePen
/// (https://codepen.io/jh3y/pen/GRBVNJE), reworked into a self-
/// contained React component:
///
///   - Strand count is a prop so the same component scales from a
///     dense floating orb glyph (13 strands) to a wide hero banner
///     (30+ strands) without per-call CSS overrides.
///   - Per-strand stagger delay is computed in JS and passed via
///     CSS custom properties, sidestepping the `sin()` support gap
///     on iOS WebKit < 15.4 (the original relied on
///     `calc(sin(...) * -1s)`).
///   - Node colors are picked once at mount (memoised on `strands`)
///     so the helix doesn't dance through palettes every render.
///
/// Sizes via `em`: the helix's height is 1em, width is 0.4em (the
/// CodePen's 2:5 aspect). Setting `font-size` on the parent or on
/// the helix's wrapper class drives the rendered size — 30px font
/// ⇒ 30px tall helix that fits cleanly inside a small floating
/// button after the 30° rotation.
///
/// `transform-style: preserve-3d` + `perspective` on a higher
/// ancestor are required for the Z translations the jump animation
/// uses; the consumer is responsible for the perspective context
/// (the AI orb sets `perspective: 80px` on the button itself).

import { useMemo } from "react";
import type { LanguageId } from "../../data/types";
import { LANGUAGE_META } from "../../lib/languages";
import "./DnaHelix.css";

interface Props {
  /// Number of horizontal strands stacked vertically. Default 9
  /// (was 13, but dropped so each strand's allotted height grows —
  /// nodes are aspect-ratio: 1 circles that fill the strand height,
  /// so fewer strands = thicker dots without changing the helix
  /// font-size). Bumping back up makes the helix denser at the
  /// cost of smaller individual nodes.
  strands?: number;
  /// Animation speed in seconds (one full jump cycle). Lower = faster.
  /// Default 2s. The mood-driven AiCharacter passes shorter values
  /// during streaming / celebrating to make the helix visibly lean
  /// in.
  speed?: number;
  /// Optional className passthrough for parent-scoped styling
  /// (size via `font-size`, opacity, filter etc.).
  className?: string;
}

/// Curated subset of the app's language brand colours, picked to
/// span the hue wheel evenly so the random per-strand assignment
/// produces a balanced rainbow rather than e.g. five blues in a row.
/// Sourced from `LANGUAGE_META` so any brand-colour adjustment in
/// `lib/languages.tsx` (e.g. when Solidity's chip colour was retuned
/// to Ethereum blue for legibility) flows through to the helix
/// automatically. Order doesn't matter — the assignment is random
/// per node — but the language IDs are kept in roughly hue order
/// to make the palette readable when scanning the source.
const PALETTE_LANGS: readonly LanguageId[] = [
  "javascript", // #F7DF1E sun-yellow
  "swift", //      #FA7343 deep orange
  "rust", //       #CE412B brick red
  "kotlin", //     #7F52FF rich purple
  "typescript", // #3178C6 cobalt blue
  "go", //         #00ADD8 saturated cyan
  "react", //      #61DAFB light cyan
];

const PALETTE: readonly string[] = PALETTE_LANGS.map(
  (id) => LANGUAGE_META[id].color,
);

export default function DnaHelix({
  strands = 9,
  speed = 2,
  className,
}: Props) {
  // Per-mount colour assignments. Random looks more organic than
  // a strict pattern but we don't want them to dance every render
  // — useMemo holds them stable until `strands` changes.
  const colors = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < strands * 2; i++) {
      out.push(PALETTE[Math.floor(Math.random() * PALETTE.length)]!);
    }
    return out;
  }, [strands]);

  return (
    <div
      className={`fb-dna${className ? ` ${className}` : ""}`}
      style={
        {
          "--fb-dna-total": String(strands),
          "--fb-dna-speed": `${speed}s`,
        } as React.CSSProperties
      }
      aria-hidden
    >
      {Array.from({ length: strands }, (_, i) => {
        const index = i + 1;
        // Per-strand stagger: sin(index/total * 45°) * speed, in
        // seconds, negated. Computing in JS dodges the iOS WebKit
        // <15.4 gap where `calc(sin(...) * -1s)` is unsupported and
        // every strand would otherwise animate in lockstep with no
        // visible "wave".
        const delaySec = -(
          Math.sin((index / strands) * (Math.PI / 4)) * speed
        );
        return (
          <div
            key={i}
            className="fb-dna__strand"
            style={
              {
                "--fb-dna-delay": `${delaySec}s`,
              } as React.CSSProperties
            }
          >
            <div
              className="fb-dna__node"
              style={
                { "--fb-dna-bg": colors[i * 2] } as React.CSSProperties
              }
            />
            <div
              className="fb-dna__node"
              style={
                {
                  "--fb-dna-bg": colors[i * 2 + 1],
                } as React.CSSProperties
              }
            />
          </div>
        );
      })}
    </div>
  );
}
