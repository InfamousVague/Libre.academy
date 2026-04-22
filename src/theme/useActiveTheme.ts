import { useEffect, useState } from "react";
import { readActiveTheme, type ThemeName } from "./themes";

/// Subscribes to `<html data-theme-name>` mutations so any component that
/// renders Monaco (or otherwise cares about the current theme) re-renders
/// when the user swaps themes in Settings. Avoids us having to prop-drill
/// the theme name through every intermediate component.
export function useActiveTheme(): ThemeName {
  const [theme, setTheme] = useState<ThemeName>(() => readActiveTheme());

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme(readActiveTheme());
    });
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme-name"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
