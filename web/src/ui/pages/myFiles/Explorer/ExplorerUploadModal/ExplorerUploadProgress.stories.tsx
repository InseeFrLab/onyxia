import type { Meta, StoryObj } from "@storybook/react";
import { ExplorerUploadProgress } from "./ExplorerUploadProgress";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MyFiles/Explorer/ExplorerUploadModal/ExplorerUploadProgress",
    component: ExplorerUploadProgress
} satisfies Meta<typeof ExplorerUploadProgress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const UploadInProgress: Story = {
    args: {
        basename: "example-file.txt",
        percentUploaded: 50,
        fileSize: 1024 * 1024 * 5, // 5 MB
        isFailed: false
    }
};

export const UploadFailed: Story = {
    args: {
        basename: "example-file.txt",
        percentUploaded: 75,
        fileSize: 1024 * 1024 * 5, // 5 MB
        isFailed: true,
        onClick: action("Upload failed action")
    }
};

export const UploadComplete: Story = {
    args: {
        basename: "example-file.txt",
        percentUploaded: 100,
        fileSize: 1024 * 1024 * 5, // 5 MB
        isFailed: false
    }
};
