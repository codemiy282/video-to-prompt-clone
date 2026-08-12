export const locales = ["en", "vi", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
  zh: "中文",
};

/** Full language names, for instructing the model which language to reply in. */
export const localeInstructionNames: Record<Locale, string> = {
  en: "English",
  vi: "Vietnamese",
  zh: "Simplified Chinese",
};

/** Narrow an untrusted `lang` value from a request body to a supported locale. */
export function resolveLocale(value: unknown): Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value)
    ? (value as Locale)
    : defaultLocale;
}
