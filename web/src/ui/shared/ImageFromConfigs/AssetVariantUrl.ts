import { type LocalizedString } from "ui/i18n";
import { z } from "zod";
import { zLocalizedString } from "ui/i18n/z";
import { assert } from "tsafe/assert";

export type AssetVariantUrl =
    | LocalizedString
    | {
          light: LocalizedString;
          dark: LocalizedString;
      };

export const zAssetVariantUrl = z.union([
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
