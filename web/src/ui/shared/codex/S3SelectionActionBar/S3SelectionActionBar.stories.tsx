import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
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

const baseArgs: S3SelectionActionBarProps = {
    selectionCount: 1,
    onClear: action("clear"),
    download: {
        callback: action("download")
    },
    delete: {
        callback: action("delete")
    },
    copyS3Uri: {
        callback: action("copyS3Uri"),
        s3UriStr: "s3://demo-bucket/path/to/object.csv"
    },
    bookmark: {
        callback: action("bookmark"),
        isBookmarked: false
    },
    share: {
        callback: action("share")
    },
    accessPolicy: undefined
};

export const SingleObject: Story = {
    args: {
        ...baseArgs
    }
};

export const SinglePrefix: Story = {
    args: {
        ...baseArgs,
        download: undefined,
        share: undefined,
        accessPolicy: {
            callback: action("makePublic"),
            isPublic: false
        }
    }
};

export const PublicBookmarkedPrefix: Story = {
    args: {
        ...baseArgs,
        download: undefined,
        bookmark: {
            callback: action("bookmark"),
            isBookmarked: true
        },
        share: undefined,
        accessPolicy: {
            callback: action("makePrivate"),
            isPublic: true
        }
    }
};

export const MultipleSelection: Story = {
    args: {
        ...baseArgs,
        selectionCount: 2,
        download: undefined,
        copyS3Uri: undefined,
        bookmark: undefined,
        share: undefined,
        accessPolicy: undefined
    }
};
