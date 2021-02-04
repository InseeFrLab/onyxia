




import { useState } from "react";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import { useConstCallback } from "app/tools/hooks/useConstCallback";
import i18n from "i18next";
import type { SupportedLanguage } from "./resources";
import LanguageDetector from "i18next-browser-languagedetector";
import { id } from "evt/tools/typeSafety/id";

const key = "lng_dXddOm";

export function getBrowserDefaultLng() {
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

const evtLng = Evt.create(
    (() => {

        const value = localStorage.getItem(key);

        return value === null ? null : value as SupportedLanguage;

    })() ??
    getBrowserDefaultLng()
);

evtLng.attach(lng => localStorage.setItem(key, lng));



/** Synchronized with local storage */
export function useLng(): {
    lng: SupportedLanguage;
    setLng(value: SupportedLanguage): void;
} {

    const [lng, setLng] = useState(evtLng.state);

    useEvt(ctx =>
        evtLng
            .toStateless(ctx)
            .attach(setLng),
        []
    );

    return {
        lng,
        "setLng": useConstCallback(value => evtLng.state = value)
    };

}
