import type { Thunks } from "core/bootstrap";
import { privateSelectors } from "./selectors";
import * as s3ProfilesManagement from "core/usecases/s3ProfilesManagement";
import type { RouteParams } from "./selectors";
import { assert, type Equals } from "tsafe/assert";
import { name, actions } from "./state";
import { crawlFactory } from "core/tools/crawl";
import * as s3ProfileManagement from "core/usecases/s3ProfilesManagement";
import { formatDuration } from "core/tools/timeFormat/formatDuration";
import { id } from "tsafe/id";
import { type S3Uri, parseS3Uri, stringifyS3Uri } from "core/tools/S3Uri";
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
                    return dispatch(
                        thunks.load({ routeParams: { s3UriPrefixWithoutScheme: "" } })
                    );
                }

                dispatch(
                    thunks.listPrefix({
                        s3UriPrefix:
                            routeParams.s3UriPrefixWithoutScheme === ""
                                ? undefined
                                : parseS3Uri({
                                      value: `s3://${routeParams.s3UriPrefixWithoutScheme}`,
                                      delimiter: "/",
                                      isPrefix: true
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
                const s3UriPrefixObj_current = privateSelectors.s3UriPrefix(getState());

                const s3UriPrefix =
                    routeParams.s3UriPrefixWithoutScheme === ""
                        ? undefined
                        : parseS3Uri({
                              value: `s3://${routeParams.s3UriPrefixWithoutScheme}`,
                              delimiter: "/",
                              isPrefix: true
                          });

                if (same(s3UriPrefixObj_current, s3UriPrefix)) {
                    break update_location;
                }

                dispatch(
                    thunks.listPrefix({
                        s3UriPrefix
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
                    s3UriPrefix: undefined
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

                const s3UriPrefix = privateSelectors.s3UriPrefix(getState());
                const s3Profile =
                    s3ProfileManagement.selectors.ambientS3Profile(getState());

                assert(s3Profile !== undefined);
                assert(s3UriPrefix !== undefined);

                const isBookmarked = s3Profile.bookmarks.find(bookmark =>
                    same(bookmark.s3UriPrefix, s3UriPrefix)
                );

                await dispatch(
                    s3ProfilesManagement.protectedThunks.createDeleteOrUpdateBookmark({
                        profileName: s3Profile.profileName,
                        s3UriPrefix,
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
        (params: { s3UriPrefix: S3Uri.Prefix | undefined }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { s3UriPrefix } = params;

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            if (s3UriPrefix === undefined) {
                dispatch(actions.listingCleared({ profileName }));
                return;
            }

            {
                const s3UriPrefixObj_currentlyListing =
                    privateSelectors.s3UriPrefixObj_currentlyListing(getState());

                if (
                    s3UriPrefixObj_currentlyListing !== undefined &&
                    same(s3UriPrefixObj_currentlyListing, s3UriPrefix)
                ) {
                    return;
                }
            }

            dispatch(actions.listingStarted({ profileName, s3UriPrefix }));

            const cmdId = Date.now();

            dispatch(
                actions.commandLogIssued({
                    cmdId,
                    cmd: `aws s3 ls ${stringifyS3Uri(s3UriPrefix)}`
                })
            );

            const maybeCancel = async (): Promise<void | never> => {
                const s3UriPrefixObj_currentlyListing =
                    privateSelectors.s3UriPrefixObj_currentlyListing(getState());

                if (s3UriPrefixObj_currentlyListing === undefined) {
                    await new Promise<never>(() => {});
                }

                if (!same(s3UriPrefixObj_currentlyListing, s3UriPrefix)) {
                    await new Promise<never>(() => {});
                }

                dispatch(actions.commandLogCancelled({ cmdId }));
            };

            const s3Client = await dispatch(
                s3ProfilesManagement.protectedThunks.getS3Client({ profileName })
            );

            await maybeCancel();

            const listObjectResult = await s3Client.listObjects({ s3UriPrefix });

            await maybeCancel();

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    resp: (() => {
                        if (listObjectResult.isSuccess) {
                            return [
                                listObjectResult.s3UriPrefixes.map(
                                    s3UriPrefix =>
                                        `PRE ${s3UriPrefix.keySegments.at(-1)}${s3UriPrefix.delimiter}`
                                ),
                                listObjectResult.objects.map(
                                    ({ s3Uri }) => `OBJ ${s3Uri.keyBasename}`
                                )
                            ].join("\n");
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
                        s3UriPrefix,
                        errorCase: listObjectResult.errorCase
                    })
                );
                return;
            }

            dispatch(
                actions.listingCompletedSuccessfully({
                    profileName,
                    items: [
                        ...listObjectResult.s3UriPrefixes.map(s3UriPrefix =>
                            id<State.ListedPrefix.Item.Prefix>({
                                type: "prefix",
                                s3UriPrefix
                            })
                        ),
                        ...listObjectResult.objects.map(({ s3Uri }) =>
                            id<State.ListedPrefix.Item.Object>({
                                type: "object",
                                s3Uri
                            })
                        )
                    ]
                })
            );
        },
    putObjects:
        (params: {
            files: {
                relativePathSegments: string[];
                fileBasename: string;
                blob: Blob;
            }[];
        }) =>
        async (...args) => {
            const { files } = params;

            const [dispatch, getState] = args;

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            const s3Client = await dispatch(
                s3ProfileManagement.protectedThunks.getS3Client({ profileName })
            );

            const s3UriPrefix = privateSelectors.s3UriPrefix(getState());

            assert(s3UriPrefix !== undefined);

            await Promise.all(
                files.map(async file => {
                    const s3Uri: S3Uri.Object = {
                        type: "object",
                        delimiter: s3UriPrefix.delimiter,
                        bucket: s3UriPrefix.bucket,
                        keySegments: [
                            ...s3UriPrefix.keySegments,
                            ...file.relativePathSegments
                        ],
                        keyBasename: file.fileBasename
                    };

                    const cmdId = Date.now();

                    dispatch(
                        actions.commandLogIssued({
                            cmdId,
                            cmd: `mc cp ./${file.fileBasename} ${stringifyS3Uri(s3Uri)}`
                        })
                    );

                    const size = file.blob.size;

                    dispatch(
                        actions.putObjectStarted({
                            profileName,
                            s3Uri,
                            size
                        })
                    );

                    await s3Client.putObject({
                        s3Uri,
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

    createDirectory:
        (params: { prefixSegment: string }) =>
        async (...args) => {
            const { prefixSegment } = params;

            const [dispatch] = args;

            await dispatch(
                thunks.putObjects({
                    files: [
                        {
                            relativePathSegments: [prefixSegment],
                            fileBasename: ".keep",
                            blob: new Blob(["This file tells that a directory exists"], {
                                type: "text/plain"
                            })
                        }
                    ]
                })
            );
        },

    bulkDelete:
        (params: { s3Uris: (S3Uri.Object | S3Uri.Prefix.TerminatedByDelimiter)[] }) =>
        async (...args): Promise<void> => {
            const { s3Uris } = params;

            const [dispatch, getState] = args;

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            const s3Client = await dispatch(
                s3ProfileManagement.protectedThunks.getS3Client({ profileName })
            );

            const crawl = async (params: {
                s3UriPrefix: S3Uri.Prefix.TerminatedByDelimiter;
            }): Promise<S3Uri.Object[]> => {
                const { s3UriPrefix } = params;

                const result = await s3Client.listObjects({ s3UriPrefix });

                assert(result.isSuccess);

                return [
                    ...result.objects.map(({ s3Uri }) => s3Uri),
                    ...(
                        await Promise.all(
                            result.s3UriPrefixes.map(s3UriPrefix =>
                                crawl({ s3UriPrefix })
                            )
                        )
                    ).flat()
                ];
            };

            const deleteObject = async (params: { s3Uri: S3Uri.Object }) => {
                const { s3Uri } = params;

                const cmdId = Math.random();

                dispatch(
                    actions.commandLogIssued({
                        cmdId,
                        cmd: `aws s3 rm ${stringifyS3Uri(s3Uri)}`
                    })
                );

                await s3Client.deleteObject({ s3Uri });

                dispatch(
                    actions.commandLogResponseReceived({
                        cmdId,
                        resp: `Removed ${stringifyS3Uri(s3Uri)}`
                    })
                );
            };

            await Promise.all(
                s3Uris.map(async s3Uri => {
                    dispatch(actions.deletionStarted({ profileName, s3Uri }));

                    const s3Uris =
                        s3Uri.type === "object"
                            ? [s3Uri]
                            : await crawl({ s3UriPrefix: s3Uri });

                    await Promise.all(s3Uris.map(s3Uri => deleteObject({ s3Uri })));

                    dispatch(actions.deletionCompleted({ profileName, s3Uri }));
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
