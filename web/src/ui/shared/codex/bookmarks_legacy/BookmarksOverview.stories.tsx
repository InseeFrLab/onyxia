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

function parsePrefixOrThrow(s3Uri: string): S3Uri {
    return parseS3Uri({
        value: s3Uri,
        delimiter
    });
}

const meta = {
    title: "Bookmarks/Demo/Overview",
    component: S3UriBar
} satisfies Meta<typeof S3UriBar>;

export default meta;

type Story = StoryObj<typeof meta>;

const overviewArgs = {
    s3Uri: parsePrefixOrThrow("s3://analytics-data/exports/2024/quarter-1/report.csv"),
    onS3UriPrefixChange: () => undefined,
    hints: [],
    isBookmarked: false
};

export const Overview: Story = {
    args: overviewArgs,
    render: () => {
        const [s3Uri, setS3Uri] = useState<S3Uri>(
            parsePrefixOrThrow("s3://analytics-data/exports/2024/quarter-1/report.csv")
        );
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

        const currentPath = useMemo(() => stringifyS3Uri(s3Uri), [s3Uri]);

        const activeBookmarkId = useMemo(() => {
            return pinnedBookmarks.find(bookmark => bookmark.path === currentPath)?.id;
        }, [pinnedBookmarks, currentPath]);

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <S3UriBar
                    s3Uri={s3Uri}
                    onS3UriPrefixChange={({ s3Uri }) => {
                        action("s3UriPrefixChange")(stringifyS3Uri(s3Uri));
                        setS3Uri(s3Uri);
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
                        setS3Uri(parsePrefixOrThrow(bookmark.path));
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
