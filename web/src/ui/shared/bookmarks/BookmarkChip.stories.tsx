import type { Meta, StoryObj } from "@storybook/react";
import { BookmarkChip } from "./BookmarkChip";

const meta = {
    title: "Bookmarks/BookmarkChip",
    component: BookmarkChip
} satisfies Meta<typeof BookmarkChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        label: "Analytics exports",
        path: "s3://analytics-data/exports/",
        onNavigate: () => undefined,
        onUnpin: () => undefined
    }
};

export const Active: Story = {
    args: {
        label: "Pinned bucket",
        path: "s3://analytics-data",
        active: true,
        onNavigate: () => undefined,
        onUnpin: () => undefined
    }
};

export const LongLabel: Story = {
    args: {
        label: "Very long bookmark label for nested datasets",
        path: "s3://analytics-data/exports/2024/",
        onNavigate: () => undefined,
        onUnpin: () => undefined
    }
};

export const WithOptionalUnpin: Story = {
    args: {
        label: "To unpin",
        path: "s3://example-bucket",
        onNavigate: () => undefined,
        onUnpin: () => undefined
    }
};
