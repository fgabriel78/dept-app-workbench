"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getDictionary,
  isSupportedLocale,
  resolveSystemLocale,
  type Locale,
  type TranslationDictionary,
} from "@/lib/i18n";

export const LOCALE_STORAGE_KEY = "dept-app-workbench.locale";

type I18nContextValue = {
  locale: Locale;
  t: TranslationDictionary;
  setLocale: (next: Locale) => void;
};

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  t: getDictionary("en"),
  setLocale: () => {},
});

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? "en");

  useEffect(() => {
    if (initialLocale) {
      document.documentElement.lang = initialLocale;
      return;
    }

    let resolved: Locale = "en";
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isSupportedLocale(stored)) {
        resolved = stored;
      } else {
        const navLangs =
          Array.isArray(window.navigator.languages) && window.navigator.languages.length > 0
            ? window.navigator.languages
            : [window.navigator.language];
        resolved = resolveSystemLocale(navLangs);
      }
    } catch {
      resolved = "en";
    }

    setLocaleState(resolved);
    document.documentElement.lang = resolved;
  }, [initialLocale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: getDictionary(locale),
      setLocale,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
