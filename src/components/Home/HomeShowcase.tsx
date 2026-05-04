/// Home-page showcase. Mounts real components with curated mock data
/// so a first-time visitor sees the actual UI of the features —
/// skill trees, the workbench editor, the local Ethereum dev chain,
/// the book library — instead of marketing screenshots that drift
/// from reality. Each tile is interactive in-place AND has a CTA
/// that routes into the dedicated view if the visitor wants more.
///
/// Mounted from `App.tsx` for two surfaces:
///   1. The fresh-install / web welcome screen (`courses.length === 0
///      && coursesLoaded`). Replaces the old single-card hero.
///   2. As an optional `view: "home"` route — sidebar can route here
///      explicitly if we ever want a "home" tab.
///
/// The components imported here are the same ones the live app uses;
/// no fixtures are baked into them. We pass mock `Course` / file
/// data through their normal props so any visual update to those
/// components shows up automatically on the home page next render.

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@base/primitives/icon";
import { arrowRight } from "@base/primitives/icon/icons/arrow-right";
import { sparkles } from "@base/primitives/icon/icons/sparkles";
import { libraryBig } from "@base/primitives/icon/icons/library-big";
import { trees as treesIcon } from "@base/primitives/icon/icons/trees";
import { code as codeIcon } from "@base/primitives/icon/icons/code";
import { coins } from "@base/primitives/icon/icons/coins";
import { compass as compassIcon } from "@base/primitives/icon/icons/compass";
import { brain } from "@base/primitives/icon/icons/brain";
import "@base/primitives/icon/icon.css";

import BookCover from "../Library/BookCover";
import { ChainDock } from "../ChainDock/ChainDock";
import EditorPane from "../Editor/EditorPane";
import {
  TREES,
  iconForSkill,
  type SkillTree,
  type SkillNode,
} from "../../data/trees";
import type { Course, WorkbenchFile } from "../../data/types";
import DownloadButton from "../DownloadButton/DownloadButton";
import { isWeb } from "../../lib/platform";
import "./HomeShowcase.css";

interface Props {
  /// Click handlers wire the bottom-of-tile CTAs into the host's
  /// route switcher. Each is optional — when omitted, the tile's
  /// CTA renders disabled (still useful as a "what's coming" hint
  /// even if a host doesn't route).
  onOpenLibrary?: () => void;
  onOpenDiscover?: () => void;
  onOpenTrees?: () => void;
  onOpenPlayground?: () => void;
  /// Primary CTA: "Get started". On desktop this opens the import
  /// flow (or library if no import is wired); on web this is hidden
  /// — the DownloadButton replaces it.
  onPrimaryAction?: () => void;
  /// Label for the primary CTA. Lets the host tune it per surface
  /// (e.g. "Import a book" on first launch, "Browse library" once
  /// books are installed).
  primaryActionLabel?: string;
}

/// Hand-picked book-cover demos. Real installed-cover IDs so
/// `useCourseCover` resolves to the bundled `cover.png` via
/// `load_course_cover`'s archive-fallback path on desktop, and to
/// `/starter-courses/<id>.jpg` on web.
const SHOWCASE_COVERS: ReadonlyArray<Course> = [
  mockCourseSummary({
    id: "the-rust-programming-language",
    title: "The Rust Programming Language",
    author: "Steve Klabnik & Carol Nichols",
    language: "rust",
    releaseStatus: "BETA",
  }),
  mockCourseSummary({
    id: "mastering-ethereum",
    title: "Mastering Ethereum",
    author: "Andreas M. Antonopoulos & Gavin Wood",
    language: "solidity",
    releaseStatus: "BETA",
  }),
  mockCourseSummary({
    id: "challenges-rust-handwritten",
    title: "Rust Challenges",
    author: "Fishbones",
    language: "rust",
    packType: "challenges",
    releaseStatus: "ALPHA",
  }),
  mockCourseSummary({
    id: "challenges-solidity-handwritten",
    title: "Solidity Challenges",
    author: "Fishbones",
    language: "solidity",
    packType: "challenges",
    releaseStatus: "ALPHA",
  }),
];

/// Tiny synthesised Course summary — only the fields BookCover and
/// the library shelf care about. Helps us avoid pulling the full
/// course bodies into the home-page bundle.
function mockCourseSummary(opts: {
  id: string;
  title: string;
  author: string;
  language: Course["language"];
  packType?: Course["packType"];
  releaseStatus?: Course["releaseStatus"];
}): Course {
  return {
    id: opts.id,
    title: opts.title,
    author: opts.author,
    language: opts.language,
    chapters: [],
    packType: opts.packType ?? "course",
    releaseStatus: opts.releaseStatus,
    // Force a non-zero `coverFetchedAt` so the web build's
    // `webCoverUrl` helper synthesizes a real /starter-courses/<id>.jpg
    // URL instead of returning null. Desktop ignores this field — its
    // load_course_cover IPC reads cover.png from disk regardless.
    coverFetchedAt: 1,
  };
}

/// Editor showcase content — a Monaco-friendly snippet that paints
/// well at small size: enough syntax variety (string literal, arrow
/// function, console.log) to show off the highlighter without a
/// horizontal scrollbar.
const EDITOR_DEMO_FILES: WorkbenchFile[] = [
  {
    name: "fizzbuzz.js",
    language: "javascript",
    content: `// Run any of 20+ languages against a built-in test harness.
function fizzbuzz(n) {
  if (n % 15 === 0) return "FizzBuzz";
  if (n % 3 === 0) return "Fizz";
  if (n % 5 === 0) return "Buzz";
  return String(n);
}

for (let i = 1; i <= 15; i++) {
  console.log(fizzbuzz(i));
}
`,
  },
];

export default function HomeShowcase({
  onOpenLibrary,
  onOpenDiscover,
  onOpenTrees,
  onOpenPlayground,
  onPrimaryAction,
  primaryActionLabel,
}: Props) {
  return (
    <div className="fishbones-home">
      <HeroBlock
        onPrimaryAction={onPrimaryAction}
        primaryActionLabel={primaryActionLabel}
        onOpenLibrary={onOpenLibrary}
      />

      <div className="fishbones-home__grid">
        <FeatureTile
          icon={treesIcon}
          eyebrow="Skill trees"
          title="Walk a curated path"
          blurb="Every concept maps to a lesson. Prerequisites lock until you've earned them — a skill tree, not a checklist."
          ctaLabel="Open trees"
          onCta={onOpenTrees}
          variant="wide"
        >
          <TreesPreview />
        </FeatureTile>

        <FeatureTile
          icon={coins}
          eyebrow="Local Ethereum chain"
          title="Deploy contracts, no testnet"
          blurb="A built-in EVM with 10 funded accounts, a faucet, and a live block clock. Solidity lessons run end-to-end against the real toolchain."
          ctaLabel="Try Solidity"
          onCta={onOpenPlayground}
        >
          <ChainDockPreview />
        </FeatureTile>

        <FeatureTile
          icon={codeIcon}
          eyebrow="Multi-language playground"
          title="20+ runtimes, one editor"
          blurb="Rust · Swift · Python · Go · Java · Kotlin · C# · TypeScript · Zig · Solidity · Vyper · Move · Cairo · Sway · and the JS family."
          ctaLabel="Open playground"
          onCta={onOpenPlayground}
          variant="wide"
        >
          <EditorPreview />
        </FeatureTile>

        <FeatureTile
          icon={libraryBig}
          eyebrow="Book library"
          title="Real books, real chapters"
          blurb="The Rust Book, Mastering Ethereum, and a growing catalog of long-form prose with embedded exercises and a per-language challenge pack."
          ctaLabel="Browse library"
          onCta={onOpenLibrary}
        >
          <LibraryPreview />
        </FeatureTile>

        <FeatureTile
          icon={compassIcon}
          eyebrow="Discover"
          title="Add books from the catalog"
          blurb="Browse what's bundled, install with one click — no downloads, no accounts. Drop in your own PDFs and let Fishbones split them into lessons."
          ctaLabel="Open Discover"
          onCta={onOpenDiscover}
        >
          <DiscoverPreview />
        </FeatureTile>

        <FeatureTile
          icon={brain}
          eyebrow="AI fix assistant"
          title="Stuck? Ask the bones"
          blurb="When a test fails, the assistant inspects your code, the failing case, and the lesson context — then proposes a patch you can apply with one click."
          ctaLabel="Open a lesson"
          onCta={onOpenLibrary}
        >
          <AssistantPreview />
        </FeatureTile>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────

function HeroBlock({
  onPrimaryAction,
  primaryActionLabel,
  onOpenLibrary,
}: {
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  onOpenLibrary?: () => void;
}) {
  return (
    <div className="fishbones-home__hero">
      <div className="fishbones-home__hero-eyebrow">
        <Icon icon={sparkles} size="xs" color="currentColor" />
        <span>Code-along books · Local toolchains · Offline-first</span>
      </div>
      <h1 className="fishbones-home__hero-title">
        Read a book.
        <br />
        Compile it.
      </h1>
      <p className="fishbones-home__hero-blurb">
        Fishbones turns technical books into interactive courses. Every
        chapter is paired with hand-rolled exercises that compile and run
        locally — Rust, Swift, Solidity, Zig, the works — so you can read
        a paragraph, write the code, and watch the test pass.
      </p>
      <div className="fishbones-home__hero-actions">
        {isWeb ? (
          <DownloadButton className="fishbones-download--hero" />
        ) : (
          onPrimaryAction && (
            <button
              type="button"
              className="fishbones-home__hero-primary"
              onClick={onPrimaryAction}
            >
              {primaryActionLabel ?? "Get started"}
            </button>
          )
        )}
        {onOpenLibrary && (
          <button
            type="button"
            className="fishbones-home__hero-secondary"
            onClick={onOpenLibrary}
          >
            Browse library
            <Icon icon={arrowRight} size="xs" color="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Feature tile shell ───────────────────────────────────────────────

function FeatureTile({
  icon,
  eyebrow,
  title,
  blurb,
  ctaLabel,
  onCta,
  variant = "default",
  children,
}: {
  icon: string;
  eyebrow: string;
  title: string;
  blurb: string;
  ctaLabel: string;
  onCta?: () => void;
  /// `wide` tiles span both grid columns at desktop sizes — used for
  /// the showcase pieces that benefit from horizontal room (skill
  /// trees + multi-line code editor).
  variant?: "default" | "wide";
  children: ReactNode;
}) {
  return (
    <section
      className={`fishbones-home__tile fishbones-home__tile--${variant}`}
      aria-label={title}
    >
      <div className="fishbones-home__tile-preview">{children}</div>
      <div className="fishbones-home__tile-meta">
        <div className="fishbones-home__tile-head">
          <span className="fishbones-home__tile-icon" aria-hidden>
            <Icon icon={icon} size="sm" color="currentColor" />
          </span>
          <span className="fishbones-home__tile-eyebrow">{eyebrow}</span>
        </div>
        <h2 className="fishbones-home__tile-title">{title}</h2>
        <p className="fishbones-home__tile-blurb">{blurb}</p>
        {onCta && (
          <button
            type="button"
            className="fishbones-home__tile-cta"
            onClick={onCta}
          >
            {ctaLabel}
            <Icon icon={arrowRight} size="xs" color="currentColor" />
          </button>
        )}
      </div>
    </section>
  );
}

// ─── Trees preview ────────────────────────────────────────────────────

/// Small SVG rendering of a representative skill tree. Uses real
/// nodes + edges from `TREES` (first beginner tree by default) but
/// laid out in a tighter, single-screen grid so it fits the tile.
/// The interaction is read-only — clicking the CTA below opens the
/// real Trees view; the preview is just to convey the visual idea.
function TreesPreview() {
  const tree: SkillTree | undefined = useMemo(
    () => TREES.find((t) => t.audience === "beginner") ?? TREES[0],
    [],
  );
  if (!tree) {
    return <div className="fishbones-home__preview-empty">No trees</div>;
  }
  // Pick the first ~8 nodes so the preview stays legible and the
  // edges paint in a single scan.
  const nodes: readonly SkillNode[] = tree.nodes.slice(0, 8);
  const idIdx = new Map(nodes.map((n, i) => [n.id, i]));

  // Compute simple BFS-by-depth layout. Roots = nodes with no
  // prereqs in the visible slice.
  const layout = useMemo(() => {
    const depth = new Map<string, number>();
    function depthOf(id: string): number {
      const cached = depth.get(id);
      if (cached !== undefined) return cached;
      const node = nodes.find((n) => n.id === id);
      if (!node) return 0;
      const prereqDepths = node.prereqs
        .filter((p) => idIdx.has(p))
        .map((p) => depthOf(p) + 1);
      const d = prereqDepths.length === 0 ? 0 : Math.max(...prereqDepths);
      depth.set(id, d);
      return d;
    }
    const positions = new Map<string, { x: number; y: number }>();
    const byDepth = new Map<number, SkillNode[]>();
    for (const n of nodes) {
      const d = depthOf(n.id);
      const arr = byDepth.get(d) ?? [];
      arr.push(n);
      byDepth.set(d, arr);
    }
    const COL_W = 140;
    const ROW_H = 86;
    const PAD = 50;
    const sortedDepths = [...byDepth.keys()].sort((a, b) => a - b);
    for (const d of sortedDepths) {
      const row = byDepth.get(d)!;
      row.forEach((n, i) => {
        positions.set(n.id, {
          x: PAD + i * COL_W + (d % 2 === 0 ? 0 : COL_W / 2),
          y: PAD + d * ROW_H,
        });
      });
    }
    return { positions, depthCount: sortedDepths.length };
  }, [nodes, idIdx]);

  return (
    <div
      className="fishbones-home__preview fishbones-home__preview--trees"
      style={{ ["--tree-accent" as string]: tree.accent }}
    >
      <svg
        viewBox="0 0 600 360"
        preserveAspectRatio="xMidYMid meet"
        className="fishbones-home__preview-svg"
        aria-hidden
      >
        {/* Edges first so node circles paint over them. */}
        {nodes.map((n) =>
          n.prereqs
            .filter((p) => layout.positions.has(p))
            .map((p) => {
              const a = layout.positions.get(p)!;
              const b = layout.positions.get(n.id)!;
              const midY = (a.y + b.y) / 2;
              return (
                <path
                  key={`${p}->${n.id}`}
                  d={`M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`}
                  stroke={tree.accent}
                  strokeWidth={1.6}
                  strokeOpacity={0.45}
                  fill="none"
                />
              );
            }),
        )}
        {/* Nodes — first node "completed", second "next", rest neutral. */}
        {nodes.map((n, i) => {
          const pos = layout.positions.get(n.id);
          if (!pos) return null;
          const state =
            i === 0 ? "complete" : i === 1 ? "active" : "locked";
          return (
            <g
              key={n.id}
              transform={`translate(${pos.x},${pos.y})`}
              className={`fishbones-home__tree-node fishbones-home__tree-node--${state}`}
            >
              <circle r={22} />
              <text
                textAnchor="middle"
                dy={36}
                className="fishbones-home__tree-label"
              >
                {n.label.length > 14 ? `${n.label.slice(0, 13)}…` : n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="fishbones-home__preview-caption">
        <span className="fishbones-home__preview-tag">{tree.short}</span>
        <span>{tree.title}</span>
      </div>
    </div>
  );
}

// Suppress unused-import warning when the icon registry doesn't pick up
// every glyph (we keep the import for the legend below).
void iconForSkill;

// ─── Library preview ──────────────────────────────────────────────────

function LibraryPreview() {
  return (
    <div className="fishbones-home__preview fishbones-home__preview--library">
      <div className="fishbones-home__shelf">
        {SHOWCASE_COVERS.map((c) => (
          <div className="fishbones-home__shelf-slot" key={c.id}>
            <BookCover
              course={c}
              progress={c.id.includes("rust") ? 0.42 : 0}
              onOpen={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Editor preview ───────────────────────────────────────────────────

/// Live Monaco editor with mock JS content. Read-only via the
/// `readOnly` flag on the file so visitors can't accidentally type
/// into a non-running editor.
function EditorPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  // Seed once and never mutate — the editor frame is decorative.
  const filesRef = useRef<WorkbenchFile[]>(
    EDITOR_DEMO_FILES.map((f) => ({ ...f, readOnly: true })),
  );
  return (
    <div className="fishbones-home__preview fishbones-home__preview--editor">
      <EditorPane
        language="javascript"
        files={filesRef.current}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
        onChange={() => {
          /* read-only — no-op */
        }}
        onRun={() => {
          /* showcase only — no runtime */
        }}
      />
    </div>
  );
}

// ─── Chain dock preview ───────────────────────────────────────────────

/// Mounts the real `<ChainDock>` inside a constrained frame. The
/// component reads from the singleton `evmChainService` — first
/// paint shows block 0 + 10 funded accounts + an empty tx list,
/// which is already rich enough to convey "yes, there's an in-app
/// chain". Wrapping in `pointer-events: none` (via CSS) keeps the
/// preview decorative — visitors interact via the CTA below.
function ChainDockPreview() {
  // Use a one-shot effect to nudge state if needed; for now we let
  // the component render its native initial state.
  useEffect(() => {
    // intentionally empty — placeholder for future "preload some
    // mock txs to make the dock look populated" logic.
  }, []);
  return (
    <div className="fishbones-home__preview fishbones-home__preview--chain">
      <ChainDock variant="banner" />
    </div>
  );
}

// ─── Discover preview ─────────────────────────────────────────────────

function DiscoverPreview() {
  // A 6-up grid of language chips — the same tile rhythm Discover
  // uses, sketched out without pulling in the whole CourseLibrary.
  const tiles: ReadonlyArray<{ label: string; tone: string }> = [
    { label: "Rust", tone: "#ce422b" },
    { label: "TypeScript", tone: "#3178c6" },
    { label: "Solidity", tone: "#8a92b2" },
    { label: "Python", tone: "#3776ab" },
    { label: "Swift", tone: "#f05138" },
    { label: "Zig", tone: "#f7a41d" },
  ];
  return (
    <div className="fishbones-home__preview fishbones-home__preview--discover">
      <div className="fishbones-home__discover-grid">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="fishbones-home__discover-chip"
            style={{ ["--chip-tone" as string]: t.tone }}
          >
            <span className="fishbones-home__discover-chip-label">
              {t.label}
            </span>
            <span className="fishbones-home__discover-chip-tag">
              install →
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Assistant preview ───────────────────────────────────────────────

function AssistantPreview() {
  return (
    <div className="fishbones-home__preview fishbones-home__preview--assistant">
      <div className="fishbones-home__chat">
        <div className="fishbones-home__chat-bubble fishbones-home__chat-bubble--user">
          <div className="fishbones-home__chat-meta">You</div>
          <div className="fishbones-home__chat-body">
            <code>fizzbuzz(15)</code> returns <code>"Fizz"</code> instead
            of <code>"FizzBuzz"</code>. Why?
          </div>
        </div>
        <div className="fishbones-home__chat-bubble fishbones-home__chat-bubble--ai">
          <div className="fishbones-home__chat-meta">Fishbones AI</div>
          <div className="fishbones-home__chat-body">
            Your <code>n % 3</code> check fires before <code>n % 15</code>
            . Reorder so the multiple-of-15 case is checked first — or
            combine into one branch with <code>(n % 3 === 0 &amp;&amp; n
            % 5 === 0)</code>.
          </div>
          <div className="fishbones-home__chat-actions">
            <button className="fishbones-home__chat-apply" type="button">
              Apply patch
            </button>
            <button className="fishbones-home__chat-explain" type="button">
              Explain more
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
