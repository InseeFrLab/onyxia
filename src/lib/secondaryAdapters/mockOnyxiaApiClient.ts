

import type { OnyxiaApiClient } from "../ports/OnyxiaApiClient";

export function createMockOnyxiaApiClient(
    params: {
        ip: string;
        nomComplet: string;
    }
): { onyxiaApiClient: OnyxiaApiClient; } {

    const { ip, nomComplet } = params;

    const onyxiaApiClient: OnyxiaApiClient = {
        "getUserInfo": () => Promise.resolve({ ip, nomComplet })
    };

    return { onyxiaApiClient };

}