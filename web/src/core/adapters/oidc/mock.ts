import type { Oidc } from "core/ports/Oidc";
import { createMockOidc } from "oidc-spa/mock";

export async function createOidc(params: {
    isUserInitiallyLoggedIn: boolean;
}): Promise<Oidc> {
    const { isUserInitiallyLoggedIn } = params;

    const oidc = await createMockOidc({
        isUserInitiallyLoggedIn,
        "mockedTokens": {
            "decodedIdToken": {}
        }
    });

    return oidc;
}
