/// Light-mode counterpart to libre-dark. Same "monochrome glass +
/// one warm amber accent" brief, inverted for a paper-white surface.
///
/// Token mapping follows the dark theme's logic — keywords are
/// near-black for emphasis, identifiers slightly softer, literals
/// (strings / numbers / regex) carry the warm amber accent so code
/// still scans at a glance. Background tokens map 1:1 to the
/// app's `--color-bg-primary` for light themes (a near-white
/// paper tone) so the editor frame disappears into the page.

import type { editor } from "monaco-editor";

export const LIBRE_LIGHT: editor.IStandaloneThemeData = {
  base: "vs",
  inherit: true,
  rules: [
    // Comments stay at the dimmest reading-grade so they fade into
    // the page without competing with the source line above them.
    { token: "comment", foreground: "8a8a93", fontStyle: "italic" },
    // Keywords get strongest contrast — pure near-black + bold.
    { token: "keyword", foreground: "111114", fontStyle: "bold" },
    { token: "keyword.control", foreground: "111114", fontStyle: "bold" },
    // Literals carry the warm amber accent. Slightly darkened
    // from the dark-theme amber so it reads as the same hue but
    // weighted for a light background (#a85e1c vs the dark
    // theme's #c8aa7e).
    { token: "string", foreground: "a85e1c" },
    { token: "string.escape", foreground: "8a4a14" },
    { token: "number", foreground: "a85e1c" },
    { token: "regexp", foreground: "a85e1c" },
    // Types + tags read as a second-tier emphasis: bold but at the
    // standard text color, not the keyword pure-black.
    { token: "type", foreground: "2a2a32", fontStyle: "bold" },
    { token: "type.identifier", foreground: "2a2a32", fontStyle: "bold" },
    { token: "identifier", foreground: "1a1a1f" },
    { token: "delimiter", foreground: "9b9ba7" },
    { token: "operator", foreground: "6c6c78" },
    { token: "tag", foreground: "111114", fontStyle: "bold" },
    { token: "attribute.name", foreground: "2a2a32" },
    { token: "attribute.value", foreground: "a85e1c" },
    // Variables / function names share the identifier weight —
    // no per-symbol coloring, keeping the "monochrome with one
    // accent" feel intact.
    { token: "variable", foreground: "1a1a1f" },
    { token: "variable.parameter", foreground: "1a1a1f" },
    { token: "function", foreground: "1a1a1f" },
    { token: "function.call", foreground: "1a1a1f" },
  ],
  colors: {
    // Background tones match the light-app surface — `--color-bg-
    // primary` in light mode is `#fbfbf8` (paper warm-white) and
    // the secondary surface is a half-step darker. Picked to make
    // the editor frame visually disappear into the page rather
    // than read as a panel laid on top.
    "editor.background": "#fbfbf8",
    "editor.foreground": "#1a1a1f",
    "editorLineNumber.foreground": "#c8c8c0",
    "editorLineNumber.activeForeground": "#6c6c78",
    "editor.lineHighlightBackground": "#f0f0e8",
    "editor.lineHighlightBorder": "#00000000",
    "editor.selectionBackground": "#d8d6c8",
    "editor.inactiveSelectionBackground": "#e4e2d4",
    "editorCursor.foreground": "#1a1a1f",
    "editorWhitespace.foreground": "#e0e0d8",
    "editorIndentGuide.background": "#ebebe2",
    "editorIndentGuide.activeBackground": "#c8c8c0",
    "editor.findMatchBackground": "#f3d089",
    "editor.findMatchHighlightBackground": "#fce5b9",
    "editorBracketMatch.background": "#e8e6d8",
    "editorBracketMatch.border": "#a85e1c",
    "editorGutter.background": "#fbfbf8",
    "editorWidget.background": "#f5f5ee",
    "editorWidget.border": "#dcdcd4",
  },
};
