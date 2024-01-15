import { assert } from "tsafe/assert";
import { Evt } from "evt";
import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { selectors, protectedSelectors } from "./selectors";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { join as pathJoin, basename as pathBasename } from "path";
import { crawlFactory } from "core/tools/crawl";

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
                    event.payload.kind === kind &&
                    event.payload.basename === basename &&
                    event.payload.directoryPath === directoryPath
            );
        },

    /**
     * NOTE: It IS possible to navigate to a directory currently being renamed or created.
     */
    "navigate":
        (params: { directoryPath: string; doListAgainIfSamePath: boolean }) =>
        async (...args) => {
            const { directoryPath, doListAgainIfSamePath } = params;

            const [dispatch, getState, { evtAction, s3ClientForExplorer }] = args;

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

            const { directories, files } = await s3ClientForExplorer.list({
                "path": directoryPath
            });

            if (ctx.completionStatus !== undefined) {
                dispatch(actions.commandLogCancelled({ cmdId }));
                return;
            }

            ctx.done();

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    "resp": [
                        ...directories.map(directory => `${directory}/`),
                        ...files
                    ].join("\n")
                })
            );

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
                    "directoryPath": directoryPath,
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
            const [dispatch, getState, { s3ClientForExplorer }] = args;

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

                await s3ClientForExplorer.uploadFile({
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
            };

            switch (params.createWhat) {
                case "file":
                    dispatch(
                        actions.fileUploadStarted({
                            "basename": params.basename,
                            directoryPath,
                            "size": params.blob.size
                        })
                    );
                    await uploadFileAndLogCommand({
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
                    break;
                case "directory":
                    await uploadFileAndLogCommand({
                        "path": pathJoin(directoryPath, params.basename, ".keep"),
                        "blob": new Blob(["This file tells that a directory exists"], {
                            "type": "text/plain"
                        }),
                        "onUploadProgress": () => {}
                    });
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

            const [dispatch, getState, { s3ClientForExplorer }] = args;

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

            const deleteFileAndLogCommand = async (filePath: string) => {
                const cmdId = Date.now();

                dispatch(
                    actions.commandLogIssued({
                        cmdId,
                        "cmd": `mc rm ${pathJoin("s3", filePath)}`
                    })
                );

                await s3ClientForExplorer.deleteFile({ "path": filePath });

                dispatch(
                    actions.commandLogResponseReceived({
                        cmdId,
                        "resp": `Removed \`${pathJoin("s3", filePath)}\``
                    })
                );
            };

            switch (deleteWhat) {
                case "directory":
                    {
                        const { crawl } = crawlFactory({
                            "list": async ({ directoryPath }) => {
                                const { directories, files } =
                                    await s3ClientForExplorer.list({
                                        "path": directoryPath
                                    });

                                return {
                                    "fileBasenames": files,
                                    "directoryBasenames": directories
                                };
                            }
                        });

                        const directoryToDeletePath = pathJoin(directoryPath, basename);

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
                        const fileToDeletePath = pathJoin(directoryPath, basename);

                        await deleteFileAndLogCommand(fileToDeletePath);
                    }
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

            const [dispatch, getState, { s3ClientForExplorer }] = args;

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

            const downloadUrl = await s3ClientForExplorer.getFileDownloadUrl({
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

export const protectedThunks = {
    "initialize":
        () =>
        (...args) => {
            const [dispatch, getState, { evtAction }] = args;

            const { isFileExplorerEnabled } = selectors.isFileExplorerEnabled(getState());

            if (!isFileExplorerEnabled) {
                return;
            }

            evtAction
                .toStateful()
                .pipe(() => [protectedSelectors.workingDirectoryPath(getState())])
                .pipe(onlyIfChanged())
                .toStateless()
                .attach(() => dispatch(actions.workingDirectoryChanged()));
        }
} satisfies Thunks;
