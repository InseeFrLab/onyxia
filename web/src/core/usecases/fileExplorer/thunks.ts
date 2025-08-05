import { assert } from "tsafe/assert";
import { Evt } from "evt";
import { Zip, ZipPassThrough } from "fflate/browser";
import type { Thunks } from "core/bootstrap";
import { name, actions } from "./state";
import { protectedSelectors } from "./selectors";
import { join as pathJoin, basename as pathBasename } from "pathe";
import { crawlFactory } from "core/tools/crawl";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import type { S3Object } from "core/ports/S3Client";
import { formatDuration } from "core/tools/timeFormat/formatDuration";
import { relative as pathRelative } from "pathe";
import { id } from "tsafe/id";
import { isAmong } from "tsafe/isAmong";
import { removeDuplicates } from "evt/tools/reducers/removeDuplicates";

const privateThunks = {
    startOperationWhenAllConflictingOperationHaveCompleted:
        (params: {
            operation: "create" | "delete" | "modifyPolicy" | "downloading";
            objects: S3Object[];
        }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { directoryPath } = getState()[name];

            assert(directoryPath !== undefined);

            const { operation, objects } = params;

            const operationId = `${operation}-${Date.now()}`;

            dispatch(actions.operationStarted({ operationId, objects, operation }));

            await dispatch(
                privateThunks.waitForNoOngoingOperation({
                    directoryPath,
                    objects_ref: objects,
                    ignoreOperationId: operationId
                })
            );
            return operationId;
        },
    waitForNoOngoingOperation:
        (params: {
            directoryPath: string;
            objects_ref: { kind: "file" | "directory"; basename: string }[];
            ignoreOperationId?: string;
        }) =>
        async (...args) => {
            const [, getState, { evtAction }] = args;

            const { directoryPath, objects_ref, ignoreOperationId } = params;

            const { ongoingOperations } = getState()[name];

            const relevantOperationIds = ongoingOperations
                .filter(
                    ongoingOperation =>
                        pathRelative(directoryPath, ongoingOperation.directoryPath) === ""
                )
                .filter(
                    ignoreOperationId === undefined
                        ? () => true
                        : ongoingOperation =>
                              ongoingOperation.operationId !== ignoreOperationId
                )
                .filter(({ objects }) => {
                    for (const object_ref of objects_ref) {
                        const object_match = objects.find(
                            object =>
                                object.kind === object_ref.kind &&
                                object.basename === object_ref.basename
                        );

                        if (object_match === undefined) {
                            continue;
                        }

                        return true;
                    }

                    return false;
                })
                .map(ongoingOperation => ongoingOperation.operationId);

            if (relevantOperationIds.length === 0) {
                return;
            }

            await Promise.all(
                relevantOperationIds.map(operationId =>
                    evtAction.waitFor(
                        event =>
                            event.usecaseName === "fileExplorer" &&
                            event.actionName === "operationCompleted" &&
                            event.payload.operationId === operationId
                    )
                )
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
                    directoryPath: pathJoin(directoryPath, "..") + "/",
                    objects_ref: [
                        {
                            kind: "directory",
                            basename: pathBasename(directoryPath)
                        }
                    ]
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

            const { objects, bucketPolicy, isBucketPolicyAvailable } =
                await s3Client.listObjects({
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
                    bucketPolicy,
                    isBucketPolicyAvailable
                })
            );
        },
    downloadObject:
        (params: { s3Object: S3Object }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { directoryPath } = getState()[name];
            assert(directoryPath !== undefined);

            const { s3Object } = params;

            const s3Client = await dispatch(
                s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
            ).then(r => {
                assert(r !== undefined);
                return r.s3Client;
            });

            const basename = s3Object.basename;
            const path = pathJoin(directoryPath, basename);

            const cmdId = Date.now();

            dispatch(
                actions.commandLogIssued({
                    cmdId,
                    cmd: `mc cp ${pathJoin("s3", path)} .`
                })
            );

            const { stream, size } = await s3Client.getFileContent({
                path
            });

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    resp: `...${path}: 100% of ${size} Bytes uploaded`
                })
            );

            return { stream };
        },
    downloadObjectsAsZip:
        (params: { s3Objects: S3Object[] }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { directoryPath } = getState()[name];
            assert(directoryPath !== undefined);

            const { s3Objects } = params;

            const s3Client = await dispatch(
                s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
            ).then(r => {
                assert(r !== undefined);
                return r.s3Client;
            });

            const { readable, writable } = new TransformStream();
            const writer = writable.getWriter();

            const cmdId = Date.now();

            dispatch(
                actions.commandLogIssued({
                    cmdId,
                    cmd: `mc cp --recursive ${s3Objects
                        .map(({ basename }) =>
                            pathJoin("s3", pathJoin(directoryPath, basename))
                        )
                        .join(" ")} .`
                })
            );

            let totalSize: number = 0;

            {
                const zip = new Zip((err, chunk, final) => {
                    if (err) {
                        writer.abort(err);
                        throw err;
                    }

                    writer.write(chunk);

                    if (final) {
                        writer.close();
                    }
                });

                const { crawl } = crawlFactory({
                    list: async ({ directoryPath }) => {
                        const { objects } = await s3Client.listObjects({
                            path: directoryPath
                        });

                        return objects.reduce<{
                            fileBasenames: string[];
                            directoryBasenames: string[];
                        }>(
                            (acc, { kind, basename }) => {
                                switch (kind) {
                                    case "directory":
                                        acc.directoryBasenames.push(basename);
                                        break;
                                    case "file":
                                        if (basename !== ".keep") {
                                            acc.fileBasenames.push(basename);
                                        }
                                        break;
                                }
                                return acc;
                            },
                            {
                                fileBasenames: [],
                                directoryBasenames: []
                            }
                        );
                    }
                });

                const createZipEntryFromStream = async ({
                    zipPath,
                    stream,
                    modifiedDate
                }: {
                    zipPath: string;
                    stream: ReadableStream<Uint8Array>;
                    modifiedDate?: string | number | Date;
                }) => {
                    const entry = new ZipPassThrough(zipPath);
                    if (modifiedDate) entry.mtime = modifiedDate;

                    zip.add(entry);

                    const reader = stream.getReader();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        entry.push(value);
                    }

                    entry.push(new Uint8Array(0), true);
                };

                const downloadTasks: Promise<void>[] = [];

                for (const object of s3Objects) {
                    const basePath = pathJoin(directoryPath, object.basename);

                    switch (object.kind) {
                        case "directory": {
                            const { filePaths, directoryPaths } = await crawl({
                                directoryPath: basePath
                            });

                            directoryPaths.forEach(path => {
                                const zipEntry = new ZipPassThrough(
                                    `${pathJoin(object.basename, path)}/`
                                );
                                zip.add(zipEntry);
                                zipEntry.push(new Uint8Array(0), true);
                            });

                            for (const relativeFilePath of filePaths) {
                                const absolutePath = pathJoin(basePath, relativeFilePath);
                                const zipEntryPath = pathJoin(
                                    object.basename,
                                    relativeFilePath
                                );

                                const { stream, size, lastModified } =
                                    await s3Client.getFileContent({
                                        path: absolutePath
                                    });

                                totalSize += size ?? 0;
                                downloadTasks.push(
                                    createZipEntryFromStream({
                                        zipPath: zipEntryPath,
                                        stream,
                                        modifiedDate: lastModified
                                    })
                                );
                            }
                            break;
                        }

                        case "file": {
                            const { stream, size } = await s3Client.getFileContent({
                                path: basePath
                            });

                            totalSize += size ?? 0;

                            downloadTasks.push(
                                createZipEntryFromStream({
                                    zipPath: object.basename,
                                    stream,
                                    modifiedDate: object.lastModified
                                })
                            );
                            break;
                        }
                    }
                }

                await Promise.all(downloadTasks);

                zip.end();
            }

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    resp: `...${pathJoin(directoryPath, s3Objects.at(-1)?.basename ?? "")}: 100% of ${totalSize} Bytes uploaded`
                })
            );

            return {
                stream: readable,
                zipFileName:
                    s3Objects.length === 1
                        ? `${s3Objects[0].basename}.zip`
                        : `onyxia-download-${new Date().toISOString()}.zip`
            };
        },
    uploadFileAndLogCommand:
        (params: {
            path: string;
            blob: Blob;
            onUploadProgress: (params: { uploadPercent: number }) => void;
        }) =>
        async (...args) => {
            const [dispatch] = args;

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

            await s3Client.uploadFile({
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
        }
} satisfies Thunks;

export const thunks = {
    initialize:
        (params: { directoryPath: string; viewMode: "list" | "block" }) =>
        async (...args) => {
            const { directoryPath, viewMode } = params;

            const [dispatch] = args;

            dispatch(actions.viewModeChanged({ viewMode }));

            await dispatch(
                privateThunks.navigate({
                    directoryPath: directoryPath,
                    doListAgainIfSamePath: false
                })
            );
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

            const { directoryPath, objects, isBucketPolicyAvailable } = state;

            if (!isBucketPolicyAvailable) {
                console.info("Bucket policy is not available");
                return;
            }

            const object = objects.find(o => o.basename === basename && o.kind === kind);

            assert(object !== undefined);
            assert(directoryPath !== undefined);

            const operationId = await dispatch(
                privateThunks.startOperationWhenAllConflictingOperationHaveCompleted({
                    operation: "modifyPolicy",
                    objects: [{ ...object, policy }]
                })
            );
            const s3Client = await dispatch(
                s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
            ).then(r => {
                assert(r !== undefined);
                return r.s3Client;
            });

            const itemPath =
                pathJoin(directoryPath, basename) + (kind === "directory" ? "/" : "");
            const s3Prefix = pathJoin("s3", itemPath);

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
                path: itemPath,
                policy,
                currentBucketPolicy: getState()[name].bucketPolicy
            });

            dispatch(
                actions.operationCompleted({
                    operationId
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
                    kind,
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

    uploadFiles:
        (params: {
            files: {
                directoryRelativePath: string;
                basename: string;
                blob: Blob;
            }[];
        }) =>
        async (...args) => {
            const { files } = params;

            const [dispatch, getState] = args;

            const state = getState()[name];

            const { directoryPath } = state;

            assert(directoryPath !== undefined);

            const operationId = await dispatch(
                privateThunks.startOperationWhenAllConflictingOperationHaveCompleted({
                    operation: "create",
                    objects: files
                        .map(file =>
                            isAmong([".", ""], file.directoryRelativePath)
                                ? id<S3Object.File>({
                                      kind: "file",
                                      basename: file.basename,
                                      policy: "private",
                                      size: file.blob.size,
                                      lastModified: new Date(),
                                      canChangePolicy: false
                                  })
                                : id<S3Object.Directory>({
                                      kind: "directory",
                                      basename: file.directoryRelativePath
                                          .replace(/^\.\//, "")
                                          .split("/")[0],
                                      policy: "private",
                                      canChangePolicy: false
                                  })
                        )
                        .reduce(
                            ...removeDuplicates<S3Object>(
                                (object1, object2) =>
                                    object1.kind === "directory" &&
                                    object2.kind === "directory" &&
                                    object1.basename === object2.basename
                            )
                        )
                })
            );

            await Promise.all(
                files.map(async file => {
                    //TODO policy can be public if uploaded inside public directory
                    const directoryPath_uploadedFile = pathJoin(
                        directoryPath,
                        file.directoryRelativePath
                    );

                    dispatch(
                        actions.fileUploadStarted({
                            basename: file.basename,
                            directoryPath: directoryPath_uploadedFile,
                            size: file.blob.size
                        })
                    );

                    await dispatch(
                        privateThunks.uploadFileAndLogCommand({
                            path: pathJoin(directoryPath_uploadedFile, file.basename),
                            blob: file.blob,
                            onUploadProgress: ({ uploadPercent }) =>
                                dispatch(
                                    actions.uploadProgressUpdated({
                                        basename: file.basename,
                                        directoryPath: directoryPath_uploadedFile,
                                        uploadPercent
                                    })
                                )
                        })
                    );
                })
            );

            dispatch(
                actions.operationCompleted({
                    operationId
                })
            );
        },

    createNewEmptyDirectory:
        (params: { basename: string }) =>
        async (...args) => {
            const { basename } = params;

            const [dispatch, getState] = args;

            const state = getState()[name];

            const { directoryPath } = state;

            assert(directoryPath !== undefined);

            const operationId = await dispatch(
                privateThunks.startOperationWhenAllConflictingOperationHaveCompleted({
                    operation: "create",
                    objects: [
                        id<S3Object.Directory>({
                            kind: "directory",
                            basename: basename,
                            policy: "private",
                            canChangePolicy: false
                        })
                    ]
                })
            );

            await dispatch(
                privateThunks.uploadFileAndLogCommand({
                    path: pathJoin(directoryPath, params.basename, ".keep"),
                    blob: new Blob(["This file tells that a directory exists"], {
                        type: "text/plain"
                    }),
                    onUploadProgress: () => {}
                })
            );

            dispatch(
                actions.operationCompleted({
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
                privateThunks.startOperationWhenAllConflictingOperationHaveCompleted({
                    operation: "delete",
                    objects: s3Objects
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
                    operationId
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
        },
    getBlobUrl:
        (params: { s3Objects: S3Object[] }) =>
        async (...args): Promise<{ url: string; filename: string }> => {
            const { s3Objects } = params;

            const [dispatch, getState] = args;

            const { directoryPath } = getState()[name];
            assert(directoryPath !== undefined);

            const operationId = await dispatch(
                privateThunks.startOperationWhenAllConflictingOperationHaveCompleted({
                    operation: "downloading",
                    objects: s3Objects
                })
            );

            const { stream, filename } =
                s3Objects.length === 1 && s3Objects[0].kind === "file"
                    ? await (async () => {
                          const { stream } = await dispatch(
                              privateThunks.downloadObject({ s3Object: s3Objects[0] })
                          );

                          return {
                              stream,
                              filename: s3Objects[0].basename
                          };
                      })()
                    : await (async () => {
                          const { stream, zipFileName } = await dispatch(
                              privateThunks.downloadObjectsAsZip({ s3Objects })
                          );
                          return {
                              stream,
                              filename: zipFileName
                          };
                      })();

            const blobUrl = URL.createObjectURL(await new Response(stream).blob());

            dispatch(
                actions.operationCompleted({
                    operationId
                })
            );

            return { url: blobUrl, filename };
        }
} satisfies Thunks;
