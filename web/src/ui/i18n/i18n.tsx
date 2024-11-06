import {
    createI18nApi,
    declareComponentKeys,
    LocalizedString as GenericLocalizedString
} from "i18nifty";
import { fallbackLanguage, type Language } from "./types";
import { ComponentKey } from "./types";
import { statefulObservableToStatefulEvt } from "powerhooks/tools/StatefulObservable/statefulObservableToStatefulEvt";
import { env } from "env";
import { objectEntries } from "tsafe/objectEntries";
import { objectFromEntries } from "tsafe/objectFromEntries";
import { pluginSystemInitI18n } from "pluginSystem";
export { declareComponentKeys };

export const {
    useTranslation,
    resolveLocalizedString,
    useLang,
    $lang,
    useResolveLocalizedString,
    I18nFetchingSuspense,
    getTranslation,
    $readyLang
} = createI18nApi<ComponentKey>()(
    {
        languages: env.ENABLED_LANGUAGES,
        fallbackLanguage
    },
    {
        en: () => import("./resources/en").then(({ translations }) => translations),
        fr: () => import("./resources/fr").then(({ translations }) => translations),
        "zh-CN": () =>
            import("./resources/zh-CN").then(({ translations }) => translations),
        no: () => import("./resources/no").then(({ translations }) => translations),
        fi: () => import("./resources/fi").then(({ translations }) => translations),
        nl: () => import("./resources/nl").then(({ translations }) => translations),
        it: () => import("./resources/it").then(({ translations }) => translations),
        es: () => import("./resources/es").then(({ translations }) => translations),
        de: () => import("./resources/de").then(({ translations }) => translations)
    }
);

export const evtLang = statefulObservableToStatefulEvt({
    statefulObservable: $lang
});

pluginSystemInitI18n({
    setLang: lang => (evtLang.state = lang),
    evtReadyLang: statefulObservableToStatefulEvt({
        statefulObservable: $readyLang
    }),
    getTranslation
});

export type LocalizedString = GenericLocalizedString<Language>;

export const languagesPrettyPrint: Record<Language, string> = objectFromEntries(
    objectEntries({
        /* spell-checker: disable */
        en: "English",
        fr: "Français",
        de: "Deutsch",
        it: "Italiano",
        es: "Español",
        nl: "Nederlands",
        no: "Norsk",
        fi: "Suomi",
        "zh-CN": "简体中文"
        /* spell-checker: enable */
    }).filter(([language]) => env.ENABLED_LANGUAGES.includes(language))
);
