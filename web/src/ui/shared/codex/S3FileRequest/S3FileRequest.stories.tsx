import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { S3FileRequest, type S3FileRequestProps } from "./S3FileRequest";

const meta = {
    title: "Shared/S3FileRequest",
    component: S3FileRequest
} satisfies Meta<typeof S3FileRequest>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs: S3FileRequestProps = {
    expirationTime: Date.now() + 24 * 60 * 60 * 1_000,
    uploads: [],
    onUploadFiles: action("uploadFiles"),
    onCancelUpload: action("cancelUpload"),
    onRetryUpload: action("retryUpload")
};

export const Ready: Story = {
    args: baseArgs
};

export const FolderUploading: Story = {
    args: {
        ...baseArgs,
        uploads: [
            {
                uploadId: "upload-1",
                fileName: "holiday/photos/beach.jpg",
                sizeInBytes: 3_145_728,
                status: "uploading",
                uploadPercent: 64,
                errorMessage: undefined
            },
            {
                uploadId: "upload-2",
                fileName: "holiday/notes.txt",
                sizeInBytes: 1_284,
                status: "uploading",
                uploadPercent: 18,
                errorMessage: undefined
            }
        ]
    }
};

export const MixedResults: Story = {
    args: {
        ...baseArgs,
        uploads: [
            {
                uploadId: "upload-1",
                fileName: "report.pdf",
                sizeInBytes: 2_450_000,
                status: "success",
                uploadPercent: 100,
                errorMessage: undefined
            },
            {
                uploadId: "upload-2",
                fileName: "archive/data.csv",
                sizeInBytes: 8_900_000,
                status: "failed",
                uploadPercent: 37,
                errorMessage: "The upload failed."
            }
        ]
    }
};

export const AllUploaded: Story = {
    args: {
        ...baseArgs,
        uploads: [
            {
                uploadId: "upload-1",
                fileName: "project/readme.md",
                sizeInBytes: 4_096,
                status: "success",
                uploadPercent: 100,
                errorMessage: undefined
            }
        ]
    }
};

export const Expired: Story = {
    args: {
        ...baseArgs,
        expirationTime: Date.now() - 60_000
    }
};
