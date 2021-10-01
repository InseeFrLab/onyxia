import { assert } from "tsafe/assert";
import type { User } from "../ports/UserApiClient";
import type { ThunkAction, ThunksExtraArgument } from "../setup";

const userByStoreInst = new WeakMap<ThunksExtraArgument, User>();

export const name = "userAuthentication";

export const thunks = {
    "getUser":
        (): ThunkAction<User> =>
        (...args) => {
            const [, , extraArg] = args;

            assert(extraArg.oidcClient.isUserLoggedIn);

            return userByStoreInst.get(extraArg)!;
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
};

export const privateThunks = {
    "initialize":
        (): ThunkAction =>
        async (...args) => {
            const [, , extraArg] = args;

            if (!extraArg.oidcClient.isUserLoggedIn) {
                return;
            }

            userByStoreInst.set(extraArg, await extraArg.userApiClient.getUser());
        },
};
