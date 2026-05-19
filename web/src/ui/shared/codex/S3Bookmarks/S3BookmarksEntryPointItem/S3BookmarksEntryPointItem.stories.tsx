import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { userEvent, within } from "@storybook/test";
import { parseS3Uri, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import { S3BookmarksEntryPointList, type S3BookmarksEntryPointListProps } from ".";
import { assert } from "tsafe";

const meta = {
    title: "Shared/S3BookmarksEntryPointList",
    component: S3BookmarksEntryPointList
} satisfies Meta<typeof S3BookmarksEntryPointList>;

export default meta;

type Story = StoryObj<typeof meta>;

function parsePrefixOrThrow(s3Uri: string): S3Uri.TerminatedByDelimiter {
    const obj = parseS3Uri({
        value: s3Uri,
        delimiter: "/"
    });

    assert(obj.isDelimiterTerminated);

    return obj;
}

const baseItems: S3BookmarksEntryPointListProps["items"] = [
    {
        displayName: "Analytics exports",
        s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/"),
        isReadonly: false
    },
    {
        displayName: "Shared datasets",
        s3Uri: parsePrefixOrThrow("s3://shared-datasets/curated/"),
        isReadonly: true
    },
    {
        displayName: undefined,
        s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/2024/quarter-1/"),
        isReadonly: false
    },
    {
        displayName: "Deeply nested prefix",
        s3Uri: parsePrefixOrThrow(
            "s3://analytics-data/exports/2023/region=eu-west-1/source=ingestion/job=etl/"
        ),
        isReadonly: false
    }
];

const getItemLink: S3BookmarksEntryPointListProps["getItemLink"] = ({ s3Uri }) => {
    const s3UriStr = stringifyS3Uri(s3Uri);

    return {
        href: `/s3?path=${encodeURIComponent(s3UriStr)}`,
        onClick: event => {
            event.preventDefault();
            action("navigate")(s3UriStr);
        }
    };
};

const onDelete: S3BookmarksEntryPointListProps["onDelete"] = ({ s3Uri }) => {
    action("delete bookmark")(stringifyS3Uri(s3Uri));
};

const onRename: S3BookmarksEntryPointListProps["onRename"] = ({
    s3Uri,
    currentDisplayName
}) => {
    action("rename bookmark")({
        s3Uri: stringifyS3Uri(s3Uri),
        currentDisplayName
    });
};

export const Default: Story = {
    name: "Home with bookmarks + buckets",
    args: {
        items: baseItems,
        activeItemS3Uri: baseItems[0].s3Uri,
        getItemLink,
        onDelete,
        onRename
    }
};

export const OnlyBookmarks: Story = {
    args: {
        items: baseItems.filter(item => !item.isReadonly),
        activeItemS3Uri: baseItems[2].s3Uri,
        getItemLink,
        onDelete,
        onRename
    }
};

export const OnlyBuckets: Story = {
    args: {
        items: baseItems.filter(item => item.isReadonly),
        activeItemS3Uri: undefined,
        getItemLink,
        onDelete,
        onRename
    }
};

export const EmptyBookmarksState: Story = {
    args: {
        items: [],
        activeItemS3Uri: undefined,
        getItemLink,
        onDelete,
        onRename
    }
};

export const CompactWidth: Story = {
    args: {
        items: baseItems,
        activeItemS3Uri: baseItems[2].s3Uri,
        getItemLink,
        onDelete,
        onRename
    },
    render: args => (
        <div style={{ maxWidth: 640 }}>
            <S3BookmarksEntryPointList {...args} />
        </div>
    )
};

export const HoverState: Story = {
    args: {
        items: baseItems,
        activeItemS3Uri: undefined,
        getItemLink,
        onDelete,
        onRename
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.hover(canvas.getAllByLabelText("Open bookmark")[0]);
    }
};

export const FocusState: Story = {
    args: {
        items: baseItems,
        activeItemS3Uri: undefined,
        getItemLink,
        onDelete,
        onRename
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.tab();
        await canvas.findAllByLabelText("Open bookmark");
    }
};
