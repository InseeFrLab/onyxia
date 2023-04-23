import { assert } from "tsafe/assert";
import type { User } from "../ports/GetUser";
import type { ThunkAction } from "../core";
import { createUsecaseContextApi } from "redux-clean-architecture";

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
            const [, , { oidc }] = args;

            return oidc.isUserLoggedIn;
        },
    "login":
        (params: { doesCurrentHrefRequiresAuth: boolean }): ThunkAction<Promise<never>> =>
        (...args) => {
            const { doesCurrentHrefRequiresAuth } = params;

            const [, , { oidc }] = args;

            assert(!oidc.isUserLoggedIn);

            return oidc.login({ doesCurrentHrefRequiresAuth });
        },
    "logout":
        (params: { redirectTo: "home" | "current page" }): ThunkAction<Promise<never>> =>
        (...args) => {
            const { redirectTo } = params;

            const [, , { oidc }] = args;

            assert(oidc.isUserLoggedIn);

            return oidc.logout({ redirectTo });
        }
};

export const privateThunks = {
    "initialize":
        (): ThunkAction =>
        async (...[, , extraArg]) =>
            setContext(extraArg, {
                "user": !extraArg.oidc.isUserLoggedIn
                    ? undefined
                    : await extraArg.getUser()
            })
};

type SliceContext = {
    /** undefined when not authenticated */
    user: User | undefined;
};

const { getContext, setContext } = createUsecaseContextApi<SliceContext>();
