import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useEffect, useState } from "react";
import {
    S3ShareObjectDialog,
    type S3ShareObjectDialogProps
} from "./S3ShareObjectDialog";

const meta = {
    title: "Shared/S3ShareObjectDialog",
    component: S3ShareObjectDialog
} satisfies Meta<typeof S3ShareObjectDialog>;

export default meta;

type Story = StoryObj<typeof meta>;
type ValidityDuration = S3ShareObjectDialogProps.ValidityDuration;

const publicObjectBasename = ".DS_Store";
const signedObjectBasename = "WhatsApp Image 2026-02-15 at 17.34.19.jpeg";
const publicUrl = "https://minio.lab.sspcloud.fr/garronej/good_fortnite_game/.DS_Store";
const signedUrlBase =
    "https://minio.lab.sspcloud.fr/garronej/WhatsApp%20Image%202026-02-15%20at%2017.34.19.jpeg";

const basePrivateArgs: S3ShareObjectDialogProps.Private = {
    objectBasename: signedObjectBasename,
    isPublic: false,
    httpUrl: getSignedUrl({ validityDuration: "one day" }),
    validityDuration: "one day",
    changeValidityDuration: action("changeValidityDuration")
};

function renderInModalBody(args: S3ShareObjectDialogProps) {
    return (
        <div style={{ maxWidth: 760, padding: 32, overflow: "hidden" }}>
            <S3ShareObjectDialog {...args} />
        </div>
    );
}

function StatefulPrivateShareDialog(
    props: Omit<
        S3ShareObjectDialogProps.Private,
        "httpUrl" | "validityDuration" | "changeValidityDuration"
    > & {
        initialValidityDuration: ValidityDuration;
    }
) {
    const { initialValidityDuration, ...rest } = props;

    const [validityDuration, setValidityDuration] = useState<ValidityDuration>(
        initialValidityDuration
    );
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!isGenerating) {
            return;
        }

        const timer = window.setTimeout(() => setIsGenerating(false), 700);

        return () => window.clearTimeout(timer);
    }, [isGenerating, validityDuration]);

    return renderInModalBody({
        ...rest,
        isPublic: false,
        validityDuration,
        httpUrl: isGenerating ? undefined : getSignedUrl({ validityDuration }),
        changeValidityDuration: params => {
            action("changeValidityDuration")(params);
            setValidityDuration(params.validityDuration);
            setIsGenerating(true);
        }
    });
}

export const PrivateSignedUrl: Story = {
    args: {
        ...basePrivateArgs
    },
    render: renderInModalBody
};

export const PublicObject: Story = {
    args: {
        objectBasename: publicObjectBasename,
        isPublic: true,
        httpUrl: publicUrl
    },
    render: renderInModalBody
};

export const GeneratingSignedUrl: Story = {
    args: {
        ...basePrivateArgs,
        httpUrl: undefined
    },
    render: renderInModalBody
};

export const GeneratingPublicUrl: Story = {
    args: {
        objectBasename: publicObjectBasename,
        isPublic: true,
        httpUrl: undefined
    },
    render: renderInModalBody
};

export const InteractiveValidity: Story = {
    args: {
        ...basePrivateArgs
    },
    render: args => (
        <StatefulPrivateShareDialog
            objectBasename={args.objectBasename}
            isPublic={false}
            initialValidityDuration={
                "validityDuration" in args ? args.validityDuration : "one day"
            }
        />
    )
};

export const LongObjectName: Story = {
    args: {
        ...basePrivateArgs,
        objectBasename:
            "national-statistical-register-siren-snapshot-2026-05-03-with-a-very-long-export-name.parquet"
    },
    render: renderInModalBody
};

function getSignedUrl(params: { validityDuration: ValidityDuration }): string {
    const { validityDuration } = params;

    return [
        signedUrlBase,
        "?X-Amz-Algorithm=AWS4-HMAC-SHA256",
        "&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD",
        "&X-Amz-Credential=X53J0VKTNO4PHEHSO3BG%2F20260604%2Fus-east-1%2Fs3%2Faws4_request",
        "&X-Amz-Date=20260604T085902Z",
        `&X-Amz-Expires=${getValidityDurationSeconds(validityDuration)}`,
        `&X-Amz-Security-Token=${getLongSecurityToken()}`,
        "&X-Amz-Signature=efebd3e43c23cc0d59d39d4554e860dd55bf09c23f815190cf94080fce515faf",
        "&X-Amz-SignedHeaders=host",
        "&x-amz-checksum-mode=ENABLED",
        "&x-id=GetObject"
    ].join("");
}

function getLongSecurityToken(): string {
    return [
        "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9",
        "eyJhY2Nlc3NLZXkiOiJYNTNKMFZLVE5PNFBIRUhTTzNCRyIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sImF1ZCI6WyJtaW5pby1kYXRhbm9kZSIsIm9ueXhpYSIsInBvbGFyaXMiLCJhY2NvdW50Il0sImVtYWlsIjoiamFuZS5kb2VAZXhhbXBsZS5vcmciLCJleHAiOjE3ODExNjY2MDksIm5hbWUiOiJKYW5lIERvZSIsInByZWZlcnJlZF91c2VybmFtZSI6ImphbmUiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGdyb3VwcyBlbWFpbCIsInR5cCI6IkJlYXJlciJ9",
        "QptTLB2BwHiYq10nwRlJ4qJpKRrPiTrZKM1kdYw8aEKQ3KKouAWddhlP45LW5reQwMMubHCI8cHwW7MNmblA"
    ].join(".");
}

function getValidityDurationSeconds(validityDuration: ValidityDuration): number {
    switch (validityDuration) {
        case "one hour":
            return 60 * 60;
        case "one day":
            return 60 * 60 * 24;
        case "one week":
            return 60 * 60 * 24 * 7;
    }
}
