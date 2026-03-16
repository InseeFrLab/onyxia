import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { parseS3Uri, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import { S3BookmarksEntryPointList, type S3BookmarksEntryPointListProps } from ".";

const meta = {
    title: "Shared/S3BookmarksEntryPointList",
    component: S3BookmarksEntryPointList
} satisfies Meta<typeof S3BookmarksEntryPointList>;

export default meta;

type Story = StoryObj<typeof meta>;

function parsePrefixOrThrow(s3Uri: string): S3Uri.Prefix {
    return parseS3Uri({
        value: s3Uri,
        delimiter: "/",
        isPrefix: true
    });
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

const onRename: S3BookmarksEntryPointListProps["onRename"] = ({ s3Uri }) => {
    action("rename bookmark")(stringifyS3Uri(s3Uri));
};

export const Default: Story = {
    args: {
        items: baseItems,
        activeItemS3Uri: baseItems[0].s3Uri,
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
