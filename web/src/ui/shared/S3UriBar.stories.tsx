import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useEffect, useMemo, useState } from "react";
import { parseS3Uri, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import { S3UriBar, type S3UriBarProps } from "./S3UriBar";

const meta = {
    title: "Shared/S3UriBar",
    component: S3UriBar
} satisfies Meta<typeof S3UriBar>;

export default meta;

type Story = StoryObj<typeof meta>;

const delimiter = "/";

function parsePrefixOrThrow(s3Uri: string): S3Uri.Prefix {
    return parsePrefixOrThrowWithDelimiter({
        s3Uri,
        delimiter
    });
}

function parsePrefixOrThrowWithDelimiter(params: {
    s3Uri: string;
    delimiter: string;
}): S3Uri.Prefix {
    const { s3Uri, delimiter } = params;

    return parseS3Uri({
        value: s3Uri,
        delimiter,
        isPrefix: true
    });
}

function StatefulS3UriBar(args: S3UriBarProps) {
    const [s3UriPrefix, setS3UriPrefix] = useState(args.s3UriPrefix);
    const [isEditing, setIsEditing] = useState(args.isEditing);

    useEffect(() => {
        setS3UriPrefix(args.s3UriPrefix);
    }, [args.s3UriPrefix]);

    useEffect(() => {
        setIsEditing(args.isEditing);
    }, [args.isEditing]);

    return (
        <S3UriBar
            {...args}
            s3UriPrefix={s3UriPrefix}
            isEditing={isEditing}
            onS3UriPrefixChange={params => {
                args.onS3UriPrefixChange(params);
                setS3UriPrefix(params.s3UriPrefix);
            }}
            onIsEditingChange={params => {
                args.onIsEditingChange(params);
                setIsEditing(params.isEditing);
            }}
        />
    );
}

const baseArgs: S3UriBarProps = {
    s3UriPrefix: parsePrefixOrThrow(
        "s3://analytics-data/exports/2024/quarter-1/report.csv"
    ),
    isEditing: false,
    onS3UriPrefixChange: action("s3UriPrefixChange"),
    onIsEditingChange: action("isEditingChange"),
    hints: [
        { type: "key-segment", name: "quarter-2" },
        { type: "key-segment", name: "quarter-3" },
        { type: "object", name: "report.parquet" },
        { type: "shortcut", name: "exports/2024/" }
    ],
    isBookmarked: false,
    onToggleBookmark: action("toggleBookmark")
};

export const NavigationMode: Story = {
    args: {
        ...baseArgs
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const EditingModeWithHints: Story = {
    args: {
        ...baseArgs,
        isEditing: true,
        s3UriPrefix: parsePrefixOrThrow("s3://analytics-data/exports/2024/")
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const LongPathCollapsed: Story = {
    args: {
        ...baseArgs,
        s3UriPrefix: parsePrefixOrThrow(
            "s3://very-long-bucket-name/one/two/three/four/five/six/seven/eight/nine/ten/report.csv"
        )
    },
    render: args => (
        <div style={{ maxWidth: 420 }}>
            <StatefulS3UriBar {...args} />
        </div>
    )
};

export const BookmarkedReadonlyIndicator: Story = {
    args: {
        ...baseArgs,
        isBookmarked: true,
        onToggleBookmark: undefined
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const RootPrefix: Story = {
    args: {
        ...baseArgs,
        s3UriPrefix: parsePrefixOrThrow("s3://analytics-data/")
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const HashDelimiter: Story = {
    args: {
        ...baseArgs,
        s3UriPrefix: parsePrefixOrThrowWithDelimiter({
            s3Uri: "s3://mybucket/foo#bar#file.txt",
            delimiter: "#"
        }),
        hints: [
            { type: "key-segment", name: "baz" },
            { type: "object", name: "other.txt" },
            { type: "shortcut", name: "foo#bar#" }
        ]
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const EditingModeWithShortcuts: Story = {
    args: {
        ...baseArgs,
        isEditing: true,
        s3UriPrefix: parsePrefixOrThrow("s3://analytics-data/exports/"),
        hints: [
            { type: "shortcut", name: "2024/quarter-1/" },
            { type: "shortcut", name: "raw/events/" },
            { type: "key-segment", name: "dashboards" },
            { type: "object", name: "README.md" }
        ]
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const EditingModeWithManyHints: Story = {
    args: {
        ...baseArgs,
        isEditing: true,
        s3UriPrefix: parsePrefixOrThrow("s3://analytics-data/exports/"),
        hints: [
            { type: "shortcut", name: "2024/" },
            { type: "shortcut", name: "2024/quarter-1/" },
            { type: "shortcut", name: "raw/events/" },
            { type: "key-segment", name: "2021" },
            { type: "key-segment", name: "2022" },
            { type: "key-segment", name: "2023" },
            { type: "key-segment", name: "2024" },
            { type: "key-segment", name: "2025" },
            { type: "key-segment", name: "dashboards" },
            { type: "key-segment", name: "reports" },
            { type: "object", name: "README.md" },
            { type: "object", name: "manifest.json" },
            { type: "object", name: "report-quarterly.parquet" },
            { type: "object", name: "report-yearly.parquet" }
        ]
    },
    render: args => <StatefulS3UriBar {...args} />
};

const mockS3Tree = {
    "analytics-data": {
        keySegments: ["exports", "dashboards", "raw", "sandbox"],
        objects: ["README.md", "latest.parquet", "manifest.json"]
    },
    "research-data": {
        keySegments: ["experiments", "snapshots", "models"],
        objects: ["index.csv", "summary.txt"]
    },
    "shared-datasets": {
        keySegments: ["open", "curated", "incoming"],
        objects: ["dataset.json", "schema.yaml"]
    }
} as const;

function ControlledS3UriBarStory() {
    const [s3UriPrefix, setS3UriPrefix] = useState<S3Uri.Prefix>(
        parsePrefixOrThrow("s3://analytics-data/exports/")
    );
    const [isEditing, setIsEditing] = useState(false);
    const [bookmarkedS3Uris, setBookmarkedS3Uris] = useState<string[]>([]);

    const currentS3Uri = useMemo(() => stringifyS3Uri(s3UriPrefix), [s3UriPrefix]);

    const hints = useMemo<S3UriBarProps["hints"]>(() => {
        const bucketData = mockS3Tree[s3UriPrefix.bucket as keyof typeof mockS3Tree];

        if (!bucketData) {
            return [];
        }

        return [
            {
                type: "shortcut" as const,
                name: `${bucketData.keySegments[0]}${s3UriPrefix.delimiter}`
            },
            ...bucketData.keySegments.map(name => ({
                type: "key-segment" as const,
                name
            })),
            ...bucketData.objects.map(name => ({
                type: "object" as const,
                name
            }))
        ];
    }, [s3UriPrefix.bucket]);

    const isBookmarked = bookmarkedS3Uris.includes(currentS3Uri);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <S3UriBar
                s3UriPrefix={s3UriPrefix}
                isEditing={isEditing}
                hints={hints}
                isBookmarked={isBookmarked}
                onS3UriPrefixChange={({ s3UriPrefix }) => {
                    setS3UriPrefix(s3UriPrefix);
                    action("s3UriPrefixChange")(stringifyS3Uri(s3UriPrefix));
                }}
                onIsEditingChange={({ isEditing }) => {
                    setIsEditing(isEditing);
                    action("isEditingChange")(isEditing);
                }}
                onToggleBookmark={() => {
                    setBookmarkedS3Uris(current =>
                        current.includes(currentS3Uri)
                            ? current.filter(s3Uri => s3Uri !== currentS3Uri)
                            : [...current, currentS3Uri]
                    );
                    action("toggleBookmark")(currentS3Uri);
                }}
            />

            <div
                style={{
                    fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: 12,
                    color: "#64748b",
                    border: "1px dashed #cbd5e1",
                    borderRadius: 8,
                    padding: 8
                }}
            >
                <div>Current URI: {currentS3Uri}</div>
                <div>Mode: {isEditing ? "editing" : "navigation"}</div>
                <div>Hints count: {hints.length}</div>
                <div>Bookmarked URIs: {bookmarkedS3Uris.length}</div>
            </div>
        </div>
    );
}

export const ControlledShell: Story = {
    args: {
        ...baseArgs
    },
    render: () => <ControlledS3UriBarStory />
};
