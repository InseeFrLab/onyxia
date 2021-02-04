
import React, { useState, useReducer } from "react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources } from "./resources";
import type { SupportedLanguage } from "./resources";
import { id } from "evt/tools/typeSafety/id";
import { I18nextProvider } from "react-i18next";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import { useValueChangeEffect } from "app/tools/hooks/useValueChangeEffect";

export type Props = {
    lng: SupportedLanguage;
    children: React.ReactNode;
}

export function I18nProvider(props: Props) {

    const { children, lng } = props;

    const [{ i18nInstance }] = useState(() => {

        i18n
            .use(LanguageDetector)
            .use(initReactI18next)
            .init({
                "fallbackLng": id<SupportedLanguage>("en"),
                "debug": false,
                "interpolation": {
                    "escapeValue": false
                },
                resources
            });

        return { "i18nInstance": i18n.cloneInstance({ lng }) };

    });

    useValueChangeEffect(
        () => i18nInstance.changeLanguage(lng),
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


