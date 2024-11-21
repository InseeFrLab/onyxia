import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import type { Thunks, State as RootState } from "core/bootstrap";
import type { SecretWithMetadata } from "core/ports/SecretsManager";
import { assert } from "tsafe/assert";
import { join as pathJoin } from "pathe";
import * as secretExplorer from "./secretExplorer";

type State = {
    directoryPath: string;
    basename: string;
    /** undefined when is being opened */
    secretWithMetadata: SecretWithMetadata | undefined;
    isBeingUpdated: boolean;
};

export type EditSecretParams = {
    key: string;
} & (
    | {
          action: "addOrOverwriteKeyValue";
          value: string;
      }
    | {
          action: "renameKey";
          newKey: string;
      }
    | {
          action: "renameKeyAndUpdateValue";
          newKey: string;
          newValue: string;
      }
    | {
          action: "removeKeyValue";
      }
);

export const name = "secretsEditor";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State | null>(null),
    reducers: {
        openStarted: (
            _state,
            {
                payload
            }: {
                payload: {
                    directoryPath: string;
                    basename: string;
                };
            }
        ) => {
            const { basename, directoryPath } = payload;

            return id<State>({
                directoryPath,
                basename,
                secretWithMetadata: undefined,
                isBeingUpdated: true
            });
        },
        openCompleted: (
            state,
            {
                payload
            }: {
                payload: {
                    secretWithMetadata: SecretWithMetadata;
                };
            }
        ) => {
            const { secretWithMetadata } = payload;

            assert(state !== null);

            // Here we need to do as State otherwise the type instantiation is too deep
            // because of immer's WritableDraft.
            (state as State).secretWithMetadata = secretWithMetadata;
            state.isBeingUpdated = false;
        },
        editSecretStarted: (state_, { payload }: { payload: EditSecretParams }) => {
            const { key } = payload;

            assert(state_ !== null);

            const state = state_ as State;

            //NOTE: we use unwrapWritableDraft because otherwise the type
            //instantiation is too deep. But unwrapWritableDraft is the id function
            const { secretWithMetadata } = state;

            assert(secretWithMetadata !== undefined);

            const { secret } = secretWithMetadata;

            //By doing that we preserve the ordering of the
            //properties in the record.
            const renameKey = (params: { newKey: string }) => {
                const { newKey } = params;

                const secretClone = { ...secret };

                Object.keys(secretClone).forEach(key => {
                    delete secret[key];
                });

                Object.keys(secretClone).forEach(
                    key_i => (secret[key_i === key ? newKey : key_i] = secretClone[key_i])
                );
            };

            switch (payload.action) {
                case "addOrOverwriteKeyValue":
                    {
                        const { value } = payload;
                        secret[key] = value;
                    }
                    break;
                case "removeKeyValue":
                    delete secret[key];
                    break;
                case "renameKeyAndUpdateValue":
                    {
                        const { newKey, newValue } = payload;

                        renameKey({ newKey });
                        secret[newKey] = newValue;
                    }
                    break;
                case "renameKey":
                    {
                        const { newKey } = payload;
                        renameKey({ newKey });
                    }
                    break;
            }

            state.isBeingUpdated = true;
        },
        editSecretCompleted: state => {
            assert(state !== null);

            const { secretWithMetadata } = state;

            assert(secretWithMetadata !== undefined);

            const { metadata } = secretWithMetadata;

            metadata.created_time = new Date().toISOString();
            metadata.version++;

            state.isBeingUpdated = false;
        },
        closeSecret: () => null
    }
});

export const thunks = {
    /**
     * NOTE: It IS possible to navigate to a secret currently being renamed or created.
     */
    openSecret:
        (params: { directoryPath: string; basename: string }) =>
        async (...args) => {
            const [dispatch] = args;

            const { directoryPath, basename } = params;

            //TODO: Update state to say that we are opening a file.
            dispatch(actions.openStarted({ directoryPath, basename }));

            const path = pathJoin(directoryPath, basename);

            const { loggedSecretClient } = dispatch(
                secretExplorer.protectedThunks.getLoggedSecretsApis()
            );

            const secretWithMetadata = await loggedSecretClient.get({ path });

            dispatch(
                actions.openCompleted({
                    secretWithMetadata
                })
            );
        },
    closeSecret:
        () =>
        (...args) => {
            const [dispatch] = args;
            dispatch(actions.closeSecret());
        },
    editCurrentlyShownSecret:
        (params: EditSecretParams) =>
        async (...args) => {
            const [dispatch] = args;

            const { loggedSecretClient } = dispatch(
                secretExplorer.protectedThunks.getLoggedSecretsApis()
            );

            const [, getState] = args;

            dispatch(actions.editSecretStarted(params));

            const state = getState()[name];

            assert(state !== null);

            assert(state.secretWithMetadata !== undefined);

            const { secret } = state.secretWithMetadata;

            await loggedSecretClient.put({
                path: pathJoin(state.directoryPath, state.basename),
                secret
            });

            dispatch(actions.editSecretCompleted());
        }
} satisfies Thunks;

export const selectors = (() => {
    const main = (rootState: RootState): State | null => rootState[name];

    return { main };
})();
