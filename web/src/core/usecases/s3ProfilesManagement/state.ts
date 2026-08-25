import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";
import type { OidcParams_Partial } from "core/ports/OnyxiaApi/OidcParams";

export type State = {
    ambientProfileName: string | undefined;
    decodedIdTokens:
        | {
              oidcParams: OidcParams_Partial;
              decodedIdToken: Record<string, unknown>;
          }[]
        | undefined;
};

export const name = "s3ProfilesManagement";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>(),
    reducers: {
        initialized: (
            _,
            {
                payload
            }: {
                payload: {
                    decodedIdTokens: State["decodedIdTokens"];
                };
            }
        ) => {
            const { decodedIdTokens } = payload;

            const state: State = {
                ambientProfileName: undefined,
                decodedIdTokens
            };

            return state;
        },
        ambientProfileChanged: (
            state,
            { payload }: { payload: { profileName: string } }
        ) => {
            const { profileName } = payload;

            state.ambientProfileName = profileName;
        }
    }
});
