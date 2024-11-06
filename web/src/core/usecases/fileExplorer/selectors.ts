import type { State as RootState } from "core/bootstrap";
import { type State, name } from "./state";
import { createSelector } from "clean-architecture";
import * as userConfigs from "core/usecases/userConfigs";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import { assert } from "tsafe/assert";
import * as userAuthentication from "core/usecases/userAuthentication";
import { id } from "tsafe/id";

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

export type CurrentWorkingDirectoryView = {
    directoryPath: string;
    items: CurrentWorkingDirectoryView.Item[];
};

export namespace CurrentWorkingDirectoryView {
    export type Item = Item.File | Item.Directory;
    export namespace Item {
        export type Common = {
            basename: string;
            policy: "public" | "private";
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

    (
        directoryPath,
        objects,
        ongoingOperations,
        s3FilesBeingUploaded
    ): CurrentWorkingDirectoryView | undefined => {
        if (directoryPath === undefined) {
            return undefined;
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
                    "basename": object.basename,
                    "policy": object.policy,
                    isBeingDeleted,
                    isPolicyChanging
                } satisfies CurrentWorkingDirectoryView.Item.Common;

                switch (object.kind) {
                    case "file": {
                        const { size, lastModified } = object;

                        return id<CurrentWorkingDirectoryView.Item.File>({
                            "kind": "file",
                            ...common,
                            size,
                            lastModified,
                            ...(isBeingCreated
                                ? {
                                      "isBeingCreated": true,
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
                                      "isBeingCreated": false
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
