import type { Meta, StoryObj } from "@storybook/react";
import { FileExplorerDisabledDialog } from "./FileExplorerDisabledDialog";

const meta = {
    title: "Pages/MyFiles/FileExplorerDisabledDialog",
    component: FileExplorerDisabledDialog
} satisfies Meta<typeof FileExplorerDisabledDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};
