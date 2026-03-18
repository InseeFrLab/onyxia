import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { tss } from "tss";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { useClickAway } from "powerhooks/useClickAway";

export type S3ProfileSelectProps = {
    className?: string;
    /** Assert at least one profile */
    availableProfileNames: string[];
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
        selectedProfile,
        onSelectedProfileChange,
        onEditProfile,
        onCreateNewProfile
    } = props;

    const { classes, cx } = useStyles();
    const [isOpen, setIsOpen] = useState(false);
    const [isTriggerHover, setIsTriggerHover] = useState(false);
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
            <div
                className={cx(
                    classes.triggerRow,
                    isTriggerHover && classes.triggerRowHover
                )}
            >
                <div
                    className={classes.trigger}
                    role="button"
                    tabIndex={0}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    onClick={toggleDropdown}
                    onKeyDown={handleTriggerKeyDown}
                    onMouseEnter={() => setIsTriggerHover(true)}
                    onMouseLeave={() => setIsTriggerHover(false)}
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
                    aria-label="Profile settings"
                >
                    <Icon icon={getIconUrlByName("Settings")} size="extra small" />
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
                    <div className={classes.list} ref={listRef}>
                        {availableProfileNames.map((profileName, index) => {
                            const isSelected = profileName === selectedProfile.name;

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
                                    {isSelected && (
                                        <span className={classes.iconSlot}>
                                            <Icon
                                                className={classes.checkIcon}
                                                icon={getIconUrlByName("Check")}
                                                size="extra small"
                                            />
                                        </span>
                                    )}
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

    return {
        root: {
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
            transition: "background-color 120ms ease, box-shadow 120ms ease",
            boxSizing: "border-box"
        },
        triggerRowHover: {
            boxShadow: theme.shadows[4]
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
            backgroundColor: theme.colors.useCases.surfaces.surface2,
            color: theme.colors.useCases.typography.textPrimary,
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "background-color 120ms ease, opacity 120ms ease",
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface3
            }
        },
        dropdown: {
            position: "absolute",
            top: `calc(100% + ${theme.spacing(1.5)}px)`,
            left: 0,
            right: 0,
            zIndex: theme.muiTheme.zIndex.modal,
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(1.5),
            padding: theme.spacing(1.5),
            borderRadius: 12,
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            boxShadow: theme.shadows[3],
            boxSizing: "border-box"
        },
        divider: {
            width: "100%",
            height: 1,
            backgroundColor: theme.colors.useCases.surfaces.surface2
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
            justifyContent: "flex-start",
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
                backgroundColor: theme.colors.palette.focus.mainAlpha20
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
        iconSlot: {
            width: 28,
            height: 28,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
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
