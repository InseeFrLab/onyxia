import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import MuiLink from "@mui/material/Link";
import MuiTooltip, { tooltipClasses } from "@mui/material/Tooltip";
import { tss } from "tss";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";
import {
    declareComponentKeys,
    useResolveLocalizedString,
    useTranslation,
    type LocalizedString
} from "ui/i18n";
import type { Link } from "type-route";

export type S3BookmarkItemProps = {
    className?: string;
    variant?: "bar" | "entryPoint";
    showPinIcon?: boolean;
    showActiveState?: boolean;
    disableTooltip?: boolean;
    showInlinePath?: boolean;
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
        showPinIcon = true,
        showActiveState = true,
        disableTooltip = false,
        showInlinePath = false,
        displayName,
        s3Uri,
        link,
        callbacks,
        isActive
    } = props;

    const { resolveLocalizedString } = useResolveLocalizedString();
    const { t } = useTranslation({ S3BookmarkItem });
    const rootRef = useRef<HTMLAnchorElement | null>(null);
    const [isEntryPointMenuOpen, setIsEntryPointMenuOpen] = useState(false);
    const stopEvent = (event: SyntheticEvent) => {
        event.preventDefault();
        event.stopPropagation();
    };

    useEffect(() => {
        ensureMaterialSymbols();
    }, []);

    useEffect(() => {
        if (!isEntryPointMenuOpen) {
            return;
        }

        const onPointerDown = (event: globalThis.PointerEvent) => {
            const target = event.target;

            if (!(target instanceof Node)) {
                return;
            }

            if (rootRef.current?.contains(target)) {
                return;
            }

            setIsEntryPointMenuOpen(false);
        };

        document.addEventListener("pointerdown", onPointerDown, true);

        return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [isEntryPointMenuOpen]);

    const fullS3Uri = useMemo(() => stringifyS3Uri(s3Uri), [s3Uri]);
    const isEntryPoint = variant === "entryPoint";
    const isCustomBookmark = callbacks !== undefined;

    const label = useMemo(() => {
        if (displayName !== undefined) {
            const resolved = resolveLocalizedString(displayName);
            if (resolved.trim() !== "") {
                return resolved;
            }
        }

        return getShortS3UriLabel(s3Uri);
    }, [displayName, resolveLocalizedString, s3Uri]);

    const entryPointSubtitle = isEntryPoint ? fullS3Uri : undefined;
    const linkAriaLabel = isEntryPoint
        ? isCustomBookmark
            ? t("open bookmark")
            : t("open bucket")
        : undefined;

    const shouldInlineExpand = variant === "bar" && showInlinePath;
    const isActiveStyle = showActiveState && isActive;
    const { classes, cx } = useStyles({
        isActive: isActiveStyle,
        isReadonly: callbacks === undefined,
        variant
    });

    const linkNode = (
        <MuiLink
            {...link}
            ref={rootRef}
            className={cx(
                classes.root,
                variant === "bar" ? classes.rootBar : classes.rootEntryPoint,
                shouldInlineExpand && classes.rootInline,
                shouldInlineExpand && isActiveStyle && classes.rootInlineActive,
                className
            )}
            underline="none"
            aria-current={isActive ? "page" : undefined}
            aria-label={linkAriaLabel}
            onKeyDown={event => {
                if (event.key !== " ") {
                    return;
                }

                event.preventDefault();
                event.currentTarget.click();
            }}
        >
            {isEntryPoint && (
                <span
                    className={cx(
                        classes.entryPointLeadingIconWrapper,
                        isCustomBookmark && classes.entryPointLeadingIconWrapperCustom
                    )}
                    aria-hidden="true"
                >
                    {isCustomBookmark ? (
                        <Icon
                            className={classes.entryPointLeadingIcon}
                            icon={getIconUrlByName("Star")}
                            size="small"
                        />
                    ) : (
                        <Icon
                            className={classes.entryPointLeadingIcon}
                            icon={getIconUrlByName("Domain")}
                            size="small"
                        />
                    )}
                </span>
            )}
            {showPinIcon && !isEntryPoint && (
                <span className={classes.pinIconWrapper} aria-hidden="true">
                    <span className={`material-symbols-outlined ${classes.pinIcon}`}>
                        star
                    </span>
                </span>
            )}
            {isEntryPoint && isCustomBookmark && callbacks !== undefined && (
                <span className={classes.entryPointActions}>
                    <span
                        role="button"
                        tabIndex={0}
                        aria-label={t("bookmark actions")}
                        aria-haspopup="menu"
                        aria-expanded={isEntryPointMenuOpen}
                        className={classes.entryPointMoreButton}
                        onClick={event => {
                            stopEvent(event);
                            setIsEntryPointMenuOpen(isOpen => !isOpen);
                        }}
                        onMouseDown={stopEvent}
                        onPointerDown={stopEvent}
                        onKeyDown={event => {
                            if (event.key === "Escape") {
                                stopEvent(event);
                                setIsEntryPointMenuOpen(false);
                                return;
                            }

                            if (event.key !== "Enter" && event.key !== " ") {
                                return;
                            }

                            stopEvent(event);
                            setIsEntryPointMenuOpen(isOpen => !isOpen);
                        }}
                    >
                        <span
                            className={`material-symbols-outlined ${classes.entryPointMoreIcon}`}
                        >
                            more_vert
                        </span>
                    </span>
                    {isEntryPointMenuOpen && (
                        <span className={classes.entryPointMenu} role="menu">
                            <span
                                role="menuitem"
                                tabIndex={0}
                                className={classes.entryPointMenuItem}
                                onClick={event => {
                                    stopEvent(event);
                                    setIsEntryPointMenuOpen(false);
                                    callbacks.onRename();
                                }}
                                onMouseDown={stopEvent}
                                onPointerDown={stopEvent}
                                onKeyDown={event => {
                                    if (event.key !== "Enter" && event.key !== " ") {
                                        return;
                                    }
                                    stopEvent(event);
                                    setIsEntryPointMenuOpen(false);
                                    callbacks.onRename();
                                }}
                            >
                                <span
                                    className={`material-symbols-outlined ${classes.entryPointMenuIcon}`}
                                >
                                    edit
                                </span>
                                <span>{t("rename")}</span>
                            </span>
                            <span
                                role="menuitem"
                                tabIndex={0}
                                className={classes.entryPointMenuItem}
                                onClick={event => {
                                    stopEvent(event);
                                    setIsEntryPointMenuOpen(false);
                                    callbacks.onDelete();
                                }}
                                onMouseDown={stopEvent}
                                onPointerDown={stopEvent}
                                onKeyDown={event => {
                                    if (event.key !== "Enter" && event.key !== " ") {
                                        return;
                                    }
                                    stopEvent(event);
                                    setIsEntryPointMenuOpen(false);
                                    callbacks.onDelete();
                                }}
                            >
                                <span
                                    className={`material-symbols-outlined ${classes.entryPointMenuIcon}`}
                                >
                                    delete
                                </span>
                                <span>{t("delete")}</span>
                            </span>
                        </span>
                    )}
                </span>
            )}
            <span
                className={cx(
                    classes.labelWrapper,
                    variant === "entryPoint" && classes.labelWrapperEntryPoint
                )}
            >
                <span
                    className={cx(
                        classes.labelRow,
                        shouldInlineExpand && classes.labelRowInline
                    )}
                >
                    <span className={classes.labelText}>{label}</span>
                    {callbacks !== undefined && shouldInlineExpand && (
                        <span className={classes.inlineActions}>
                            <span
                                role="button"
                                tabIndex={0}
                                aria-label={t("rename bookmark")}
                                className={classes.inlineActionButton}
                                onClick={event => {
                                    stopEvent(event);
                                    callbacks.onRename();
                                }}
                                onMouseDown={stopEvent}
                                onPointerDown={stopEvent}
                                onKeyDown={event => {
                                    if (event.key !== "Enter" && event.key !== " ") {
                                        return;
                                    }
                                    stopEvent(event);
                                    callbacks.onRename();
                                }}
                            >
                                <span
                                    className={`material-symbols-outlined ${classes.inlineActionIcon}`}
                                >
                                    edit
                                </span>
                            </span>
                            <span
                                role="button"
                                tabIndex={0}
                                aria-label={t("delete bookmark")}
                                className={classes.inlineActionButton}
                                onClick={event => {
                                    stopEvent(event);
                                    callbacks.onDelete();
                                }}
                                onMouseDown={stopEvent}
                                onPointerDown={stopEvent}
                                onKeyDown={event => {
                                    if (event.key !== "Enter" && event.key !== " ") {
                                        return;
                                    }
                                    stopEvent(event);
                                    callbacks.onDelete();
                                }}
                            >
                                <span
                                    className={`material-symbols-outlined ${classes.inlineActionIcon}`}
                                >
                                    delete
                                </span>
                            </span>
                        </span>
                    )}
                </span>
                {variant === "entryPoint" && (
                    <span className={classes.uriText} title={entryPointSubtitle}>
                        {entryPointSubtitle}
                    </span>
                )}
                {shouldInlineExpand && (
                    <span className={classes.inlinePath} title={fullS3Uri}>
                        {fullS3Uri}
                    </span>
                )}
            </span>
        </MuiLink>
    );

    if (variant !== "bar" || disableTooltip || shouldInlineExpand) {
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
                            aria-label={t("rename bookmark")}
                            className={classes.renameButton}
                            onClick={event => {
                                stopEvent(event);
                                callbacks.onRename();
                            }}
                            onMouseDown={stopEvent}
                            onPointerDown={stopEvent}
                            onKeyDown={event => {
                                if (event.key !== "Enter" && event.key !== " ") {
                                    return;
                                }
                                stopEvent(event);
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
                            aria-label={t("delete bookmark")}
                            className={classes.renameButton}
                            onClick={event => {
                                stopEvent(event);
                                callbacks.onDelete();
                            }}
                            onMouseDown={stopEvent}
                            onPointerDown={stopEvent}
                            onKeyDown={event => {
                                if (event.key !== "Enter" && event.key !== " ") {
                                    return;
                                }
                                stopEvent(event);
                                callbacks.onDelete();
                            }}
                        >
                            <span
                                className={`material-symbols-outlined ${classes.tooltipActionIcon}`}
                            >
                                delete
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
    .withParams<{
        isActive: boolean;
        isReadonly: boolean;
        variant: "bar" | "entryPoint";
    }>()
    .create(({ theme, isActive, isReadonly, variant }) => {
        const labelStyle = theme.typography.variants["label 1"].style;
        const captionStyle = theme.typography.variants["caption"].style;
        const inlineRevealHeight = 22;
        const isBar = variant === "bar";
        const isEntryPoint = variant === "entryPoint";
        const entryPointHoverBorderColor = theme.colors.useCases.surfaces.surface3;
        const entryPointFolderColor = theme.colors.useCases.typography.textTertiary;
        const accentColor = theme.colors.useCases.typography.textFocus;
        const baseBackground = isBar
            ? "transparent"
            : theme.colors.useCases.surfaces.surface2;
        const hoverBackground = theme.colors.useCases.surfaces.surface2;
        const pressedBackground = theme.colors.useCases.surfaces.surface2;
        const activeBackground = isBar
            ? "transparent"
            : theme.colors.useCases.surfaces.surface2;
        const activeHoverBackground = theme.colors.useCases.surfaces.surface2;
        const labelColor = isBar
            ? isActive
                ? theme.colors.useCases.typography.textPrimary
                : isReadonly
                  ? theme.colors.useCases.typography.textTertiary
                  : theme.colors.useCases.typography.textSecondary
            : theme.colors.useCases.typography.textPrimary;
        const labelFontWeight = isBar
            ? isActive
                ? 600
                : 500
            : isActive
              ? 600
              : labelStyle.fontWeight;
        const iconColor = isBar
            ? labelColor
            : isActive
              ? theme.colors.useCases.typography.textPrimary
              : theme.colors.useCases.typography.textSecondary;

        return {
            root: {
                display: "flex",
                flexDirection: "column",
                backgroundColor: isActive ? activeBackground : baseBackground,
                color: labelColor,
                boxSizing: "border-box",
                textDecoration: "none",
                transition:
                    "background-color 120ms ease, color 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
                position: "relative",
                border: isEntryPoint ? "2px solid transparent" : "1px solid transparent",
                "&:hover": {
                    backgroundColor: isActive ? activeHoverBackground : hoverBackground,
                    borderColor: isEntryPoint
                        ? entryPointHoverBorderColor
                        : theme.colors.useCases.surfaces.surface2,
                    boxShadow: isEntryPoint ? theme.shadows[4] : theme.shadows[2],
                    textDecoration: "none"
                },
                "&:focus-within, &:focus-visible": {
                    backgroundColor: isActive ? activeHoverBackground : hoverBackground,
                    borderColor: isEntryPoint
                        ? entryPointHoverBorderColor
                        : theme.colors.useCases.surfaces.surface2,
                    boxShadow: isEntryPoint ? theme.shadows[4] : theme.shadows[2]
                },
                "&:active": {
                    backgroundColor: pressedBackground,
                    textDecoration: "none"
                }
            },
            rootInline: {
                alignItems: "flex-start",
                "& .inlineActions": {
                    opacity: 0,
                    pointerEvents: "none",
                    transition: "opacity 120ms ease"
                },
                "& .inlinePath": {
                    maxHeight: 0,
                    opacity: 0,
                    marginTop: 0,
                    transition:
                        "max-height 160ms ease, opacity 160ms ease, margin-top 160ms ease"
                },
                "&:hover .inlineActions, &:focus-within .inlineActions": {
                    opacity: 1,
                    pointerEvents: "auto"
                },
                "&:hover .inlinePath, &:focus-within .inlinePath": {
                    maxHeight: inlineRevealHeight,
                    opacity: 1,
                    marginTop: theme.spacing(0.5)
                }
            },
            rootInlineActive: {
                "& .inlineActions": {
                    opacity: 1,
                    pointerEvents: "auto"
                },
                "& .inlinePath": {
                    maxHeight: inlineRevealHeight,
                    opacity: 1
                }
            },
            rootBar: {
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 9999,
                padding: "2px 8px",
                maxWidth: 300,
                flexShrink: 0,
                minWidth: 0,
                minHeight: 28,
                gap: theme.spacing(0.75)
            },
            rootEntryPoint: {
                alignItems: "flex-start",
                justifyContent: "flex-start",
                gap: theme.spacing(2),
                borderRadius: 16,
                padding: theme.spacing(5),
                minHeight: 148,
                width: 280,
                maxWidth: "100%",
                minWidth: 0,
                "& .entryPointMoreButton": {
                    opacity: 0,
                    pointerEvents: "none"
                },
                "&:hover .entryPointMoreButton, &:focus-within .entryPointMoreButton": {
                    opacity: 1,
                    pointerEvents: "auto"
                }
            },
            entryPointLeadingIconWrapper: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: entryPointFolderColor,
                marginBottom: theme.spacing(2)
            },
            entryPointLeadingIconWrapperCustom: {
                width: 32,
                height: 32,
                borderRadius: 12,
                backgroundColor: theme.colors.useCases.surfaces.surfaceFocus2,
                color: accentColor,
                "& svg, & img": {
                    width: 20,
                    height: 20,
                    fontSize: 20
                }
            },
            entryPointLeadingIcon: {
                width: 28,
                height: 28,
                "& svg, & img": {
                    width: 28,
                    height: 28
                }
            },
            entryPointActions: {
                position: "absolute",
                top: theme.spacing(5),
                right: theme.spacing(5),
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center"
            },
            entryPointMoreButton: {
                width: 32,
                height: 32,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.colors.useCases.typography.textPrimary,
                cursor: "pointer",
                transition: "opacity 120ms ease, background-color 120ms ease",
                "&:hover": {
                    backgroundColor: theme.colors.useCases.surfaces.surface2
                }
            },
            entryPointMoreIcon: {
                fontSize: 24,
                lineHeight: "24px",
                fontFamily: '"Material Symbols Outlined"',
                fontVariationSettings: '"FILL" 1, "wght" 500, "GRAD" 0, "opsz" 24'
            },
            entryPointMenu: {
                position: "absolute",
                top: theme.spacing(3),
                right: 0,
                zIndex: 2,
                minWidth: 156,
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(1),
                padding: theme.spacing(2),
                borderRadius: 14,
                backgroundColor: theme.colors.useCases.surfaces.surface1,
                color: theme.colors.useCases.typography.textPrimary,
                boxShadow: theme.shadows[4]
            },
            entryPointMenuItem: {
                ...labelStyle,
                minHeight: 32,
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(1.5),
                padding: `${theme.spacing(0.5)}px ${theme.spacing(1)}px`,
                borderRadius: 10,
                cursor: "pointer",
                "&:hover, &:focus-visible": {
                    backgroundColor: theme.colors.useCases.surfaces.surface2,
                    outline: "none"
                }
            },
            entryPointMenuIcon: {
                fontSize: 18,
                lineHeight: "18px",
                fontFamily: '"Material Symbols Outlined"',
                fontVariationSettings: '"FILL" 1, "wght" 500, "GRAD" 0, "opsz" 24'
            },
            pinIconWrapper: {
                color: iconColor,
                width: 18,
                height: 18,
                borderRadius: 8,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                flexShrink: 0
            },
            pinIcon: {
                fontSize: 16,
                lineHeight: "16px",
                fontFamily: '"Material Symbols Outlined"',
                fontVariationSettings: `"FILL" ${isActive ? 1 : 0}, "wght" ${
                    isActive ? 600 : 400
                }, "GRAD" 0, "opsz" 24`
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
                gap: isBar ? 0 : theme.spacing(0.5)
            },
            labelWrapperEntryPoint: {
                flex: "0 0 auto",
                marginTop: "auto",
                gap: theme.spacing(1)
            },
            labelRow: {
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(1),
                minWidth: 0,
                width: "100%"
            },
            labelRowInline: {
                alignItems: "flex-start"
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
                color: labelColor,
                fontWeight: labelFontWeight
            },
            uriText: {
                ...captionStyle,
                color: theme.colors.useCases.typography.textSecondary,
                display: "block",
                maxWidth: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
            },
            inlineActions: {
                display: "inline-flex",
                alignItems: "center",
                gap: theme.spacing(0.5),
                flexShrink: 0
            },
            inlineActionButton: {
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
                transition: "opacity 120ms ease",
                "&:hover": {
                    backgroundColor: theme.colors.palette.focus.mainAlpha20
                }
            },
            inlineActionIcon: {
                fontSize: 16,
                lineHeight: "16px",
                fontFamily: '"Material Symbols Outlined"',
                fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24'
            },
            inlinePath: {
                ...captionStyle,
                color: theme.colors.useCases.typography.textSecondary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block"
            },
            tooltip: {
                backgroundColor: theme.colors.useCases.surfaces.surface1,
                color: theme.colors.useCases.typography.textPrimary,
                boxShadow: theme.shadows[1],
                borderRadius: 10,
                padding: theme.spacing(2),
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
                gap: theme.spacing(3),
                minWidth: 0
            },
            tooltipLabel: {
                ...labelStyle,
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
                marginLeft: theme.spacing(4),
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

const { i18n } = declareComponentKeys<
    | "open bookmark"
    | "open bucket"
    | "bookmark actions"
    | "rename"
    | "delete"
    | "rename bookmark"
    | "delete bookmark"
>()({ S3BookmarkItem });
export type S3BookmarkItemI18n = typeof i18n;
