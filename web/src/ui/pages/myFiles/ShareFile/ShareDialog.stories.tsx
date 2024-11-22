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
        onRequestUrl: action("onRequestUrl"),
        isOpen: true,
        onClose: action("onClose"),
        isPublic: true,
        file: {
            kind: "file",
            policy: "public",
            basename: "photo.png",
            size: 2048000, // en bytes
            lastModified: new Date("2023-09-15"),
            isBeingDeleted: false,
            isPolicyChanging: false,
            isBeingCreated: false
        },
        url: "https://minio.lab.sspcloud.fr/onyxia-datalab/public/photo.png"
    }
};

export const Private = {
    args: {
        onRequestUrl: action("onRequestUrl"),
        isOpen: true,
        isPublic: false,
        onClose: action("onClose"),
        file: {
            policy: "private",
            kind: "file",
            basename: "photo.png",
            size: 2048000, // in bytes
            lastModified: new Date("2023-09-15"),
            isBeingDeleted: false,
            isPolicyChanging: false,
            isBeingCreated: false
        },
        url: undefined,
        isRequestingUrl: false,
        validityDurationSecondOptions: [3600, 7200, 10800],
        validityDurationSecond: 3600
    },
    render: () => {
        const [url, setUrl] = useState<string | undefined>(undefined);
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
                isOpen={true}
                isPublic={false}
                onClose={() => {
                    action("onClose")();
                }}
                file={{
                    policy: "private",
                    kind: "file",
                    basename: "photo.png",
                    size: 2048000, // in bytes
                    lastModified: new Date("2023-09-15"),
                    isBeingDeleted: false,
                    isPolicyChanging: false,
                    isBeingCreated: false
                }}
                url={url}
                isRequestingUrl={isRequestingUrl}
                onRequestUrl={handleRequestUrl}
                validityDurationSecondOptions={[3600, 7200, 10800]}
                validityDurationSecond={3600}
            />
        );
    }
} satisfies Story;
