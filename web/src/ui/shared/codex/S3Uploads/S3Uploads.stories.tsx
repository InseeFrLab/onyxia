import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import type { S3Uri } from "core/tools/S3Uri";
import { stringifyS3Uri } from "core/tools/S3Uri";
import type { Link } from "type-route";
import { S3Uploads, type S3UploadsProps } from "./S3Uploads";

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

const makeDirectoryLink = (params: {
    profileName: string;
    s3Uri: S3Uri.NonTerminatedByDelimiter;
}): Link => {
    const { profileName, s3Uri } = params;
    const directoryUri: S3Uri.TerminatedByDelimiter = {
        bucket: s3Uri.bucket,
        delimiter: s3Uri.delimiter,
        keySegments: s3Uri.keySegments.slice(0, -1),
        isDelimiterTerminated: true
    };

    const directoryStr = stringifyS3Uri(directoryUri);

    return {
        href: `/s3?profile=${encodeURIComponent(profileName)}&path=${encodeURIComponent(
            directoryStr
        )}`,
        onClick: event => {
            event.preventDefault();
            action("open directory")({ profileName, directoryStr });
        }
    };
};

const baseArgs: S3UploadsProps = {
    uploads: [
        {
            profileName: "prod",
            s3Uri: reportCsv,
            size: 7_800_000,
            completionPercent: 72,
            uploadStartTime: 1_712_250_000_000,
            stoppedStatus: undefined
        },
        {
            profileName: "prod",
            s3Uri: rawEvents,
            size: 5_400_000,
            completionPercent: 28,
            uploadStartTime: 1_712_250_030_000,
            stoppedStatus: undefined
        }
    ],
    onClose: action("close uploads"),
    onCancelUpload: params => action("cancel upload")(params),
    onRetryUpload: params => action("retry upload")(params),
    getDirectoryLink: makeDirectoryLink
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
                profileName: "prod",
                s3Uri: reportCsv,
                size: 7_800_000,
                completionPercent: 100,
                uploadStartTime: 1_712_250_000_000,
                stoppedStatus: undefined
            },
            {
                profileName: "research",
                s3Uri: modelBin,
                size: 12_400_000,
                completionPercent: 100,
                uploadStartTime: 1_712_250_060_000,
                stoppedStatus: undefined
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
                profileName: "prod",
                s3Uri: reportCsv,
                size: 7_800_000,
                completionPercent: 100,
                uploadStartTime: 1_712_250_000_000,
                stoppedStatus: undefined
            },
            {
                profileName: "prod",
                s3Uri: rawEvents,
                size: 5_400_000,
                completionPercent: 38,
                uploadStartTime: 1_712_250_030_000,
                stoppedStatus: undefined
            },
            {
                profileName: "research",
                s3Uri: modelBin,
                size: 12_400_000,
                completionPercent: 100,
                uploadStartTime: 1_712_250_060_000,
                stoppedStatus: {
                    case: "errored",
                    errorMessage: "Network error"
                }
            },
            {
                profileName: "research",
                s3Uri: modelBin,
                size: 12_400_000,
                completionPercent: 46,
                uploadStartTime: 1_712_250_090_000,
                stoppedStatus: {
                    case: "canceled"
                }
            }
        ]
    },
    render: renderPanel
};
