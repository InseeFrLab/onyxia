import { Meta, StoryObj } from "@storybook/react";
import { MyFilesCreateFolderDialog } from "./MyFilesCreateFolderDialog";

const meta: Meta<typeof MyFilesCreateFolderDialog> = {
    title: "Pages/MyFiles/ShareFile/MyFilesCreateFolderDialog",
    component: MyFilesCreateFolderDialog
};

export default meta;

type Story = StoryObj<typeof MyFilesCreateFolderDialog>;

export const Default: Story = {
    args: {}
};
