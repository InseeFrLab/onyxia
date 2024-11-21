import { Meta, StoryObj } from "@storybook/react";
import { ShareDialog } from "./ShareDialog";
import { action } from "@storybook/addon-actions";

const meta = {
    title: "Pages/MyFiles/ShareFile/ShareDialog",
    component: ShareDialog
} satisfies Meta<typeof ShareDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Public: Story = {
    args: {
        isOpen: true,
        onClose: action("onClose"),
        isRequestingUrl: false,
        onRequestUrl: (params: { expirationTime: number }) =>
            action(`onRequestUrl ${params.expirationTime}`),
        file: {
            kind: "file",
            basename: "photo.png",
            size: 2048000, // en bytes
            lastModified: new Date("2023-09-15"),
            policy: "public",
            isBeingDeleted: false,
            isPolicyChanging: false,

            isBeingCreated: true,
            uploadPercent: 75 // Example upload percentage
        },
        url: "https://minio.lab.sspcloud.fr/onyxia-datalab/public/photo.png",
        validityDurationSecondOptions: [3600, 7200, 10800]
    }
};

export const Private: Story = {
    args: {
        isOpen: true,
        onClose: action("onClose"),
        isRequestingUrl: false,
        onRequestUrl: (params: { expirationTime: number }) =>
            action(`onRequestUrl ${params.expirationTime}`),
        file: {
            kind: "file",
            basename: "photo.png",
            size: 2048000, // en bytes
            lastModified: new Date("2023-09-15"),
            policy: "public",
            isBeingDeleted: false,
            isPolicyChanging: false,

            isBeingCreated: true,
            uploadPercent: 75 // Example upload percentage
        },
        url: "https://minio.lab.sspcloud.fr/onyxia-datalab/public/photo.png",
        validityDurationSecondOptions: [3600, 7200, 10800]
    }
};
