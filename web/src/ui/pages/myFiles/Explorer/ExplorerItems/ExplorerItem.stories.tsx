import type { Meta, StoryObj } from "@storybook/react";
import { ExplorerItem } from "./ExplorerItem";
import { action } from "@storybook/addon-actions";
import { css } from "ui/theme";

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
        className: css({ "width": "160px", "height": "160px" }),
        isSelected: true,
        onMouseEvent: action("Mouse event")
    }
};

export const DirectoryUnselected: Story = {
    args: {
        kind: "directory",
        basename: "example-directory",
        size: 12345678901234,
        className: css({ "width": "160px", "height": "160px" }),
        isSelected: false,
        onMouseEvent: action("Mouse event")
    }
};
