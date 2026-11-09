import { assert } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { createKeycloakUtils, isKeycloak } from "oidc-spa/keycloak";

export const thunks = {
    login:
        (params: { doesCurrentHrefEnforceLogin: boolean }) =>
        (...args): Promise<never> => {
            const { doesCurrentHrefEnforceLogin } = params;

            const [, , { oidc }] = args;

            assert(!oidc.isUserLoggedIn);

            if (oidc.initializationError !== undefined) {
                console.error(oidc.initializationError);
                alert("Authentication service seems down. Try again?");
            }

            return oidc.login({ doesCurrentHrefEnforceLogin });
        },
    logout:
        () =>
        (...args): Promise<never> => {
            const [, , { oidc }] = args;

            assert(oidc.isUserLoggedIn);

            return oidc.logout();
        },
    kcRedirectToAccountConsole:
        () =>
        (...args): Promise<never> => {
            const [, , { oidc, paramsOfBootstrapCore }] = args;

            assert(oidc.isUserLoggedIn);

            assert(isKeycloak({ issuerUri: oidc.issuerUri }));

            const keycloakUtils = createKeycloakUtils({
                issuerUri: oidc.issuerUri
            });

            window.location.href = keycloakUtils.getAccountUrl({
                clientId: oidc.clientId,
                locale: paramsOfBootstrapCore.getCurrentLang(),
                validRedirectUri: oidc.validRedirectUri
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
                              isKeycloak: isKeycloak({ issuerUri: oidc.issuerUri })
                          }
                )
            );
        }
} satisfies Thunks;
