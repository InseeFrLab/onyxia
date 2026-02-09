import { createSelector } from "clean-architecture";
import * as s3ProfilesManagement from "core/usecases/s3ProfilesManagement";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import { type S3UriPrefixObj, stringifyS3UriPrefixObj } from "core/tools/S3Uri";
import type { State as RootState } from "core/bootstrap";
import { type State, name } from "./state";
import * as userConfigs from "core/usecases/userConfigs";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import type { S3Object } from "core/ports/S3Client";
import { join as pathJoin, relative as pathRelative } from "pathe";
import { getUploadProgress, type UploadProgress } from "./decoupledLogic/uploadProgress";
import { parseS3UriPrefix } from "core/tools/S3Uri";

export type RouteParams = {
    profile?: string;
    path: string;
};

/*
    bookmarks: {
        displayName: LocalizedString | undefined;
        s3UriPrefixObj: S3UriPrefixObj;
    }[];
    shouldRenderExplorer: boolean;
*/

const state = (rootState: RootState): State => rootState[name];

export type CurrentWorkingDirectoryView = {
    directoryPath: string;
    items: CurrentWorkingDirectoryView.Item[];
    isBucketPolicyFeatureEnabled: boolean;
};

export namespace CurrentWorkingDirectoryView {
    export type Item = Item.File | Item.Directory;
    export namespace Item {
        export type Common = {
            basename: string;
            policy: "public" | "private";
            canChangePolicy: boolean;
            isBeingDeleted: boolean;
            isPolicyChanging: boolean;
        } & (
            | {
                  isBeingCreated: false;
              }
            | {
                  isBeingCreated: true;
                  uploadPercent: number;
              }
        );

        export type File = Common & {
            kind: "file";
            size: number | undefined;
            lastModified: Date | undefined;
        };

        export type Directory = Common & {
            kind: "directory";
        };
    }
}

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

export type ShareView = ShareView.PublicFile | ShareView.PrivateFile;

export namespace ShareView {
    export type Common = {
        file: S3Object.File;
    };

    export type PublicFile = Common & {
        isPublic: true;
        url: string;
    };

    export type PrivateFile = Common & {
        isPublic: false;
        validityDurationSecond: number;
        validityDurationSecondOptions: number[];
        url: string | undefined;
        isSignedUrlBeingRequested: boolean;
    };
}

const shareView = createSelector(
    createSelector(state, state => state.directoryPath),
    createSelector(state, state => state.objects),
    createSelector(state, state => state.share),
    (directoryPath, objects, share): ShareView | undefined | null => {
        if (directoryPath === undefined) {
            return null;
        }

        if (share === undefined) {
            return undefined;
        }

        const common: ShareView.Common = {
            file: (() => {
                const file = objects.find(
                    obj => obj.basename === share.fileBasename && obj.kind === "file"
                );

                assert(file !== undefined);
                assert(file.kind === "file");

                return file;
            })()
        };

        const isPublic = share.isSignedUrlBeingRequested === undefined;

        if (isPublic) {
            assert(share.url !== undefined);

            return id<ShareView.PublicFile>({
                ...common,
                isPublic: true,
                url: share.url
            });
        }

        const {
            url,
            isSignedUrlBeingRequested,
            validityDurationSecond,
            validityDurationSecondOptions
        } = share;

        assert(isSignedUrlBeingRequested !== undefined);
        assert(validityDurationSecond !== undefined);
        assert(validityDurationSecondOptions !== undefined);

        return id<ShareView.PrivateFile>({
            ...common,
            isPublic: false,
            isSignedUrlBeingRequested,
            url,
            validityDurationSecond,
            validityDurationSecondOptions
        });
    }
);

export type ExplorerView = ExplorerView.NotLoaded | ExplorerView.Loaded;

export namespace ExplorerView {
    export type Common = {
        isNavigationOngoing: boolean;
        uploadProgress: UploadProgress;
        commandLogsEntries:
            | {
                  cmdId: number;
                  cmd: string;
                  resp: string | undefined;
              }[]
            | undefined;
        viewMode: "list" | "block";
        isDownloadPreparing: boolean;
    };

    export type NotLoaded = Common & {
        isCurrentWorkingDirectoryLoaded: false;
        navigationError:
            | { errorCase: "access denied"; directoryPath: string }
            | { errorCase: "no such bucket"; bucket: string }
            | undefined;
    };

    export type Loaded = Common & {
        isCurrentWorkingDirectoryLoaded: true;
        currentWorkingDirectoryView: CurrentWorkingDirectoryView;
        shareView: ShareView | undefined;
    };
}

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
    (
        navigationError,
        uploadProgress,
        commandLogsEntries,
        currentWorkingDirectoryView,
        isNavigationOngoing,
        viewMode,
        shareView,
        isDownloadPreparing
    ): ExplorerView => {
        const common = id<ExplorerView.Common>({
            isNavigationOngoing,
            uploadProgress,
            commandLogsEntries,
            viewMode,
            isDownloadPreparing
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
            shareView
        });
    }
);

export const privateSelectors = {
    routeParams: createSelector(
        createSelector(
            s3ProfilesManagement.selectors.ambientS3Profile,
            ambientS3Profile => ambientS3Profile?.profileName
        ),
        createSelector(state, state => state.s3UriPrefixObj),
        (profileName, s3UriPrefixObj): RouteParams => ({
            profile: profileName,
            path:
                s3UriPrefixObj === undefined
                    ? ""
                    : stringifyS3UriPrefixObj(s3UriPrefixObj).slice("s3://".length)
        })
    ),
    shareView,
    ongoingNavigation: createSelector(state, state => state.ongoingNavigation)
};

export type RootView = {
    rootViewState:
        | "no s3 profile yet - user need to create one"
        | "no location - user need to specify location"
        | "explorer can be rendered";
};

export type ProfileSelectionView = {
    selectedS3ProfileName: string | undefined;
    isSelectedS3ProfileEditable: boolean;
    isS3ProfileSelectionLocked: boolean;
    availableS3ProfileNames: string[];
};

export type BookmarksView = {
    bookmarks: {
        displayName: LocalizedString | undefined;
        s3UriPrefixObj: S3UriPrefixObj;
    }[];
};

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
    s3UriPrefixObj: createSelector(state, state => state.s3UriPrefixObj),
    explorerView
};
