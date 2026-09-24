import { memo, useEffect, useState } from "react";
import { useTranslation } from "ui/i18n";
import { tss } from "tss";
import { alpha } from "@mui/material/styles";
import { declareComponentKeys } from "i18nifty";
import { useConstCallback } from "powerhooks/useConstCallback";
import { IconButton } from "onyxia-ui/IconButton";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";

export type Props = {
    label: string;
    value: string;
    onRequestCopy: () => void | Promise<void>;
    isSensitiveInformation?: boolean;
    onChange?: (value: string) => void;
    onSave?: () => void | Promise<void>;
    saveLabel?: string;
    disabled?: boolean;
    errorMessage?: string;
};

export const ProviderValueField = memo((props: Props) => {
    const {
        label,
        value,
        onRequestCopy,
        isSensitiveInformation = false,
        onChange,
        onSave,
        saveLabel,
        disabled = false,
        errorMessage
    } = props;

    const { classes, cx } = useStyles();
    const { t } = useTranslation({ ProviderValueField });
    const [isHidden, setIsHidden] = useState(isSensitiveInformation);
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

    const onToggleHidden = useConstCallback(() => setIsHidden(isHidden => !isHidden));
    const onCopy = useConstCallback(async () => {
        await onRequestCopy();
        setIsCopied(true);
    });

    const isEditable = onChange !== undefined;

    return (
        <form
            className={classes.root}
            onSubmit={event => {
                event.preventDefault();
                onSave?.();
            }}
        >
            <Text typo="label 1" color={isEditable ? "primary" : "secondary"}>
                {label}
            </Text>
            <div
                className={cx(
                    classes.codeFrame,
                    isEditable ? classes.codeFrameEditable : classes.codeFrameReadOnly,
                    errorMessage !== undefined && classes.codeFrameError,
                    isCopied && classes.codeFrameCopied
                )}
            >
                {isEditable ? (
                    <input
                        className={classes.codeFrameInput}
                        type={isHidden ? "password" : "text"}
                        value={value}
                        disabled={disabled}
                        onChange={event => onChange(event.target.value)}
                        autoComplete="off"
                        placeholder={label}
                        aria-label={label}
                    />
                ) : (
                    <Text typo="label 1" className={classes.codeFrameValue}>
                        {isHidden ? "•".repeat(Math.max(value.length, 30)) : value}
                    </Text>
                )}
                {isSensitiveInformation && (
                    <IconButton
                        icon={getIconUrlByName(isHidden ? "Visibility" : "VisibilityOff")}
                        onClick={onToggleHidden}
                        size="small"
                        disabled={disabled}
                    />
                )}
                <Button
                    variant="secondary"
                    startIcon={getIconUrlByName(isCopied ? "Check" : "ContentCopy")}
                    onClick={onCopy}
                    className={cx(
                        classes.codeFrameButton,
                        isCopied && classes.codeFrameButtonCopied
                    )}
                    disabled={disabled}
                >
                    {isCopied ? t("copied") : t("copy")}
                </Button>
                {onSave !== undefined && (
                    <Button
                        type="submit"
                        disabled={disabled}
                        className={cx(classes.codeFrameButton, classes.saveButton)}
                    >
                        {saveLabel}
                    </Button>
                )}
            </div>
            {errorMessage !== undefined && (
                <Text typo="caption" className={classes.errorMessage}>
                    {errorMessage}
                </Text>
            )}
        </form>
    );
});

const { i18n } = declareComponentKeys<"copy" | "copied">()({ ProviderValueField });
export type I18n = typeof i18n;

const useStyles = tss.withName({ ProviderValueField }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1)
    },
    codeFrame: {
        minHeight: 45,
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2.5),
        padding: `${theme.spacing(2)}px ${theme.spacing(2.5)}px`,
        borderRadius: theme.spacing(2),
        border: "1px solid transparent",
        minWidth: 0,
        boxSizing: "border-box",
        transition: "background-color 180ms ease, border-color 180ms ease"
    },
    codeFrameEditable: {
        backgroundColor: theme.colors.useCases.surfaces.background,
        "&:hover": {
            backgroundColor: theme.colors.useCases.surfaces.surface2
        },
        "&:focus-within": {
            borderColor: theme.colors.useCases.buttons.actionActive
        }
    },
    codeFrameReadOnly: {
        borderColor: theme.colors.useCases.surfaces.surface2,
        backgroundColor: "transparent"
    },
    codeFrameError: {
        "&&": {
            borderColor: theme.colors.useCases.alertSeverity.error.main
        }
    },
    codeFrameCopied: {
        borderColor: alpha(theme.colors.useCases.alertSeverity.success.main, 0.36),
        backgroundColor: theme.colors.useCases.alertSeverity.success.background
    },
    codeFrameValue: {
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color: theme.colors.useCases.typography.textPrimary
    },
    codeFrameInput: {
        flex: 1,
        minWidth: 0,
        border: 0,
        outline: 0,
        padding: 0,
        color: theme.colors.useCases.typography.textPrimary,
        backgroundColor: "transparent",
        ...theme.typography.variants["label 1"].style,
        "&::placeholder": {
            ...theme.typography.variants["body 1"].style,
            color: theme.colors.useCases.typography.textSecondary,
            opacity: 1
        },
        "&:disabled": {
            color: theme.colors.useCases.typography.textDisabled
        }
    },
    codeFrameButton: {
        minHeight: 28,
        paddingTop: theme.spacing(0.5),
        paddingBottom: theme.spacing(0.5),
        flexShrink: 0
    },
    codeFrameButtonCopied: {
        "&&": {
            color: theme.colors.useCases.typography.textPrimary,
            backgroundColor: theme.colors.useCases.alertSeverity.success.main,
            borderColor: theme.colors.useCases.alertSeverity.success.main,
            "&:hover": {
                backgroundColor: theme.colors.useCases.alertSeverity.success.main
            }
        }
    },
    saveButton: {
        flexShrink: 0
    },
    errorMessage: {
        color: theme.colors.useCases.alertSeverity.error.main
    }
}));
