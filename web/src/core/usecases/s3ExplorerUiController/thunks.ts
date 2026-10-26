import type { Thunks } from "core/bootstrap";
import { privateSelectors, protectedSelectors } from "./selectors";
import * as s3ProfilesManagement from "core/usecases/s3ProfilesManagement";
import type { RouteParams } from "./selectors";
import { assert, type Equals } from "tsafe/assert";
import { actions } from "./state";
import { formatDuration } from "core/tools/timeFormat/formatDuration";
import { id } from "tsafe/id";
import {
    type S3Uri,
    parseS3Uri,
    stringifyS3Uri,
    getIsInside,
    getS3UriKey
} from "core/tools/S3Uri";
import { same } from "evt/tools/inDepth/same";
import { createWaitForDebounce } from "core/tools/waitForDebounce";
import { type State, name } from "./state";
import { Evt } from "evt";
import { Deferred } from "evt/tools/Deferred";
import {
    getHasPrefixBeMadePublic,
    makePrefixPublic,
    undoMakePrefixPublic,
    getIsWithinPrefixThatHasBeenMadePublic,
    getHasBucketPolicies
} from "./decoupledLogic/bucketPolicies";
import { downloadS3UrisAsZip } from "./decoupledLogic/downloadAsZip";
import { triggerBrowserDownload } from "core/tools/triggerBrowserDownload";
import { shellQuote } from "core/tools/shellQuote";
import type { FileOperationConflict, OverwriteConfirmationResponse } from "./evt";
import type { S3Client } from "core/ports/S3Client";

const { waitForDebounce: waitForDebounce_notifyRouteParamsExternallyUpdated } =
    createWaitForDebounce({
        delay: 10
    });

const { waitForDebounce: waitForDebounce_listPrefix } = createWaitForDebounce({
    delay: 300
});

const erroredUploadBlobs: {
    profileName: string;
    s3Uri: S3Uri.NonTerminatedByDelimiter;
    blob: Blob;
}[] = [];

export const evtAskOverwriteConfirmation = Evt.create<{
    s3Uri: S3Uri.NonTerminatedByDelimiter;
    resolveResponse: (response: OverwriteConfirmationResponse) => void;
}>();

export const evtDisplayError = Evt.create<{
    errorMessage: string;
}>();

export const evtFileOperationConflict = Evt.create<FileOperationConflict>();

export const thunks = {
    getIsS3ExplorerEnabled:
        () =>
        (...args) => {
            const [, , { paramsOfBootstrapCore, s3Config }] = args;

            if (paramsOfBootstrapCore.onyxiaApiUrl === undefined) {
                return true;
            }

            return s3Config.defaultValuesOfCreationForm !== undefined;
        },
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
    getShouldEnforceLogin:
        (params: { routeParams: Pick<RouteParams, "profile"> }) =>
        (...args) => {
            const { routeParams } = params;
            const [, getState] = args;

            const profileName = routeParams.profile;

            if (profileName === undefined) {
                return true;
            }

            const s3Profiles = s3ProfilesManagement.selectors.s3Profiles(getState());

            const s3Profile = s3Profiles.find(
                s3Profile => s3Profile.profileName === profileName
            );

            if (s3Profile === undefined) {
                return true;
            }

            const isAnonymousAdminProfile =
                s3Profile.origin === "onyxia instance config (setup by admin)" &&
                !s3Profile.paramsOfCreateS3Client.isStsEnabled &&
                s3Profile.paramsOfCreateS3Client.credentials === undefined;

            const shouldEnforceLogin = !isAnonymousAdminProfile;

            return shouldEnforceLogin;
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
                    s3ProfilesManagement.selectors.ambientS3Profile(
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
                    s3ProfilesManagement.selectors.ambientS3Profile(getState());

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

            const s3Profile = s3ProfilesManagement.selectors.ambientS3Profile(getState());

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
                    s3ProfilesManagement.selectors.ambientS3Profile(getState());

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
                    cmds: [
                        {
                            cmdId,
                            cmd: `aws s3 ls ${shellQuote(stringifyS3Uri(s3Uri))}${profileName === "default" ? "" : ` --profile ${shellQuote(profileName)}`}`
                        }
                    ]
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
                                ...listObjectResult.prefixes.map(
                                    s3Uri =>
                                        `PRE ${s3Uri.keySegments.at(-1)}${s3Uri.delimiter}`
                                ),
                                ...listObjectResult.objects.map(
                                    ({ s3Uri }) => `OBJ ${s3Uri.keySegments.at(-1)}`
                                )
                            ].join("\n");
                        }

                        if (!listObjectResult.isKnownError) {
                            return listObjectResult.errorMessage;
                        }

                        switch (listObjectResult.errorCase) {
                            case "access denied":
                                return "Access Denied";
                            case "no such bucket":
                                return "No Such Bucket";
                            case "CORS error":
                                return "CORS Error";
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
                        error: listObjectResult
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
    reloadCurrentPrefix:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const s3Uri = privateSelectors.s3Uri(getState());

            assert(s3Uri !== undefined);

            await dispatch(thunks.listPrefix({ s3Uri, debounce: false }));
        },
    retryPutObject:
        (params: { profileName: string; s3Uri: S3Uri.NonTerminatedByDelimiter }) =>
        async (...args) => {
            const { profileName, s3Uri } = params;

            const [dispatch] = args;

            const blobWrap = erroredUploadBlobs.find(
                o => o.profileName === profileName && same(o.s3Uri, s3Uri)
            );

            assert(blobWrap !== undefined);

            await dispatch(
                privateThunks.putObject({
                    dispatchProxy: ({ commandLogIssued, putObjectStarted }) => {
                        dispatch(
                            actions.commandLogIssued({
                                cmds: [commandLogIssued]
                            })
                        );
                        dispatch(
                            actions.putObjectStarted({
                                objects: [putObjectStarted]
                            })
                        );
                        return Promise.resolve();
                    },
                    profileName,
                    s3Uri,
                    blob: blobWrap.blob,
                    doCheckExistence: true
                })
            );
        },
    flushUploads:
        () =>
        (...args) => {
            const [dispatch] = args;

            dispatch(actions.uploadFlushed());
        },

    cancelUpload:
        (params: { profileName: string; s3Uri: S3Uri.NonTerminatedByDelimiter }) =>
        (...args) => {
            const { profileName, s3Uri } = params;
            const [dispatch] = args;

            dispatch(actions.uploadCanceled({ profileName, s3Uri }));
        },
    navigateBack:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const s3Uri = privateSelectors.s3Uri(getState());

            assert(s3Uri !== undefined);

            await dispatch(
                thunks.listPrefix({
                    s3Uri:
                        s3Uri.keySegments.length === 0
                            ? undefined
                            : {
                                  ...s3Uri,
                                  keySegments: s3Uri.keySegments.slice(0, -1),
                                  isDelimiterTerminated: true
                              },
                    debounce: false
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

            const [dispatch, getState, { evtAction }] = args;

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            const s3Uri = privateSelectors.s3Uri(getState());

            assert(s3Uri !== undefined);

            const listedPrefix_items = (() => {
                const listedPrefix_state =
                    privateSelectors.listedPrefix_state(getState());

                if (listedPrefix_state === undefined) {
                    return undefined;
                }

                if (listedPrefix_state.current === undefined) {
                    return undefined;
                }

                if (!same(listedPrefix_state.current.s3Uri, s3Uri)) {
                    return undefined;
                }

                return listedPrefix_state.current.items;
            })();

            const objectsToPut = files
                .map(file => {
                    const s3Uri_object = id<S3Uri.NonTerminatedByDelimiter>({
                        delimiter: s3Uri.delimiter,
                        bucket: s3Uri.bucket,
                        keySegments: [
                            ...s3Uri.keySegments,
                            ...file.relativePathSegments,
                            file.fileBasename
                        ],
                        isDelimiterTerminated: false
                    });

                    const doCheckExistence = (() => {
                        if (listedPrefix_items === undefined) {
                            return true;
                        }

                        if (
                            s3Uri.bucket !== s3Uri_object.bucket ||
                            s3Uri.delimiter !== s3Uri_object.delimiter
                        ) {
                            return true;
                        }

                        const listedPrefix_key = getS3UriKey(s3Uri);
                        const s3Uri_object_key = getS3UriKey(s3Uri_object);

                        if (!s3Uri_object_key.startsWith(listedPrefix_key)) {
                            return true;
                        }

                        const keyRelativeToListedPrefix = s3Uri_object_key.slice(
                            listedPrefix_key.length
                        );

                        const indexOfDelimiter = keyRelativeToListedPrefix.indexOf(
                            s3Uri.delimiter
                        );

                        if (indexOfDelimiter === -1) {
                            return (
                                listedPrefix_items.find(
                                    item =>
                                        item.type === "object" &&
                                        same(item.s3Uri, s3Uri_object)
                                ) !== undefined
                            );
                        }

                        const prefixKeyOfObjectInListedPrefix =
                            listedPrefix_key +
                            keyRelativeToListedPrefix.slice(
                                0,
                                indexOfDelimiter + s3Uri.delimiter.length
                            );

                        return (
                            listedPrefix_items.find(
                                item =>
                                    item.type === "prefix" &&
                                    getS3UriKey(item.s3Uri) ===
                                        prefixKeyOfObjectInListedPrefix
                            ) !== undefined
                        );
                    })();

                    return {
                        file,
                        s3Uri_object,
                        doCheckExistence
                    };
                })
                .sort((a, b) =>
                    stringifyS3Uri(a.s3Uri_object).localeCompare(
                        stringifyS3Uri(b.s3Uri_object)
                    )
                );

            const prPutObject_arr: Promise<void>[] = [];

            const actionPayloads: {
                commandLogIssued: {
                    cmdId: number;
                    cmd: string;
                };
                putObjectStarted: {
                    profileName: string;
                    s3Uri: S3Uri.NonTerminatedByDelimiter;
                    size: number;
                };
            }[] = [];

            evtAction.setMaxHandlers(objectsToPut.length * 2 + 100);

            const prDispatchProxyCalledOrAborted_arr: Promise<void>[] = [];

            const dAllDispatched = new Deferred<void>();

            for (const { file, s3Uri_object, doCheckExistence } of objectsToPut) {
                const dDispatchProxyCalledOrAborted = new Deferred<void>();

                prDispatchProxyCalledOrAborted_arr.push(dDispatchProxyCalledOrAborted.pr);

                const prPutObject = dispatch(
                    privateThunks.putObject({
                        profileName,
                        s3Uri: s3Uri_object,
                        blob: file.blob,
                        doCheckExistence,
                        dispatchProxy: action => {
                            actionPayloads.push(action);
                            dDispatchProxyCalledOrAborted.resolve();
                            return dAllDispatched.pr;
                        }
                    })
                );

                prPutObject_arr.push(prPutObject);

                prPutObject.then(() => dDispatchProxyCalledOrAborted.resolve());
            }

            await Promise.all(prDispatchProxyCalledOrAborted_arr);

            dispatch(
                actions.commandLogIssued({
                    cmds: actionPayloads.map(({ commandLogIssued }) => commandLogIssued)
                })
            );

            dispatch(
                actions.putObjectStarted({
                    objects: actionPayloads.map(
                        ({ putObjectStarted }) => putObjectStarted
                    )
                })
            );

            dAllDispatched.resolve();

            await Promise.all(prPutObject_arr);
        },

    createDirectory:
        (params: { prefixSegment: string }) =>
        async (...args) => {
            const { prefixSegment } = params;

            const [dispatch, getState] = args;

            const s3Uri = privateSelectors.s3Uri(getState());

            assert(s3Uri !== undefined);

            assert(s3Uri.isDelimiterTerminated);

            await dispatch(
                thunks.listPrefix({
                    s3Uri: {
                        ...s3Uri,
                        keySegments: [...s3Uri.keySegments, prefixSegment]
                    },
                    debounce: false
                })
            );
        },

    /** Reads a destination for the picker without changing explorer navigation or state. */
    listFileOperationDestination:
        (params: { profileName: string; s3Uri: S3Uri.TerminatedByDelimiter }) =>
        async (...args): Promise<S3Client.ListObjectsReturn> => {
            const [dispatch] = args;
            const s3Client = await dispatch(
                s3ProfilesManagement.protectedThunks.getS3Client({
                    profileName: params.profileName
                })
            );
            return s3Client.listObjects({ s3Uri: params.s3Uri });
        },
    /** Renames one object or directory within its current parent. */
    rename:
        (params: {
            s3Uri: S3Uri;
            /** A single name, including the extension for a file, without a path. */
            newBasename: string;
        }) =>
        async (...args): Promise<void> => {
            const [dispatch] = args;
            await dispatch(privateThunks.runFileOperation({ type: "rename", ...params }));
        },
    /** Copies objects or directories into the destination directory, retaining their names. */
    copy:
        (params: { s3Uris: S3Uri[]; destinationS3Uri: S3Uri.TerminatedByDelimiter }) =>
        async (...args): Promise<void> => {
            const [dispatch] = args;
            await dispatch(privateThunks.runFileOperation({ type: "copy", ...params }));
        },
    /** Moves objects or directories into the destination directory, retaining their names. */
    move:
        (params: { s3Uris: S3Uri[]; destinationS3Uri: S3Uri.TerminatedByDelimiter }) =>
        async (...args): Promise<void> => {
            const [dispatch] = args;
            await dispatch(privateThunks.runFileOperation({ type: "move", ...params }));
        },
    cancelFileOperation:
        (params: { operationId: string }) =>
        (...args) => {
            const [dispatch, getState] = args;
            const operation = privateSelectors
                .fileOperations(getState())
                .find(operation => operation.operationId === params.operationId);
            if (operation?.status !== "running") {
                return;
            }
            dispatch(actions.fileOperationCanceled(params));
        },
    flushFileOperations:
        () =>
        (...args) => {
            const [dispatch] = args;
            dispatch(actions.fileOperationsFlushed());
        },
    delete:
        (params: { s3Uris: S3Uri[] }) =>
        async (...args): Promise<void> => {
            const { s3Uris } = params;

            const [dispatch, getState] = args;

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            const s3Client = await dispatch(
                s3ProfilesManagement.protectedThunks.getS3Client({ profileName })
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
                        cmds: [
                            {
                                cmdId,
                                cmd: `aws s3 rm ${shellQuote(stringifyS3Uri(s3Uri))}${profileName === "default" ? "" : ` --profile ${shellQuote(profileName)}`}`
                            }
                        ]
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
    downloadObject:
        (props: { s3Uri: S3Uri.NonTerminatedByDelimiter }) =>
        async (...args) => {
            const [dispatch] = args;

            const { s3Uri } = props;

            const httpObjectUrl = await dispatch(
                protectedThunks.getObjectHttpUrl({
                    s3Uri,
                    validityDurationSecond_ifNotPublic: 20,
                    isForDirectDownload: true
                })
            );

            triggerBrowserDownload({ url: httpObjectUrl, fileBasename: undefined });
        },
    toggleS3UriPublicPrivatePolicy:
        (params: { s3Uri: S3Uri.TerminatedByDelimiter }) =>
        async (...args) => {
            const { s3Uri } = params;

            const [dispatch, getState] = args;

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            const bucketPoliciesByBucket =
                protectedSelectors.bucketPoliciesByBucket(getState());

            const hasPrefixBeMadePublic = getHasPrefixBeMadePublic({
                s3Uri,
                bucketPoliciesByBucket
            });

            const params_putBucketPolicies = hasPrefixBeMadePublic
                ? undoMakePrefixPublic({
                      s3Uri,
                      bucketPoliciesByBucket
                  })
                : makePrefixPublic({
                      s3Uri,
                      bucketPoliciesByBucket
                  });

            const cmdId = Date.now();

            dispatch(
                actions.commandLogIssued({
                    cmds: [
                        {
                            cmdId,
                            cmd: `${params_putBucketPolicies.awsS3CliEmulatedCommand.cmd}${profileName === "default" ? "" : ` \\\n  --profile ${shellQuote(profileName)}`}`
                        }
                    ]
                })
            );

            const s3Client = await dispatch(
                s3ProfilesManagement.protectedThunks.getS3Client({ profileName })
            );

            const result = await s3Client.putBucketPolicies({
                bucket: params_putBucketPolicies.bucket,
                bucketPolicies: params_putBucketPolicies.updatedBucketPolicies
            });

            if (!result.isSuccess) {
                dispatch(
                    actions.commandLogResponseReceived({
                        cmdId,
                        resp: result.errorMessage
                    })
                );

                evtDisplayError.post({
                    errorMessage: result.errorMessage
                });
                return;
            }

            dispatch(
                actions.commandLogResponseReceived({
                    cmdId,
                    resp: params_putBucketPolicies.awsS3CliEmulatedCommand.resp
                })
            );

            await dispatch(
                privateThunks.updateBucketPolicy({
                    bucket: params_putBucketPolicies.bucket,
                    profileName
                })
            );
        },
    downloadAsZip:
        (params: { s3Uris: S3Uri[] }) =>
        async (...args) => {
            const { s3Uris } = params;

            const [dispatch, getState] = args;

            if (s3Uris.length === 0) {
                return;
            }

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            const s3Uri = privateSelectors.s3Uri(getState());

            assert(s3Uri !== undefined);

            try {
                await downloadS3UrisAsZip({
                    s3Uris,
                    currentS3Uri: s3Uri,
                    getS3Client: () =>
                        dispatch(
                            s3ProfilesManagement.protectedThunks.getS3Client({
                                profileName
                            })
                        )
                });
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return;
                }

                evtDisplayError.post({
                    errorMessage:
                        error instanceof Error
                            ? error.message
                            : "An unknown error occurred while downloading the ZIP file."
                });
            }
        }
} satisfies Thunks;

export const privateThunks = {
    runFileOperation:
        (request: State.FileOperation.Request) =>
        async (...args): Promise<void> => {
            const [dispatch, getState, { evtAction }] = args;
            if (request.type !== "rename" && request.s3Uris.length === 0) {
                return;
            }

            const profileName = privateSelectors.profileName(getState());
            assert(profileName !== undefined);
            const operationId = `${Date.now()}-${Math.random()}`;
            const ctx = Evt.newCtx();
            const evtCancel = Evt.create<void>();
            const dCanceled = new Deferred<undefined>();
            evtCancel.attachOnce(ctx, () => dCanceled.resolve(undefined));
            evtAction.attachOnce(
                action =>
                    action.usecaseName === name &&
                    action.actionName === "fileOperationCanceled" &&
                    action.payload.operationId === operationId,
                ctx,
                () => evtCancel.post()
            );

            dispatch(
                actions.fileOperationStarted({ ...request, operationId, profileName })
            );

            const throwIfCanceled = () => {
                if (evtCancel.postCount !== 0) {
                    throw new Error("File operation canceled");
                }
            };
            let didStartCopy = false;

            try {
                throwIfCanceled();
                const sources =
                    request.type === "rename" ? [request.s3Uri] : request.s3Uris;
                const roots = sources
                    .filter(
                        (source, i) =>
                            sources.findIndex(other => same(other, source)) === i &&
                            !sources.some(
                                other =>
                                    other.isDelimiterTerminated &&
                                    getIsInside({ s3UriPrefix: other, s3Uri: source })
                                        .isInside
                            )
                    )
                    .map(sourceS3Uri => {
                        assert(
                            sourceS3Uri.keySegments.length !== 0,
                            "A bucket cannot be renamed, copied, or moved as a directory"
                        );
                        if (request.type === "rename") {
                            assert(
                                request.newBasename !== "" &&
                                    !request.newBasename.includes(
                                        sourceS3Uri.delimiter
                                    ) &&
                                    !request.newBasename.includes("/"),
                                "The new name must be a single nonempty path segment"
                            );
                        }
                        const destinationS3Uri: S3Uri =
                            request.type === "rename"
                                ? {
                                      ...sourceS3Uri,
                                      keySegments: [
                                          ...sourceS3Uri.keySegments.slice(0, -1),
                                          request.newBasename
                                      ]
                                  }
                                : {
                                      ...request.destinationS3Uri,
                                      isDelimiterTerminated:
                                          sourceS3Uri.isDelimiterTerminated,
                                      keySegments: [
                                          ...request.destinationS3Uri.keySegments,
                                          sourceS3Uri.keySegments.at(-1)!
                                      ]
                                  };
                        // Renaming to the existing name is harmless; copying/moving onto oneself is an error.
                        if (
                            request.type === "rename" &&
                            same(sourceS3Uri, destinationS3Uri)
                        ) {
                            return undefined;
                        }
                        assert(
                            stringifyS3Uri(sourceS3Uri) !==
                                stringifyS3Uri(destinationS3Uri),
                            "Source and destination must be different"
                        );
                        if (sourceS3Uri.isDelimiterTerminated) {
                            assert(
                                !getIsInside({
                                    s3UriPrefix: sourceS3Uri,
                                    s3Uri: destinationS3Uri
                                }).isInside,
                                "A directory cannot be copied or moved inside itself"
                            );
                        }
                        return { sourceS3Uri, destinationS3Uri };
                    })
                    .filter(root => root !== undefined);

                const s3Client = await dispatch(
                    s3ProfilesManagement.protectedThunks.getS3Client({ profileName })
                );
                throwIfCanceled();
                const listings = new Map<
                    string,
                    Promise<S3Client.ListObjectsReturn.Success>
                >();
                const list = (
                    s3Uri: S3Uri
                ): Promise<S3Client.ListObjectsReturn.Success> => {
                    const key = stringifyS3Uri(s3Uri);
                    let pr = listings.get(key);
                    if (pr === undefined) {
                        pr = (async () => {
                            throwIfCanceled();
                            const result = await s3Client.listObjects({ s3Uri });
                            throwIfCanceled();
                            if (!result.isSuccess) {
                                throw new Error(
                                    `Cannot list ${key}: ${result.isKnownError ? result.errorCase : result.errorMessage}`
                                );
                            }
                            return result;
                        })();
                        listings.set(key, pr);
                    }
                    return pr;
                };
                const crawl = async (
                    sourceS3Uri: S3Uri
                ): Promise<S3Client.ListObjectsReturn.Success.Object[]> => {
                    const result = await list(sourceS3Uri);
                    if (!sourceS3Uri.isDelimiterTerminated) {
                        const object = result.objects.find(object =>
                            same(object.s3Uri, sourceS3Uri)
                        );
                        assert(
                            object !== undefined,
                            `Source object does not exist: ${stringifyS3Uri(sourceS3Uri)}`
                        );
                        return [object];
                    }
                    const objects = [...result.objects];
                    for (const prefix of result.prefixes) {
                        for (const object of await crawl(prefix)) {
                            objects.push(object);
                        }
                    }
                    return objects;
                };

                // Freeze the complete source inventory and inspect destinations before asking any questions.
                const candidates: {
                    sourceS3Uri: S3Uri;
                    destinationS3Uri: S3Uri;
                    doesDestinationExist: boolean;
                    objects: Pick<
                        State.FileOperation.Object,
                        "sourceS3Uri" | "destinationS3Uri" | "size"
                    >[];
                }[] = [];
                const sourceKeys = new Set<string>();
                const destinationKeys = new Set<string>();
                for (const { sourceS3Uri, destinationS3Uri } of roots) {
                    const sourceObjects = await crawl(sourceS3Uri);
                    const objects = sourceObjects.map(({ s3Uri, size }) => {
                        const destinationObjectS3Uri: S3Uri.NonTerminatedByDelimiter = {
                            ...destinationS3Uri,
                            isDelimiterTerminated: false,
                            keySegments: destinationS3Uri.isDelimiterTerminated
                                ? [
                                      ...destinationS3Uri.keySegments,
                                      ...s3Uri.keySegments.slice(
                                          sourceS3Uri.keySegments.length
                                      )
                                  ]
                                : destinationS3Uri.keySegments
                        };
                        sourceKeys.add(stringifyS3Uri(s3Uri));
                        const destinationKey = stringifyS3Uri(destinationObjectS3Uri);
                        assert(
                            !destinationKeys.has(destinationKey),
                            `Multiple sources have the same destination: ${destinationKey}`
                        );
                        destinationKeys.add(destinationKey);
                        return {
                            sourceS3Uri: s3Uri,
                            destinationS3Uri: destinationObjectS3Uri,
                            size
                        };
                    });
                    const destinationListing = await list(
                        destinationS3Uri.isDelimiterTerminated
                            ? {
                                  ...destinationS3Uri,
                                  keySegments: destinationS3Uri.keySegments.slice(0, -1)
                              }
                            : destinationS3Uri
                    );
                    const doesDestinationExist = destinationS3Uri.isDelimiterTerminated
                        ? destinationListing.prefixes.some(prefix =>
                              same(prefix, destinationS3Uri)
                          )
                        : destinationListing.objects.some(object =>
                              same(object.s3Uri, destinationS3Uri)
                          );
                    candidates.push({
                        sourceS3Uri,
                        destinationS3Uri,
                        doesDestinationExist,
                        objects
                    });
                }
                for (const key of destinationKeys) {
                    assert(
                        !sourceKeys.has(key),
                        `A destination would overwrite an object selected as a source: ${key}`
                    );
                }

                let rememberedDirectoryChoice: "merge" | "skip" | undefined;
                let rememberedObjectChoice: "overwrite" | "skip" | undefined;
                const plan: Pick<
                    State.FileOperation.Object,
                    "sourceS3Uri" | "destinationS3Uri" | "size"
                >[] = [];
                for (const candidate of candidates) {
                    throwIfCanceled();
                    const {
                        sourceS3Uri,
                        destinationS3Uri,
                        doesDestinationExist,
                        objects
                    } = candidate;
                    if (doesDestinationExist) {
                        let choice: "merge" | "overwrite" | "skip";
                        if (sourceS3Uri.isDelimiterTerminated) {
                            assert(destinationS3Uri.isDelimiterTerminated);
                            if (rememberedDirectoryChoice !== undefined) {
                                choice = rememberedDirectoryChoice;
                            } else {
                                const dResponse =
                                    new Deferred<FileOperationConflict.Directory.Response>();
                                evtFileOperationConflict.post({
                                    type: "directory",
                                    operationId,
                                    operationType: request.type,
                                    sourceS3Uri,
                                    destinationS3Uri,
                                    resolveResponse: response =>
                                        dResponse.resolve(response)
                                });
                                const response = await Promise.race([
                                    dResponse.pr,
                                    dCanceled.pr
                                ]);
                                throwIfCanceled();
                                if (
                                    response === undefined ||
                                    response.action === "cancel"
                                ) {
                                    dispatch(
                                        actions.fileOperationCanceled({ operationId })
                                    );
                                    return;
                                }
                                choice = response.action;
                                if (response.doRememberChoice) {
                                    rememberedDirectoryChoice = choice;
                                }
                            }
                        } else {
                            assert(!destinationS3Uri.isDelimiterTerminated);
                            if (rememberedObjectChoice !== undefined) {
                                choice = rememberedObjectChoice;
                            } else {
                                const dResponse =
                                    new Deferred<OverwriteConfirmationResponse>();
                                evtFileOperationConflict.post({
                                    type: "object",
                                    operationId,
                                    operationType: request.type,
                                    sourceS3Uri,
                                    destinationS3Uri,
                                    resolveResponse: response =>
                                        dResponse.resolve(response)
                                });
                                const response = await Promise.race([
                                    dResponse.pr,
                                    dCanceled.pr
                                ]);
                                throwIfCanceled();
                                if (
                                    response === undefined ||
                                    response.action === "cancel"
                                ) {
                                    dispatch(
                                        actions.fileOperationCanceled({ operationId })
                                    );
                                    return;
                                }
                                choice = response.action;
                                if (response.doRememberChoice) {
                                    rememberedObjectChoice = choice;
                                }
                            }
                        }
                        if (choice === "skip") {
                            continue;
                        }
                    }
                    for (const object of objects) {
                        plan.push(object);
                    }
                }

                throwIfCanceled();
                dispatch(
                    actions.fileOperationObjectsListed({ operationId, objects: plan })
                );
                dispatch(actions.fileOperationListingCompleted({ operationId }));

                const copiedObjects: typeof plan = [];
                const errors: string[] = [];
                for (const object of plan) {
                    throwIfCanceled();
                    const { sourceS3Uri, destinationS3Uri } = object;
                    const cmdId = Date.now() + Math.random();
                    dispatch(
                        actions.commandLogIssued({
                            cmds: [
                                {
                                    cmdId,
                                    cmd: `aws s3 cp ${shellQuote(stringifyS3Uri(sourceS3Uri))} ${shellQuote(stringifyS3Uri(destinationS3Uri))}${profileName === "default" ? "" : ` --profile ${shellQuote(profileName)}`}`
                                }
                            ]
                        })
                    );
                    didStartCopy = true;
                    try {
                        const result = await s3Client.copyObject({
                            sourceS3Uri,
                            destinationS3Uri,
                            evtCancel,
                            onCopyProgress: ({ copyPercent }) => {
                                if (evtCancel.postCount !== 0) {
                                    return;
                                }
                                dispatch(
                                    actions.fileOperationObjectProgressReported({
                                        operationId,
                                        sourceS3Uri,
                                        completionPercent: copyPercent
                                    })
                                );
                            }
                        });
                        if (result.status === "canceled" || evtCancel.postCount !== 0) {
                            dispatch(actions.commandLogCancelled({ cmdId }));
                            if (evtCancel.postCount === 0) {
                                dispatch(actions.fileOperationCanceled({ operationId }));
                            }
                            return;
                        }
                        if (result.status === "failed") {
                            throw result.error;
                        }
                        dispatch(
                            actions.fileOperationObjectProgressReported({
                                operationId,
                                sourceS3Uri,
                                completionPercent: 100
                            })
                        );
                        dispatch(
                            actions.commandLogResponseReceived({
                                cmdId,
                                resp: `Copied ${stringifyS3Uri(sourceS3Uri)} to ${stringifyS3Uri(destinationS3Uri)}`
                            })
                        );
                        if (request.type === "copy") {
                            dispatch(
                                actions.fileOperationObjectCompleted({
                                    operationId,
                                    sourceS3Uri
                                })
                            );
                        } else {
                            copiedObjects.push(object);
                        }
                    } catch (error) {
                        if (evtCancel.postCount !== 0) {
                            dispatch(actions.commandLogCancelled({ cmdId }));
                            return;
                        }
                        const errorMessage = `Failed to copy ${stringifyS3Uri(sourceS3Uri)} to ${stringifyS3Uri(destinationS3Uri)}: ${error instanceof Error ? error.message : String(error)}`;
                        errors.push(errorMessage);
                        dispatch(
                            actions.commandLogResponseReceived({
                                cmdId,
                                resp: errorMessage
                            })
                        );
                        dispatch(
                            actions.fileOperationObjectErrored({
                                operationId,
                                sourceS3Uri,
                                erroredErrorMessage: errorMessage
                            })
                        );
                    }
                }

                // Never delete a skipped/failed source. Wait for the copy phase to finish first.
                for (const { sourceS3Uri } of copiedObjects) {
                    throwIfCanceled();
                    const cmdId = Date.now() + Math.random();
                    dispatch(
                        actions.commandLogIssued({
                            cmds: [
                                {
                                    cmdId,
                                    cmd: `aws s3 rm ${shellQuote(stringifyS3Uri(sourceS3Uri))}${profileName === "default" ? "" : ` --profile ${shellQuote(profileName)}`}`
                                }
                            ]
                        })
                    );
                    try {
                        await s3Client.deleteObject({ s3Uri: sourceS3Uri });
                        throwIfCanceled();
                        dispatch(
                            actions.commandLogResponseReceived({
                                cmdId,
                                resp: `Removed ${stringifyS3Uri(sourceS3Uri)}`
                            })
                        );
                        dispatch(
                            actions.fileOperationObjectCompleted({
                                operationId,
                                sourceS3Uri
                            })
                        );
                    } catch (error) {
                        if (evtCancel.postCount !== 0) {
                            dispatch(actions.commandLogCancelled({ cmdId }));
                            return;
                        }
                        const errorMessage = `Copied ${stringifyS3Uri(sourceS3Uri)}, but failed to delete its source: ${error instanceof Error ? error.message : String(error)}`;
                        errors.push(errorMessage);
                        dispatch(
                            actions.commandLogResponseReceived({
                                cmdId,
                                resp: errorMessage
                            })
                        );
                        dispatch(
                            actions.fileOperationObjectErrored({
                                operationId,
                                sourceS3Uri,
                                erroredErrorMessage: errorMessage
                            })
                        );
                    }
                }
                dispatch(actions.fileOperationCompleted({ operationId }));
                if (errors.length !== 0) {
                    evtDisplayError.post({
                        errorMessage: `${errors.length} object(s) failed. ${errors[0]}`
                    });
                }
            } catch (error) {
                if (evtCancel.postCount === 0) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error);
                    dispatch(
                        actions.fileOperationErrored({
                            operationId,
                            erroredErrorMessage: errorMessage
                        })
                    );
                    evtDisplayError.post({ errorMessage });
                }
            } finally {
                ctx.done();
                // Refresh whichever location is now displayed, without switching profiles or navigating back.
                if (
                    didStartCopy &&
                    privateSelectors.profileName(getState()) === profileName
                ) {
                    const s3Uri = privateSelectors.s3Uri(getState());
                    if (s3Uri !== undefined) {
                        void dispatch(
                            thunks.listPrefix({ s3Uri, debounce: false })
                        ).catch(error =>
                            evtDisplayError.post({
                                errorMessage: `Failed to refresh ${stringifyS3Uri(s3Uri)}: ${error instanceof Error ? error.message : String(error)}`
                            })
                        );
                    }
                }
            }
        },
    putObject:
        (params: {
            profileName: string;
            s3Uri: S3Uri.NonTerminatedByDelimiter;
            blob: Blob;
            doCheckExistence: boolean;
            dispatchProxy: (action: {
                commandLogIssued: {
                    cmdId: number;
                    cmd: string;
                };
                putObjectStarted: {
                    profileName: string;
                    s3Uri: S3Uri.NonTerminatedByDelimiter;
                    size: number;
                };
            }) => Promise<void>;
        }) =>
        async (...args) => {
            const { profileName, s3Uri, blob, doCheckExistence, dispatchProxy } = params;

            const [dispatch, , { evtAction }] = args;

            existence_check: {
                if (!doCheckExistence) {
                    break existence_check;
                }

                const doesExist = await (async () => {
                    const s3Client = await dispatch(
                        s3ProfilesManagement.protectedThunks.getS3Client({ profileName })
                    );

                    const resultOfListObject = await s3Client.listObjects({ s3Uri });

                    if (!resultOfListObject.isSuccess) {
                        return false;
                    }

                    return (
                        resultOfListObject.objects.find(object =>
                            same(object.s3Uri, s3Uri)
                        ) !== undefined
                    );
                })();

                if (doesExist) {
                    const dDoOverwrite = new Deferred<boolean>();

                    evtAskOverwriteConfirmation.post({
                        s3Uri,
                        resolveResponse: ({ action }) => {
                            dDoOverwrite.resolve(action === "overwrite");
                        }
                    });

                    const doOverwrite = await dDoOverwrite.pr;

                    if (!doOverwrite) {
                        return;
                    }

                    await dispatch(thunks.delete({ s3Uris: [s3Uri] }));
                }
            }

            {
                const i = erroredUploadBlobs.findIndex(
                    o => o.profileName === profileName && same(o.s3Uri, s3Uri)
                );

                if (i !== -1) {
                    erroredUploadBlobs.splice(i, 1);
                }
            }

            const cmdId = Date.now() + Math.random();

            await dispatchProxy({
                commandLogIssued: {
                    cmdId,
                    cmd: `aws s3 cp ${shellQuote(`./${s3Uri.keySegments.at(-1)}`)} ${shellQuote(stringifyS3Uri(s3Uri))}${profileName === "default" ? "" : ` --profile ${shellQuote(profileName)}`}`
                },
                putObjectStarted: {
                    profileName,
                    s3Uri: s3Uri,
                    size: blob.size
                }
            });

            const evtCancel = Evt.create();

            const ctx = Evt.newCtx();

            evtAction.attachOnce(
                action =>
                    action.usecaseName === name && action.actionName === "uploadFlushed",
                ctx,
                () => evtCancel.post()
            );

            evtAction.attachOnce(
                action =>
                    action.usecaseName === name &&
                    action.actionName === "uploadCanceled" &&
                    action.payload.profileName === profileName &&
                    same(action.payload.s3Uri, s3Uri),
                ctx,
                () => evtCancel.post()
            );

            evtCancel.attachOnce(() => {
                actions.commandLogCancelled({
                    cmdId
                });
            });

            const s3Client = await dispatch(
                s3ProfilesManagement.protectedThunks.getS3Client({ profileName })
            );

            const resultOfPutObject = await s3Client.putObject({
                s3Uri: s3Uri,
                blob,
                onUploadProgress: ({ uploadPercent }) => {
                    dispatch(
                        actions.putObjectProgressReported({
                            profileName,
                            s3Uri: s3Uri,
                            completionPercent: uploadPercent
                        })
                    );

                    dispatch(
                        actions.commandLogResponseReceived({
                            cmdId,
                            resp: `... ${uploadPercent}% of ${blob.size} Bytes uploaded`
                        })
                    );
                },
                evtCancel
            });

            ctx.done();

            switch (resultOfPutObject.status) {
                case "success":
                    break;
                case "canceled":
                    break;
                case "failed":
                    console.error(
                        `Error uploading ${stringifyS3Uri(s3Uri)}: `,
                        resultOfPutObject.error
                    );

                    erroredUploadBlobs.push({
                        profileName,
                        s3Uri: s3Uri,
                        blob
                    });

                    dispatch(
                        actions.putObjectErrored({
                            profileName,
                            s3Uri: s3Uri,
                            erroredErrorMessage: resultOfPutObject.error.message
                        })
                    );
                    break;
            }
        },
    updateBucketPolicy:
        (params: { bucket: string; profileName: string }) =>
        async (...args) => {
            const [dispatch] = args;

            const { bucket, profileName } = params;

            dispatch(
                actions.bucketPoliciesUpdated({
                    bucket,
                    profileName,
                    bucketPolicies: undefined
                })
            );

            const s3Client = await dispatch(
                s3ProfilesManagement.protectedThunks.getS3Client({ profileName })
            );

            const bucketPolicies = await s3Client.getBucketPolicies({ bucket });

            if (bucketPolicies === undefined) {
                return;
            }

            dispatch(
                actions.bucketPoliciesUpdated({
                    bucket,
                    profileName,
                    bucketPolicies
                })
            );
        },
    getSignedObjectHttpUrl:
        (params: {
            s3Uri: S3Uri.NonTerminatedByDelimiter;
            validityDurationSecond: number;
            isForDirectDownload: boolean;
        }) =>
        async (...args): Promise<string> => {
            const { s3Uri, validityDurationSecond, isForDirectDownload } = params;

            const [dispatch, getState] = args;

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            const s3Client = await dispatch(
                s3ProfilesManagement.protectedThunks.getS3Client({ profileName })
            );

            const cmdId = Date.now();
            dispatch(
                actions.commandLogIssued({
                    cmds: [
                        {
                            cmdId,
                            cmd: `aws s3 presign ${shellQuote(stringifyS3Uri(s3Uri))} --expires-in ${validityDurationSecond}${profileName === "default" ? "" : ` --profile ${shellQuote(profileName)}`}`
                        }
                    ]
                })
            );

            const downloadUrl = await s3Client.getSignedObjectHttpUrl({
                s3Uri,
                validityDurationSecond,
                isForDirectDownload
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

export const protectedThunks = {
    getObjectHttpUrl:
        (params: {
            s3Uri: S3Uri.NonTerminatedByDelimiter;
            validityDurationSecond_ifNotPublic: number;
            isForDirectDownload: boolean;
        }) =>
        async (...args) => {
            const { s3Uri, validityDurationSecond_ifNotPublic, isForDirectDownload } =
                params;

            const [dispatch, getState] = args;

            const profileName = privateSelectors.profileName(getState());

            assert(profileName !== undefined);

            const s3Client = await dispatch(
                s3ProfilesManagement.protectedThunks.getS3Client({ profileName })
            );

            with_signature: {
                const tokens = await s3Client.getToken({ doForceRenew: false });

                if (tokens === undefined) {
                    break with_signature;
                }

                const bucketPoliciesByBucket =
                    protectedSelectors.bucketPoliciesByBucket(getState());

                const isWithinPrefixThatHasBeenMadePublic =
                    getHasBucketPolicies({ s3Uri, bucketPoliciesByBucket }) &&
                    getIsWithinPrefixThatHasBeenMadePublic({
                        s3Uri,
                        bucketPoliciesByBucket
                    }).isWithinPrefixThatHasBeenMadePublic;

                if (isWithinPrefixThatHasBeenMadePublic) {
                    break with_signature;
                }

                return dispatch(
                    privateThunks.getSignedObjectHttpUrl({
                        s3Uri,
                        validityDurationSecond: validityDurationSecond_ifNotPublic,
                        isForDirectDownload
                    })
                );
            }

            return s3Client.getUnsignedObjectHttpUrl({ s3Uri, isForDirectDownload });
        }
} satisfies Thunks;
