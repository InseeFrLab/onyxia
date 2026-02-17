import type { Thunks } from "core/bootstrap";
import { privateSelectors } from "./selectors";
import * as s3ProfilesManagement from "core/usecases/s3ProfilesManagement";
import type { RouteParams } from "./selectors";
import { assert, type Equals } from "tsafe/assert";
import { name, actions } from "./state";
import { join as pathJoin, basename as pathBasename } from "pathe";
import { crawlFactory } from "core/tools/crawl";
import * as s3ProfileManagement from "core/usecases/s3ProfilesManagement";
import type { S3Object } from "core/ports/S3Client";
import { formatDuration } from "core/tools/timeFormat/formatDuration";
import { id } from "tsafe/id";
import {
    type S3UriPrefixObj,
    type S3UriObj,
    stringifyS3UriPrefixObj,
    parseS3UriPrefix,
    stringifyS3UriObj
} from "core/tools/S3Uri";
import { same } from "evt/tools/inDepth/same";
import { createWaitForDebounce } from "core/tools/waitForDebounce";
import type { State } from "./state";

const { waitForDebounce: waitForDebounce_notifyRouteParamsExternallyUpdated } =
    createWaitForDebounce({
        delay: 10
    });

export const thunks = {
    load:
        (params: { routeParams: RouteParams }) =>
        (...args): { routeParams_toSet: RouteParams } => {
            const [dispatch, getState] = args;

            const { routeParams } = params;

            if (routeParams.profile !== undefined) {
                const { doesProfileExist } = dispatch(
                    s3ProfilesManagement.protectedThunks.changeAmbientProfile({
                        profileName: routeParams.profile
                    })
                );

                if (!doesProfileExist) {
                    return dispatch(thunks.load({ routeParams: { prefix: "" } }));
                }

                dispatch(
                    thunks.listPrefix({
                        s3UriPrefixObj:
                            routeParams.prefix === ""
                                ? undefined
                                : parseS3UriPrefix({
                                      s3UriPrefix: `s3://${routeParams.prefix}`,
                                      strict: false,
                                      delimiter: "/"
                                  })
                    })
                );
            }

            return {
                routeParams_toSet: privateSelectors.routeParams(getState())
            };
        },
    notifyRouteParamsExternallyUpdated:
        (params: { routeParams: RouteParams }) =>
        async (...args) => {
            const { routeParams } = params;
            const [dispatch, getState] = args;

            // NOTE: We need a debounce here to avoid cycles since the ambient s3 profile
            // and the s3 prefix location are not on the same slice and cannot be dispatched
            // in a single action.
            await waitForDebounce_notifyRouteParamsExternallyUpdated();

            update_profile: {
                const profileName = routeParams.profile;

                if (profileName === undefined) {
                    break update_profile;
                }

                const profileName_current =
                    s3ProfileManagement.selectors.ambientS3Profile(
                        getState()
                    )?.profileName;

                if (profileName_current === profileName) {
                    break update_profile;
                }

                const { doesProfileExist } = dispatch(
                    s3ProfilesManagement.protectedThunks.changeAmbientProfile({
                        profileName
                    })
                );

                assert(doesProfileExist);
            }

            update_location: {
                const s3UriPrefixObj_current =
                    privateSelectors.s3UriPrefixObj(getState());

                const s3UriPrefixObj =
                    routeParams.prefix === ""
                        ? undefined
                        : parseS3UriPrefix({
                              s3UriPrefix: `s3://${routeParams.prefix}`,
                              strict: false,
                              delimiter: "/"
                          });

                if (same(s3UriPrefixObj_current, s3UriPrefixObj)) {
                    break update_location;
                }

                dispatch(
                    thunks.listPrefix({
                        s3UriPrefixObj
                    })
                );
            }
        },
    updateSelectedS3Profile:
        (params: { profileName: string }) =>
        async (...args) => {
            const [dispatch] = args;

            const { profileName } = params;

            const { doesProfileExist } = dispatch(
                s3ProfilesManagement.protectedThunks.changeAmbientProfile({
                    profileName
                })
            );

            assert(doesProfileExist);

            dispatch(
                thunks.listPrefix({
                    s3UriPrefixObj: undefined
                })
            );
        },
    toggleIsDirectoryPathBookmarked: (() => {
        let isRunning = false;

        return () =>
            async (...args) => {
                if (isRunning) {
                    return;
                }

                isRunning = true;

                const [dispatch, getState] = args;

                const s3UriPrefixObj = privateSelectors.s3UriPrefixObj(getState());
                const s3Profile =
                    s3ProfileManagement.selectors.ambientS3Profile(getState());

                assert(s3Profile !== undefined);
                assert(s3UriPrefixObj !== undefined);

                const isBookmarked = s3Profile.bookmarks.find(bookmark =>
                    same(bookmark.s3UriPrefixObj, s3UriPrefixObj)
                );

                await dispatch(
                    s3ProfilesManagement.protectedThunks.createDeleteOrUpdateBookmark({
                        profileName: s3Profile.profileName,
                        s3UriPrefixObj,
                        action: isBookmarked
                            ? {
                                  type: "delete"
                              }
                            : {
                                  type: "create or update",
                                  displayName: undefined
                              }
                    })
                );

                isRunning = false;
            };
    })(),
    listPrefix:
        (params: { s3UriPrefixObj: S3UriPrefixObj | undefined }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { s3UriPrefixObj } = params;

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            if (s3UriPrefixObj === undefined) {
                dispatch(actions.listingCleared({ profileName }));
                return;
            }

            {
                const s3UriPrefixObj_currentlyListing =
                    privateSelectors.s3UriPrefixObj_currentlyListing(getState());

                if (
                    s3UriPrefixObj_currentlyListing !== undefined &&
                    same(s3UriPrefixObj_currentlyListing, s3UriPrefixObj)
                ) {
                    return;
                }
            }

            dispatch(actions.listingStarted({ profileName, s3UriPrefixObj }));

            const cmdId = Date.now();

            dispatch(
                actions.commandLogIssued({
                    cmdId,
                    cmd: `mc ls ${stringifyS3UriPrefixObj(s3UriPrefixObj)}`
                })
            );

            const maybeCancel = async (): Promise<void | never> => {
                const s3UriPrefixObj_currentlyListing =
                    privateSelectors.s3UriPrefixObj_currentlyListing(getState());

                if (s3UriPrefixObj_currentlyListing === undefined) {
                    await new Promise<never>(() => {});
                }

                if (!same(s3UriPrefixObj_currentlyListing, s3UriPrefixObj)) {
                    await new Promise<never>(() => {});
                }

                dispatch(actions.commandLogCancelled({ cmdId }));
            };

            const s3Client = await dispatch(
                s3ProfilesManagement.protectedThunks.getS3Client({ profileName })
            );

            await maybeCancel();

            const listObjectResult = await s3Client.listObjects({
                path: stringifyS3UriPrefixObj(s3UriPrefixObj).slice("s3://".length)
            });

            await maybeCancel();

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    resp: (() => {
                        if (listObjectResult.isSuccess) {
                            return listObjectResult.objects
                                .map(({ kind, basename }) =>
                                    kind === "directory" ? `${basename}/` : basename
                                )
                                .join("\n");
                        }

                        switch (listObjectResult.errorCase) {
                            case "access denied":
                                return "Access Denied";
                            case "no such bucket":
                                return "No Such Bucket";
                            default:
                                assert<Equals<typeof listObjectResult.errorCase, never>>(
                                    false
                                );
                        }
                    })()
                })
            );

            if (!listObjectResult.isSuccess) {
                dispatch(
                    actions.listingFailed({
                        profileName,
                        s3UriPrefixObj,
                        errorCase: listObjectResult.errorCase
                    })
                );
                return;
            }

            dispatch(
                actions.listingCompletedSuccessfully({
                    profileName,
                    items: listObjectResult.objects.map(object => {
                        switch (object.kind) {
                            case "file":
                                return id<State.ListedPrefix.Item.Object>({
                                    type: "object",
                                    s3UriObj: id<S3UriObj>({
                                        type: "s3 URI",
                                        bucket: s3UriPrefixObj.bucket,
                                        keySegments: s3UriPrefixObj.keySegments,
                                        delimiter: s3UriPrefixObj.delimiter,
                                        basename: object.basename
                                    })
                                });
                            case "directory":
                                return id<State.ListedPrefix.Item.PrefixSegment>({
                                    type: "prefix segment",
                                    s3UriPrefixObj: id<S3UriPrefixObj>({
                                        type: "s3 URI prefix",
                                        bucket: s3UriPrefixObj.bucket,
                                        keySegments: [
                                            ...s3UriPrefixObj.keySegments,
                                            object.basename
                                        ],
                                        delimiter: s3UriPrefixObj.delimiter
                                    })
                                });
                        }
                    })
                })
            );
        },
    putObjects:
        (params: {
            s3UriPrefixObj: S3UriPrefixObj;
            files: {
                relativePathSegments: string[];
                fileBasename: string;
                blob: Blob;
            }[];
        }) =>
        async (...args) => {
            const { s3UriPrefixObj, files } = params;

            const [dispatch, getState] = args;

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            const s3Client = await dispatch(
                s3ProfileManagement.protectedThunks.getS3Client({ profileName })
            );

            await Promise.all(
                files.map(async file => {
                    const s3UriObj: S3UriObj = {
                        type: "s3 URI",
                        delimiter: s3UriPrefixObj.delimiter,
                        bucket: s3UriPrefixObj.bucket,
                        keySegments: [
                            ...s3UriPrefixObj.keySegments,
                            ...file.relativePathSegments
                        ],
                        basename: file.fileBasename
                    };

                    const cmdId = Date.now();

                    dispatch(
                        actions.commandLogIssued({
                            cmdId,
                            cmd: `mc cp ./${file.fileBasename} ${stringifyS3UriObj(s3UriObj)}`
                        })
                    );

                    const size = file.blob.size;

                    dispatch(
                        actions.putObjectStarted({
                            profileName,
                            s3UriObj,
                            size
                        })
                    );

                    await s3Client.uploadFile({
                        path: stringifyS3UriObj({ ...s3UriObj, delimiter: "/" }).slice(
                            "s3://".length
                        ),
                        blob: file.blob,
                        onUploadProgress: ({ uploadPercent }) => {
                            dispatch(
                                actions.commandLogResponseReceived({
                                    cmdId,
                                    resp: `... ${uploadPercent}% of ${file.blob.size} Bytes uploaded`
                                })
                            );
                        }
                    });
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
                s3ProfileManagement.protectedThunks.getAmbientS3ProfileAndClient()
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
                        const listObjectsResult = await s3Client.listObjects({
                            path: directoryPath
                        });

                        assert(listObjectsResult.isSuccess);

                        const { objects } = listObjectsResult;

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
                s3ProfileManagement.protectedThunks.getAmbientS3ProfileAndClient()
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
        }
} satisfies Thunks;
