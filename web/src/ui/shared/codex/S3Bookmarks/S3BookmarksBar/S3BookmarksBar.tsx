import { useEffect, useRef, useState } from "react";
import { tss } from "tss";
import { stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import type { LocalizedString } from "ui/i18n";
import type { Link } from "type-route";
import { S3BookmarkItem } from "../S3BookmarksBarItem";
import { useResolveLocalizedString } from "ui/i18n";

export type S3BookmarksBarProps = {
    className?: string;
    items: S3BookmarksBarProps.Item[];
    activeItemS3Uri: S3Uri | undefined;
    onDelete: (props: { s3Uri: S3Uri }) => void;
    onRename: (props: { s3Uri: S3Uri; currentDisplayName: string | undefined }) => void;
    getItemLink: (props: { s3Uri: S3Uri }) => Link;
};

export namespace S3BookmarksBarProps {
    export type Item = {
        displayName: LocalizedString | undefined;
        s3Uri: S3Uri;
        isReadonly: boolean;
    };
}

export function S3BookmarksBar(props: S3BookmarksBarProps) {
    const { className, items, activeItemS3Uri, getItemLink, onDelete, onRename } = props;

    const { classes, cx } = useStyles();

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [showRightFade, setShowRightFade] = useState(false);
    const activeItemKey = activeItemS3Uri ? stringifyS3Uri(activeItemS3Uri) : undefined;

    useEffect(() => {
        const element = scrollRef.current;

        if (!element) {
            return;
        }

        const updateFade = () => {
            const maxScrollLeft = element.scrollWidth - element.clientWidth;
            setShowRightFade(element.scrollLeft < maxScrollLeft - 1);
        };

        updateFade();
        element.addEventListener("scroll", updateFade);
        window.addEventListener("resize", updateFade);

        return () => {
            element.removeEventListener("scroll", updateFade);
            window.removeEventListener("resize", updateFade);
        };
    }, [items.length]);

    const { resolveLocalizedString } = useResolveLocalizedString();

    return (
        <div
            className={cx(classes.root, showRightFade && classes.fadeRight, className)}
            aria-label="S3 bookmarks"
        >
            <div className={classes.scroll} ref={scrollRef}>
                {items.map(item => {
                    const link = getItemLink({ s3Uri: item.s3Uri });

                    return (
                        <S3BookmarkItem
                            key={link.href}
                            variant="bar"
                            displayName={item.displayName}
                            s3Uri={item.s3Uri}
                            link={link}
                            callbacks={
                                item.isReadonly
                                    ? undefined
                                    : {
                                          onDelete: () => onDelete({ s3Uri: item.s3Uri }),
                                          onRename: () =>
                                              onRename({
                                                  s3Uri: item.s3Uri,
                                                  currentDisplayName:
                                                      item.displayName === undefined
                                                          ? undefined
                                                          : resolveLocalizedString(
                                                                item.displayName
                                                            )
                                              })
                                      }
                            }
                            isActive={
                                activeItemKey !== undefined &&
                                stringifyS3Uri(item.s3Uri) === activeItemKey
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
}

const useStyles = tss.withName({ S3BookmarksBar }).create(({ theme }) => ({
    root: {
        position: "relative",
        "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 12,
            right: 0,
            width: 24,
            pointerEvents: "none",
            opacity: 0,
            transition: "opacity 120ms ease",
            background: `linear-gradient(to left, ${theme.colors.useCases.surfaces.background}, transparent)`
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
