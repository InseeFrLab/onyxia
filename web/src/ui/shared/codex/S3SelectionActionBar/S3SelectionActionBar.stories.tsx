import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import type { S3Uri } from "core/tools/S3Uri";
import {
    S3SelectionActionBar,
    type S3SelectionActionBarProps
} from "./S3SelectionActionBar";

const meta = {
    title: "Shared/S3SelectionActionBar",
    component: S3SelectionActionBar
} satisfies Meta<typeof S3SelectionActionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

const objectUri: S3Uri.NonTerminatedByDelimiter = {
    bucket: "demo-bucket",
    delimiter: "/",
    keySegments: ["reports", "2024", "summary.csv"],
    isDelimiterTerminated: false
};

const prefixUri: S3Uri.TerminatedByDelimiter = {
    bucket: "demo-bucket",
    delimiter: "/",
    keySegments: ["reports", "2024"],
    isDelimiterTerminated: true
};

const baseArgs: S3SelectionActionBarProps = {
    selectedS3Uris: [objectUri],
    onClear: action("clear"),
    onDownload: action("download"),
    onDelete: action("delete"),
    onCopyS3Uri: action("copyS3Uri"),
    onShare: action("share"),
    onRename: action("rename")
};

export const SingleObject: Story = {
    args: {
        ...baseArgs
    }
};

export const SinglePrefix: Story = {
    args: {
        ...baseArgs,
        selectedS3Uris: [prefixUri]
    }
};

export const MultipleSelection: Story = {
    args: {
        ...baseArgs,
        selectedS3Uris: [prefixUri, objectUri]
    }
};
