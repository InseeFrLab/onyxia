import { ShareDialog } from "./ShareDialog";
import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
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
            isBeingCreated: false
        },
        url: "https://minio.lab.sspcloud.fr/onyxia-datalab/public/photo.png",
        validityDurationSecondOptions: [3600, 7200, 10800]
    }
};

export const Private: Story = {
    render: args => {
        const [url, setUrl] = useState<string | undefined>(args.url);
        const [isRequestingUrl, setIsRequestingUrl] = useState(false);

        const handleRequestUrl = (params: { expirationTime: number }) => {
            action(`onRequestUrl ${params.expirationTime}`)();
            setIsRequestingUrl(true); // Simulate loading

            setTimeout(() => {
                // Generate a dynamic URL after a 2-second delay
                const generatedUrl = `https://example.com/file/photo.png?expires=${params.expirationTime}`;
                setUrl(generatedUrl);
                setIsRequestingUrl(false); // Stop loading
            }, 2000);
        };

        return (
            <ShareDialog
                {...args}
                url={url}
                isRequestingUrl={isRequestingUrl}
                onRequestUrl={handleRequestUrl}
            />
        );
    },
    args: {
        isOpen: true,
        onClose: action("onClose"),
        isRequestingUrl: false,
        file: {
            kind: "file",
            basename: "photo.png",
            size: 2048000, // in bytes
            lastModified: new Date("2023-09-15"),
            policy: "private",
            isBeingDeleted: false,
            isPolicyChanging: false,
            isBeingCreated: false
        },
        url: undefined,
        validityDurationSecondOptions: [3600, 7200, 10800],
        onRequestUrl: (params: { expirationTime: number }) => {
            action(
                `onRequestUrl triggered with expirationTime: ${params.expirationTime}`
            )();
        }
    }
};
