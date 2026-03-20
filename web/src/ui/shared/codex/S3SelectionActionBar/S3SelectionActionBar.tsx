import type { S3Uri } from "core/tools/S3Uri";
import { getIconUrlByName } from "lazy-icons";
import { Icon } from "onyxia-ui/Icon";
import { tss } from "tss";

export type S3SelectionActionBarProps = {
    className?: string;
    /** When mounted there is at least one item in the list */
    selectedS3Uris: S3Uri[];
    /** Function to clear the selection and hide the selection action bar */
    onClear: () => void;
    /** Always visible */
    onDownload: () => void;
    onDelete: () => void;
    /** Only visible when only one item is selected */
    onCopyS3Uri: () => void;
    /** Only visible when selectedS3Uris contains one element
     *  and this element is of type S3Uri.NonTerminatedByDelimiter */
    onShare: () => void;
    /** Only visible when one element is selected */
    onRename: () => void;
};

type Action = {
    key: string;
    label: string;
    iconName: string;
    onClick: () => void;
    isVisible: boolean;
};

export function S3SelectionActionBar(props: S3SelectionActionBarProps) {
    const {
        className,
        selectedS3Uris,
        onClear,
        onDownload,
        onDelete,
        onCopyS3Uri,
        onShare,
        onRename
    } = props;

    if (selectedS3Uris.length === 0) {
        return null;
    }

    const { classes, cx } = useStyles();

    const isSingleSelection = selectedS3Uris.length === 1;
    const canShare =
        isSingleSelection && selectedS3Uris[0].isDelimiterTerminated === false;

    const actions: Action[] = [
        {
            key: "download",
            label: "Download",
            iconName: "FileDownload",
            onClick: onDownload,
            isVisible: true
        },
        {
            key: "delete",
            label: "Delete",
            iconName: "Delete",
            onClick: onDelete,
            isVisible: true
        },
        {
            key: "copy",
            label: "Copy S3 path",
            iconName: "ContentCopy",
            onClick: onCopyS3Uri,
            isVisible: isSingleSelection
        },
        {
            key: "share",
            label: "Share",
            iconName: "Share",
            onClick: onShare,
            isVisible: canShare
        },
        {
            key: "rename",
            label: "Rename",
            iconName: "Edit",
            onClick: onRename,
            isVisible: isSingleSelection
        }
    ];

    const selectedLabel =
        selectedS3Uris.length === 1 ? "1 selected" : `${selectedS3Uris.length} selected`;

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
                {actions
                    .filter(action => action.isVisible)
                    .map(action => (
                        <button
                            key={action.key}
                            type="button"
                            className={classes.actionButton}
                            onClick={action.onClick}
                        >
                            <Icon
                                className={classes.actionIcon}
                                icon={getIconUrlByName(action.iconName)}
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
    const label2Style = theme.typography.variants["label 2"].style;
    const barHeight = "56px";

    return {
        root: {
            display: "flex",
            alignItems: "center",
            width: "100%",
            height: barHeight,
            padding: `0 ${theme.spacing(2)}`,
            borderRadius: 9999,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            boxSizing: "border-box",
            gap: theme.spacing(2),
            minWidth: 0
        },
        summaryPill: {
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(2),
            padding: `${theme.spacing(0.5)} ${theme.spacing(1.5)}`,
            borderRadius: 9999,
            backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1,
            color: theme.colors.useCases.typography.textPrimary,
            minWidth: 0
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
                backgroundColor: theme.colors.useCases.surfaces.surfaceFocus1
            }
        },
        summaryLabel: {
            ...label2Style,
            whiteSpace: "nowrap"
        },
        actions: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1.5),
            marginLeft: "auto",
            flexWrap: "nowrap",
            minWidth: 0
        },
        actionButton: {
            border: "none",
            background: "transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(1),
            padding: `${theme.spacing(0.5)} ${theme.spacing(1.5)}`,
            borderRadius: 9999,
            cursor: "pointer",
            color: theme.colors.useCases.typography.textPrimary,
            transition: "background-color 120ms ease, color 120ms ease",
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface3
            },
            "&:active": {
                backgroundColor: theme.colors.useCases.surfaces.surface3,
                color: theme.colors.useCases.typography.textFocus
            }
        },
        actionIcon: {
            color: "currentColor",
            flexShrink: 0
        },
        actionLabel: {
            ...label2Style,
            whiteSpace: "nowrap"
        }
    };
});
