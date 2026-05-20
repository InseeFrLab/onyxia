import type {
    Technology,
    CodeSnippet
} from "core/usecases/s3ProfilesDetailsUiController/decoupledLogic/codeSnippets";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import { Button } from "onyxia-ui/Button";
import { IconButton } from "onyxia-ui/IconButton";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { useClickAway } from "powerhooks/useClickAway";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { saveAs } from "file-saver";
import {
    CodeTextEditor,
    type CodeTextEditorLanguage
} from "ui/shared/textEditor/CodeTextEditor";
import { assert } from "tsafe/assert";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import { getScrollableParent } from "powerhooks/getScrollableParent";

export type Props = {
    className?: string;
    /** Assert at least one profile */
    availableProfileNames: string[];

    profileName: string;

    onSelectedProfileChange: (params: { profileName: string }) => void;

    onCreateNewProfile: () => void;

    onEdit: (() => void) | undefined;

    endpointUrl: string;
    defaultRegion: string | undefined;

    accessCredentials:
        | {
              expirationTime: number | undefined;
              accessKeyId: string;
              secretAccessKey: string;
              sessionToken: string | undefined;
              areTokensBeingRenewed: boolean;
              onRenewToken: (() => void) | undefined;
          }
        | undefined;

    availableTechnologies: readonly Technology[];
    technology: Technology;
    onTechnologyChange: (params: { technology: Technology }) => void;
    codeSnippet: CodeSnippet;
};

export function S3ProfileDetails(props: Props) {
    const {
        className,
        availableProfileNames,
        profileName,
        onSelectedProfileChange,
        onCreateNewProfile,
        onEdit,
        endpointUrl,
        defaultRegion,
        accessCredentials,
        availableTechnologies,
        technology,
        onTechnologyChange,
        codeSnippet
    } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation({ S3ProfileDetails });
    const [isCodeSnippetCopied, setIsCodeSnippetCopied] = useState(false);

    useEffect(() => {
        setIsCodeSnippetCopied(false);
    }, [codeSnippet.codeSrc]);

    useEffect(() => {
        if (!isCodeSnippetCopied) {
            return;
        }

        const timeoutId = window.setTimeout(() => setIsCodeSnippetCopied(false), 1400);

        return () => window.clearTimeout(timeoutId);
    }, [isCodeSnippetCopied]);

    const copyCodeSnippet = async () => {
        await copyToClipboard(codeSnippet.codeSrc);
        setIsCodeSnippetCopied(true);
    };

    const [element_select, setElement_select] = useState<HTMLElement | null>(null);

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.profileSummary}>
                <div className={classes.profileIdentity}>
                    <ProfileDropdown
                        availableProfileNames={availableProfileNames}
                        profileName={profileName}
                        onSelectedProfileChange={onSelectedProfileChange}
                        onCreateNewProfile={onCreateNewProfile}
                    />
                </div>

                <div className={classes.profileActions}>
                    <span className={classes.profileStatus}>
                        {onEdit === undefined ? t("read only") : t("custom")}
                    </span>
                    <Button
                        className={classes.editButton}
                        variant="ternary"
                        startIcon={getIconUrlByName("Edit")}
                        disabled={onEdit === undefined}
                        onClick={onEdit}
                    >
                        {t("edit")}
                    </Button>
                </div>
            </div>

            <section className={classes.sectionCard}>
                <SectionHeading
                    title={t("connection details title")}
                    subtitle={t("connection details subtitle")}
                />
                <div className={classes.fields}>
                    <CopyableField
                        label={t("endpoint url label")}
                        copyLabel={t("endpoint url label")}
                        value={endpointUrl}
                    />
                    {defaultRegion !== undefined && defaultRegion !== "" && (
                        <CopyableField
                            label={t("default region label")}
                            copyLabel={t("default region label")}
                            value={defaultRegion}
                        />
                    )}
                </div>
            </section>

            <section className={classes.sectionCard}>
                <SectionHeading
                    title={t("access credentials title")}
                    subtitle={
                        accessCredentials === undefined
                            ? t("access credentials anonymous subtitle")
                            : t("access credentials subtitle")
                    }
                />

                {accessCredentials !== undefined && (
                    <>
                        <div className={classes.fields}>
                            <CopyableField
                                label={t("access key id label")}
                                copyLabel={t("access key id label")}
                                value={accessCredentials.accessKeyId}
                                isSensitive={true}
                                helperText={
                                    <>
                                        {t("environment variable")}{" "}
                                        <code className={classes.envVarName}>
                                            AWS_ACCESS_KEY_ID
                                        </code>
                                    </>
                                }
                            />
                            <CopyableField
                                label={t("secret access key label")}
                                copyLabel={t("secret access key label")}
                                value={accessCredentials.secretAccessKey}
                                isSensitive={true}
                                helperText={
                                    <>
                                        {t("environment variable")}{" "}
                                        <code className={classes.envVarName}>
                                            AWS_SECRET_ACCESS_KEY
                                        </code>
                                    </>
                                }
                            />
                            {accessCredentials.sessionToken !== undefined && (
                                <CopyableField
                                    label={t("session token label")}
                                    copyLabel={t("session token label")}
                                    value={accessCredentials.sessionToken}
                                    isSensitive={true}
                                    helperText={
                                        <>
                                            {t("environment variable")}{" "}
                                            <code className={classes.envVarName}>
                                                AWS_SESSION_TOKEN
                                            </code>
                                        </>
                                    }
                                />
                            )}
                        </div>

                        <div className={classes.credentialsFooter}>
                            <Text typo="body 2" className={classes.credentialsExpiration}>
                                {accessCredentials.expirationTime === undefined
                                    ? t("no expiration")
                                    : t("expires", {
                                          expirationTime: formatExpirationTime(
                                              accessCredentials.expirationTime
                                          )
                                      })}
                            </Text>
                            {accessCredentials.onRenewToken !== undefined && (
                                <Button
                                    className={classes.renewButton}
                                    variant="ternary"
                                    startIcon={getIconUrlByName("Refresh")}
                                    disabled={accessCredentials.areTokensBeingRenewed}
                                    onClick={accessCredentials.onRenewToken}
                                >
                                    {accessCredentials.areTokensBeingRenewed
                                        ? t("renewing")
                                        : t("renew tokens")}
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </section>

            <section className={classes.sectionCard}>
                <SectionHeading
                    title={t("init script title")}
                    subtitle={t("init script subtitle")}
                />

                <div className={classes.snippetToolbar}>
                    <FormControl
                        variant="outlined"
                        className={classes.technologySelectControl}
                    >
                        <Select
                            ref={setElement_select}
                            value={technology}
                            inputProps={{ "aria-label": t("technology aria label") }}
                            onChange={event => {
                                const { value } = event.target;
                                assert(typeof value === "string");

                                if (!isTechnology(value, availableTechnologies)) {
                                    return;
                                }

                                onTechnologyChange({ technology: value });

                                assert(element_select !== null);

                                const element_scrollable = getScrollableParent({
                                    element: element_select,
                                    doReturnElementIfScrollable: false
                                });

                                setTimeout(() => {
                                    element_scrollable.scrollTop =
                                        element_scrollable.scrollHeight;
                                }, 70);
                            }}
                        >
                            {availableTechnologies.map(availableTechnology => (
                                <MenuItem
                                    key={availableTechnology}
                                    value={availableTechnology}
                                >
                                    {availableTechnology}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <div className={classes.snippetActions}>
                        <Tooltip title={isCodeSnippetCopied ? t("copied") : t("copy")}>
                            <IconButton
                                icon={getIconUrlByName(
                                    isCodeSnippetCopied ? "Check" : "ContentCopy"
                                )}
                                aria-label={isCodeSnippetCopied ? t("copied") : t("copy")}
                                onClick={copyCodeSnippet}
                                size="small"
                            />
                        </Tooltip>

                        <Tooltip title={t("download")}>
                            <IconButton
                                icon={getIconUrlByName("GetApp")}
                                aria-label={t("download")}
                                onClick={() => {
                                    saveAs(
                                        new Blob([codeSnippet.codeSrc], {
                                            type: "text/plain;charset=utf-8"
                                        }),
                                        codeSnippet.fileBasename
                                    );
                                }}
                                size="small"
                            />
                        </Tooltip>
                    </div>
                </div>

                <CodeTextEditor
                    className={classes.codeEditor}
                    value={codeSnippet.codeSrc}
                    onChange={undefined}
                    language={getCodeTextEditorLanguage(technology)}
                    maxHeight={360}
                    fallback={<div className={classes.editorFallback} />}
                />
            </section>
        </div>
    );
}

function ProfileDropdown(props: {
    availableProfileNames: string[];
    profileName: string;
    onSelectedProfileChange: (params: { profileName: string }) => void;
    onCreateNewProfile: () => void;
}) {
    const {
        availableProfileNames,
        profileName,
        onSelectedProfileChange,
        onCreateNewProfile
    } = props;

    const { classes, cx } = useStyles_ProfileDropdown();
    const { t } = useTranslation({ S3ProfileDetails });
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const focusFirstOnOpenRef = useRef(false);

    useClickAway({
        ref: rootRef,
        onClickAway: () => setIsOpen(false)
    });

    useEffect(() => {
        if (!isOpen || !focusFirstOnOpenRef.current) {
            return;
        }

        focusFirstOnOpenRef.current = false;
        listRef.current?.querySelector<HTMLButtonElement>('[data-index="0"]')?.focus();
    }, [availableProfileNames.length, isOpen]);

    const toggleDropdown = () => setIsOpen(open => !open);

    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleDropdown();
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();

            if (isOpen) {
                listRef.current
                    ?.querySelector<HTMLButtonElement>('[data-index="0"]')
                    ?.focus();
                return;
            }

            focusFirstOnOpenRef.current = true;
            setIsOpen(true);
            return;
        }

        if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            setIsOpen(false);
        }
    };

    const handleSelectProfile = (nextProfileName: string) => {
        setIsOpen(false);

        if (nextProfileName === profileName) {
            return;
        }

        onSelectedProfileChange({ profileName: nextProfileName });
    };

    const handleCreateNewProfile = () => {
        setIsOpen(false);
        onCreateNewProfile();
    };

    return (
        <div className={classes.root} ref={rootRef}>
            <button
                type="button"
                className={cx(classes.trigger, isOpen && classes.triggerOpen)}
                aria-label={t("select s3 profile aria label")}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={toggleDropdown}
                onKeyDown={handleTriggerKeyDown}
            >
                <Text typo="object heading" className={classes.triggerLabel}>
                    {profileName}
                </Text>
                <Icon
                    className={cx(classes.chevron, isOpen && classes.chevronOpen)}
                    icon={getIconUrlByName("ExpandMore")}
                    size="extra small"
                />
            </button>

            {isOpen && (
                <div
                    className={classes.dropdown}
                    role="listbox"
                    aria-label={t("s3 profiles aria label")}
                    onKeyDown={event => {
                        if (event.key !== "Escape") {
                            return;
                        }

                        event.preventDefault();
                        setIsOpen(false);
                    }}
                >
                    <div className={classes.list} ref={listRef}>
                        {availableProfileNames.map((availableProfileName, index) => {
                            const isSelected = availableProfileName === profileName;

                            return (
                                <button
                                    type="button"
                                    key={availableProfileName}
                                    data-index={index}
                                    role="option"
                                    aria-selected={isSelected}
                                    className={cx(
                                        classes.profileRow,
                                        isSelected && classes.profileRowSelected
                                    )}
                                    onClick={() =>
                                        handleSelectProfile(availableProfileName)
                                    }
                                >
                                    <span
                                        className={classes.profileName}
                                        title={availableProfileName}
                                    >
                                        {availableProfileName}
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
                        <span className={classes.createLabel}>{t("new s3 profile")}</span>
                    </button>
                </div>
            )}
        </div>
    );
}

function SectionHeading(props: { title: string; subtitle: ReactNode }) {
    const { title, subtitle } = props;
    const { classes } = useStyles_SectionHeading();

    return (
        <div className={classes.root}>
            <Text typo="object heading" className={classes.title}>
                {title}
            </Text>
            <Text typo="body 2" className={classes.subtitle}>
                {subtitle}
            </Text>
        </div>
    );
}

function CopyableField(props: {
    label: string;
    copyLabel: string;
    value: string;
    helperText?: ReactNode;
    isSensitive?: boolean;
}) {
    const { label, copyLabel, value, helperText, isSensitive = false } = props;

    const { classes, cx } = useStyles_CopyableField();
    const { t } = useTranslation({ S3ProfileDetails });
    const [isCopied, setIsCopied] = useState(false);
    const displayedValue = isSensitive ? getMiddleEllipsis(value) : value;

    useEffect(() => {
        setIsCopied(false);
    }, [value]);

    useEffect(() => {
        if (!isCopied) {
            return;
        }

        const timeoutId = window.setTimeout(() => setIsCopied(false), 1400);

        return () => window.clearTimeout(timeoutId);
    }, [isCopied]);

    const handleCopy = async () => {
        await copyToClipboard(value);
        setIsCopied(true);
    };

    return (
        <div className={classes.root}>
            <Text typo="label 1" className={classes.label}>
                {label}
            </Text>
            <div
                className={cx(
                    classes.valueAndCopy,
                    isCopied && classes.valueAndCopyCopied
                )}
            >
                <span
                    className={cx(classes.value, isSensitive && classes.sensitiveValue)}
                    title={isSensitive ? displayedValue : value}
                >
                    {displayedValue}
                </span>
                <CompactCopyButton
                    ariaLabel={t("copy aria label", { what: copyLabel })}
                    isCopied={isCopied}
                    onCopy={handleCopy}
                />
            </div>
            {helperText !== undefined && (
                <Text typo="body 2" className={classes.helperText}>
                    {helperText}
                </Text>
            )}
        </div>
    );
}

function CompactCopyButton(props: {
    ariaLabel: string;
    isCopied: boolean;
    onCopy: () => void;
}) {
    const { ariaLabel, isCopied, onCopy } = props;
    const { classes, cx } = useStyles_CompactCopyButton();
    const { t } = useTranslation({ S3ProfileDetails });

    return (
        <Button
            variant="secondary"
            className={cx(classes.root, isCopied && classes.rootCopied)}
            aria-label={ariaLabel}
            startIcon={getIconUrlByName(isCopied ? "Check" : "ContentCopy")}
            onClick={onCopy}
        >
            {isCopied ? t("copied") : t("copy")}
        </Button>
    );
}

function getMiddleEllipsis(value: string): string {
    const length = 28;

    if (value.length <= length) {
        return value;
    }

    const prefixLength = 12;
    const suffixLength = 8;

    return `${value.slice(0, prefixLength)}...${value.slice(-suffixLength)}`;
}

function formatExpirationTime(expirationTime: number): string {
    if (!Number.isFinite(expirationTime)) {
        return "never";
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(expirationTime));
}

function isTechnology(
    value: string,
    availableTechnologies: readonly Technology[]
): value is Technology {
    return (availableTechnologies as readonly string[]).includes(value);
}

function getCodeTextEditorLanguage(technology: Technology): CodeTextEditorLanguage {
    switch (technology) {
        case "AWS CLI / shared profile":
            return "shell";
        case "Python (boto3)":
        case "Python (s3fs)":
        case "Python (polars)":
        case "Python (pyarrow)":
            return "python";
        case "DuckDB":
            return "SQL";
        case "R (arrow)":
        case "R (paws)":
            return "R";
        case "rclone":
            return "properties";
    }
}

const useStyles = tss.withName({ S3ProfileDetails }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: 0,
        minWidth: 0
    },
    profileSummary: {
        position: "sticky",
        top: 0,
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(3),
        minWidth: 0,
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        marginBottom: theme.spacing(3),
        borderRadius: 10,
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        boxShadow: `0 ${theme.spacing(1)}px ${theme.spacing(2)}px ${
            theme.colors.useCases.surfaces.surface1
        }`,
        "&::before": {
            content: '""',
            position: "absolute",
            zIndex: -1,
            top: -theme.spacing(3),
            right: -theme.spacing(4),
            bottom: -theme.spacing(1),
            left: -theme.spacing(4),
            backgroundColor: theme.colors.useCases.surfaces.surface1
        }
    },
    profileIdentity: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1),
        minWidth: 0,
        flex: 1
    },
    profileActions: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: theme.spacing(1),
        flexShrink: 0
    },
    profileStatus: {
        ...theme.typography.variants["label 1"].style,
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        padding: `${theme.spacing(0.5)}px ${theme.spacing(1.5)}px`,
        borderRadius: 999,
        color: theme.colors.useCases.typography.textSecondary,
        backgroundColor: theme.colors.useCases.surfaces.surface1,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`
    },
    editButton: {
        flex: "none"
    },
    sectionCard: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2.5),
        minWidth: 0,
        paddingBottom: theme.spacing(4),
        borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        "& + &": {
            marginTop: theme.spacing(4)
        },
        "&:last-child": {
            paddingBottom: 0,
            borderBottom: "none"
        }
    },
    fields: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1.5),
        minWidth: 0
    },
    envVarName: {
        color: theme.colors.useCases.typography.textFocus,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: "0.92em"
    },
    credentialsFooter: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        flexWrap: "wrap",
        minWidth: 0,
        marginTop: theme.spacing(0.5)
    },
    credentialsExpiration: {
        color: theme.colors.useCases.typography.textSecondary,
        minWidth: 0
    },
    renewButton: {
        flexShrink: 0
    },
    snippetToolbar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        flexWrap: "wrap",
        minWidth: 0
    },
    snippetActions: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: theme.spacing(1),
        flexShrink: 0
    },
    technologySelectControl: {
        flex: "0 1 220px",
        minWidth: 148,
        "& .MuiInputBase-root": {
            color: theme.colors.useCases.typography.textPrimary
        }
    },
    codeEditor: {
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        boxSizing: "border-box"
    },
    editorFallback: {
        height: 220,
        borderRadius: 8,
        backgroundColor: theme.colors.useCases.surfaces.surface2
    }
}));

const useStyles_ProfileDropdown = tss
    .withName({ ProfileDropdown })
    .create(({ theme }) => {
        const labelStyle = theme.typography.variants["label 1"].style;

        return {
            root: {
                position: "relative",
                width: "fit-content",
                maxWidth: "100%"
            },
            trigger: {
                border: "none",
                background: "transparent",
                color: theme.colors.useCases.typography.textPrimary,
                padding: 0,
                marginRight: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: theme.spacing(1),
                minWidth: 0,
                maxWidth: "100%",
                cursor: "pointer",
                textAlign: "left",
                borderRadius: 8,
                "&:focus-visible": {
                    outline: `2px solid ${theme.colors.useCases.typography.textFocus}`,
                    outlineOffset: 3
                }
            },
            triggerOpen: {},
            triggerLabel: {
                color: theme.colors.useCases.typography.textPrimary,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
            },
            chevron: {
                color: theme.colors.useCases.typography.textPrimary,
                transition: "transform 120ms ease",
                flexShrink: 0
            },
            chevronOpen: {
                transform: "rotate(180deg)"
            },
            dropdown: {
                position: "absolute",
                top: `calc(100% + ${theme.spacing(1.5)}px)`,
                left: 0,
                width: "max-content",
                minWidth: 300,
                maxWidth: "min(420px, calc(100vw - 48px))",
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
                minWidth: 0,
                overflow: "hidden",
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
                minWidth: 0,
                overflow: "hidden",
                "&:hover": {
                    backgroundColor: theme.colors.useCases.surfaces.surface2
                }
            },
            createLabel: {
                ...labelStyle,
                color: theme.colors.useCases.typography.textPrimary,
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
            },
            createIcon: {
                color: theme.colors.useCases.typography.textPrimary
            }
        };
    });

const useStyles_SectionHeading = tss.withName({ SectionHeading }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.5),
        minWidth: 0
    },
    title: {
        color: theme.colors.useCases.typography.textPrimary
    },
    subtitle: {
        color: theme.colors.useCases.typography.textSecondary
    }
}));

const useStyles_CopyableField = tss.withName({ CopyableField }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1),
        minWidth: 0
    },
    label: {
        color: theme.colors.useCases.typography.textPrimary,
        minWidth: 0
    },
    valueAndCopy: {
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1),
        minWidth: 0,
        minHeight: 48,
        padding: `${theme.spacing(0.75)}px ${theme.spacing(1.5)}px ${theme.spacing(
            0.75
        )}px ${theme.spacing(2)}px`,
        borderRadius: 8,
        border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        backgroundColor: theme.colors.useCases.surfaces.background,
        boxSizing: "border-box",
        transition: "background-color 180ms ease, border-color 180ms ease"
    },
    valueAndCopyCopied: {
        borderColor: alpha(theme.colors.useCases.alertSeverity.success.main, 0.36),
        backgroundColor: theme.colors.useCases.alertSeverity.success.background
    },
    value: {
        minWidth: 0,
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color: theme.colors.useCases.typography.textPrimary,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: 13,
        textAlign: "left"
    },
    sensitiveValue: {
        letterSpacing: 0
    },
    helperText: {
        color: theme.colors.useCases.typography.textTertiary,
        paddingLeft: theme.spacing(0.5)
    }
}));

const useStyles_CompactCopyButton = tss
    .withName({ CompactCopyButton })
    .create(({ theme }) => ({
        root: {
            ...theme.typography.variants["label 2"].style,
            flex: "none",
            minHeight: 30,
            gap: 0,
            paddingTop: 4,
            paddingBottom: 4,
            paddingLeft: 12,
            paddingRight: 12,
            "& .MuiSvgIcon-root, & svg, & img": {
                width: 16,
                height: 16,
                fontSize: 16
            }
        },
        rootCopied: {
            "&&": {
                color: theme.colors.useCases.typography.textPrimary,
                backgroundColor: theme.colors.useCases.alertSeverity.success.main,
                borderColor: theme.colors.useCases.alertSeverity.success.main,
                "&:hover": {
                    backgroundColor: theme.colors.useCases.alertSeverity.success.main
                }
            }
        }
    }));

const { i18n } = declareComponentKeys<
    | "read only"
    | "custom"
    | "edit"
    | "connection details title"
    | "connection details subtitle"
    | "endpoint url label"
    | "default region label"
    | "access credentials title"
    | "access credentials anonymous subtitle"
    | "access credentials subtitle"
    | "access key id label"
    | "secret access key label"
    | "session token label"
    | "environment variable"
    | "no expiration"
    | { K: "expires"; P: { expirationTime: string }; R: string }
    | "renewing"
    | "renew tokens"
    | "init script title"
    | "init script subtitle"
    | "technology aria label"
    | "download"
    | "select s3 profile aria label"
    | "s3 profiles aria label"
    | "new s3 profile"
    | { K: "copy aria label"; P: { what: string }; R: string }
    | "copied"
    | "copy"
>()({
    S3ProfileDetails
});
export type I18n = typeof i18n;
