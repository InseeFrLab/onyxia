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
        shareView: {
            isPublic: true,
            file: {
                kind: "file",
                policy: "public",
                basename: "photo.png",
                size: 2048000, // in bytes
                lastModified: new Date("2023-09-15")
            },
            url: "https://minio.lab.sspcloud.fr/onyxia-datalab/public/photo.png"
        },
        onClose: action("onClose"),
        onRequestUrl: action("onRequestUrl"),
        onChangeShareSelectedValidityDuration: action(
            "onChangeShareSelectedValidityDuration"
        )
    }
};

export const Private: Story = {
    args: {
        shareView: {
            isPublic: false,
            file: {
                kind: "file",
                policy: "private",
                basename: "photo.png",
                size: 2048000,
                lastModified: new Date("2023-09-15")
            },
            url: undefined,
            validityDurationSecondOptions: [3600, 7200, 10800],
            validityDurationSecond: 3600,
            isSignedUrlBeingRequested: false
        },
        onClose: action("onClose"),
        onRequestUrl: action("onRequestUrl"),
        onChangeShareSelectedValidityDuration: action(
            "onChangeShareSelectedValidityDuration"
        )
    },
    render: () => {
        const [url, setUrl] = useState<string | undefined>(undefined);
        const [isRequestingUrl, setIsRequestingUrl] = useState(false);
        const [validityDurationSecond, setValidityDurationSecond] = useState(3600);

        const handleRequestUrl = () => {
            action("onRequestUrl")();
            setIsRequestingUrl(true);

            setTimeout(() => {
                const generatedUrl = `https://example.com/file/photo.png?expires=${validityDurationSecond}`;
                setUrl(generatedUrl);
                setIsRequestingUrl(false);
            }, 2000);
        };

        return (
            <ShareDialog
                shareView={{
                    isPublic: false,
                    file: {
                        kind: "file",
                        policy: "private",
                        basename: "photo.png",
                        size: 2048000,
                        lastModified: new Date("2023-09-15"),
                        canChangePolicy: true
                    },
                    url: url,
                    validityDurationSecondOptions: [3600, 7200, 10800],
                    validityDurationSecond: validityDurationSecond,
                    isSignedUrlBeingRequested: isRequestingUrl
                }}
                onClose={action("onClose")}
                onRequestUrl={handleRequestUrl}
                onChangeShareSelectedValidityDuration={({ validityDurationSecond }) => {
                    action("onChangeShareSelectedValidityDuration")({
                        validityDurationSecond
                    });
                    setValidityDurationSecond(validityDurationSecond);
                }}
            />
        );
    }
} satisfies Story;
