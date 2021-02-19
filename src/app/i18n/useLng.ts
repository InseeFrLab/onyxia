

import i18n from "i18next";
import type { SupportedLanguage } from "./resources";
import LanguageDetector from "i18next-browser-languagedetector";
import { id } from "evt/tools/typeSafety/id";
import { createUseGlobalState } from "app/tools/hooks/useGlobalState";


export const { useLng } = createUseGlobalState(
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
