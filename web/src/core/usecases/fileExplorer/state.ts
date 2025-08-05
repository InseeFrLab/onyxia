import { id } from "tsafe/id";
import { assert, type Equals } from "tsafe/assert";
import { createUsecaseActions } from "clean-architecture";
import type { S3BucketPolicy, S3Object } from "core/ports/S3Client";
import { relative as pathRelative } from "pathe";

//All explorer paths are expected to be absolute (start with /)

export type State = {
    directoryPath: string | undefined;
    viewMode: "list" | "block";
    objects: S3Object[];
    isNavigationOngoing: boolean;
    ongoingOperations: {
        operationId: string;
        operation: "create" | "delete" | "modifyPolicy" | "downloading";
        directoryPath: string;
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
    isBucketPolicyAvailable: boolean;
    share:
        | {
              fileBasename: string;
              url: string | undefined;
              validityDurationSecond: number | undefined;
              validityDurationSecondOptions: number[] | undefined;
              isSignedUrlBeingRequested: boolean | undefined;
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
        isBucketPolicyAvailable: true,
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
                    isBucketPolicyAvailable: boolean;
                };
            }
        ) => {
            const { directoryPath, objects, bucketPolicy, isBucketPolicyAvailable } =
                payload;

            state.directoryPath = directoryPath;
            state.objects = objects;
            state.isNavigationOngoing = false;
            if (bucketPolicy) {
                state.bucketPolicy = bucketPolicy;
            }
            state.isBucketPolicyAvailable = isBucketPolicyAvailable;
        },
        operationStarted: (
            state,
            {
                payload
            }: {
                payload: {
                    operationId: string;
                    objects: S3Object[];
                    operation: "create" | "delete" | "modifyPolicy" | "downloading";
                };
            }
        ) => {
            const { objects, operation, operationId } = payload;

            assert(state.directoryPath !== undefined);

            const { directoryPath } = state;

            state.ongoingOperations.push({
                operationId,
                operation,
                directoryPath,
                objects
            });
        },
        operationCompleted: (
            state,
            {
                payload
            }: {
                payload: {
                    operationId: string;
                };
            }
        ) => {
            const { operationId } = payload;

            assert(state.directoryPath !== undefined);

            const { ongoingOperations } = state;

            const ongoingOperation = ongoingOperations.find(
                o => o.operationId === operationId
            );

            assert(ongoingOperation !== undefined);

            ongoingOperations.splice(ongoingOperations.indexOf(ongoingOperation), 1);

            assert(
                pathRelative(ongoingOperation.directoryPath, state.directoryPath) === ""
            );

            switch (ongoingOperation.operation) {
                case "create":
                    state.objects.push(
                        ...ongoingOperation.objects.filter(
                            object_created_i =>
                                state.objects.find(
                                    object_i =>
                                        object_i.kind === object_created_i.kind &&
                                        object_i.basename === object_created_i.basename
                                ) === undefined
                        )
                    );
                    break;
                case "delete":
                    state.objects = state.objects.filter(
                        object_i =>
                            ongoingOperation.objects.find(
                                object_deleted_i =>
                                    object_deleted_i.kind === object_i.kind &&
                                    object_deleted_i.basename === object_i.basename
                            ) === undefined
                    );
                    break;
                case "downloading":
                    break;
                case "modifyPolicy":
                    break;
                default:
                    assert<Equals<typeof ongoingOperation.operation, never>>;
            }
        },
        metadataOfFileBeingUploadedUpdated: (
            state,
            {
                payload
            }: {
                payload: {
                    basename: string;
                    size: number | undefined;
                    lastModified: Date | undefined;
                };
            }
        ) => {
            const { basename, size, lastModified } = payload;

            const { directoryPath } = state;

            assert(directoryPath !== undefined);

            const object = state.ongoingOperations
                .filter(
                    ongoingOperation =>
                        ongoingOperation.operation === "create" &&
                        pathRelative(ongoingOperation.directoryPath, directoryPath) === ""
                )
                .map(({ objects }) => objects)
                .flat()
                .map(object =>
                    object.kind === "file" && object.basename === basename
                        ? object
                        : undefined
                )
                .filter(object => object !== undefined)[0];

            assert(object !== undefined);

            object.size = size;
            object.lastModified = lastModified;
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
                    kind: "file" | "directory";
                    basename: string;
                    policy: "public" | "private";
                    bucketPolicy: S3BucketPolicy;
                };
            }
        ) => {
            const { bucketPolicy, policy, basename, kind } = payload;

            {
                const object = state.objects.find(
                    object => object.kind === kind && object.basename === basename
                );
                assert(object !== undefined);
                object.policy = policy;
            }

            state.bucketPolicy = bucketPolicy;
        },
        shareOpened: (
            state,
            {
                payload
            }: {
                payload: {
                    fileBasename: string;
                    url: string | undefined;
                    validityDurationSecondOptions: number[] | undefined;
                };
            }
        ) => {
            const { fileBasename, url, validityDurationSecondOptions } = payload;

            if (url !== undefined) {
                state.share = {
                    fileBasename,
                    url,
                    isSignedUrlBeingRequested: undefined,
                    validityDurationSecondOptions: undefined,
                    validityDurationSecond: undefined
                };
            } else {
                assert(validityDurationSecondOptions !== undefined);

                state.share = {
                    fileBasename,
                    url,
                    isSignedUrlBeingRequested: false,
                    validityDurationSecondOptions,
                    validityDurationSecond: validityDurationSecondOptions[0]
                };
            }
        },
        shareClosed: state => {
            state.share = undefined;
        },
        shareSelectedValidityDurationChanged: (
            state,
            {
                payload
            }: {
                payload: {
                    validityDurationSecond: number;
                };
            }
        ) => {
            const { validityDurationSecond } = payload;

            assert(state.share !== undefined);
            assert(state.share.validityDurationSecondOptions !== undefined);
            assert(
                state.share.validityDurationSecondOptions.includes(validityDurationSecond)
            );
            state.share.validityDurationSecond = validityDurationSecond;
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
