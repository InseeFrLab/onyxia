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
        providerSpecific:
            | {
                  type: "keycloak";
                  actionResult: KcActionResult | undefined;
              }
            | {
                  type: "other";
              };
    };
}

export type KcActionResult =
    | {
          kc_action: "CHANGE_PASSWORD";
          isSuccess: boolean;
      }
    | {
          kc_action: "UPDATE_PROFILE";
          isSuccess: boolean;
      }
    | {
          kc_action: "delete_account";
      };

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>({
        debugMessage: "Not initialized yet"
    }),
    reducers: {
        initialized: (_, { payload }: { payload: State }) => payload
    }
});
