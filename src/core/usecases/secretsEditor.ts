import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import type { ThunkAction, ThunksExtraArgument } from "../setup";
import type {
    SecretWithMetadata,
    SecretsManagerClient,
    Secret,
} from "core/ports/SecretsManagerClient";
import { assert } from "tsafe/assert";
import {
    basename as pathBasename,
    join as pathJoin,
    dirname as pathDirname,
    relative as pathRelative,
} from "path";
import { crawlFactory } from "core/tools/crawl";
import { unwrapWritableDraft } from "core/tools/unwrapWritableDraft";
import { getVaultApiLogger } from "../secondaryAdapters/vaultSecretsManagerClient";
import { logApi } from "core/tools/apiLogger";
import type { ApiLogs } from "core/tools/apiLogger";
import { selectors as projectSelectionSelectors } from "./projectSelection";

export type SecretExplorerState = {
    basename: string;
    secretWithMetadata: SecretWithMetadata;
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
    "initialState": id<SecretExplorerState>(null as any),
    "reducers": {
        "navigationTowardSecretSuccess": (
            _state,
            {
                payload,
            }: PayloadAction<
                Pick<
                    SecretExplorerState,
                    "basename" | "secretWithMetadata" | "hiddenKeys"
                >
            >,
        ) =>
            id<SecretExplorerState>({
                ...payload,
                "isBeingUpdated": false,
            }),
        "editSecretStarted": (state, { payload }: PayloadAction<EditSecretParams>) => {
            const { key } = payload;

            //NOTE: we use unwrapWritableDraft because otherwise the type
            //instantiation is too deep. But unwrapWritableDraft is the id function
            const { secret } = unwrapWritableDraft(state).secretWithMetadata;

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
            const { metadata } = state.secretWithMetadata;

            metadata.created_time = new Date().toISOString();
            metadata.version++;

            state.isBeingUpdated = false;
        },
    },
});

export const thunks = {
    /**
     * Assert:
     * We are currently showing a secret ( state === "SHOWING SECRET" ).
     * There is not already another secret with this name in the
     * directory the secret is in.
     * The secret is not already being renamed or deleted.
     */
    "renameCurrentlyShownSecret":
        (params: { newSecretBasename: string }): ThunkAction =>
        async (...args) => {
            const { newSecretBasename } = params;

            const [dispatch, getState, extraArg] = args;

            const { secretsManagerClientExtension } =
                augmentedClientBySoreInst.get(extraArg)!;

            const { secretExplorer: state } = getState();

            assert(state.state === "SHOWING SECRET");

            dispatch(
                actions.renameCurrentlyShownSecretStarted({
                    newSecretBasename,
                }),
            );

            const prReleaseMutex = getMutexes(extraArg).createOrRename.acquire();

            const error = await secretsManagerClientExtension
                .renameSecret({
                    "path": state.currentPath,
                    newSecretBasename,
                    "secret": state.secretWithMetadata.secret,
                })
                .then(
                    () => undefined,
                    (error: Error) => error,
                );

            prReleaseMutex.then(release => release());

            dispatch(
                error !== undefined
                    ? actions.errorOcurred({ "errorMessage": error.message })
                    : actions.renameCurrentlyShownSecretCompleted(),
            );
        },
    /**
     * Assert:
     * We are currently showing a directory (state === "SHOWING DIRECTORY")
     * The secret or directory we are renaming is present in the directory
     * currently listed.
     * The secret or directory we are about to rename is not  being
     * renamed or created.
     */
    "renameDirectoryOrSecretWithinCurrentDirectory":
        (params: {
            basename: string;
            newBasename: string;
            kind: "secret" | "directory";
        }): ThunkAction =>
        async (...args) => {
            const { basename, newBasename, kind } = params;

            const [dispatch, getState, extraArg] = args;

            const { secretsManagerClientExtension } =
                augmentedClientBySoreInst.get(extraArg)!;

            const { secretExplorer: state } = getState();

            assert(state.state === "SHOWING DIRECTORY");

            const path = pathJoin(state.currentPath, basename);

            dispatch(
                actions.renameDirectoryOrSecretWithinCurrentDirectoryStarted({
                    basename,
                    kind,
                    newBasename,
                }),
            );

            const prReleaseMutex = getMutexes(extraArg).createOrRename.acquire();

            const error = await (kind === "secret"
                ? secretsManagerClientExtension.renameSecret({
                      path,
                      "newSecretBasename": newBasename,
                  })
                : secretsManagerClientExtension.renameDirectory({
                      path,
                      newBasename,
                  })
            ).then(
                () => undefined,
                (error: Error) => error,
            );

            prReleaseMutex.then(release => release());

            dispatch(
                error !== undefined
                    ? actions.errorOcurred({ "errorMessage": error.message })
                    : actions.renameOrCreateDirectoryOrSecretWithinCurrentDirectoryCompleted(
                          {
                              "basename": newBasename,
                              kind,
                              "action": "rename",
                          },
                      ),
            );
        },
    /**
     * Assert:
     * We are currently showing a directory (state === "SHOWING DIRECTORY")
     */
    "createSecretOrDirectory":
        (params: { basename: string; kind: "secret" | "directory" }): ThunkAction =>
        async (...args) => {
            const { basename, kind } = params;

            const [dispatch, getState, extraArg] = args;

            const { secretsManagerClientProxy, secretsManagerClientExtension } =
                augmentedClientBySoreInst.get(extraArg)!;

            const { secretExplorer: state } = getState();

            assert(state.state === "SHOWING DIRECTORY");

            const path = pathJoin(state.currentPath, basename);

            dispatch(actions.createSecretOrDirectoryStarted({ basename, kind }));

            const prReleaseMutex = getMutexes(extraArg).createOrRename.acquire();

            const error = await (kind === "secret"
                ? secretsManagerClientProxy.put({
                      path,
                      "secret": {},
                  })
                : secretsManagerClientExtension.createDirectory({ path })
            ).then(
                () => undefined,
                (error: Error) => error,
            );

            prReleaseMutex.then(release => release());

            dispatch(
                error !== undefined
                    ? actions.errorOcurred({ "errorMessage": error.message })
                    : actions.renameOrCreateDirectoryOrSecretWithinCurrentDirectoryCompleted(
                          {
                              basename,
                              kind,
                              "action": "create",
                          },
                      ),
            );
        },

    /**
     * Assert:
     * We are currently showing a secret ( state === "SHOWING SECRET" ).
     * The secret is not already being renamed.
     */
    "deleteCurrentlyShownSecret":
        (): ThunkAction =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { secretExplorer: state } = getState();

            assert(state.state === "SHOWING SECRET");

            await dispatch(
                thunks.navigateToDirectory({
                    "fromCurrentPath": true,
                    "directoryRelativePath": "..",
                }),
            );

            await dispatch(
                thunks.deleteDirectoryOrSecretWithinCurrentDirectory({
                    "basename": pathBasename(state.currentPath),
                    "kind": "secret",
                }),
            );
        },

    /**
     * Assert:
     * We are currently showing a directory (state === "SHOWING DIRECTORY")
     * The secret or directory we are deleting is present in the directory
     * currently listed.
     * The secret or directory we are about to delete is not being
     * created or renamed.
     */
    "deleteDirectoryOrSecretWithinCurrentDirectory":
        (params: { basename: string; kind: "secret" | "directory" }): ThunkAction =>
        async (...args) => {
            const { basename, kind } = params;

            const [dispatch, getState, extraArg] = args;

            const { secretsManagerClientExtension, secretsManagerClientProxy } =
                augmentedClientBySoreInst.get(extraArg)!;

            const { secretExplorer: state } = getState();

            assert(state.state === "SHOWING DIRECTORY");

            const path = pathJoin(state.currentPath, basename);

            dispatch(
                actions.deleteDirectoryOrSecretWithinCurrentDirectoryStarted({
                    basename,
                    kind,
                }),
            );

            const error = await (kind === "secret"
                ? secretsManagerClientProxy.delete({
                      path,
                  })
                : secretsManagerClientExtension.deleteDirectory({ path })
            ).then(
                () => undefined,
                (error: Error) => error,
            );

            if (error !== undefined) {
                dispatch(actions.errorOcurred({ "errorMessage": error.message }));
            }
        },
    "editCurrentlyShownSecret":
        (params: EditSecretParams): ThunkAction =>
        async (...args) => {
            const [dispatch, , extraArg] = args;

            const { secretsManagerClientProxy } =
                augmentedClientBySoreInst.get(extraArg)!;

            const getSecretCurrentPathAndHiddenKeys = () => {
                const [, getState] = args;

                const state = getState().secretExplorer;

                assert(state.state === "SHOWING SECRET");

                const {
                    secretWithMetadata: { secret },
                    hiddenKeys,
                } = state;

                return {
                    "path": state.currentPath,
                    hiddenKeys,
                    secret,
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

            const error = await secretsManagerClientProxy
                .put(
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
                )
                .then(
                    () => undefined,
                    (error: Error) => error,
                );

            dispatch(
                error !== undefined
                    ? actions.errorOcurred({ "errorMessage": error.message })
                    : actions.editSecretCompleted(),
            );
        },
    "getSecretsManagerTranslations":
        (): ThunkAction<{ secretsManagerTranslations: ApiLogs }> =>
        (...args) => {
            const [, , extraArg] = args;

            const { secretsManagerTranslations } =
                augmentedClientBySoreInst.get(extraArg)!;

            return { secretsManagerTranslations };
        },
    "getIsEnabled":
        (): ThunkAction<boolean> =>
        (...args) => {
            const [, , { createStoreParams }] = args;

            return (
                createStoreParams.secretsManagerClientConfig.implementation !==
                "LOCAL STORAGE"
            );
        },
};

const augmentedClientBySoreInst = new WeakMap<
    ThunksExtraArgument,
    {
        secretsManagerClientProxy: SecretsManagerClient;
        secretsManagerClientExtension: ReturnType<
            typeof getSecretsManagerClientExtension
        >["secretsManagerClientExtension"];
        secretsManagerTranslations: ApiLogs;
    }
>();

export const privateThunks = {
    "initialize":
        (): ThunkAction<void> =>
        async (...args) => {
            const [, , extraArg] = args;

            const {
                apiLogs: secretsManagerTranslations,
                loggedApi: secretsManagerClientProxy,
            } = logApi({
                "api": extraArg.secretsManagerClient,
                "apiLogger": getVaultApiLogger({
                    "clientType": "CLI",
                    "engine": (() => {
                        const { secretsManagerClientConfig } = extraArg.createStoreParams;
                        switch (secretsManagerClientConfig.implementation) {
                            case "VAULT":
                                return secretsManagerClientConfig.engine;
                            case "LOCAL STORAGE":
                                return secretsManagerClientConfig.paramsForTranslator
                                    .engine;
                        }
                    })(),
                }),
            });

            const { secretsManagerClientExtension } = getSecretsManagerClientExtension({
                "secretsManagerClient": secretsManagerClientProxy,
            });

            augmentedClientBySoreInst.set(extraArg, {
                secretsManagerClientProxy,
                secretsManagerTranslations,
                secretsManagerClientExtension,
            });
        },
};

function getSecretsManagerClientExtension(props: {
    secretsManagerClient: SecretsManagerClient;
}) {
    const { secretsManagerClient } = props;

    const { crawl } = crawlFactory({
        "list": async ({ directoryPath }) => {
            const { directories, files } = await secretsManagerClient.list({
                "path": directoryPath,
            });

            return {
                "fileBasenames": files,
                "directoryBasenames": directories,
            };
        },
    });

    async function mvSecret(params: {
        srcPath: string;
        dstPath: string;
        secret?: Secret;
    }) {
        const { srcPath, dstPath } = params;

        if (pathRelative(srcPath, dstPath) === "") {
            return;
        }

        const {
            secret = (
                await secretsManagerClient.get({
                    "path": srcPath,
                })
            ).secret,
        } = params;

        await secretsManagerClient.delete({
            "path": srcPath,
        });

        await secretsManagerClient.put({
            "path": dstPath,
            secret,
        });
    }

    const secretsManagerClientExtension = {
        "renameSecret": async (params: {
            path: string;
            newSecretBasename: string;
            secret?: Secret;
        }) => {
            const { path, newSecretBasename, secret } = params;

            await mvSecret({
                "srcPath": path,
                "dstPath": pathJoin(pathDirname(path), newSecretBasename),
                secret,
            });
        },
        "renameDirectory": async (params: { path: string; newBasename: string }) => {
            const { path, newBasename } = params;

            const { filePaths } = await crawl({ "directoryPath": path });

            await Promise.all(
                filePaths.map(filePath =>
                    mvSecret({
                        "srcPath": pathJoin(path, filePath),
                        "dstPath": pathJoin(pathDirname(path), newBasename, filePath),
                    }),
                ),
            );
        },
        "createDirectory": async (params: { path: string }) => {
            const { path } = params;

            await secretsManagerClient.put({
                "path": pathJoin(path, ".keep"),
                "secret": {
                    "info": [
                        "This is a dummy secret so that this directory is kept even if there",
                        "is no other secrets in it",
                    ].join(" "),
                },
            });
        },
        "deleteDirectory": async (params: { path: string }) => {
            const { path } = params;

            const { filePaths } = await crawl({ "directoryPath": path });

            await Promise.all(
                filePaths
                    .map(filePathRelative => pathJoin(path, filePathRelative))
                    .map(filePath =>
                        secretsManagerClient.delete({
                            "path": filePath,
                        }),
                    ),
            );
        },
    };

    return { secretsManagerClientExtension };
}
