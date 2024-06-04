import type { LocalizedString as GenericLocalizedString } from "i18nifty";

export type Language = "en" | "fr" | "zh-CN" | "no" | "fi" | "nl" | "it" | "es" | "de";
export type LocalizedString = GenericLocalizedString<Language>;
