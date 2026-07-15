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
};

export const ProviderValueField = memo((props: Props) => {
    const { label, value, onRequestCopy, isSensitiveInformation = false } = props;

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

    return (
        <div className={classes.root}>
            <Text typo="label 1">{label}</Text>
            <div className={cx(classes.codeFrame, isCopied && classes.codeFrameCopied)}>
                <Text typo="body 1" className={classes.codeFrameValue}>
                    {isHidden ? "•".repeat(Math.max(value.length, 30)) : value}
                </Text>
                {isSensitiveInformation && (
                    <IconButton
                        icon={getIconUrlByName(isHidden ? "Visibility" : "VisibilityOff")}
                        onClick={onToggleHidden}
                        size="small"
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
                >
                    {isCopied ? t("copied") : t("copy")}
                </Button>
            </div>
        </div>
    );
});

const { i18n } = declareComponentKeys<"copy" | "copied">()({ ProviderValueField });
export type I18n = typeof i18n;

const useStyles = tss.withName({ ProviderValueField }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.5)
    },
    codeFrame: {
        minHeight: 45,
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
        padding: `${theme.spacing(1)}px ${theme.spacing(1.5)}px`,
        borderRadius: theme.spacing(1),
        border: "1px solid transparent",
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        minWidth: 0,
        boxSizing: "border-box",
        transition: "background-color 180ms ease, border-color 180ms ease"
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
        fontFamily: "monospace"
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
    }
}));
