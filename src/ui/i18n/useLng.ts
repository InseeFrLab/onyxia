import type { SupportedLanguage, fallbackLanguage } from "./translations";
import { createUseGlobalState } from "powerhooks/useGlobalState";
import { getEvtKcLanguage } from "keycloakify";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import type { Equals } from "tsafe";

const supportedLanguage = ["en", "fr"] as const;

assert<Equals<SupportedLanguage, typeof supportedLanguage[number]>>();

export function getBrowserLng(): SupportedLanguage {
    const iso2LanguageLike = navigator.language.split("-")[0].toLowerCase();

    const lng = supportedLanguage.find(lng =>
        lng.toLowerCase().includes(iso2LanguageLike),
    );

    if (lng !== undefined) {
        return lng;
    }

    return id<typeof fallbackLanguage>("en");
}

export const { useLng, evtLng } = createUseGlobalState("lng", getBrowserLng);

//NOTE: When we change langue in the main APP we change as well for the login pages
evtLng.toStateless().attach(lng => (getEvtKcLanguage().state = lng));
