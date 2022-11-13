import "minimal-polyfills/Object.fromEntries";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import type { ThunkAction, ThunksExtraArgument } from "../setup";
import {
    join as pathJoin,
    relative as pathRelative,
    basename as pathBasename,
} from "path";
import type { ApiLogs } from "core/tools/apiLogger";
import { logApi } from "core/tools/apiLogger";
import { S3Client } from "../ports/S3Client";
import { s3ApiLogger } from "../adapters/s3Client";
import { assert } from "tsafe/assert";
import { selectors as projectSelectionSelectors } from "./projectSelection";
import { Evt } from "evt";
import type { Ctx } from "evt";
import type { State } from "../setup";
import memoize from "memoizee";
import type { WritableDraft } from "immer/dist/types/types-external";
import { selectors as deploymentRegionSelectors } from "./deploymentRegion";
import type { Param0 } from "tsafe";
import { createExtendedFsApi } from "core/tools/extendedFsApi";
import type { ExtendedFsApi } from "core/tools/extendedFsApi";
import { createObjectThatThrowsIfAccessed } from "redux-clean-architecture";

//All explorer path are expected to be absolute (start with /)

export type FileExplorerState = {
    directoryPath: string | undefined;
    directoryItems: {
        kind: "file" | "directory";
        basename: string;
    }[];
    isNavigationOngoing: boolean;
    ongoingOperations: {
        directoryPath: string;
        basename: string;
        kind: "file" | "directory";
        operation: "create" | "delete";
    }[];
    "~internal": {
        isUserWatching: boolean;
        s3FilesBeingUploaded: {
            directoryPath: string;
            basename: string;
            size: number;
            uploadPercent: number;
        }[];
    };
};

export const name = "fileExplorer";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<FileExplorerState>({
        "directoryPath": undefined,
        "directoryItems": [],
        "isNavigationOngoing": false,
        "ongoingOperations": [],
        "~internal": {
            "s3FilesBeingUploaded": [],
            "isUserWatching": false,
        },
    }),
    "reducers": {
        "fileUploadStarted": (
            state,
            {
                payload,
            }: PayloadAction<{
                directoryPath: string;
                basename: string;
                size: number;
            }>,
        ) => {
            const { directoryPath, basename, size } = payload;

            state["~internal"].s3FilesBeingUploaded.push({
                directoryPath,
                basename,
                size,
                "uploadPercent": 0,
            });
        },
        "uploadProgressUpdated": (
            state,
            {
                payload,
            }: PayloadAction<{
                directoryPath: string;
                basename: string;
                uploadPercent: number;
            }>,
        ) => {
            const { basename, directoryPath, uploadPercent } = payload;
            const { s3FilesBeingUploaded } = state["~internal"];

            const s3FileBeingUploaded = s3FilesBeingUploaded.find(
                s3FileBeingUploaded =>
                    s3FileBeingUploaded.directoryPath === directoryPath &&
                    s3FileBeingUploaded.basename === basename,
            );
            assert(s3FileBeingUploaded !== undefined);
            s3FileBeingUploaded.uploadPercent = uploadPercent;

            if (
                !!s3FilesBeingUploaded.find(({ uploadPercent }) => uploadPercent !== 100)
            ) {
                return;
            }

            state["~internal"].s3FilesBeingUploaded = [];
        },
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
            }: PayloadAction<{
                kind: "file" | "directory";
                basename: string;
                operation: "create" | "delete";
            }>,
        ) => {
            const { kind, basename } = payload;

            assert(state.directoryPath !== undefined);

            switch (payload.operation) {
                case "delete":
                    removeIfPresent(state.directoryItems, { kind, basename });
                    break;
            }

            state.ongoingOperations.push({
                "directoryPath": state.directoryPath,
                kind,
                ...(() => {
                    switch (payload.operation) {
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
        blob: Blob;
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
                        getState().fileExplorer["~internal"].isUserWatching
                            ? [
                                  {
                                      "directNavigationDirectoryPath": undefined,
                                      "isProjectChanged": true,
                                  },
                              ]
                            : null,
                    )
                    .attach(
                        () => getState().fileExplorer.isNavigationOngoing,
                        () => dispatch(actions.navigationCanceled()),
                    ),
                evtAction.pipe(event =>
                    event.sliceName === "fileExplorer" &&
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
                getSliceContext(extraArg).onNavigate?.({
                    "doRestoreOpenedFile": !isProjectChanged,
                    "directoryPath": (() => {
                        if (directNavigationDirectoryPath !== undefined) {
                            return directNavigationDirectoryPath;
                        }

                        const defaultDirectoryPath = dispatch(
                            interUsecasesThunks.getProjectHomePath(),
                        );

                        const currentDirectoryPath =
                            getState().fileExplorer.directoryPath;

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
                const currentDirectoryPath = getState().fileExplorer.directoryPath;

                if (
                    currentDirectoryPath !== undefined &&
                    pathRelative(currentDirectoryPath, directoryPath) === ""
                ) {
                    return;
                }
            }

            dispatch(actions.navigationStarted());

            const { loggedS3Client } = getSliceContext(extraArg);

            dispatch(thunks.cancelNavigation());

            const ctx = Evt.newCtx();

            extraArg.evtAction.attach(
                event =>
                    event.sliceName === "fileExplorer" &&
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
                loggedS3Client.list({ "path": directoryPath }),
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

            const { ongoingOperations } = getState().fileExplorer;

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
                    event.sliceName === "fileExplorer" &&
                    event.actionName === "operationCompleted" &&
                    event.payload.kind === kind &&
                    event.payload.basename === basename &&
                    pathRelative(event.payload.directoryPath, directoryPath) === "",
                ctx,
            );
        },
    "getProjectHomePath":
        (): ThunkAction<string> =>
        (...args) => {
            const [, getState] = args;

            return "/" + projectSelectionSelectors.selectedProject(getState()).bucket;
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
            const [dispatch, , extraArg] = args;

            const sliceContext = getSliceContext(extraArg);

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
            const [dispatch, , extraArg] = args;

            const sliceContext = getSliceContext(extraArg);

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
            if (!getState().fileExplorer.isNavigationOngoing) {
                return;
            }
            dispatch(actions.navigationCanceled());
        },
    "refresh":
        (): ThunkAction =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { directoryPath } = getState().fileExplorer;

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
    "create":
        (params: ExplorersCreateParams): ThunkAction =>
        async (...args) => {
            const [dispatch, getState, extraArg] = args;

            const contextualState = getState().fileExplorer;

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

            const sliceContext = getSliceContext(extraArg);

            const path = pathJoin(directoryPath, params.basename);

            switch (params.createWhat) {
                case "file":
                    console.log("todo: here we need to wait that the upload start");

                    dispatch(
                        actions.fileUploadStarted({
                            "basename": params.basename,
                            directoryPath,
                            "size": params.blob.size,
                        }),
                    );

                    sliceContext.loggedS3Client.uploadFile({
                        path,
                        "blob": params.blob,
                        "onUploadProgress": ({ uploadPercent }) =>
                            dispatch(
                                actions.uploadProgressUpdated({
                                    "basename": params.basename,
                                    directoryPath,
                                    uploadPercent,
                                }),
                            ),
                    });
                    break;
                case "directory":
                    await sliceContext.loggedExtendedFsApi.createDirectory({ path });
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

            const [dispatch, getState, extraArg] = args;

            const contextualState = getState().fileExplorer;

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

            const sliceContext = getSliceContext(extraArg);

            const path = pathJoin(directoryPath, basename);

            switch (deleteWhat) {
                case "directory":
                    await sliceContext.loggedExtendedFsApi.deleteDirectory({ path });
                    break;
                case "file":
                    await sliceContext.loggedS3Client.deleteFile({
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
    "getS3ClientLogs":
        (): ThunkAction<ApiLogs> =>
        (...args) => {
            const [, , extraArg] = args;
            return getSliceContext(extraArg).s3ClientLogs;
        },
    "getIsEnabled":
        (): ThunkAction<boolean> =>
        (...args) => {
            const [, getState] = args;

            const region = deploymentRegionSelectors.selectedDeploymentRegion(getState());

            return region.s3 !== undefined;
        },
    "getFileDownloadUrl":
        (params: { basename: string }): ThunkAction<Promise<string>> =>
        async (...args) => {
            const { basename } = params;

            const [, getState, extraArg] = args;

            const contextualState = getState().fileExplorer;

            const { directoryPath } = contextualState;

            assert(directoryPath !== undefined);

            const sliceContext = getSliceContext(extraArg);

            const path = pathJoin(directoryPath, basename);

            const downloadUrl = await sliceContext.loggedS3Client.getFileDownloadUrl({
                path,
            });

            return downloadUrl;
        },
};

type SliceContext = {
    loggedS3Client: S3Client;
    s3ClientLogs: ApiLogs;
    onNavigate?: Param0<typeof thunks["notifyThatUserIsWatching"]>["onNavigate"];
    isLazilyInitialized: boolean;
    loggedExtendedFsApi: ExtendedFsApi;
};

//TODO: Make it so the framework can accommodate this usecase
const { getSliceContext } = (() => {
    const weakMap = new WeakMap<ThunksExtraArgument, SliceContext>();

    function getSliceContext(extraArg: ThunksExtraArgument): SliceContext {
        let sliceContext = weakMap.get(extraArg);

        if (sliceContext !== undefined) {
            return sliceContext;
        }

        sliceContext = (() => {
            const { apiLogs: s3ClientLogs, loggedApi: loggedS3Client } = logApi({
                "api": extraArg.s3Client,
                "apiLogger": s3ApiLogger,
            });

            return {
                loggedS3Client,
                s3ClientLogs,
                "isLazilyInitialized": false,
                "loggedExtendedFsApi": createExtendedFsApi({
                    "baseFsApi": {
                        "list": loggedS3Client.list,
                        "deleteFile": loggedS3Client.deleteFile,
                        "downloadFile": createObjectThatThrowsIfAccessed({
                            "debugMessage":
                                "We are not supposed to have do download file here. Moving file is too expensive in S3",
                        }),
                        "uploadFile": ({ file, path }) =>
                            loggedS3Client.uploadFile({
                                path,
                                "blob": file,
                                "onUploadProgress": () => {},
                            }),
                    },
                    "keepFile": new Blob(["This file tells that a directory exists"], {
                        "type": "text/plain",
                    }),
                    "keepFileBasename": ".keep",
                }),
            };
        })();

        weakMap.set(extraArg, sliceContext);

        return sliceContext;
    }

    return { getSliceContext };
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
        filesBeingCreated: string[];
    };

    const currentWorkingDirectoryView = (
        rootState: State,
    ): CurrentWorkingDirectoryView | undefined => {
        const state = rootState.fileExplorer;
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

    type UploadProgress = {
        s3FilesBeingUploaded: FileExplorerState["~internal"]["s3FilesBeingUploaded"];
        overallProgress: {
            completedFileCount: number;
            remainingFileCount: number;
            totalFileCount: number;
            uploadPercent: number;
        };
    };

    const uploadProgress = (rootState: State): UploadProgress => {
        const { s3FilesBeingUploaded } = rootState.fileExplorer["~internal"];

        const completedFileCount = s3FilesBeingUploaded.map(
            ({ uploadPercent }) => uploadPercent === 100,
        ).length;

        return {
            s3FilesBeingUploaded,
            "overallProgress": {
                completedFileCount,
                "remainingFileCount": s3FilesBeingUploaded.length - completedFileCount,
                "totalFileCount": s3FilesBeingUploaded.length,
                "uploadPercent":
                    s3FilesBeingUploaded
                        .map(({ size, uploadPercent }) => size * uploadPercent)
                        .reduce((prev, curr) => prev + curr, 0) /
                    s3FilesBeingUploaded
                        .map(({ size }) => size)
                        .reduce((prev, curr) => prev + curr, 0),
            },
        };
    };

    return { currentWorkingDirectoryView, uploadProgress };
})();
