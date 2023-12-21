import { logApi } from "core/tools/commandLogger";
import type { S3Client } from "core/ports/S3Client";
import { assert } from "tsafe/assert";
import { Evt } from "evt";
import type { Ctx } from "evt";
import type { Thunks } from "core/bootstrap";
import { createExtendedFsApi } from "core/tools/extendedFsApi";
import type { ExtendedFsApi } from "core/tools/extendedFsApi";
import { createObjectThatThrowsIfAccessed } from "redux-clean-architecture";
import { mcCommandLogger } from "core/adapters/s3Client/utils/mcCommandLogger";
import { createUsecaseContextApi } from "redux-clean-architecture";
// NOTE: Polyfill of a browser feature.
import structuredClone from "@ungap/structured-clone";
import { name, actions } from "./state";
import { protectedSelectors } from "./selectors";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";

export type ExplorersCreateParams =
    | ExplorersCreateParams.Directory
    | ExplorersCreateParams.File;

export declare namespace ExplorersCreateParams {
    export type Common = {
        basename: string;
    };

    export type Directory = Common & {
        createWhat: "directory";
    };

    export type File = Common & {
        createWhat: "file";
        blob: Blob;
    };
}

const privateThunks = {
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
                    event.payload.directoryPath === directoryPath,
                ctx
            );
        },

    /**
     * NOTE: It IS possible to navigate to a directory currently being renamed or created.
     */
    "navigate":
        (params: { directoryPath: string; doListAgainIfSamePath: boolean }) =>
        async (...args) => {
            const { directoryPath, doListAgainIfSamePath } = params;

            const [dispatch, getState, extraArg] = args;

            if (
                !doListAgainIfSamePath &&
                getState()[name].directoryPath === directoryPath
            ) {
                return;
            }

            const { loggedS3Client } = getContext(extraArg);

            dispatch(thunks.cancelNavigation());

            dispatch(actions.navigationStarted());

            const ctx = Evt.newCtx();

            extraArg.evtAction.attach(
                event =>
                    event.usecaseName === name &&
                    event.actionName === "navigationCanceled",
                ctx,
                () => ctx.done()
            );

            await dispatch(
                privateThunks.waitForNoOngoingOperation({
                    "kind": "directory",
                    "directoryPath": directoryPath.replace(/[^/]+\/$/, ""), //pathJoin(directoryPath, ".."),
                    "basename": directoryPath.match(/([^/]+)\/$/)![1], //pathBasename(directoryPath),
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
        }
} satisfies Thunks;

export const thunks = {
    "setCurrentDirectory":
        (params: { directoryPath: string | undefined }) =>
        async (...args) => {
            const { directoryPath } = params;

            const [dispatch] = args;

            if (directoryPath === undefined) {
                dispatch(actions.notifyDirectoryPath());
                return;
            }

            await dispatch(
                privateThunks.navigate({
                    "directoryPath": directoryPath
                        .replace(/\/\//g, "/")
                        .replace(/^\//g, "")
                        .replace(/\/$/g, "/"),
                    "doListAgainIfSamePath": false
                })
            );
        },
    "refreshCurrentDirectory":
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { directoryPath } = getState()[name];

            assert(directoryPath !== undefined);

            await dispatch(
                privateThunks.navigate({ directoryPath, "doListAgainIfSamePath": false })
            );
        },
    "create":
        (params: ExplorersCreateParams) =>
        async (...args) => {
            const [dispatch, getState, rootContext] = args;

            const state = getState()[name];

            const { directoryPath } = state;

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

            const path = `${directoryPath}${params.basename}/`;

            switch (params.createWhat) {
                case "file":
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

            const state = getState()[name];

            const { directoryPath } = state;

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

            const path = `${directoryPath}${basename}/`;

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
    "getFileDownloadUrl":
        (params: { basename: string }) =>
        async (...args): Promise<string> => {
            const { basename } = params;

            const [, getState, rootContext] = args;

            const state = getState()[name];

            const { directoryPath } = state;

            assert(directoryPath !== undefined);

            const context = getContext(rootContext);

            const downloadUrl = await context.loggedS3Client.getFileDownloadUrl({
                "path": `${directoryPath}${basename}/`
            });

            return downloadUrl;
        }
} satisfies Thunks;

export const protectedThunks = {
    "initialize":
        () =>
        (...args) => {
            const [dispatch, getState, rootContext] = args;

            const { evtAction } = rootContext;

            evtAction
                .toStateful()
                .pipe(() => [protectedSelectors.workingDirectoryPath(getState())])
                .pipe(onlyIfChanged())
                .toStateless()
                .attach(() => dispatch(actions.contextChanged()));

            setContext(rootContext, () => {
                const { commandLogs, loggedApi } = logApi({
                    "api": rootContext.s3Client,
                    "commandLogger": mcCommandLogger
                });

                commandLogs.evt.toStateful().attach(() =>
                    dispatch(
                        actions.apiHistoryUpdated({
                            // NOTE: We spread only for the type.
                            "commandLogsEntries": [
                                ...structuredClone(commandLogs.history)
                            ]
                        })
                    )
                );

                return {
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
                        "keepFile": new Blob(
                            ["This file tells that a directory exists"],
                            { "type": "text/plain" }
                        ),
                        "keepFileBasename": ".keep"
                    })
                };
            });
        }
} satisfies Thunks;

const { getContext, setContext } = createUsecaseContextApi<{
    loggedS3Client: S3Client;
    loggedExtendedFsApi: ExtendedFsApi;
}>();
