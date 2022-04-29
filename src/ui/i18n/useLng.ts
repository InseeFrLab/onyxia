import { createUseGlobalState } from "powerhooks/useGlobalState";
import { assert } from "tsafe/assert";
import type { KcLanguageTag } from "keycloakify";
import type { Language } from "ui/coreApi";
import { languages } from "ui/coreApi";
export { languages };
export type { Language };

assert<Language extends KcLanguageTag ? true : false>();

export const fallbackLanguage = "en";

assert<typeof fallbackLanguage extends Language ? true : false>();

export function getBrowserLng(): Language {
    const iso2LanguageLike = navigator.language.split("-")[0].toLowerCase();

    const lng = languages.find(lng => lng.toLowerCase().includes(iso2LanguageLike));

    if (lng !== undefined) {
        return lng;
    }

    return fallbackLanguage;
}

export const { useLng, evtLng } = createUseGlobalState("lng", getBrowserLng);
