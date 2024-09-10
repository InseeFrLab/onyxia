import type { Meta, StoryObj } from "@storybook/react";
import { ExplorerIcon } from "./ExplorerIcon";

const meta = {
    title: "Pages/MySecrets/SecretsExplorer/ExplorerIcon",
    component: ExplorerIcon
} satisfies Meta<typeof ExplorerIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SecretIcon: Story = {
    args: {
        iconId: "secret",
        hasShadow: true
    }
};

export const DirectoryIcon: Story = {
    args: {
        iconId: "directory",
        hasShadow: false
    }
};
