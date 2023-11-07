import { useMemo } from "react";
import { useIsDarkModeEnabled } from "onyxia-ui";

/**
 * AssetVariantUrl is a type that enable Onyxia administrators to provide a different asset url
 * depending on the user's dark mode preference.
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
 */
export type AssetVariantUrl =
    | string
    | {
          light: string;
          dark: string;
      };

export function resolveAssetVariantUrl(params: {
    isDarkModeEnabled: boolean;
    assetVariantUrl: AssetVariantUrl;
}): string {
    const { isDarkModeEnabled, assetVariantUrl } = params;

    if (typeof assetVariantUrl === "string") {
        return assetVariantUrl;
    }

    return isDarkModeEnabled ? assetVariantUrl.dark : assetVariantUrl.light;
}

export function useResolveAssetVariantUrl(assetVariantUrl: AssetVariantUrl) {
    const { isDarkModeEnabled } = useIsDarkModeEnabled();

    const url = useMemo(
        () =>
            resolveAssetVariantUrl({
                isDarkModeEnabled,
                assetVariantUrl
            }),
        [isDarkModeEnabled, assetVariantUrl]
    );

    return url;
}
