import { id } from "tsafe/id";
import { relative as pathRelative } from "pathe";
import { assert } from "tsafe/assert";
import { createUsecaseActions } from "clean-architecture";
import type { WritableDraft } from "clean-architecture/immer";
import { S3BucketPolicy, S3Object } from "core/ports/S3Client";

//All explorer path are expected to be absolute (start with /)

export type State = {
    directoryPath: string | undefined;
    viewMode: "list" | "block";
    objects: S3Object[];
    isNavigationOngoing: boolean;
    ongoingOperations: {
        directoryPath: string;
        operationId: string;
        operation: "create" | "delete" | "modifyPolicy";
        objects: S3Object[];
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
    bucketPolicy: S3BucketPolicy;
    share:
        | {
              fileBasename: string;
              url: string | undefined;
              isSignedUrlBeingRequested: boolean;
          }
        | undefined;
};

export const name = "fileExplorer";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>({
        directoryPath: undefined,
        objects: [],
        viewMode: "list",
        isNavigationOngoing: false,
        ongoingOperations: [],
        s3FilesBeingUploaded: [],
        commandLogsEntries: [],
        bucketPolicy: {
            Version: "2012-10-17",
            Statement: []
        },
        share: undefined
    }),
    reducers: {
        fileUploadStarted: (
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
                uploadPercent: 0
            });
        },
        uploadProgressUpdated: (
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
        navigationStarted: state => {
            assert(state.share === undefined);
            state.isNavigationOngoing = true;
        },
        navigationCompleted: (
            state,
            {
                payload
            }: {
                payload: {
                    directoryPath: string;
                    objects: S3Object[];
                    bucketPolicy: S3BucketPolicy | undefined;
                };
            }
        ) => {
            const { directoryPath, objects, bucketPolicy } = payload;

            state.directoryPath = directoryPath;
            state.objects = objects;
            state.isNavigationOngoing = false;
            bucketPolicy && (state.bucketPolicy = bucketPolicy);

            // Properly restore state when navigating back to
            // a directory with ongoing operations.
            state.ongoingOperations
                .filter(o => pathRelative(o.directoryPath, directoryPath) === "")
                .forEach(o => {
                    switch (o.operation) {
                        case "delete":
                            o.objects.forEach(object => {
                                removeIfPresent(state.objects, {
                                    kind: object.kind,
                                    basename: object.basename
                                });
                            });
                            break;
                        case "create":
                            state.objects.push(...o.objects);
                            break;
                    }
                });
        },
        operationStarted: (
            state,
            {
                payload
            }: {
                payload: {
                    operationId: string;
                    objects: S3Object[];
                    operation: "create" | "delete" | "modifyPolicy";
                };
            }
        ) => {
            const { objects, operation, operationId } = payload;

            assert(state.directoryPath !== undefined);

            state.ongoingOperations.push({
                directoryPath: state.directoryPath,
                operationId,
                objects,
                operation
            });

            switch (payload.operation) {
                case "delete":
                    objects.forEach(object => {
                        removeIfPresent(state.objects, {
                            kind: object.kind,
                            basename: object.basename
                        });
                    });
                    break;
                case "create":
                    //Optimistic update
                    state.objects.push(...objects);
                    break;
                case "modifyPolicy":
                    break;
            }
        },
        operationCompleted: (
            state,
            {
                payload
            }: {
                payload: {
                    operationId: string;
                    objects: S3Object[];
                };
            }
        ) => {
            const { operationId, objects } = payload;

            assert(state.directoryPath !== undefined);

            const { ongoingOperations } = state;

            const ongoingOperation = ongoingOperations.find(
                o => o.operationId === operationId
            );

            assert(ongoingOperation !== undefined);

            ongoingOperations.splice(ongoingOperations.indexOf(ongoingOperation), 1);

            if (
                pathRelative(state.directoryPath, ongoingOperation.directoryPath) !== ""
            ) {
                return;
            }

            switch (ongoingOperation.operation) {
                case "create":
                    state.objects = state.objects.map(
                        obj =>
                            objects.find(
                                o => o.basename === obj.basename && o.kind === obj.kind
                            ) ?? obj
                    );
                    break;
            }
        },
        commandLogIssued: (
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
                resp: undefined
            });
        },
        commandLogCancelled: (
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
        commandLogResponseReceived: (
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
        workingDirectoryChanged: state => {
            state.directoryPath = undefined;
            state.objects = [];
            state.isNavigationOngoing = false;
        },
        viewModeChanged: (
            state,
            { payload }: { payload: { viewMode: "list" | "block" } }
        ) => {
            const { viewMode } = payload;
            state.viewMode = viewMode;
        },
        bucketPolicyModified: (
            state,
            {
                payload
            }: {
                payload: {
                    bucketPolicy: S3BucketPolicy;
                    policy: "public" | "private";
                    basename: string;
                };
            }
        ) => {
            state.objects = state.objects.map(o =>
                o.basename === payload.basename
                    ? {
                          ...o,
                          policy: payload.policy
                      }
                    : o
            );
            state.bucketPolicy = payload.bucketPolicy;
        },
        shareOpened: (
            state,
            {
                payload
            }: {
                payload: {
                    fileBasename: string;
                    url: string | undefined;
                };
            }
        ) => {
            const { fileBasename, url } = payload;

            state.share = {
                fileBasename,
                url,
                isSignedUrlBeingRequested: false
            };
        },
        shareClosed: state => {
            state.share = undefined;
        },
        requestSignedUrlStarted: state => {
            assert(state.share !== undefined);
            state.share.isSignedUrlBeingRequested = true;
        },
        requestSignedUrlCompleted: (
            state,
            {
                payload
            }: {
                payload: {
                    url: string;
                };
            }
        ) => {
            const { url } = payload;

            assert(state.share !== undefined);
            state.share.isSignedUrlBeingRequested = false;
            state.share.url = url;
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
