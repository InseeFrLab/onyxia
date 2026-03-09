import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { tss } from "tss";
import { Icon } from "onyxia-ui/Icon";
import { Tooltip } from "onyxia-ui/Tooltip";
import { getIconUrlByName } from "lazy-icons";
import { useClickAway } from "powerhooks/useClickAway";

export type S3ProfileSelectProps = {
    className?: string;
    /** Assert at least one profile */
    availableProfileNames: string[];
    /**
     * Optional list of readonly profiles to display the indicator in the dropdown.
     */
    readonlyProfileNames?: string[];
    selectedProfile: {
        /** Assert match one of the  availableProfiles */
        name: string;
        url: string;
        isReadonly: boolean;
    };

    onSelectedProfileChange: (params: { profileName: string }) => void;

    /** Assert profile name match an entry with readonly false */
    onEditProfile: () => void;

    onCreateNewProfile: () => void;
};

export function S3ProfileSelect(props: S3ProfileSelectProps) {
    const {
        className,
        availableProfileNames,
        readonlyProfileNames,
        selectedProfile,
        onSelectedProfileChange,
        onEditProfile,
        onCreateNewProfile
    } = props;

    const { classes, cx } = useStyles();
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const focusFirstOnOpenRef = useRef(false);

    useClickAway({
        ref: rootRef,
        onClickAway: () => setIsOpen(false)
    });

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        if (!focusFirstOnOpenRef.current) {
            return;
        }

        focusFirstOnOpenRef.current = false;

        const firstItem =
            listRef.current?.querySelector<HTMLButtonElement>('[data-index="0"]');
        firstItem?.focus();
    }, [isOpen, availableProfileNames.length]);

    const toggleDropdown = () => setIsOpen(open => !open);

    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleDropdown();
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            if (isOpen) {
                const firstItem =
                    listRef.current?.querySelector<HTMLButtonElement>('[data-index="0"]');
                firstItem?.focus();
                return;
            }

            focusFirstOnOpenRef.current = true;
            setIsOpen(true);
        }

        if (event.key === "Escape") {
            if (isOpen) {
                event.preventDefault();
                setIsOpen(false);
            }
        }
    };

    const handleSelectProfile = (profileName: string) => {
        setIsOpen(false);

        if (profileName === selectedProfile.name) {
            return;
        }

        onSelectedProfileChange({ profileName });
    };

    const handleCreateNewProfile = () => {
        setIsOpen(false);
        onCreateNewProfile();
    };

    return (
        <div className={cx(classes.root, className)} ref={rootRef}>
            <div className={classes.triggerRow}>
                <div
                    className={classes.trigger}
                    role="button"
                    tabIndex={0}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    onClick={toggleDropdown}
                    onKeyDown={handleTriggerKeyDown}
                >
                    <span className={classes.triggerMain}>
                        <span
                            className={classes.triggerLabel}
                            title={selectedProfile.name}
                        >
                            {selectedProfile.name}
                        </span>
                        <Icon
                            className={cx(classes.chevron, isOpen && classes.chevronOpen)}
                            icon={getIconUrlByName("ExpandMore")}
                            size="small"
                        />
                    </span>
                </div>
                <button
                    type="button"
                    className={classes.editButton}
                    onClick={onEditProfile}
                    disabled={selectedProfile.isReadonly}
                    aria-label="Edit profile"
                >
                    <Icon icon={getIconUrlByName("Edit")} size="extra small" />
                </button>
            </div>

            {isOpen && (
                <div
                    className={classes.dropdown}
                    role="listbox"
                    aria-label="S3 profiles"
                    onKeyDown={event => {
                        if (event.key !== "Escape") {
                            return;
                        }
                        event.preventDefault();
                        setIsOpen(false);
                    }}
                >
                    <div className={classes.urlRow}>
                        <span className={classes.urlText} title={selectedProfile.url}>
                            {selectedProfile.url}
                        </span>
                        <span className={classes.iconSlot}>
                            <Icon
                                className={classes.urlIcon}
                                icon={getIconUrlByName("SwapVert")}
                                size="extra small"
                            />
                        </span>
                    </div>
                    <div className={classes.divider} />
                    <div className={classes.list} ref={listRef}>
                        {availableProfileNames.map((profileName, index) => {
                            const isSelected = profileName === selectedProfile.name;
                            const isReadonly =
                                readonlyProfileNames?.includes(profileName) ||
                                (isSelected && selectedProfile.isReadonly);

                            return (
                                <button
                                    type="button"
                                    key={profileName}
                                    data-index={index}
                                    className={cx(
                                        classes.profileRow,
                                        isSelected && classes.profileRowSelected
                                    )}
                                    onClick={() => handleSelectProfile(profileName)}
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    <span
                                        className={classes.profileName}
                                        title={profileName}
                                    >
                                        {profileName}
                                    </span>
                                    <span className={classes.profileMeta}>
                                        {isReadonly && (
                                            <Tooltip title="Read-only profile">
                                                <span className={classes.readonlyBadge}>
                                                    <Icon
                                                        icon={getIconUrlByName(
                                                            "AdminPanelSettings"
                                                        )}
                                                        size="extra small"
                                                    />
                                                </span>
                                            </Tooltip>
                                        )}
                                        {isSelected && (
                                            <span className={classes.iconSlot}>
                                                <Icon
                                                    className={classes.checkIcon}
                                                    icon={getIconUrlByName("Check")}
                                                    size="extra small"
                                                />
                                            </span>
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <div className={classes.divider} />
                    <button
                        type="button"
                        className={classes.createRow}
                        onClick={handleCreateNewProfile}
                    >
                        <Icon
                            className={classes.createIcon}
                            icon={getIconUrlByName("Add")}
                            size="small"
                        />
                        <span className={classes.createLabel}>New S3 Profile</span>
                    </button>
                </div>
            )}
        </div>
    );
}

const useStyles = tss.withName({ S3ProfileSelect }).create(({ theme }) => {
    const labelStyle = theme.typography.variants["label 1"].style;
    const captionStyle = theme.typography.variants["caption"].style;

    return {
        root: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(1.5),
            width: "100%",
            position: "relative"
        },
        triggerRow: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1.5),
            padding: theme.spacing(1.5),
            paddingLeft: theme.spacing(5),
            borderRadius: 12,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            transition: "box-shadow 120ms ease",
            boxSizing: "border-box",
            "&:hover": {
                boxShadow: theme.shadows[2]
            }
        },
        trigger: {
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            minWidth: 0,
            cursor: "pointer",
            border: "none",
            background: "transparent",
            padding: 0,
            textAlign: "left",
            color: theme.colors.useCases.typography.textPrimary,
            "&:focus": {
                outline: "none"
            }
        },
        triggerMain: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1),
            minWidth: 0
        },
        triggerLabel: {
            ...labelStyle,
            fontWeight: 600,
            color: theme.colors.useCases.typography.textPrimary,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
            maxWidth: "100%"
        },
        chevron: {
            color: theme.colors.useCases.typography.textPrimary,
            transition: "transform 120ms ease",
            flexShrink: 0
        },
        chevronOpen: {
            transform: "rotate(180deg)"
        },
        editButton: {
            border: "none",
            backgroundColor: theme.colors.useCases.surfaces.surface3,
            color: theme.colors.useCases.typography.textPrimary,
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "opacity 120ms ease",
            "&:disabled": {
                cursor: "not-allowed",
                opacity: 0.5
            }
        },
        dropdown: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(1.5),
            padding: theme.spacing(1.5),
            borderRadius: 12,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            boxShadow: theme.shadows[2],
            boxSizing: "border-box"
        },
        divider: {
            width: "100%",
            height: 1,
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        urlRow: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing(1),
            padding: theme.spacing(1),
            paddingLeft: theme.spacing(5),
            borderRadius: 10,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            color: theme.colors.useCases.typography.textSecondary
        },
        urlText: {
            ...captionStyle,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0
        },
        urlIcon: {
            color: theme.colors.useCases.typography.textSecondary,
            flexShrink: 0
        },
        list: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(0.5)
        },
        profileRow: {
            border: "none",
            width: "100%",
            textAlign: "left",
            padding: theme.spacing(1),
            paddingLeft: theme.spacing(4),
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing(1.5),
            cursor: "pointer",
            minHeight: 44,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            color: theme.colors.useCases.typography.textPrimary,
            transition: "background-color 120ms ease",
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface2
            }
        },
        profileRowSelected: {
            backgroundColor: theme.colors.palette.focus.mainAlpha10,
            "&:hover": {
                backgroundColor: theme.colors.palette.focus.mainAlpha10
            }
        },
        profileName: {
            ...labelStyle,
            color: theme.colors.useCases.typography.textPrimary,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
            flex: 1
        },
        profileMeta: {
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(1),
            flexShrink: 0,
            paddingRight: theme.spacing(1)
        },
        iconSlot: {
            width: 28,
            height: 28,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
        },
        readonlyBadge: {
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: theme.colors.useCases.surfaces.surface3,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.colors.useCases.typography.textSecondary
        },
        checkIcon: {
            color: theme.colors.useCases.typography.textPrimary
        },
        createRow: {
            border: "none",
            width: "100%",
            textAlign: "left",
            padding: theme.spacing(1),
            paddingLeft: theme.spacing(3),
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1),
            cursor: "pointer",
            minHeight: 44,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            color: theme.colors.useCases.typography.textPrimary,
            transition: "background-color 120ms ease",
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface2
            }
        },
        createLabel: {
            ...labelStyle,
            color: theme.colors.useCases.typography.textPrimary
        },
        createIcon: {
            color: theme.colors.useCases.typography.textPrimary
        }
    };
});
