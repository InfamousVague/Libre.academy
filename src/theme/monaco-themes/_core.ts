/// Shared types + mapping for Monaco themes. The per-theme
/// constants live alongside in `./<theme>.ts` files; `./index.ts`
/// registers them with Monaco. See the splitter at
/// `scripts/split-monaco-themes.mjs`.

import type { ThemeName } from "../themes";

export type MonacoThemeName =
  | "vs"
  | "vs-dark"
  | "libre-dark"
  | "libre-synthwave"
  | "libre-claude-code-dark"
  | "libre-ayu-mirage"
  | "libre-ayu-dark"
  | "libre-catppuccin-frappe"
  | "libre-catppuccin-macchiato"
  | "libre-catppuccin-mocha"
  | "libre-tokyo-night"
  | "libre-rose-pine"
  | "libre-ubuntu-dark"
  | "libre-absent-contrast"
  | "libre-vesper"
  | "libre-word";

/// Map each app theme to the Monaco theme name we want the editor to load.
/// The light app themes (ayu-light, catppuccin-latte) intentionally pair
/// with the DARK Monaco theme — light syntax-highlighting palettes wash
/// out next to the app's chrome, while a dark editor frames the code as a
/// distinct surface. See the matching note on `monacoTheme` in themes.ts.
export const MONACO_THEME_BY_APP_THEME: Record<ThemeName, MonacoThemeName> = {
  "default-dark": "libre-dark",
  synthwave: "libre-synthwave",
  "claude-code-dark": "libre-claude-code-dark",
  "ayu-light": "libre-dark",
  "ayu-mirage": "libre-ayu-mirage",
  "ayu-dark": "libre-ayu-dark",
  "catppuccin-latte": "libre-dark",
  "catppuccin-frappe": "libre-catppuccin-frappe",
  "catppuccin-macchiato": "libre-catppuccin-macchiato",
  "catppuccin-mocha": "libre-catppuccin-mocha",
  "tokyo-night": "libre-tokyo-night",
  "rose-pine": "libre-rose-pine",
  "ubuntu-dark": "libre-ubuntu-dark",
  "absent-contrast": "libre-absent-contrast",
  vesper: "libre-vesper",
  word: "libre-word",
};
