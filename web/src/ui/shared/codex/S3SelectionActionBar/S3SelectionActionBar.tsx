import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { getIconUrlByName, getIconUrl } from "lazy-icons";
import { Icon } from "onyxia-ui/Icon";
import MuiTooltip from "@mui/material/Tooltip";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";

export type S3SelectionActionBarProps = {
    className?: string;
    selectionCount: number;
    /** Function to clear the selection and hide the selection action bar */
    onClear: () => void;
    download:
        | {
              callback: () => void;
          }
        | undefined;
    delete:
        | {
              callback: () => void;
          }
        | undefined;
    copyS3Uri:
        | {
              s3UriStr: string;
              callback: () => void;
          }
        | undefined;
    bookmark:
        | {
              callback: () => void;
              isBookmarked: boolean;
          }
        | undefined;
    share:
        | {
              callback: () => void;
          }
        | undefined;
    accessPolicy:
        | {
              callback: () => void;
              isPublic: boolean;
          }
        | undefined;
};

type Action = {
    key: string;
    label: string;
    icon: ReactElement;
    onClick: () => void;
    tooltipTitle?: ReactNode;
    tooltipClassName?: string;
    isActive?: boolean;
};

type OptionalAction = Omit<Action, "onClick"> & {
    onClick: (() => void) | undefined;
};

export function S3SelectionActionBar(props: S3SelectionActionBarProps) {
    const {
        className,
        selectionCount,
        onClear,
        download,
        delete: deleteAction,
        copyS3Uri,
        bookmark,
        share,
        accessPolicy
    } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation({ S3SelectionActionBar });
    const [isS3UriCopied, setIsS3UriCopied] = useState(false);

    useEffect(() => {
        setIsS3UriCopied(false);
    }, [copyS3Uri?.s3UriStr]);

    useEffect(() => {
        if (!isS3UriCopied) {
            return;
        }

        const timeoutId = window.setTimeout(() => setIsS3UriCopied(false), 1400);

        return () => window.clearTimeout(timeoutId);
    }, [isS3UriCopied]);

    const copiedTooltipTitle = (
        <span className={classes.copiedTooltip}>
            <Icon
                className={classes.copiedTooltipIcon}
                icon={getIconUrlByName("Check")}
                size="extra small"
            />
            {t("copied")}
        </span>
    );

    const actionCandidates: OptionalAction[] = [
        {
            key: "download",
            label: t("download"),
            icon: (
                <Icon
                    className={classes.actionIcon}
                    icon={getIconUrl("FileDownload")}
                    size="small"
                />
            ),
            onClick: download?.callback
        },
        {
            key: "delete",
            label: t("delete"),
            icon: (
                <Icon
                    className={classes.actionIcon}
                    icon={getIconUrl("Delete")}
                    size="small"
                />
            ),
            onClick: deleteAction?.callback
        },
        {
            key: "copy",
            label: t("copy s3 uri"),
            icon: (
                <Icon
                    className={classes.actionIcon}
                    icon={getIconUrl("ContentCopy")}
                    size="small"
                />
            ),
            onClick:
                copyS3Uri === undefined
                    ? undefined
                    : () => {
                          setIsS3UriCopied(true);
                          copyS3Uri.callback();
                      },
            tooltipTitle:
                copyS3Uri === undefined ? undefined : isS3UriCopied ? (
                    copiedTooltipTitle
                ) : (
                    <span className={classes.copyTooltip}>
                        {t("copy s3 uri tooltip", {
                            s3UriStr: copyS3Uri.s3UriStr
                        })}
                    </span>
                ),
            tooltipClassName: classes.copyTooltipBubble
        },
        {
            key: "bookmark",
            label:
                bookmark?.isBookmarked === true
                    ? t("delete from bookmarks")
                    : t("add to bookmarks"),
            icon:
                bookmark?.isBookmarked === true ? (
                    <StarIcon className={classes.actionIcon} fontSize="small" />
                ) : (
                    <StarBorderIcon className={classes.actionIcon} fontSize="small" />
                ),
            onClick: bookmark?.callback,
            isActive: bookmark?.isBookmarked === true
        },
        {
            key: "share",
            label: t("share"),
            icon: (
                <Icon
                    className={classes.actionIcon}
                    icon={getIconUrl("Share")}
                    size="small"
                />
            ),
            onClick: share?.callback
        },
        {
            key: "access-policy",
            label: accessPolicy?.isPublic === true ? t("make private") : t("make public"),
            icon: (
                <Icon
                    className={classes.actionIcon}
                    icon={getIconUrl(
                        accessPolicy?.isPublic === true ? "PublicOff" : "Public"
                    )}
                    size="small"
                />
            ),
            onClick: accessPolicy?.callback
        }
    ];

    const actions = actionCandidates.filter(
        (action): action is Action => action.onClick !== undefined
    );

    const selectedLabel =
        selectionCount === 1
            ? t("one selected")
            : t("many selected", { count: selectionCount });

    if (selectionCount === 0) {
        return null;
    }

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.summaryPill}>
                <button
                    type="button"
                    className={classes.clearButton}
                    onClick={onClear}
                    aria-label={t("clear selection")}
                >
                    <Icon icon={getIconUrlByName("Close")} size="extra small" />
                </button>
                <span className={classes.summaryLabel}>{selectedLabel}</span>
            </div>
            <div className={classes.actions}>
                {actions.map(action => {
                    const button = (
                        <button
                            type="button"
                            className={classes.actionButton}
                            onClick={action.onClick}
                        >
                            <span
                                className={cx(
                                    classes.actionIconFrame,
                                    action.isActive && classes.actionIconFrameActive
                                )}
                            >
                                {action.icon}
                            </span>
                            <span className={classes.actionLabel}>{action.label}</span>
                        </button>
                    );

                    if (action.tooltipTitle === undefined) {
                        return <span key={action.key}>{button}</span>;
                    }

                    return (
                        <MuiTooltip
                            key={action.key}
                            title={
                                <span className={classes.tooltipText}>
                                    {action.tooltipTitle}
                                </span>
                            }
                            classes={{
                                tooltip: cx(
                                    classes.tooltipBubble,
                                    action.tooltipClassName
                                )
                            }}
                        >
                            <span className={classes.tooltipAnchor}>{button}</span>
                        </MuiTooltip>
                    );
                })}
            </div>
        </div>
    );
}

const useStyles = tss.withName({ S3SelectionActionBar }).create(({ theme }) => {
    const label1Style = theme.typography.variants["label 1"].style;
    const accentColor = theme.colors.useCases.buttons.actionActive;

    return {
        root: {
            display: "flex",
            alignItems: "center",
            width: "100%",
            minHeight: theme.spacing(6),
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: theme.spacing(1),
            paddingRight: theme.spacing(1),
            borderRadius: 9999,
            backgroundColor: theme.colors.useCases.surfaces.background,
            boxShadow: theme.shadows[3],
            boxSizing: "border-box",
            gap: theme.spacing(7),
            minWidth: 0
        },
        summaryPill: {
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(2),
            padding: theme.spacing(1),
            borderRadius: 9999,
            backgroundColor: "transparent",
            color: theme.colors.useCases.typography.textPrimary,
            border: `1px solid ${theme.colors.useCases.typography.textFocus}`,
            minWidth: 0,
            paddingRight: theme.spacing(4),
            "&:hover": {
                backgroundColor: "transparent"
            }
        },
        clearButton: {
            border: "none",
            background: "transparent",
            width: 24,
            height: 24,
            borderRadius: 9999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            cursor: "pointer",
            color: "inherit",
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1,
                color: theme.colors.useCases.typography.textFocus
            }
        },
        summaryLabel: {
            ...label1Style,
            whiteSpace: "nowrap"
        },
        actions: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1.5),
            flexWrap: "nowrap",
            minWidth: 0
        },
        tooltipAnchor: {
            display: "inline-flex",
            flexShrink: 0
        },
        actionButton: {
            border: "none",
            background: "transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(1),
            padding: theme.spacing(1.5),
            borderRadius: 9999,
            cursor: "pointer",
            color: theme.colors.useCases.typography.textPrimary,
            transition: "background-color 120ms ease, color 120ms ease",
            paddingRight: theme.spacing(3.5),
            paddingLeft: theme.spacing(3),
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface3
            },
            "&:active": {
                backgroundColor: theme.colors.useCases.surfaces.surface2
            }
        },
        actionIconFrame: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 8,
            flexShrink: 0
        },
        actionIconFrameActive: {
            backgroundColor: theme.colors.palette.focus.mainAlpha10,
            color: accentColor,
            "&:hover": {
                backgroundColor: theme.colors.palette.focus.mainAlpha20
            },
            "& .MuiSvgIcon-root, & img, & svg, & path": {
                color: accentColor,
                fill: accentColor
            }
        },
        actionIcon: {
            color: "currentColor",
            flexShrink: 0
        },
        actionLabel: {
            ...label1Style,
            whiteSpace: "nowrap"
        },
        copiedTooltip: {
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(0.75),
            color: theme.colors.useCases.alertSeverity.success.main,
            lineHeight: 1
        },
        copiedTooltipIcon: {
            color: "currentColor",
            flexShrink: 0
        },
        tooltipText: {
            ...theme.typography.variants.caption.style,
            color: theme.colors.palette.light.light,
            display: "inline-flex",
            alignItems: "center",
            lineHeight: 1
        },
        tooltipBubble: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
            padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
            lineHeight: 1,
            boxSizing: "border-box",
            "& > *": {
                display: "inline-flex",
                alignItems: "center",
                lineHeight: 1
            }
        },
        copyTooltipBubble: {
            maxWidth: "calc(100vw - 32px)"
        },
        copyTooltip: {
            display: "inline-flex",
            alignItems: "baseline",
            gap: theme.spacing(0.75),
            maxWidth: "calc(100vw - 64px)",
            whiteSpace: "nowrap",
            overflowX: "auto",
            overflowY: "hidden"
        }
    };
});

const { i18n } = declareComponentKeys<
    | "download"
    | "delete"
    | "copy s3 uri"
    | "copied"
    | { K: "copy s3 uri tooltip"; P: { s3UriStr: string }; R: string }
    | "add to bookmarks"
    | "delete from bookmarks"
    | "share"
    | "make public"
    | "make private"
    | "one selected"
    | { K: "many selected"; P: { count: number }; R: string }
    | "clear selection"
>()({ S3SelectionActionBar });
export type I18n = typeof i18n;
