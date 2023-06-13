import { createI18nApi, declareComponentKeys } from "i18nifty";
import { languages, fallbackLanguage } from "./types";
import { ComponentKey } from "./types";
import { statefulObservableToStatefulEvt } from "powerhooks/tools/StatefulObservable/statefulObservableToStatefulEvt";
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
        "it": () => import("./resources/it").then(({ translations }) => translations)
    }
);

export const evtLang = statefulObservableToStatefulEvt({
    "statefulObservable": $lang
});
