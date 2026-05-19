import "minimal-polyfills/Object.fromEntries";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";
import type { Technology } from "./decoupledLogic/codeSnippets";
import { assert, id } from "tsafe";
import { technologies } from "./decoupledLogic/codeSnippets";

type State = {
    accessCredentials:
        | {
              areTokensBeingRenewed: boolean;
              accessKeyId: string;
              secretAccessKey: string;
              sessionToken: string | undefined;
              expirationTime: number | undefined;
          }
        | undefined;
    technology: Technology;
};

export const name = "s3ProfilesDetailsUiController";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>(),
    reducers: {
        loaded: (
            _state,
            {
                payload
            }: {
                payload: {
                    accessCredentials:
                        | {
                              accessKeyId: string;
                              secretAccessKey: string;
                              sessionToken: string | undefined;
                              expirationTime: number | undefined;
                          }
                        | undefined;
                };
            }
        ) => {
            const { accessCredentials } = payload;

            return id<State>({
                accessCredentials:
                    accessCredentials === undefined
                        ? undefined
                        : {
                              ...accessCredentials,
                              areTokensBeingRenewed: false
                          },
                technology: technologies[0]
            });
        },
        tokenRenewalStarted: state => {
            assert(state.accessCredentials !== undefined);
            state.accessCredentials.areTokensBeingRenewed = true;
        },
        tokenRenewed: (
            state,
            {
                payload
            }: {
                payload: {
                    accessKeyId: string;
                    secretAccessKey: string;
                    sessionToken: string | undefined;
                    expirationTime: number;
                };
            }
        ) => {
            state.accessCredentials = {
                ...payload,
                areTokensBeingRenewed: false
            };
        },
        technologyChanged: (
            state,
            { payload }: { payload: { technology: Technology } }
        ) => {
            const { technology } = payload;
            state.technology = technology;
        }
    }
});
