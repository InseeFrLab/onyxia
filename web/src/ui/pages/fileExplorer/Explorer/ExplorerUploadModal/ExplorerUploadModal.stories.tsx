import type { Meta, StoryObj } from "@storybook/react";
import { ExplorerUploadModal } from "./ExplorerUploadModal";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MyFiles/Explorer/ExplorerUploadModal/ExplorerUploadModal",
    component: ExplorerUploadModal
} satisfies Meta<typeof ExplorerUploadModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isOpen: true,
        onClose: action("Modal closed"),
        filesBeingUploaded: [
            {
                directoryPath: "/home/user/documents",
                basename: "file1.txt",
                size: 123456,
                uploadPercent: 50
            },
            {
                directoryPath: "/home/user/pictures",
                basename: "image.png",
                size: 234567,
                uploadPercent: 75
            }
        ],
        onFileSelected: action("File selected")
    }
};
