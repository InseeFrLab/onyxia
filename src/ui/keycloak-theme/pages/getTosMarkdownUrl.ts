import { fallbackLanguage } from "ui/i18n";
import { createResolveLocalizedString } from "i18nifty";
import { THERMS_OF_SERVICES as thermsOfServices } from "ui/envCarriedOverToKc";

export function getTosMarkdownUrl(kcLanguageTag: string): string | undefined {
    if (thermsOfServices === undefined) {
        return undefined;
    }

    const { resolveLocalizedString } = createResolveLocalizedString({
        "currentLanguage": kcLanguageTag,
        fallbackLanguage
    });

    return resolveLocalizedString(thermsOfServices);
}
