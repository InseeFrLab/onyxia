import { alpha } from "@mui/material/styles";
import { tss } from "tss";
import { useEffect } from "react";
import { Tooltip } from "onyxia-ui/Tooltip";
import { BucketTypeChip } from "./BucketTypeChip";
import type { BucketType } from "./types";

const materialSymbolsHref =
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap";
const s3Scheme = "s3://";

function normalizeS3Path(value: string): string {
    if (value.startsWith(s3Scheme)) {
        return value;
    }

    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) {
        return value;
    }

    return `${s3Scheme}${value.replace(/^\/+/, "")}`;
}

function formatS3DisplayPath(value: string): string {
    if (!value.startsWith(s3Scheme)) {
        return value;
    }

    if (value === s3Scheme) {
        return value;
    }

    const match = /^s3:\/\/([^/]+)(?:\/(.*))?$/.exec(value);

    if (!match) {
        return value;
    }

    const bucket = match[1];
    const rest = match[2] ?? "";
    const hasTrailingSlash = value.endsWith("/") && value !== s3Scheme;

    if (rest === "") {
        return hasTrailingSlash ? `${s3Scheme}${bucket}/` : `${s3Scheme}${bucket}`;
    }

    const trimmedRest = rest.replace(/\/$/, "");
    const parts = trimmedRest.split("/").filter(Boolean);

    if (parts.length <= 2) {
        const base = `${s3Scheme}${bucket}/${parts.join("/")}`;
        return hasTrailingSlash ? `${base}/` : base;
    }

    const tail = parts.slice(-2).join("/");
    return `${s3Scheme}${bucket}/.../${tail}${hasTrailingSlash ? "/" : ""}`;
}

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

export type BookmarkRowItemProps = {
    label: string;
    path: string;
    subLabel?: string;
    bucketType?: BucketType;
    onSelect?: (path: string) => void;
    onUnpin?: (path: string) => void;
    active?: boolean;
    variant?: "pinned" | "bucket";
};

export function BookmarkRowItem(props: BookmarkRowItemProps) {
    const {
        label,
        path,
        subLabel,
        bucketType,
        onSelect,
        onUnpin,
        active = false,
        variant = "bucket"
    } = props;
    const { classes } = useStyles({ active, variant });
    const rawPath = subLabel && subLabel.trim() !== "" ? subLabel : path;
    const normalizedPath = normalizeS3Path(rawPath);
    const displayPath = formatS3DisplayPath(normalizedPath);

    useEffect(() => {
        ensureMaterialSymbols();
    }, []);

    return (
        <div className={classes.root}>
            <button
                type="button"
                onClick={() => onSelect?.(path)}
                aria-current={active ? "true" : undefined}
                className={classes.mainButton}
            >
                {bucketType && (
                    <span className={classes.tagWrapper}>
                        <BucketTypeChip type={bucketType} />
                    </span>
                )}
                <span className={classes.textBlock}>
                    <span className={classes.label} title={label}>
                        {label}
                    </span>
                    <span className={classes.path} title={path}>
                        {displayPath}
                    </span>
                </span>
            </button>
            {onUnpin && (
                <Tooltip title="Unpin">
                    <div>
                        <button
                            type="button"
                            aria-label="Unpin"
                            onClick={event => {
                                event.stopPropagation();
                                onUnpin(path);
                            }}
                            className={classes.unpinButton}
                        >
                            <span
                                className={`material-symbols-outlined ${classes.unpinIcon} pinIconDefault`}
                            >
                                keep
                            </span>
                            <span
                                className={`material-symbols-outlined ${classes.unpinIcon} pinIconHover`}
                            >
                                keep_off
                            </span>
                        </button>
                    </div>
                </Tooltip>
            )}
        </div>
    );
}

// TODO: Add icons and keyboard focus styles.

const useStyles = tss
    .withName({ BookmarkRowItem })
    .withParams<{ active: boolean; variant: "pinned" | "bucket" }>()
    .create(({ theme, active, variant }) => {
        const accent = theme.colors.useCases.buttons.actionActive;
        const baseBackground =
            variant === "pinned"
                ? alpha(accent, 0.1)
                : theme.colors.useCases.surfaces.surface1;
        const activeBackground =
            variant === "pinned"
                ? alpha(accent, 0.2)
                : theme.colors.useCases.buttons.actionSelected;
        return {
            root: {
                position: "relative",
                borderRadius: 24,
                backgroundColor: active ? activeBackground : baseBackground,
                transition: "background-color 0.2s ease, border-color 0.2s ease",
                width: "100%",
                height: 162,
                boxSizing: "border-box",
                border: "2px solid transparent",
                boxShadow: "none",
                "&:hover": {
                    borderColor: variant === "pinned" ? "#FFAC80" : "#D0D4DA",
                    boxShadow: theme.shadows[1]
                }
            },
            mainButton: {
                width: "100%",
                height: "100%",
                border: "none",
                background: "transparent",
                color: "inherit",
                padding: 24,
                cursor: "pointer",
                textAlign: "left",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                gap: 0,
                "&:hover": {
                    borderRadius: 24
                },
                "&:focus-visible": {
                    outline: `2px solid ${theme.colors.useCases.typography.textFocus}`,
                    outlineOffset: 3,
                    borderRadius: 24
                }
            },
            tagWrapper: {
                position: "absolute",
                top: 24,
                right: 24
            },
            textBlock: {
                display: "flex",
                flexDirection: "column",
                gap: 0,
                width: "100%",
                minWidth: 0
            },
            label: {
                fontWeight: active
                    ? 600
                    : theme.typography.variants["object heading"].style.fontWeight,
                fontSize: theme.typography.variants["object heading"].style.fontSize,
                lineHeight: theme.typography.variants["object heading"].style.lineHeight,
                fontFamily: theme.typography.variants["object heading"].style.fontFamily,
                color: theme.colors.useCases.typography.textPrimary,
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
            },
            path: {
                fontWeight: theme.typography.variants["label 1"].style.fontWeight,
                fontSize: theme.typography.variants["label 1"].style.fontSize,
                lineHeight: theme.typography.variants["label 1"].style.lineHeight,
                fontFamily: theme.typography.variants["label 1"].style.fontFamily,
                color: theme.colors.useCases.typography.textSecondary,
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
            },
            unpinButton: {
                position: "absolute",
                top: 24,
                right: 24,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: 6,
                "&:hover": {
                    color: theme.colors.useCases.buttons.actionActive,
                    backgroundColor: alpha(accent, theme.isDarkModeEnabled ? 0.3 : 0.2)
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
            unpinIcon: {
                fontSize: 24,
                lineHeight: "24px",
                color: theme.colors.useCases.typography.textPrimary,
                fontFamily: '"Material Symbols Outlined"',
                fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24'
            }
        };
    });
