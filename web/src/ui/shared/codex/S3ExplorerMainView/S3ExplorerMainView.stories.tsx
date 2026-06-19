import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { useEffect, useState } from "react";
import { Evt } from "evt";
import { parseS3Uri, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
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
          policy: { isPublic: true } | { isPublic: false; canBeMadePublic: boolean };
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
        isDeleting: false,
        policy: { isPublic: true }
    },
    {
        type: "prefix segment",
        s3Uri: parsePrefixOrThrow("s3://analytics-data/raw/"),
        uploadProgressPercent: undefined,
        isDeleting: false,
        policy: { isPublic: false, canBeMadePublic: true }
    },
    {
        type: "prefix segment",
        s3Uri: parsePrefixOrThrow("s3://analytics-data/tmp/"),
        uploadProgressPercent: 42,
        isDeleting: false,
        policy: { isPublic: false, canBeMadePublic: false }
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
        isDeleting: false,
        policy: { isPublic: false, canBeMadePublic: true }
    },
    {
        type: "prefix segment",
        s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/2025/"),
        uploadProgressPercent: undefined,
        isDeleting: false,
        policy: { isPublic: true }
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
    isListing: false,
    listedPrefix: {
        s3Uri: defaultPrefix,
        isErrored: false,
        items: [],
        isFullyQualifiedUri: false
    },
    onNavigate: action("navigate"),
    onNavigateBack: action("navigateBack"),
    onPutObjects: action("putObjects"),
    onCreateDirectory: action("createDirectory"),
    onDelete: action("delete"),
    onDownload: action("download"),
    onShareObject: action("shareObject"),
    onBookmark: action("bookmark"),
    bookmarkedS3Uris: [],
    onChangePrefixPolicy: action("changePrefixPolicy"),
    evtAction: Evt.create<"CHOSE FILES TO UPLOAD">(),
    isUploadDisabled: false,
    onDisplayCopyFeedback: action("onDisplayCopyFeedback")
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
        s3Uri: currentPrefix,
        isErrored: false,
        items,
        isFullyQualifiedUri: false
    };
}

function StatefulExplorer(
    props: Omit<
        S3ExplorerMainViewProps,
        | "listedPrefix"
        | "onNavigate"
        | "onNavigateBack"
        | "onCreateDirectory"
        | "onDelete"
        | "onPutObjects"
        | "onDownload"
        | "onShareObject"
        | "onBookmark"
        | "bookmarkedS3Uris"
        | "onChangePrefixPolicy"
        | "evtAction"
        | "onDisplayCopyFeedback"
    >
) {
    const [currentPrefix, setCurrentPrefix] =
        useState<S3Uri.TerminatedByDelimiter>(defaultPrefix);
    const [nodes, setNodes] = useState<MockNode[]>(baseNodes);
    const evtAction = useState(() => Evt.create<"CHOSE FILES TO UPLOAD">())[0];

    useEffect(() => {
        setCurrentPrefix(defaultPrefix);
        setNodes(baseNodes);
    }, []);

    return (
        <div style={{ maxWidth: 1200, padding: 24 }}>
            <S3ExplorerMainView
                {...props}
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
                onNavigateBack={() => {
                    action("navigateBack")();
                    setCurrentPrefix(defaultPrefix);
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
                            isDeleting: false,
                            policy: { isPublic: false, canBeMadePublic: true }
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
                onDownload={({ s3Uris }) => {
                    action("download")(s3Uris);
                }}
                onShareObject={({ s3Uri }) => {
                    action("shareObject")(s3Uri);
                }}
                onBookmark={({ s3Uri }) => {
                    action("bookmark")(s3Uri);
                }}
                bookmarkedS3Uris={[]}
                onChangePrefixPolicy={({ action: policyAction, s3Uri }) => {
                    action("changePrefixPolicy")({ action: policyAction, s3Uri });

                    setNodes(previousNodes =>
                        previousNodes.map(node => {
                            if (
                                node.type !== "prefix segment" ||
                                JSON.stringify(node.s3Uri) !== JSON.stringify(s3Uri)
                            ) {
                                return node;
                            }

                            return {
                                ...node,
                                policy:
                                    policyAction === "make public"
                                        ? { isPublic: true }
                                        : {
                                              isPublic: false,
                                              canBeMadePublic: true
                                          }
                            };
                        })
                    );
                }}
                evtAction={evtAction}
                onDisplayCopyFeedback={({ s3Uri }) => {
                    action("onDisplayCopyFeedback")(s3Uri);
                }}
            />
        </div>
    );
}

export const Playground: Story = {
    args: placeholderArgs,
    render: ({ className, isListing, isUploadDisabled }) => (
        <StatefulExplorer
            className={className}
            isListing={isListing}
            isUploadDisabled={isUploadDisabled}
        />
    )
};

export const ListingInProgress: Story = {
    args: {
        ...placeholderArgs,
        isListing: true
    },
    render: ({ className, isListing, isUploadDisabled }) => (
        <StatefulExplorer
            className={className}
            isListing={isListing}
            isUploadDisabled={isUploadDisabled}
        />
    )
};

export const EmptyPrefix: Story = {
    args: {
        isListing: false,
        listedPrefix: {
            s3Uri: defaultPrefix,
            isErrored: false,
            items: [],
            isFullyQualifiedUri: false
        },
        onNavigate: action("navigate"),
        onNavigateBack: action("navigateBack"),
        onPutObjects: action("putObjects"),
        onCreateDirectory: action("createDirectory"),
        onDelete: action("delete"),
        onDownload: action("download"),
        onShareObject: action("shareObject"),
        onBookmark: action("bookmark"),
        bookmarkedS3Uris: [],
        onChangePrefixPolicy: action("changePrefixPolicy"),
        onDisplayCopyFeedback: action("onDisplayCopyFeedback"),
        evtAction: Evt.create<"CHOSE FILES TO UPLOAD">(),
        isUploadDisabled: false
    },
    render: args => (
        <div style={{ maxWidth: 1200, padding: 24 }}>
            <S3ExplorerMainView {...args} />
        </div>
    )
};

const fullyQualifiedObject: S3ExplorerMainViewProps.Item.Object = {
    type: "object",
    s3Uri: parseObjectOrThrow("s3://analytics-data/README.md"),
    size: 19_481,
    lastModified: new Date("2026-03-17T08:45:00Z").getTime(),
    uploadProgressPercent: undefined,
    isDeleting: false,
    displayName: "README.md"
};

function FullyQualifiedObjectExplorer(props: S3ExplorerMainViewProps) {
    const [listedPrefix, setListedPrefix] = useState(props.listedPrefix);

    useEffect(() => {
        setListedPrefix(props.listedPrefix);
    }, [props.listedPrefix]);

    return (
        <div style={{ maxWidth: 1200, padding: 24 }}>
            <S3ExplorerMainView
                {...props}
                listedPrefix={listedPrefix}
                onNavigate={({ s3Uri }) => {
                    props.onNavigate({ s3Uri });

                    if (
                        !s3Uri.isDelimiterTerminated &&
                        stringifyS3Uri(s3Uri) ===
                            stringifyS3Uri(fullyQualifiedObject.s3Uri)
                    ) {
                        setListedPrefix({
                            s3Uri: fullyQualifiedObject.s3Uri,
                            isErrored: false,
                            items: [fullyQualifiedObject],
                            isFullyQualifiedUri: true
                        });
                    }
                }}
                onNavigateBack={() => {
                    props.onNavigateBack();
                    setListedPrefix(toListedItems(baseNodes, defaultPrefix));
                }}
            />
        </div>
    );
}

export const FullyQualifiedObject: Story = {
    args: {
        isListing: false,
        listedPrefix: {
            s3Uri: fullyQualifiedObject.s3Uri,
            isErrored: false,
            items: [fullyQualifiedObject],
            isFullyQualifiedUri: true
        },
        onNavigate: action("navigate"),
        onNavigateBack: action("navigateBack"),
        onPutObjects: action("putObjects"),
        onCreateDirectory: action("createDirectory"),
        onDelete: action("delete"),
        onDownload: action("download"),
        onShareObject: action("shareObject"),
        onBookmark: action("bookmark"),
        bookmarkedS3Uris: [],
        onChangePrefixPolicy: action("changePrefixPolicy"),
        onDisplayCopyFeedback: action("onDisplayCopyFeedback"),
        evtAction: Evt.create<"CHOSE FILES TO UPLOAD">(),
        isUploadDisabled: false
    },
    render: args => <FullyQualifiedObjectExplorer {...args} />
};

export const AccessDenied: Story = {
    args: {
        isListing: false,
        listedPrefix: {
            s3Uri: defaultPrefix,
            isErrored: true,
            errorCase: "access denied"
        },
        onNavigate: action("navigate"),
        onNavigateBack: action("navigateBack"),
        onPutObjects: action("putObjects"),
        onCreateDirectory: action("createDirectory"),
        onDelete: action("delete"),
        onDownload: action("download"),
        onShareObject: action("shareObject"),
        onBookmark: action("bookmark"),
        bookmarkedS3Uris: [],
        onChangePrefixPolicy: action("changePrefixPolicy"),
        evtAction: Evt.create<"CHOSE FILES TO UPLOAD">(),
        onDisplayCopyFeedback: action("onDisplayCopyFeedback"),
        isUploadDisabled: false
    },
    render: args => (
        <div style={{ maxWidth: 1200, padding: 24 }}>
            <S3ExplorerMainView {...args} />
        </div>
    )
};
