import { useEffect } from "react";
import { alpha } from "@mui/material/styles";
import { tss } from "tss";
import { Tooltip } from "onyxia-ui/Tooltip";

export type BookmarkChipProps = {
    label: string;
    path: string;
    active?: boolean;
    onNavigate: (path: string) => void;
    onUnpin?: (path: string) => void;
};

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

export function BookmarkChip(props: BookmarkChipProps) {
    const { label, path, active = false, onNavigate, onUnpin } = props;

    useEffect(() => {
        ensureMaterialSymbols();
    }, []);

    const { classes } = useStyles({ active, isUnpinDisabled: !onUnpin });

    return (
        <div className={classes.container}>
            <Tooltip title="Unpin">
                <div className={classes.pinWrapper}>
                    <button
                        type="button"
                        aria-label="Unpin bookmark"
                        aria-disabled={!onUnpin}
                        onClick={() => onUnpin?.(path)}
                        className={classes.pinButton}
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
                    </button>
                </div>
            </Tooltip>
            <Tooltip title={label}>
                <div className={classes.labelWrapper}>
                    <button
                        type="button"
                        aria-current={active ? "true" : undefined}
                        data-active={active ? "true" : undefined}
                        onClick={() => onNavigate(path)}
                        className={classes.chip}
                    >
                        <span className={classes.labelText}>{label}</span>
                    </button>
                </div>
            </Tooltip>
        </div>
    );
}

const useStyles = tss
    .withName({ BookmarkChip })
    .withParams<{ active: boolean; isUnpinDisabled: boolean }>()
    .create(({ theme, active, isUnpinDisabled }) => {
        const accent = theme.colors.useCases.buttons.actionActive;
        const baseBackground = alpha(accent, 0.1);
        const hoverBackground = alpha(accent, 0.14);
        const activeBackground = alpha(accent, 0.2);
        const inactiveText = theme.colors.useCases.typography.textPrimary;
        const activeText = inactiveText;

        return {
            container: {
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: active ? activeBackground : baseBackground,
                color: active ? activeText : inactiveText,
                borderRadius: 999,
                padding: "8px 16px 8px 12px",
                fontSize: theme.typography.variants["label 1"].style.fontSize,
                lineHeight: theme.typography.variants["label 1"].style.lineHeight,
                fontFamily: theme.typography.variants["label 1"].style.fontFamily,
                fontWeight: active
                    ? 600
                    : theme.typography.variants["label 1"].style.fontWeight,
                transition: "background-color 120ms ease",
                maxWidth: 300,
                flexShrink: 0,
                flexWrap: "nowrap",
                overflow: "hidden",
                minWidth: 0,
                "&:hover": {
                    backgroundColor: active ? alpha(accent, 0.24) : hoverBackground
                }
            },
            pinWrapper: {
                display: "inline-flex",
                alignItems: "center"
            },
            labelWrapper: {
                flex: "1 1 auto",
                minWidth: 0,
                overflow: "hidden"
            },
            chip: {
                display: "inline-flex",
                alignItems: "center",
                border: "none",
                background: "transparent",
                color: "inherit",
                padding: 0,
                font: "inherit",
                cursor: "pointer",
                maxWidth: "100%",
                minWidth: 0,
                overflow: "hidden"
            },
            labelText: {
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
            },
            pinButton: {
                border: "none",
                background: "transparent",
                color: "inherit",
                cursor: isUnpinDisabled ? "default" : "pointer",
                width: 20,
                height: 20,
                borderRadius: 6,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                opacity: isUnpinDisabled ? 0.4 : 1,
                "&:hover": {
                    backgroundColor: isUnpinDisabled
                        ? "transparent"
                        : alpha(accent, theme.isDarkModeEnabled ? 0.3 : 0.2)
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
            }
        };
    });

// TODO: Tune alpha values once the final accent palette is confirmed.
