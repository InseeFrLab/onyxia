import type { Meta, StoryObj } from "@storybook/react";
import { MyFilesDisabledDialog } from "./MyFilesDisabledDialog";

const meta = {
    title: "Pages/MyFiles/MyFilesDisabledDialog",
    component: MyFilesDisabledDialog
} satisfies Meta<typeof MyFilesDisabledDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};
