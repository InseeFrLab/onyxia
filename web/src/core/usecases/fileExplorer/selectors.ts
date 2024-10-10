import type { State as RootState } from "core/bootstrap";
import memoize from "memoizee";
import { type State, name } from "./state";
import { createSelector } from "clean-architecture";
import * as userConfigs from "core/usecases/userConfigs";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import { assert } from "tsafe/assert";
import * as userAuthentication from "core/usecases/userAuthentication";

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
    directories: string[];
    files: string[];
    directoriesBeingCreated: string[];
    filesBeingCreated: string[];
};

const currentWorkingDirectoryView = createSelector(
    createSelector(state, state => state.directoryPath),
    createSelector(state, state => state.directoryItems),
    createSelector(state, state => state.ongoingOperations),
    (
        directoryPath,
        directoryItems,
        ongoingOperations
    ): CurrentWorkingDirectoryView | undefined => {
        if (directoryPath === undefined) {
            return undefined;
        }

        return {
            directoryPath,
            ...(() => {
                const selectOngoing = memoize(
                    (kind: "directory" | "file", operation: "create" | "rename") =>
                        ongoingOperations
                            .filter(
                                o =>
                                    o.directoryPath === directoryPath &&
                                    o.kind === kind &&
                                    o.operation === operation
                            )
                            .map(({ basename }) => basename)
                );

                const select = (kind: "directory" | "file") =>
                    [
                        ...directoryItems
                            .filter(item => item.kind === kind)
                            .map(({ basename }) => basename),
                        ...selectOngoing(kind, "create"),
                        ...selectOngoing(kind, "rename")
                    ].sort((a, b) => a.localeCompare(b));

                return {
                    "directories": select("directory"),
                    "files": select("file"),
                    "directoriesBeingCreated": selectOngoing("directory", "create"),
                    "directoriesBeingRenamed": selectOngoing("directory", "rename"),
                    "filesBeingCreated": selectOngoing("file", "create"),
                    "filesBeingRenamed": selectOngoing("file", "rename")
                };
            })()
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
    (
        uploadProgress,
        commandLogsEntries,
        currentWorkingDirectoryView,
        isNavigationOngoing,
        pathMinDepth
    ) => {
        if (currentWorkingDirectoryView === undefined) {
            return {
                "isCurrentWorkingDirectoryLoaded": false as const,
                isNavigationOngoing,
                uploadProgress,
                commandLogsEntries,
                pathMinDepth
            };
        }

        return {
            "isCurrentWorkingDirectoryLoaded": true as const,
            isNavigationOngoing,
            uploadProgress,
            commandLogsEntries,
            pathMinDepth,
            currentWorkingDirectoryView
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

export const protectedSelectors = { workingDirectoryPath };

export const selectors = { main, isFileExplorerEnabled };
