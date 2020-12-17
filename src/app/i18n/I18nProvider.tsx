
import React from "react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources } from "./resources";
import type { SupportedLanguages } from "./resources";
import { id } from "evt/tools/typeSafety/id";
import { I18nextProvider } from "react-i18next";
import memoizee from "memoizee";

export type Props = {
    lng: SupportedLanguages | "browser default";
    children: React.ReactNode;
}

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        "fallbackLng": id<SupportedLanguages>("en"),
        "debug": true,
        "interpolation": {
            "escapeValue": false
        },
        resources
    });

const getI18nInstanceForLanguage = memoizee(
    (lng: Props["lng"]): typeof i18n => {

        if (lng === "browser default") {
            return i18n;
        }

        return i18n.cloneInstance({ lng });

    }
);

export function I18nProvider(props: Props) {

    const { children, lng } = props;

    return (
        <I18nextProvider i18n={getI18nInstanceForLanguage(lng)}>
            {children}
        </I18nextProvider>
    );

}


