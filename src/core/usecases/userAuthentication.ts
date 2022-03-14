import { assert } from "tsafe/assert";
import type { User } from "../ports/UserApiClient";
import type { ThunkAction, ThunksExtraArgument } from "../setup";
import { urlJoin } from "url-join-ts";

export const name = "userAuthentication";

export const reducer = null;

export const thunks = {
    "getUser":
        (): ThunkAction<User> =>
        (...args) => {
            const [, , extraArg] = args;

            const { user } = getSliceContexts(extraArg);

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
        (): ThunkAction<Promise<never>> =>
        (...args) => {
            const [, , { oidcClient }] = args;

            assert(!oidcClient.isUserLoggedIn);

            return oidcClient.login();
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

            return getSliceContexts(extraArgs).keycloakAccountConfigurationUrl;
        },
};

export const privateThunks = {
    "initialize":
        (): ThunkAction =>
        async (...[, , extraArg]) =>
            setSliceContext(extraArg, {
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
                              "account",
                          );
                })(),
            }),
};

type SliceContext = {
    /** undefined when not authenticated */
    user: User | undefined;
    /** Undefined it authentication is not keycloak */
    keycloakAccountConfigurationUrl: string | undefined;
};

const { getSliceContexts, setSliceContext } = (() => {
    const weakMap = new WeakMap<ThunksExtraArgument, SliceContext>();

    function getSliceContexts(extraArg: ThunksExtraArgument): SliceContext {
        const sliceContext = weakMap.get(extraArg);

        assert(sliceContext !== undefined, "Slice context not initialized");

        return sliceContext;
    }

    function setSliceContext(
        extraArg: ThunksExtraArgument,
        sliceContext: SliceContext,
    ): void {
        weakMap.set(extraArg, sliceContext);
    }

    return { getSliceContexts, setSliceContext };
})();
