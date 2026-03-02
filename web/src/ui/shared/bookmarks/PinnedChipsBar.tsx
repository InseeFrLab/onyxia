import { useEffect, useRef, useState } from "react";
import { tss } from "tss";
import type { Bookmark } from "./types";
import { BookmarkChip } from "./BookmarkChip";

export type PinnedChipsBarProps = {
    bookmarks: Bookmark[];
    activeId?: string;
    onSelect?: (bookmark: Bookmark) => void;
    onUnpin?: (bookmark: Bookmark) => void;
};

export function PinnedChipsBar(props: PinnedChipsBarProps) {
    const { bookmarks, activeId, onSelect, onUnpin } = props;
    const { classes, cx } = useStyles();
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [showLeftFade, setShowLeftFade] = useState(false);
    const [showRightFade, setShowRightFade] = useState(false);

    useEffect(() => {
        const element = scrollRef.current;

        if (!element) {
            return;
        }

        const updateFade = () => {
            const maxScrollLeft = element.scrollWidth - element.clientWidth;
            setShowLeftFade(element.scrollLeft > 1);
            setShowRightFade(element.scrollLeft < maxScrollLeft - 1);
        };

        updateFade();
        element.addEventListener("scroll", updateFade);
        window.addEventListener("resize", updateFade);

        return () => {
            element.removeEventListener("scroll", updateFade);
            window.removeEventListener("resize", updateFade);
        };
    }, [bookmarks.length]);

    if (bookmarks.length === 0) {
        return <div>No bookmarks yet.</div>;
    }

    return (
        <div
            className={cx(
                classes.root,
                showLeftFade && classes.fadeLeft,
                showRightFade && classes.fadeRight
            )}
            aria-label="Pinned bookmarks"
        >
            <div className={classes.scroll} ref={scrollRef}>
                {bookmarks.map(bookmark => (
                    <BookmarkChip
                        key={bookmark.id}
                        label={bookmark.label}
                        path={bookmark.path}
                        active={bookmark.id === activeId}
                        onNavigate={() => onSelect?.(bookmark)}
                        onUnpin={onUnpin ? () => onUnpin(bookmark) : undefined}
                    />
                ))}
            </div>
        </div>
    );
}

// TODO: Add overflow handling and empty state illustration.

const useStyles = tss.withName({ PinnedChipsBar }).create(({ theme }) => ({
    root: {
        position: "relative",
        "&::before, &::after": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 12,
            width: 24,
            pointerEvents: "none",
            opacity: 0,
            transition: "opacity 120ms ease"
        },
        "&::before": {
            left: 0,
            background: `linear-gradient(to right, ${theme.colors.useCases.surfaces.background}, transparent)`
        },
        "&::after": {
            right: 0,
            background: `linear-gradient(to left, ${theme.colors.useCases.surfaces.background}, transparent)`
        }
    },
    fadeLeft: {
        "&::before": {
            opacity: 1
        }
    },
    fadeRight: {
        "&::after": {
            opacity: 1
        }
    },
    scroll: {
        display: "flex",
        flexWrap: "nowrap",
        gap: 8,
        alignItems: "center",
        overflowX: "auto",
        overflowY: "hidden",
        whiteSpace: "nowrap",
        WebkitOverflowScrolling: "touch",
        paddingBottom: 12,
        boxSizing: "border-box"
    }
}));
