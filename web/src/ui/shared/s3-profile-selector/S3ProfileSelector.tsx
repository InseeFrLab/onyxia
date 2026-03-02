import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { tss } from "tss";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { useClickAway } from "powerhooks/useClickAway";
import type { S3Profile } from "./types";

export type S3ProfileSelectorProps = {
    profiles: S3Profile[];
    activeProfileId: string | null;
    profileCreationPolicy: "allowed" | "restricted" | "disabled";
    defaultOpen?: boolean;
    onSelect: (profileId: string) => void;
    onCreateRequested: () => void;
};

const materialSymbolsHref =
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0&icon_names=family_group,person,warning,error";

function ensureMaterialSymbols() {
    if (typeof document === "undefined") {
        return;
    }

    const linkId = "material-symbols-outlined-s3-profile";
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

export function S3ProfileSelector(props: S3ProfileSelectorProps) {
    const {
        profiles,
        activeProfileId,
        profileCreationPolicy,
        defaultOpen = false,
        onSelect,
        onCreateRequested
    } = props;
    const { classes, cx } = useStyles();
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [localActiveProfileId, setLocalActiveProfileId] = useState<string | null>(
        activeProfileId
    );
    const [searchValue, setSearchValue] = useState("");
    const [focusedIndex, setFocusedIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        ensureMaterialSymbols();
    }, []);

    useEffect(() => {
        setLocalActiveProfileId(activeProfileId);
    }, [activeProfileId]);

    const filteredProfiles = useMemo(() => {
        if (!searchValue.trim()) {
            return profiles;
        }
        const lowered = searchValue.trim().toLowerCase();
        return profiles.filter(profile => profile.name.toLowerCase().includes(lowered));
    }, [profiles, searchValue]);

    const activeProfile =
        profiles.find(profile => profile.id === localActiveProfileId) ?? null;

    const flattenedProfiles = useMemo(() => filteredProfiles, [filteredProfiles]);

    const focusedProfile =
        flattenedProfiles.length > 0 ? flattenedProfiles[focusedIndex] : undefined;

    useEffect(() => {
        if (focusedIndex >= flattenedProfiles.length) {
            setFocusedIndex(Math.max(flattenedProfiles.length - 1, 0));
        }
    }, [focusedIndex, flattenedProfiles.length]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const activeIndex = flattenedProfiles.findIndex(
            profile => profile.id === localActiveProfileId
        );
        setFocusedIndex(activeIndex >= 0 ? activeIndex : 0);
    }, [isOpen, flattenedProfiles, localActiveProfileId]);

    useClickAway({
        ref: rootRef,
        onClickAway: () => setIsOpen(false)
    });

    const handleSelect = (profileId: string) => {
        setLocalActiveProfileId(profileId);
        onSelect(profileId);
        setIsOpen(false);
    };

    const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(open => !open);
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
        }
    };

    const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            setIsOpen(false);
            return;
        }

        if (flattenedProfiles.length === 0) {
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setFocusedIndex(prev => Math.min(prev + 1, flattenedProfiles.length - 1));
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setFocusedIndex(prev => Math.max(prev - 1, 0));
        }

        if (event.key === "Enter") {
            event.preventDefault();
            const profile = flattenedProfiles[focusedIndex];
            if (profile) {
                handleSelect(profile.id);
            }
        }
    };

    useEffect(() => {
        if (!isOpen || !listRef.current) {
            return;
        }

        listRef.current.focus();

        const focusedItem = listRef.current.querySelector<HTMLElement>(
            `[data-index="${focusedIndex}"]`
        );
        if (focusedItem) {
            focusedItem.scrollIntoView({ block: "nearest" });
        }
    }, [focusedIndex, isOpen]);

    return (
        <div className={classes.root} ref={rootRef}>
            <button
                type="button"
                className={classes.trigger}
                onClick={() => setIsOpen(open => !open)}
                onKeyDown={onTriggerKeyDown}
                aria-expanded={isOpen}
            >
                <span className={classes.triggerContent}>
                    {activeProfile && (
                        <span
                            className={classes.typeBadge}
                            data-type={activeProfile.type}
                            aria-label={
                                activeProfile.type === "managed"
                                    ? "Managed profile"
                                    : "Personal profile"
                            }
                        >
                            <span
                                className={`material-symbols-outlined ${classes.typeIcon}`}
                                aria-hidden="true"
                            >
                                {activeProfile.type === "managed"
                                    ? "family_group"
                                    : "person"}
                            </span>
                        </span>
                    )}
                    <span className={classes.triggerLabel} title={activeProfile?.name}>
                        {activeProfile?.name ?? "Select S3 profile"}
                    </span>
                    {activeProfile?.status && activeProfile.status !== "ok" && (
                        <span
                            className={classes.statusInline}
                            data-status={activeProfile.status}
                            aria-label={
                                activeProfile.status === "invalid"
                                    ? "Invalid profile"
                                    : "Profile needs attention"
                            }
                        >
                            <span
                                className={`material-symbols-outlined ${classes.statusIcon}`}
                                aria-hidden="true"
                            >
                                {activeProfile.status === "invalid" ? "error" : "warning"}
                            </span>
                        </span>
                    )}
                </span>
                <Icon
                    className={cx(classes.chevron, isOpen && classes.chevronOpen)}
                    icon={getIconUrlByName("ExpandMore")}
                    size="small"
                />
            </button>

            {isOpen && (
                <div
                    className={classes.dropdown}
                    role="listbox"
                    onKeyDown={onListKeyDown}
                >
                    {profiles.length > 8 && (
                        <input
                            className={classes.searchInput}
                            placeholder="Search profiles"
                            value={searchValue}
                            onChange={event => setSearchValue(event.target.value)}
                        />
                    )}

                    <div
                        className={classes.list}
                        ref={listRef}
                        tabIndex={0}
                        role="presentation"
                    >
                        {filteredProfiles.length === 0 ? (
                            <div className={classes.emptyState}>
                                No profiles available.
                            </div>
                        ) : (
                            filteredProfiles.map((profile, index) => (
                                <ProfileRow
                                    key={profile.id}
                                    profile={profile}
                                    isActive={profile.id === localActiveProfileId}
                                    isFocused={focusedProfile?.id === profile.id}
                                    index={index}
                                    onSelect={handleSelect}
                                />
                            ))
                        )}
                    </div>

                    <div className={classes.footer}>
                        {profileCreationPolicy === "allowed" && (
                            <button
                                type="button"
                                className={classes.footerButton}
                                onClick={onCreateRequested}
                            >
                                Create new profile…
                            </button>
                        )}
                        {profileCreationPolicy === "restricted" && (
                            <>
                                <button
                                    type="button"
                                    className={classes.footerButton}
                                    onClick={onCreateRequested}
                                >
                                    Create profile (restricted)
                                </button>
                                <div className={classes.footerHelper}>
                                    Some settings are managed by your organisation.
                                </div>
                            </>
                        )}
                        {profileCreationPolicy === "disabled" && (
                            <div className={classes.footerHelper}>
                                Profile creation is disabled in this environment.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileRow(props: {
    profile: S3Profile;
    isActive: boolean;
    isFocused: boolean;
    index: number;
    onSelect: (profileId: string) => void;
}) {
    const { profile, isActive, isFocused, index, onSelect } = props;
    const { classes, cx } = useStyles();
    const showStatus =
        profile.status === "needsAttention" || profile.status === "invalid";

    return (
        <button
            type="button"
            data-index={index}
            className={cx(
                classes.profileRow,
                isActive && classes.profileRowActive,
                isFocused && classes.profileRowFocused
            )}
            onClick={() => onSelect(profile.id)}
        >
            <span className={classes.rowContent}>
                <span className={classes.typeBadge} data-type={profile.type}>
                    <span
                        className={`material-symbols-outlined ${classes.typeIcon}`}
                        aria-hidden="true"
                        title={
                            profile.type === "managed"
                                ? "Managed profile"
                                : "Personal profile"
                        }
                    >
                        {profile.type === "managed" ? "family_group" : "person"}
                    </span>
                </span>
                <span className={classes.profileName} title={profile.name}>
                    {profile.name}
                </span>
            </span>
            <span className={classes.rowMeta}>
                {showStatus && (
                    <span className={classes.statusInline} data-status={profile.status}>
                        <span
                            className={`material-symbols-outlined ${classes.statusIcon}`}
                            aria-hidden="true"
                            title={
                                profile.status === "invalid"
                                    ? "Invalid profile"
                                    : "Profile needs attention"
                            }
                        >
                            {profile.status === "invalid" ? "error" : "warning"}
                        </span>
                    </span>
                )}
                {isActive && (
                    <Icon
                        className={classes.checkIcon}
                        icon={getIconUrlByName("Check")}
                        size="small"
                    />
                )}
            </span>
        </button>
    );
}

const useStyles = tss.withName({ S3ProfileSelector }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2),
        maxWidth: 420,
        position: "relative"
    },
    trigger: {
        border: "none",
        borderRadius: 16,
        padding: theme.spacing(2.5),
        background: theme.colors.useCases.surfaces.surface1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        textAlign: "left",
        gap: theme.spacing(2),
        boxShadow: theme.shadows[1],
        transition: "box-shadow 120ms ease, transform 120ms ease",
        "&:hover": {
            boxShadow: theme.shadows[6]
        },
        "&:focus-visible": {
            outline: "none",
            boxShadow: `0 0 0 2px ${theme.colors.useCases.buttons.actionActive}`
        }
    },
    triggerContent: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        minWidth: 0,
        flex: 1
    },
    triggerLabel: {
        fontSize: theme.typography.variants["body 1"].style.fontSize,
        fontWeight: 600,
        color: theme.colors.useCases.typography.textPrimary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        minWidth: 0,
        flex: 1
    },
    chevron: {
        transition: "transform 120ms ease",
        color: theme.colors.useCases.typography.textSecondary
    },
    chevronOpen: {
        transform: "rotate(180deg)"
    },
    typeBadge: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        color: theme.colors.useCases.typography.textSecondary,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center"
    },
    typeIcon: {
        fontSize: 18,
        lineHeight: "18px",
        fontFamily: '"Material Symbols Outlined"',
        fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
        color: "inherit"
    },
    dropdown: {
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        borderRadius: 16,
        padding: theme.spacing(2.5),
        background: theme.colors.useCases.surfaces.surface1,
        boxShadow: theme.shadows[6],
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(3),
        width: "100%",
        boxSizing: "border-box"
    },
    searchInput: {
        padding: theme.spacing(2),
        borderRadius: 10,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        background: theme.colors.useCases.surfaces.background,
        color: theme.colors.useCases.typography.textPrimary
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2),
        maxHeight: 260,
        overflowY: "auto"
    },
    profileRow: {
        border: "none",
        borderRadius: 14,
        padding: theme.spacing(2),
        background: "transparent",
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        transition: "background-color 120ms ease"
    },
    profileRowActive: {
        backgroundColor: theme.colors.useCases.surfaces.surface2
    },
    profileRowFocused: {
        backgroundColor: theme.colors.useCases.surfaces.surface2
    },
    rowContent: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        minWidth: 0,
        flex: 1
    },
    profileName: {
        fontSize: theme.typography.variants["body 1"].style.fontSize,
        fontWeight: theme.typography.variants["body 1"].style.fontWeight,
        color: theme.colors.useCases.typography.textPrimary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        minWidth: 0,
        flex: 1
    },
    rowMeta: {
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(1),
        flexShrink: 0
    },
    statusInline: {
        display: "inline-flex",
        alignItems: "center",
        color: theme.colors.useCases.typography.textSecondary,
        '&[data-status="invalid"]': {
            color: theme.colors.useCases.alertSeverity.error.main
        },
        '&[data-status="needsAttention"]': {
            color: theme.colors.useCases.alertSeverity.warning.main
        }
    },
    statusIcon: {
        fontSize: 18,
        lineHeight: "18px",
        fontFamily: '"Material Symbols Outlined"',
        fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
        color: "inherit"
    },
    checkIcon: {
        color: theme.colors.useCases.typography.textSecondary
    },
    emptyState: {
        color: theme.colors.useCases.typography.textSecondary,
        fontSize: theme.typography.variants["label 1"].style.fontSize
    },
    footer: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1)
    },
    footerButton: {
        border: "none",
        background: "transparent",
        color: theme.colors.useCases.buttons.actionActive,
        fontSize: theme.typography.variants["label 1"].style.fontSize,
        fontWeight: 600,
        padding: 0,
        textAlign: "left",
        cursor: "pointer"
    },
    footerHelper: {
        fontSize: theme.typography.variants["label 1"].style.fontSize,
        color: theme.colors.useCases.typography.textSecondary
    }
}));
