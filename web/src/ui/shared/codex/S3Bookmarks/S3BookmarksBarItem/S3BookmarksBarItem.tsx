import { useEffect, useMemo } from "react";
import MuiLink from "@mui/material/Link";
import MuiTooltip, { tooltipClasses } from "@mui/material/Tooltip";
import { tss } from "tss";
import { stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import { useResolveLocalizedString, type LocalizedString } from "ui/i18n";
import type { Link } from "type-route";

export type S3BookmarkItemProps = {
    className?: string;
    variant?: "bar" | "entryPoint";
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

    /** Some bookmarks are readonly hence the optionality */
    callbacks:
        | {
              /**
               * A callback function that the component should call
               * when the user click for deleting the bookmark.
               */
              onDelete: () => void;
              onRename: () => void;
          }
        | undefined;

    /*
     * This specifies if the bookmark is currently active.
     * (Like when you have a navigation bar in a website and when we are
     * on the page matching a given link it is displayed with a different style
     * to stress that "this is the page you're currently on")
     */
    isActive: boolean;
};

// For spec alignment.
export type S3BookmarksBarItemProps = S3BookmarkItemProps;
export type S3BookmarksBarItem = S3BookmarkItemProps;

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
    const fullS3Uri = stringifyS3Uri(s3Uri);

    if (s3Uri.keySegments.length <= maxTailSegments) {
        return fullS3Uri;
    }

    const tail = s3Uri.keySegments.slice(-maxTailSegments).join(s3Uri.delimiter);
    const suffix = s3Uri.isDelimiterTerminated ? s3Uri.delimiter : "";

    return `${s3Scheme}${s3Uri.bucket}/...${s3Uri.delimiter}${tail}${suffix}`;
}

export function S3BookmarkItem(props: S3BookmarkItemProps) {
    const {
        className,
        variant = "bar",
        displayName,
        s3Uri,
        link,
        callbacks,
        isActive
    } = props;

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
        isDeletable: callbacks !== undefined
    });

    const linkNode = (
        <MuiLink
            {...link}
            className={cx(
                classes.root,
                variant === "bar" ? classes.rootBar : classes.rootEntryPoint,
                className
            )}
            underline="none"
            aria-current={isActive ? "page" : undefined}
        >
            {callbacks !== undefined && (
                <span
                    role="button"
                    tabIndex={0}
                    aria-label="Remove bookmark"
                    className={cx(
                        classes.pinButton,
                        variant === "entryPoint" && classes.pinButtonEntryPoint
                    )}
                    onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        callbacks.onDelete();
                    }}
                    onKeyDown={event => {
                        if (event.key !== "Enter" && event.key !== " ") {
                            return;
                        }
                        event.preventDefault();
                        event.stopPropagation();
                        callbacks.onDelete();
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
            <span
                className={cx(
                    classes.labelWrapper,
                    variant === "entryPoint" && classes.labelWrapperEntryPoint
                )}
            >
                <span className={classes.labelRow}>
                    <span className={classes.labelText}>{label}</span>
                    {callbacks !== undefined && variant === "entryPoint" && (
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label="Rename bookmark"
                            className={classes.renameButton}
                            onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();
                                callbacks.onRename();
                            }}
                            onKeyDown={event => {
                                if (event.key !== "Enter" && event.key !== " ") {
                                    return;
                                }
                                event.preventDefault();
                                event.stopPropagation();
                                callbacks.onRename();
                            }}
                        >
                            <span
                                className={`material-symbols-outlined ${classes.renameIcon}`}
                            >
                                edit
                            </span>
                        </span>
                    )}
                </span>
                {variant === "entryPoint" && (
                    <span className={classes.uriText} title={fullS3Uri}>
                        {fullS3Uri}
                    </span>
                )}
            </span>
        </MuiLink>
    );

    if (variant !== "bar") {
        return linkNode;
    }

    const tooltipContent = (
        <div className={classes.tooltipContent}>
            <div className={classes.tooltipHeader}>
                <span className={classes.tooltipLabel}>{label}</span>
                {callbacks !== undefined && (
                    <div className={classes.tooltipActions}>
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label="Rename bookmark"
                            className={classes.renameButton}
                            onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();
                                callbacks.onRename();
                            }}
                            onKeyDown={event => {
                                if (event.key !== "Enter" && event.key !== " ") {
                                    return;
                                }
                                event.preventDefault();
                                event.stopPropagation();
                                callbacks.onRename();
                            }}
                        >
                            <span
                                className={`material-symbols-outlined ${classes.tooltipActionIcon}`}
                            >
                                edit
                            </span>
                        </span>
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label="Unpin bookmark"
                            className={classes.renameButton}
                            onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();
                                callbacks.onDelete();
                            }}
                            onKeyDown={event => {
                                if (event.key !== "Enter" && event.key !== " ") {
                                    return;
                                }
                                event.preventDefault();
                                event.stopPropagation();
                                callbacks.onDelete();
                            }}
                        >
                            <span
                                className={`material-symbols-outlined ${classes.tooltipActionIcon}`}
                            >
                                keep_off
                            </span>
                        </span>
                    </div>
                )}
            </div>
            <span className={classes.tooltipUrl}>{fullS3Uri}</span>
        </div>
    );

    return (
        <MuiTooltip
            title={tooltipContent}
            enterDelay={150}
            placement="bottom-start"
            disableInteractive={false}
            classes={{ tooltip: classes.tooltip }}
        >
            {linkNode}
        </MuiTooltip>
    );
}

const useStyles = tss
    .withName({ S3BookmarkItem })
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
        const label2Style = theme.typography.variants["label 2"].style;
        const uriStyle = theme.typography.variants["body 1"].style;
        const captionStyle = theme.typography.variants["caption"].style;

        return {
            root: {
                display: "flex",
                backgroundColor: isActive ? activeBackground : baseBackground,
                color: theme.colors.useCases.typography.textPrimary,
                boxSizing: "border-box",
                textDecoration: "none",
                transition: "background-color 120ms ease",
                position: "relative",
                "&:hover": {
                    backgroundColor: isActive ? activeBackground : hoverBackground,
                    textDecoration: "none"
                }
            },
            rootBar: {
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderRadius: 9999,
                padding: "8px 16px",
                maxWidth: 300,
                flexShrink: 0,
                minWidth: 0
            },
            rootEntryPoint: {
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                gap: theme.spacing(1.5),
                borderRadius: 24,
                padding: 24,
                minHeight: 162,
                width: "100%",
                minWidth: 0
            },
            pinButton: {
                border: "none",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                width: 24,
                height: 24,
                borderRadius: 8,
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
            pinButtonEntryPoint: {
                position: "absolute",
                top: 24,
                right: 24
            },
            pinIcon: {
                fontSize: 16,
                lineHeight: "16px",
                fontFamily: '"Material Symbols Outlined"',
                fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24'
            },
            renameButton: {
                border: "none",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                width: 24,
                height: 24,
                borderRadius: 8,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                flexShrink: 0,
                transition: "opacity 120ms ease",
                "&:hover": {
                    backgroundColor: theme.colors.palette.focus.mainAlpha20
                }
            },
            renameIcon: {
                fontSize: 16,
                lineHeight: "16px",
                fontFamily: '"Material Symbols Outlined"',
                fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24'
            },
            tooltipActionIcon: {
                fontSize: 12,
                lineHeight: "12px",
                fontFamily: '"Material Symbols Outlined"',
                fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24'
            },
            labelWrapper: {
                flex: "1 1 auto",
                minWidth: 0,
                width: "100%",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(0.5)
            },
            labelWrapperEntryPoint: {
                flex: "0 0 auto",
                marginTop: "auto"
            },
            labelRow: {
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(1),
                minWidth: 0,
                width: "100%"
            },
            labelText: {
                ...labelStyle,
                display: "block",
                maxWidth: "100%",
                flex: 1,
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: isActive ? 600 : labelStyle.fontWeight
            },
            uriText: {
                ...uriStyle,
                color: theme.colors.useCases.typography.textSecondary,
                display: "block",
                maxWidth: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
            },
            tooltip: {
                backgroundColor: theme.colors.useCases.surfaces.surface1,
                color: theme.colors.useCases.typography.textPrimary,
                boxShadow: theme.shadows[1],
                borderRadius: 10,
                padding: theme.spacing(3),
                maxWidth: 320,
                margin: 0,
                [`.${tooltipClasses.popper}[data-popper-placement*="bottom"] &`]: {
                    marginTop: 8
                },
                [`.${tooltipClasses.popper}[data-popper-placement*="top"] &`]: {
                    marginBottom: 2
                },
                [`.${tooltipClasses.popper}[data-popper-placement*="right"] &`]: {
                    marginLeft: 2
                },
                [`.${tooltipClasses.popper}[data-popper-placement*="left"] &`]: {
                    marginRight: 2
                }
            },
            tooltipContent: {
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(0),
                minWidth: 0
            },
            tooltipHeader: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: theme.spacing(2),
                minWidth: 0
            },
            tooltipLabel: {
                ...label2Style,
                flex: 1,
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
            },
            tooltipActions: {
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(1),
                flexShrink: 0
            },
            tooltipUrl: {
                ...captionStyle,
                color: theme.colors.useCases.typography.textSecondary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
            }
        };
    });

export const S3BookmarksBarItem = S3BookmarkItem;
