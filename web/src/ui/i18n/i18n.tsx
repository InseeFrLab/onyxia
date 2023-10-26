import {
    createI18nApi,
    declareComponentKeys,
    LocalizedString as GenericLocalizedString
} from "i18nifty";
import { fallbackLanguage, type Language } from "./types";
import { ComponentKey } from "./types";
import { statefulObservableToStatefulEvt } from "powerhooks/tools/StatefulObservable/statefulObservableToStatefulEvt";
import { getEnabledLanguages } from "ui/env";
export { declareComponentKeys };

export const {
    useTranslation,
    resolveLocalizedString,
    useLang,
    $lang,
    useResolveLocalizedString,
    useIsI18nFetching,
    getTranslation
} = createI18nApi<ComponentKey>()(
    {
        "languages": getEnabledLanguages(),
        fallbackLanguage
    },
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

export type LocalizedString = GenericLocalizedString<Language>;

export const evtLang = statefulObservableToStatefulEvt({
    "statefulObservable": $lang
});
