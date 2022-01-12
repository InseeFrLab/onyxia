import type { KcLanguageTag } from "keycloakify";
import type { fallbackLanguage } from "ui/i18n/translations";
import { THERMS_OF_SERVICES } from "ui/envCarriedOverToKc";
import { objectKeys } from "tsafe/objectKeys";
import { id } from "tsafe/id";

export function getTosMarkdownUrl(kcLanguageTag: KcLanguageTag): string | undefined {
    const thermsOfServices = THERMS_OF_SERVICES;
    switch (typeof thermsOfServices) {
        case "undefined":
            return undefined;
        case "string":
            return thermsOfServices;
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
