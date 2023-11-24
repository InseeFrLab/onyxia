import "minimal-polyfills/Object.fromEntries";
import { id } from "tsafe/id";
import {
    join as pathJoin,
    relative as pathRelative,
    basename as pathBasename
} from "path";
import { logApi } from "core/tools/commandLogger";
import type { S3Client } from "../ports/S3Client";
import { assert } from "tsafe/assert";
import * as projectConfigs from "./projectConfigs";
import { Evt } from "evt";
import type { Ctx } from "evt";
import type { State as RootState, Thunks } from "core/bootstrap";
import memoize from "memoizee";
import type { WritableDraft } from "immer/dist/types/types-external";
import * as deploymentRegion from "./deploymentRegion";
import { createExtendedFsApi } from "core/tools/extendedFsApi";
import type { ExtendedFsApi } from "core/tools/extendedFsApi";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "redux-clean-architecture";
import { mcCommandLogger } from "core/adapters/s3Client/utils/mcCommandLogger";
import { createUsecaseContextApi } from "redux-clean-architecture";
// NOTE: Polyfill of a browser feature.
import structuredClone from "@ungap/structured-clone";

//All explorer path are expected to be absolute (start with /)

export type State = {
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
    s3FilesBeingUploaded: {
        directoryPath: string;
        basename: string;
        size: number;
        uploadPercent: number;
    }[];
    commandLogsEntries: {
        cmdId: number;
        cmd: string;
        resp: string | undefined;
    }[];
};

export const name = "fileExplorer";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": id<State>({
        "directoryPath": undefined,
        "directoryItems": [],
        "isNavigationOngoing": false,
        "ongoingOperations": [],
        "s3FilesBeingUploaded": [],
        "commandLogsEntries": []
    }),
    "reducers": {
        "fileUploadStarted": (
            state,
            {
                payload
            }: {
                payload: {
                    directoryPath: string;
                    basename: string;
                    size: number;
                };
            }
        ) => {
            const { directoryPath, basename, size } = payload;

            state.s3FilesBeingUploaded.push({
                directoryPath,
                basename,
                size,
                "uploadPercent": 0
            });
        },
        "uploadProgressUpdated": (
            state,
            {
                payload
            }: {
                payload: {
                    directoryPath: string;
                    basename: string;
                    uploadPercent: number;
                };
            }
        ) => {
            const { basename, directoryPath, uploadPercent } = payload;
            const { s3FilesBeingUploaded } = state;

            const s3FileBeingUploaded = s3FilesBeingUploaded.find(
                s3FileBeingUploaded =>
                    s3FileBeingUploaded.directoryPath === directoryPath &&
                    s3FileBeingUploaded.basename === basename
            );
            assert(s3FileBeingUploaded !== undefined);
            s3FileBeingUploaded.uploadPercent = uploadPercent;

            if (
                !!s3FilesBeingUploaded.find(({ uploadPercent }) => uploadPercent !== 100)
            ) {
                return;
            }

            state.s3FilesBeingUploaded = [];
        },
        "navigationStarted": state => {
            state.isNavigationOngoing = true;
        },
        "navigationCompleted": (
            state,
            {
                payload
            }: {
                payload: {
                    directoryPath: string;
                    directoryItems: {
                        kind: "file" | "directory";
                        basename: string;
                    }[];
                };
            }
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
                                "basename": o.basename
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
                payload
            }: {
                payload: {
                    kind: "file" | "directory";
                    basename: string;
                    operation: "create" | "delete";
                };
            }
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
                                basename
                            };
                    }
                })()
            });
        },
        "operationCompleted": (
            state,
            {
                payload
            }: {
                payload: {
                    kind: "file" | "directory";
                    basename: string;
                    directoryPath: string;
                };
            }
        ) => {
            const { kind, basename, directoryPath } = payload;

            assert(state.directoryPath !== undefined);

            const { ongoingOperations } = state;

            const ongoingOperation = ongoingOperations.find(
                o =>
                    o.kind === kind &&
                    o.basename === basename &&
                    pathRelative(o.directoryPath, directoryPath) === ""
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
                        kind
                    });
                    break;
            }
        },
        "apiHistoryUpdated": (
            state,
            { payload }: { payload: { commandLogsEntries: State["commandLogsEntries"] } }
        ) => {
            const { commandLogsEntries } = payload;

            state.commandLogsEntries = commandLogsEntries;
        }
    }
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
        () =>
        (...args) => {
            const [dispatch, , rootContext] = args;

            if (getIsContextSet(rootContext)) {
                //NOTE: We don't want to initialize twice.
                return;
            }

            const { commandLogs, loggedApi } = logApi({
                "api": rootContext.s3Client,
                "commandLogger": mcCommandLogger
            });

            commandLogs.evt.toStateful().attach(() =>
                dispatch(
                    actions.apiHistoryUpdated({
                        // NOTE: We spread only for the type.
                        "commandLogsEntries": [...structuredClone(commandLogs.history)]
                    })
                )
            );

            setContext(rootContext, {
                "loggedS3Client": loggedApi,
                "loggedExtendedFsApi": createExtendedFsApi({
                    "baseFsApi": {
                        "list": loggedApi.list,
                        "deleteFile": loggedApi.deleteFile,
                        "downloadFile": createObjectThatThrowsIfAccessed({
                            "debugMessage":
                                "We are not supposed to have do download file here. Moving file is too expensive in S3"
                        }),
                        "uploadFile": ({ file, path }) =>
                            loggedApi.uploadFile({
                                path,
                                "blob": file,
                                "onUploadProgress": () => {}
                            })
                    },
                    "keepFile": new Blob(["This file tells that a directory exists"], {
                        "type": "text/plain"
                    }),
                    "keepFileBasename": ".keep"
                })
            });
        },
    /**
     * NOTE: It IS possible to navigate to a directory currently being renamed or created.
     */
    "navigate":
        (params: { directoryPath: string; forceReload: boolean }) =>
        async (...args) => {
            const { directoryPath, forceReload } = params;

            const [dispatch, getState, extraArg] = args;

            //Avoid navigating to the current directory.
            if (!forceReload) {
                const currentDirectoryPath = getState()[name].directoryPath;

                if (
                    currentDirectoryPath !== undefined &&
                    pathRelative(currentDirectoryPath, directoryPath) === ""
                ) {
                    return;
                }
            }

            const { loggedS3Client } = getContext(extraArg);

            dispatch(thunks.cancelNavigation());

            dispatch(actions.navigationStarted());

            const ctx = Evt.newCtx();

            extraArg.evtAction.attach(
                event =>
                    event.usecaseName === "fileExplorer" &&
                    event.actionName === "navigationCanceled",
                ctx,
                () => ctx.done()
            );

            await dispatch(
                privateThunks.waitForNoOngoingOperation({
                    "kind": "directory",
                    "directoryPath": pathJoin(directoryPath, ".."),
                    "basename": pathBasename(directoryPath),
                    ctx
                })
            );

            const { directories, files } = await Evt.from(
                ctx,
                loggedS3Client.list({ "path": directoryPath })
            ).waitFor();

            ctx.done();

            dispatch(
                actions.navigationCompleted({
                    directoryPath,
                    "directoryItems": [
                        ...directories.map(basename => ({
                            basename,
                            "kind": "directory" as const
                        })),
                        ...files.map(basename => ({ basename, "kind": "file" as const }))
                    ]
                })
            );
        },
    "waitForNoOngoingOperation":
        (params: {
            kind: "file" | "directory";
            basename: string;
            directoryPath: string;
            ctx?: Ctx;
        }) =>
        async (...args) => {
            const [, getState, { evtAction }] = args;

            const { kind, basename, directoryPath, ctx = Evt.newCtx() } = params;

            const { ongoingOperations } = getState()[name];

            const ongoingOperation = ongoingOperations.find(
                o =>
                    o.kind === kind &&
                    o.basename === basename &&
                    o.directoryPath === directoryPath
            );

            if (ongoingOperation === undefined) {
                return;
            }

            await evtAction.waitFor(
                event =>
                    event.usecaseName === "fileExplorer" &&
                    event.actionName === "operationCompleted" &&
                    event.payload.kind === kind &&
                    event.payload.basename === basename &&
                    pathRelative(event.payload.directoryPath, directoryPath) === "",
                ctx
            );
        }
} satisfies Thunks;

export const thunks = {
    "getProjectHomeOrPreviousPath":
        () =>
        (...args) => {
            const [, getState] = args;

            const homeDirectoryPath = `/${
                projectConfigs.selectors.selectedProject(getState()).bucket
            }`;

            const currentDirectoryPath = getState()[name].directoryPath;

            return_current_path: {
                if (currentDirectoryPath === undefined) {
                    //NOTE: First navigation
                    break return_current_path;
                }

                if (!currentDirectoryPath.startsWith(homeDirectoryPath)) {
                    // The project has changed while we where on another page
                    break return_current_path;
                }

                return currentDirectoryPath;
            }

            return homeDirectoryPath;
        },
    /**
     * NOTE: It IS possible to navigate to a directory currently being renamed or created.
     */
    "navigate":
        (params: { directoryPath: string }) =>
        async (...args) => {
            const { directoryPath } = params;

            const [dispatch] = args;

            dispatch(privateThunks.lazyInitialization());

            return dispatch(
                privateThunks.navigate({
                    directoryPath,
                    "forceReload": false
                })
            );
        },
    //Not used by the UI so far but we want to later
    "cancelNavigation":
        () =>
        (...args) => {
            const [dispatch, getState] = args;
            if (!getState()[name].isNavigationOngoing) {
                return;
            }
            dispatch(actions.navigationCanceled());
        },
    "refresh":
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { directoryPath } = getState()[name];

            if (directoryPath === undefined) {
                return;
            }

            await dispatch(
                privateThunks.navigate({
                    directoryPath,
                    "forceReload": true
                })
            );
        },
    "create":
        (params: ExplorersCreateParams) =>
        async (...args) => {
            const [dispatch, getState, rootContext] = args;

            const contextualState = getState()[name];

            const { directoryPath } = contextualState;

            assert(directoryPath !== undefined);

            await dispatch(
                privateThunks.waitForNoOngoingOperation({
                    "kind": params.createWhat,
                    directoryPath,
                    "basename": params.basename
                })
            );

            dispatch(
                actions.operationStarted({
                    "kind": params.createWhat,
                    "basename": params.basename,
                    "operation": "create"
                })
            );

            const context = getContext(rootContext);

            const path = pathJoin(directoryPath, params.basename);

            switch (params.createWhat) {
                case "file":
                    console.log("todo: here we need to wait that the upload start");

                    dispatch(
                        actions.fileUploadStarted({
                            "basename": params.basename,
                            directoryPath,
                            "size": params.blob.size
                        })
                    );

                    context.loggedS3Client.uploadFile({
                        path,
                        "blob": params.blob,
                        "onUploadProgress": ({ uploadPercent }) =>
                            dispatch(
                                actions.uploadProgressUpdated({
                                    "basename": params.basename,
                                    directoryPath,
                                    uploadPercent
                                })
                            )
                    });
                    break;
                case "directory":
                    await context.loggedExtendedFsApi.createDirectory({ path });
                    break;
            }

            dispatch(
                actions.operationCompleted({
                    "kind": params.createWhat,
                    "basename": params.basename,
                    directoryPath
                })
            );
        },

    /**
     * Assert:
     * The file or directory we are deleting is present in the directory
     * currently listed.
     */
    "delete":
        (params: { deleteWhat: "file" | "directory"; basename: string }) =>
        async (...args) => {
            const { deleteWhat, basename } = params;

            const [dispatch, getState, rootContext] = args;

            const contextualState = getState()[name];

            const { directoryPath } = contextualState;

            assert(directoryPath !== undefined);

            await dispatch(
                privateThunks.waitForNoOngoingOperation({
                    "kind": deleteWhat,
                    directoryPath,
                    basename
                })
            );

            dispatch(
                actions.operationStarted({
                    "kind": params.deleteWhat,
                    "basename": params.basename,
                    "operation": "delete"
                })
            );

            const context = getContext(rootContext);

            const path = pathJoin(directoryPath, basename);

            switch (deleteWhat) {
                case "directory":
                    await context.loggedExtendedFsApi.deleteDirectory({ path });
                    break;
                case "file":
                    await context.loggedS3Client.deleteFile({
                        path
                    });
                    break;
            }

            dispatch(
                actions.operationCompleted({
                    "kind": deleteWhat,
                    basename,
                    directoryPath
                })
            );
        },
    "getIsEnabled":
        () =>
        (...args): boolean => {
            const [, getState] = args;

            const region = deploymentRegion.selectors.selectedDeploymentRegion(
                getState()
            );

            return region.s3 !== undefined;
        },
    "getFileDownloadUrl":
        (params: { basename: string }) =>
        async (...args): Promise<string> => {
            const { basename } = params;

            const [, getState, rootContext] = args;

            const contextualState = getState()[name];

            const { directoryPath } = contextualState;

            assert(directoryPath !== undefined);

            const context = getContext(rootContext);

            const path = pathJoin(directoryPath, basename);

            const downloadUrl = await context.loggedS3Client.getFileDownloadUrl({
                path
            });

            return downloadUrl;
        }
} satisfies Thunks;

type Context = {
    loggedS3Client: S3Client;
    loggedExtendedFsApi: ExtendedFsApi;
};

const { getContext, setContext, getIsContextSet } = createUsecaseContextApi<Context>();

function removeIfPresent(
    directoryItems: WritableDraft<{
        kind: "file" | "directory";
        basename: string;
    }>[],
    item: { kind: "file" | "directory"; basename: string }
): void {
    const index = directoryItems.findIndex(
        item_i => item_i.kind === item.kind && item_i.basename === item.basename
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
        rootState: RootState
    ): CurrentWorkingDirectoryView | undefined => {
        const state = rootState[name];
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
                                        o.operation === operation
                                )
                                .map(({ basename }) => basename)
                    );

                    const select = (kind: "directory" | "file") =>
                        [
                            ...directoryItems
                                .filter(item => item.kind === kind)
                                .map(({ basename }) => basename),
                            ...selectOngoing(kind, "create"),
                            ...selectOngoing(kind, "rename")
                        ].sort((a, b) => a.localeCompare(b));

                    return {
                        "directories": select("directory"),
                        "files": select("file"),
                        "directoriesBeingCreated": selectOngoing("directory", "create"),
                        "directoriesBeingRenamed": selectOngoing("directory", "rename"),
                        "filesBeingCreated": selectOngoing("file", "create"),
                        "filesBeingRenamed": selectOngoing("file", "rename")
                    };
                })()
            };
        })();
    };

    type UploadProgress = {
        s3FilesBeingUploaded: State["s3FilesBeingUploaded"];
        overallProgress: {
            completedFileCount: number;
            remainingFileCount: number;
            totalFileCount: number;
            uploadPercent: number;
        };
    };

    const uploadProgress = (rootState: RootState): UploadProgress => {
        const { s3FilesBeingUploaded } = rootState[name];

        const completedFileCount = s3FilesBeingUploaded.map(
            ({ uploadPercent }) => uploadPercent === 100
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
                        .reduce((prev, curr) => prev + curr, 0)
            }
        };
    };

    const commandLogsEntries = (rootState: RootState) =>
        rootState[name].commandLogsEntries;

    return { currentWorkingDirectoryView, uploadProgress, commandLogsEntries };
})();
