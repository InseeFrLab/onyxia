
import React, { useState, useReducer } from "react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources } from "./resources";
import type { SupportedLanguages } from "./resources";
import { id } from "evt/tools/typeSafety/id";
import { I18nextProvider } from "react-i18next";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import { useValueChangeEffect } from "app/utils/hooks/useValueChangeEffect";

export type Props = {
    lng: SupportedLanguages | "browser default";
    children: React.ReactNode;
}

export function I18nProvider(props: Props) {

    const { children, lng } = props;

    const [{ browserDefaultLng, i18nInstance }] = useState(() => {

        i18n
            .use(LanguageDetector)
            .use(initReactI18next)
            .init({
                "fallbackLng": id<SupportedLanguages>("en"),
                "debug": false,
                "interpolation": {
                    "escapeValue": false
                },
                resources
            });

        return {
            "browserDefaultLng": i18n.language,
            "i18nInstance": i18n.cloneInstance(...(lng === "browser default" ? [] : [{ lng }]))
        };

    });

    useValueChangeEffect(
        () => i18nInstance.changeLanguage(
            lng === "browser default" ?
                browserDefaultLng :
                lng
        ),
        [lng]
    );

    const [, forceUpdate] = useReducer(x => x + 1, 0);

    useEvt(
        ctx => Evt.from(
            ctx,
            i18nInstance as any,
            "languagechange"
        ).attach(() => forceUpdate()),
        [i18nInstance]
    );

    return (
        <I18nextProvider i18n={i18nInstance}>
            {children}
        </I18nextProvider>
    );

}


