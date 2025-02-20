import type { Oidc } from "core/ports/Oidc";
import { createMockOidc } from "oidc-spa/mock";

export async function createOidc(params: {
    isUserInitiallyLoggedIn: boolean;
}): Promise<Oidc> {
    const { isUserInitiallyLoggedIn } = params;

    const oidc = await createMockOidc({
        isUserInitiallyLoggedIn,
        homeUrl: import.meta.env.BASE_URL,
        mockedTokens: {
            decodedIdToken: {}
        }
    });

    if (!oidc.isUserLoggedIn) {
        return oidc;
    }

    return {
        ...oidc,
        getTokens: async () => oidc.getTokens()
    };
}
