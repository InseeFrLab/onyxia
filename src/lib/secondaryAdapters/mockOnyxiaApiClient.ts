

import type { OnyxiaApiClient, Region, Build } from "../ports/OnyxiaApiClient";
import memoize from "memoizee";

export function createMockOnyxiaApiClient(
    params: {
        regions: Region[];
        build: Build;
    }
): { onyxiaApiClient: OnyxiaApiClient; } {

    const { regions, build } = params;

    const onyxiaApiClient: OnyxiaApiClient = {
        //"getUserInfo": () => Promise.resolve({ ip, nomComplet }),
        "getConfigurations": memoize(()=> Promise.resolve({ regions, build }), { "promise": true })
    };

    return { onyxiaApiClient };

}