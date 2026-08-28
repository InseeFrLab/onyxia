import type { Thunks } from "core/bootstrap";
import { actions, type PresignedPost } from "./state";
import { privateSelectors } from "./selectors";
import { assert } from "tsafe/assert";

const fileByUploadId = new Map<string, File>();
const xhrByUploadId = new Map<string, XMLHttpRequest>();

export const thunks = {
    load:
        (params: { presignedPost: PresignedPost }) =>
        (...args) => {
            const { presignedPost } = params;
            const [dispatch] = args;

            for (const xhr of [...xhrByUploadId.values()]) {
                xhr.abort();
            }

            xhrByUploadId.clear();
            fileByUploadId.clear();

            dispatch(actions.loaded({ presignedPost }));
        },
    uploadFiles:
        (params: { files: readonly File[] }) =>
        async (...args) => {
            const { files } = params;
            const [dispatch] = args;

            const uploads = files.map(file => {
                const uploadId = `${Date.now()}-${Math.random()}`;

                fileByUploadId.set(uploadId, file);

                return {
                    uploadId,
                    fileName: file.name,
                    sizeInBytes: file.size
                };
            });

            if (uploads.length === 0) {
                return;
            }

            dispatch(actions.uploadsStarted({ uploads }));

            await Promise.all(
                uploads.map(({ uploadId }) =>
                    dispatch(privateThunks.uploadFile({ uploadId }))
                )
            );
        },
    cancelUpload: (params: { uploadId: string }) => () => {
        xhrByUploadId.get(params.uploadId)?.abort();
    },
    retryUpload:
        (params: { uploadId: string }) =>
        async (...args) => {
            const { uploadId } = params;
            const [dispatch, getState] = args;

            const upload = privateSelectors
                .uploads(getState())
                .find(upload => upload.uploadId === uploadId);

            assert(upload !== undefined);
            assert(upload.status === "failed");
            assert(fileByUploadId.has(uploadId));

            dispatch(actions.uploadRetried({ uploadId }));

            await dispatch(privateThunks.uploadFile({ uploadId }));
        }
} satisfies Thunks;

export const privateThunks = {
    uploadFile:
        (params: { uploadId: string }) =>
        async (...args) => {
            const { uploadId } = params;
            const [dispatch, getState] = args;

            const file = fileByUploadId.get(uploadId);
            assert(file !== undefined);

            const presignedPost = privateSelectors.presignedPost(getState());

            if (Date.now() >= presignedPost.expirationTime) {
                dispatch(
                    actions.uploadFailed({
                        uploadId,
                        errorMessage: "This file request has expired."
                    })
                );
                return;
            }

            await new Promise<void>(resolve => {
                const xhr = new XMLHttpRequest();
                const formData = new FormData();

                for (const [name, value] of Object.entries(presignedPost.fields)) {
                    formData.append(name, value);
                }

                // S3 requires the file to be the last field in a POST form.
                formData.append("file", file);

                const complete = (params: {
                    status: "success" | "failed" | "canceled";
                    errorMessage?: string;
                }) => {
                    if (xhrByUploadId.get(uploadId) !== xhr) {
                        resolve();
                        return;
                    }

                    xhrByUploadId.delete(uploadId);

                    switch (params.status) {
                        case "success":
                            fileByUploadId.delete(uploadId);
                            dispatch(actions.uploadSucceeded({ uploadId }));
                            break;
                        case "failed":
                            dispatch(
                                actions.uploadFailed({
                                    uploadId,
                                    errorMessage:
                                        params.errorMessage ?? "The upload failed."
                                })
                            );
                            break;
                        case "canceled":
                            fileByUploadId.delete(uploadId);
                            dispatch(actions.uploadCanceled({ uploadId }));
                            break;
                    }

                    resolve();
                };

                xhr.upload.onprogress = event => {
                    if (!event.lengthComputable) {
                        return;
                    }

                    dispatch(
                        actions.uploadProgressReported({
                            uploadId,
                            uploadPercent: Math.round((event.loaded / event.total) * 100)
                        })
                    );
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        complete({ status: "success" });
                        return;
                    }

                    complete({
                        status: "failed",
                        errorMessage:
                            xhr.statusText ||
                            `The upload failed with HTTP status ${xhr.status}.`
                    });
                };

                xhr.onerror = () =>
                    complete({
                        status: "failed",
                        errorMessage: "A network error occurred during the upload."
                    });

                xhr.onabort = () => complete({ status: "canceled" });

                xhrByUploadId.set(uploadId, xhr);

                xhr.open("POST", presignedPost.url);
                xhr.send(formData);
            });
        }
} satisfies Thunks;
