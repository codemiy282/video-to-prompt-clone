"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { dicts } from "./dictionaries";
import { defaultLocale, locales, type Locale } from "./config";

type Dict = Record<string, unknown>;

function lookup(dict: Dict, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start at the default locale so server and first client render match
  // (no hydration mismatch). The real locale is resolved after mount.
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    const browser = navigator.language?.slice(0, 2) as Locale | null;
    const initial: Locale = stored && locales.includes(stored)
      ? stored
      : browser && locales.includes(browser)
        ? browser
        : defaultLocale;
    setLocaleState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    document.documentElement.lang = l;
    localStorage.setItem("locale", l);
  };

  const t = (
    key: string,
    vars?: Record<string, string | number>
  ): string => {
    let value = lookup(dicts[locale], key) ?? lookup(dicts[defaultLocale], key) ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
