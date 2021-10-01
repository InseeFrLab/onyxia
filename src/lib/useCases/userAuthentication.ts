import { assert } from "tsafe/assert";
import type { User } from "../ports/UserApiClient";
import type { AppThunk, ThunksExtraArgument } from "../setup";

const userByStoreInst = new WeakMap<ThunksExtraArgument, User>();

export const name = "userAuthentication";

export const thunks = {
    "getUser":
        (): AppThunk<User> =>
        (...args) => {
            const [, , extraArg] = args;

            assert(extraArg.oidcClient.isUserLoggedIn);

            return userByStoreInst.get(extraArg)!;
        },
    "getIsUserLoggedIn":
        (): AppThunk<boolean> =>
        (...args) => {
            const [, , { oidcClient }] = args;

            return oidcClient.isUserLoggedIn;
        },
    "login":
        (): AppThunk<Promise<never>> =>
        (...args) => {
            const [, , { oidcClient }] = args;

            assert(!oidcClient.isUserLoggedIn);

            return oidcClient.login();
        },
    "logout":
        (params: { redirectTo: "home" | "current page" }): AppThunk<Promise<never>> =>
        (...args) => {
            const { redirectTo } = params;

            const [, , { oidcClient }] = args;

            assert(oidcClient.isUserLoggedIn);

            return oidcClient.logout({ redirectTo });
        },
};

export const privateThunks = {
    "initialize":
        (): AppThunk =>
        async (...args) => {
            const [, , extraArg] = args;

            if (!extraArg.oidcClient.isUserLoggedIn) {
                return;
            }

            userByStoreInst.set(extraArg, await extraArg.userApiClient.getUser());
        },
};
