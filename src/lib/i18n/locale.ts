export const supportedLocales = ["en", "zh-TW"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export function isSupportedLocale(locale: string | null): locale is SupportedLocale {
  return supportedLocales.includes(locale as SupportedLocale);
}

export function localeForLanguageTag(tag: string): SupportedLocale | null {
  const locale = canonicalLanguageTag(tag);

  if (locale === "en" || locale.startsWith("en-")) return "en";
  if (locale === "zh-TW" || locale.startsWith("zh-Hant")) return "zh-TW";

  return null;
}

export function resolveLocale({
  savedLocale,
  languages,
}: {
  savedLocale: string | null;
  languages: readonly string[];
}): SupportedLocale {
  if (isSupportedLocale(savedLocale)) return savedLocale;

  for (const language of languages) {
    const locale = localeForLanguageTag(language);

    if (locale) return locale;
  }

  return "en";
}

function canonicalLanguageTag(tag: string): string {
  return Intl.getCanonicalLocales(tag)[0] ?? tag;
}
