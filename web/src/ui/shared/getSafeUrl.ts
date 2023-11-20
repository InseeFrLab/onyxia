import { getSafeUrl as getSafeUrl_base } from "onyxia-ui/tools/getSafeUrl";
import { kcContext } from "keycloak-theme/login/kcContext";
import { assert } from "tsafe/assert";

export function getSafeUrl(url: string) {
    getSafeUrl_base(url);

    if (kcContext !== undefined) {
        const ALLOWED_ASSET_ORIGIN = (kcContext as any).properties.ALLOWED_ASSET_ORIGIN;

        assert(ALLOWED_ASSET_ORIGIN !== undefined);

        if (ALLOWED_ASSET_ORIGIN !== "*") {
            assert(url.startsWith(ALLOWED_ASSET_ORIGIN));
        }
    } else {
        assert(url.startsWith("/"));
    }

    return url;
}
