/// Single-language picker: flag + endonym, click to open a menu of
/// supported locales. Used in the desktop Settings dialog (Theme rail)
/// + the mobile Settings page so the user can switch languages from
/// either form factor.
///
/// Uses the existing `useLocale` hook for state, so the picker
/// composes cleanly into any tree depth without additional plumbing
/// — open Settings, pick a language, close, and the lesson reader
/// the user returns to is already in the new locale.
///
/// Visual layout — inline lockup of:
///   [🇺🇸] [English]    [▾]
/// On click, the menu drops below with the same shape per row:
///   [🇺🇸] English          ✓   ← active
///   [🇷🇺] Русский
///   ...
///
/// Mobile note: menu uses a fixed-position overlay so it doesn't get
/// clipped by the safe-area inset on iOS. The desktop Settings rail
/// has its own scroll context; for that we use `position: absolute`
/// inside the trigger button wrapper.

import { useEffect, useRef, useState } from "react";
import {
  LOCALE_FLAGS,
  LOCALE_NAMES,
  SUPPORTED_LOCALES,
  type Locale,
} from "../../data/locales";
import { useLocale } from "../../hooks/useLocale";
import "./LanguageDropdown.css";

export interface LanguageDropdownProps {
  /// "field" (default) — full-width row that fits Settings rails:
  /// flag + label + chevron + dropdown opens directly under.
  /// "compact" — pill-shaped trigger meant for the desktop top bar
  /// or mobile header. Same dropdown shape, just narrower trigger.
  variant?: "field" | "compact";
  /// Optional class to layer extra positioning / theming. Applied to
  /// the wrapper, not the popover (the popover is portaled to body).
  className?: string;
}

export default function LanguageDropdown({
  variant = "field",
  className,
}: LanguageDropdownProps) {
  const [locale, setLocale] = useLocale();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Click-outside-to-close. Captures pointerdown so a synchronous
  // toggle on the trigger button doesn't immediately re-close the
  // menu we just opened.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target && wrapperRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <div
      ref={wrapperRef}
      className={
        "fb-langdrop" +
        (variant === "compact" ? " fb-langdrop--compact" : " fb-langdrop--field") +
        (className ? " " + className : "")
      }
    >
      <button
        type="button"
        className="fb-langdrop__trigger"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="fb-langdrop__flag" aria-hidden>
          {LOCALE_FLAGS[locale]}
        </span>
        <span className="fb-langdrop__label">{LOCALE_NAMES[locale]}</span>
        <span className="fb-langdrop__chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <ul className="fb-langdrop__menu" role="listbox" aria-label="Language">
          {SUPPORTED_LOCALES.map((l) => {
            const active = l === locale;
            return (
              <li key={l}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={
                    "fb-langdrop__option" +
                    (active ? " fb-langdrop__option--active" : "")
                  }
                  onClick={() => pick(l)}
                >
                  <span className="fb-langdrop__flag" aria-hidden>
                    {LOCALE_FLAGS[l]}
                  </span>
                  <span className="fb-langdrop__label">{LOCALE_NAMES[l]}</span>
                  {active && (
                    <span className="fb-langdrop__check" aria-hidden>
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
