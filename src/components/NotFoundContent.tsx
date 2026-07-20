"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { dicts } from "@/i18n/dictionaries";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

// The special /_not-found route is prerendered outside the LanguageProvider
// tree, so this component resolves its own locale instead of using the
// useLanguage() context (which is unavailable during that prerender).
function lookup(locale: Locale, key: string): string {
  const parts = key.split(".");
  let cur: unknown = dicts[locale];
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      cur = undefined;
      break;
    }
  }
  if (typeof cur === "string") return cur;
  // Fall back to the default locale, then to the key itself.
  let def: unknown = dicts[defaultLocale];
  for (const p of parts) {
    if (def && typeof def === "object" && p in (def as object)) {
      def = (def as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }
  return typeof def === "string" ? def : key;
}

export default function NotFoundContent() {
  // Start at the default locale so server and first client render match.
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    const browser = navigator.language?.slice(0, 2) as Locale | null;
    if (stored && locales.includes(stored)) setLocale(stored);
    else if (browser && locales.includes(browser)) setLocale(browser);
  }, []);

  const t = (key: string) => lookup(locale, key);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background text-foreground px-6 py-24 text-center">
      <p className="font-bold text-7xl sm:text-8xl text-primary/30">
        {t("notFound.code")}
      </p>
      <h1 className="mt-4 font-bold text-3xl sm:text-4xl text-foreground">
        {t("notFound.title")}
      </h1>
      <p className="mt-3 max-w-md text-base text-muted-foreground">
        {t("notFound.desc")}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm h-11 px-6 hover:opacity-90 transition-all"
      >
        <IconArrowLeft className="size-4" />
        {t("notFound.home")}
      </Link>
    </div>
  );
}
