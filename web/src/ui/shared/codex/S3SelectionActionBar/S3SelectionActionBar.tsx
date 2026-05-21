import { getIconUrlByName, getIconUrl } from "lazy-icons";
import { Icon } from "onyxia-ui/Icon";
import { tss } from "tss";

export type S3SelectionActionBarProps = {
    className?: string;
    selectionCount: number;
    /** Function to clear the selection and hide the selection action bar */
    onClear: () => void;
    onDownload: (() => void) | undefined;
    onDelete: (() => void) | undefined;
    onCopyS3Uri: (() => void) | undefined;
    isCopyS3UriCopied?: boolean;
    onBookmark: (() => void) | undefined;
    bookmarkLabel?: string;
    onShare: (() => void) | undefined;
    onMakePublic: (() => void) | undefined;
    onMakePrivate: (() => void) | undefined;
};

type Action = {
    key: string;
    label: string;
    iconName: string;
    onClick: () => void;
};

export function S3SelectionActionBar(props: S3SelectionActionBarProps) {
    const {
        className,
        selectionCount,
        onClear,
        onDownload,
        onDelete,
        onCopyS3Uri,
        isCopyS3UriCopied = false,
        onBookmark,
        bookmarkLabel = "Add to bookmarks",
        onShare,
        onMakePublic,
        onMakePrivate
    } = props;

    const { classes, cx } = useStyles();

    const actions = [
        {
            key: "download",
            label: "Download",
            iconName: "FileDownload",
            onClick: onDownload
        },
        {
            key: "delete",
            label: "Delete",
            iconName: "Delete",
            onClick: onDelete
        },
        {
            key: "copy",
            label: isCopyS3UriCopied ? "Copied" : "Copy S3 path",
            iconName: isCopyS3UriCopied ? "Check" : "ContentCopy",
            onClick: onCopyS3Uri
        },
        {
            key: "bookmark",
            label: bookmarkLabel,
            iconName: "StarBorder",
            onClick: onBookmark
        },
        {
            key: "share",
            label: "Share",
            iconName: "Share",
            onClick: onShare
        },
        {
            key: "make-public",
            label: "Make public",
            iconName: "Public",
            onClick: onMakePublic
        },
        {
            key: "make-private",
            label: "Make private",
            iconName: "PublicOff",
            onClick: onMakePrivate
        }
    ].filter((action): action is Action => action.onClick !== undefined);

    const selectedLabel =
        selectionCount === 1 ? "1 selected" : `${selectionCount} selected`;

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
                    aria-label="Clear selection"
                >
                    <Icon icon={getIconUrlByName("Close")} size="extra small" />
                </button>
                <span className={classes.summaryLabel}>{selectedLabel}</span>
            </div>
            <div className={classes.actions}>
                {actions.map(action => (
                    <button
                        key={action.key}
                        type="button"
                        className={cx(
                            classes.actionButton,
                            action.key === "copy" &&
                                isCopyS3UriCopied &&
                                classes.actionButtonCopied
                        )}
                        onClick={action.onClick}
                    >
                        <Icon
                            className={classes.actionIcon}
                            icon={getIconUrl(action.iconName)}
                            size="small"
                        />
                        <span className={classes.actionLabel}>{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

const useStyles = tss.withName({ S3SelectionActionBar }).create(({ theme }) => {
    const label1Style = theme.typography.variants["label 1"].style;

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
        actionButtonCopied: {
            backgroundColor: theme.colors.useCases.alertSeverity.success.background,
            "&:hover": {
                backgroundColor: theme.colors.useCases.alertSeverity.success.background
            },
            "&:active": {
                backgroundColor: theme.colors.useCases.alertSeverity.success.background
            }
        },
        actionIcon: {
            color: "currentColor",
            flexShrink: 0
        },
        actionLabel: {
            ...label1Style,
            whiteSpace: "nowrap"
        }
    };
});
