import { useMemo } from "react";
import { useResolveLocalizedString } from "ui/i18n";
import { useIsDarkModeEnabled } from "onyxia-ui";
import type { AssetVariantUrl } from "./AssetVariantUrl";
import { resolveAssetVariantUrl } from "./resolveAssetVariantUrl";

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
