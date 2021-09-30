import { assert } from "tsafe/assert";
import type { User } from "../ports/UserApiClient";
import type { AppThunk, Dependencies } from "../setup";

const userByDependenciesRef = new WeakMap<Dependencies, User>();

export const name = "userAuthentication";

export const thunks = {
    "getUser":
        (): AppThunk<User> =>
        (...args) => {
            const [, , dependencies] = args;

            assert(dependencies.oidcClient.isUserLoggedIn);

            return userByDependenciesRef.get(dependencies)!;
        },
    "getIsUserLoggedIn":
        (): AppThunk<boolean> =>
        (...args) => {
            const [, , dependencies] = args;

            return dependencies.oidcClient.isUserLoggedIn;
        },
    "login":
        (): AppThunk<Promise<never>> =>
        (...args) => {
            const [, , dependencies] = args;

            assert(!dependencies.oidcClient.isUserLoggedIn);

            return dependencies.oidcClient.login();
        },
    "logout":
        (params: { redirectTo: "home" | "current page" }): AppThunk<Promise<never>> =>
        (...args) => {
            const { redirectTo } = params;

            const [, , dependencies] = args;

            assert(dependencies.oidcClient.isUserLoggedIn);

            return dependencies.oidcClient.logout({ redirectTo });
        },
};

export const privateThunks = {
    "initialize":
        (): AppThunk =>
        async (...args) => {
            const [, , dependencies] = args;

            if (!dependencies.oidcClient.isUserLoggedIn) {
                return;
            }

            userByDependenciesRef.set(
                dependencies,
                await dependencies.userApiClient.getUser(),
            );
        },
};
