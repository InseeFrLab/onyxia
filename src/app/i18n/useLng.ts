import i18n from "i18next";
import type { SupportedLanguage, supportedLanguages } from "./resources";
import LanguageDetector from "i18next-browser-languagedetector";
import { id } from "evt/tools/typeSafety/id";
import { createUseGlobalState } from "powerhooks";
import { getEvtKcLanguage } from "keycloakify";
import { kcContext, } from "keycloakify";

export const { useLng, evtLng } = createUseGlobalState(
    "lng",
    () => {

        i18n
            .use(LanguageDetector)
            .init({
                "fallbackLng": id<SupportedLanguage>("en"),
                "resources": id<Record<SupportedLanguage, {}>>({
                    "en": {},
                    "fr": {}
                })
            });

        return i18n.language.split("-")[0] as SupportedLanguage;

    }
);

if (kcContext === undefined) {

    evtLng.attach(lng => getEvtKcLanguage().state = lng);

} else {

    getEvtKcLanguage()
        .attach(
            kcLng => id<readonly string[]>(id<typeof supportedLanguages>(["en", "fr"])).includes(kcLng),
            kcLng => evtLng.state = kcLng as SupportedLanguage
        );

}
