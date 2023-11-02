import { z } from "zod";
import { zLocalizedString } from "ui/i18n/z";
import { assert } from "tsafe/assert";
import { useMemo } from "react";
import { useResolveLocalizedString, type LocalizedString } from "ui/i18n";
import { useIsDarkModeEnabled } from "onyxia-ui";
import { is } from "tsafe/is";

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

const zAssetVariantUrl = z.union([
    zLocalizedString,
    z.object({
        "light": zLocalizedString,
        "dark": zLocalizedString
    })
]);

{
    type Got = ReturnType<(typeof zAssetVariantUrl)["parse"]>;
    type Expected = AssetVariantUrl;

    // NOTE: This is too much for Equals so we lock it this way.
    assert<Got extends Expected ? true : false>();
    assert<Expected extends Got ? true : false>();
}

/** Throw an error if parsing fails */
export function parseAssetVariantUrl(serializedAssetVariantUrl: string): AssetVariantUrl {
    if (serializedAssetVariantUrl === "") {
        throw new Error("Empty string is not a valid AssetVariantUrl");
    }

    {
        const match = serializedAssetVariantUrl.match(/^ *{/);

        if (match === null) {
            return serializedAssetVariantUrl;
        }
    }

    let assetVariantUrl: unknown;

    try {
        assetVariantUrl = JSON.parse(serializedAssetVariantUrl);
    } catch {
        throw new Error(`${serializedAssetVariantUrl} is not a valid JSON`);
    }

    try {
        zAssetVariantUrl.parse(assetVariantUrl);
    } catch (error) {
        throw new Error(
            `${serializedAssetVariantUrl} is sot a valid AssetVariantUrl: ${String(
                error
            )}`
        );
    }
    assert(is<AssetVariantUrl>(assetVariantUrl));

    return assetVariantUrl;
}

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
