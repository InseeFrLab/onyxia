/* eslint-disable tss-unused-classes/unused-classes */
import { useEffect, useState, type ReactNode } from "react";
import Input from "@mui/material/Input";
import { alpha } from "@mui/material/styles";
import { Button } from "onyxia-ui/Button";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { copyToClipboard } from "ui/tools/copyToClipboard";
import { declareComponentKeys, useTranslation } from "ui/i18n";

// eslint-disable-next-line react-refresh/only-export-components
export function useS3DialogClasses() {
    return useStyles_S3Dialog().classes;
}

export function S3DialogTextInput(props: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onEnterKeyDown?: () => void;
    error?: ReactNode;
    autoFocus?: boolean;
    isStrong?: boolean;
}) {
    const {
        label,
        value,
        onChange,
        onEnterKeyDown,
        error,
        autoFocus = false,
        isStrong = false
    } = props;

    const { classes, cx } = useStyles_S3DialogTextInput();

    return (
        <label className={classes.root}>
            <Text typo="label 1" className={classes.label}>
                {label}
            </Text>
            <Input
                className={cx(
                    classes.input,
                    isStrong && classes.inputStrong,
                    error !== undefined && classes.inputError
                )}
                value={value}
                autoFocus={autoFocus}
                disableUnderline={true}
                onFocus={event => event.currentTarget.select()}
                onChange={event => onChange(event.target.value)}
                onKeyDown={event => {
                    if (event.key !== "Enter") {
                        return;
                    }

                    event.preventDefault();
                    onEnterKeyDown?.();
                }}
                inputProps={{ "aria-label": label }}
            />
            {error !== undefined && (
                <Text typo="body 2" className={classes.error}>
                    {error}
                </Text>
            )}
        </label>
    );
}

export function S3DialogCopyField(props: {
    value: string | undefined;
    pendingText?: string;
    copyLabel?: string;
    ariaLabel: string;
    displayedValue?: string;
    onCopied?: () => void;
}) {
    const { value, pendingText, copyLabel, ariaLabel, displayedValue, onCopied } = props;

    const { classes, cx } = useStyles_S3DialogCopyField();
    const { t } = useTranslation({ S3DialogCopyField });
    const [isCopied, setIsCopied] = useState(false);

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

    const copy = async () => {
        if (value === undefined) {
            return;
        }

        await copyToClipboard(value);
        setIsCopied(true);
        onCopied?.();
    };

    return (
        <div className={cx(classes.root, isCopied && classes.rootCopied)}>
            <span className={classes.value} title={value}>
                {value === undefined
                    ? (pendingText ?? t("generating url"))
                    : (displayedValue ?? value)}
            </span>
            <Button
                variant="secondary"
                className={cx(classes.copyButton, isCopied && classes.copyButtonCopied)}
                startIcon={getIconUrlByName(isCopied ? "Check" : "ContentCopy")}
                disabled={value === undefined}
                aria-label={ariaLabel}
                onClick={copy}
            >
                {isCopied ? t("copied") : (copyLabel ?? t("copy"))}
            </Button>
        </div>
    );
}

export function S3DialogItemSummary(props: {
    name: string;
    isPublic?: boolean;
    icon?: "folder" | "object";
}) {
    const { name, isPublic = false, icon = "folder" } = props;

    const { classes } = useStyles_S3DialogItemSummary();
    const { t } = useTranslation({ S3DialogItemSummary });

    return (
        <div className={classes.root}>
            <span className={classes.iconSurface} aria-hidden="true">
                <Icon
                    icon={getIconUrlByName(icon === "folder" ? "Folder" : "Description")}
                    size="small"
                />
            </span>
            <Text typo="label 1" className={classes.name}>
                {name}
            </Text>
            {isPublic && (
                <span className={classes.publicPill}>
                    <Icon icon={getIconUrlByName("Public")} size="extra small" />
                    {t("public")}
                </span>
            )}
        </div>
    );
}

const useStyles_S3Dialog = tss.withName({ useS3DialogClasses }).create(({ theme }) => ({
    paper: {
        width: 650,
        maxWidth: "calc(100vw - 48px)",
        borderRadius: 12,
        padding: theme.spacing(4),
        boxSizing: "border-box"
    },

    overlayRoot: {
        "& .MuiBackdrop-root": {
            backgroundColor: alpha(theme.colors.useCases.surfaces.background, 0.72),
            backdropFilter: "blur(1px)"
        }
    },
    title: {
        marginBottom: theme.spacing(4),
        color: theme.colors.useCases.typography.textPrimary
    },

    subtitle: {
        marginBottom: theme.spacing(4),
        color: theme.colors.useCases.typography.textPrimary,
        lineHeight: 1.5
    },

    body: {
        width: "100%",
        overflow: "visible",
        color: theme.colors.useCases.typography.textPrimary
    },

    buttons: {
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: theme.spacing(2),
        marginTop: theme.spacing(4),
        "& .MuiButton-root": {
            marginLeft: 0
        }
    },

    hiddenButtons: {
        display: "none"
    }
}));

const { i18n: i18nS3DialogCopyField } = declareComponentKeys<
    "generating url" | "copy" | "copied"
>()({ S3DialogCopyField });

const { i18n: i18nS3DialogItemSummary } = declareComponentKeys<"public">()({
    S3DialogItemSummary
});

export type I18n = typeof i18nS3DialogCopyField | typeof i18nS3DialogItemSummary;

const useStyles_S3DialogTextInput = tss
    .withName({ S3DialogTextInput })
    .create(({ theme }) => ({
        root: {
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(2),
            minWidth: 0
        },
        label: {
            color: theme.colors.useCases.typography.textPrimary
        },
        input: {
            minHeight: 52,
            borderRadius: 12,
            border: "2px solid transparent",
            backgroundColor: theme.colors.useCases.surfaces.background,
            color: theme.colors.useCases.typography.textPrimary,
            transition: "border-color 160ms ease, background-color 160ms ease",
            "&:hover": {
                backgroundColor: theme.colors.useCases.surfaces.surface2,
                borderColor: "transparent"
            },
            "&.Mui-focused": {
                borderColor: theme.colors.useCases.typography.textFocus
            },
            "& .MuiInputBase-input": {
                ...theme.typography.variants["body 1"].style,
                padding: `${theme.spacing(1.5)}px ${theme.spacing(2)}px`,
                color: theme.colors.useCases.typography.textPrimary,
                "&::placeholder": {
                    color: theme.colors.useCases.typography.textSecondary,
                    opacity: 1
                }
            }
        },
        inputStrong: {
            "& .MuiInputBase-input": {
                fontWeight: 700
            }
        },
        inputError: {
            borderColor: theme.colors.useCases.alertSeverity.error.main
        },
        error: {
            color: theme.colors.useCases.alertSeverity.error.main
        }
    }));

const useStyles_S3DialogCopyField = tss
    .withName({ S3DialogCopyField })
    .create(({ theme }) => ({
        root: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1.5),
            minWidth: 0,
            minHeight: 52,
            padding: `${theme.spacing(0.75)}px ${theme.spacing(1.5)}px ${theme.spacing(
                0.75
            )}px ${theme.spacing(2)}px`,
            borderRadius: 12,
            border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: theme.colors.useCases.surfaces.background,
            boxSizing: "border-box",
            transition: "background-color 180ms ease, border-color 180ms ease"
        },
        rootCopied: {
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
            ...theme.typography.variants["body 1"].style
        },
        copyButton: {
            ...theme.typography.variants["label 2"].style,
            flex: "none",
            minHeight: 30,
            gap: 4,
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
        copyButtonCopied: {
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

const useStyles_S3DialogItemSummary = tss
    .withName({ S3DialogItemSummary })
    .create(({ theme }) => ({
        root: {
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1.5),
            minWidth: 0,
            minHeight: 40
        },
        iconSurface: {
            width: 36,
            height: 36,
            borderRadius: 12,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
            color: theme.colors.useCases.typography.textPrimary,
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        name: {
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: theme.colors.useCases.typography.textPrimary
        },
        publicPill: {
            ...theme.typography.variants["label 2"].style,
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(0.5),
            minHeight: 24,
            padding: `0 ${theme.spacing(1)}px`,
            borderRadius: 999,
            color: theme.colors.useCases.typography.textPrimary,
            backgroundColor: alpha(theme.colors.useCases.alertSeverity.error.main, 0.12),
            flex: "none"
        }
    }));
