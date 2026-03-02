import type { Meta, StoryObj } from "@storybook/react";
import { useMemo, useState } from "react";
import { action } from "@storybook/addon-actions";
import { S3PathControl, type ValidationResult } from "../S3PathControl";
import { PinnedChipsBar } from "./PinnedChipsBar";
import { BookmarkNameModal } from "./BookmarkNameModal";
import { getDefaultBookmarkLabelFromPath } from "./getDefaultBookmarkLabelFromPath";
import type { Bookmark } from "./types";

const meta = {
    title: "Bookmarks/Demo/Overview",
    component: S3PathControl
} satisfies Meta<typeof S3PathControl>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockValidatePath = async (draftPath: string): Promise<ValidationResult> => ({
    status: "success",
    resolvedPath: draftPath
});

export const Overview: Story = {
    render: () => {
        const [currentPath, setCurrentPath] = useState(
            "s3://analytics-data/exports/2024/quarter-1/report.csv"
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

        const activeBookmarkId = useMemo(() => {
            return pinnedBookmarks.find(bookmark => bookmark.path === currentPath)?.id;
        }, [pinnedBookmarks, currentPath]);

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <S3PathControl
                    value={currentPath}
                    onNavigate={nextPath => setCurrentPath(nextPath)}
                    validatePath={mockValidatePath}
                    onCopy={action("copy")}
                    onBookmark={() => {
                        setPendingPath(currentPath);
                        setShowNameModal(true);
                    }}
                    onCreatePrefix={action("create prefix")}
                    onImportData={action("import data")}
                    onError={action("error")}
                />

                <PinnedChipsBar
                    bookmarks={pinnedBookmarks}
                    activeId={activeBookmarkId}
                    onSelect={bookmark => setCurrentPath(bookmark.path)}
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
