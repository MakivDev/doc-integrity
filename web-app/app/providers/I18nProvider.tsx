"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import uk from "@/app/i18n/uk.json";
import en from "@/app/i18n/en.json";

type Locale = "uk" | "en";
type Translations = typeof uk;

interface I18nContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const translations: Record<Locale, Translations> = { uk, en };

const I18nContext = createContext<I18nContextType>({
  locale: "uk",
  t: uk,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("uk");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && translations[saved]) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
