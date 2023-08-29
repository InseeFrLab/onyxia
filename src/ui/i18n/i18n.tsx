import { createI18nApi, declareComponentKeys } from "i18nifty";
import { languages, fallbackLanguage, Language } from "./types";
import { ComponentKey } from "./types";
import { assert, type Equals } from "tsafe/assert";
import { statefulObservableToStatefulEvt } from "powerhooks/tools/StatefulObservable/statefulObservableToStatefulEvt";
import { z } from "zod";
export { declareComponentKeys };

export type LocalizedString = Parameters<typeof resolveLocalizedString>[0];

export const {
    useTranslation,
    resolveLocalizedString,
    useLang,
    $lang,
    useResolveLocalizedString,
    useIsI18nFetching,
    /** For use outside of React */
    getTranslation
} = createI18nApi<ComponentKey>()(
    { languages, fallbackLanguage },
    {
        "en": () => import("./resources/en").then(({ translations }) => translations),
        "fr": () => import("./resources/fr").then(({ translations }) => translations),
        "zh-CN": () =>
            import("./resources/zh-CN").then(({ translations }) => translations),
        "no": () => import("./resources/no").then(({ translations }) => translations),
        "fi": () => import("./resources/fi").then(({ translations }) => translations),
        "nl": () => import("./resources/nl").then(({ translations }) => translations),
        "it": () => import("./resources/it").then(({ translations }) => translations),
        "de": () => import("./resources/de").then(({ translations }) => translations)
    }
);

export const evtLang = statefulObservableToStatefulEvt({
    "statefulObservable": $lang
});

export const zLanguage = z.union([
    z.literal("en"),
    z.literal("fr"),
    z.literal("zh-CN"),
    z.literal("no"),
    z.literal("fi"),
    z.literal("nl"),
    z.literal("it")
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
