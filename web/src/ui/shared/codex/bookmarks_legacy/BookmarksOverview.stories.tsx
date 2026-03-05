import type { Meta, StoryObj } from "@storybook/react";
import { useMemo, useState } from "react";
import { action } from "@storybook/addon-actions";
import { parseS3Uri, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import { S3UriBar } from "../S3UriBar";
import { PinnedChipsBar } from "./PinnedChipsBar";
import { BookmarkNameModal } from "./BookmarkNameModal";
import { getDefaultBookmarkLabelFromPath } from "./getDefaultBookmarkLabelFromPath";
import type { Bookmark } from "./types";

const delimiter = "/";

function parsePrefixOrThrow(s3Uri: string): S3Uri.Prefix {
    return parseS3Uri({
        value: s3Uri,
        delimiter,
        isPrefix: true
    });
}

const meta = {
    title: "Bookmarks/Demo/Overview",
    component: S3UriBar
} satisfies Meta<typeof S3UriBar>;

export default meta;

type Story = StoryObj<typeof meta>;

const overviewArgs = {
    s3UriPrefix: parsePrefixOrThrow(
        "s3://analytics-data/exports/2024/quarter-1/report.csv"
    ),
    isEditing: false,
    onS3UriPrefixChange: () => undefined,
    onIsEditingChange: () => undefined,
    hints: [],
    isBookmarked: false
};

export const Overview: Story = {
    args: overviewArgs,
    render: () => {
        const [s3UriPrefix, setS3UriPrefix] = useState<S3Uri.Prefix>(
            parsePrefixOrThrow("s3://analytics-data/exports/2024/quarter-1/report.csv")
        );
        const [isEditing, setIsEditing] = useState(false);
        const [pinnedBookmarks, setPinnedBookmarks] = useState<Bookmark[]>([
            {
                id: "bucket-analytics",
                label: "analytics-data",
                path: "s3://analytics-data",
                createdAt: new Date().toISOString()
            }
        ]);
        const [showNameModal, setShowNameModal] = useState(false);
        const [pendingPath, setPendingPath] = useState<string | null>(null);

        const currentPath = useMemo(() => stringifyS3Uri(s3UriPrefix), [s3UriPrefix]);

        const activeBookmarkId = useMemo(() => {
            return pinnedBookmarks.find(bookmark => bookmark.path === currentPath)?.id;
        }, [pinnedBookmarks, currentPath]);

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <S3UriBar
                    s3UriPrefix={s3UriPrefix}
                    isEditing={isEditing}
                    onS3UriPrefixChange={({ s3UriPrefix }) => {
                        action("s3UriPrefixChange")(stringifyS3Uri(s3UriPrefix));
                        setS3UriPrefix(s3UriPrefix);
                    }}
                    onIsEditingChange={({ isEditing }) => {
                        action("isEditingChange")(isEditing);
                        setIsEditing(isEditing);
                    }}
                    hints={[
                        { type: "key-segment", text: "quarter-2" },
                        { type: "key-segment", text: "quarter-3" },
                        { type: "object", text: "report.parquet" },
                        { type: "bookmark", text: "exports/2024/" }
                    ]}
                    isBookmarked={activeBookmarkId !== undefined}
                    onToggleBookmark={() => {
                        action("toggleBookmark")(currentPath);

                        if (activeBookmarkId !== undefined) {
                            setPinnedBookmarks(prev =>
                                prev.filter(bookmark => bookmark.id !== activeBookmarkId)
                            );
                            return;
                        }

                        setPendingPath(currentPath);
                        setShowNameModal(true);
                    }}
                />

                <PinnedChipsBar
                    bookmarks={pinnedBookmarks}
                    activeId={activeBookmarkId}
                    onSelect={bookmark => {
                        setS3UriPrefix(parsePrefixOrThrow(bookmark.path));
                        setIsEditing(false);
                    }}
                    onUnpin={bookmark =>
                        setPinnedBookmarks(prev =>
                            prev.filter(item => item.id !== bookmark.id)
                        )
                    }
                />

                <div
                    style={{
                        height: 180,
                        border: "1px dashed #cbd5e1",
                        borderRadius: 8,
                        padding: 16,
                        color: "#64748b"
                    }}
                >
                    Placeholder file list area
                </div>

                <BookmarkNameModal
                    open={showNameModal}
                    initialValue={
                        pendingPath ? getDefaultBookmarkLabelFromPath(pendingPath) : ""
                    }
                    onCancel={() => {
                        setShowNameModal(false);
                        setPendingPath(null);
                    }}
                    onSave={label => {
                        if (!label || !pendingPath) {
                            setShowNameModal(false);
                            setPendingPath(null);
                            return;
                        }

                        setPinnedBookmarks(prev => [
                            {
                                id: `bookmark-${Date.now()}`,
                                label,
                                path: pendingPath,
                                createdAt: new Date().toISOString()
                            },
                            ...prev
                        ]);
                        setShowNameModal(false);
                        setPendingPath(null);
                    }}
                />
            </div>
        );
    }
};

// TODO: Replace placeholder file list with real file explorer integration.
