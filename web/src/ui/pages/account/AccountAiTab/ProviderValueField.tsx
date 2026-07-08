import { memo, useState } from "react";
import { useTranslation } from "ui/i18n";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { useConstCallback } from "powerhooks/useConstCallback";
import { IconButton } from "onyxia-ui/IconButton";
import { Button } from "onyxia-ui/Button";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";

export type Props = {
    label: string;
    value: string;
    onRequestCopy: () => void;
    isSensitiveInformation?: boolean;
};

export const ProviderValueField = memo((props: Props) => {
    const { label, value, onRequestCopy, isSensitiveInformation = false } = props;

    const { classes } = useStyles();
    const { t } = useTranslation({ ProviderValueField });
    const [isHidden, setIsHidden] = useState(isSensitiveInformation);

    const onToggleHidden = useConstCallback(() => setIsHidden(isHidden => !isHidden));

    return (
        <div className={classes.root}>
            <Text typo="label 1">{label}</Text>
            <div className={classes.codeFrame}>
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
                    startIcon={getIconUrlByName("ContentCopy")}
                    onClick={onRequestCopy}
                    className={classes.codeFrameButton}
                >
                    {t("copy")}
                </Button>
            </div>
        </div>
    );
});

const { i18n } = declareComponentKeys<"copy">()({ ProviderValueField });
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
        backgroundColor: theme.colors.useCases.surfaces.surface2,
        minWidth: 0
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
    }
}));
