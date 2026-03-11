import { useEffect, useMemo } from "react";
import MuiLink from "@mui/material/Link";
import { tss } from "tss";
import { Tooltip } from "onyxia-ui/Tooltip";
import { stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import { useResolveLocalizedString, type LocalizedString } from "ui/i18n";
import type { Link } from "type-route";

export type S3BookmarksBarItemProps = {
    className?: string;
    /**
     * Not always provided, a friendly name for the bookmark.
     */
    displayName: LocalizedString | undefined;
    /**
     * This is meant to be displayed serialized when the mouse
     * is over the element with a tooltip modal.
     */
    s3Uri: S3Uri;
    /**
     * This the props for the link component.
     *
     * <MuiLink {...props.link} />
     *
     * It defines what happen when the component is clicked.
     * The component should be an anchor <a /> (at the html level)
     */
    link: Link;

    /**
     * A callback function that the component should call
     * when the user click for deleting the bookmark.
     *
     * Not all bookmarks are deletable, hence the optionality.
     */
    onDelete: (() => void) | undefined;

    /*
     * This specifies if the bookmark is currently active.
     * (Like when you have a navigation bar in a website and when we are
     * on the page matching a given link it is displayed with a different style
     * to stress that "this is the page you're currently on")
     */
    isActive: boolean;
};

// For spec alignment.
export type S3BookmarksBarItem = S3BookmarksBarItemProps;

const materialSymbolsHref =
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap";

function ensureMaterialSymbols() {
    if (typeof document === "undefined") {
        return;
    }

    const linkId = "material-symbols-outlined-keep";

    const existing = document.getElementById(linkId) as HTMLLinkElement | null;

    if (existing) {
        if (existing.href !== materialSymbolsHref) {
            existing.href = materialSymbolsHref;
        }
        return;
    }

    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = materialSymbolsHref;
    document.head.appendChild(link);
}

const s3Scheme = "s3://";
const maxTailSegments = 3;

function getShortS3UriLabel(s3Uri: S3Uri): string {
    const keySegments = [...s3Uri.keySegments];

    const fullS3Uri = stringifyS3Uri(s3Uri);

    if (keySegments.length <= maxTailSegments) {
        return fullS3Uri;
    }

    const tail = keySegments.slice(-maxTailSegments).join(s3Uri.delimiter);
    const suffix = s3Uri.isDelimiterTerminated ? s3Uri.delimiter : "";

    return `${s3Scheme}${s3Uri.bucket}/...${s3Uri.delimiter}${tail}${suffix}`;
}

export function S3BookmarksBarItem(props: S3BookmarksBarItemProps) {
    const { className, displayName, s3Uri, link, onDelete, isActive } = props;

    const { resolveLocalizedString } = useResolveLocalizedString();

    useEffect(() => {
        ensureMaterialSymbols();
    }, []);

    const fullS3Uri = useMemo(() => stringifyS3Uri(s3Uri), [s3Uri]);

    const label = useMemo(() => {
        if (displayName !== undefined) {
            const resolved = resolveLocalizedString(displayName);
            if (resolved.trim() !== "") {
                return resolved;
            }
        }

        return getShortS3UriLabel(s3Uri);
    }, [displayName, resolveLocalizedString, s3Uri]);

    const { classes, cx } = useStyles({
        isActive,
        isDeletable: onDelete !== undefined
    });

    return (
        <Tooltip title={fullS3Uri} enterDelay={150}>
            <MuiLink
                {...link}
                className={cx(classes.root, className)}
                underline="none"
                aria-current={isActive ? "page" : undefined}
            >
                {onDelete !== undefined && (
                    <span
                        role="button"
                        tabIndex={0}
                        aria-label="Remove bookmark"
                        className={classes.pinButton}
                        onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            onDelete();
                        }}
                        onKeyDown={event => {
                            if (event.key !== "Enter" && event.key !== " ") {
                                return;
                            }
                            event.preventDefault();
                            event.stopPropagation();
                            onDelete();
                        }}
                    >
                        <span
                            className={`material-symbols-outlined ${classes.pinIcon} pinIconDefault`}
                        >
                            keep
                        </span>
                        <span
                            className={`material-symbols-outlined ${classes.pinIcon} pinIconHover`}
                        >
                            keep_off
                        </span>
                    </span>
                )}
                <span className={classes.labelWrapper}>
                    <span className={classes.labelText}>{label}</span>
                </span>
            </MuiLink>
        </Tooltip>
    );
}

const useStyles = tss
    .withName({ S3BookmarksBarItem })
    .withParams<{ isActive: boolean; isDeletable: boolean }>()
    .create(({ theme, isActive, isDeletable }) => {
        const baseBackground = isDeletable
            ? theme.colors.palette.focus.mainAlpha10
            : theme.colors.useCases.surfaces.surface1;
        const hoverBackground = isDeletable
            ? theme.colors.palette.focus.mainAlpha20
            : theme.colors.useCases.surfaces.surface2;
        const activeBackground = isDeletable
            ? theme.colors.palette.focus.mainAlpha20
            : theme.colors.useCases.surfaces.surface2;
        const labelStyle = theme.typography.variants["label 1"].style;

        return {
            root: {
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 9999,
                padding: "8px 16px",
                backgroundColor: isActive ? activeBackground : baseBackground,
                color: theme.colors.useCases.typography.textPrimary,
                maxWidth: 300,
                flexShrink: 0,
                minWidth: 0,
                boxSizing: "border-box",
                textDecoration: "none",
                transition: "background-color 120ms ease",
                "&:hover": {
                    backgroundColor: isActive ? activeBackground : hoverBackground,
                    textDecoration: "none"
                }
            },
            pinButton: {
                border: "none",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                width: 20,
                height: 20,
                borderRadius: 6,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                flexShrink: 0,
                "&:hover": {
                    backgroundColor: theme.colors.palette.focus.mainAlpha20
                },
                "& .pinIconHover": {
                    display: "none"
                },
                "&:hover .pinIconDefault": {
                    display: "none"
                },
                "&:hover .pinIconHover": {
                    display: "inline-flex"
                }
            },
            pinIcon: {
                fontSize: 16,
                lineHeight: "16px",
                fontFamily: '"Material Symbols Outlined"',
                fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24'
            },
            labelWrapper: {
                flex: "1 1 auto",
                minWidth: 0,
                overflow: "hidden"
            },
            labelText: {
                ...labelStyle,
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: isActive ? 600 : labelStyle.fontWeight
            }
        };
    });
