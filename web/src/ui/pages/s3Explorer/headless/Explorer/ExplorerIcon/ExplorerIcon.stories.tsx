import type { Meta, StoryObj } from "@storybook/react";
import { ExplorerIcon } from "./ExplorerIcon";

const meta = {
    title: "Pages/MyFiles/Explorer/ExplorerIcon",
    component: ExplorerIcon
} satisfies Meta<typeof ExplorerIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DataIconWithShadow: Story = {
    args: {
        iconId: "data",
        hasShadow: true
    }
};

export const DirectoryIconWithoutShadow: Story = {
    args: {
        iconId: "directory",
        hasShadow: false
    }
};

export const JsonIcon: Story = {
    args: {
        iconId: "json",
        hasShadow: false
    }
};
