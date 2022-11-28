import { assert } from "tsafe/assert";
import type { User } from "../ports/UserApiClient";
import type { ThunkAction } from "../setup";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { urlJoin } from "url-join-ts";

export const name = "userAuthentication";

export const reducer = null;

export const thunks = {
    "getUser":
        (): ThunkAction<User> =>
        (...args) => {
            const [, , extraArg] = args;

            const { user } = getContext(extraArg);

            assert(user !== undefined, "Can't use getUser when not authenticated");

            return user;
        },
    "getIsUserLoggedIn":
        (): ThunkAction<boolean> =>
        (...args) => {
            const [, , { oidcClient }] = args;

            return oidcClient.isUserLoggedIn;
        },
    "login":
        (params: { doesCurrentHrefRequiresAuth: boolean }): ThunkAction<Promise<never>> =>
        (...args) => {
            const { doesCurrentHrefRequiresAuth } = params;

            const [, , { oidcClient }] = args;

            assert(!oidcClient.isUserLoggedIn);

            return oidcClient.login({ doesCurrentHrefRequiresAuth });
        },
    "logout":
        (params: { redirectTo: "home" | "current page" }): ThunkAction<Promise<never>> =>
        (...args) => {
            const { redirectTo } = params;

            const [, , { oidcClient }] = args;

            assert(oidcClient.isUserLoggedIn);

            return oidcClient.logout({ redirectTo });
        },
    "getKeycloakAccountConfigurationUrl":
        (): ThunkAction<string | undefined> =>
        (...args) => {
            const [, , extraArgs] = args;

            return getContext(extraArgs).keycloakAccountConfigurationUrl;
        }
};

export const privateThunks = {
    "initialize":
        (): ThunkAction =>
        async (...[, , extraArg]) =>
            setContext(extraArg, {
                "user": !extraArg.oidcClient.isUserLoggedIn
                    ? undefined
                    : await extraArg.userApiClient.getUser(),

                "keycloakAccountConfigurationUrl": (() => {
                    const { userAuthenticationParams } = extraArg.createStoreParams;

                    return userAuthenticationParams.method !== "keycloak"
                        ? undefined
                        : urlJoin(
                              userAuthenticationParams.keycloakParams.url,
                              "realms",
                              userAuthenticationParams.keycloakParams.realm,
                              "account"
                          );
                })()
            })
};

type SliceContext = {
    /** undefined when not authenticated */
    user: User | undefined;
    /** Undefined it authentication is not keycloak */
    keycloakAccountConfigurationUrl: string | undefined;
};

const { getContext, setContext } = createUsecaseContextApi<SliceContext>();
