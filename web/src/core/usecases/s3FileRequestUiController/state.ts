import {
    createObjectThatThrowsIfAccessed,
    createUsecaseActions
} from "clean-architecture";
import type { S3Client } from "core/ports/S3Client";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";

export type PresignedPost = S3Client.PresignedPost;

export type State = {
    presignedPost: PresignedPost;
    uploads: State.Upload[];
};

export namespace State {
    export type Upload = {
        uploadId: string;
        fileName: string;
        sizeInBytes: number;
        status: "uploading" | "success" | "failed";
        uploadPercent: number;
        errorMessage: string | undefined;
    };
}

export const name = "s3FileRequestUiController";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>(),
    reducers: {
        loaded: (_state, { payload }: { payload: { presignedPost: PresignedPost } }) => {
            const { presignedPost } = payload;

            return id<State>({
                presignedPost,
                uploads: []
            });
        },
        uploadsStarted: (
            state,
            {
                payload
            }: {
                payload: {
                    uploads: {
                        uploadId: string;
                        fileName: string;
                        sizeInBytes: number;
                    }[];
                };
            }
        ) => {
            state.uploads.push(
                ...payload.uploads.map(({ uploadId, fileName, sizeInBytes }) => ({
                    uploadId,
                    fileName,
                    sizeInBytes,
                    status: "uploading" as const,
                    uploadPercent: 0,
                    errorMessage: undefined
                }))
            );
        },
        uploadProgressReported: (
            state,
            { payload }: { payload: { uploadId: string; uploadPercent: number } }
        ) => {
            const upload = state.uploads.find(
                upload => upload.uploadId === payload.uploadId
            );

            if (upload === undefined) {
                return;
            }

            assert(upload.status === "uploading");

            upload.uploadPercent = payload.uploadPercent;
        },
        uploadSucceeded: (state, { payload }: { payload: { uploadId: string } }) => {
            const upload = state.uploads.find(
                upload => upload.uploadId === payload.uploadId
            );

            if (upload === undefined) {
                return;
            }

            assert(upload.status === "uploading");

            upload.status = "success";
            upload.uploadPercent = 100;
        },
        uploadFailed: (
            state,
            { payload }: { payload: { uploadId: string; errorMessage: string } }
        ) => {
            const upload = state.uploads.find(
                upload => upload.uploadId === payload.uploadId
            );

            if (upload === undefined) {
                return;
            }

            assert(upload.status === "uploading");

            upload.status = "failed";
            upload.errorMessage = payload.errorMessage;
        },
        uploadCanceled: (state, { payload }: { payload: { uploadId: string } }) => {
            const uploadIndex = state.uploads.findIndex(
                upload => upload.uploadId === payload.uploadId
            );

            if (uploadIndex === -1) {
                return;
            }

            assert(state.uploads[uploadIndex].status === "uploading");

            state.uploads.splice(uploadIndex, 1);
        },
        uploadRetried: (state, { payload }: { payload: { uploadId: string } }) => {
            const upload = state.uploads.find(
                upload => upload.uploadId === payload.uploadId
            );

            assert(upload !== undefined);
            assert(upload.status === "failed");

            upload.status = "uploading";
            upload.uploadPercent = 0;
            upload.errorMessage = undefined;
        }
    }
});
