import en from "./en";
import ja from "./ja";
import type { LocaleMessages } from "./types";
import zh from "./zh";

export type Locale = "zh" | "en" | "ja";

const locales: Record<Locale, LocaleMessages> = {
  zh,
  en,
  ja,
};

export function pickLocale(acceptLanguageHeader?: string | null): Locale {
  const value = (acceptLanguageHeader || "").toLowerCase();
  if (value.includes("zh")) return "zh";
  if (value.includes("ja")) return "ja";
  return "en";
}

export function getMessages(locale: Locale): LocaleMessages {
  return locales[locale] ?? locales.en;
}
