import type { State as RootState } from "core/bootstrap";
import { type State, name } from "./state";
import { createSelector } from "clean-architecture";
import * as userConfigs from "core/usecases/userConfigs";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import { assert } from "tsafe/assert";
import * as userAuthentication from "core/usecases/userAuthentication";
import { S3Object } from "core/ports/S3Client";

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

const uploadProgress = createSelector(state, (state): UploadProgress => {
    const { s3FilesBeingUploaded } = state;

    const completedFileCount = s3FilesBeingUploaded.map(
        ({ uploadPercent }) => uploadPercent === 100
    ).length;

    return {
        s3FilesBeingUploaded,
        "overallProgress": {
            completedFileCount,
            "remainingFileCount": s3FilesBeingUploaded.length - completedFileCount,
            "totalFileCount": s3FilesBeingUploaded.length,
            "uploadPercent":
                s3FilesBeingUploaded
                    .map(({ size, uploadPercent }) => size * uploadPercent)
                    .reduce((prev, curr) => prev + curr, 0) /
                s3FilesBeingUploaded
                    .map(({ size }) => size)
                    .reduce((prev, curr) => prev + curr, 0)
        }
    };
});

const commandLogsEntries = createSelector(
    state,
    userConfigs.selectors.userConfigs,
    (state, userConfigs) =>
        !userConfigs.isCommandBarEnabled ? undefined : state.commandLogsEntries
);

type CurrentWorkingDirectoryView = {
    directoryPath: string;
    items: (S3Object & {
        isBeingUploaded: boolean;
        isBeingDeleted: boolean;
        isPolicyChanging: boolean;
    })[];
};

const currentWorkingDirectoryView = createSelector(
    createSelector(state, state => state.directoryPath),
    createSelector(state, state => state.objects),
    createSelector(state, state => state.ongoingOperations),

    (
        directoryPath,
        objects,
        ongoingOperations
    ): CurrentWorkingDirectoryView | undefined => {
        if (directoryPath === undefined) {
            return undefined;
        }
        const items = objects
            .map(object => {
                const isBeingUploaded = ongoingOperations.some(
                    op =>
                        op.operation === "create" &&
                        op.object.basename === object.basename
                );

                const isBeingDeleted = ongoingOperations.some(
                    op =>
                        op.operation === "delete" &&
                        op.object.basename === object.basename
                );

                const isPolicyChanging = ongoingOperations.some(
                    op =>
                        op.operation === "modifyPolicy" &&
                        op.object.basename === object.basename
                );

                return {
                    ...object,
                    isBeingUploaded,
                    isBeingDeleted,
                    isPolicyChanging
                };
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
            items
        };
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
    uploadProgress,
    commandLogsEntries,
    currentWorkingDirectoryView,
    isNavigationOngoing,
    pathMinDepth,
    createSelector(state, state => state.viewMode),
    (
        uploadProgress,
        commandLogsEntries,
        currentWorkingDirectoryView,
        isNavigationOngoing,
        pathMinDepth,
        viewMode
    ) => {
        if (currentWorkingDirectoryView === undefined) {
            return {
                "isCurrentWorkingDirectoryLoaded": false as const,
                isNavigationOngoing,
                uploadProgress,
                commandLogsEntries,
                pathMinDepth,
                viewMode
            };
        }

        return {
            "isCurrentWorkingDirectoryLoaded": true as const,
            isNavigationOngoing,
            uploadProgress,
            commandLogsEntries,
            pathMinDepth,
            currentWorkingDirectoryView,
            viewMode
        };
    }
);

const isFileExplorerEnabled = (rootState: RootState) => {
    const { isUserLoggedIn } =
        userAuthentication.selectors.authenticationState(rootState);

    if (!isUserLoggedIn) {
        return true;
    } else {
        return (
            s3ConfigManagement.selectors
                .s3Configs(rootState)
                .find(s3Config => s3Config.isExplorerConfig) !== undefined
        );
    }
};

const directoryPath = createSelector(state, state => state.directoryPath);

export const protectedSelectors = { workingDirectoryPath, directoryPath };

export const selectors = { main, isFileExplorerEnabled };
