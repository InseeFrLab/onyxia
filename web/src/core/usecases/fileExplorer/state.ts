import { id } from "tsafe/id";
import { relative as pathRelative } from "pathe";
import { assert } from "tsafe/assert";
import { createUsecaseActions } from "clean-architecture";
import type { WritableDraft } from "clean-architecture/immer";
import { S3Object } from "core/ports/S3Client";

//All explorer path are expected to be absolute (start with /)

export type State = {
    directoryPath: string | undefined;
    viewMode: "list" | "block";
    objects: S3Object[];
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
        "objects": [],
        "viewMode": "list",
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
                s3FilesBeingUploaded.find(
                    ({ uploadPercent }) => uploadPercent !== 100
                ) !== undefined
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
                    objects: S3Object[];
                };
            }
        ) => {
            const { directoryPath, objects } = payload;

            state.directoryPath = directoryPath;
            state.objects = objects;
            state.isNavigationOngoing = false;

            //Properly restore state when navigating back to
            //a directory with ongoing operations.
            state.ongoingOperations
                .filter(o => pathRelative(o.directoryPath, directoryPath) === "")
                .forEach(o => {
                    switch (o.operation) {
                        case "delete":
                            removeIfPresent(state.objects, {
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
                    removeIfPresent(state.objects, { kind, basename });
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
                    object: S3Object;
                    directoryPath: string;
                };
            }
        ) => {
            const { object, directoryPath } = payload;

            assert(state.directoryPath !== undefined);

            const { ongoingOperations } = state;

            const ongoingOperation = ongoingOperations.find(
                o =>
                    o.kind === object.kind &&
                    o.basename === object.basename &&
                    pathRelative(o.directoryPath, directoryPath) === ""
            );

            assert(ongoingOperation !== undefined);

            ongoingOperations.splice(ongoingOperations.indexOf(ongoingOperation), 1);

            if (pathRelative(state.directoryPath, directoryPath) !== "") {
                return;
            }

            switch (ongoingOperation.operation) {
                case "create":
                    state.objects.push(object);
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
            state.objects = [];
            state.isNavigationOngoing = false;
        },
        "viewModeChanged": (
            state,
            { payload }: { payload: { viewMode: "list" | "block" } }
        ) => {
            const { viewMode } = payload;
            state.viewMode = viewMode;
        }
    }
});

function removeIfPresent(
    object: WritableDraft<{
        kind: "file" | "directory";
        basename: string;
    }>[],
    item: { kind: "file" | "directory"; basename: string }
): void {
    const index = object.findIndex(
        item_i => item_i.kind === item.kind && item_i.basename === item.basename
    );

    assert(index >= 0);

    object.splice(index, 1);
}
