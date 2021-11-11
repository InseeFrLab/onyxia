import type { SupportedLanguage } from "./translations";
import { createUseGlobalState } from "powerhooks/useGlobalState";
import { getEvtKcLanguage } from "keycloakify";
import { assert } from "tsafe/assert";
import type { Equals } from "tsafe";
import { kcContext } from "app/components/KcApp/kcContext";

const supportedLanguage = ["en", "fr"] as const;

assert<Equals<SupportedLanguage, typeof supportedLanguage[number]>>();

export const { useLng, evtLng } = createUseGlobalState("lng", (): SupportedLanguage => {
    const iso2LanguageLike = navigator.language.split("-")[0].toLowerCase();

    const lng = supportedLanguage.find(lng =>
        lng.toLowerCase().includes(iso2LanguageLike),
    );

    if (lng !== undefined) {
        return lng;
    }

    return "en";
});

//NOTE: When we change langue in the main APP we change as well for the login pages
evtLng.attach(lng => {
    if (kcContext !== undefined && kcContext.pageId === "login-verify-email.ftl") {
        console.log("Prevent switch here");
        return;
    }

    getEvtKcLanguage().state = lng;
});
