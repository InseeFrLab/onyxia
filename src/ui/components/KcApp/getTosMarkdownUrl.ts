import type { KcLanguageTag } from "keycloakify";
import { fallbackLanguage } from "ui/i18n/useLng";
import { THERMS_OF_SERVICES as thermsOfServices } from "ui/envCarriedOverToKc";
import { createResolveLocalizedString } from "core/tools/resolveLocalizedString";

export function getTosMarkdownUrl(kcLanguageTag: KcLanguageTag): string | undefined {
    if (thermsOfServices === undefined) {
        return undefined;
    }

    const { resolveLocalizedString } = createResolveLocalizedString<KcLanguageTag>({
        "currentLanguage": kcLanguageTag,
        fallbackLanguage,
    });

    return resolveLocalizedString(thermsOfServices);
}
