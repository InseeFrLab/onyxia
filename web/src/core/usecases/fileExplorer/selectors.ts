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

const state = (rootState: RootState): State => rootState[name];

type UploadProgress = {
    s3FilesBeingUploaded: State["s3FilesBeingUploaded"];
    overallProgress: {
        completedFileCount: number;
        remainingFileCount: number;
        totalFileCount: number;
        uploadPercent: number;
    };
};
const isDownloadPreparing = createSelector(state, (state): boolean => {
    const { ongoingOperations } = state;
    return (
        ongoingOperations.filter(operation => operation.operation === "downloading")
            .length > 0
    );
});

const uploadProgress = createSelector(state, (state): UploadProgress => {
    const { s3FilesBeingUploaded } = state;

    const completedFileCount = s3FilesBeingUploaded.map(
        ({ uploadPercent }) => uploadPercent === 100
    ).length;

    const totalSize = s3FilesBeingUploaded
        .map(({ size }) => size)
        .reduce((prev, curr) => prev + curr, 0);

    const uploadedSize = s3FilesBeingUploaded
        .map(({ size, uploadPercent }) => (size * uploadPercent) / 100)
        .reduce((prev, curr) => prev + curr, 0);

    const uploadPercent = totalSize === 0 ? 100 : (uploadedSize / totalSize) * 100;

    return {
        s3FilesBeingUploaded,
        overallProgress: {
            completedFileCount,
            remainingFileCount: s3FilesBeingUploaded.length - completedFileCount,
            totalFileCount: s3FilesBeingUploaded.length,
            uploadPercent
        }
    };
});

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
        };

        export type File = Common & {
            kind: "file";
            size: number | undefined;
            lastModified: Date | undefined;
        } & (
                | {
                      isBeingCreated: false;
                  }
                | {
                      isBeingCreated: true;
                      uploadPercent: number;
                  }
            );

        export type Directory = Common & {
            kind: "directory";
            isBeingCreated: boolean;
        };
    }
}

const currentWorkingDirectoryView = createSelector(
    createSelector(state, state => state.directoryPath),
    createSelector(state, state => state.objects),
    createSelector(state, state => state.ongoingOperations),
    createSelector(state, state => state.s3FilesBeingUploaded),
    createSelector(state, state => state.isBucketPolicyAvailable),
    (
        directoryPath,
        objects,
        ongoingOperations,
        s3FilesBeingUploaded,
        isBucketPolicyAvailable
    ): CurrentWorkingDirectoryView | null => {
        if (directoryPath === undefined) {
            return null;
        }
        const items = objects
            .map((object): CurrentWorkingDirectoryView.Item => {
                const isBeingDeleted = ongoingOperations.some(
                    op =>
                        op.directoryPath === directoryPath &&
                        op.operation === "delete" &&
                        op.objects.some(
                            ongoingObject => ongoingObject.basename === object.basename
                        )
                );

                const isPolicyChanging = ongoingOperations.some(
                    op =>
                        op.directoryPath === directoryPath &&
                        op.operation === "modifyPolicy" &&
                        op.objects.some(
                            ongoingObject => ongoingObject.basename === object.basename
                        )
                );

                const isBeingCreated = ongoingOperations.some(
                    op =>
                        op.directoryPath === directoryPath &&
                        op.operation === "create" &&
                        op.objects.some(
                            ongoingObject => ongoingObject.basename === object.basename
                        )
                );

                const common = {
                    basename: object.basename,
                    policy: object.policy,
                    canChangePolicy: object.canChangePolicy,
                    isBeingDeleted,
                    isPolicyChanging
                } satisfies CurrentWorkingDirectoryView.Item.Common;

                switch (object.kind) {
                    case "file": {
                        const { size, lastModified } = object;

                        return id<CurrentWorkingDirectoryView.Item.File>({
                            kind: "file",
                            ...common,
                            size,
                            lastModified,
                            ...(isBeingCreated
                                ? {
                                      isBeingCreated: true,
                                      uploadPercent: (() => {
                                          const uploadEntry = s3FilesBeingUploaded.find(
                                              o =>
                                                  o.basename === object.basename &&
                                                  o.directoryPath === directoryPath
                                          );
                                          return uploadEntry?.uploadPercent ?? 0;
                                      })()
                                  }
                                : {
                                      isBeingCreated: false
                                  })
                        });
                    }
                    case "directory":
                        return id<CurrentWorkingDirectoryView.Item.Directory>({
                            kind: "directory",
                            ...common,
                            isBeingCreated
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

const isNavigationOngoing = createSelector(state, state => state.isNavigationOngoing);

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
    createSelector(state, state => state.directoryPath),
    uploadProgress,
    commandLogsEntries,
    currentWorkingDirectoryView,
    isNavigationOngoing,
    pathMinDepth,
    createSelector(state, state => state.viewMode),
    shareView,
    isDownloadPreparing,
    (
        directoryPath,
        uploadProgress,
        commandLogsEntries,
        currentWorkingDirectoryView,
        isNavigationOngoing,
        pathMinDepth,
        viewMode,
        shareView,
        isDownloadPreparing
    ) => {
        if (directoryPath === undefined) {
            return {
                isCurrentWorkingDirectoryLoaded: false as const,
                isNavigationOngoing,
                uploadProgress,
                commandLogsEntries,
                pathMinDepth,
                viewMode,
                isDownloadPreparing
            };
        }

        assert(currentWorkingDirectoryView !== null);
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
