import { createSelector } from "clean-architecture";
import * as s3ProfilesManagement from "core/usecases/s3ProfilesManagement";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import {
    type S3UriPrefixObj,
    stringifyS3UriPrefixObj,
    parseS3UriPrefix
} from "core/tools/S3Uri";
import type { State as RootState } from "core/bootstrap";
import { type State, name } from "./state";
import * as userConfigs from "core/usecases/userConfigs";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { join as pathJoin, relative as pathRelative } from "pathe";
import { getUploadProgress } from "./decoupledLogic/uploadProgress";
import { same } from "evt/tools/inDepth/same";
import { computeUploadStatusAtPrefix } from "./decoupledLogic/computeUploadStatusAtPrefix";

export type RouteParams = {
    profile?: string;
    prefix: string;
};

const state = (rootState: RootState): State => rootState[name];

const profileName = createSelector(
    s3ProfilesManagement.selectors.ambientS3Profile,
    ambientS3Profile => ambientS3Profile?.profileName
);

const s3UriPrefixObj = createSelector(
    createSelector(state, state => state.listedPrefixByProfile),
    profileName,
    (listedPrefixByProfile, profileName): S3UriPrefixObj | undefined => {
        if (profileName === undefined) {
            return undefined;
        }

        const listedPrefix = listedPrefixByProfile[profileName];

        if (listedPrefix === undefined) {
            return undefined;
        }

        if (listedPrefix.next !== undefined) {
            return listedPrefix.next.s3UriPrefixObj;
        }

        if (listedPrefix.current === undefined) {
            return undefined;
        }

        return listedPrefix.current.s3UriPrefixObj;
    }
);

const currentWorkingDirectoryView = createSelector(
    createSelector(state, state => state.directoryPath),
    createSelector(state, state => state.navigationError),
    createSelector(state, state => state.objects),
    createSelector(state, state => state.ongoingOperations),
    createSelector(state, state => state.s3FilesBeingUploaded),
    createSelector(state, state => state.isBucketPolicyAvailable),
    (
        directoryPath,
        navigationError,
        objects,
        ongoingOperations,
        s3FilesBeingUploaded,
        isBucketPolicyAvailable
    ): CurrentWorkingDirectoryView | null => {
        if (directoryPath === undefined || navigationError !== undefined) {
            return null;
        }
        const items = [
            ...objects,
            ...ongoingOperations
                .filter(
                    ongoingOperation =>
                        ongoingOperation.operation === "create" &&
                        pathRelative(directoryPath, ongoingOperation.directoryPath) == ""
                )
                .map(ongoingOperation => ongoingOperation.objects)
                .flat()
                .filter(
                    object =>
                        objects.find(
                            object_i =>
                                object_i.kind === object.kind &&
                                object_i.basename === object.basename
                        ) === undefined
                )
        ]
            .map((object): CurrentWorkingDirectoryView.Item => {
                const { isBeingDeleted, isPolicyChanging, isBeingCreated } = (() => {
                    const operation = ongoingOperations.find(
                        op =>
                            pathRelative(op.directoryPath, directoryPath) === "" &&
                            op.objects.find(
                                ongoingObject =>
                                    ongoingObject.basename === object.basename
                            ) !== undefined
                    )?.operation;

                    return {
                        isBeingDeleted: operation === "delete",
                        isPolicyChanging: operation === "modifyPolicy",
                        isBeingCreated: operation === "create"
                    };
                })();

                const common: CurrentWorkingDirectoryView.Item.Common = {
                    basename: object.basename,
                    policy: object.policy,
                    canChangePolicy: object.canChangePolicy,
                    isBeingDeleted,
                    isPolicyChanging,
                    ...(!isBeingCreated
                        ? {
                              isBeingCreated: false
                          }
                        : {
                              isBeingCreated: true,
                              uploadPercent: (() => {
                                  const fileOrDirectoryPath = pathJoin(
                                      directoryPath,
                                      object.basename
                                  );

                                  const s3FilesBeingUploaded_relevant =
                                      s3FilesBeingUploaded.filter(o => {
                                          const filePath_i = pathJoin(
                                              o.directoryPath,
                                              o.basename
                                          );

                                          if (
                                              pathRelative(
                                                  fileOrDirectoryPath,
                                                  filePath_i
                                              ).startsWith("..")
                                          ) {
                                              return false;
                                          }

                                          return true;
                                      });

                                  if (s3FilesBeingUploaded_relevant.length === 0) {
                                      return 0;
                                  }

                                  return getUploadProgress(s3FilesBeingUploaded_relevant)
                                      .overallProgress.uploadPercent;
                              })()
                          })
                };

                switch (object.kind) {
                    case "file": {
                        const { size, lastModified } = object;

                        return id<CurrentWorkingDirectoryView.Item.File>({
                            kind: "file",
                            ...common,
                            size,
                            lastModified
                        });
                    }
                    case "directory":
                        return id<CurrentWorkingDirectoryView.Item.Directory>({
                            kind: "directory",
                            ...common
                        });
                }
            })
            .sort((a, b) => {
                // Sort directories first
                if (a.kind === "directory" && b.kind !== "directory") return -1;
                if (a.kind !== "directory" && b.kind === "directory") return 1;

                // Sort alphabetically by basename
                return a.basename.localeCompare(b.basename);
            });

        return {
            directoryPath,
            items,
            isBucketPolicyFeatureEnabled: isBucketPolicyAvailable
        };
    }
);

const bookmarkStatus = createSelector(
    s3UriPrefixObj,
    s3ProfilesManagement.selectors.ambientS3Profile,
    (s3UriPrefixObj, ambientS3Profile): ExplorerView.Loaded["bookmarkStatus"] => {
        if (s3UriPrefixObj === undefined || ambientS3Profile === undefined) {
            return {
                isBookmarked: false
            };
        }

        const bookmark_matching = ambientS3Profile.bookmarks.find(
            bookmark =>
                stringifyS3UriPrefixObj(bookmark.s3UriPrefixObj) ===
                stringifyS3UriPrefixObj(s3UriPrefixObj)
        );

        if (bookmark_matching === undefined) {
            return {
                isBookmarked: false
            };
        }

        return {
            isBookmarked: true,
            isReadonly: bookmark_matching.isReadonly
        };
    }
);

const explorerView = createSelector(
    createSelector(state, state => state.navigationError),
    createSelector(
        createSelector(state, state => state.s3FilesBeingUploaded),
        s3FilesBeingUploaded => getUploadProgress(s3FilesBeingUploaded)
    ),
    createSelector(state, userConfigs.selectors.userConfigs, (state, userConfigs) =>
        !userConfigs.isCommandBarEnabled ? undefined : state.commandLogsEntries
    ),
    currentWorkingDirectoryView,
    createSelector(state, state => state.ongoingNavigation !== undefined),
    createSelector(state, state => state.viewMode),
    shareView,
    createSelector(
        createSelector(state, state => state.ongoingOperations),
        (ongoingOperations): boolean =>
            ongoingOperations.some(operation => operation.operation === "downloading")
    ),
    bookmarkStatus,
    (
        navigationError,
        uploadProgress,
        commandLogsEntries,
        currentWorkingDirectoryView,
        isNavigationOngoing,
        viewMode,
        shareView,
        isDownloadPreparing,
        bookmarkStatus
    ): ExplorerView => {
        const common = id<ExplorerView.Common>({
            isNavigationOngoing,
            uploadProgress,
            commandLogsEntries,
            viewMode,
            isDownloadPreparing,
            bookmarkStatus
        });

        if (currentWorkingDirectoryView === null) {
            return id<ExplorerView.NotLoaded>({
                ...common,
                isCurrentWorkingDirectoryLoaded: false as const,
                navigationError: (() => {
                    if (navigationError === undefined) {
                        return undefined;
                    }
                    switch (navigationError.errorCase) {
                        case "access denied":
                            return {
                                errorCase: navigationError.errorCase,
                                directoryPath: navigationError.directoryPath
                            } as const;
                        case "no such bucket":
                            return {
                                errorCase: navigationError.errorCase,
                                bucket: parseS3UriPrefix({
                                    s3UriPrefix: `s3://${navigationError.directoryPath}`,
                                    strict: false
                                }).bucket
                            } as const;
                    }
                })()
            });
        }

        assert(shareView !== null);

        return id<ExplorerView.Loaded>({
            ...common,
            isCurrentWorkingDirectoryLoaded: true as const,
            currentWorkingDirectoryView,
            shareView,
            bookmarkStatus
        });
    }
);

export const privateSelectors = {
    routeParams: createSelector(
        profileName,
        s3UriPrefixObj,
        (profileName, s3UriPrefixObj): RouteParams => ({
            profile: profileName,
            prefix:
                s3UriPrefixObj === undefined
                    ? ""
                    : stringifyS3UriPrefixObj(s3UriPrefixObj).slice("s3://".length)
        })
    )
};

export type MainView = {
    // NOTE: Undefined is when no profile (user should be prompted to create one)
    profileSelect:
        | {
              value: string;
              options: string[];
              isEditable: boolean;
          }
        | undefined;
    bookmarks: {
        displayName: LocalizedString | undefined;
        s3UriPrefixObj: S3UriPrefixObj;
    }[];

    navigationBarValue: string;
    isListing: boolean;

    listedPrefix:
        | {
              isErrored: true;
              errorCase: State.ListedPrefix.ErrorCase;
          }
        | {
              isErrored: false;
              bookmarkStatus:
                  | {
                        isBookmarked: false;
                    }
                  | {
                        isBookmarked: true;
                        isReadonly: boolean;
                    };
              items: MainView.Item[];
          }
        | undefined;
};

export namespace MainView {
    export type Item = Item.PrefixSegment | Item.Object;

    export namespace Item {
        type Common = {
            uploadProgressPercent: number | undefined;
        };

        export type PrefixSegment = Common & {
            type: "prefix segment";
            prefixSegment: string;
        };

        export type Object = Common & {
            type: "object";
            fileBasename: string;
        };
    }
}

const profileSelect = createSelector(
    s3ProfilesManagement.selectors.ambientS3Profile,
    s3ProfilesManagement.selectors.s3Profiles,
    (ambientS3Profile, s3Profiles): MainView["profileSelect"] => {
        if (ambientS3Profile === undefined) {
            return undefined;
        }

        return {
            value: ambientS3Profile.profileName,
            options: s3Profiles.map(s3Profile => s3Profile.profileName),
            isEditable:
                ambientS3Profile.origin === "created by user (or group project member)"
        };
    }
);

const bookmarks = createSelector(
    s3ProfilesManagement.selectors.ambientS3Profile,
    (ambientS3Profile): MainView["bookmarks"] => {
        if (ambientS3Profile === undefined) {
            return [];
        }

        return ambientS3Profile.bookmarks.map(bookmark => ({
            displayName: bookmark.displayName,
            s3UriPrefixObj: bookmark.s3UriPrefixObj
        }));
    }
);

const navigationBarValue = createSelector(
    s3UriPrefixObj,
    (s3UriPrefixObj): MainView["navigationBarValue"] =>
        s3UriPrefixObj === undefined ? "s3://" : stringifyS3UriPrefixObj(s3UriPrefixObj)
);

const listedPrefix_state = createSelector(
    state,
    profileName,
    (state, profileName): State.ListedPrefix | undefined => {
        if (profileName === undefined) {
            return undefined;
        }

        return state.listedPrefixByProfile[profileName];
    }
);

const isListing = createSelector(
    listedPrefix_state,
    (listedPrefix_state): MainView["isListing"] => {
        if (listedPrefix_state === undefined) {
            return false;
        }

        if (listedPrefix_state.next === undefined) {
            return false;
        }

        if (listedPrefix_state.next.errorCase !== undefined) {
            return false;
        }

        return true;
    }
);

const uploads_profile = createSelector(
    createSelector(state, state => state.uploads),
    profileName,
    (uploads, profileName): State.Upload[] => {
        if (profileName === undefined) {
            return [];
        }

        return uploads.filter(upload => upload.profileName === profileName);
    }
);

const items = createSelector(
    listedPrefix_state,
    uploads_profile,
    (listedPrefix_state, uploads_profile): MainView.Item[] | undefined => {
        if (listedPrefix_state === undefined) {
            return undefined;
        }

        if (listedPrefix_state.current === undefined) {
            return undefined;
        }

        const items: MainView.Item[] = [
            ...listedPrefix_state.current.items.map(item => {
                switch (item.type) {
                    case "object":
                        return id<MainView.Item.Object>({
                            type: "object",
                            fileBasename: item.s3UriObj.basename,
                            uploadProgressPercent: undefined
                        });
                    case "prefix segment":
                        return id<MainView.Item.PrefixSegment>({
                            type: "prefix segment",
                            prefixSegment: [
                                ...item.s3UriPrefixObj.keySegments
                            ].reverse()[0],
                            uploadProgressPercent: undefined
                        });
                }
            }),
            ...computeUploadStatusAtPrefix({
                s3UriPrefixObj: listedPrefix_state.current.s3UriPrefixObj,
                uploads: uploads_profile
            })
        ];

        return items;
    }
);

const listedPrefix = createSelector(
    listedPrefix_state,
    s3ProfilesManagement.selectors.ambientS3Profile,
    items,
    (listedPrefix_state, ambientS3Profile, items): MainView["listedPrefix"] => {
        if (listedPrefix_state === undefined) {
            return undefined;
        }

        if (
            listedPrefix_state.next !== undefined &&
            listedPrefix_state.next.errorCase !== undefined
        ) {
            return {
                isErrored: true,
                errorCase: listedPrefix_state.next.errorCase
            };
        }

        if (listedPrefix_state.current === undefined) {
            return undefined;
        }

        assert(ambientS3Profile !== undefined);
        assert(items !== undefined);

        const { s3UriPrefixObj } = listedPrefix_state.current;

        const bookmark = ambientS3Profile.bookmarks.find(bookmark =>
            same(bookmark.s3UriPrefixObj, s3UriPrefixObj)
        );

        return {
            isErrored: false,
            bookmarkStatus:
                bookmark === undefined
                    ? { isBookmarked: false }
                    : {
                          isBookmarked: true,
                          isReadonly: bookmark.isReadonly
                      },
            items
        };
    }
);

export const selectors = {
    rootView: createSelector(
        createSelector(state, state => state.s3UriPrefixObj),
        s3ProfilesManagement.selectors.ambientS3Profile,
        (s3UriPrefixObj, ambientS3Profile): RootView => {
            if (s3UriPrefixObj !== undefined) {
                return { rootViewState: "explorer can be rendered" };
            }

            if (ambientS3Profile === undefined) {
                return { rootViewState: "no s3 profile yet - user need to create one" };
            }

            return { rootViewState: "no location - user need to specify location" };
        }
    ),
    profileSelectionView: createSelector(
        s3ProfilesManagement.selectors.ambientS3Profile,
        s3ProfilesManagement.selectors.s3Profiles,
        createSelector(state, state => {
            if (state.ongoingNavigation !== undefined) {
                return true;
            }

            if (state.ongoingOperations.length !== 0) {
                return true;
            }

            if (state.share !== undefined && state.share.isSignedUrlBeingRequested) {
                return true;
            }

            return false;
        }),
        (ambientS3Profile, s3Profiles, isBusy): ProfileSelectionView => {
            if (ambientS3Profile === undefined) {
                return {
                    selectedS3ProfileName: undefined,
                    isSelectedS3ProfileEditable: false,
                    isS3ProfileSelectionLocked: false,
                    availableS3ProfileNames: []
                };
            }

            return {
                selectedS3ProfileName: ambientS3Profile.profileName,
                isSelectedS3ProfileEditable:
                    ambientS3Profile.origin ===
                    "created by user (or group project member)",
                isS3ProfileSelectionLocked: isBusy,
                availableS3ProfileNames: s3Profiles.map(
                    s3Profile => s3Profile.profileName
                )
            };
        }
    ),
    bookmarkView: createSelector(
        s3ProfilesManagement.selectors.ambientS3Profile,
        (ambientS3Profile): BookmarksView => {
            if (ambientS3Profile === undefined) {
                return {
                    bookmarks: []
                };
            }

            return {
                bookmarks: ambientS3Profile.bookmarks
            };
        }
    ),
    s3UriPrefixObj,
    explorerView
};
