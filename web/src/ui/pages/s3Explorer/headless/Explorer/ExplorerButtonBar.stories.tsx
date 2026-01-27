import type { Meta, StoryObj } from "@storybook/react";
import { ExplorerButtonBar } from "./ExplorerButtonBar";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MyFiles/Explorer/ExplorerButtonBar",
    component: ExplorerButtonBar
} satisfies Meta<typeof ExplorerButtonBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        selectedItemKind: "none",
        callback: action("Button clicked"),
        onViewModeChange: action("onViewModeChange"),
        viewMode: "list"
    }
};

export const FileSelected: Story = {
    args: {
        selectedItemKind: "file",
        callback: action("Button clicked"),
        onViewModeChange: action("onViewModeChange"),
        viewMode: "list"
    }
};

export const DirectorySelected: Story = {
    args: {
        selectedItemKind: "directory",
        callback: action("Button clicked"),
        onViewModeChange: action("onViewModeChange"),
        viewMode: "list"
    }
};
