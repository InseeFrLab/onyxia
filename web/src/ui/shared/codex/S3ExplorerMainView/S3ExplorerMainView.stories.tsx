import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useEffect, useState } from "react";
import { parseS3Uri, type S3Uri } from "core/tools/S3Uri";
import { S3ExplorerMainView, type S3ExplorerMainViewProps } from "./S3ExplorerMainView";

const meta = {
    title: "Shared/S3ExplorerMainView",
    component: S3ExplorerMainView
} satisfies Meta<typeof S3ExplorerMainView>;

export default meta;

type Story = StoryObj<typeof meta>;

type MockNode =
    | {
          type: "prefix segment";
          s3Uri: S3Uri.TerminatedByDelimiter;
          uploadProgressPercent: number | undefined;
          isDeleting: boolean;
      }
    | {
          type: "object";
          s3Uri: S3Uri.NonTerminatedByDelimiter;
          uploadProgressPercent: number | undefined;
          isDeleting: boolean;
          size: number;
          lastModified: number;
      };

const delimiter = "/";
const defaultPrefix = parsePrefixOrThrow("s3://analytics-data/");

function parsePrefixOrThrow(value: string): S3Uri.TerminatedByDelimiter {
    const s3Uri = parseS3Uri({
        value,
        delimiter
    });

    if (!s3Uri.isDelimiterTerminated) {
        throw new Error(`${value} is expected to be a prefix S3 URI`);
    }

    return s3Uri;
}

function parseObjectOrThrow(value: string): S3Uri.NonTerminatedByDelimiter {
    const s3Uri = parseS3Uri({
        value,
        delimiter
    });

    if (s3Uri.isDelimiterTerminated) {
        throw new Error(`${value} is expected to be an object S3 URI`);
    }

    return s3Uri;
}

function getDisplayName(s3Uri: S3Uri): string {
    if (s3Uri.keySegments.length === 0) {
        return s3Uri.bucket;
    }

    return s3Uri.keySegments.at(-1) ?? s3Uri.bucket;
}

const baseNodes: MockNode[] = [
    {
        type: "prefix segment",
        s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/"),
        uploadProgressPercent: undefined,
        isDeleting: false
    },
    {
        type: "prefix segment",
        s3Uri: parsePrefixOrThrow("s3://analytics-data/raw/"),
        uploadProgressPercent: undefined,
        isDeleting: false
    },
    {
        type: "prefix segment",
        s3Uri: parsePrefixOrThrow("s3://analytics-data/tmp/"),
        uploadProgressPercent: 42,
        isDeleting: false
    },
    {
        type: "object",
        s3Uri: parseObjectOrThrow("s3://analytics-data/README.md"),
        size: 19_481,
        lastModified: new Date("2026-03-17T08:45:00Z").getTime(),
        uploadProgressPercent: undefined,
        isDeleting: false
    },
    {
        type: "object",
        s3Uri: parseObjectOrThrow("s3://analytics-data/budget-2026.csv"),
        size: 6_294_321,
        lastModified: new Date("2026-03-18T15:10:00Z").getTime(),
        uploadProgressPercent: undefined,
        isDeleting: false
    },
    {
        type: "object",
        s3Uri: parseObjectOrThrow("s3://analytics-data/new-upload.parquet"),
        size: 140_000_000,
        lastModified: new Date("2026-03-19T07:55:00Z").getTime(),
        uploadProgressPercent: 67,
        isDeleting: false
    }
];

const nestedNodes: MockNode[] = [
    {
        type: "prefix segment",
        s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/2024/"),
        uploadProgressPercent: undefined,
        isDeleting: false
    },
    {
        type: "prefix segment",
        s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/2025/"),
        uploadProgressPercent: undefined,
        isDeleting: false
    },
    {
        type: "object",
        s3Uri: parseObjectOrThrow("s3://analytics-data/exports/manifest.json"),
        size: 11_704,
        lastModified: new Date("2026-03-19T10:00:00Z").getTime(),
        uploadProgressPercent: undefined,
        isDeleting: false
    },
    {
        type: "object",
        s3Uri: parseObjectOrThrow("s3://analytics-data/exports/readme.txt"),
        size: 8_122,
        lastModified: new Date("2026-03-18T09:15:00Z").getTime(),
        uploadProgressPercent: undefined,
        isDeleting: false
    }
];

const placeholderArgs: S3ExplorerMainViewProps = {
    currentS3Uri: defaultPrefix,
    isListing: false,
    listedPrefix: {
        isErrored: false,
        items: []
    },
    onNavigate: action("navigate"),
    onPutObjects: action("putObjects"),
    onCreateDirectory: action("createDirectory"),
    onDelete: action("delete"),
    getDirectDownloadUrl: async () => "https://example.com/download/object"
};

function toListedItems(
    nodes: MockNode[],
    currentPrefix: S3Uri.TerminatedByDelimiter
): S3ExplorerMainViewProps["listedPrefix"] {
    const prefixValue = `${currentPrefix.bucket}/${currentPrefix.keySegments.join("/")}`;

    const items = nodes
        .filter(node => {
            const nodePrefix = `${node.s3Uri.bucket}/${node.s3Uri.keySegments.join("/")}`;

            if (currentPrefix.keySegments.length === 0) {
                return (
                    node.s3Uri.bucket === currentPrefix.bucket &&
                    node.s3Uri.keySegments.length <= 1
                );
            }

            return (
                nodePrefix.startsWith(prefixValue) &&
                node.s3Uri.keySegments.length === currentPrefix.keySegments.length + 1
            );
        })
        .map(node => {
            switch (node.type) {
                case "prefix segment":
                    return {
                        ...node,
                        displayName: getDisplayName(node.s3Uri)
                    };
                case "object":
                    return {
                        ...node,
                        displayName: getDisplayName(node.s3Uri)
                    };
            }
        });

    return {
        isErrored: false,
        items
    };
}

function StatefulExplorer(
    props: Omit<
        S3ExplorerMainViewProps,
        | "listedPrefix"
        | "onNavigate"
        | "onCreateDirectory"
        | "onDelete"
        | "onPutObjects"
        | "getDirectDownloadUrl"
    >
) {
    const [currentPrefix, setCurrentPrefix] =
        useState<S3Uri.TerminatedByDelimiter>(defaultPrefix);
    const [nodes, setNodes] = useState<MockNode[]>(baseNodes);

    useEffect(() => {
        setCurrentPrefix(defaultPrefix);
        setNodes(baseNodes);
    }, []);

    return (
        <div style={{ maxWidth: 1200, padding: 24 }}>
            <S3ExplorerMainView
                {...props}
                currentS3Uri={currentPrefix}
                listedPrefix={toListedItems(
                    currentPrefix.keySegments.length === 0
                        ? nodes
                        : [...nodes, ...nestedNodes],
                    currentPrefix
                )}
                onNavigate={({ s3Uri }) => {
                    action("navigate")(s3Uri);

                    if (s3Uri.isDelimiterTerminated) {
                        setCurrentPrefix(s3Uri);
                    }
                }}
                onCreateDirectory={({ prefixSegment }) => {
                    action("createDirectory")(prefixSegment);

                    setNodes(previousNodes => [
                        ...previousNodes,
                        {
                            type: "prefix segment",
                            s3Uri: {
                                ...currentPrefix,
                                keySegments: [
                                    ...currentPrefix.keySegments,
                                    prefixSegment
                                ],
                                isDelimiterTerminated: true
                            },
                            uploadProgressPercent: undefined,
                            isDeleting: false
                        }
                    ]);
                }}
                onDelete={({ s3Uris }) => {
                    action("delete")(s3Uris);

                    setNodes(previousNodes =>
                        previousNodes.filter(
                            node =>
                                !s3Uris.some(
                                    s3Uri =>
                                        JSON.stringify(s3Uri) ===
                                        JSON.stringify(node.s3Uri)
                                )
                        )
                    );
                }}
                onPutObjects={({ files }) => {
                    action("putObjects")(files);

                    const now = Date.now();

                    setNodes(previousNodes => [
                        ...previousNodes,
                        ...files.map((file, index) => {
                            const s3Uri: S3Uri.NonTerminatedByDelimiter = {
                                bucket: currentPrefix.bucket,
                                delimiter: currentPrefix.delimiter,
                                keySegments: [
                                    ...currentPrefix.keySegments,
                                    ...file.relativePathSegments,
                                    file.fileBasename
                                ],
                                isDelimiterTerminated: false
                            };

                            return {
                                type: "object" as const,
                                s3Uri,
                                size:
                                    file.blob instanceof File
                                        ? file.blob.size
                                        : 15_000 + index,
                                lastModified: now + index,
                                uploadProgressPercent: undefined,
                                isDeleting: false
                            };
                        })
                    ]);
                }}
                getDirectDownloadUrl={async ({ s3Uri }) => {
                    action("getDirectDownloadUrl")(s3Uri);

                    await new Promise(resolve => setTimeout(resolve, 500));

                    return `https://example.com/download/${encodeURIComponent(
                        s3Uri.keySegments.join("/")
                    )}`;
                }}
            />
        </div>
    );
}

export const Playground: Story = {
    args: placeholderArgs,
    render: ({ className, isListing }) => (
        <StatefulExplorer className={className} isListing={isListing} />
    )
};

export const ListingInProgress: Story = {
    args: {
        ...placeholderArgs,
        isListing: true
    },
    render: ({ className, isListing }) => (
        <StatefulExplorer className={className} isListing={isListing} />
    )
};

export const EmptyPrefix: Story = {
    args: {
        currentS3Uri: defaultPrefix,
        isListing: false,
        listedPrefix: {
            isErrored: false,
            items: []
        },
        onNavigate: action("navigate"),
        onPutObjects: action("putObjects"),
        onCreateDirectory: action("createDirectory"),
        onDelete: action("delete"),
        getDirectDownloadUrl: async () => "https://example.com/download/object"
    },
    render: args => (
        <div style={{ maxWidth: 1200, padding: 24 }}>
            <S3ExplorerMainView {...args} />
        </div>
    )
};

export const AccessDenied: Story = {
    args: {
        currentS3Uri: defaultPrefix,
        isListing: false,
        listedPrefix: {
            isErrored: true,
            errorCase: "access denied"
        },
        onNavigate: action("navigate"),
        onPutObjects: action("putObjects"),
        onCreateDirectory: action("createDirectory"),
        onDelete: action("delete"),
        getDirectDownloadUrl: async () => "https://example.com/download/object"
    },
    render: args => (
        <div style={{ maxWidth: 1200, padding: 24 }}>
            <S3ExplorerMainView {...args} />
        </div>
    )
};
