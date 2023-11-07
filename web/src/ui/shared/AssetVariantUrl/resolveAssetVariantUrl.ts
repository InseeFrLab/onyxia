import type { LocalizedString } from "ui/i18n";
import type { AssetVariantUrl } from "./AssetVariantUrl";

export function resolveAssetVariantUrl(params: {
    resolveLocalizedString: (localizedString: LocalizedString) => string;
    isDarkModeEnabled: boolean;
    assetVariantUrl: AssetVariantUrl;
}): string {
    const { resolveLocalizedString, isDarkModeEnabled, assetVariantUrl } = params;

    if (typeof assetVariantUrl === "string") {
        return assetVariantUrl;
    }

    return resolveLocalizedString(
        "light" in assetVariantUrl
            ? isDarkModeEnabled
                ? assetVariantUrl.dark
                : assetVariantUrl.light
            : assetVariantUrl
    );
}
