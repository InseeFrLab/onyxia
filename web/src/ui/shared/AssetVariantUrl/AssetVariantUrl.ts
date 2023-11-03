import { useMemo } from "react";
import { useResolveLocalizedString, type LocalizedString } from "ui/i18n";
import { useIsDarkModeEnabled } from "onyxia-ui";

/**
 * AssetVariantUrl is a type that enable Onyxia administrators to provide a different asset url
 * depending on the user's language and/or the user's dark mode preference.
 * If you don't need this level of customization, you can simply provide a string.
 *
 * Examples with the FAVICON environment variable:
 *
 * FAVICON: "https://example.com/favicon.svg"
 *
 * FAVICON: |
 *     {
 *         "light": "https://user-images.githubusercontent.com/6702424/280081114-85e465c0-34a2-47f4-8c38-6d5a5eba31c4.svg",
 *         "dark": "https://example.com/favicon-dark.svg",
 *     }
 *
 * FAVICON: |
 *     {
 *         "en": "https://example.com/favicon-en.svg",
 *         "fr": "https://example.com/favicon-fr.svg",
 *     }
 *
 * FAVICON: |
 *     {
 *         "light": "https://user-images.githubusercontent.com/6702424/280081114-85e465c0-34a2-47f4-8c38-6d5a5eba31c4.svg",
 *         "dark": {
 *             "en": "https://example.com/favicon-en-dark.svg",
 *             "fr": "https://example.com/favicon-fr-dark.svg",
 *         }
 *     }
 */
export type AssetVariantUrl =
    | LocalizedString
    | {
          light: LocalizedString;
          dark: LocalizedString;
      };

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

export function useResolveAssetVariantUrl(assetVariantUrl: AssetVariantUrl) {
    const { resolveLocalizedString } = useResolveLocalizedString();

    const { isDarkModeEnabled } = useIsDarkModeEnabled();

    const url = useMemo(
        () =>
            resolveAssetVariantUrl({
                resolveLocalizedString,
                isDarkModeEnabled,
                assetVariantUrl
            }),
        [isDarkModeEnabled, assetVariantUrl, resolveLocalizedString]
    );

    return url;
}
