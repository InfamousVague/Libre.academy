/// Browser-side spoken-text preprocessor. Used by the
/// `useLessonAudioFallback` hook to convert lesson markdown into
/// something the Web Speech API can read aloud without spelling out
/// every backtick + asterisk.
///
/// Lighter than the full Node-side `scripts/spoken-text.mjs` (which
/// also generates per-language code-block summaries for ElevenLabs):
/// this module only does the formatting strip + abbreviation
/// expansions that affect intelligibility. Code blocks reduce to a
/// brief "(code block)" cue — the listener knows something was
/// skipped without the engine reciting every symbol. Acceptable
/// tradeoff for a fallback path; the canonical narration generator
/// still produces the polished prose when budget allows.

const ABBREVIATIONS: Array<[RegExp, string]> = [
  // Latin abbrevs that read terribly when spelled out letter-by-letter.
  [/\be\.g\./gi, "for example"],
  [/\bi\.e\./gi, "that is"],
  [/\betc\./gi, "et cetera"],
  [/\bcf\./gi, "compare"],
  [/\bvs\.?/gi, "versus"],
  // Common dev acronyms that engines mispronounce as words. Spell out.
  [/\bAPI\b/g, "A P I"],
  [/\bCLI\b/g, "C L I"],
  [/\bGPU\b/g, "G P U"],
  [/\bCPU\b/g, "C P U"],
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
  // Crypto-course identifiers — read repeatedly across the
  // Mastering Bitcoin / Ethereum books. TTS engines default to
  // mispronouncing these; the canonical reading is letter-by-letter.
  [/\bP2PKH\b/gi, "P 2 P K H"],
  [/\bP2SH\b/gi, "P 2 S H"],
  [/\bP2WPKH\b/gi, "P 2 W P K H"],
  [/\bP2WSH\b/gi, "P 2 W S H"],
  [/\bP2TR\b/gi, "P 2 T R"],
  [/\bSPV\b/g, "S P V"],
  [/\bUTXO\b/gi, "U T X O"],
  [/\bEVM\b/g, "E V M"],
  [/\bABI\b/g, "A B I"],
  [/\bRPC\b/g, "R P C"],
];

const SYMBOLS: Array<[RegExp, string]> = [
  // Arrow glyphs read as "right arrow" / "left arrow" instead of
  // letter-by-letter spelling of the dashes.
  [/->/g, " right arrow "],
  [/<-/g, " left arrow "],
  [/=>/g, " arrow "],
  // Pipe / ampersand inside prose: spell out so the listener doesn't
  // get a confused "ampersand" or silent pipe.
  [/\s&\s/g, " and "],
  // Repeated dashes used as separators read as a long "minus minus".
  [/—/g, ", "],
  [/–/g, ", "],
];

/// Strip markdown formatting tokens that read aloud as noise.
/// Conservative: keeps the text content, just drops the markup
/// glyphs. Code blocks are replaced with a brief audible cue so the
/// listener knows something was skipped rather than hearing every
/// symbol read out.
function stripMarkdown(md: string): string {
  return (
    md
      // Fenced code blocks — replace with a short cue. The fence is
      // any of ``` or ~~~ with optional language tag.
      .replace(/(```|~~~)[\w]*\n[\s\S]*?\n\1/g, " (code block) ")
      // Inline `code` — drop the backticks but keep the content.
      .replace(/`([^`\n]+)`/g, "$1")
      // ATX heading marks at line start.
      .replace(/^#{1,6}\s+/gm, "")
      // Setext heading underlines (=== / ---) collapse to nothing —
      // the heading text on the prior line is already plain.
      .replace(/^[=-]{2,}\s*$/gm, "")
      // Bold / italics — drop emphasis markers, keep content.
      .replace(/\*\*([^*\n]+)\*\*/g, "$1")
      .replace(/\*([^*\n]+)\*/g, "$1")
      .replace(/__([^_\n]+)__/g, "$1")
      .replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, "$1")
      // Strikethrough.
      .replace(/~~([^~\n]+)~~/g, "$1")
      // Markdown links: `[label](url)` → `label`. Images drop entirely.
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Reference-style links + autolinks.
      .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
      .replace(/<https?:\/\/[^>]+>/g, "")
      // Blockquote markers.
      .replace(/^>\s?/gm, "")
      // Horizontal rules.
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // List bullets / numbers. Keep the content, drop the marker so
      // the engine doesn't read "asterisk" or "hyphen" before each item.
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      // HTML tags — strip but keep inner text. Conservative regex:
      // just removes the `<tag>` and `</tag>` shells, content survives.
      .replace(/<\/?[a-z][^>]*>/gi, "")
      // Collapse any 3+ newlines to 2 so paragraph breaks survive but
      // huge gaps don't pause the engine awkwardly.
      .replace(/\n{3,}/g, "\n\n")
  );
}

/// Convert lesson markdown to a TTS-ready string. Composes:
///   1. Markdown formatting strip (above).
///   2. Abbreviation expansions (e.g. → "for example", JSON → "Jay-Sahn").
///   3. Symbol replacements (-> → "right arrow").
///
/// Pure function, no IO. Idempotent — running it twice on already-
/// processed text produces the same output, since the patterns no
/// longer match plain prose.
export function markdownToSpokenText(markdown: string): string {
  let out = stripMarkdown(markdown);
  for (const [pattern, replacement] of ABBREVIATIONS) {
    out = out.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of SYMBOLS) {
    out = out.replace(pattern, replacement);
  }
  // Squeeze runs of horizontal whitespace.
  out = out.replace(/[ \t]{2,}/g, " ");
  return out.trim();
}

/// Split spoken text into sub-`maxChars` chunks suitable for queuing
/// into `SpeechSynthesisUtterance`s. Some engines (notably Chrome)
/// hit a soft cap around 32 KB per utterance and silently truncate;
/// chunking around paragraph and sentence boundaries keeps each
/// utterance well under that and gives the listener natural pause
/// points between chunks.
export function chunkForSynthesis(text: string, maxChars = 1800): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  // First pass: split on blank-line paragraph breaks. Each paragraph
  // is usually under maxChars; if one isn't we'll re-split it below.
  const paragraphs = text.split(/\n{2,}/);
  let buf = "";
  const flush = () => {
    const t = buf.trim();
    if (t) chunks.push(t);
    buf = "";
  };
  for (const para of paragraphs) {
    if (para.length > maxChars) {
      // Oversized paragraph — split on sentence boundaries. Keeps
      // the terminal punctuation attached to the preceding sentence.
      flush();
      const sentences = para.split(/(?<=[.!?])\s+/);
      for (const s of sentences) {
        if (buf.length + s.length + 1 > maxChars) flush();
        buf = buf ? `${buf} ${s}` : s;
      }
      flush();
      continue;
    }
    if (buf.length + para.length + 2 > maxChars) flush();
    buf = buf ? `${buf}\n\n${para}` : para;
  }
  flush();
  return chunks.length > 0 ? chunks : [text];
}
