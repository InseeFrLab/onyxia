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

function makeHint(params: {
    type: S3UriBarProps["hints"][number]["type"];
    text: string;
    s3Uri: string;
    delimiter?: string;
}): S3UriBarProps["hints"][number] {
    const { delimiter = "/", ...rest } = params;

    return {
        ...rest,
        s3Uri: parsePrefixOrThrowWithDelimiter({
            s3Uri: rest.s3Uri,
            delimiter
        })
    };
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
            type: "object",
            text: "report.parquet",
            s3Uri: "s3://analytics-data/exports/2024/quarter-1/report.parquet"
        }),
        makeHint({
            type: "bookmark",
            text: "exports/2024/",
            s3Uri: "s3://analytics-data/exports/2024/"
        })
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
            makeHint({
                type: "key-segment",
                text: "baz",
                s3Uri: "s3://mybucket/foo#bar#baz#",
                delimiter: "#"
            }),
            makeHint({
                type: "object",
                text: "other.txt",
                s3Uri: "s3://mybucket/foo#bar#other.txt",
                delimiter: "#"
            }),
            makeHint({
                type: "bookmark",
                text: "foo#bar#",
                s3Uri: "s3://mybucket/foo#bar#",
                delimiter: "#"
            })
        ]
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const EditingModeWithShortcuts: Story = {
    args: {
        ...baseArgs,
        s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/"),
        hints: [
            makeHint({
                type: "bookmark",
                text: "2024/quarter-1/",
                s3Uri: "s3://analytics-data/exports/2024/quarter-1/"
            }),
            makeHint({
                type: "bookmark",
                text: "raw/events/",
                s3Uri: "s3://analytics-data/raw/events/"
            }),
            makeHint({
                type: "key-segment",
                text: "dashboards",
                s3Uri: "s3://analytics-data/exports/dashboards/"
            }),
            makeHint({
                type: "object",
                text: "README.md",
                s3Uri: "s3://analytics-data/exports/README.md"
            })
        ]
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const EditingModeWithManyHints: Story = {
    args: {
        ...baseArgs,
        s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/"),
        hints: [
            makeHint({
                type: "bookmark",
                text: "2024/",
                s3Uri: "s3://analytics-data/exports/2024/"
            }),
            makeHint({
                type: "bookmark",
                text: "2024/quarter-1/",
                s3Uri: "s3://analytics-data/exports/2024/quarter-1/"
            }),
            makeHint({
                type: "bookmark",
                text: "raw/events/",
                s3Uri: "s3://analytics-data/raw/events/"
            }),
            makeHint({
                type: "key-segment",
                text: "2021",
                s3Uri: "s3://analytics-data/exports/2021/"
            }),
            makeHint({
                type: "key-segment",
                text: "2022",
                s3Uri: "s3://analytics-data/exports/2022/"
            }),
            makeHint({
                type: "key-segment",
                text: "2023",
                s3Uri: "s3://analytics-data/exports/2023/"
            }),
            makeHint({
                type: "key-segment",
                text: "2024",
                s3Uri: "s3://analytics-data/exports/2024/"
            }),
            makeHint({
                type: "key-segment",
                text: "2025",
                s3Uri: "s3://analytics-data/exports/2025/"
            }),
            makeHint({
                type: "key-segment",
                text: "dashboards",
                s3Uri: "s3://analytics-data/exports/dashboards/"
            }),
            makeHint({
                type: "key-segment",
                text: "reports",
                s3Uri: "s3://analytics-data/exports/reports/"
            }),
            makeHint({
                type: "object",
                text: "README.md",
                s3Uri: "s3://analytics-data/exports/README.md"
            }),
            makeHint({
                type: "object",
                text: "manifest.json",
                s3Uri: "s3://analytics-data/exports/manifest.json"
            }),
            makeHint({
                type: "object",
                text: "report-quarterly.parquet",
                s3Uri: "s3://analytics-data/exports/report-quarterly.parquet"
            }),
            makeHint({
                type: "object",
                text: "report-yearly.parquet",
                s3Uri: "s3://analytics-data/exports/report-yearly.parquet"
            })
        ]
    },
    render: args => <StatefulS3UriBar {...args} />
};

export const EditingModeWithVeryLongHints: Story = {
    args: {
        ...baseArgs,
        s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/"),
        hints: [
            makeHint({
                type: "bookmark",
                text: "raw/events/2025/region=eu-west-1/source=streaming-ingestion/job=very-long-job-name-with-version-v12/",
                s3Uri: "s3://analytics-data/raw/events/2025/region=eu-west-1/source=streaming-ingestion/job=very-long-job-name-with-version-v12/"
            }),
            makeHint({
                type: "bookmark",
                text: "dashboards/internal/department=analytics/team=core-platform/topic=quarterly-business-review/",
                s3Uri: "s3://analytics-data/dashboards/internal/department=analytics/team=core-platform/topic=quarterly-business-review/"
            }),
            makeHint({
                type: "key-segment",
                text: "department=analytics-team-with-an-extremely-descriptive-name",
                s3Uri: "s3://analytics-data/exports/department=analytics-team-with-an-extremely-descriptive-name/"
            }),
            makeHint({
                type: "key-segment",
                text: "source-system=customer-interaction-and-engagement-platform",
                s3Uri: "s3://analytics-data/exports/source-system=customer-interaction-and-engagement-platform/"
            }),
            makeHint({
                type: "object",
                text: "report-quarterly-performance-and-financial-projections-for-fiscal-year-2025.parquet",
                s3Uri: "s3://analytics-data/exports/report-quarterly-performance-and-financial-projections-for-fiscal-year-2025.parquet"
            }),
            makeHint({
                type: "object",
                text: "dashboard_configuration_snapshot_with_extended_metadata_and_annotations.json",
                s3Uri: "s3://analytics-data/exports/dashboard_configuration_snapshot_with_extended_metadata_and_annotations.json"
            }),
            makeHint({
                type: "object",
                text: "this-is-a-very-very-very-very-very-very-long-object-name.csv",
                s3Uri: "s3://analytics-data/exports/this-is-a-very-very-very-very-very-very-long-object-name.csv"
            })
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
            makeHint({
                type: "bookmark",
                text: `${bucketData.keySegments[0]}${s3Uri.delimiter}`,
                s3Uri: `s3://${s3Uri.bucket}/${bucketData.keySegments[0]}${s3Uri.delimiter}`
            }),
            ...bucketData.keySegments.map(text =>
                makeHint({
                    type: "key-segment",
                    text,
                    s3Uri: `s3://${s3Uri.bucket}/${[
                        ...(s3Uri.isDelimiterTerminated
                            ? s3Uri.keySegments
                            : s3Uri.keySegments.slice(0, -1)),
                        text
                    ].join(s3Uri.delimiter)}${s3Uri.delimiter}`
                })
            ),
            ...bucketData.objects.map(text =>
                makeHint({
                    type: "object",
                    text,
                    s3Uri: `s3://${s3Uri.bucket}/${[
                        ...(s3Uri.isDelimiterTerminated
                            ? s3Uri.keySegments
                            : s3Uri.keySegments.slice(0, -1)),
                        text
                    ].join(s3Uri.delimiter)}`
                })
            )
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
                    makeHint({
                        type: "bookmark",
                        text: "s3://mybucket/",
                        s3Uri: "s3://mybucket/"
                    }),
                    makeHint({
                        type: "bookmark",
                        text: "s3://donnee-insee/diffusion/",
                        s3Uri: "s3://donnee-insee/diffusion/"
                    }),
                    makeHint({
                        type: "key-segment",
                        text: "hidden-non-bookmark-hint",
                        s3Uri: "s3://mybucket/hidden-non-bookmark-hint/"
                    })
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
            makeHint({
                type: "bookmark",
                text: "s3://mybucket/",
                s3Uri: "s3://mybucket/"
            }),
            makeHint({
                type: "bookmark",
                text: "s3://donnee-insee/diffusion/",
                s3Uri: "s3://donnee-insee/diffusion/"
            })
        ],
        onToggleBookmark: undefined
    },
    render: () => <UndefinedPrefixLockedEditingStory />
};
