import type { Meta, StoryObj } from "@storybook/react";
import { SecretsExplorerButtonBar } from "./SecretsExplorerButtonBar";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MySecrets/SecretsExplorer/SecretsExplorerButtonBar",
    component: SecretsExplorerButtonBar
} satisfies Meta<typeof SecretsExplorerButtonBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        selectedItemKind: "none", // No file or directory selected
        isSelectedItemInEditingState: false,
        isFileOpen: false,
        callback: action("Button clicked")
    }
};
