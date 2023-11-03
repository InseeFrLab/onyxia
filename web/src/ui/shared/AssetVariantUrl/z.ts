import { z } from "zod";
import { zLocalizedString } from "ui/i18n/z";
import { assert } from "tsafe/assert";
import { is } from "tsafe/is";
import type { AssetVariantUrl } from "./AssetVariantUrl";

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
            `${serializedAssetVariantUrl} is not a valid AssetVariantUrl: ${String(
                error
            )}`
        );
    }
    assert(is<AssetVariantUrl>(assetVariantUrl));

    return assetVariantUrl;
}
