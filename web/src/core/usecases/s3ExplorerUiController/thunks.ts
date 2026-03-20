import type { Thunks } from "core/bootstrap";
import { privateSelectors } from "./selectors";
import * as s3ProfilesManagement from "core/usecases/s3ProfilesManagement";
import type { RouteParams } from "./selectors";
import { assert, type Equals } from "tsafe/assert";
import { actions } from "./state";
import * as s3ProfileManagement from "core/usecases/s3ProfilesManagement";
import { formatDuration } from "core/tools/timeFormat/formatDuration";
import { id } from "tsafe/id";
import { type S3Uri, parseS3Uri, stringifyS3Uri, getIsInside } from "core/tools/S3Uri";
import { same } from "evt/tools/inDepth/same";
import { createWaitForDebounce } from "core/tools/waitForDebounce";
import type { State } from "./state";

const { waitForDebounce: waitForDebounce_notifyRouteParamsExternallyUpdated } =
    createWaitForDebounce({
        delay: 10
    });

const { waitForDebounce: waitForDebounce_listPrefix } = createWaitForDebounce({
    delay: 300
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
                        thunks.load({ routeParams: { s3UriWithoutScheme: "" } })
                    );
                }

                dispatch(
                    thunks.listPrefix({
                        s3Uri:
                            routeParams.s3UriWithoutScheme === ""
                                ? undefined
                                : parseS3Uri({
                                      value: `s3://${routeParams.s3UriWithoutScheme}`,
                                      delimiter: "/"
                                  }),
                        debounce: false
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
                const s3Uri_current = privateSelectors.s3Uri(getState());

                const s3Uri =
                    routeParams.s3UriWithoutScheme === ""
                        ? undefined
                        : parseS3Uri({
                              value: `s3://${routeParams.s3UriWithoutScheme}`,
                              delimiter: "/"
                          });

                if (same(s3Uri_current, s3Uri)) {
                    break update_location;
                }

                dispatch(
                    thunks.listPrefix({
                        s3Uri,
                        debounce: false
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
                    s3Uri: undefined,
                    debounce: false
                })
            );
        },
    deleteBookmark: (() => {
        let isRunning = false;

        return (params: { s3Uri: S3Uri }) =>
            async (...args) => {
                if (isRunning) {
                    return;
                }

                isRunning = true;

                const { s3Uri } = params;

                const [dispatch, getState] = args;

                const s3Profile =
                    s3ProfileManagement.selectors.ambientS3Profile(getState());

                assert(s3Profile !== undefined);

                await dispatch(
                    s3ProfilesManagement.protectedThunks.createDeleteOrUpdateBookmark({
                        profileName: s3Profile.profileName,
                        s3Uri,
                        action: {
                            type: "delete"
                        }
                    })
                );

                isRunning = false;
            };
    })(),
    updateBookmarkDisplayName:
        (params: { s3Uri: S3Uri; displayName: string }) =>
        async (...args) => {
            const { s3Uri, displayName } = params;

            const [dispatch, getState] = args;

            const s3Profile = s3ProfileManagement.selectors.ambientS3Profile(getState());

            assert(s3Profile !== undefined);

            await dispatch(
                s3ProfilesManagement.protectedThunks.createDeleteOrUpdateBookmark({
                    profileName: s3Profile.profileName,
                    s3Uri,
                    action: {
                        type: "create or update",
                        displayName
                    }
                })
            );
        },
    toggleIsS3UriBookmarked: (() => {
        let isRunning = false;

        return (params: {
                getDisplayName: (params: {
                    s3Uri: S3Uri;
                }) => Promise<
                    { doProceed: true; displayName: string } | { doProceed: false }
                >;
            }) =>
            async (...args) => {
                if (isRunning) {
                    return;
                }

                isRunning = true;

                const { getDisplayName } = params;

                const [dispatch, getState] = args;

                const s3Uri = privateSelectors.s3Uri(getState());
                const s3Profile =
                    s3ProfileManagement.selectors.ambientS3Profile(getState());

                assert(s3Profile !== undefined);
                assert(s3Uri !== undefined);

                const isBookmarked = s3Profile.bookmarks.find(bookmark =>
                    same(bookmark.s3Uri, s3Uri)
                );

                let action:
                    | { type: "create or update"; displayName: string | undefined }
                    | { type: "delete" };

                if (isBookmarked) {
                    action = { type: "delete" };
                } else {
                    const resultOfGetDisplayName = await getDisplayName({ s3Uri });

                    if (!resultOfGetDisplayName.doProceed) {
                        isRunning = false;
                        return;
                    }

                    action = {
                        type: "create or update",
                        displayName: resultOfGetDisplayName.displayName
                    };
                }

                await dispatch(
                    s3ProfilesManagement.protectedThunks.createDeleteOrUpdateBookmark({
                        profileName: s3Profile.profileName,
                        s3Uri,
                        action
                    })
                );

                isRunning = false;
            };
    })(),
    listPrefix:
        (params: { s3Uri: S3Uri | undefined; debounce: boolean }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { s3Uri, debounce } = params;

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            if (s3Uri === undefined) {
                dispatch(actions.listingCleared({ profileName }));
                return;
            }

            {
                const s3Uri_currentlyListing =
                    privateSelectors.s3Uri_currentlyListing(getState());

                if (
                    s3Uri_currentlyListing !== undefined &&
                    same(s3Uri_currentlyListing, s3Uri)
                ) {
                    return;
                }
            }

            infer_from_current_state: {
                if (s3Uri.isDelimiterTerminated) {
                    break infer_from_current_state;
                }

                const listedPrefix = privateSelectors.listedPrefix_state(getState());

                if (listedPrefix === undefined) {
                    break infer_from_current_state;
                }

                if (listedPrefix.current === undefined) {
                    break infer_from_current_state;
                }

                {
                    const { isInside, isTopLevel } = getIsInside({
                        s3UriPrefix: listedPrefix.current.s3Uri,
                        s3Uri
                    });

                    if (!isInside || !isTopLevel) {
                        break infer_from_current_state;
                    }
                }

                dispatch(
                    actions.listingCompletedSuccessfully_inferFromCurrentState({
                        profileName,
                        s3Uri
                    })
                );

                return;
            }

            dispatch(actions.listingStarted({ profileName, s3Uri }));

            const maybeCancel = async (): Promise<void | never> => {
                const s3Uri_currentlyListing =
                    privateSelectors.s3Uri_currentlyListing(getState());

                if (
                    s3Uri_currentlyListing === undefined ||
                    !same(s3Uri_currentlyListing, s3Uri)
                ) {
                    dispatch(actions.commandLogCancelled({ cmdId }));
                    await new Promise<never>(() => {});
                }
            };

            {
                const prDebounce = waitForDebounce_listPrefix();

                if (debounce) {
                    await prDebounce;
                }
            }

            await maybeCancel();

            const cmdId = Date.now();

            dispatch(
                actions.commandLogIssued({
                    cmdId,
                    cmd: `aws s3 ls ${stringifyS3Uri(s3Uri)}`
                })
            );

            const s3Client = await dispatch(
                s3ProfilesManagement.protectedThunks.getS3Client({ profileName })
            );

            await maybeCancel();

            const listObjectResult = await s3Client.listObjects({ s3Uri });

            await maybeCancel();

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    resp: (() => {
                        if (listObjectResult.isSuccess) {
                            return [
                                listObjectResult.prefixes.map(
                                    s3Uri =>
                                        `PRE ${s3Uri.keySegments.at(-1)}${s3Uri.delimiter}`
                                ),
                                listObjectResult.objects.map(
                                    ({ s3Uri }) => `OBJ ${s3Uri.keySegments.at(-1)}`
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
                        s3Uri,
                        errorCase: listObjectResult.errorCase
                    })
                );
                return;
            }

            dispatch(
                actions.listingCompletedSuccessfully({
                    profileName,
                    items: [
                        ...listObjectResult.prefixes.map(s3Uri =>
                            id<State.ListedPrefix.Item.Prefix>({
                                type: "prefix",
                                s3Uri
                            })
                        ),
                        ...listObjectResult.objects.map(({ s3Uri, lastModified, size }) =>
                            id<State.ListedPrefix.Item.Object>({
                                type: "object",
                                s3Uri,
                                lastModified,
                                size
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

            const s3Uri = privateSelectors.s3Uri(getState());

            assert(s3Uri !== undefined);

            await Promise.all(
                files.map(async file => {
                    const s3Uri_object: S3Uri.NonTerminatedByDelimiter = {
                        delimiter: s3Uri.delimiter,
                        bucket: s3Uri.bucket,
                        keySegments: [
                            ...s3Uri.keySegments,
                            ...file.relativePathSegments,
                            file.fileBasename
                        ],
                        isDelimiterTerminated: false
                    };

                    const cmdId = Date.now();

                    dispatch(
                        actions.commandLogIssued({
                            cmdId,
                            cmd: `mc cp ./${file.fileBasename} ${stringifyS3Uri(s3Uri_object)}`
                        })
                    );

                    const size = file.blob.size;

                    dispatch(
                        actions.putObjectStarted({
                            profileName,
                            s3Uri: s3Uri_object,
                            size
                        })
                    );

                    await s3Client.putObject({
                        s3Uri: s3Uri_object,
                        blob: file.blob,
                        onUploadProgress: ({ uploadPercent }) => {
                            dispatch(
                                actions.putObjectProgressReported({
                                    profileName,
                                    s3Uri: s3Uri_object,
                                    completionPercent: uploadPercent
                                })
                            );

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

    delete:
        (params: { s3Uris: S3Uri[] }) =>
        async (...args): Promise<void> => {
            const { s3Uris } = params;

            const [dispatch, getState] = args;

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            const s3Client = await dispatch(
                s3ProfileManagement.protectedThunks.getS3Client({ profileName })
            );

            const crawl = async (params: {
                s3UriPrefix: S3Uri.TerminatedByDelimiter;
            }): Promise<S3Uri.NonTerminatedByDelimiter[]> => {
                const { s3UriPrefix } = params;

                const result = await s3Client.listObjects({ s3Uri: s3UriPrefix });

                assert(result.isSuccess);

                return [
                    ...result.objects.map(({ s3Uri }) => s3Uri),
                    ...(
                        await Promise.all(
                            result.prefixes.map(s3Uri => crawl({ s3UriPrefix: s3Uri }))
                        )
                    ).flat()
                ];
            };

            const deleteObject = async (params: {
                s3Uri: S3Uri.NonTerminatedByDelimiter;
            }) => {
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

                    const s3Uris = s3Uri.isDelimiterTerminated
                        ? await crawl({ s3UriPrefix: s3Uri })
                        : [s3Uri];

                    await Promise.all(s3Uris.map(s3Uri => deleteObject({ s3Uri })));

                    dispatch(actions.deletionCompleted({ profileName, s3Uri }));
                })
            );
        },
    getPreSignedUrl:
        (params: {
            s3Uri: S3Uri.NonTerminatedByDelimiter;
            validityDurationSecond?: number;
        }) =>
        async (...args): Promise<string> => {
            const { s3Uri, validityDurationSecond = 3_600 } = params;

            const [dispatch, getState] = args;

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            const s3Client = await dispatch(
                s3ProfileManagement.protectedThunks.getS3Client({ profileName })
            );

            const cmdId = Date.now();
            dispatch(
                actions.commandLogIssued({
                    cmdId,
                    cmd: `aws s3 presign ${stringifyS3Uri(s3Uri)} --expires-in ${validityDurationSecond}`
                })
            );

            const downloadUrl = await s3Client.generateSignedDownloadUrl({
                s3Uri,
                validityDurationSecond
            });

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    resp: [
                        `URL: ${downloadUrl.split("?")[0]}`,
                        `Expire: ${formatDuration({
                            durationSeconds: validityDurationSecond,
                            t: undefined
                        })}`,
                        `Share: ${downloadUrl}`
                    ].join("\n")
                })
            );

            return downloadUrl;
        }
} satisfies Thunks;
