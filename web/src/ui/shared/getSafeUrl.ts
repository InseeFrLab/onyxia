import { getSafeUrl as getSafeUrl_base } from "onyxia-ui/tools/getSafeUrl";
import { kcContext } from "keycloak-theme/login/kcContext";
import { assert } from "tsafe/assert";

export function getSafeUrl(url: string) {
    getSafeUrl_base(url);

    if (kcContext !== undefined) {
        const allowedAssetOrigin = (kcContext as any).properties.ALLOWED_ASSET_ORIGIN;

        assert(allowedAssetOrigin !== undefined);

        if (allowedAssetOrigin !== "*") {
            assert(url.startsWith(allowedAssetOrigin));
        }
    } else {
        assert(url.startsWith("/"));
    }

    return url;
}
