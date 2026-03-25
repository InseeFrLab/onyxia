import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import type { S3Uri } from "core/tools/S3Uri";
import { stringifyS3Uri } from "core/tools/S3Uri";
import type { Link } from "type-route";
import { S3Uploads, type S3UploadsProps } from "./S3Upload";

const meta = {
    title: "Shared/S3Uploads",
    component: S3Uploads
} satisfies Meta<typeof S3Uploads>;

export default meta;

type Story = StoryObj<typeof meta>;

const reportCsv: S3Uri.NonTerminatedByDelimiter = {
    bucket: "analytics-data",
    delimiter: "/",
    keySegments: ["exports", "2024", "summary.csv"],
    isDelimiterTerminated: false
};

const rawEvents: S3Uri.NonTerminatedByDelimiter = {
    bucket: "analytics-data",
    delimiter: "/",
    keySegments: ["raw", "events", "2024-01-01.parquet"],
    isDelimiterTerminated: false
};

const modelBin: S3Uri.NonTerminatedByDelimiter = {
    bucket: "research-data",
    delimiter: "/",
    keySegments: ["models", "v3", "checkpoint.bin"],
    isDelimiterTerminated: false
};

const makeDirectoryLink = (s3Uri: S3Uri.NonTerminatedByDelimiter): Link => {
    const directoryUri: S3Uri.TerminatedByDelimiter = {
        bucket: s3Uri.bucket,
        delimiter: s3Uri.delimiter,
        keySegments: s3Uri.keySegments.slice(0, -1),
        isDelimiterTerminated: true
    };

    const directoryStr = stringifyS3Uri(directoryUri);

    return {
        href: `/s3?path=${encodeURIComponent(directoryStr)}`,
        onClick: event => {
            event.preventDefault();
            action("open directory")(directoryStr);
        }
    };
};

const baseArgs: S3UploadsProps = {
    uploads: [
        {
            id: "upload-1",
            profileName: "prod",
            s3Uri: reportCsv,
            directoryLink: makeDirectoryLink(reportCsv),
            size: 7_800_000,
            completionPercent: 72,
            status: "uploading"
        },
        {
            id: "upload-2",
            profileName: "prod",
            s3Uri: rawEvents,
            directoryLink: makeDirectoryLink(rawEvents),
            size: 5_400_000,
            completionPercent: 28,
            status: "uploading"
        }
    ],
    onClearCompleted: action("clear completed"),
    onCancelUpload: ({ uploadId }) => action("cancel upload")(uploadId),
    onDeleteUpload: ({ uploadId }) => action("delete upload")(uploadId),
    onRetryUpload: ({ uploadId }) => action("retry upload")(uploadId)
};

const renderPanel: Story["render"] = args => (
    <div style={{ width: 420 }}>
        <S3Uploads {...args} />
    </div>
);

export const Uploading: Story = {
    args: {
        ...baseArgs
    },
    render: renderPanel
};

export const Completed: Story = {
    args: {
        ...baseArgs,
        uploads: [
            {
                id: "upload-3",
                profileName: "prod",
                s3Uri: reportCsv,
                directoryLink: makeDirectoryLink(reportCsv),
                size: 7_800_000,
                completionPercent: 100,
                status: "completed"
            },
            {
                id: "upload-4",
                profileName: "research",
                s3Uri: modelBin,
                directoryLink: makeDirectoryLink(modelBin),
                size: 12_400_000,
                completionPercent: 100,
                status: "completed"
            }
        ]
    },
    render: renderPanel
};

export const Mixed: Story = {
    args: {
        ...baseArgs,
        uploads: [
            {
                id: "upload-5",
                profileName: "prod",
                s3Uri: reportCsv,
                directoryLink: makeDirectoryLink(reportCsv),
                size: 7_800_000,
                completionPercent: 100,
                status: "completed"
            },
            {
                id: "upload-6",
                profileName: "prod",
                s3Uri: rawEvents,
                directoryLink: makeDirectoryLink(rawEvents),
                size: 5_400_000,
                completionPercent: 38,
                status: "uploading"
            },
            {
                id: "upload-7",
                profileName: "research",
                s3Uri: modelBin,
                directoryLink: makeDirectoryLink(modelBin),
                size: 12_400_000,
                completionPercent: 100,
                status: "error",
                message: "Network error"
            },
            {
                id: "upload-8",
                profileName: "research",
                s3Uri: modelBin,
                directoryLink: makeDirectoryLink(modelBin),
                size: 12_400_000,
                completionPercent: 46,
                status: "cancelled",
                message: "Cancelled by user"
            }
        ]
    },
    render: renderPanel
};

export const Empty: Story = {
    args: {
        ...baseArgs,
        uploads: []
    },
    render: renderPanel
};
