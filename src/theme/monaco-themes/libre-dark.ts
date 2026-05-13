/// Auto-split from the original `src/theme/monaco-themes.ts` monolith.
/// See `scripts/split-monaco-themes.mjs` for the splitter. Each Monaco
/// theme gets its own file; `./index.ts` registers them with Monaco.

import type { editor } from "monaco-editor";

// ---- Libre Dark ------------------------------------------------------------
// The default Libre theme rendered in Monaco. Stays true to the "monochrome
// glass" brief — 95% grayscale with one subtle warm amber accent reserved
// for literals (strings / numbers / regex) so code is still scannable. Base
// colors map 1:1 to tokens.css so the editor background is literally the
// same hex as the app's `--color-bg-primary`.
export const LIBRE_DARK: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "50505a", fontStyle: "italic" },
    { token: "keyword", foreground: "fafafa", fontStyle: "bold" },
    { token: "keyword.control", foreground: "fafafa", fontStyle: "bold" },
    { token: "string", foreground: "c8aa7e" },
    { token: "string.escape", foreground: "e9cfa0" },
    { token: "number", foreground: "c8aa7e" },
    { token: "regexp", foreground: "c8aa7e" },
    { token: "type", foreground: "e9e9ee", fontStyle: "bold" },
    { token: "type.identifier", foreground: "e9e9ee", fontStyle: "bold" },
    { token: "identifier", foreground: "fafafa" },
    { token: "delimiter", foreground: "70707c" },
    { token: "operator", foreground: "9b9ba7" },
    { token: "tag", foreground: "fafafa", fontStyle: "bold" },
    { token: "attribute.name", foreground: "e9e9ee" },
    { token: "attribute.value", foreground: "c8aa7e" },
    { token: "function", foreground: "fafafa" },
    { token: "variable", foreground: "fafafa" },
    { token: "variable.parameter", foreground: "9b9ba7" },
    { token: "constant", foreground: "c8aa7e" },
    { token: "constant.language", foreground: "fafafa", fontStyle: "bold" },
  ],
  colors: {
    "editor.background": "#0f0f0f80",
    "editor.foreground": "#fafafa",
    "editor.lineHighlightBackground": "#111113",
    "editor.lineHighlightBorder": "#111113",
    "editor.selectionBackground": "#2a2a30",
    "editor.inactiveSelectionBackground": "#1e1e22",
    "editorCursor.foreground": "#fafafa",
    "editorLineNumber.foreground": "#3e3e44",
    "editorLineNumber.activeForeground": "#9b9ba7",
    "editorIndentGuide.background": "#19191d",
    "editorIndentGuide.activeBackground": "#3e3e44",
    "editorBracketMatch.background": "#19191d",
    "editorBracketMatch.border": "#70707c",
    "editorGutter.background": "#0f0f0f80",
    "editorWidget.background": "#111113",
    "editorWidget.border": "#1e1e22",
    "editorSuggestWidget.background": "#111113",
    "editorSuggestWidget.selectedBackground": "#19191d",
    "scrollbarSlider.background": "#ffffff10",
    "scrollbarSlider.hoverBackground": "#ffffff1f",
    "scrollbarSlider.activeBackground": "#ffffff33",
    // Kill Monaco's default 1px blue focus glow (vs-dark base
    // ships `focusBorder: "#007fd4"`). The new 2px black frame
    // on `.libre-editor-host` in the default-dark theme is the
    // active-editor signal now — the blue overlay competed with
    // it and read as a stray accent against the otherwise
    // monochrome palette. Fully-transparent hex (`#00000000`)
    // because Monaco interprets the value as a colour rather
    // than honouring `transparent`.
    "focusBorder": "#00000000",
  },
};
