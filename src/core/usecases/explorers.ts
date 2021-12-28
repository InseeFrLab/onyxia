import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import type { ThunkAction, ThunksExtraArgument } from "../setup";
import type { SecretsManagerClient, Secret } from "core/ports/SecretsManagerClient";
import {
    join as pathJoin,
    dirname as pathDirname,
    relative as pathRelative,
    normalize as pathNormalize,
    basename as pathBasename,
} from "path";
import type { ApiLogs } from "core/tools/apiLogger";
import { logApi } from "core/tools/apiLogger";
import { S3Client } from "../ports/S3Client";
import { getVaultApiLogger } from "../secondaryAdapters/vaultSecretsManagerClient";
import { s3ApiLogger } from "../secondaryAdapters/minioS3Client";
import { crawlFactory } from "core/tools/crawl";
import { assert } from "tsafe/assert";
import { selectors as projectSelectionSelectors } from "./projectSelection";
import { Evt } from "evt";

export type ExplorersState = Record<
    "s3" | "secrets",
    {
        path: string | undefined;
        directories: string[];
        files: string[];
        isNavigationOngoing: boolean;
        directoriesBeingCreated: string[];
        directoriesBeingRenamed: string[];
        filesBeingCreated: string[];
        filesBeingRenamed: string[];
        "~internal": {
            isUserWatching: boolean;
        };
    }
>;

export const name = "explorers";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<ExplorersState>(
        (() => {
            const contextualState = {
                "path": undefined,
                "directories": [],
                "files": [],
                "isNavigationOngoing": false,
                "directoriesBeingCreated": [],
                "directoriesBeingRenamed": [],
                "filesBeingCreated": [],
                "filesBeingRenamed": [],
                "~internal": {
                    "isUserWatching": false,
                },
            };

            return {
                "s3": contextualState,
                "secrets": contextualState,
            };
        })(),
    ),
    "reducers": {
        "navigationStarted": (
            state,
            { payload }: PayloadAction<{ explorerType: "s3" | "secrets" }>,
        ) => {
            const { explorerType } = payload;

            const contextualState = state[explorerType];

            contextualState.isNavigationOngoing = true;
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
                path,
                directories,
                files,
                "directoriesBeingCreated": [],
                "directoriesBeingRenamed": [],
                "filesBeingCreated": [],
                "filesBeingRenamed": [],
                "isNavigationOngoing": false,
                "~internal": state[explorerType]["~internal"],
            };
        },
        "navigationCanceled": (
            state,
            { payload }: PayloadAction<{ explorerType: "s3" | "secrets" }>,
        ) => {
            const { explorerType } = payload;

            state[explorerType].isNavigationOngoing = false;
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

            const contextualState = state[explorerType];

            const relevantArray =
                contextualState[
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

            contextualState[
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

            const contextualState = state[explorerType];

            const relevantArray =
                contextualState[
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

            const contextualState = state[explorerType];

            contextualState[
                (() => {
                    switch (createWhat) {
                        case "file":
                            return "files";
                        case "directory":
                            return "directories";
                    }
                })()
            ].push(basename);

            contextualState[
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

            const contextualState = state[explorerType];

            const relevantArray =
                contextualState[
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
        "isUserWatchingChanged": (
            state,
            {
                payload,
            }: PayloadAction<{ explorerType: "s3" | "secrets"; isUserWatching: boolean }>,
        ) => {
            const { explorerType, isUserWatching } = payload;

            state[explorerType]["~internal"].isUserWatching = isUserWatching;
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

const privateThunks = {
    "lazyInitialization":
        (params: { explorerType: "s3" | "secrets" }): ThunkAction<void> =>
        (...args) => {
            const { explorerType } = params;

            const [dispatch, getState, extraArg] = args;

            const { evtAction } = extraArg;

            Evt.merge([
                evtAction
                    .pipe(
                        event =>
                            event.sliceName === "projectSelection" &&
                            event.actionName === "projectChanged",
                    )
                    .attach(
                        () => getState().explorers[explorerType].isNavigationOngoing,
                        () => dispatch(actions.navigationCanceled({ explorerType })),
                    ),
                evtAction.pipe(
                    event =>
                        event.sliceName === "explorers" &&
                        event.actionName === "isUserWatchingChanged" &&
                        event.payload.explorerType === explorerType &&
                        (() => {
                            const { path, isNavigationOngoing } =
                                getState().explorers[explorerType];

                            return path === undefined && !isNavigationOngoing;
                        })(),
                ),
            ]).attach(
                () => getState().explorers[explorerType]["~internal"].isUserWatching,
                () =>
                    getSliceContexts(extraArg)[explorerType].onNavigate?.({
                        "path": (() => {
                            const project = projectSelectionSelectors.selectedProject(
                                getState(),
                            );

                            switch (explorerType) {
                                case "s3":
                                    return project.bucket;
                                case "secrets":
                                    return project.vaultTopDir;
                            }
                        })(),
                    }),
            );
        },
};

export const thunks = {
    "notifyThatUserIsWatching":
        (params: {
            explorerType: "s3" | "secrets";
            onNavigate: (params: { path: string }) => void;
        }): ThunkAction<void> =>
        (...args) => {
            const { explorerType, onNavigate } = params;
            const [dispatch, , extraArg] = args;

            const sliceContext = getSliceContexts(extraArg)[explorerType];

            if (!sliceContext.isLazilyInitialized) {
                sliceContext.isLazilyInitialized = true;

                dispatch(privateThunks.lazyInitialization({ explorerType }));
            }

            sliceContext.onNavigate = onNavigate;

            dispatch(
                actions.isUserWatchingChanged({ explorerType, "isUserWatching": true }),
            );
        },
    "notifyThatUserIsNoLongerWatching":
        (params: { explorerType: "s3" | "secrets" }): ThunkAction<void> =>
        (...args) => {
            const { explorerType } = params;
            const [dispatch, , extraArg] = args;

            const sliceContext = getSliceContexts(extraArg);

            delete sliceContext[explorerType].onNavigate;

            dispatch(
                actions.isUserWatchingChanged({ explorerType, "isUserWatching": false }),
            );
        },
    /**
     * NOTE: It IS possible to navigate to a directory currently being renamed or created.
     */
    "navigate":
        (params: { explorerType: "s3" | "secrets"; path: string }): ThunkAction =>
        async (...args) => {
            const { explorerType } = params;

            const path = pathNormalize(params.path.replace(/\/$/, ""));

            const [dispatch, getState, extraArg] = args;

            dispatch(actions.navigationStarted({ explorerType }));

            const { loggedApi } = getSliceContexts(extraArg)[explorerType];

            if (getState().explorers[explorerType].isNavigationOngoing) {
                dispatch(actions.navigationCanceled({ explorerType }));
            }

            const ctx = Evt.newCtx();

            const { evtAction } = extraArg;

            extraArg.evtAction.attach(
                event =>
                    event.sliceName === "explorers" &&
                    event.actionName === "navigationCanceled" &&
                    event.payload.explorerType === explorerType,
                ctx,
                () => ctx.done(),
            );

            scope: {
                const {
                    directoriesBeingCreated,
                    directoriesBeingRenamed,
                    path: currentPath,
                } = getState().explorers[explorerType];

                if (currentPath === undefined) {
                    break scope;
                }

                const isPathReady =
                    [...directoriesBeingCreated, ...directoriesBeingRenamed]
                        .map(basename => pathJoin(currentPath, basename))
                        .find(notReadyPath => pathRelative(notReadyPath, path) === "") ===
                    undefined;

                if (isPathReady) {
                    break scope;
                }

                await evtAction.waitFor(
                    event =>
                        event.sliceName === "explorers" &&
                        event.actionName === "renameOrCreateCompleted" &&
                        event.payload.explorerType === explorerType &&
                        event.payload.actionOnWhat === "directory" &&
                        event.payload.basename === pathBasename(path),
                    ctx,
                );
            }

            const { directories, files } = await Evt.from(
                ctx,
                loggedApi.list({ path }),
            ).waitFor();

            ctx.done();

            dispatch(
                actions.navigationCompleted({
                    explorerType,
                    directories,
                    files,
                    path,
                }),
            );
        },
    "cancelNavigation":
        (params: { explorerType: "s3" | "secrets" }): ThunkAction<void> =>
        (...args) => {
            const { explorerType } = params;
            const [dispatch, getState] = args;
            if (!getState().explorers[explorerType].isNavigationOngoing) {
                return;
            }
            dispatch(actions.navigationCanceled({ explorerType }));
        },
    "refresh":
        (params: { explorerType: "s3" | "secrets" }): ThunkAction =>
        async (...args) => {
            const { explorerType } = params;

            const [dispatch, getState] = args;

            const { path } = getState().explorers[explorerType];

            if (path === undefined) {
                return;
            }

            await dispatch(thunks.navigate({ explorerType, path }));
        },
    /**
     * Assert:
     * The file or directory we are renaming is present in the directory
     * currently listed.
     * It's ok to navigate before it's completed.
     * The file or directory we are about to rename is not  being
     * renamed or created.
     */
    "rename":
        (params: {
            explorerType: "secrets";
            renamingWhat: "file" | "directory";
            basename: string;
            newBasename: string;
        }): ThunkAction =>
        async (...args) => {
            const { explorerType, renamingWhat, basename, newBasename } = params;

            const [dispatch, getState, extraArg] = args;

            const contextualState = getState().explorers[explorerType];

            const { path } = contextualState;

            assert(path !== undefined);

            dispatch(
                actions.renameStarted({
                    explorerType,
                    renamingWhat,
                    basename,
                    newBasename,
                }),
            );

            const sliceContext = getSliceContexts(extraArg)[explorerType];

            const pr = sliceContext.loggedExtendedApi[
                (() => {
                    switch (renamingWhat) {
                        case "file":
                            return "renameFile";
                        case "directory":
                            return "renameDirectory";
                    }
                })()
            ]({
                "path": pathJoin(path, basename),
                newBasename,
            });

            const ctx = Evt.newCtx();

            extraArg.evtAction.attach(
                event =>
                    event.sliceName === "explorers" &&
                    event.actionName === "navigationCanceled" &&
                    event.payload.explorerType === explorerType,
                ctx,
                () => ctx.done(),
            );

            await Evt.from(ctx, pr).waitFor();

            dispatch(
                actions.renameOrCreateCompleted({
                    explorerType,
                    "actionOnWhat": renamingWhat,
                    "action": "rename",
                    "basename": newBasename,
                }),
            );
        },

    "create":
        (params: ExplorersCreateParams): ThunkAction =>
        async (...args) => {
            const { basename } = params;

            const [dispatch, getState, extraArg] = args;

            const contextualState = getState().explorers[params.explorerType];

            assert(contextualState.path !== undefined);

            dispatch(
                actions.createStarted({
                    basename,
                    "createWhat": params.createWhat,
                    "explorerType": params.explorerType,
                }),
            );

            const sliceContexts = getSliceContexts(extraArg);

            const path = pathJoin(contextualState.path, basename);

            const pr = (async () => {
                switch (params.createWhat) {
                    case "file":
                        switch (params.explorerType) {
                            case "s3":
                                alert("TODO");
                                break;
                            case "secrets":
                                await sliceContexts[params.explorerType].loggedApi.put({
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
                                await sliceContexts[
                                    params.explorerType
                                ].loggedExtendedApi.createDirectory({ path });
                                break;
                        }

                        break;
                }
            })();

            const ctx = Evt.newCtx();

            extraArg.evtAction.attach(
                event =>
                    event.sliceName === "explorers" &&
                    event.actionName === "navigationCanceled" &&
                    event.payload.explorerType === params.explorerType,
                ctx,
                () => ctx.done(),
            );

            await Evt.from(ctx, pr).waitFor();

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

            const contextualState = getState().explorers[params.explorerType];

            assert(contextualState.path !== undefined);

            const path = pathJoin(contextualState.path, basename);

            dispatch(
                actions.deleteStarted({
                    explorerType,
                    basename,
                    deleteWhat,
                }),
            );

            const sliceContexts = getSliceContexts(extraArg);

            switch (explorerType) {
                case "s3":
                    alert("TODO");
                    break;
                case "secrets":
                    const sliceContext = sliceContexts[explorerType];

                    switch (deleteWhat) {
                        case "file":
                            await sliceContext.loggedApi.delete({ path });
                            break;
                        case "directory":
                            await sliceContext.loggedExtendedApi.deleteDirectory({
                                path,
                            });
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

            return getSliceContexts(extraArg)[explorerType].apiLogs;
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

type SliceContexts = {
    s3: SliceContexts.S3;
    secrets: SliceContexts.Secrets;
};

namespace SliceContexts {
    export type Common<loggedApi> = {
        loggedApi: loggedApi;
        apiLogs: ApiLogs;
        onNavigate?: (params: { path: string }) => void;
        isLazilyInitialized: boolean;
    };

    export type S3 = Common<S3Client>;

    export type Secrets = Common<SecretsManagerClient> & {
        loggedExtendedApi: ReturnType<typeof createSecretsManagerClientExtension>;
    };
}

const { getSliceContexts } = (() => {
    const weakMap = new WeakMap<ThunksExtraArgument, SliceContexts>();

    function getSliceContexts(extraArg: ThunksExtraArgument): SliceContexts {
        let sliceContext = weakMap.get(extraArg);

        if (sliceContext !== undefined) {
            return sliceContext;
        }

        const isLazilyInitialized = false;

        sliceContext = {
            "s3": {
                ...logApi({
                    "api": extraArg.s3Client,
                    "apiLogger": s3ApiLogger,
                }),
                isLazilyInitialized,
            },
            "secrets": (() => {
                const { apiLogs, loggedApi } = logApi({
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

                return {
                    loggedApi,
                    apiLogs,
                    "loggedExtendedApi": createSecretsManagerClientExtension({
                        "secretsManagerClient": loggedApi,
                    }),
                    isLazilyInitialized,
                };
            })(),
        };

        weakMap.set(extraArg, sliceContext);

        return sliceContext;
    }

    return { getSliceContexts };
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
