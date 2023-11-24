import { assert } from "tsafe/assert";
import type { User } from "core/ports/OnyxiaApi";
import type { Thunks } from "core/bootstrap";
import {
    createUsecaseActions,
    createUsecaseContextApi,
    createObjectThatThrowsIfAccessed
} from "redux-clean-architecture";

export const name = "userAuthentication";

// Just so it can be accessed in other selectors.
type State = { isUserLoggedIn: boolean };

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>({
        "debugMessage": "Not initialized"
    }),
    "reducers": {
        "initialized": (_, { payload }: { payload: { isUserLoggedIn: boolean } }) => {
            const { isUserLoggedIn } = payload;

            return { isUserLoggedIn };
        }
    }
});

export const thunks = {
    "getUser":
        () =>
        (...args): User => {
            const [, , rootContext] = args;

            const { user } = getContext(rootContext);

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
            const [dispatch, , rootContext] = args;
            const { oidc, onyxiaApi } = rootContext;
            setContext(rootContext, {
                "user": !oidc.isUserLoggedIn ? undefined : await onyxiaApi.getUser()
            });
            dispatch(actions.initialized({ "isUserLoggedIn": oidc.isUserLoggedIn }));
        }
} satisfies Thunks;

const { getContext, setContext } = createUsecaseContextApi<{
    user: User | undefined;
}>();
