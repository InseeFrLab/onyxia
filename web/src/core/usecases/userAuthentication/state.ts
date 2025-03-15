import type { User } from "core/ports/OnyxiaApi";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";

export const name = "userAuthentication";

// Just so it can be accessed in other selectors.
type State = State.NotLoggedIn | State.LoggedIn;

namespace State {
    export type NotLoggedIn = {
        isUserLoggedIn: false;
    };
    export type LoggedIn = {
        isUserLoggedIn: true;
        user: User;
        isKeycloak: boolean;
    };
}

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>({
        debugMessage: "Not initialized yet"
    }),
    reducers: {
        initialized: (_, { payload }: { payload: State }) => payload
    }
});
