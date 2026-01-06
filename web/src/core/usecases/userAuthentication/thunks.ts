import { assert } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { createKeycloakUtils, isKeycloak } from "oidc-spa/keycloak";

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

            assert(isKeycloak({ issuerUri: oidc.params.issuerUri }));

            const keycloakUtils = createKeycloakUtils({
                issuerUri: oidc.params.issuerUri
            });

            window.location.href = keycloakUtils.getAccountUrl({
                backToAppFromAccountUrl: window.location.href,
                clientId: oidc.params.clientId,
                locale: paramsOfBootstrapCore.getCurrentLang(),
                validRedirectUri: oidc.params.validRedirectUri
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
                              isKeycloak: isKeycloak({ issuerUri: oidc.params.issuerUri })
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
