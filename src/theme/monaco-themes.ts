/// Monaco editor theme definitions that match the app-chrome themes in
/// themes.ts. These are registered once on Monaco mount via
/// `monaco.editor.defineTheme(name, data)`. Token rules approximate the
/// upstream VSCode themes — feel free to tune.
///
/// Naming convention: "fishbones-<theme-id>" so we don't collide with Monaco's
/// built-in "vs" / "vs-dark" / "hc-black".
import type { editor } from "monaco-editor";
import type { ThemeName } from "./themes";

export type MonacoThemeName =
  | "vs"
  | "vs-dark"
  | "fishbones-dark"
  | "fishbones-light"
  | "fishbones-synthwave"
  | "fishbones-claude-code-dark"
  | "fishbones-ayu-light"
  | "fishbones-ayu-mirage"
  | "fishbones-ayu-dark"
  | "fishbones-catppuccin-latte"
  | "fishbones-catppuccin-frappe"
  | "fishbones-catppuccin-macchiato"
  | "fishbones-catppuccin-mocha";

/// Map each app theme to the Monaco theme name we want the editor to load.
/// The two defaults use Monaco's built-ins (no need to redefine). The custom
/// themes have their own palettes below.
export const MONACO_THEME_BY_APP_THEME: Record<ThemeName, MonacoThemeName> = {
  "default-dark": "fishbones-dark",
  "default-light": "fishbones-light",
  synthwave: "fishbones-synthwave",
  "claude-code-dark": "fishbones-claude-code-dark",
  "ayu-light": "fishbones-ayu-light",
  "ayu-mirage": "fishbones-ayu-mirage",
  "ayu-dark": "fishbones-ayu-dark",
  "catppuccin-latte": "fishbones-catppuccin-latte",
  "catppuccin-frappe": "fishbones-catppuccin-frappe",
  "catppuccin-macchiato": "fishbones-catppuccin-macchiato",
  "catppuccin-mocha": "fishbones-catppuccin-mocha",
};

// ---- Fishbones Dark ------------------------------------------------------------
// The default Fishbones theme rendered in Monaco. Stays true to the "monochrome
// glass" brief — 95% grayscale with one subtle warm amber accent reserved
// for literals (strings / numbers / regex) so code is still scannable. Base
// colors map 1:1 to tokens.css so the editor background is literally the
// same hex as the app's `--color-bg-primary`.
const KATA_DARK: editor.IStandaloneThemeData = {
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
    "editor.background": "#09090b",
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
    "editorGutter.background": "#09090b",
    "editorWidget.background": "#111113",
    "editorWidget.border": "#1e1e22",
    "editorSuggestWidget.background": "#111113",
    "editorSuggestWidget.selectedBackground": "#19191d",
    "scrollbarSlider.background": "#ffffff10",
    "scrollbarSlider.hoverBackground": "#ffffff1f",
    "scrollbarSlider.activeBackground": "#ffffff33",
  },
};

// ---- Fishbones Light -----------------------------------------------------------
// The default light variant. Same monochrome aesthetic inverted — near-black
// primary on a white canvas with a warmer amber for literals (darkened so it
// stays readable on light bg).
const KATA_LIGHT: editor.IStandaloneThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    { token: "comment", foreground: "9b9ba7", fontStyle: "italic" },
    { token: "keyword", foreground: "09090b", fontStyle: "bold" },
    { token: "keyword.control", foreground: "09090b", fontStyle: "bold" },
    { token: "string", foreground: "8d6e3a" },
    { token: "string.escape", foreground: "6a5028" },
    { token: "number", foreground: "8d6e3a" },
    { token: "regexp", foreground: "8d6e3a" },
    { token: "type", foreground: "09090b", fontStyle: "bold" },
    { token: "type.identifier", foreground: "09090b", fontStyle: "bold" },
    { token: "identifier", foreground: "09090b" },
    { token: "delimiter", foreground: "70707c" },
    { token: "operator", foreground: "54545c" },
    { token: "tag", foreground: "09090b", fontStyle: "bold" },
    { token: "attribute.name", foreground: "54545c" },
    { token: "attribute.value", foreground: "8d6e3a" },
    { token: "function", foreground: "09090b" },
    { token: "variable", foreground: "09090b" },
    { token: "variable.parameter", foreground: "54545c" },
    { token: "constant", foreground: "8d6e3a" },
    { token: "constant.language", foreground: "09090b", fontStyle: "bold" },
  ],
  colors: {
    "editor.background": "#ffffff",
    "editor.foreground": "#09090b",
    "editor.lineHighlightBackground": "#fafafa",
    "editor.lineHighlightBorder": "#fafafa",
    "editor.selectionBackground": "#e4e4e9",
    "editor.inactiveSelectionBackground": "#ececef",
    "editorCursor.foreground": "#09090b",
    "editorLineNumber.foreground": "#b4b4be",
    "editorLineNumber.activeForeground": "#54545c",
    "editorIndentGuide.background": "#ececef",
    "editorIndentGuide.activeBackground": "#b4b4be",
    "editorBracketMatch.background": "#ececef",
    "editorBracketMatch.border": "#70707c",
    "editorGutter.background": "#ffffff",
    "editorWidget.background": "#fafafa",
    "editorWidget.border": "#ececef",
    "editorSuggestWidget.background": "#fafafa",
    "editorSuggestWidget.selectedBackground": "#ececef",
    "scrollbarSlider.background": "#00000010",
    "scrollbarSlider.hoverBackground": "#0000001f",
    "scrollbarSlider.activeBackground": "#00000033",
  },
};

// ---- Synesthesia Synthwave ------------------------------------------------
// Hot magenta + cyan accents against deep violet. Loud — lean into it.
const SYNTHWAVE: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "8c7a98", fontStyle: "italic" },
    { token: "keyword", foreground: "ff7edb", fontStyle: "bold" },
    { token: "keyword.control", foreground: "ff7edb" },
    { token: "string", foreground: "ff8b39" },
    { token: "string.escape", foreground: "36f9f6" },
    { token: "number", foreground: "f97e72" },
    { token: "regexp", foreground: "36f9f6" },
    { token: "type", foreground: "fede5d" },
    { token: "type.identifier", foreground: "fede5d" },
    { token: "identifier", foreground: "f9f1ff" },
    { token: "delimiter", foreground: "c9a5d8" },
    { token: "operator", foreground: "ff7edb" },
    { token: "tag", foreground: "ff7edb" },
    { token: "attribute.name", foreground: "fede5d" },
    { token: "attribute.value", foreground: "ff8b39" },
    { token: "function", foreground: "36f9f6" },
    { token: "variable", foreground: "f9f1ff" },
    { token: "variable.parameter", foreground: "fe4450" },
    { token: "constant", foreground: "f97e72" },
    { token: "constant.language", foreground: "ff7edb" },
  ],
  colors: {
    "editor.background": "#1a1427",
    "editor.foreground": "#f9f1ff",
    "editor.lineHighlightBackground": "#241b2f",
    "editor.lineHighlightBorder": "#241b2f",
    "editor.selectionBackground": "#ff7edb44",
    "editor.inactiveSelectionBackground": "#ff7edb22",
    "editorCursor.foreground": "#ff7edb",
    "editorLineNumber.foreground": "#5c4768",
    "editorLineNumber.activeForeground": "#ff7edb",
    "editorIndentGuide.background": "#2a2137",
    "editorIndentGuide.activeBackground": "#4a3a5c",
    "editorBracketMatch.background": "#ff7edb33",
    "editorBracketMatch.border": "#ff7edb",
    "editorGutter.background": "#1a1427",
    "editorWidget.background": "#241b2f",
    "editorWidget.border": "#ff7edb33",
    "editorSuggestWidget.background": "#241b2f",
    "editorSuggestWidget.selectedBackground": "#ff7edb33",
    "scrollbarSlider.background": "#ff7edb22",
    "scrollbarSlider.hoverBackground": "#ff7edb44",
    "scrollbarSlider.activeBackground": "#ff7edb66",
  },
};

// ---- Claude Code Dark -----------------------------------------------------
// Warm terracotta accents against deep brown. Anthropic-flavored.
const CLAUDE_CODE_DARK: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "8a7560", fontStyle: "italic" },
    { token: "keyword", foreground: "d97757" },
    { token: "keyword.control", foreground: "e6c097" },
    { token: "string", foreground: "b5a285" },
    { token: "string.escape", foreground: "d97757" },
    { token: "number", foreground: "c49268" },
    { token: "regexp", foreground: "d97757" },
    { token: "type", foreground: "e6c097" },
    { token: "type.identifier", foreground: "e6c097" },
    { token: "identifier", foreground: "f5ebdc" },
    { token: "delimiter", foreground: "c9b299" },
    { token: "operator", foreground: "d97757" },
    { token: "tag", foreground: "d97757" },
    { token: "attribute.name", foreground: "e6c097" },
    { token: "attribute.value", foreground: "b5a285" },
    { token: "function", foreground: "e8a978" },
    { token: "variable", foreground: "f5ebdc" },
    { token: "variable.parameter", foreground: "c9b299" },
    { token: "constant", foreground: "c49268" },
    { token: "constant.language", foreground: "d97757" },
  ],
  colors: {
    "editor.background": "#14110d",
    "editor.foreground": "#f5ebdc",
    "editor.lineHighlightBackground": "#1c1814",
    "editor.lineHighlightBorder": "#1c1814",
    "editor.selectionBackground": "#d9775744",
    "editor.inactiveSelectionBackground": "#d9775722",
    "editorCursor.foreground": "#d97757",
    "editorLineNumber.foreground": "#5a4a3a",
    "editorLineNumber.activeForeground": "#d97757",
    "editorIndentGuide.background": "#241f18",
    "editorIndentGuide.activeBackground": "#3e3428",
    "editorBracketMatch.background": "#d9775733",
    "editorBracketMatch.border": "#d97757",
    "editorGutter.background": "#14110d",
    "editorWidget.background": "#1c1814",
    "editorWidget.border": "#d9775733",
    "editorSuggestWidget.background": "#1c1814",
    "editorSuggestWidget.selectedBackground": "#d9775733",
    "scrollbarSlider.background": "#d9775722",
    "scrollbarSlider.hoverBackground": "#d9775744",
    "scrollbarSlider.activeBackground": "#d9775766",
  },
};

// ---- Ayu Mirage -----------------------------------------------------------
// Ported from ayu-theme/vscode-ayu. Mirage's signature is warm orange
// (#FFA759) for keywords over the dusty #1F2430 base, with soft teal-cyan
// (#95E6CB) punctuation and a green (#BAE67E) for strings.
const AYU_MIRAGE: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "5c6773", fontStyle: "italic" },
    { token: "keyword", foreground: "ffa759" },
    { token: "keyword.control", foreground: "ffa759" },
    { token: "string", foreground: "bae67e" },
    { token: "string.escape", foreground: "95e6cb" },
    { token: "number", foreground: "d4bfff" },
    { token: "regexp", foreground: "95e6cb" },
    { token: "type", foreground: "73d0ff" },
    { token: "type.identifier", foreground: "73d0ff" },
    { token: "identifier", foreground: "cbccc6" },
    { token: "delimiter", foreground: "95e6cb" },
    { token: "operator", foreground: "f29e74" },
    { token: "tag", foreground: "5ccfe6" },
    { token: "attribute.name", foreground: "ffd580" },
    { token: "attribute.value", foreground: "bae67e" },
    { token: "function", foreground: "ffd580" },
    { token: "variable", foreground: "cbccc6" },
    { token: "variable.parameter", foreground: "ffd580" },
    { token: "constant", foreground: "d4bfff" },
    { token: "constant.language", foreground: "5ccfe6" },
  ],
  colors: {
    "editor.background": "#1f2430",
    "editor.foreground": "#cbccc6",
    "editor.lineHighlightBackground": "#191e2a",
    "editor.lineHighlightBorder": "#191e2a",
    "editor.selectionBackground": "#33415580",
    "editor.inactiveSelectionBackground": "#33415540",
    "editorCursor.foreground": "#ffcc66",
    "editorLineNumber.foreground": "#3d4658",
    "editorLineNumber.activeForeground": "#8a9199",
    "editorIndentGuide.background": "#2d3340",
    "editorIndentGuide.activeBackground": "#4b5262",
    "editorBracketMatch.background": "#33415555",
    "editorBracketMatch.border": "#ffcc66",
    "editorGutter.background": "#1f2430",
    "editorWidget.background": "#191e2a",
    "editorWidget.border": "#2d3340",
    "editorSuggestWidget.background": "#191e2a",
    "editorSuggestWidget.selectedBackground": "#33415580",
    "scrollbarSlider.background": "#8a919930",
    "scrollbarSlider.hoverBackground": "#8a919950",
    "scrollbarSlider.activeBackground": "#8a919970",
  },
};

// ---- Catppuccin Mocha ----------------------------------------------------
// Ported from catppuccin/vscode (Mocha flavor). Canonical palette naming
// where tokens reference the theme's "named" colors (mauve/lavender/peach
// /etc). Catppuccin is designed to be soothing — all colors are pastel,
// no harsh contrasts. See https://github.com/catppuccin/catppuccin.
const CATPPUCCIN_MOCHA: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "6c7086", fontStyle: "italic" }, // overlay0
    { token: "keyword", foreground: "cba6f7" }, // mauve
    { token: "keyword.control", foreground: "cba6f7" },
    { token: "string", foreground: "a6e3a1" }, // green
    { token: "string.escape", foreground: "f5c2e7" }, // pink
    { token: "number", foreground: "fab387" }, // peach
    { token: "regexp", foreground: "f5c2e7" },
    { token: "type", foreground: "f9e2af" }, // yellow
    { token: "type.identifier", foreground: "f9e2af" },
    { token: "identifier", foreground: "cdd6f4" }, // text
    { token: "delimiter", foreground: "89dceb" }, // sky
    { token: "operator", foreground: "89dceb" },
    { token: "tag", foreground: "cba6f7" },
    { token: "attribute.name", foreground: "94e2d5" }, // teal
    { token: "attribute.value", foreground: "a6e3a1" },
    { token: "function", foreground: "89b4fa" }, // blue
    { token: "variable", foreground: "cdd6f4" },
    { token: "variable.parameter", foreground: "eba0ac" }, // maroon
    { token: "constant", foreground: "fab387" },
    { token: "constant.language", foreground: "fab387" },
  ],
  colors: {
    "editor.background": "#1e1e2e",      // base
    "editor.foreground": "#cdd6f4",      // text
    "editor.lineHighlightBackground": "#181825", // mantle
    "editor.lineHighlightBorder": "#181825",
    "editor.selectionBackground": "#585b7055",   // surface2 at ~35%
    "editor.inactiveSelectionBackground": "#45475a55",
    "editorCursor.foreground": "#f5e0dc",        // rosewater
    "editorLineNumber.foreground": "#45475a",    // surface1
    "editorLineNumber.activeForeground": "#cdd6f4",
    "editorIndentGuide.background": "#313244",   // surface0
    "editorIndentGuide.activeBackground": "#585b70",
    "editorBracketMatch.background": "#45475a77",
    "editorBracketMatch.border": "#89b4fa",
    "editorGutter.background": "#1e1e2e",
    "editorWidget.background": "#181825",
    "editorWidget.border": "#313244",
    "editorSuggestWidget.background": "#181825",
    "editorSuggestWidget.selectedBackground": "#313244",
    "scrollbarSlider.background": "#585b7040",
    "scrollbarSlider.hoverBackground": "#585b7060",
    "scrollbarSlider.activeBackground": "#585b7080",
  },
};

// ---- Ayu Light ------------------------------------------------------------
const AYU_LIGHT: editor.IStandaloneThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    { token: "comment", foreground: "abb0b6", fontStyle: "italic" },
    { token: "keyword", foreground: "fa8d3e" },
    { token: "keyword.control", foreground: "fa8d3e" },
    { token: "string", foreground: "86b300" },
    { token: "string.escape", foreground: "4cbf99" },
    { token: "number", foreground: "a37acc" },
    { token: "regexp", foreground: "4cbf99" },
    { token: "type", foreground: "399ee6" },
    { token: "type.identifier", foreground: "399ee6" },
    { token: "identifier", foreground: "5c6166" },
    { token: "delimiter", foreground: "ed9366" },
    { token: "operator", foreground: "ed9366" },
    { token: "tag", foreground: "55b4d4" },
    { token: "attribute.name", foreground: "f2ae49" },
    { token: "attribute.value", foreground: "86b300" },
    { token: "function", foreground: "f2ae49" },
    { token: "variable", foreground: "5c6166" },
    { token: "variable.parameter", foreground: "f2ae49" },
    { token: "constant", foreground: "a37acc" },
    { token: "constant.language", foreground: "fa8d3e" },
  ],
  colors: {
    "editor.background": "#fcfcfc",
    "editor.foreground": "#5c6166",
    "editor.lineHighlightBackground": "#f2f2f2",
    "editor.lineHighlightBorder": "#f2f2f2",
    "editor.selectionBackground": "#036dd626",
    "editor.inactiveSelectionBackground": "#036dd611",
    "editorCursor.foreground": "#fa8d3e",
    "editorLineNumber.foreground": "#d0d0d0",
    "editorLineNumber.activeForeground": "#8a9199",
    "editorIndentGuide.background": "#efefef",
    "editorIndentGuide.activeBackground": "#d6d6d6",
    "editorBracketMatch.background": "#036dd626",
    "editorBracketMatch.border": "#55b4d4",
    "editorGutter.background": "#fcfcfc",
    "editorWidget.background": "#fafafa",
    "editorWidget.border": "#e7ebed",
    "editorSuggestWidget.background": "#fafafa",
    "editorSuggestWidget.selectedBackground": "#f0f0f0",
    "scrollbarSlider.background": "#8a919922",
    "scrollbarSlider.hoverBackground": "#8a919944",
    "scrollbarSlider.activeBackground": "#8a919966",
  },
};

// ---- Ayu Dark -------------------------------------------------------------
const AYU_DARK: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "acb6bf8c", fontStyle: "italic" },
    { token: "keyword", foreground: "ff8f40" },
    { token: "keyword.control", foreground: "ff8f40" },
    { token: "string", foreground: "aad94c" },
    { token: "string.escape", foreground: "95e6cb" },
    { token: "number", foreground: "d2a6ff" },
    { token: "regexp", foreground: "95e6cb" },
    { token: "type", foreground: "59c2ff" },
    { token: "type.identifier", foreground: "59c2ff" },
    { token: "identifier", foreground: "bfbdb6" },
    { token: "delimiter", foreground: "f29668" },
    { token: "operator", foreground: "f29668" },
    { token: "tag", foreground: "39bae6" },
    { token: "attribute.name", foreground: "ffb454" },
    { token: "attribute.value", foreground: "aad94c" },
    { token: "function", foreground: "ffb454" },
    { token: "variable", foreground: "bfbdb6" },
    { token: "variable.parameter", foreground: "ffb454" },
    { token: "constant", foreground: "d2a6ff" },
    { token: "constant.language", foreground: "39bae6" },
  ],
  colors: {
    "editor.background": "#0b0e14",
    "editor.foreground": "#bfbdb6",
    "editor.lineHighlightBackground": "#131721",
    "editor.lineHighlightBorder": "#131721",
    "editor.selectionBackground": "#409fff4d",
    "editor.inactiveSelectionBackground": "#409fff22",
    "editorCursor.foreground": "#e6b450",
    "editorLineNumber.foreground": "#2d3640",
    "editorLineNumber.activeForeground": "#787b80",
    "editorIndentGuide.background": "#1b212a",
    "editorIndentGuide.activeBackground": "#2d3640",
    "editorBracketMatch.background": "#409fff22",
    "editorBracketMatch.border": "#e6b450",
    "editorGutter.background": "#0b0e14",
    "editorWidget.background": "#0d1017",
    "editorWidget.border": "#1b212a",
    "editorSuggestWidget.background": "#0d1017",
    "editorSuggestWidget.selectedBackground": "#151a22",
    "scrollbarSlider.background": "#bfbdb622",
    "scrollbarSlider.hoverBackground": "#bfbdb644",
    "scrollbarSlider.activeBackground": "#bfbdb666",
  },
};

// ---- Catppuccin Latte (light) --------------------------------------------
const CATPPUCCIN_LATTE: editor.IStandaloneThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    { token: "comment", foreground: "9ca0b0", fontStyle: "italic" },
    { token: "keyword", foreground: "8839ef" },
    { token: "keyword.control", foreground: "8839ef" },
    { token: "string", foreground: "40a02b" },
    { token: "string.escape", foreground: "ea76cb" },
    { token: "number", foreground: "fe640b" },
    { token: "regexp", foreground: "ea76cb" },
    { token: "type", foreground: "df8e1d" },
    { token: "type.identifier", foreground: "df8e1d" },
    { token: "identifier", foreground: "4c4f69" },
    { token: "delimiter", foreground: "04a5e5" },
    { token: "operator", foreground: "04a5e5" },
    { token: "tag", foreground: "8839ef" },
    { token: "attribute.name", foreground: "179299" },
    { token: "attribute.value", foreground: "40a02b" },
    { token: "function", foreground: "1e66f5" },
    { token: "variable", foreground: "4c4f69" },
    { token: "variable.parameter", foreground: "e64553" },
    { token: "constant", foreground: "fe640b" },
    { token: "constant.language", foreground: "fe640b" },
  ],
  colors: {
    "editor.background": "#eff1f5",
    "editor.foreground": "#4c4f69",
    "editor.lineHighlightBackground": "#e6e9ef",
    "editor.lineHighlightBorder": "#e6e9ef",
    "editor.selectionBackground": "#acb0be55",
    "editor.inactiveSelectionBackground": "#acb0be33",
    "editorCursor.foreground": "#dc8a78",
    "editorLineNumber.foreground": "#9ca0b0",
    "editorLineNumber.activeForeground": "#4c4f69",
    "editorIndentGuide.background": "#ccd0da",
    "editorIndentGuide.activeBackground": "#acb0be",
    "editorBracketMatch.background": "#acb0be55",
    "editorBracketMatch.border": "#1e66f5",
    "editorGutter.background": "#eff1f5",
    "editorWidget.background": "#e6e9ef",
    "editorWidget.border": "#ccd0da",
    "editorSuggestWidget.background": "#e6e9ef",
    "editorSuggestWidget.selectedBackground": "#ccd0da",
    "scrollbarSlider.background": "#acb0be55",
    "scrollbarSlider.hoverBackground": "#acb0be77",
    "scrollbarSlider.activeBackground": "#acb0be99",
  },
};

// ---- Catppuccin Frappé ----------------------------------------------------
const CATPPUCCIN_FRAPPE: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "737994", fontStyle: "italic" },
    { token: "keyword", foreground: "ca9ee6" },
    { token: "keyword.control", foreground: "ca9ee6" },
    { token: "string", foreground: "a6d189" },
    { token: "string.escape", foreground: "f4b8e4" },
    { token: "number", foreground: "ef9f76" },
    { token: "regexp", foreground: "f4b8e4" },
    { token: "type", foreground: "e5c890" },
    { token: "type.identifier", foreground: "e5c890" },
    { token: "identifier", foreground: "c6d0f5" },
    { token: "delimiter", foreground: "99d1db" },
    { token: "operator", foreground: "99d1db" },
    { token: "tag", foreground: "ca9ee6" },
    { token: "attribute.name", foreground: "81c8be" },
    { token: "attribute.value", foreground: "a6d189" },
    { token: "function", foreground: "8caaee" },
    { token: "variable", foreground: "c6d0f5" },
    { token: "variable.parameter", foreground: "ea999c" },
    { token: "constant", foreground: "ef9f76" },
    { token: "constant.language", foreground: "ef9f76" },
  ],
  colors: {
    "editor.background": "#303446",
    "editor.foreground": "#c6d0f5",
    "editor.lineHighlightBackground": "#292c3c",
    "editor.lineHighlightBorder": "#292c3c",
    "editor.selectionBackground": "#626880aa",
    "editor.inactiveSelectionBackground": "#51576d66",
    "editorCursor.foreground": "#f2d5cf",
    "editorLineNumber.foreground": "#51576d",
    "editorLineNumber.activeForeground": "#c6d0f5",
    "editorIndentGuide.background": "#414559",
    "editorIndentGuide.activeBackground": "#626880",
    "editorBracketMatch.background": "#51576d77",
    "editorBracketMatch.border": "#8caaee",
    "editorGutter.background": "#303446",
    "editorWidget.background": "#292c3c",
    "editorWidget.border": "#414559",
    "editorSuggestWidget.background": "#292c3c",
    "editorSuggestWidget.selectedBackground": "#414559",
    "scrollbarSlider.background": "#51576d55",
    "scrollbarSlider.hoverBackground": "#51576d88",
    "scrollbarSlider.activeBackground": "#51576daa",
  },
};

// ---- Catppuccin Macchiato ------------------------------------------------
const CATPPUCCIN_MACCHIATO: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "6e738d", fontStyle: "italic" },
    { token: "keyword", foreground: "c6a0f6" },
    { token: "keyword.control", foreground: "c6a0f6" },
    { token: "string", foreground: "a6da95" },
    { token: "string.escape", foreground: "f5bde6" },
    { token: "number", foreground: "f5a97f" },
    { token: "regexp", foreground: "f5bde6" },
    { token: "type", foreground: "eed49f" },
    { token: "type.identifier", foreground: "eed49f" },
    { token: "identifier", foreground: "cad3f5" },
    { token: "delimiter", foreground: "91d7e3" },
    { token: "operator", foreground: "91d7e3" },
    { token: "tag", foreground: "c6a0f6" },
    { token: "attribute.name", foreground: "8bd5ca" },
    { token: "attribute.value", foreground: "a6da95" },
    { token: "function", foreground: "8aadf4" },
    { token: "variable", foreground: "cad3f5" },
    { token: "variable.parameter", foreground: "ee99a0" },
    { token: "constant", foreground: "f5a97f" },
    { token: "constant.language", foreground: "f5a97f" },
  ],
  colors: {
    "editor.background": "#24273a",
    "editor.foreground": "#cad3f5",
    "editor.lineHighlightBackground": "#1e2030",
    "editor.lineHighlightBorder": "#1e2030",
    "editor.selectionBackground": "#5b6078aa",
    "editor.inactiveSelectionBackground": "#494d6466",
    "editorCursor.foreground": "#f4dbd6",
    "editorLineNumber.foreground": "#494d64",
    "editorLineNumber.activeForeground": "#cad3f5",
    "editorIndentGuide.background": "#363a4f",
    "editorIndentGuide.activeBackground": "#5b6078",
    "editorBracketMatch.background": "#494d6477",
    "editorBracketMatch.border": "#8aadf4",
    "editorGutter.background": "#24273a",
    "editorWidget.background": "#1e2030",
    "editorWidget.border": "#363a4f",
    "editorSuggestWidget.background": "#1e2030",
    "editorSuggestWidget.selectedBackground": "#363a4f",
    "scrollbarSlider.background": "#494d6455",
    "scrollbarSlider.hoverBackground": "#494d6488",
    "scrollbarSlider.activeBackground": "#494d64aa",
  },
};

/// Register every custom theme on a Monaco instance. Safe to call multiple
/// times — `defineTheme` replaces by name.
export function registerMonacoThemes(monaco: typeof import("monaco-editor")) {
  monaco.editor.defineTheme("fishbones-dark", KATA_DARK);
  monaco.editor.defineTheme("fishbones-light", KATA_LIGHT);
  monaco.editor.defineTheme("fishbones-synthwave", SYNTHWAVE);
  monaco.editor.defineTheme("fishbones-claude-code-dark", CLAUDE_CODE_DARK);
  monaco.editor.defineTheme("fishbones-ayu-light", AYU_LIGHT);
  monaco.editor.defineTheme("fishbones-ayu-mirage", AYU_MIRAGE);
  monaco.editor.defineTheme("fishbones-ayu-dark", AYU_DARK);
  monaco.editor.defineTheme("fishbones-catppuccin-latte", CATPPUCCIN_LATTE);
  monaco.editor.defineTheme("fishbones-catppuccin-frappe", CATPPUCCIN_FRAPPE);
  monaco.editor.defineTheme("fishbones-catppuccin-macchiato", CATPPUCCIN_MACCHIATO);
  monaco.editor.defineTheme("fishbones-catppuccin-mocha", CATPPUCCIN_MOCHA);
}
