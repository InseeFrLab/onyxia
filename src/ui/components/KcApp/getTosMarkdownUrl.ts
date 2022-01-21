import type { KcLanguageTag } from "keycloakify";
import type { fallbackLanguage } from "ui/i18n/translations";
import { THERMS_OF_SERVICES as thermsOfServices } from "ui/envCarriedOverToKc";
import { id } from "tsafe/id";
import { createResolveLocalizedString } from "ui/tools/resolveLocalizedString";

export function getTosMarkdownUrl(kcLanguageTag: KcLanguageTag): string | undefined {
    if (thermsOfServices === undefined) {
        return undefined;
    }

    const { resolveLocalizedString } = createResolveLocalizedString<KcLanguageTag>({
        "currentLanguage": kcLanguageTag,
        "fallbackLanguage": id<typeof fallbackLanguage>("en"),
    });

    return resolveLocalizedString(thermsOfServices);
}
