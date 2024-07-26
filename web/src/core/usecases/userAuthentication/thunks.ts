import { assert } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import { actions } from "./state";

export const thunks = {
    "login":
        (params: { doesCurrentHrefRequiresAuth: boolean }) =>
        (...args): Promise<never> => {
            const { doesCurrentHrefRequiresAuth } = params;

            const [, , { oidc }] = args;

            assert(!oidc.isUserLoggedIn);

            return oidc.login({ doesCurrentHrefRequiresAuth });
        },
    "logout":
        (params: { redirectTo: "home" | "current page" }) =>
        (...args): Promise<never> => {
            const { redirectTo } = params;

            const [, , { oidc }] = args;

            assert(oidc.isUserLoggedIn);

            return oidc.logout({ redirectTo });
        }
} satisfies Thunks;

export const protectedThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, , rootContext] = args;
            const { oidc, onyxiaApi } = rootContext;

            dispatch(
                actions.initialized(
                    !oidc.isUserLoggedIn
                        ? { "isUserLoggedIn": false }
                        : {
                              "isUserLoggedIn": true,
                              "user": (await onyxiaApi.getUserAndProjects()).user,
                              "decodedIdToken": oidc.getTokens().decodedIdToken
                          }
                )
            );
        },
    "getDecodedIdToken":
        () =>
        (...args) => {
            const [, , { oidc }] = args;

            assert(oidc.isUserLoggedIn);

            const { decodedIdToken } = oidc.getTokens();

            return decodedIdToken;
        }
} satisfies Thunks;
