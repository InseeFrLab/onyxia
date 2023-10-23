import { z } from "zod";
import { assert, type Equals } from "tsafe/assert";
import type { Language } from "core";
import type { LocalizedString } from "./i18n";

//List the languages you with to support
export const languages = ["en", "fr", "zh-CN", "no", "fi", "nl", "it", "de"] as const;

assert<Equals<(typeof languages)[number], Language>>();

export const zLanguage = z.union([
    z.literal("en"),
    z.literal("fr"),
    z.literal("zh-CN"),
    z.literal("no"),
    z.literal("fi"),
    z.literal("nl"),
    z.literal("it"),
    z.literal("de")
]);

{
    type Got = ReturnType<(typeof zLanguage)["parse"]>;
    type Expected = Language;

    assert<Equals<Got, Expected>>();
}

export const zLocalizedString = z.union([z.string(), z.record(zLanguage, z.string())]);

{
    type Got = ReturnType<(typeof zLocalizedString)["parse"]>;
    type Expected = LocalizedString;

    assert<Equals<Got, Expected>>();
}
