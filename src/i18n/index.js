import en from "./en";
import ja from "./ja";
import zh from "./zh";
const locales = {
    zh,
    en,
    ja,
};
export function pickLocale(acceptLanguageHeader) {
    const value = (acceptLanguageHeader || "").toLowerCase();
    if (value.includes("zh"))
        return "zh";
    if (value.includes("ja"))
        return "ja";
    return "en";
}
export function getMessages(locale) {
    return locales[locale] ?? locales.en;
}
