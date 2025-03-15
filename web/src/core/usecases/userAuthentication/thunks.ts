import { assert } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { parseKeycloakIssuerUri } from "oidc-spa/tools/parseKeycloakIssuerUri";

export const thunks = {
    login:
        (params: { doesCurrentHrefRequiresAuth: boolean }) =>
        (...args): Promise<never> => {
            const { doesCurrentHrefRequiresAuth } = params;

            const [, , { oidc }] = args;

            assert(!oidc.isUserLoggedIn);

            return oidc.login({ doesCurrentHrefRequiresAuth });
        },
    logout:
        (params: { redirectTo: "home" | "current page" }) =>
        (...args): Promise<never> => {
            const { redirectTo } = params;

            const [, , { oidc }] = args;

            assert(oidc.isUserLoggedIn);

            return oidc.logout({ redirectTo });
        },
    kcRedirectToAccountConsole:
        () =>
        (...args): Promise<never> => {
            const [, , { oidc, paramsOfBootstrapCore }] = args;

            assert(oidc.isUserLoggedIn);

            const keycloak = parseKeycloakIssuerUri(oidc.params.issuerUri);

            assert(keycloak !== undefined);

            window.location.href = keycloak.getAccountUrl({
                backToAppFromAccountUrl: window.location.href,
                clientId: oidc.params.clientId,
                locale: paramsOfBootstrapCore.getCurrentLang()
            });

            return new Promise<never>(() => {});
        }
} satisfies Thunks;

export const protectedThunks = {
    initialize:
        () =>
        async (...args) => {
            const [dispatch, , rootContext] = args;
            const { oidc, onyxiaApi } = rootContext;

            dispatch(
                actions.initialized(
                    !oidc.isUserLoggedIn
                        ? { isUserLoggedIn: false }
                        : {
                              isUserLoggedIn: true,
                              user: (await onyxiaApi.getUserAndProjects()).user,
                              isKeycloak:
                                  parseKeycloakIssuerUri(oidc.params.issuerUri) !==
                                  undefined
                          }
                )
            );
        },
    getTokens:
        () =>
        async (...args) => {
            const [, , { oidc }] = args;

            assert(oidc.isUserLoggedIn);

            const { decodedIdToken, accessToken, refreshToken } = await oidc.getTokens();

            return { decodedIdToken, accessToken, refreshToken };
        }
} satisfies Thunks;
