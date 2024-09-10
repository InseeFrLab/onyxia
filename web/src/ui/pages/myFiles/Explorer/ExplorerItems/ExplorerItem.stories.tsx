import type { Meta, StoryObj } from "@storybook/react";
import { ExplorerItem } from "./ExplorerItem";
import { action } from "@storybook/addon-actions";

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
        isSelected: true,
        isCircularProgressShown: false,
        getIsValidBasename: ({ basename }) => basename.length > 0,
        onMouseEvent: action("Mouse event")
    }
};

export const DirectoryUnselected: Story = {
    args: {
        kind: "directory",
        basename: "example-folder",
        isSelected: false,
        isCircularProgressShown: false,
        getIsValidBasename: ({ basename }) => basename.length > 0,
        onMouseEvent: action("Mouse event")
    }
};

export const FileEditing: Story = {
    args: {
        kind: "file",
        basename: "new-file.txt",
        isSelected: true,
        isCircularProgressShown: false,
        getIsValidBasename: ({ basename }) => basename.length > 0,
        onMouseEvent: action("Mouse event")
    },
    play: async ({ canvasElement }) => {
        const input = canvasElement.querySelector("input") as HTMLInputElement;
        input && input.focus();
    }
};
