import type { KcLanguageTag } from "keycloakify";
import type { fallbackLanguage } from "app/i18n/translations";
import { THERMS_OF_SERVICES } from "app/envCarriedOverToKc";
import { objectKeys } from "tsafe/objectKeys";
import { id } from "tsafe/id";

export function getTosMarkdownUrl(kcLanguageTag: KcLanguageTag): string {
    const thermsOfServices = THERMS_OF_SERVICES;
    switch (typeof thermsOfServices) {
        case "string":
            return thermsOfServices;
        case "undefined":
            throw new Error(
                [
                    "There was no therms of service provided in the Onyxia-web configuration.",
                    "Provide it or disable therms as required action in Keycloak",
                ].join(" "),
            );
        default: {
            for (const lng of [
                kcLanguageTag,
                id<typeof fallbackLanguage>("en"),
            ] as const) {
                const url = thermsOfServices[lng];

                if (url !== undefined) {
                    return url;
                }
            }

            return thermsOfServices[objectKeys(thermsOfServices)[0]]!;
        }
    }
}
