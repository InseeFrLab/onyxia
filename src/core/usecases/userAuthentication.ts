import { assert } from "tsafe/assert";
import type { User } from "../ports/GetUser";
import type { Thunks } from "../core";
import { createUsecaseContextApi } from "redux-clean-architecture";

export const name = "userAuthentication";

export const reducer = null;

export const thunks = {
    "getUser":
        () =>
        (...args): User => {
            const [, , extraArg] = args;

            const { user } = getContext(extraArg);

            assert(user !== undefined, "Can't use getUser when not authenticated");

            return user;
        },
    "getIsUserLoggedIn":
        () =>
        (...args): boolean => {
            const [, , { oidc }] = args;

            return oidc.isUserLoggedIn;
        },
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
            const [, , extraArg] = args;
            setContext(extraArg, {
                "user": !extraArg.oidc.isUserLoggedIn
                    ? undefined
                    : await extraArg.getUser()
            });
        }
} satisfies Thunks;

const { getContext, setContext } = createUsecaseContextApi<{
    user: User | undefined;
}>();
