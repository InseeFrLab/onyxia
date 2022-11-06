import "minimal-polyfills/Object.fromEntries";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import type { ThunkAction, ThunksExtraArgument } from "../setup";
import type { SecretsManagerClient, Secret } from "core/ports/SecretsManagerClient";
import {
    join as pathJoin,
    relative as pathRelative,
    basename as pathBasename,
} from "path";
import type { ApiLogs } from "core/tools/apiLogger";
import { logApi } from "core/tools/apiLogger";
import { getVaultApiLogger } from "../secondaryAdapters/vaultSecretsManagerClient";
import { assert } from "tsafe/assert";
import { selectors as projectSelectionSelectors } from "./projectSelection";
import { Evt } from "evt";
import type { Ctx } from "evt";
import type { RootState } from "../setup";
import memoize from "memoizee";
import type { WritableDraft } from "immer/dist/types/types-external";
import { selectors as deploymentRegionSelectors } from "./deploymentRegion";
import type { Param0 } from "tsafe";
import { createExtendedFsApi } from "core/tools/extendedFsApi";
import type { ExtendedFsApi } from "core/tools/extendedFsApi";

//All explorer path are expected to be absolute (start with /)

export type SecretExplorerState = {
    directoryPath: string | undefined;
    directoryItems: {
        kind: "file" | "directory";
        basename: string;
    }[];
    isNavigationOngoing: boolean;
    ongoingOperations: ({
        directoryPath: string;
        basename: string;
        kind: "file" | "directory";
        operation: "create" | "rename" | "delete";
    } & (
        | {
              operation: "create" | "delete";
          }
        | {
              operation: "rename";
              previousBasename: string;
          }
    ))[];
    "~internal": {
        isUserWatching: boolean;
    };
};

export const name = "secretExplorer";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<SecretExplorerState>({
        "directoryPath": undefined,
        "directoryItems": [],
        "isNavigationOngoing": false,
        "ongoingOperations": [],
        "~internal": {
            "isUserWatching": false,
        },
    }),
    "reducers": {
        "navigationStarted": state => {
            state.isNavigationOngoing = true;
        },
        "navigationCompleted": (
            state,
            {
                payload,
            }: PayloadAction<{
                directoryPath: string;
                directoryItems: {
                    kind: "file" | "directory";
                    basename: string;
                }[];
            }>,
        ) => {
            const { directoryPath, directoryItems } = payload;

            state.directoryPath = directoryPath;
            state.directoryItems = directoryItems;
            state.isNavigationOngoing = false;

            //Properly restore state when navigating back to
            //a directory with ongoing operations.
            state.ongoingOperations
                .filter(o => pathRelative(o.directoryPath, directoryPath) === "")
                .forEach(o => {
                    switch (o.operation) {
                        case "rename":
                            removeIfPresent(state.directoryItems, {
                                "kind": o.kind,
                                "basename": o.previousBasename,
                            });
                            break;
                        case "delete":
                            removeIfPresent(state.directoryItems, {
                                "kind": o.kind,
                                "basename": o.basename,
                            });
                            break;
                        case "create":
                            break;
                    }
                });
        },
        "navigationCanceled": state => {
            state.isNavigationOngoing = false;
        },
        "operationStarted": (
            state,
            {
                payload,
            }: PayloadAction<
                {
                    kind: "file" | "directory";
                    basename: string;
                } & (
                    | {
                          operation: "create" | "delete";
                      }
                    | {
                          operation: "rename";
                          newBasename: string;
                      }
                )
            >,
        ) => {
            const { kind, basename } = payload;

            assert(state.directoryPath !== undefined);

            switch (payload.operation) {
                case "rename":
                case "delete":
                    removeIfPresent(state.directoryItems, { kind, basename });
                    break;
            }

            state.ongoingOperations.push({
                "directoryPath": state.directoryPath,
                kind,
                ...(() => {
                    switch (payload.operation) {
                        case "rename":
                            return {
                                "operation": payload.operation,
                                "basename": payload.newBasename,
                                "previousBasename": basename,
                            };
                        case "delete":
                        case "create":
                            return {
                                "operation": payload.operation,
                                basename,
                            };
                    }
                })(),
            });
        },
        "operationCompleted": (
            state,
            {
                payload,
            }: PayloadAction<{
                kind: "file" | "directory";
                basename: string;
                directoryPath: string;
            }>,
        ) => {
            const { kind, basename, directoryPath } = payload;

            assert(state.directoryPath !== undefined);

            const { ongoingOperations } = state;

            const ongoingOperation = ongoingOperations.find(
                o =>
                    o.kind === kind &&
                    o.basename === basename &&
                    pathRelative(o.directoryPath, directoryPath) === "",
            );

            assert(ongoingOperation !== undefined);

            ongoingOperations.splice(ongoingOperations.indexOf(ongoingOperation), 1);

            if (pathRelative(state.directoryPath, directoryPath) !== "") {
                return;
            }

            switch (ongoingOperation.operation) {
                case "create":
                case "rename":
                    state.directoryItems.push({
                        "basename": ongoingOperation.basename,
                        kind,
                    });
                    break;
            }
        },
        "isUserWatchingChanged": (
            state,
            {
                payload,
            }: PayloadAction<
                | {
                      isUserWatching: false;
                  }
                | {
                      isUserWatching: true;
                      directNavigationDirectoryPath: string | undefined;
                  }
            >,
        ) => {
            const { isUserWatching } = payload;

            state["~internal"].isUserWatching = isUserWatching;
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
    };

    export type File = _Common & {
        createWhat: "file";
    };
}

const privateThunks = {
    "lazyInitialization":
        (): ThunkAction<void> =>
        (...args) => {
            const [dispatch, getState, extraArg] = args;

            const { evtAction } = extraArg;

            Evt.merge([
                evtAction
                    .pipe(event =>
                        event.sliceName === "projectSelection" &&
                        event.actionName === "projectChanged" &&
                        getState().secretExplorer["~internal"].isUserWatching
                            ? [
                                  {
                                      "directNavigationDirectoryPath": undefined,
                                      "isProjectChanged": true,
                                  },
                              ]
                            : null,
                    )
                    .attach(
                        () => getState().secretExplorer.isNavigationOngoing,
                        () => dispatch(actions.navigationCanceled()),
                    ),
                evtAction.pipe(event =>
                    event.sliceName === "secretExplorer" &&
                    event.actionName === "isUserWatchingChanged" &&
                    event.payload.isUserWatching
                        ? [
                              {
                                  "directNavigationDirectoryPath":
                                      event.payload.directNavigationDirectoryPath,
                                  "isProjectChanged": false,
                              },
                          ]
                        : null,
                ),
            ]).attach(({ directNavigationDirectoryPath, isProjectChanged }) =>
                getSliceContexts(args).onNavigate?.({
                    "doRestoreOpenedFile": !isProjectChanged,
                    "directoryPath": (() => {
                        if (directNavigationDirectoryPath !== undefined) {
                            return directNavigationDirectoryPath;
                        }

                        const defaultDirectoryPath = dispatch(
                            interUsecasesThunks.getProjectHomePath(),
                        );

                        const currentDirectoryPath =
                            getState().secretExplorer.directoryPath;

                        if (
                            currentDirectoryPath !== undefined &&
                            currentDirectoryPath.startsWith(defaultDirectoryPath)
                        ) {
                            return currentDirectoryPath;
                        }

                        return defaultDirectoryPath;
                    })(),
                }),
            );
        },
    /**
     * NOTE: It IS possible to navigate to a directory currently being renamed or created.
     */
    "navigate":
        (params: { directoryPath: string; forceReload: boolean }): ThunkAction =>
        async (...args) => {
            const { directoryPath, forceReload } = params;

            const [dispatch, getState, extraArg] = args;

            //Avoid navigating to the current directory.
            if (!forceReload) {
                const currentDirectoryPath = getState().secretExplorer.directoryPath;

                if (
                    currentDirectoryPath !== undefined &&
                    pathRelative(currentDirectoryPath, directoryPath) === ""
                ) {
                    return;
                }
            }

            dispatch(actions.navigationStarted());

            const { loggedSecretClient } = getSliceContexts(args);

            dispatch(thunks.cancelNavigation());

            const ctx = Evt.newCtx();

            extraArg.evtAction.attach(
                event =>
                    event.sliceName === "secretExplorer" &&
                    event.actionName === "navigationCanceled",
                ctx,
                () => ctx.done(),
            );

            await dispatch(
                interUsecasesThunks.waitForNoOngoingOperation({
                    "kind": "directory",
                    "directoryPath": pathJoin(directoryPath, ".."),
                    "basename": pathBasename(directoryPath),
                    ctx,
                }),
            );

            const { directories, files } = await Evt.from(
                ctx,
                loggedSecretClient.list({ "path": directoryPath }),
            ).waitFor();

            ctx.done();

            dispatch(
                actions.navigationCompleted({
                    directoryPath,
                    "directoryItems": [
                        ...directories.map(basename => ({
                            basename,
                            "kind": "directory" as const,
                        })),
                        ...files.map(basename => ({ basename, "kind": "file" as const })),
                    ],
                }),
            );
        },
};

export const interUsecasesThunks = {
    "getLoggedSecretsApis":
        (): ThunkAction<
            Pick<
                SliceContexts,
                "loggedSecretClient" | "loggedExtendedFsApi" | "secretClientLogs"
            >
        > =>
        (...args) =>
            getSliceContexts(args),
    "waitForNoOngoingOperation":
        (params: {
            kind: "file" | "directory";
            basename: string;
            directoryPath: string;
            ctx?: Ctx;
        }): ThunkAction =>
        async (...args) => {
            const [, getState, { evtAction }] = args;

            const { kind, basename, directoryPath, ctx = Evt.newCtx() } = params;

            const { ongoingOperations } = getState().secretExplorer;

            const ongoingOperation = ongoingOperations.find(
                o =>
                    o.kind === kind &&
                    o.basename === basename &&
                    o.directoryPath === directoryPath,
            );

            if (ongoingOperation === undefined) {
                return;
            }

            await evtAction.waitFor(
                event =>
                    event.sliceName === "secretExplorer" &&
                    event.actionName === "operationCompleted" &&
                    event.payload.kind === kind &&
                    (event.payload.basename === basename ||
                        (ongoingOperation.operation === "rename" &&
                            event.payload.basename ===
                                ongoingOperation.previousBasename)) &&
                    pathRelative(event.payload.directoryPath, directoryPath) === "",
                ctx,
            );
        },
    "getProjectHomePath":
        (): ThunkAction<string> =>
        (...args) => {
            const [, getState] = args;

            return (
                "/" + projectSelectionSelectors.selectedProject(getState()).vaultTopDir
            );
        },
};

export const thunks = {
    "notifyThatUserIsWatching":
        (params: {
            directNavigationDirectoryPath: string | undefined;
            onNavigate: (params: {
                directoryPath: string;
                doRestoreOpenedFile: boolean;
            }) => void;
        }): ThunkAction<void> =>
        (...args) => {
            const { directNavigationDirectoryPath, onNavigate } = params;
            const [dispatch] = args;

            const sliceContext = getSliceContexts(args);

            if (!sliceContext.isLazilyInitialized) {
                sliceContext.isLazilyInitialized = true;

                dispatch(privateThunks.lazyInitialization());
            }

            sliceContext.onNavigate = onNavigate;

            dispatch(
                actions.isUserWatchingChanged({
                    "isUserWatching": true,
                    directNavigationDirectoryPath,
                }),
            );
        },
    "notifyThatUserIsNoLongerWatching":
        (): ThunkAction<void> =>
        (...args) => {
            const [dispatch] = args;

            const sliceContext = getSliceContexts(args);

            delete sliceContext.onNavigate;

            dispatch(actions.isUserWatchingChanged({ "isUserWatching": false }));
        },
    /**
     * NOTE: It IS possible to navigate to a directory currently being renamed or created.
     */
    "navigate":
        (params: { directoryPath: string }): ThunkAction =>
        async (...args) => {
            const { directoryPath } = params;

            const [dispatch] = args;

            return dispatch(
                privateThunks.navigate({
                    directoryPath,
                    "forceReload": false,
                }),
            );
        },
    //Not used by the UI so far but we want to later
    "cancelNavigation":
        (): ThunkAction<void> =>
        (...args) => {
            const [dispatch, getState] = args;
            if (!getState().secretExplorer.isNavigationOngoing) {
                return;
            }
            dispatch(actions.navigationCanceled());
        },
    "refresh":
        (): ThunkAction =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { directoryPath } = getState().secretExplorer;

            if (directoryPath === undefined) {
                return;
            }

            await dispatch(
                privateThunks.navigate({
                    directoryPath,
                    "forceReload": true,
                }),
            );
        },
    "rename":
        (params: {
            renamingWhat: "file" | "directory";
            basename: string;
            newBasename: string;
        }): ThunkAction =>
        async (...args) => {
            const { renamingWhat, basename, newBasename } = params;

            const [dispatch, getState] = args;

            const contextualState = getState().secretExplorer;

            const { directoryPath } = contextualState;

            assert(directoryPath !== undefined);

            await dispatch(
                interUsecasesThunks.waitForNoOngoingOperation({
                    "kind": renamingWhat,
                    directoryPath,
                    basename,
                }),
            );

            dispatch(
                actions.operationStarted({
                    "kind": renamingWhat,
                    basename,
                    "operation": "rename",
                    newBasename,
                }),
            );

            await getSliceContexts(args).loggedExtendedFsApi[
                (() => {
                    switch (renamingWhat) {
                        case "file":
                            return "renameFile";
                        case "directory":
                            return "renameDirectory";
                    }
                })()
            ]({
                "path": pathJoin(directoryPath, basename),
                newBasename,
            });

            dispatch(
                actions.operationCompleted({
                    "kind": renamingWhat,
                    "basename": newBasename,
                    directoryPath,
                }),
            );
        },

    "create":
        (params: ExplorersCreateParams): ThunkAction =>
        async (...args) => {
            const [dispatch, getState] = args;

            const contextualState = getState().secretExplorer;

            const { directoryPath } = contextualState;

            assert(directoryPath !== undefined);

            await dispatch(
                interUsecasesThunks.waitForNoOngoingOperation({
                    "kind": params.createWhat,
                    directoryPath,
                    "basename": params.basename,
                }),
            );

            dispatch(
                actions.operationStarted({
                    "kind": params.createWhat,
                    "basename": params.basename,
                    "operation": "create",
                }),
            );

            const sliceContexts = getSliceContexts(args);

            const path = pathJoin(directoryPath, params.basename);

            switch (params.createWhat) {
                case "file":
                    await sliceContexts.loggedSecretClient.put({
                        path,
                        "secret": {},
                    });
                    break;
                case "directory":
                    await sliceContexts.loggedExtendedFsApi.createDirectory({ path });
                    break;
            }

            dispatch(
                actions.operationCompleted({
                    "kind": params.createWhat,
                    "basename": params.basename,
                    directoryPath,
                }),
            );
        },

    /**
     * Assert:
     * The file or directory we are deleting is present in the directory
     * currently listed.
     */
    "delete":
        (params: { deleteWhat: "file" | "directory"; basename: string }): ThunkAction =>
        async (...args) => {
            const { deleteWhat, basename } = params;

            const [dispatch, getState] = args;

            const contextualState = getState().secretExplorer;

            const { directoryPath } = contextualState;

            assert(directoryPath !== undefined);

            await dispatch(
                interUsecasesThunks.waitForNoOngoingOperation({
                    "kind": deleteWhat,
                    directoryPath,
                    basename,
                }),
            );

            dispatch(
                actions.operationStarted({
                    "kind": params.deleteWhat,
                    "basename": params.basename,
                    "operation": "delete",
                }),
            );

            const sliceContexts = getSliceContexts(args);

            const path = pathJoin(directoryPath, basename);

            switch (deleteWhat) {
                case "directory":
                    await sliceContexts.loggedExtendedFsApi.deleteDirectory({ path });
                    break;
                case "file":
                    await sliceContexts.loggedSecretClient.delete({
                        path,
                    });
                    break;
            }

            dispatch(
                actions.operationCompleted({
                    "kind": deleteWhat,
                    basename,
                    directoryPath,
                }),
            );
        },
    "getFsApiLogs":
        (): ThunkAction<ApiLogs> =>
        (...args) => {
            return getSliceContexts(args).secretClientLogs;
        },
    "getIsEnabled":
        (): ThunkAction<boolean> =>
        (...args) => {
            const [, getState] = args;

            const region = deploymentRegionSelectors.selectedDeploymentRegion(getState());

            return region.vault !== undefined;
        },
};

type SliceContexts = {
    loggedSecretClient: SecretsManagerClient;
    secretClientLogs: ApiLogs;
    onNavigate?: Param0<typeof thunks["notifyThatUserIsWatching"]>["onNavigate"];
    isLazilyInitialized: boolean;
    loggedExtendedFsApi: ExtendedFsApi;
};

const { getSliceContexts } = (() => {
    const weakMap = new WeakMap<ThunksExtraArgument, SliceContexts>();

    function getSliceContexts(args: Parameters<ThunkAction<unknown>>): SliceContexts {
        const [, getState, extraArg] = args;

        let sliceContext = weakMap.get(extraArg);

        if (sliceContext !== undefined) {
            return sliceContext;
        }

        const isLazilyInitialized = false;

        sliceContext = (() => {
            const { apiLogs: secretClientLogs, loggedApi: loggedSecretClient } = logApi({
                "api": extraArg.secretsManagerClient,
                "apiLogger": getVaultApiLogger({
                    "clientType": "CLI",
                    "engine":
                        deploymentRegionSelectors.selectedDeploymentRegion(getState())
                            .vault?.kvEngine ?? "onyxia-kv",
                }),
            });

            return {
                loggedSecretClient,
                secretClientLogs,
                isLazilyInitialized,
                "loggedExtendedFsApi": createExtendedFsApi({
                    "baseFsApi": {
                        "list": loggedSecretClient.list,
                        "deleteFile": loggedSecretClient.delete,
                        "downloadFile": async ({ path }) =>
                            (await loggedSecretClient.get({ path })).secret,
                        "uploadFile": ({ path, file }) =>
                            loggedSecretClient.put({ path, "secret": file }),
                    },
                    "keepFile": id<Secret>({
                        "info": [
                            "This is a dummy secret so that this directory is kept even if there",
                            "is no other secrets in it",
                        ].join(" "),
                    }),
                    "keepFileBasename": ".keep",
                }),
            };
        })();

        weakMap.set(extraArg, sliceContext);

        return sliceContext;
    }

    return { getSliceContexts };
})();

function removeIfPresent(
    directoryItems: WritableDraft<{
        kind: "file" | "directory";
        basename: string;
    }>[],
    item: { kind: "file" | "directory"; basename: string },
): void {
    const index = directoryItems.findIndex(
        item_i => item_i.kind === item.kind && item_i.basename === item.basename,
    );

    assert(index >= 0);

    directoryItems.splice(index, 1);
}

export const selectors = (() => {
    type CurrentWorkingDirectoryView = {
        directoryPath: string;
        isNavigationOngoing: boolean;
        directories: string[];
        files: string[];
        directoriesBeingCreated: string[];
        directoriesBeingRenamed: string[];
        filesBeingCreated: string[];
        filesBeingRenamed: string[];
    };

    const currentWorkingDirectoryView = (
        rootState: RootState,
    ): CurrentWorkingDirectoryView | undefined => {
        const state = rootState.secretExplorer;

        const { directoryPath, isNavigationOngoing, directoryItems, ongoingOperations } =
            state;

        return ((): CurrentWorkingDirectoryView | undefined => {
            if (directoryPath === undefined) {
                return undefined;
            }

            return {
                directoryPath,
                isNavigationOngoing,
                ...(() => {
                    const selectOngoing = memoize(
                        (kind: "directory" | "file", operation: "create" | "rename") =>
                            ongoingOperations
                                .filter(
                                    o =>
                                        o.directoryPath === directoryPath &&
                                        o.kind === kind &&
                                        o.operation === operation,
                                )
                                .map(({ basename }) => basename),
                    );

                    const select = (kind: "directory" | "file") =>
                        [
                            ...directoryItems
                                .filter(item => item.kind === kind)
                                .map(({ basename }) => basename),
                            ...selectOngoing(kind, "create"),
                            ...selectOngoing(kind, "rename"),
                        ].sort((a, b) => a.localeCompare(b));

                    return {
                        "directories": select("directory"),
                        "files": select("file"),
                        "directoriesBeingCreated": selectOngoing("directory", "create"),
                        "directoriesBeingRenamed": selectOngoing("directory", "rename"),
                        "filesBeingCreated": selectOngoing("file", "create"),
                        "filesBeingRenamed": selectOngoing("file", "rename"),
                    };
                })(),
            };
        })();
    };

    return { currentWorkingDirectoryView };
})();
