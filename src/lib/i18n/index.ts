import { ca } from "./ca";
import { en } from "./en";
import { es } from "./es";
import { SUPPORTED_LOCALES, type Locale, type TranslationDictionary } from "./types";

export { LOCALE_LABELS, LOCALE_NAMES, SUPPORTED_LOCALES } from "./types";
export type { Locale, TranslationDictionary } from "./types";

const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  en,
  es,
  ca,
};

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && (SUPPORTED_LOCALES as readonly string[]).includes(value));
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return isSupportedLocale(base) ? base : null;
}

export function resolveSystemLocale(languages?: readonly string[] | string | null): Locale {
  if (!languages) return "en";
  const list = typeof languages === "string" ? [languages] : languages;
  for (const tag of list) {
    const matched = normalizeLocale(tag);
    if (matched) return matched;
  }
  return "en";
}

export function getDictionary(locale: Locale = "en"): TranslationDictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}
