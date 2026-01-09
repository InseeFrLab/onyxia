import type { State as RootState } from "core/bootstrap";
import { type State, name } from "./state";
import { createSelector } from "clean-architecture";
import * as userConfigs from "core/usecases/userConfigs";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { assert } from "tsafe/assert";
import * as userAuthentication from "core/usecases/userAuthentication";
import { id } from "tsafe/id";
import type { S3Object } from "core/ports/S3Client";
import { join as pathJoin, relative as pathRelative } from "pathe";
import { getUploadProgress } from "./decoupledLogic/uploadProgress";
import { parseS3UriPrefix } from "core/tools/S3Uri";

const state = (rootState: RootState): State => rootState[name];

const isDownloadPreparing = createSelector(
    createSelector(state, state => state.ongoingOperations),
    (ongoingOperations): boolean =>
        ongoingOperations.some(operation => operation.operation === "downloading")
);

const uploadProgress = createSelector(
    createSelector(state, state => state.s3FilesBeingUploaded),
    s3FilesBeingUploaded => getUploadProgress(s3FilesBeingUploaded)
);

const commandLogsEntries = createSelector(
    state,
    userConfigs.selectors.userConfigs,
    (state, userConfigs) =>
        !userConfigs.isCommandBarEnabled ? undefined : state.commandLogsEntries
);

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

const isNavigationOngoing = createSelector(
    state,
    state => state.ongoingNavigation !== undefined
);

const workingDirectoryPath = createSelector(
    s3ConfigManagement.selectors.s3Configs,
    s3Configs => {
        const s3Config = s3Configs.find(s3Config => s3Config.isExplorerConfig);
        assert(s3Config !== undefined);
        return s3Config.workingDirectoryPath;
    }
);

const pathMinDepth = createSelector(workingDirectoryPath, workingDirectoryPath => {
    // "jgarrone/" -> 0
    // "jgarrone/foo/" -> 1
    // "jgarrone/foo/bar/" -> 2
    return workingDirectoryPath.split("/").length - 2;
});

const main = createSelector(
    createSelector(state, state => state.navigationError),
    uploadProgress,
    commandLogsEntries,
    currentWorkingDirectoryView,
    isNavigationOngoing,
    pathMinDepth,
    createSelector(state, state => state.viewMode),
    shareView,
    isDownloadPreparing,
    (
        navigationError,
        uploadProgress,
        commandLogsEntries,
        currentWorkingDirectoryView,
        isNavigationOngoing,
        pathMinDepth,
        viewMode,
        shareView,
        isDownloadPreparing
    ) => {
        if (currentWorkingDirectoryView === null) {
            return {
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
                })(),
                isNavigationOngoing,
                uploadProgress,
                commandLogsEntries,
                pathMinDepth,
                viewMode,
                isDownloadPreparing
            };
        }

        assert(shareView !== null);

        return {
            isCurrentWorkingDirectoryLoaded: true as const,
            isNavigationOngoing,
            uploadProgress,
            commandLogsEntries,
            pathMinDepth,
            currentWorkingDirectoryView,
            viewMode,
            shareView,
            isDownloadPreparing
        };
    }
);

const isFileExplorerEnabled = (rootState: RootState) => {
    const { isUserLoggedIn } = userAuthentication.selectors.main(rootState);

    if (!isUserLoggedIn) {
        const { s3Configs } =
            deploymentRegionManagement.selectors.currentDeploymentRegion(rootState);

        return s3Configs.length !== 0;
    } else {
        return (
            s3ConfigManagement.selectors
                .s3Configs(rootState)
                .find(s3Config => s3Config.isExplorerConfig) !== undefined
        );
    }
};

const directoryPath = createSelector(state, state => state.directoryPath);

export const protectedSelectors = { workingDirectoryPath, directoryPath, shareView };

export const selectors = { main, isFileExplorerEnabled };
