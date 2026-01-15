import { memo, type ReactNode, useEffect, useRef, useState } from "react";
import { tss } from "tss";
import { Icon } from "onyxia-ui/Icon";
import { IconButton } from "onyxia-ui/IconButton";
import { Tooltip } from "onyxia-ui/Tooltip";
import { getIconUrlByName } from "lazy-icons";

export type S3ExplorerToolbarProps = {
    className?: string;
    /**
     * Initial path shown in the input. When this value changes, it overwrites any
     * in-progress edits; pressing Escape also restores this value.
     */
    defaultPath: string;
    /** Fired when the user presses Enter in the path input. */
    onPathSubmit?: (path: string) => void;
    /** Placeholder displayed when the path is empty. */
    pathPlaceholder?: string;
    /** Accessible label for the path input when no visible label is used. */
    pathInputAriaLabel?: string;
    /** Force the input to be read-only and disable editing. */
    isPathReadOnly?: boolean;
    /** Icon shown at the start of the path input. Set to null to hide. */
    pathStartIcon?: string | null;
    /** Action rendered inside the path input, typically used for bookmarking. */
    pathAction?: S3ExplorerToolbarProps.InlineAction;
    /** Actions rendered before the path input (ex: back, refresh). */
    leadingActions?: S3ExplorerToolbarProps.Action[];
    /** Actions rendered after the path input (ex: create folder, upload). */
    trailingActions?: S3ExplorerToolbarProps.Action[];
};

export namespace S3ExplorerToolbarProps {
    export type ActionBase = {
        /** Icon URL from getIconUrlByName or a custom icon URL. */
        icon: string;
        /** Label used for aria-label and optional tooltips. */
        label: string;
        /** Callback invoked on click. */
        onClick: () => void;
        /** Disable the action when it is not available. */
        isDisabled?: boolean;
        /** Optional tooltip content shown on hover. */
        tooltip?: ReactNode;
    };

    /** Action rendered outside of the input. */
    export type Action = ActionBase & {
        /** Stable id used for rendering lists. */
        id: string;
    };

    /** Action rendered inside the input. */
    export type InlineAction = ActionBase;
}

export const S3ExplorerToolbar = memo((props: S3ExplorerToolbarProps) => {
    const {
        className,
        defaultPath,
        onPathSubmit,
        pathPlaceholder,
        pathInputAriaLabel,
        isPathReadOnly,
        pathStartIcon = getIconUrlByName("Folder"),
        pathAction,
        leadingActions,
        trailingActions
    } = props;

    const { classes, cx } = useStyles();

    const [pathValue, setPathValue] = useState(defaultPath);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPathValue(defaultPath);
    }, [defaultPath]);

    const renderActionButton = (
        action: S3ExplorerToolbarProps.ActionBase,
        params?: {
            variant?: "inline" | "standalone";
        }
    ) => {
        const { variant = "standalone" } = params ?? {};

        const button = (
            <IconButton
                className={
                    variant === "standalone"
                        ? classes.actionButton
                        : classes.inlineActionButton
                }
                icon={action.icon}
                onClick={action.onClick}
                disabled={action.isDisabled ?? false}
                aria-label={action.label}
            />
        );

        if (action.tooltip === undefined) {
            return button;
        }

        return (
            <Tooltip title={action.tooltip}>
                <span className={classes.tooltipWrapper}>{button}</span>
            </Tooltip>
        );
    };

    const isReadOnly = isPathReadOnly ?? false;

    return (
        <div className={cx(classes.root, className)}>
            {leadingActions && leadingActions.length > 0 && (
                <div className={classes.actionGroup}>
                    {leadingActions.map(action => (
                        <div key={action.id}>{renderActionButton(action)}</div>
                    ))}
                </div>
            )}

            <div className={classes.pathField}>
                <div
                    className={classes.pathContainer}
                    onClick={() => inputRef.current?.focus()}
                >
                    {pathStartIcon !== null && (
                        <Icon
                            className={classes.pathIcon}
                            icon={pathStartIcon}
                            size="small"
                        />
                    )}
                    <input
                        ref={inputRef}
                        className={classes.pathInput}
                        value={pathValue}
                        onChange={event => setPathValue(event.target.value)}
                        onKeyDown={event => {
                            if (event.key === "Escape") {
                                setPathValue(defaultPath);
                                event.preventDefault();
                                return;
                            }

                            if (event.key !== "Enter" || onPathSubmit === undefined) {
                                return;
                            }

                            const value = event.currentTarget.value;
                            setPathValue(value);
                            onPathSubmit(value);
                        }}
                        placeholder={pathPlaceholder}
                        readOnly={isReadOnly}
                        spellCheck={false}
                        autoComplete="off"
                        aria-label={pathInputAriaLabel ?? pathPlaceholder ?? "S3 path"}
                    />
                    {pathAction !== undefined && (
                        <div className={classes.inlineAction}>
                            {renderActionButton(pathAction, { variant: "inline" })}
                        </div>
                    )}
                </div>
            </div>

            {trailingActions && trailingActions.length > 0 && (
                <div className={classes.actionGroup}>
                    {trailingActions.map(action => (
                        <div key={action.id}>{renderActionButton(action)}</div>
                    ))}
                </div>
            )}
        </div>
    );
});

const useStyles = tss
    .withName({ S3ExplorerToolbar })
    .withNestedSelectors<"pathIcon">()
    .create(({ theme, classes }) => {
        const controlHeight =
            theme.iconSizesInPxByName.default + 2 * (theme.spacing(2) - 2);

        const actionButtonBase = {
            width: controlHeight,
            height: controlHeight,
            padding: 0,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        };

        return {
            root: {
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(2)
            },
            actionGroup: {
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(1),
                height: controlHeight
            },
            pathField: {
                flex: 1,
                minWidth: 220
            },
            pathContainer: {
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: theme.shadows[1],
                backgroundColor: theme.colors.useCases.surfaces.surface1,
                border: "solid 2px transparent",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                height: controlHeight,
                "&:hover": {
                    borderBottomColor: theme.colors.useCases.buttons.actionActive
                },
                "&:focus-within": {
                    borderBottomColor: theme.colors.useCases.buttons.actionActive,
                    [`& .${classes.pathIcon}`]: {
                        color: theme.colors.useCases.typography.textFocus
                    }
                }
            },
            pathInput: {
                flex: 1,
                minWidth: 0,
                caretColor: theme.colors.useCases.typography.textFocus,
                ...theme.typography.variants["body 1"].style,
                outline: "none",
                border: "none",
                backgroundColor: "transparent",
                color: theme.colors.useCases.typography.textPrimary,
                "&::placeholder": {
                    color: theme.colors.useCases.typography.textDisabled,
                    opacity: 1
                }
            },
            pathIcon: {
                margin: `${theme.spacing(2) - 2}px ${theme.spacing(3) - 2}px`,
                color: theme.colors.useCases.typography.textSecondary
            },
            inlineAction: {
                marginRight: theme.spacing(1),
                display: "flex",
                alignItems: "center"
            },
            actionButton: {
                ...actionButtonBase,
                borderRadius: 8,
                backgroundColor: theme.colors.useCases.surfaces.surface1,
                boxShadow: theme.shadows[1],
                border: "none",
                "&:hover": {
                    backgroundColor: theme.colors.useCases.surfaces.surface1
                }
            },
            inlineActionButton: {
                ...actionButtonBase,
                backgroundColor: "transparent",
                border: "none",
                "&:hover": {
                    backgroundColor: "transparent"
                }
            },
            tooltipWrapper: {
                display: "inline-flex"
            }
        };
    });
