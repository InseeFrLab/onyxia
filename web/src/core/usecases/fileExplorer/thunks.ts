import { assert } from "tsafe/assert";
import { Evt } from "evt";
import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { protectedSelectors } from "./selectors";
import { join as pathJoin, basename as pathBasename } from "pathe";
import { crawlFactory } from "core/tools/crawl";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import { S3Object } from "core/ports/S3Client";
import { formatDuration } from "core/tools/timeFormat/formatDuration";

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
    createOperation:
        (params: {
            operation: "create" | "delete" | "modifyPolicy";
            objects: S3Object[];
            directoryPath: string;
        }) =>
        async (...args) => {
            const [dispatch, ,] = args;

            const { operation, objects, directoryPath } = params;

            const operationId = `${operation}-${Date.now()}`;

            dispatch(actions.operationStarted({ operationId, objects, operation }));

            await dispatch(
                privateThunks.waitForNoOngoingOperation({
                    targets: objects,
                    directoryPath,
                    ignoreOperationId: operationId
                })
            );
            return operationId;
        },
    waitForNoOngoingOperation:
        (params: {
            targets: Array<{ kind: "file" | "directory"; basename: string }>;
            directoryPath: string;
            ignoreOperationId?: string;
        }) =>
        async (...args) => {
            const [, getState, { evtAction }] = args;

            const { targets, directoryPath, ignoreOperationId } = params;

            const { ongoingOperations } = getState()[name];

            const ongoingOperation = ongoingOperations.find(
                o =>
                    o.directoryPath === directoryPath &&
                    o.operationId !== ignoreOperationId &&
                    targets.every(target =>
                        o.objects.some(
                            ongoingObj =>
                                ongoingObj.kind === target.kind &&
                                ongoingObj.basename === target.basename
                        )
                    )
            );

            if (ongoingOperation === undefined) {
                return;
            }

            await evtAction.waitFor(
                event =>
                    event.usecaseName === "fileExplorer" &&
                    event.actionName === "operationCompleted" &&
                    event.payload.operationId === ongoingOperation.operationId
            );
        },
    /**
     * NOTE: It IS possible to navigate to a directory currently being renamed or created.
     */
    navigate:
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
                    targets: [
                        { kind: "directory", basename: pathBasename(directoryPath) }
                    ],
                    directoryPath: pathJoin(directoryPath, "..") + "/"
                })
            );

            const cmdId = Date.now();

            dispatch(
                actions.commandLogIssued({
                    cmdId,
                    cmd: `mc ls ${pathJoin("s3", directoryPath)}`
                })
            );

            const s3Client = await dispatch(
                s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
            ).then(r => {
                assert(r !== undefined);
                return r.s3Client;
            });

            const { objects, bucketPolicy } = await s3Client.listObjects({
                path: directoryPath
            });

            if (ctx.completionStatus !== undefined) {
                dispatch(actions.commandLogCancelled({ cmdId }));
                return;
            }

            ctx.done();

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    resp: objects
                        .map(({ kind, basename }) =>
                            kind === "directory" ? `${basename}/` : basename
                        )
                        .join("\n")
                })
            );

            dispatch(
                actions.navigationCompleted({
                    directoryPath,
                    objects,
                    bucketPolicy
                })
            );
        }
} satisfies Thunks;

export const thunks = {
    initialize:
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
                            viewMode: getState()[name].viewMode,
                            directoryPath: undefined
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
                            directoryPath:
                                inStateDirectoryPath !== undefined &&
                                inStateDirectoryPath.startsWith(
                                    currentS3WorkingDirectoryPath
                                )
                                    ? inStateDirectoryPath //we can restore to the past state
                                    : currentS3WorkingDirectoryPath, //project has changed since last visit of myFiles
                            doListAgainIfSamePath: true
                        })
                    );
                    return;
                }
                await dispatch(
                    privateThunks.navigate({
                        directoryPath: directoryPath,
                        doListAgainIfSamePath: false
                    })
                );
            })();

            const cleanup = () => {
                ctx.done();
            };

            return { cleanup };
        },

    changeCurrentDirectory:
        (params: { directoryPath: string }) =>
        async (...args) => {
            const { directoryPath } = params;

            const [dispatch] = args;

            await dispatch(
                privateThunks.navigate({
                    directoryPath: directoryPath,
                    doListAgainIfSamePath: false
                })
            );
        },
    changeViewMode:
        (params: { viewMode: "list" | "block" }) =>
        async (...args) => {
            const { viewMode } = params;

            const [dispatch] = args;

            dispatch(actions.viewModeChanged({ viewMode }));
        },
    changePolicy:
        (params: {
            basename: string;
            policy: S3Object["policy"];
            kind: S3Object["kind"];
        }) =>
        async (...args) => {
            const { policy, basename, kind } = params;

            const [dispatch, getState] = args;

            const state = getState()[name];

            const { directoryPath, objects } = state;

            const object = objects.find(o => o.basename === basename && o.kind === kind);

            assert(object !== undefined);
            assert(directoryPath !== undefined);

            const operationId = await dispatch(
                privateThunks.createOperation({
                    operation: "modifyPolicy",
                    objects: [{ ...object, policy }],
                    directoryPath
                })
            );
            const s3Client = await dispatch(
                s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
            ).then(r => {
                assert(r !== undefined);
                return r.s3Client;
            });

            const filePath = pathJoin(directoryPath, basename);
            const s3Prefix = pathJoin("s3", filePath);

            const cmdId = Date.now();

            dispatch(
                actions.commandLogIssued({
                    cmdId,
                    cmd: `mc anonymous set ${(() => {
                        switch (policy) {
                            case "public":
                                return "download";
                            case "private":
                                return "none";
                        }
                    })()} ${s3Prefix}`
                })
            );

            const modifiedBucketPolicy = await s3Client.setPathAccessPolicy({
                path: filePath,
                policy,
                currentBucketPolicy: getState()[name].bucketPolicy
            });

            dispatch(
                actions.operationCompleted({
                    operationId,
                    objects: [object]
                })
            );

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    resp: `Access permission for \`${s3Prefix}\` is set to \`${(() => {
                        switch (policy) {
                            case "public":
                                return "download";
                            case "private":
                                return "custom";
                        }
                    })()}\``
                })
            );

            dispatch(
                actions.bucketPolicyModified({
                    bucketPolicy: modifiedBucketPolicy,
                    basename,
                    policy
                })
            );
        },
    refreshCurrentDirectory:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { directoryPath } = getState()[name];

            assert(directoryPath !== undefined);

            await dispatch(
                privateThunks.navigate({ directoryPath, doListAgainIfSamePath: true })
            );
        },
    create:
        (params: ExplorersCreateParams) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const state = getState()[name];

            const { directoryPath } = state;

            assert(directoryPath !== undefined);

            const operationId = await dispatch(
                privateThunks.createOperation({
                    objects: [
                        {
                            kind: params.createWhat,
                            basename: params.basename,
                            policy: "private",
                            size: undefined,
                            lastModified: undefined
                        }
                    ],
                    directoryPath,
                    operation: "create"
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
                        cmd: `mc cp ${pathJoin(".", pathBasename(path))} ${pathJoin(
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
                    onUploadProgress: ({ uploadPercent }) => {
                        onUploadProgress({ uploadPercent });

                        dispatch(
                            actions.commandLogResponseReceived({
                                cmdId,
                                resp: `... ${uploadPercent}% of ${blob.size} Bytes uploaded`
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
                                basename: params.basename,
                                directoryPath,
                                size: params.blob.size
                            })
                        );
                        const uploadResult = await uploadFileAndLogCommand({
                            path: pathJoin(directoryPath, params.basename),
                            blob: params.blob,
                            onUploadProgress: ({ uploadPercent }) =>
                                dispatch(
                                    actions.uploadProgressUpdated({
                                        basename: params.basename,
                                        directoryPath,
                                        uploadPercent
                                    })
                                )
                        });
                        return {
                            kind: "file",
                            basename: uploadResult.basename,
                            size: uploadResult.size,
                            lastModified: uploadResult.lastModified,
                            policy: "private"
                        } satisfies S3Object.File;
                    }
                    case "directory": {
                        await uploadFileAndLogCommand({
                            path: pathJoin(directoryPath, params.basename, ".keep"),
                            blob: new Blob(["This file tells that a directory exists"], {
                                type: "text/plain"
                            }),
                            onUploadProgress: () => {}
                        });

                        return {
                            kind: "directory",
                            basename: params.basename,
                            policy: "private"
                        } satisfies S3Object.Directory;
                    }
                }
            })();

            dispatch(
                actions.operationCompleted({
                    objects: [completedObject],
                    operationId
                })
            );
        },

    /**
     * Assert:
     * The file or directory we are deleting is present in the directory
     * currently listed.
     */
    delete:
        (params: { s3Object: S3Object }) =>
        async (...args) => {
            const { s3Object } = params;

            const [dispatch, getState] = args;

            const state = getState()[name];

            const { directoryPath } = state;

            assert(directoryPath !== undefined);

            const operationId = await dispatch(
                privateThunks.createOperation({
                    operation: "delete",
                    objects: [s3Object],
                    directoryPath
                })
            );

            const s3Client = await dispatch(
                s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
            ).then(r => {
                assert(r !== undefined);
                return r.s3Client;
            });

            const deleteFileAndLogCommand = async (filePath: string) => {
                const cmdId = Date.now() - Math.random();

                dispatch(
                    actions.commandLogIssued({
                        cmdId,
                        cmd: `mc rm ${pathJoin("s3", filePath)}`
                    })
                );

                await s3Client.deleteFile({ path: filePath });

                dispatch(
                    actions.commandLogResponseReceived({
                        cmdId,
                        resp: `Removed \`${pathJoin("s3", filePath)}\``
                    })
                );
            };

            switch (s3Object.kind) {
                case "directory":
                    {
                        const { crawl } = crawlFactory({
                            list: async ({ directoryPath }) => {
                                const { objects } = await s3Client.listObjects({
                                    path: directoryPath
                                });

                                return {
                                    fileBasenames: objects
                                        .filter(object => object.kind === "file")
                                        .map(object => object.basename),
                                    directoryBasenames: objects
                                        .filter(object => object.kind === "directory")
                                        .map(object => object.basename)
                                };
                            }
                        });

                        const directoryToDeletePath = pathJoin(
                            directoryPath,
                            s3Object.basename
                        );

                        const { filePaths } = await crawl({
                            directoryPath: directoryToDeletePath
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
                    objects: [s3Object],
                    operationId
                })
            );
        },
    bulkDelete:
        (params: { s3Objects: S3Object[] }) =>
        async (...args): Promise<void> => {
            const { s3Objects } = params;

            const [dispatch, getState] = args;

            const state = getState()[name];

            const { directoryPath } = state;

            assert(directoryPath !== undefined);

            const operationId = await dispatch(
                privateThunks.createOperation({
                    operation: "delete",
                    objects: s3Objects,
                    directoryPath
                })
            );

            const s3Client = await dispatch(
                s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
            ).then(r => {
                assert(r !== undefined);
                return r.s3Client;
            });

            const getFilesPathsToDelete = async (s3Object: S3Object) => {
                if (s3Object.kind === "file") {
                    return [pathJoin(directoryPath, s3Object.basename)];
                }

                const { crawl } = crawlFactory({
                    list: async ({ directoryPath }) => {
                        const { objects } = await s3Client.listObjects({
                            path: directoryPath
                        });
                        return {
                            fileBasenames: objects
                                .filter(obj => obj.kind === "file")
                                .map(obj => obj.basename),
                            directoryBasenames: objects
                                .filter(obj => obj.kind === "directory")
                                .map(obj => obj.basename)
                        };
                    }
                });

                const directoryToDeletePath = pathJoin(directoryPath, s3Object.basename);
                const { filePaths } = await crawl({
                    directoryPath: directoryToDeletePath
                });

                return filePaths.map(filePathRelative =>
                    pathJoin(directoryToDeletePath, filePathRelative)
                );
            };

            const objectNamesToDelete = (
                await Promise.all(s3Objects.map(getFilesPathsToDelete))
            ).flat();

            const cmdId = Date.now();

            dispatch(
                actions.commandLogIssued({
                    cmdId,
                    cmd: `mc rm -r --force  \\\n   ${s3Objects.map(({ basename }) => pathJoin("s3", directoryPath, basename)).join(" \\\n   ")}`
                })
            );

            await s3Client.deleteFiles({ paths: objectNamesToDelete });

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    resp: objectNamesToDelete
                        .map(filePath => `Removed \`${pathJoin("s3", filePath)}\``)
                        .join("\n")
                })
            );

            dispatch(
                actions.operationCompleted({
                    operationId,
                    objects: s3Objects
                })
            );
        },
    getFileDownloadUrl:
        (params: { basename: string; validityDurationSecond?: number }) =>
        async (...args): Promise<string> => {
            const { basename, validityDurationSecond = 3_600 } = params;

            const [dispatch, getState] = args;

            const state = getState()[name];

            const { directoryPath } = state;

            assert(directoryPath !== undefined);

            const path = pathJoin(directoryPath, basename);

            const cmdId = Date.now();

            const prettyDurationValue = formatDuration({
                durationSeconds: validityDurationSecond,
                t: undefined
            });
            dispatch(
                actions.commandLogIssued({
                    cmdId,
                    cmd: `mc share download --expire ${prettyDurationValue} ${pathJoin("s3", path)}`
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
                validityDurationSecond
            });

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    resp: [
                        `URL: ${downloadUrl.split("?")[0]}`,
                        `Expire: ${prettyDurationValue}`,
                        `Share: ${downloadUrl}`
                    ].join("\n")
                })
            );

            return downloadUrl;
        },
    openShare:
        (params: { fileBasename: string }) =>
        async (...args) => {
            const { fileBasename } = params;

            const [dispatch, getState] = args;

            const { directoryPath, objects } = getState()[name];

            assert(directoryPath !== undefined);

            const { s3Client, s3Config } = await dispatch(
                s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
            ).then(r => {
                assert(r !== undefined);
                return r;
            });

            const currentObj = objects.find(
                o => o.basename === fileBasename && o.kind === "file"
            );

            assert(currentObj !== undefined);

            if (currentObj.policy === "public") {
                dispatch(
                    actions.shareOpened({
                        fileBasename,
                        url: `${s3Config.paramsOfCreateS3Client.url}/${pathJoin(directoryPath, fileBasename)}`,
                        validityDurationSecondOptions: undefined
                    })
                );
                return;
            }

            const tokens = await s3Client.getToken({ doForceRenew: false });

            assert(tokens !== undefined);

            const { expirationTime = Infinity } = tokens;

            const validityDurationSecondOptions = [
                3_600,
                12 * 3_600,
                24 * 3_600,
                48 * 3_600,
                7 * 24 * 3_600
            ].filter(validityDuration => validityDuration < expirationTime - Date.now());

            dispatch(
                actions.shareOpened({
                    fileBasename,
                    url: undefined,
                    validityDurationSecondOptions
                })
            );
        },
    closeShare:
        () =>
        (...args) => {
            const [dispatch, getState] = args;

            if (getState()[name].share === undefined) {
                return;
            }

            dispatch(actions.shareClosed());
        },
    changeShareSelectedValidityDuration:
        (params: { validityDurationSecond: number }) =>
        (...args) => {
            const { validityDurationSecond } = params;

            const [dispatch] = args;

            dispatch(
                actions.shareSelectedValidityDurationChanged({ validityDurationSecond })
            );
        },
    requestShareSignedUrl:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const shareView = protectedSelectors.shareView(getState());

            assert(shareView !== null);
            assert(shareView !== undefined);
            assert(!shareView.isPublic);

            dispatch(actions.requestSignedUrlStarted());

            const url = await dispatch(
                thunks.getFileDownloadUrl({
                    basename: shareView.file.basename,
                    validityDurationSecond: shareView.validityDurationSecond
                })
            );

            dispatch(actions.requestSignedUrlCompleted({ url }));
        }
} satisfies Thunks;
