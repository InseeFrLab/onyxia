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
    onDownload: action("download"),
    onDelete: action("delete"),
    onCopyS3Uri: action("copyS3Uri"),
    onBookmark: action("bookmark"),
    onShare: action("share"),
    onMakePublic: action("makePublic"),
    onMakePrivate: undefined
};

export const SingleObject: Story = {
    args: {
        ...baseArgs
    }
};

export const SinglePrefix: Story = {
    args: {
        ...baseArgs,
        onDownload: undefined,
        onShare: undefined,
        onMakePublic: undefined,
        onMakePrivate: action("makePrivate")
    }
};

export const MultipleSelection: Story = {
    args: {
        ...baseArgs,
        selectionCount: 2,
        onDownload: undefined,
        onCopyS3Uri: undefined,
        onBookmark: undefined,
        onShare: undefined,
        onMakePublic: undefined,
        onMakePrivate: undefined
    }
};
