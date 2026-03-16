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

function parsePrefixOrThrow(s3Uri: string): S3Uri {
    return parsePrefixOrThrowWithDelimiter({
        s3Uri,
        delimiter
    });
}

function parsePrefixOrThrowWithDelimiter(params: {
    s3Uri: string;
    delimiter: string;
}): S3Uri {
    const { s3Uri, delimiter } = params;

    return parseS3Uri({
        value: s3Uri,
        delimiter
    });
}

function StatefulS3UriBar(args: S3UriBarProps) {
    const [s3Uri, setS3Uri] = useState(args.s3Uri);

    useEffect(() => {
        setS3Uri(args.s3Uri);
    }, [args.s3Uri]);

    return (
        <S3UriBar
            {...args}
            s3Uri={s3Uri}
            onS3UriPrefixChange={params => {
                args.onS3UriPrefixChange(params);
                setS3Uri(params.s3Uri);
            }}
        />
    );
}

const baseArgs: S3UriBarProps = {
    s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/2024/quarter-1/report.csv"),
    onS3UriPrefixChange: action("s3UriPrefixChange"),
    hints: [
        { type: "key-segment", text: "quarter-2" },
        { type: "key-segment", text: "quarter-3" },
        { type: "object", text: "report.parquet" },
        { type: "bookmark", text: "exports/2024/" }
    ],
    areHintsLoading: false,
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
        s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/2024/")
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const LongPathCollapsed: Story = {
    args: {
        ...baseArgs,
        s3Uri: parsePrefixOrThrow(
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
        s3Uri: parsePrefixOrThrow("s3://analytics-data/")
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const HashDelimiter: Story = {
    args: {
        ...baseArgs,
        s3Uri: parsePrefixOrThrowWithDelimiter({
            s3Uri: "s3://mybucket/foo#bar#file.txt",
            delimiter: "#"
        }),
        hints: [
            { type: "key-segment", text: "baz" },
            { type: "object", text: "other.txt" },
            { type: "bookmark", text: "foo#bar#" }
        ]
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const EditingModeWithShortcuts: Story = {
    args: {
        ...baseArgs,
        s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/"),
        hints: [
            { type: "bookmark", text: "2024/quarter-1/" },
            { type: "bookmark", text: "raw/events/" },
            { type: "key-segment", text: "dashboards" },
            { type: "object", text: "README.md" }
        ]
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const EditingModeWithManyHints: Story = {
    args: {
        ...baseArgs,
        s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/"),
        hints: [
            { type: "bookmark", text: "2024/" },
            { type: "bookmark", text: "2024/quarter-1/" },
            { type: "bookmark", text: "raw/events/" },
            { type: "key-segment", text: "2021" },
            { type: "key-segment", text: "2022" },
            { type: "key-segment", text: "2023" },
            { type: "key-segment", text: "2024" },
            { type: "key-segment", text: "2025" },
            { type: "key-segment", text: "dashboards" },
            { type: "key-segment", text: "reports" },
            { type: "object", text: "README.md" },
            { type: "object", text: "manifest.json" },
            { type: "object", text: "report-quarterly.parquet" },
            { type: "object", text: "report-yearly.parquet" }
        ]
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const EditingModeWithVeryLongHints: Story = {
    args: {
        ...baseArgs,
        s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/"),
        hints: [
            {
                type: "bookmark",
                text: "raw/events/2025/region=eu-west-1/source=streaming-ingestion/job=very-long-job-name-with-version-v12/"
            },
            {
                type: "bookmark",
                text: "dashboards/internal/department=analytics/team=core-platform/topic=quarterly-business-review/"
            },
            {
                type: "key-segment",
                text: "department=analytics-team-with-an-extremely-descriptive-name"
            },
            {
                type: "key-segment",
                text: "source-system=customer-interaction-and-engagement-platform"
            },
            {
                type: "object",
                text: "report-quarterly-performance-and-financial-projections-for-fiscal-year-2025.parquet"
            },
            {
                type: "object",
                text: "dashboard_configuration_snapshot_with_extended_metadata_and_annotations.json"
            },
            {
                type: "object",
                text: "this-is-a-very-very-very-very-very-very-long-object-name.csv"
            }
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
    const [s3Uri, setS3Uri] = useState<S3Uri | undefined>(
        parsePrefixOrThrow("s3://analytics-data/exports/")
    );
    const [bookmarkedS3Uris, setBookmarkedS3Uris] = useState<string[]>([]);

    const currentS3Uri = useMemo(
        () => (s3Uri === undefined ? undefined : stringifyS3Uri(s3Uri)),
        [s3Uri]
    );

    const hints = useMemo<S3UriBarProps["hints"]>(() => {
        if (s3Uri === undefined) {
            return [];
        }

        const bucketData = mockS3Tree[s3Uri.bucket as keyof typeof mockS3Tree];

        if (!bucketData) {
            return [];
        }

        return [
            {
                type: "bookmark" as const,
                text: `${bucketData.keySegments[0]}${s3Uri.delimiter}`
            },
            ...bucketData.keySegments.map(text => ({
                type: "key-segment" as const,
                text
            })),
            ...bucketData.objects.map(text => ({
                type: "object" as const,
                text
            }))
        ];
    }, [s3Uri]);

    const isBookmarked =
        currentS3Uri !== undefined && bookmarkedS3Uris.includes(currentS3Uri);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <S3UriBar
                s3Uri={s3Uri}
                hints={hints}
                areHintsLoading={false}
                isBookmarked={currentS3Uri !== undefined && isBookmarked}
                onS3UriPrefixChange={({ s3Uri, isHintSelection }) => {
                    setS3Uri(s3Uri);
                    action("s3UriPrefixChange")({
                        s3Uri: s3Uri === undefined ? "undefined" : stringifyS3Uri(s3Uri),
                        isHintSelection
                    });
                }}
                onToggleBookmark={() => {
                    if (currentS3Uri === undefined) {
                        return;
                    }

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
                <div>Current URI: {currentS3Uri ?? "undefined"}</div>
                <div>Hints count: {hints.length}</div>
                <div>Bookmarked URIs: {bookmarkedS3Uris.length}</div>
            </div>
        </div>
    );
}

function UndefinedPrefixLockedEditingStory() {
    const [s3Uri, setS3Uri] = useState<S3Uri | undefined>(undefined);
    const [lastCommittedS3Uri, setLastCommittedS3Uri] = useState<string | undefined>(
        undefined
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <S3UriBar
                s3Uri={s3Uri}
                hints={[
                    { type: "bookmark", text: "s3://mybucket/" },
                    { type: "bookmark", text: "s3://donnee-insee/diffusion/" },
                    { type: "key-segment", text: "hidden-non-bookmark-hint" }
                ]}
                areHintsLoading={false}
                isBookmarked={false}
                onS3UriPrefixChange={({ s3Uri, isHintSelection }) => {
                    const nextS3Uri =
                        s3Uri === undefined ? undefined : stringifyS3Uri(s3Uri);
                    setS3Uri(s3Uri);
                    setLastCommittedS3Uri(nextS3Uri);
                    action("s3UriPrefixChange")({
                        s3Uri: nextS3Uri,
                        isHintSelection
                    });
                }}
                onToggleBookmark={undefined}
            />

            <button
                type="button"
                style={{ width: "fit-content" }}
                onClick={() => {
                    setS3Uri(undefined);
                    setLastCommittedS3Uri(undefined);
                    action("resetToUndefinedPrefix")();
                }}
            >
                Reset to Undefined Prefix
            </button>

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
                <div>
                    Current prefix:{" "}
                    {s3Uri === undefined ? "undefined" : stringifyS3Uri(s3Uri)}
                </div>
                <div>Last committed URI: {lastCommittedS3Uri ?? "none"}</div>
                <div>
                    Type a valid URI, then press Enter or blur to commit and leave
                    undefined mode.
                </div>
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

export const UndefinedPrefixLockedEditingWithBookmarkHints: Story = {
    args: {
        ...baseArgs,
        s3Uri: undefined,
        hints: [
            { type: "bookmark", text: "s3://mybucket/" },
            { type: "bookmark", text: "s3://donnee-insee/diffusion/" }
        ],
        onToggleBookmark: undefined
    },
    render: () => <UndefinedPrefixLockedEditingStory />
};
