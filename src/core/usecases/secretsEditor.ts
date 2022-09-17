import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import type { ThunkAction } from "../setup";
import type { SecretWithMetadata } from "core/ports/SecretsManagerClient";
import { assert } from "tsafe/assert";
import { join as pathJoin } from "path";
import { unwrapWritableDraft } from "core/tools/unwrapWritableDraft";
import { interUsecasesThunks as explorersThunks } from "./explorers";

export type SecretsEditorState = {
    directoryPath: string;
    basename: string;
    /** undefined when is being opened */
    secretWithMetadata: SecretWithMetadata | undefined;
    hiddenKeys: string[];
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
    | {
          action: "hideOrRevealKey";
          type: "hide" | "reveal";
          key: string;
      }
);

const extraKey = ".onyxia";
type ExtraValue = { hiddenKeys: string[]; keysOrdering: string[] };

export const name = "secretsEditor";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<SecretsEditorState | null>(null),
    "reducers": {
        "openStarted": (
            _state,
            {
                payload,
            }: PayloadAction<{
                directoryPath: string;
                basename: string;
            }>,
        ) => {
            const { basename, directoryPath } = payload;

            return id<SecretsEditorState>({
                directoryPath,
                basename,
                "secretWithMetadata": undefined,
                "hiddenKeys": [],
                "isBeingUpdated": true,
            });
        },
        "openCompleted": (
            state,
            {
                payload,
            }: PayloadAction<{
                secretWithMetadata: SecretWithMetadata;
                hiddenKeys: string[];
            }>,
        ) => {
            const { secretWithMetadata, hiddenKeys } = payload;

            assert(state !== null);

            //NOTE: we use unwrapWritableDraft because otherwise the type
            //instantiation is too deep. But unwrapWritableDraft is the id function
            unwrapWritableDraft(state).secretWithMetadata = secretWithMetadata;
            state.hiddenKeys = hiddenKeys;
            state.isBeingUpdated = false;
        },
        "editSecretStarted": (state, { payload }: PayloadAction<EditSecretParams>) => {
            const { key } = payload;

            assert(state !== null);

            //NOTE: we use unwrapWritableDraft because otherwise the type
            //instantiation is too deep. But unwrapWritableDraft is the id function
            const { secretWithMetadata } = unwrapWritableDraft(state);

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
                    key_i =>
                        (secret[key_i === key ? newKey : key_i] = secretClone[key_i]),
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
                case "hideOrRevealKey":
                    {
                        const { key, type } = payload;

                        switch (type) {
                            case "hide":
                                state.hiddenKeys.push(key);
                                break;
                            case "reveal":
                                state.hiddenKeys = state.hiddenKeys.filter(
                                    key_i => key_i !== key,
                                );
                                break;
                        }
                    }
                    break;
            }

            state.isBeingUpdated = true;
        },
        "editSecretCompleted": state => {
            assert(state !== null);

            const { secretWithMetadata } = unwrapWritableDraft(state);

            assert(secretWithMetadata !== undefined);

            const { metadata } = secretWithMetadata;

            metadata.created_time = new Date().toISOString();
            metadata.version++;

            state.isBeingUpdated = false;
        },
        "closeSecret": () => null,
    },
});

export const thunks = {
    /**
     * NOTE: It IS possible to navigate to a secret currently being renamed or created.
     */
    "openSecret":
        (params: { directoryPath: string; basename: string }): ThunkAction =>
        async (...args) => {
            const [dispatch] = args;

            const { directoryPath, basename } = params;

            //TODO: Update state to say that we are opening a file.
            dispatch(actions.openStarted({ directoryPath, basename }));

            const path = pathJoin(directoryPath, basename);

            const { loggedFsApi } = dispatch(explorersThunks.getLoggedSecretsApis());

            const secretWithMetadata = await loggedFsApi.get({ path });

            const { secret } = secretWithMetadata;

            const { hiddenKeys, keysOrdering } = (() => {
                try {
                    const { hiddenKeys, keysOrdering } = secret[extraKey] as ExtraValue;

                    for (const arr of [hiddenKeys, keysOrdering]) {
                        assert(
                            arr instanceof Array &&
                                arr.every(key => typeof key === "string"),
                        );
                    }

                    return {
                        hiddenKeys,
                        "keysOrdering": keysOrdering.filter(key => key in secret),
                    };
                } catch {
                    return {
                        "hiddenKeys": id<string[]>([]),
                        "keysOrdering": Object.keys(secret),
                    };
                }
            })();

            const orderedSecret = { ...secret };

            delete orderedSecret[extraKey];

            keysOrdering.forEach(key => delete orderedSecret[key]);

            keysOrdering.forEach(key => (orderedSecret[key] = secret[key]));

            dispatch(
                actions.openCompleted({
                    "secretWithMetadata": {
                        "metadata": secretWithMetadata.metadata,
                        "secret": orderedSecret,
                    },
                    hiddenKeys,
                }),
            );
        },
    "closeSecret": (): ThunkAction<void> => dispatch => dispatch(actions.closeSecret()),
    "editCurrentlyShownSecret":
        (params: EditSecretParams): ThunkAction =>
        async (...args) => {
            const [dispatch] = args;

            const { loggedFsApi } = dispatch(explorersThunks.getLoggedSecretsApis());

            const getSecretCurrentPathAndHiddenKeys = () => {
                const [, getState] = args;

                const state = getState().secretsEditor;

                assert(state !== null);

                const { secretWithMetadata, hiddenKeys } = state;

                assert(secretWithMetadata !== undefined);

                return {
                    "path": pathJoin(state.directoryPath, state.basename),
                    hiddenKeys,
                    "secret": secretWithMetadata.secret,
                };
            };

            //Optimizations
            {
                const { key } = params;
                const { secret } = getSecretCurrentPathAndHiddenKeys();

                switch (params.action) {
                    case "addOrOverwriteKeyValue":
                        {
                            const { value } = params;
                            if (secret[key] === value) {
                                return;
                            }
                        }
                        break;
                    case "renameKey":
                        {
                            const { newKey } = params;
                            if (key === newKey) {
                                return;
                            }
                        }
                        break;
                    case "renameKeyAndUpdateValue":
                        {
                            const { newKey, newValue } = params;
                            if (key === newKey && secret[key] === newValue) {
                                return;
                            }
                        }
                        break;
                    case "removeKeyValue":
                        if (!(key in secret)) {
                            return;
                        }
                        break;
                }
            }

            dispatch(actions.editSecretStarted(params));

            await loggedFsApi.put(
                (() => {
                    const { path, secret, hiddenKeys } =
                        getSecretCurrentPathAndHiddenKeys();

                    return {
                        path,
                        "secret": {
                            ...secret,
                            [extraKey]: id<ExtraValue>({
                                hiddenKeys,
                                "keysOrdering": Object.keys(secret),
                            }),
                        },
                    };
                })(),
            );

            dispatch(actions.editSecretCompleted());
        },
};
