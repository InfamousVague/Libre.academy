/// Lightweight i18n runtime for Libre. Custom (no react-i18next /
/// lingui dep) because:
///   - we don't need lazy-loaded namespaces or pluralisation rules
///     beyond simple `{count}` interpolation; the surface area of
///     a real product library was overkill
///   - skipping the dep keeps the bundle ~30KB lighter
///   - the public API is small enough that swapping to a "real"
///     library later is a few-line refactor at the call sites
///
/// Locale state is owned by the existing `useLocale` hook (see
/// `src/hooks/useLocale.ts`). That hook also drives course-content
/// translation; sharing one source of truth means the user has ONE
/// language setting that flips both the chrome and the lesson prose
/// at the same time.
///
/// Usage:
///
///   // In any component:
///   const t = useT();
///   <h1>{t("library.title")}</h1>
///   <p>{t("library.count", { n: courses.length })}</p>
///
/// Key lookup walks dotted paths through the loaded locale JSON;
/// missing keys fall back to English, then to the literal key.
/// `{name}` placeholders in the value get replaced with the
/// matching `params` entry; unmatched placeholders stay literal so
/// it's obvious during dev which value didn't make it through.

import { type ReactNode } from "react";
import { useLocale as useLocaleHook } from "../hooks/useLocale";
import { type Locale } from "../data/locales";
import enLocale from "./locales/en.json";
import esLocale from "./locales/es.json";
import ruLocale from "./locales/ru.json";
import frLocale from "./locales/fr.json";
import krLocale from "./locales/kr.json";
import jpLocale from "./locales/jp.json";

type Dict = Record<string, unknown>;

/// Static dictionary map — one bundled JSON per supported locale.
/// Imports are eager because the bundles are small (~5 KB each
/// minified + gzipped) and the runtime cost of a missing-locale
/// fetch on language switch isn't worth saving 30 KB of initial JS.
const DICTS: Record<Locale, Dict> = {
  en: enLocale as Dict,
  es: esLocale as Dict,
  ru: ruLocale as Dict,
  fr: frLocale as Dict,
  kr: krLocale as Dict,
  jp: jpLocale as Dict,
};

/// Drill into a Dict by dotted path. Returns `undefined` if any
/// hop misses; callers handle the fallback chain themselves.
function lookup(dict: Dict, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Dict)) {
      cur = (cur as Dict)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

/// Interpolate `{name}` placeholders. Anything not in `params`
/// stays as-is so missing-substitution bugs surface visually.
function interpolate(
  value: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (m, name) =>
    name in params ? String(params[name]) : m,
  );
}

export type TFunction = (
  key: string,
  params?: Record<string, string | number>,
) => string;

/// Provider — no-op compatibility wrapper. The locale state lives in
/// `useLocale` (backed by localStorage + cloud-sync), which is safe to
/// call from any tree depth without a context. This component is kept
/// so existing `<I18nProvider>` mounts in `main.tsx` (and any user
/// code) don't break; it just renders children.
export function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/// Translation function hook. Returns a function whose identity is
/// stable per locale, so passing `t` into a memoised callback's
/// deps list is safe (it only re-fires when the locale itself
/// changes — i.e. the user picked a new language).
export function useT(): TFunction {
  const [locale] = useLocaleHook();
  return (key, params) => {
    const primary = lookup(DICTS[locale], key);
    if (primary !== undefined) return interpolate(primary, params);
    // Fall back to English when a key is missing from the current
    // locale — better to show readable English than a raw key path
    // while translations catch up.
    if (locale !== "en") {
      const fallback = lookup(DICTS.en, key);
      if (fallback !== undefined) return interpolate(fallback, params);
    }
    // Last resort: return the key itself so it's obvious in dev
    // which key needs adding.
    return key;
  };
}

/// Direct locale-state hook. Re-exports `useLocale` from the
/// hooks layer in the shape this module previously offered, so
/// existing callers (`const { locale, setLocale } = useLocale()`)
/// keep working without churn. Most new consumers should use
/// `useT` instead and only reach for this when they actually need
/// to read or set the locale.
export function useLocale(): {
  locale: Locale;
  setLocale: (next: Locale) => void;
} {
  const [locale, setLocale] = useLocaleHook();
  return { locale, setLocale };
}

/// Re-exports from the canonical locale module so call sites can
/// import everything language-related from `i18n/i18n` without
/// having to know about the separate `data/locales` module. New
/// language → add it to `data/locales.ts` + drop a `<code>.json`
/// next to this file's locales and import it into `DICTS` above.
export { SUPPORTED_LOCALES as LOCALES } from "../data/locales";
export { LOCALE_NAMES, LOCALE_FLAGS } from "../data/locales";
export type { Locale };
