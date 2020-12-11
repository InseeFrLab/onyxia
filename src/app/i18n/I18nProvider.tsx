
import React from "react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources } from "./resources";
import type { SupportedLanguages } from "./resources";
import { id } from "evt/tools/typeSafety/id";
import { I18nextProvider } from "react-i18next";

export type Props = {
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

export function I18nProvider(props: Props) {

    const { children } = props;

    return <I18nextProvider i18n={i18n}> {children} </I18nextProvider>;

}


