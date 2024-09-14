import { z } from "zod";
import { assert, type Equals } from "tsafe/assert";
import type { Language } from "core";
import type { LocalizedString } from "./i18n";
import { id } from "tsafe/id";

//List the languages you with to support
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

assert<Equals<(typeof languages)[number], Language>>();

export const zLanguage = (() => {
    type TargetType = Language;

    const zTargetType = z.union([
        z.literal("en"),
        z.literal("fr"),
        z.literal("zh-CN"),
        z.literal("no"),
        z.literal("fi"),
        z.literal("nl"),
        z.literal("it"),
        z.literal("es"),
        z.literal("de")
    ]);

    assert<Equals<z.infer<typeof zTargetType>, TargetType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export const zLocalizedString = (() => {
    type TargetType = LocalizedString;

    const zTargetType = z.union([z.string(), z.record(zLanguage, z.string())]);

    assert<Equals<z.infer<typeof zTargetType>, TargetType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();
