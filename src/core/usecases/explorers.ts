import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import type { ThunkAction, ThunksExtraArgument } from "../setup";
import type { SecretsManagerClient, Secret } from "core/ports/SecretsManagerClient";
import { Mutex } from "async-mutex";
import {
    join as pathJoin,
    dirname as pathDirname,
    relative as pathRelative,
    normalize as pathNormalize,
} from "path";
import type { ApiLogs } from "core/tools/apiLogger";
import { logApi } from "core/tools/apiLogger";
import { S3Client } from "../ports/S3Client";
import { getVaultApiLogger } from "../secondaryAdapters/vaultSecretsManagerClient";
import { s3ApiLogger } from "../secondaryAdapters/minioS3Client";
import { crawlFactory } from "core/tools/crawl";
import { assert } from "tsafe/assert";

export type ExplorersState = Record<
    "s3" | "secrets",
    | {
          isInitialized: false;
      }
    | {
          isInitialized: true;
          directories: string[];
          files: string[];
          isNavigationOngoing: boolean;
          directoriesBeingCreated: string[];
          directoriesBeingRenamed: string[];
          filesBeingCreated: string[];
          filesBeingRenamed: string[];
          path: string;
      }
>;

export const name = "explorers";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<ExplorersState>({
        "s3": { "isInitialized": false },
        "secrets": { "isInitialized": false },
    }),
    "reducers": {
        "navigationStarted": (
            state,
            { payload }: PayloadAction<{ explorerType: "s3" | "secrets" }>,
        ) => {
            const { explorerType } = payload;

            const targetExplorerTypeState = state[explorerType];

            if (!targetExplorerTypeState.isInitialized) {
                return;
            }

            targetExplorerTypeState.isNavigationOngoing = true;
        },
        "navigationCompleted": (
            state,
            {
                payload,
            }: PayloadAction<{
                explorerType: "s3" | "secrets";
                directories: string[];
                files: string[];
                path: string;
            }>,
        ) => {
            const { explorerType, directories, files, path } = payload;

            state[explorerType] = {
                "isInitialized": true,
                directories,
                files,
                "directoriesBeingCreated": [],
                "directoriesBeingRenamed": [],
                "filesBeingCreated": [],
                "filesBeingRenamed": [],
                "isNavigationOngoing": false,
                path,
            };
        },
        "renameStarted": (
            state,
            {
                payload,
            }: PayloadAction<{
                explorerType: "s3" | "secrets";
                renamingWhat: "file" | "directory";
                basename: string;
                newBasename: string;
            }>,
        ) => {
            const { explorerType, renamingWhat, basename, newBasename } = payload;

            const targetExplorerTypeState = state[explorerType];

            assert(targetExplorerTypeState.isInitialized);

            const relevantArray =
                targetExplorerTypeState[
                    (() => {
                        switch (renamingWhat) {
                            case "file":
                                return "files";
                            case "directory":
                                return "directories";
                        }
                    })()
                ];

            relevantArray[relevantArray.indexOf(basename)] = newBasename;

            targetExplorerTypeState[
                (() => {
                    switch (renamingWhat) {
                        case "file":
                            return "filesBeingRenamed";
                        case "directory":
                            return "directoriesBeingRenamed";
                    }
                })()
            ].push(newBasename);
        },
        "renameOrCreateCompleted": (
            state,
            {
                payload,
            }: PayloadAction<{
                explorerType: "s3" | "secrets";
                basename: string;
                actionOnWhat: "file" | "directory";
                action: "rename" | "create";
            }>,
        ) => {
            const { explorerType, basename, actionOnWhat, action } = payload;

            const targetExplorerTypeState = state[explorerType];

            assert(targetExplorerTypeState.isInitialized);

            const relevantArray =
                targetExplorerTypeState[
                    (() => {
                        switch (actionOnWhat) {
                            case "file":
                                switch (action) {
                                    case "create":
                                        return "filesBeingCreated";
                                    case "rename":
                                        return "filesBeingRenamed";
                                }
                                break;
                            case "directory":
                                switch (action) {
                                    case "create":
                                        return "directoriesBeingCreated";
                                    case "rename":
                                        return "directoriesBeingRenamed";
                                }
                                break;
                        }
                    })()
                ];

            relevantArray.splice(relevantArray.indexOf(basename), 1);
        },
        "createStarted": (
            state,
            {
                payload,
            }: PayloadAction<{
                explorerType: "s3" | "secrets";
                basename: string;
                createWhat: "file" | "directory";
            }>,
        ) => {
            const { explorerType, basename, createWhat } = payload;

            const targetExplorerTypeState = state[explorerType];

            assert(targetExplorerTypeState.isInitialized);

            targetExplorerTypeState[
                (() => {
                    switch (createWhat) {
                        case "file":
                            return "files";
                        case "directory":
                            return "directories";
                    }
                })()
            ].push(basename);

            targetExplorerTypeState[
                (() => {
                    switch (createWhat) {
                        case "file":
                            return "filesBeingCreated";
                        case "directory":
                            return "directoriesBeingCreated";
                    }
                })()
            ].push(basename);
        },
        "deleteStarted": (
            state,
            {
                payload,
            }: PayloadAction<{
                explorerType: "s3" | "secrets";
                deleteWhat: "file" | "directory";
                basename: string;
            }>,
        ) => {
            const { explorerType, deleteWhat, basename } = payload;

            const targetExplorerTypeState = state[explorerType];

            assert(targetExplorerTypeState.isInitialized);

            const relevantArray =
                targetExplorerTypeState[
                    (() => {
                        switch (deleteWhat) {
                            case "file":
                                return "files";
                            case "directory":
                                return "directories";
                        }
                    })()
                ];

            relevantArray.splice(relevantArray.indexOf(basename), 1);
        },
    },
});

export type ExplorersCreateParams =
    | ExplorersCreateParams.Directory
    | ExplorersCreateParams.File;

export declare namespace ExplorersCreateParams {
    export type _Common = {
        basename: string;
    };

    export type Directory = _Common & {
        createWhat: "directory";
        explorerType: "s3" | "secrets";
    };

    export type File = File.S3 | File.Secrets;

    export namespace File {
        type _FileCommon = _Common & {
            createWhat: "file";
        };

        export type S3 = _FileCommon & {
            explorerType: "s3";
            data: unknown;
        };

        export type Secrets = _FileCommon & {
            explorerType: "secrets";
        };
    }
}

export const thunks = {
    /**
     * NOTE: It IS possible to navigate to a directory currently being renamed or created.
     */
    "navigate":
        (params: { explorerType: "s3" | "secrets"; path: string }): ThunkAction =>
        async (...args) => {
            const { explorerType } = params;

            const path = pathNormalize(params.path.replace(/\/$/, ""));

            const [dispatch, , extraArg] = args;

            dispatch(actions.navigationStarted({ explorerType }));

            const sliceContext = getSliceContext(extraArg);

            const mutexes = sliceContext.mutexes[explorerType];

            (await mutexes.createOrRename.acquire())();

            const releaseNavigationMutex = await mutexes.navigateMutex.acquire();

            const listResult = await sliceContext[
                (() => {
                    switch (explorerType) {
                        case "secrets":
                            return "loggedSecretsManagerClient";
                        case "s3":
                            return "loggedS3Client";
                    }
                })()
            ].list({ path });

            releaseNavigationMutex();

            dispatch(
                actions.navigationCompleted({
                    explorerType,
                    ...listResult,
                    path,
                }),
            );
        },
    "refresh":
        (params: { explorerType: "s3" | "secrets" }): ThunkAction =>
        async (...args) => {
            const { explorerType } = params;

            const [dispatch, getState] = args;

            const targetExplorerTypeState = getState().explorers[explorerType];

            assert(targetExplorerTypeState.isInitialized);

            return dispatch(
                thunks.navigate({ explorerType, "path": targetExplorerTypeState.path }),
            );
        },
    /**
     * Assert:
     * The file or directory we are renaming is present in the directory
     * currently listed.
     * The file or directory we are about to rename is not  being
     * renamed or created.
     */
    "rename":
        (params: {
            explorerType: "s3" | "secrets";
            renamingWhat: "file" | "directory";
            basename: string;
            newBasename: string;
        }): ThunkAction =>
        async (...args) => {
            const { explorerType, renamingWhat, basename, newBasename } = params;

            const [dispatch, getState, extraArg] = args;

            const state = getState().explorers[explorerType];

            assert(state.isInitialized);

            dispatch(
                actions.renameStarted({
                    explorerType,
                    renamingWhat,
                    basename,
                    newBasename,
                }),
            );

            const sliceContext = getSliceContext(extraArg);

            const prReleaseMutex =
                sliceContext.mutexes[explorerType].createOrRename.acquire();

            await sliceContext.loggedSecretsManagerClientExt[
                (() => {
                    switch (renamingWhat) {
                        case "file":
                            return "renameFile";
                        case "directory":
                            return "renameDirectory";
                    }
                })()
            ]({
                "path": pathJoin(state.path, basename),
                newBasename,
            });

            prReleaseMutex.then(release => release());

            dispatch(
                actions.renameOrCreateCompleted({
                    explorerType,
                    "actionOnWhat": renamingWhat,
                    "action": "rename",
                    "basename": newBasename,
                }),
            );
        },

    /**
     * Assert:
     * We are currently showing a directory (state === "SHOWING DIRECTORY")
     */
    "create":
        (params: ExplorersCreateParams): ThunkAction =>
        async (...args) => {
            const { basename } = params;

            const [dispatch, getState, extraArg] = args;

            const state = getState().explorers[params.explorerType];

            assert(state.isInitialized);

            dispatch(
                actions.createStarted({
                    basename,
                    "createWhat": params.createWhat,
                    "explorerType": params.explorerType,
                }),
            );

            const sliceContext = getSliceContext(extraArg);

            const prReleaseMutex =
                sliceContext.mutexes[params.explorerType].createOrRename.acquire();

            const path = pathJoin(state.path, basename);

            switch (params.createWhat) {
                case "file":
                    switch (params.explorerType) {
                        case "s3":
                            alert("TODO");
                            break;
                        case "secrets":
                            await sliceContext.loggedSecretsManagerClient.put({
                                path,
                                "secret": {},
                            });
                            break;
                    }

                    break;
                case "directory":
                    switch (params.explorerType) {
                        case "s3":
                            alert("TODO");
                            break;
                        case "secrets":
                            await sliceContext.loggedSecretsManagerClientExt.createDirectory(
                                { path },
                            );
                            break;
                    }

                    break;
            }

            prReleaseMutex.then(release => release());

            dispatch(
                actions.renameOrCreateCompleted({
                    "explorerType": params.explorerType,
                    "basename": params.basename,
                    "action": "create",
                    "actionOnWhat": params.createWhat,
                }),
            );
        },

    /**
     * Assert:
     * The file or directory we are deleting is present in the directory
     * currently listed.
     * The file or directory we are about to delete is not being
     * created or renamed.
     */
    "delete":
        (params: {
            explorerType: "s3" | "secrets";
            deleteWhat: "file" | "directory";
            basename: string;
        }): ThunkAction =>
        async (...args) => {
            const { explorerType, deleteWhat, basename } = params;

            const [dispatch, getState, extraArg] = args;

            const state = getState().explorers[params.explorerType];

            assert(state.isInitialized);

            const path = pathJoin(state.path, basename);

            dispatch(
                actions.deleteStarted({
                    explorerType,
                    basename,
                    deleteWhat,
                }),
            );

            const { loggedSecretsManagerClient, loggedSecretsManagerClientExt } =
                getSliceContext(extraArg);

            switch (explorerType) {
                case "s3":
                    alert("TODO");
                    break;
                case "secrets":
                    switch (deleteWhat) {
                        case "file":
                            await loggedSecretsManagerClient.delete({ path });
                            break;
                        case "directory":
                            await loggedSecretsManagerClientExt.deleteDirectory({ path });
                            break;
                    }
                    break;
            }
        },
    "getApiLogs":
        (params: { explorerType: "s3" | "secrets" }): ThunkAction<ApiLogs> =>
        (...args) => {
            const { explorerType } = params;

            const [, , extraArg] = args;

            const sliceContext = getSliceContext(extraArg);

            return sliceContext[
                (() => {
                    switch (explorerType) {
                        case "secrets":
                            return "secretsManagerClientLogs";
                        case "s3":
                            return "s3ClientLogs";
                    }
                })()
            ];
        },
    "getIsEnabled":
        (params: { explorerType: "s3" | "secrets" }): ThunkAction<boolean> =>
        (...args) => {
            const { explorerType } = params;

            const [, , { createStoreParams }] = args;

            switch (explorerType) {
                case "secrets":
                    return (
                        createStoreParams.secretsManagerClientConfig.implementation !==
                        "LOCAL STORAGE"
                    );
                case "s3":
                    return createStoreParams.s3ClientConfig.implementation !== "DUMMY";
            }
        },
};

type SliceContext = {
    loggedSecretsManagerClient: SecretsManagerClient;
    loggedSecretsManagerClientExt: ReturnType<typeof createSecretsManagerClientExtension>;
    secretsManagerClientLogs: ApiLogs;
    loggedS3Client: S3Client;
    s3ClientLogs: ApiLogs;
    mutexes: Record<
        "s3" | "secrets",
        {
            createOrRename: Mutex;
            navigateMutex: Mutex;
        }
    >;
};

const { getSliceContext } = (() => {
    const weakMap = new WeakMap<ThunksExtraArgument, SliceContext>();

    function getSliceContext(extraArg: ThunksExtraArgument): SliceContext {
        let sliceContext = weakMap.get(extraArg);

        if (sliceContext !== undefined) {
            return sliceContext;
        }

        sliceContext = {
            ...(() => {
                const {
                    apiLogs: secretsManagerClientLogs,
                    apiProxy: loggedSecretsManagerClient,
                } = logApi({
                    "api": extraArg.secretsManagerClient,
                    "apiLogger": getVaultApiLogger({
                        "clientType": "CLI",
                        "engine": (() => {
                            const { secretsManagerClientConfig } =
                                extraArg.createStoreParams;
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

                const loggedSecretsManagerClientExt = createSecretsManagerClientExtension(
                    {
                        "secretsManagerClient": loggedSecretsManagerClient,
                    },
                );

                return {
                    secretsManagerClientLogs,
                    loggedSecretsManagerClient,
                    loggedSecretsManagerClientExt,
                };
            })(),
            ...(() => {
                const { apiLogs: s3ClientLogs, apiProxy: loggedS3Client } = logApi({
                    "api": extraArg.s3Client,
                    "apiLogger": s3ApiLogger,
                });

                return { s3ClientLogs, loggedS3Client };
            })(),
            "mutexes": (() => {
                const getMutexes = () => ({
                    "createOrRename": new Mutex(),
                    "navigateMutex": new Mutex(),
                });

                return {
                    "s3": getMutexes(),
                    "secrets": getMutexes(),
                };
            })(),
        };

        weakMap.set(extraArg, sliceContext);

        return sliceContext;
    }

    return { getSliceContext };
})();

function createSecretsManagerClientExtension(props: {
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

    async function mvFile(params: { srcPath: string; dstPath: string; secret?: Secret }) {
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

    return {
        "renameFile": async (params: {
            path: string;
            newBasename: string;
            secret?: Secret;
        }) => {
            const { path, newBasename, secret } = params;

            await mvFile({
                "srcPath": path,
                "dstPath": pathJoin(pathDirname(path), newBasename),
                secret,
            });
        },
        "renameDirectory": async (params: { path: string; newBasename: string }) => {
            const { path, newBasename } = params;

            const { filePaths } = await crawl({ "directoryPath": path });

            await Promise.all(
                filePaths.map(filePath =>
                    mvFile({
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
}
