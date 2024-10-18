import type { Meta, StoryObj } from "@storybook/react";
import { ExplorerItem } from "./ExplorerItem";
import { action } from "@storybook/addon-actions";
import { css } from "ui/theme/emotionCache";

const meta = {
    title: "Pages/MyFiles/Explorer/ExplorerItems/ExplorerItem",
    component: ExplorerItem
} satisfies Meta<typeof ExplorerItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FileSelected: Story = {
    args: {
        kind: "file",
        basename: "example-file.txt",
        size: 100000000,
        policy: "private",
        className: css({ "width": "160px", "height": "160px" }),
        isSelected: true,
        onClick: action("onClick"),
        onDoubleClick: action("onDoubleClick")
    }
};

export const DirectoryUnselected: Story = {
    args: {
        kind: "directory",
        basename: "example-directory",
        size: undefined,
        "policy": "public",
        className: css({ "width": "160px", "height": "160px" }),
        isSelected: false,
        onClick: action("onClick"),
        onDoubleClick: action("onDoubleClick")
    }
};
