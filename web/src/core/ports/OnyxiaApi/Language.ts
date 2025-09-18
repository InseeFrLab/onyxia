import type { LocalizedString as GenericLocalizedString } from "i18nifty";
import { z } from "zod";
import { assert, type Equals } from "tsafe/assert";
import { id } from "tsafe/id";

export const languages = [
    "en",
    "fr",
    "zh-CN",
    "no",
    "fi",
    "nl",
    "it",
    "es",
    "de"
] as const;

export type Language = (typeof languages)[number];

export type LocalizedString = GenericLocalizedString<Language>;

export const zLanguage = (() => {
    type TargetType = Language;

    const zTargetType = z.enum(languages);

    assert<Equals<z.infer<typeof zTargetType>, TargetType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export const zLocalizedString = (() => {
    type TargetType = LocalizedString;

    const zTargetType = z.union([z.string(), z.record(zLanguage, z.string())]);

    assert<Equals<z.infer<typeof zTargetType>, TargetType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();
