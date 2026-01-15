import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { S3ExplorerToolbar, type S3ExplorerToolbarProps } from "./S3ExplorerToolbar";
import { getIconUrlByName } from "lazy-icons";

const meta = {
    title: "Shared/S3ExplorerToolbar",
    component: S3ExplorerToolbar
} satisfies Meta<typeof S3ExplorerToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

const leadingActions: S3ExplorerToolbarProps.Action[] = [
    {
        id: "back",
        icon: getIconUrlByName("ArrowBack"),
        label: "Back",
        tooltip: "Back",
        onClick: action("back")
    },
    {
        id: "refresh",
        icon: getIconUrlByName("Cached"),
        label: "Refresh",
        tooltip: "Refresh",
        onClick: action("refresh")
    }
];

const trailingActions: S3ExplorerToolbarProps.Action[] = [
    {
        id: "create-folder",
        icon: getIconUrlByName("Add"),
        label: "New folder",
        tooltip: "New folder",
        onClick: action("new folder")
    },
    {
        id: "upload",
        icon: getIconUrlByName("Add"),
        label: "Upload",
        tooltip: "Upload",
        onClick: action("upload")
    }
];

export const Default: Story = {
    args: {
        defaultPath: "s3://project-name/",
        pathPlaceholder: "s3://",
        leadingActions,
        trailingActions,
        pathAction: {
            icon: getIconUrlByName("StarBorder"),
            label: "Toggle bookmark",
            tooltip: "Toggle bookmark",
            onClick: action("toggle bookmark")
        },
        onPathSubmit: action("path submit")
    }
};
