import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useState } from "react";
import { parseS3Uri, type S3Uri } from "core/tools/S3Uri";
import { S3UriBar, type S3UriBarProps } from "../S3UriBar";
import { S3ContextActionButton } from "./S3ContextActionButton";
import { getIconUrlByName } from "lazy-icons";
import { Evt } from "evt";

const meta = {
    title: "Shared/S3ContextActionButton",
    component: S3ContextActionButton
} satisfies Meta<typeof S3ContextActionButton>;

export default meta;

type Story = StoryObj<typeof meta>;

const delimiter = "/";

function parsePrefixOrThrow(s3Uri: string): S3Uri {
    return parseS3Uri({
        value: s3Uri,
        delimiter
    });
}

function makeHint(params: {
    type: S3UriBarProps["hints"][number]["type"];
    text: string;
    s3Uri: string;
}): S3UriBarProps["hints"][number] {
    const { s3Uri, ...rest } = params;

    return {
        ...rest,
        s3Uri: parsePrefixOrThrow(s3Uri)
    };
}

function getParentPrefix(s3Uri: S3Uri): S3Uri.TerminatedByDelimiter {
    return {
        bucket: s3Uri.bucket,
        delimiter: s3Uri.delimiter,
        keySegments: s3Uri.keySegments.slice(0, -1),
        isDelimiterTerminated: true
    };
}

function getS3UriBarS3Uri(s3Uri: S3Uri): NonNullable<S3UriBarProps["s3Uri"]> {
    return {
        s3Uri,
        s3Uri_publicPrefix: undefined
    };
}

const baseArgs: S3UriBarProps = {
    s3Uri: getS3UriBarS3Uri(
        parsePrefixOrThrow("s3://analytics-data/exports/2024/quarter-1/")
    ),
    onS3UriChange: action("s3UriChange"),
    hints: [
        makeHint({
            type: "key-segment",
            text: "quarter-2",
            s3Uri: "s3://analytics-data/exports/2024/quarter-2/"
        }),
        makeHint({
            type: "key-segment",
            text: "quarter-3",
            s3Uri: "s3://analytics-data/exports/2024/quarter-3/"
        }),
        makeHint({
            type: "bookmark-user",
            text: "exports/2024/",
            s3Uri: "s3://analytics-data/exports/2024/"
        })
    ],
    areHintsLoading: false,
    isBookmarked: false,
    onToggleBookmark: action("toggleBookmark"),
    evtAction: Evt.create<{
        action: "display copy feedback";
        s3Uri: S3Uri;
    }>()
};

function ComposedHeader() {
    const [s3Uri, setS3Uri] = useState(baseArgs.s3Uri);

    const isAtBucketRoot = s3Uri === undefined || s3Uri.s3Uri.keySegments.length === 0;

    return (
        <div style={{ maxWidth: 960, padding: 16 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                }}
            >
                <S3ContextActionButton
                    icon={getIconUrlByName("ArrowBack")}
                    label="Go to parent prefix"
                    onClick={() => {
                        if (s3Uri === undefined || isAtBucketRoot) {
                            return;
                        }

                        const parentPrefix = getParentPrefix(s3Uri.s3Uri);

                        action("goToParentPrefix")(parentPrefix);
                        setS3Uri(getS3UriBarS3Uri(parentPrefix));
                    }}
                    disabled={isAtBucketRoot}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                    <S3UriBar
                        {...baseArgs}
                        s3Uri={s3Uri}
                        onS3UriChange={params => {
                            baseArgs.onS3UriChange(params);
                            setS3Uri(
                                params.s3Uri === undefined
                                    ? undefined
                                    : getS3UriBarS3Uri(params.s3Uri)
                            );
                        }}
                    />
                </div>

                <S3ContextActionButton
                    icon={getIconUrlByName("UploadFileOutlined")}
                    label="Upload files"
                    onClick={action("uploadFiles")}
                />

                <S3ContextActionButton
                    icon={getIconUrlByName("CreateNewFolderOutlined")}
                    label="Create prefix"
                    onClick={action("createPrefix")}
                />
            </div>
        </div>
    );
}

export const WithS3UriBar: Story = {
    args: {
        icon: getIconUrlByName("SubdirectoryArrowLeftOutlined"),
        label: "Context action",
        onClick: action("contextAction")
    },
    render: () => <ComposedHeader />
};
