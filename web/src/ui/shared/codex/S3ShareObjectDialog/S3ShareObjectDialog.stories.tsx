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

const objectBasename = "siren.parquet";
const publicUrl = "https://s3.example.com/analytics-data/exports/2026/siren.parquet";

const basePrivateArgs: S3ShareObjectDialogProps.Private = {
    objectBasename,
    isPublic: false,
    httpUrl: getSignedUrl({ validityDuration: "one day" }),
    onDone: action("done"),
    validityDuration: "one day",
    changeValidityDuration: action("changeValidityDuration")
};

function renderInModalBody(args: S3ShareObjectDialogProps) {
    return (
        <div style={{ maxWidth: 680, padding: 24 }}>
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
        objectBasename,
        isPublic: true,
        httpUrl: publicUrl,
        onDone: action("done")
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
        objectBasename,
        isPublic: true,
        httpUrl: undefined,
        onDone: action("done")
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
            onDone={args.onDone}
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
        "https://s3.example.com/analytics-data/exports/2026/siren.parquet",
        "?X-Amz-Algorithm=AWS4-HMAC-SHA256",
        "&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20260503%2Feu-west-1%2Fs3%2Faws4_request",
        "&X-Amz-Date=20260503T091100Z",
        `&X-Amz-Expires=${getValidityDurationSeconds(validityDuration)}`,
        "&X-Amz-SignedHeaders=host",
        "&X-Amz-Signature=1b2f9d5c8a1ef63c4e5ad7b9807b39e8b5f73a88d2b55aa0e6f0b4f8363f9f0c"
    ].join("");
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
