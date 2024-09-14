import type { Meta, StoryObj } from "@storybook/react";
import { ExplorerUploadModalDropArea } from "./ExplorerUploadModalDropArea";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MyFiles/Explorer/ExplorerUploadModal/ExplorerUploadModalDropArea",
    component: ExplorerUploadModalDropArea
} satisfies Meta<typeof ExplorerUploadModalDropArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onFileSelected: action("File selected")
    }
};
