import { assert } from "tsafe/assert";
import { Evt } from "evt";
import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { selectors, protectedSelectors } from "./selectors";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { join as pathJoin, basename as pathBasename } from "pathe";
import { crawlFactory } from "core/tools/crawl";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import { S3Object } from "core/ports/S3Client";

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
        }) =>
        async (...args) => {
            const [, getState, { evtAction }] = args;

            const { kind, basename, directoryPath } = params;

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
                    event.payload.object.kind === kind &&
                    event.payload.object.basename === basename &&
                    event.payload.directoryPath === directoryPath
            );
        },
    /**
     * NOTE: It IS possible to navigate to a directory currently being renamed or created.
     */
    "navigate":
        (params: { directoryPath: string; doListAgainIfSamePath: boolean }) =>
        async (...args) => {
            const { doListAgainIfSamePath } = params;

            // Ensure trailing slash for consistency.
            const directoryPath = params.directoryPath.replace(/\/+$/, "") + "/";

            const [dispatch, getState, { evtAction }] = args;

            if (
                !doListAgainIfSamePath &&
                getState()[name].directoryPath === directoryPath
            ) {
                return;
            }

            dispatch(actions.navigationStarted());

            const ctx = Evt.newCtx();

            evtAction.attachOnce(
                event =>
                    event.usecaseName === name &&
                    event.actionName === "navigationStarted",
                ctx,
                () => ctx.abort(new Error("Other navigation started"))
            );

            await dispatch(
                privateThunks.waitForNoOngoingOperation({
                    "kind": "directory",
                    "directoryPath": pathJoin(directoryPath, "..") + "/",
                    "basename": pathBasename(directoryPath)
                })
            );

            const cmdId = Date.now();

            dispatch(
                actions.commandLogIssued({
                    cmdId,
                    "cmd": `mc ls ${pathJoin("s3", directoryPath)}`
                })
            );

            const s3Client = await dispatch(
                s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
            ).then(r => {
                assert(r !== undefined);
                return r.s3Client;
            });

            const objects = await s3Client.listObjects({ path: directoryPath });

            if (ctx.completionStatus !== undefined) {
                dispatch(actions.commandLogCancelled({ cmdId }));
                return;
            }

            ctx.done();

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    "resp": objects
                        .map(({ kind, basename }) =>
                            kind === "directory" ? `${basename}/` : basename
                        )
                        .join("\n")
                })
            );

            dispatch(
                actions.navigationCompleted({
                    directoryPath,
                    objects
                })
            );
        }
} satisfies Thunks;

export const thunks = {
    "initialize":
        (params: { directoryPath: string | undefined; viewMode: "list" | "block" }) =>
        (...args): { cleanup: () => void } => {
            const { directoryPath, viewMode } = params;

            const [dispatch, getState, { evtAction }] = args;

            const ctx = Evt.newCtx();

            evtAction.attachOnce(
                event =>
                    event.usecaseName === "projectManagement" &&
                    event.actionName === "projectChanged",
                ctx,
                () => {
                    dispatch(
                        thunks.initialize({
                            viewMode,
                            "directoryPath": undefined
                        })
                    );
                }
            );

            (async () => {
                dispatch(actions.viewModeChanged({ viewMode }));

                if (directoryPath === undefined) {
                    const inStateDirectoryPath =
                        protectedSelectors.directoryPath(getState());

                    const currentS3WorkingDirectoryPath =
                        protectedSelectors.workingDirectoryPath(getState());

                    await dispatch(
                        privateThunks.navigate({
                            "directoryPath":
                                inStateDirectoryPath !== undefined &&
                                inStateDirectoryPath.startsWith(
                                    currentS3WorkingDirectoryPath
                                )
                                    ? inStateDirectoryPath //we can restore to the past state
                                    : currentS3WorkingDirectoryPath, //project has changed since last visit of myFiles
                            "doListAgainIfSamePath": true
                        })
                    );
                    return;
                }
                await dispatch(
                    privateThunks.navigate({
                        "directoryPath": directoryPath,
                        "doListAgainIfSamePath": false
                    })
                );
            })();

            const cleanup = () => {
                ctx.done();
            };

            return { cleanup };
        },

    "changeCurrentDirectory":
        (params: { directoryPath: string }) =>
        async (...args) => {
            const { directoryPath } = params;

            const [dispatch] = args;

            await dispatch(
                privateThunks.navigate({
                    "directoryPath": directoryPath,
                    "doListAgainIfSamePath": false
                })
            );
        },
    "changeViewMode":
        (params: { viewMode: "list" | "block" }) =>
        async (...args) => {
            const { viewMode } = params;

            const [dispatch] = args;

            dispatch(actions.viewModeChanged({ viewMode }));
        },
    "refreshCurrentDirectory":
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { directoryPath } = getState()[name];

            assert(directoryPath !== undefined);

            await dispatch(
                privateThunks.navigate({ directoryPath, "doListAgainIfSamePath": true })
            );
        },
    "create":
        (params: ExplorersCreateParams) =>
        async (...args) => {
            const [dispatch, getState] = args;

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

            const uploadFileAndLogCommand = async (params: {
                path: string;
                blob: Blob;
                onUploadProgress: (params: { uploadPercent: number }) => void;
            }) => {
                const { path, blob, onUploadProgress } = params;

                const cmdId = Date.now();

                dispatch(
                    actions.commandLogIssued({
                        cmdId,
                        "cmd": `mc cp ${pathJoin(".", pathBasename(path))} ${pathJoin(
                            "s3",
                            path
                        )}`
                    })
                );

                const s3Client = await dispatch(
                    s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
                ).then(r => {
                    assert(r !== undefined);
                    return r.s3Client;
                });

                const uploadResult = await s3Client.uploadFile({
                    path,
                    blob,
                    "onUploadProgress": ({ uploadPercent }) => {
                        onUploadProgress({ uploadPercent });

                        dispatch(
                            actions.commandLogResponseReceived({
                                cmdId,
                                "resp": `... ${uploadPercent}% of ${blob.size} Bytes uploaded`
                            })
                        );
                    }
                });
                return uploadResult;
            };
            const completedObject = await (async () => {
                switch (params.createWhat) {
                    case "file": {
                        dispatch(
                            actions.fileUploadStarted({
                                "basename": params.basename,
                                directoryPath,
                                "size": params.blob.size
                            })
                        );
                        const uploadResult = await uploadFileAndLogCommand({
                            "path": pathJoin(directoryPath, params.basename),
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
                        return {
                            "kind": "file",
                            "basename": uploadResult.basename,
                            "size": uploadResult.size,
                            "lastModified": uploadResult.lastModified,
                            "policy": "private"
                        } satisfies S3Object.File;
                    }
                    case "directory": {
                        await uploadFileAndLogCommand({
                            "path": pathJoin(directoryPath, params.basename, ".keep"),
                            "blob": new Blob(
                                ["This file tells that a directory exists"],
                                {
                                    "type": "text/plain"
                                }
                            ),
                            "onUploadProgress": () => {}
                        });

                        return {
                            "kind": "directory",
                            "basename": params.basename,
                            "policy": "private"
                        } satisfies S3Object.Directory;
                    }
                }
            })();

            dispatch(
                actions.operationCompleted({
                    object: completedObject, //To continue
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
        (params: { s3Object: S3Object }) =>
        async (...args) => {
            const { s3Object } = params;

            const [dispatch, getState] = args;

            const state = getState()[name];

            const { directoryPath } = state;

            assert(directoryPath !== undefined);

            await dispatch(
                privateThunks.waitForNoOngoingOperation({
                    "kind": s3Object.kind,
                    directoryPath,
                    basename: s3Object.basename
                })
            );

            dispatch(
                actions.operationStarted({
                    "kind": params.s3Object.kind,
                    "basename": params.s3Object.basename,
                    "operation": "delete"
                })
            );

            const s3Client = await dispatch(
                s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
            ).then(r => {
                assert(r !== undefined);
                return r.s3Client;
            });

            const deleteFileAndLogCommand = async (filePath: string) => {
                const cmdId = Date.now();

                dispatch(
                    actions.commandLogIssued({
                        cmdId,
                        "cmd": `mc rm ${pathJoin("s3", filePath)}`
                    })
                );

                await s3Client.deleteFile({ "path": filePath });

                dispatch(
                    actions.commandLogResponseReceived({
                        cmdId,
                        "resp": `Removed \`${pathJoin("s3", filePath)}\``
                    })
                );
            };

            switch (s3Object.kind) {
                case "directory":
                    {
                        const { crawl } = crawlFactory({
                            "list": async ({ directoryPath }) => {
                                const { directories, files } = await s3Client.list({
                                    "path": directoryPath
                                });

                                return {
                                    "fileBasenames": files,
                                    "directoryBasenames": directories
                                };
                            }
                        });

                        const directoryToDeletePath = pathJoin(
                            directoryPath,
                            s3Object.basename
                        );

                        const { filePaths } = await crawl({
                            "directoryPath": directoryToDeletePath
                        });

                        await Promise.all(
                            filePaths
                                .map(filePathRelative =>
                                    pathJoin(directoryToDeletePath, filePathRelative)
                                )
                                .map(deleteFileAndLogCommand)
                        );
                    }
                    break;
                case "file":
                    {
                        const fileToDeletePath = pathJoin(
                            directoryPath,
                            s3Object.basename
                        );

                        await deleteFileAndLogCommand(fileToDeletePath);
                    }
                    break;
            }

            dispatch(
                actions.operationCompleted({
                    object: s3Object,
                    directoryPath
                })
            );
        },
    "getFileDownloadUrl":
        (params: { basename: string }) =>
        async (...args): Promise<string> => {
            const { basename } = params;

            const [dispatch, getState] = args;

            const state = getState()[name];

            const { directoryPath } = state;

            assert(directoryPath !== undefined);

            const path = pathJoin(directoryPath, basename);

            const cmdId = Date.now();

            dispatch(
                actions.commandLogIssued({
                    cmdId,
                    "cmd": `mc share download --expire 1h ${pathJoin("s3", path)}`
                })
            );

            const s3Client = await dispatch(
                s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
            ).then(r => {
                assert(r !== undefined);
                return r.s3Client;
            });

            const downloadUrl = await s3Client.getFileDownloadUrl({
                path,
                "validityDurationSecond": 3600
            });

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    "resp": [
                        `URL: ${downloadUrl.split("?")[0]}`,
                        `Expire: 0 days 1 hours 0 minutes 0 seconds`,
                        `Share: ${downloadUrl}`
                    ].join("\n")
                })
            );

            return downloadUrl;
        }
} satisfies Thunks;
