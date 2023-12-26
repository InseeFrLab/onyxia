import { id } from "tsafe/id";
import { relative as pathRelative } from "path";
import { assert } from "tsafe/assert";
import type { WritableDraft } from "immer/dist/types/types-external";
import { createUsecaseActions } from "redux-clean-architecture";

//All explorer path are expected to be absolute (start with /)

export type State = {
    directoryPath: string | undefined;
    directoryItems: {
        kind: "file" | "directory";
        basename: string;
    }[];
    isNavigationOngoing: boolean;
    ongoingOperations: {
        directoryPath: string;
        basename: string;
        kind: "file" | "directory";
        operation: "create" | "delete";
    }[];
    s3FilesBeingUploaded: {
        directoryPath: string;
        basename: string;
        size: number;
        uploadPercent: number;
    }[];
    commandLogsEntries: {
        cmdId: number;
        cmd: string;
        resp: string | undefined;
    }[];
};

export const name = "fileExplorer";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": id<State>({
        "directoryPath": undefined,
        "directoryItems": [],
        "isNavigationOngoing": false,
        "ongoingOperations": [],
        "s3FilesBeingUploaded": [],
        "commandLogsEntries": []
    }),
    "reducers": {
        "fileUploadStarted": (
            state,
            {
                payload
            }: {
                payload: {
                    directoryPath: string;
                    basename: string;
                    size: number;
                };
            }
        ) => {
            const { directoryPath, basename, size } = payload;

            state.s3FilesBeingUploaded.push({
                directoryPath,
                basename,
                size,
                "uploadPercent": 0
            });
        },
        "uploadProgressUpdated": (
            state,
            {
                payload
            }: {
                payload: {
                    directoryPath: string;
                    basename: string;
                    uploadPercent: number;
                };
            }
        ) => {
            const { basename, directoryPath, uploadPercent } = payload;
            const { s3FilesBeingUploaded } = state;

            const s3FileBeingUploaded = s3FilesBeingUploaded.find(
                s3FileBeingUploaded =>
                    s3FileBeingUploaded.directoryPath === directoryPath &&
                    s3FileBeingUploaded.basename === basename
            );
            assert(s3FileBeingUploaded !== undefined);
            s3FileBeingUploaded.uploadPercent = uploadPercent;

            if (
                !!s3FilesBeingUploaded.find(({ uploadPercent }) => uploadPercent !== 100)
            ) {
                return;
            }

            state.s3FilesBeingUploaded = [];
        },
        "navigationStarted": state => {
            state.isNavigationOngoing = true;
        },
        "navigationCompleted": (
            state,
            {
                payload
            }: {
                payload: {
                    directoryPath: string;
                    directoryItems: {
                        kind: "file" | "directory";
                        basename: string;
                    }[];
                };
            }
        ) => {
            const { directoryPath, directoryItems } = payload;

            state.directoryPath = directoryPath;
            state.directoryItems = directoryItems;
            state.isNavigationOngoing = false;

            //Properly restore state when navigating back to
            //a directory with ongoing operations.
            state.ongoingOperations
                .filter(o => pathRelative(o.directoryPath, directoryPath) === "")
                .forEach(o => {
                    switch (o.operation) {
                        case "delete":
                            removeIfPresent(state.directoryItems, {
                                "kind": o.kind,
                                "basename": o.basename
                            });
                            break;
                        case "create":
                            break;
                    }
                });
        },
        "operationStarted": (
            state,
            {
                payload
            }: {
                payload: {
                    kind: "file" | "directory";
                    basename: string;
                    operation: "create" | "delete";
                };
            }
        ) => {
            const { kind, basename } = payload;

            assert(state.directoryPath !== undefined);

            switch (payload.operation) {
                case "delete":
                    removeIfPresent(state.directoryItems, { kind, basename });
                    break;
            }

            state.ongoingOperations.push({
                "directoryPath": state.directoryPath,
                kind,
                ...(() => {
                    switch (payload.operation) {
                        case "delete":
                        case "create":
                            return {
                                "operation": payload.operation,
                                basename
                            };
                    }
                })()
            });
        },
        "operationCompleted": (
            state,
            {
                payload
            }: {
                payload: {
                    kind: "file" | "directory";
                    basename: string;
                    directoryPath: string;
                };
            }
        ) => {
            const { kind, basename, directoryPath } = payload;

            assert(state.directoryPath !== undefined);

            const { ongoingOperations } = state;

            const ongoingOperation = ongoingOperations.find(
                o =>
                    o.kind === kind &&
                    o.basename === basename &&
                    pathRelative(o.directoryPath, directoryPath) === ""
            );

            assert(ongoingOperation !== undefined);

            ongoingOperations.splice(ongoingOperations.indexOf(ongoingOperation), 1);

            if (pathRelative(state.directoryPath, directoryPath) !== "") {
                return;
            }

            switch (ongoingOperation.operation) {
                case "create":
                    state.directoryItems.push({
                        "basename": ongoingOperation.basename,
                        kind
                    });
                    break;
            }
        },
        "commandLogIssued": (
            state,
            {
                payload
            }: {
                payload: {
                    cmdId: number;
                    cmd: string;
                };
            }
        ) => {
            const { cmdId, cmd } = payload;

            state.commandLogsEntries.push({
                cmdId,
                cmd,
                "resp": undefined
            });
        },
        "commandLogCancelled": (
            state,
            {
                payload
            }: {
                payload: {
                    cmdId: number;
                };
            }
        ) => {
            const { cmdId } = payload;

            const index = state.commandLogsEntries.findIndex(
                entry => entry.cmdId === cmdId
            );

            assert(index >= 0);

            state.commandLogsEntries.splice(index, 1);
        },
        "commandLogResponseReceived": (
            state,
            {
                payload
            }: {
                payload: {
                    cmdId: number;
                    resp: string;
                };
            }
        ) => {
            const { cmdId, resp } = payload;

            const entry = state.commandLogsEntries.find(entry => entry.cmdId === cmdId);

            assert(entry !== undefined);

            entry.resp = resp;
        },
        "workingDirectoryChanged": state => {
            state.directoryPath = undefined;
            state.directoryItems = [];
            state.isNavigationOngoing = false;
        },
        /** For evt */
        "notifyDirectoryPath": () => {}
    }
});

function removeIfPresent(
    directoryItems: WritableDraft<{
        kind: "file" | "directory";
        basename: string;
    }>[],
    item: { kind: "file" | "directory"; basename: string }
): void {
    const index = directoryItems.findIndex(
        item_i => item_i.kind === item.kind && item_i.basename === item.basename
    );

    assert(index >= 0);

    directoryItems.splice(index, 1);
}
