/// Mobile micro-puzzle renderer. Codecademy-style stack of one-line
/// fill-in-the-blank cards. Each card shows a single highlighted line
/// of code with 1-2 inline tappable blanks; the learner picks an
/// option from a small set, gets instant feedback, and the next
/// card auto-advances after a beat.
///
/// Same component will be cribbed for the Apple Watch app (Swift
/// rewrite) — that's why `MicroPuzzleCard.lineHtml` is pre-rendered
/// at build time. Watch reads the JSON, drops the HTML straight into
/// a WebView-equivalent, and the chip positions stay accurate because
/// the build pipeline owns the Shiki pass.
///
/// Per-card state is local (which option is picked, whether revealed)
/// — lesson-level state (cards solved so far) lives in this component
/// since the parent dispatch only cares about overall completion. The
/// dispatch's bottom Next button still owns "mark complete + advance",
/// matching the rest of the mobile app's lesson-dispatch contract; we
/// just light up a celebration row when every card lands.

import { useEffect, useMemo, useRef, useState } from "react";
import { codeToHtml } from "shiki";
import type { LanguageId, MicroPuzzleCard, ClozeSlot } from "../data/types";
import "./MobileMicroPuzzle.css";

interface Props {
  challenges: MicroPuzzleCard[];
  language: LanguageId;
  prompt?: string;
  isCompleted?: boolean;
}

const SLOT_RE = /__SLOT_([A-Za-z0-9_-]+)__/g;
/// Shiki theme — same as the desktop markdown pipeline so puzzle
/// highlighting reads as one design with the lesson body.
const THEME = "github-dark";

/// Map our LanguageId to a Shiki language id. Most match 1:1; a few
/// need explicit aliasing where Shiki's name differs from ours.
function shikiLang(language: LanguageId): string {
  switch (language) {
    case "reactnative":
      return "tsx";
    case "threejs":
      return "javascript";
    case "csharp":
      return "csharp";
    case "cpp":
      return "cpp";
    case "vyper":
      // Shiki doesn't ship a Vyper grammar; Python is close enough
      // for highlight purposes since Vyper's syntax is Python-derived.
      return "python";
    case "bun":
      return "typescript";
    case "assembly":
      return "asm";
    default:
      return language;
  }
}

export default function MobileMicroPuzzle({
  challenges,
  language,
  prompt,
  isCompleted,
}: Props) {
  return (
    <section className="m-mp" aria-label="Code drills">
      <p className="m-mp__prompt">{prompt ?? "Tap to fill each blank."}</p>
      <ol className="m-mp__cards" role="list">
        {challenges.map((card, idx) => (
          <li key={card.id} className="m-mp__card-wrap">
            <Card
              card={card}
              language={language}
              index={idx}
              total={challenges.length}
              isCompleted={isCompleted}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

/// One micro-puzzle card. Owns its own state (picks, revealed) so
/// solving an earlier card doesn't reset later ones — and so the
/// renderer can scroll-into-view the next card after a correct
/// answer without scrubbing focus state.
function Card({
  card,
  language,
  index,
  total,
  isCompleted,
}: {
  card: MicroPuzzleCard;
  language: LanguageId;
  index: number;
  total: number;
  isCompleted?: boolean;
}) {
  const [picks, setPicks] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    for (const b of card.blanks) {
      init[b.id] = isCompleted ? b.answer : null;
    }
    return init;
  });
  const [openSlot, setOpenSlot] = useState<string | null>(null);

  // Pre-render the line via Shiki on first mount. We prefer the
  // build-time `lineHtml` when present (zero runtime cost). When
  // missing (hand-authored draft / dev iteration), we fall back to
  // running Shiki at render time. Either way the output is HTML
  // with `<span data-mp-slot=...>` placeholders the chip overlays
  // sit inside.
  const [renderedHtml, setRenderedHtml] = useState<string | null>(
    card.lineHtml ?? null,
  );
  useEffect(() => {
    if (card.lineHtml) {
      setRenderedHtml(card.lineHtml);
      return;
    }
    let cancelled = false;
    void renderLine(card.line, language).then((html) => {
      if (!cancelled) setRenderedHtml(html);
    });
    return () => {
      cancelled = true;
    };
  }, [card.line, card.lineHtml, language]);

  // Stable per-blank shuffled option order. Same lesson-respawn
  // logic as MobileCloze — we don't want options reordering every
  // time the user reopens the sheet mid-pick.
  const optionOrder = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const b of card.blanks) {
      out[b.id] = shuffle(b.options);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.blanks.map((b) => b.id + "|" + b.options.join(",")).join("\n")]);

  const correctCount = card.blanks.filter(
    (b) => picks[b.id] === b.answer,
  ).length;
  const allCorrect = correctCount === card.blanks.length && card.blanks.length > 0;

  // After the user fills the last blank correctly, auto-scroll to
  // the next card so the rhythm feels "answer → see next" rather
  // than "answer → manually scroll → next". Skip when this is the
  // last card or when the lesson was already completed (re-visit).
  const cardRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!allCorrect) return;
    if (index === total - 1) return;
    const el = cardRef.current;
    if (!el) return;
    // Brief delay so the user can see the celebrate state on this
    // card before it scrolls out of view.
    const t = window.setTimeout(() => {
      const nextSibling = el.parentElement?.nextElementSibling as HTMLElement | null;
      nextSibling?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 480);
    return () => window.clearTimeout(t);
  }, [allCorrect, index, total]);

  return (
    <div
      ref={cardRef}
      className={
        "m-mp__card" + (allCorrect ? " m-mp__card--solved" : "")
      }
      data-card-index={index}
    >
      <header className="m-mp__card-head">
        <span className="m-mp__card-step">
          {index + 1}/{total}
        </span>
        {card.hint && <span className="m-mp__card-hint">{card.hint}</span>}
      </header>

      <div className="m-mp__line">
        {renderedHtml === null ? (
          // While Shiki resolves we render the raw line in a pre so
          // layout doesn't jump when highlighting lands.
          <pre className="m-mp__line-raw">
            <code>{card.line.replace(SLOT_RE, "____")}</code>
          </pre>
        ) : (
          <PuzzleLine
            html={renderedHtml}
            blanks={card.blanks}
            picks={picks}
            onTapSlot={setOpenSlot}
          />
        )}
      </div>

      {allCorrect && card.explanation && (
        <p className="m-mp__explanation">{card.explanation}</p>
      )}

      {openSlot && (
        <OptionSheet
          slot={card.blanks.find((b) => b.id === openSlot)!}
          options={optionOrder[openSlot] ?? []}
          currentPick={picks[openSlot] ?? null}
          onPick={(value) => {
            setPicks((prev) => ({ ...prev, [openSlot]: value }));
            setOpenSlot(null);
          }}
          onClose={() => setOpenSlot(null)}
        />
      )}
    </div>
  );
}

/// Inline-renders the Shiki-highlighted HTML, intercepting the slot
/// placeholder spans and replacing them with tappable chip buttons.
/// We do this with `dangerouslySetInnerHTML` + a useEffect that walks
/// the DOM after mount — simpler than a full HTML parser, fast since
/// each line has at most a couple slots.
function PuzzleLine({
  html,
  blanks,
  picks,
  onTapSlot,
}: {
  html: string;
  blanks: ClozeSlot[];
  picks: Record<string, string | null>;
  onTapSlot: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Keep the mounted DOM in sync with `picks` — when the learner
  // taps a chip and the parent updates state, walk the slot spans
  // and re-set their textContent + classes. Avoids re-running the
  // HTML insertion (which would lose the cursor / tap state).
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    for (const blank of blanks) {
      const node = root.querySelector<HTMLElement>(
        `[data-mp-slot="${blank.id}"]`
      );
      if (!node) continue;
      const pick = picks[blank.id] ?? null;
      const isCorrect = pick === blank.answer;
      const isWrong = pick !== null && !isCorrect;
      node.textContent = pick ?? `pick ${blank.hint ?? "answer"}`;
      node.className =
        "m-mp__chip" +
        (pick === null ? " m-mp__chip--empty" : "") +
        (isCorrect ? " m-mp__chip--correct" : "") +
        (isWrong ? " m-mp__chip--wrong" : "");
      // Re-bind click. Removing first prevents stale-closure
      // double-calls if React re-runs this effect.
      node.onclick = (e) => {
        e.preventDefault();
        onTapSlot(blank.id);
      };
      // Touch target — make sure the chip is reachable even
      // if Shiki wrapped it in a tightly-padded span.
      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");
    }
  }, [blanks, picks, onTapSlot]);

  return (
    <div
      ref={ref}
      className="m-mp__line-html"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/// Bottom-sheet of option chips for the active slot. Mirrors the
/// MobileCloze sheet visually so the two surfaces share vocabulary.
function OptionSheet({
  slot,
  options,
  currentPick,
  onPick,
  onClose,
}: {
  slot: ClozeSlot;
  options: string[];
  currentPick: string | null;
  onPick: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="m-mp-sheet-backdrop" onClick={onClose}>
      <div
        className="m-mp-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Pick a value${slot.hint ? ` (${slot.hint})` : ""}`}
      >
        <div className="m-mp-sheet__grip" aria-hidden />
        <div className="m-mp-sheet__head">
          {slot.hint ? `Pick a ${slot.hint}` : "Pick a value"}
        </div>
        <ul className="m-mp-sheet__list">
          {options.map((opt) => {
            const active = opt === currentPick;
            return (
              <li key={opt}>
                <button
                  type="button"
                  className={
                    "m-mp-sheet__opt" +
                    (active ? " m-mp-sheet__opt--active" : "")
                  }
                  onClick={() => onPick(opt)}
                >
                  <code>{opt}</code>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/// Run Shiki against a line of code, replacing slot markers with
/// `<span data-mp-slot="...">` placeholders BEFORE highlighting so
/// the placeholders end up inside the rendered token stream. Returns
/// the raw HTML string the renderer inlines.
async function renderLine(line: string, language: LanguageId): Promise<string> {
  // Replace each slot marker with a unique sentinel that survives
  // Shiki's escape pass. We put a placeholder identifier token in
  // the source so the highlighter sees something language-shaped,
  // then post-process to replace it with the real slot span.
  const slotIds: string[] = [];
  const sentinel = (idx: number) => `__FBSLOT${idx}__`;
  let prepared = line.replace(SLOT_RE, (_m, id) => {
    const idx = slotIds.length;
    slotIds.push(id);
    return sentinel(idx);
  });
  let html: string;
  try {
    html = await codeToHtml(prepared, {
      lang: shikiLang(language),
      theme: THEME,
      // No frame chrome / line numbers — the puzzle card is the
      // chrome.
      transformers: [],
    });
  } catch {
    // Unknown language → plain pre.
    html = `<pre><code>${escapeHtml(prepared)}</code></pre>`;
  }
  // Swap our sentinels for the tappable slot spans. Shiki's HTML
  // is escaped, so the sentinel survives unchanged.
  for (let i = 0; i < slotIds.length; i++) {
    const span = `<span data-mp-slot="${slotIds[i]}" class="m-mp__chip m-mp__chip--empty"></span>`;
    html = html.replace(sentinel(i), span);
  }
  return html;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
