import type { Oidc } from "core/ports/Oidc";
import { createMockOidc } from "oidc-spa/mock";

export function createOidc(params: { isUserInitiallyLoggedIn: boolean }): Oidc {
    const { isUserInitiallyLoggedIn } = params;

    const oidc = createMockOidc({
        isUserInitiallyLoggedIn,
        "mockedTokens": {
            "decodedIdToken": {}
        }
    });

    return oidc;
}
