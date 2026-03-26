import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { parseS3Uri, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import { S3BookmarksBar, type S3BookmarksBarProps } from "./S3BookmarksBar";
import { assert } from "tsafe";
import { userEvent, within } from "@storybook/test";

const meta = {
    title: "Shared/S3BookmarksBar",
    component: S3BookmarksBar
} satisfies Meta<typeof S3BookmarksBar>;

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

const baseItems: S3BookmarksBarProps["items"] = [
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
    }
];

const overflowItems: S3BookmarksBarProps["items"] = [
    ...baseItems,
    {
        displayName: "Deeply nested prefix",
        s3Uri: parsePrefixOrThrow(
            "s3://analytics-data/exports/2023/region=eu-west-1/source=ingestion/job=etl/"
        ),
        isReadonly: false
    },
    {
        displayName: "Raw events",
        s3Uri: parsePrefixOrThrow("s3://analytics-data/raw/events/"),
        isReadonly: false
    },
    {
        displayName: "Machine learning",
        s3Uri: parsePrefixOrThrow("s3://research-data/experiments/models/"),
        isReadonly: true
    },
    {
        displayName: undefined,
        s3Uri: parsePrefixOrThrow(
            "s3://very-long-bucket-name/one/two/three/four/five/six/seven/"
        ),
        isReadonly: false
    }
];

const getItemLink: S3BookmarksBarProps["getItemLink"] = ({ s3Uri }) => {
    const s3UriStr = stringifyS3Uri(s3Uri);

    return {
        href: `/s3?path=${encodeURIComponent(s3UriStr)}`,
        onClick: event => {
            event.preventDefault();
            action("navigate")(s3UriStr);
        }
    };
};

const onDelete: S3BookmarksBarProps["onDelete"] = ({ s3Uri }) => {
    action("delete bookmark")(stringifyS3Uri(s3Uri));
};

const onRename: S3BookmarksBarProps["onRename"] = ({ s3Uri }) => {
    action("rename bookmark")(stringifyS3Uri(s3Uri));
};

const renderNarrow: Story["render"] = args => (
    <div style={{ maxWidth: 360 }}>
        <S3BookmarksBar {...args} />
    </div>
);

const renderFullWidth: Story["render"] = args => (
    <div style={{ width: "100vw", maxWidth: "100%", padding: "0 24px" }}>
        <S3BookmarksBar {...args} />
    </div>
);

const manyItems: S3BookmarksBarProps["items"] = Array.from(
    { length: 14 },
    (_, index) => ({
        displayName: `Bookmark ${index + 1}`,
        s3Uri: parsePrefixOrThrow(`s3://analytics-data/exports/${index + 1}/`),
        isReadonly: false
    })
);

export const Default: Story = {
    args: {
        items: baseItems,
        activeItemS3Uri: undefined,
        getItemLink,
        onDelete,
        onRename
    }
};

export const Overflow: Story = {
    args: {
        items: overflowItems,
        activeItemS3Uri: undefined,
        getItemLink,
        onDelete,
        onRename
    },
    render: renderNarrow
};

export const OverflowFullWidth: Story = {
    args: {
        items: manyItems,
        activeItemS3Uri: undefined,
        getItemLink,
        onDelete,
        onRename
    },
    render: renderFullWidth
};

export const PanelOpen: Story = {
    args: {
        items: overflowItems,
        activeItemS3Uri: undefined,
        getItemLink,
        onDelete,
        onRename
    },
    render: renderNarrow,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(
            canvas.getByRole("button", { name: /show more bookmarks/i })
        );
    }
};

export const PanelHoverExpanded: Story = {
    args: {
        items: overflowItems,
        activeItemS3Uri: undefined,
        getItemLink,
        onDelete,
        onRename
    },
    render: renderNarrow,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(
            canvas.getByRole("button", { name: /show more bookmarks/i })
        );
        const body = within(canvasElement.ownerDocument.body);
        await userEvent.hover(body.getByText("Deeply nested prefix"));
    }
};

export const ReadonlyInPanel: Story = {
    args: {
        items: overflowItems.map(item => ({
            ...item,
            isReadonly: true
        })),
        activeItemS3Uri: undefined,
        getItemLink,
        onDelete,
        onRename
    },
    render: renderNarrow,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(
            canvas.getByRole("button", { name: /show more bookmarks/i })
        );
        const body = within(canvasElement.ownerDocument.body);
        await userEvent.hover(body.getByText("Deeply nested prefix"));
    }
};
