import { Meta, StoryObj } from "@storybook/react";
import { MyFilesShareDialog } from "./MyFilesShareDialog";

const meta = {
    title: "Pages/MyFiles/NewComponents/MyFilesShareDialog",
    component: MyFilesShareDialog
} satisfies Meta<typeof MyFilesShareDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isPublic: false,
        kind: "directory"
    }
};
