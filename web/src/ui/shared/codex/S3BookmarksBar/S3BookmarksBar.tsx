import { useEffect, useRef, useState } from "react";
import { tss } from "tss";
import type { S3Uri } from "core/tools/S3Uri";
import type { LocalizedString } from "ui/i18n";
import type { Link } from "type-route";
import { S3BookmarksBarItem } from "./S3BookmarksBarItem";

export type S3BookmarksBarProps = {
    className?: string;
    items: S3BookmarksBarProps.Item[];
    onDelete: (props: { s3Uri: S3Uri }) => void;
    getItemLink: (props: { s3Uri: S3Uri }) => Link;
};

export namespace S3BookmarksBarProps {
    export type Item = {
        displayName: LocalizedString | undefined;
        s3Uri: S3Uri;
        isReadonly: boolean;
    };
}

function getIsLinkActive(link: Link): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    try {
        const url = new URL(link.href, window.location.origin);
        const target = `${url.pathname}${url.search}${url.hash}`;
        return target === current;
    } catch {
        return link.href === current || link.href === window.location.href;
    }
}

export function S3BookmarksBar(props: S3BookmarksBarProps) {
    const { className, items, getItemLink, onDelete } = props;

    const { classes, cx } = useStyles();

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [showRightFade, setShowRightFade] = useState(false);

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

    return (
        <div
            className={cx(classes.root, showRightFade && classes.fadeRight, className)}
            aria-label="S3 bookmarks"
        >
            <div className={classes.scroll} ref={scrollRef}>
                {items.map(item => {
                    const link = getItemLink({ s3Uri: item.s3Uri });

                    return (
                        <S3BookmarksBarItem
                            key={link.href}
                            displayName={item.displayName}
                            s3Uri={item.s3Uri}
                            link={link}
                            onDelete={
                                item.isReadonly
                                    ? undefined
                                    : () => onDelete({ s3Uri: item.s3Uri })
                            }
                            isActive={getIsLinkActive(link)}
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
