/// Markdown → spoken-text preprocessor.
///
/// Lesson bodies are written as authored prose in markdown. Reading
/// them out raw makes a TTS engine pronounce every formatting mark:
/// `**Important**` becomes "asterisk asterisk Important asterisk
/// asterisk", a fenced code block becomes a tedious recitation of
/// every symbol. This module strips formatting, expands a small set
/// of well-worn abbreviations + symbols, and replaces code blocks
/// with a brief audible cue so the listener knows something was
/// skipped.
///
/// The transform is deliberately conservative — we don't try to
/// "smart-rewrite" the prose. Every change here either:
///   1. removes characters that read awkwardly (asterisks, backticks),
///   2. expands shorthand that's read wrong (`e.g.` → "for example"),
///   3. spells out identifiers TTS engines mispronounce (`P2PKH`),
///   4. replaces something unreadable (`<pre>code</pre>`) with a cue.
///
/// Usage:
///   import { markdownToSpokenText } from "./spoken-text.mjs";
///   const text = markdownToSpokenText(lesson.body);
///
/// Pure function, no IO. Idempotent on already-spoken text — running
/// it twice produces the same output, so it's safe to chain or
/// re-apply during debugging.

const ABBREVIATIONS = [
  // Latin abbrevs that read terribly when spelled out letter-by-letter.
  [/\be\.g\./gi, "for example"],
  [/\bi\.e\./gi, "that is"],
  [/\betc\./gi, "et cetera"],
  [/\bcf\./gi, "compare"],
  [/\bvs\.?/gi, "versus"],
  // Common dev shorthand. Each preserves the surrounding spaces.
  [/\bAPI\b/g, "A P I"],
  [/\bCLI\b/g, "C L I"],
  [/\bGPU\b/g, "G P U"],
  [/\bCPU\b/g, "C P U"],
  [/\bRAM\b/g, "RAM"],
  [/\bROM\b/g, "ROM"],
  [/\bURL\b/g, "U R L"],
  [/\bURI\b/g, "U R I"],
  [/\bUI\b/g, "U I"],
  [/\bUX\b/g, "U X"],
  [/\bIDE\b/g, "I D E"],
  [/\bSDK\b/g, "S D K"],
  [/\bIPC\b/g, "I P C"],
  [/\bJSON\b/g, "Jay-Sahn"],
  [/\bYAML\b/g, "Yam-ull"],
  [/\bHTML\b/g, "H T M L"],
  [/\bCSS\b/g, "C S S"],
  [/\bSQL\b/g, "S Q L"],
  // Bitcoin / crypto identifiers — these are read repeatedly across
  // the Mastering Bitcoin / Ethereum books so worth pronouncing
  // explicitly. TTS engines default to "P-too-pee-kay-aitch" which is
  // wrong; the canonical pronunciation in the space is letter-by-letter.
  // Case-insensitive so we catch lowercase occurrences inside
  // identifiers that the code-block summarizer surfaces (e.g. a
  // function named `pubkey_to_p2pkh` becomes "p2pkh" in the summary
  // sentence; we want it pronounced "P 2 P K H" regardless of case).
  [/\bP2PKH\b/gi, "P 2 P K H"],
  [/\bP2WPKH\b/gi, "P 2 W P K H"],
  [/\bP2SH\b/gi, "P 2 S H"],
  [/\bP2WSH\b/gi, "P 2 W S H"],
  [/\bP2TR\b/gi, "P 2 T R"],
  [/\bECDSA\b/gi, "E C D S A"],
  [/\bEVM\b/gi, "E V M"],
  [/\bSPV\b/gi, "S P V"],
  [/\bRBF\b/gi, "R B F"],
  [/\bCPFP\b/gi, "C P F P"],
  [/\bUTXO\b/gi, "U T X O"],
  [/\bCLTV\b/gi, "C L T V"],
  [/\bCSV\b/gi, "C S V"],
  // Number + unit pairs read with awkward pauses unless we collapse
  // the space. "100 MB" → "100MB" so the TTS reads it as one token.
  // Counter-intuitively this works better than "100 megabytes"
  // (engines often stumble on the unit expansion).
  // Nothing to do here at the regex layer — handled at chunk time.
];

const SYMBOL_REPLACEMENTS = [
  // Math/code symbols that show up inline.
  [/(\w)\s*≈\s*(\w)/g, "$1 approximately equals $2"],
  [/(\w)\s*≠\s*(\w)/g, "$1 does not equal $2"],
  [/(\w)\s*≤\s*(\w)/g, "$1 less than or equal to $2"],
  [/(\w)\s*≥\s*(\w)/g, "$1 greater than or equal to $2"],
  [/(\w)\s*→\s*(\w)/g, "$1 maps to $2"],
  // Superscripts: n², x³, 2¹⁰. TTS engines read these as if the
  // superscript is part of the previous word — "n squared" reads
  // better than "n two".
  [/(\w)²/g, "$1 squared"],
  [/(\w)³/g, "$1 cubed"],
  // En/em dashes → spoken pause. ElevenLabs handles these reasonably
  // well already; collapsing to a comma-pause keeps the cadence even
  // when they don't.
  [/—/g, ", "],
  [/–/g, ", "],
];

/// Detect fenced code blocks. We capture the fence type, the
/// optional language tag, and the body separately so the summarizer
/// below can describe the code in spoken language ("consider a
/// JavaScript function called add that takes two parameters")
/// rather than the listener hearing every symbol read aloud — which
/// is the audiobook-killer the user pointed out.
const FENCED_BLOCK_RE = /(```|~~~)\s*(\w*)\s*\n([\s\S]*?)\n\1/g;
/// Inline `code` is just stripped of its backticks — single short
/// tokens like `chain.send()` read fine without them.
const INLINE_CODE_RE = /`([^`\n]+)`/g;

/// Friendly language label. The TTS reads these aloud so we want a
/// natural pronunciation (e.g. "TypeScript" not "TS"). Falls back to
/// the raw fence tag if we don't have a mapping — most fence tags
/// are already spoken-friendly (`go`, `python`, `rust`).
const LANG_LABEL = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  jsx: "JavaScript",
  tsx: "TypeScript",
  py: "Python",
  python: "Python",
  rs: "Rust",
  rust: "Rust",
  go: "Go",
  golang: "Go",
  sol: "Solidity",
  solidity: "Solidity",
  vy: "Vyper",
  vyper: "Vyper",
  c: "C",
  cpp: "C plus plus",
  "c++": "C plus plus",
  cxx: "C plus plus",
  java: "Java",
  kt: "Kotlin",
  kotlin: "Kotlin",
  cs: "C sharp",
  csharp: "C sharp",
  swift: "Swift",
  rb: "Ruby",
  ruby: "Ruby",
  zig: "Zig",
  lua: "Lua",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  toml: "TOML",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  text: "code",
  txt: "code",
  "": "code",
};

/// Convert a comma-separated parameter list into a spoken phrase.
///
/// `style` switches the param-order convention:
///   - `"name-first"` (default) — TS / JS / Rust / Python / Solidity:
///     `x: T` or just `x` → take the part before the colon.
///   - `"name-after"` — only used by Go where the syntax is
///     `name type` (the type comes AFTER the name, no colon).
///
/// Examples:
///   ""                 → "no parameters"
///   "x"                → "one parameter, x"
///   "a, b"             → "two parameters: a and b"
///   "a, b, c"          → "three parameters: a, b, and c"
///   "a, b, c, d, e"    → "five parameters"
function paramsToSpoken(rawParams, style = "name-first") {
  if (!rawParams || !rawParams.trim()) return "no parameters";
  const names = rawParams
    .split(",")
    .map((p) =>
      p
        // Strip type annotation introduced by `:` (TS, Rust, Python)
        // or default-value `=` (any of them).
        .replace(/[:=].*$/s, "")
        // Strip leading qualifiers that aren't part of the name
        // (Rust `mut`, C `const`, JS `let/var`, references, pointers).
        .replace(/^\s*(?:mut|const|let|var|ref|&|\*)\s+/, "")
        .trim(),
    )
    .map((p) => {
      const tokens = p.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return "";
      // For Go, `s string` → name is FIRST. Everything else,
      // `x: number` (already stripped to `x`) or `x` alone → LAST.
      return style === "name-after" ? tokens[0] : tokens[tokens.length - 1];
    })
    .map((n) => n.replace(/[^A-Za-z_$][^A-Za-z0-9_$]*/g, ""))
    .filter((n) => n.length > 0);
  if (names.length === 0) return "no parameters";
  if (names.length === 1) return `one parameter, ${names[0]}`;
  if (names.length === 2) return `two parameters: ${names[0]} and ${names[1]}`;
  if (names.length === 3) return `three parameters: ${names[0]}, ${names[1]}, and ${names[2]}`;
  if (names.length <= 6) {
    const last = names[names.length - 1];
    const head = names.slice(0, -1).join(", ");
    return `${countWord(names.length)} parameters: ${head}, and ${last}`;
  }
  return `${countWord(names.length)} parameters`;
}

function countWord(n) {
  return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] ?? `${n}`;
}

/// Per-language recognisers. Each returns a one-sentence summary of
/// the code block (without trailing period) when it can identify the
/// dominant declaration. Returning `null` means "I didn't recognise
/// the shape of this code" — the generic fallback in
/// `summarizeCodeBlock` then takes over.
const LANG_PATTERNS = {
  // JavaScript / TypeScript share patterns. We also catch arrow
  // functions and class/interface/type declarations.
  js: jsLikeSummary,
  javascript: jsLikeSummary,
  ts: jsLikeSummary,
  typescript: jsLikeSummary,
  jsx: jsLikeSummary,
  tsx: jsLikeSummary,
  rust: rustSummary,
  rs: rustSummary,
  go: goSummary,
  golang: goSummary,
  python: pythonSummary,
  py: pythonSummary,
  solidity: solSummary,
  sol: solSummary,
  vyper: solSummary,
  vy: solSummary,
};

function jsLikeSummary(code, langLabel) {
  // Function declaration: `function NAME(ARGS) { ... }`
  let m = /\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(([^)]*)\)/m.exec(code);
  if (m) {
    return `Consider a ${langLabel} function called ${m[1]} that takes ${paramsToSpoken(m[2])}`;
  }
  // Arrow function bound to a const: `const NAME = (ARGS) => ...`
  m = /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/m.exec(code);
  if (m) {
    return `Consider a ${langLabel} arrow function called ${m[1]} that takes ${paramsToSpoken(m[2])}`;
  }
  // Single-arg arrow: `const NAME = arg => ...`
  m = /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?([A-Za-z_$][A-Za-z0-9_$]*)\s*=>/m.exec(code);
  if (m) {
    return `Consider a ${langLabel} arrow function called ${m[1]} that takes one parameter, ${m[2]}`;
  }
  // Class: `class NAME [extends Base]`
  m = /\bclass\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:extends\s+([A-Za-z_$][A-Za-z0-9_$]*))?/m.exec(code);
  if (m) {
    return m[2]
      ? `Consider a ${langLabel} class called ${m[1]} that extends ${m[2]}`
      : `Consider a ${langLabel} class called ${m[1]}`;
  }
  // Interface / type alias.
  m = /\binterface\s+([A-Za-z_$][A-Za-z0-9_$]*)/m.exec(code);
  if (m) return `Consider a TypeScript interface called ${m[1]}`;
  m = /\btype\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/m.exec(code);
  if (m) return `Consider a TypeScript type alias called ${m[1]}`;
  // Plain const / let assignment.
  m = /\b(?:const|let)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/m.exec(code);
  if (m) return `Consider a ${langLabel} variable called ${m[1]}`;
  return null;
}

function rustSummary(code, langLabel) {
  let m = /\b(?:pub\s+)?fn\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:<[^>]*>)?\s*\(([^)]*)\)/m.exec(code);
  if (m) {
    return `Consider a ${langLabel} function called ${m[1]} that takes ${paramsToSpoken(m[2])}`;
  }
  m = /\b(?:pub\s+)?struct\s+([A-Za-z_][A-Za-z0-9_]*)/m.exec(code);
  if (m) return `Consider a ${langLabel} struct called ${m[1]}`;
  m = /\b(?:pub\s+)?enum\s+([A-Za-z_][A-Za-z0-9_]*)/m.exec(code);
  if (m) return `Consider a ${langLabel} enum called ${m[1]}`;
  m = /\b(?:pub\s+)?trait\s+([A-Za-z_][A-Za-z0-9_]*)/m.exec(code);
  if (m) return `Consider a ${langLabel} trait called ${m[1]}`;
  m = /\bimpl\s+(?:[A-Za-z_][A-Za-z0-9_]*\s+for\s+)?([A-Za-z_][A-Za-z0-9_]*)/m.exec(code);
  if (m) return `Consider a ${langLabel} impl block on ${m[1]}`;
  return null;
}

function goSummary(code, langLabel) {
  let m = /\bfunc\s+(?:\([^)]*\)\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/m.exec(code);
  if (m) {
    // Go param order is `name type`, so name-after.
    return `Consider a ${langLabel} function called ${m[1]} that takes ${paramsToSpoken(m[2], "name-after")}`;
  }
  m = /\btype\s+([A-Za-z_][A-Za-z0-9_]*)\s+struct\b/m.exec(code);
  if (m) return `Consider a ${langLabel} struct called ${m[1]}`;
  m = /\btype\s+([A-Za-z_][A-Za-z0-9_]*)\s+interface\b/m.exec(code);
  if (m) return `Consider a ${langLabel} interface called ${m[1]}`;
  m = /\btype\s+([A-Za-z_][A-Za-z0-9_]*)\s+/m.exec(code);
  if (m) return `Consider a ${langLabel} type alias called ${m[1]}`;
  return null;
}

function pythonSummary(code, langLabel) {
  let m = /\bdef\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/m.exec(code);
  if (m) {
    return `Consider a ${langLabel} function called ${m[1]} that takes ${paramsToSpoken(m[2])}`;
  }
  m = /\bclass\s+([A-Za-z_][A-Za-z0-9_]*)/m.exec(code);
  if (m) return `Consider a ${langLabel} class called ${m[1]}`;
  return null;
}

function solSummary(code, langLabel) {
  let m = /\b(?:abstract\s+)?contract\s+([A-Za-z_][A-Za-z0-9_]*)/m.exec(code);
  if (m) return `Consider a ${langLabel} contract called ${m[1]}`;
  m = /\binterface\s+([A-Za-z_][A-Za-z0-9_]*)/m.exec(code);
  if (m) return `Consider a ${langLabel} interface called ${m[1]}`;
  m = /\blibrary\s+([A-Za-z_][A-Za-z0-9_]*)/m.exec(code);
  if (m) return `Consider a ${langLabel} library called ${m[1]}`;
  m = /\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/m.exec(code);
  if (m) {
    return `Consider a ${langLabel} function called ${m[1]} that takes ${paramsToSpoken(m[2])}`;
  }
  m = /\bstruct\s+([A-Za-z_][A-Za-z0-9_]*)/m.exec(code);
  if (m) return `Consider a ${langLabel} struct called ${m[1]}`;
  m = /\benum\s+([A-Za-z_][A-Za-z0-9_]*)/m.exec(code);
  if (m) return `Consider a ${langLabel} enum called ${m[1]}`;
  return null;
}

/// Generic fallback when no recogniser matches. We still want to
/// avoid silence — a short cue + line count gives the listener
/// enough context to know "okay there was an example here, but I
/// don't need to picture every line of it".
function genericCueForCode(code, langLabel) {
  const lines = code
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("//") && !l.startsWith("#")).length;
  if (lines <= 1) return `Here's a short ${langLabel} example`;
  if (lines <= 5) return `Here's a brief ${langLabel} example, about ${lines} lines`;
  return `Here's a longer ${langLabel} example, around ${Math.round(lines / 5) * 5} lines`;
}

/// Public: turn a single fenced code block into spoken-friendly
/// prose. Used by the markdown → speech pass below. Always returns
/// a non-empty sentence (never raw code).
export function summarizeCodeBlock(language, code) {
  const tag = (language || "").toLowerCase().trim();
  const langLabel = LANG_LABEL[tag] ?? (tag || "code");
  const recogniser = LANG_PATTERNS[tag];
  const summary = recogniser ? recogniser(code, langLabel) : null;
  return summary ?? genericCueForCode(code, langLabel);
}

/// Markdown formatting characters we strip in-place. Order matters —
/// triple-asterisks before single, link/image syntax before bare
/// brackets.
function stripFormatting(s) {
  return (
    s
      // Images: ![alt](url) → alt
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Links: [text](url) → text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Reference links: [text][id] → text
      .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
      // Bold + italic combinations.
      .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
      .replace(/___(.+?)___/g, "$1")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1")
      // Italic via underscore: `_word_`. Anchor to non-word
      // boundaries on both sides so we don't shred identifiers
      // like `my_var_name` (which would otherwise match
      // `_var_` and produce `myvarname`). The polish pass
      // converts any LEFTOVER intra-word underscores into
      // spaces so identifiers read as "my var name".
      .replace(/(?<![\w_])_([^_\n]+)_(?![\w_])/g, "$1")
      // Strikethrough.
      .replace(/~~(.+?)~~/g, "$1")
      // Headings: drop the leading hashes, keep the text.
      .replace(/^#{1,6}\s+/gm, "")
      // Blockquote markers at line start.
      .replace(/^>\s?/gm, "")
      // Horizontal rules.
      .replace(/^-{3,}$/gm, "")
      .replace(/^\*{3,}$/gm, "")
      // List bullets and numbered items: keep the content, drop the
      // marker. Numbered items in the middle of a list read better
      // with the "First, ... Second, ..." cadence the prose author
      // already wrote, vs. having the TTS recite "1. 2. 3.".
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      // Tables: drop the pipe characters and alignment rows.
      .replace(/^\|.*\|$/gm, (line) =>
        line.replace(/^\||\|$/g, "").replace(/\|/g, ", "),
      )
      .replace(/^[-:|\s]+$/gm, "")
  );
}

/// Public entry point. Pass the lesson's `body` (markdown string),
/// receive a string optimized for ElevenLabs / OpenAI TTS playback.
export function markdownToSpokenText(markdown) {
  if (!markdown || typeof markdown !== "string") return "";

  let text = markdown;

  // 1) Replace fenced code blocks with a NATURAL-LANGUAGE summary
  //    of what the block contains ("Consider a JavaScript function
  //    called add that takes two parameters: a and b") rather than
  //    leaving raw code or a sterile "code example" cue. The
  //    summarizer ignores comment-only fences and emits a friendly
  //    fallback for unparseable code. Critical to do BEFORE
  //    `stripFormatting` so the inner backticks don't leak.
  text = text.replace(FENCED_BLOCK_RE, (_match, _fence, lang, body) => {
    const summary = summarizeCodeBlock(lang, body);
    // Sentence-final period + leading/trailing pause so the cue
    // reads as a discrete narrator aside, not a continuation of
    // the prior paragraph.
    return ` ${summary}. `;
  });

  // 2) Strip markdown formatting chrome (headings, bold, lists, links).
  text = stripFormatting(text);

  // 3) Inline `code` → bare code (drop the backticks; the words
  //    inside usually read fine, e.g. `chain.send()`).
  text = text.replace(INLINE_CODE_RE, "$1");

  // 4) Symbol replacements (math, arrows, dashes).
  for (const [re, repl] of SYMBOL_REPLACEMENTS) {
    text = text.replace(re, repl);
  }

  // 5) Abbreviation expansions.
  for (const [re, repl] of ABBREVIATIONS) {
    text = text.replace(re, repl);
  }

  // 6) Final polish — kill any formatting characters that survived
  //    the structural strip above. These come up in two ways:
  //    (a) literal occurrences in prose ("rate it 5/5*"), and
  //    (b) edge-case markdown the regexes above didn't anchor to
  //        (e.g. an asterisk at the start of a sentence with no
  //        closing pair). Either way, the TTS reads them aloud
  //        ("asterisk", "backtick") which kills the audiobook
  //        feel — strip them defensively.
  text = stripStrayFormattingChars(text);

  // 7) Collapse whitespace runs. Two newlines stay (paragraph break);
  //    everything else collapses to a single space.
  text = text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "");

  return text;
}

/// Defensive last-pass cleanup. Every character class here would
/// otherwise be read by ElevenLabs / OpenAI TTS as its literal name
/// ("asterisk", "backtick", "underscore", "tilde", "pound sign"),
/// turning carefully-narrated prose into a punctuation pronunciation
/// recital. We strip when:
///   - the character has no spoken-text meaning at the position it
///     appears (e.g. a stray asterisk that wasn't half of a bold
///     pair), or
///   - keeping it would interrupt a word (an underscore between
///     letters becomes a space so `chain_state` reads as "chain
///     state" rather than "chain underscore state" or the run-on
///     "chainstate").
///
/// Scoped narrowly: we never strip characters that DO have spoken
/// meaning in prose (commas, periods, parens, question marks).
function stripStrayFormattingChars(text) {
  return (
    text
      // Backticks of any flavour — should be impossible after the
      // inline + fenced passes above, but defended anyway. The TTS
      // reads stray backticks as "backtick" or sometimes silent;
      // either way we don't want them.
      .replace(/[`´]+/g, "")
      // Stray asterisks (not paired into bold/italic). The strip
      // pass above only removes paired markers; orphans like
      // `* important` or `5/5*` slip through. Replace with a soft
      // space so we don't run adjacent words together.
      .replace(/\*+/g, " ")
      // Underscores between word characters → space (`my_var` →
      // "my var"). Lone underscores at word boundaries → strip.
      // The lookarounds keep us from touching identifiers we
      // already handed off in code summaries.
      .replace(/(\w)_+(\w)/g, "$1 $2")
      .replace(/_+/g, " ")
      // Stray tildes. `~~strike~~` is gone by now; what's left is
      // approx-equals as ASCII (`~=`) or just typos. Drop them
      // rather than have the TTS say "tilde tilde".
      .replace(/~+/g, "")
      // Stray pipes — table cells were converted to commas above
      // but a literal `|` in prose ("a | b | c" pseudo-syntax) reads
      // poorly. Convert each pipe between word characters to " or ",
      // chaining (the lookahead doesn't consume the trailing word
      // char, so multiple adjacent pipes all get rewritten).
      .replace(/(\w)\s*\|\s*(?=\w)/g, "$1 or ")
      .replace(/\|+/g, "")
      // Stray hash signs that escaped the heading strip ("#hashtag",
      // `#define`-style references in prose, etc). TTS pronounces
      // them as "pound" or "hash" — usually wrong. Drop unless it
      // looks like part of a hex literal we want preserved.
      .replace(/(?<![0-9a-fA-F])#+/g, "")
      // Stray angle brackets — XML-flavoured prose ("<note>") or
      // generics that survived the type-alias strip. TTS reads them
      // as "less than" / "greater than", which is rarely right.
      .replace(/<\s*/g, "")
      .replace(/\s*>/g, "")
      // Caret used as exponent ("2^32"). Spell it out.
      .replace(/(\d)\^(\d)/g, "$1 to the $2")
      // Stray carets elsewhere → strip.
      .replace(/\^/g, "")
      // Stray colons immediately followed by closing punctuation —
      // often the residue of a stripped link target ("see :"). Drop.
      .replace(/:\s*([,.;!?])/g, "$1")
  );
}

/// Split spoken text into chunks small enough to safely send to
/// ElevenLabs in a single request. The free + Creator tiers cap at
/// ~2500 chars / request; Pro+ allows ~5000. We default to 2500 to
/// stay portable across plans, splitting on paragraph breaks first
/// then sentences if a paragraph is itself too long.
///
/// Returns an array of chunks. Empty input → empty array. Caller is
/// responsible for synthesizing each chunk and concatenating the
/// resulting MP3 buffers (MP3 is splice-safe; you can `Buffer.concat`
/// the bytes and the result plays as one continuous track).
export function chunkForSynthesis(text, maxChars = 2500) {
  if (!text) return [];
  const out = [];
  let buf = "";
  for (const para of text.split(/\n{2,}/)) {
    if (buf.length + para.length + 2 <= maxChars) {
      buf = buf ? `${buf}\n\n${para}` : para;
      continue;
    }
    if (buf) {
      out.push(buf);
      buf = "";
    }
    if (para.length <= maxChars) {
      buf = para;
      continue;
    }
    // Paragraph itself too long — split on sentence boundaries.
    let sentBuf = "";
    for (const sent of para.split(/(?<=[.!?])\s+/)) {
      if (sentBuf.length + sent.length + 1 <= maxChars) {
        sentBuf = sentBuf ? `${sentBuf} ${sent}` : sent;
      } else {
        if (sentBuf) out.push(sentBuf);
        sentBuf = sent.length > maxChars ? sent.slice(0, maxChars) : sent;
      }
    }
    if (sentBuf) buf = sentBuf;
  }
  if (buf) out.push(buf);
  return out;
}
