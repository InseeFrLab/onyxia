import { alpha } from "@mui/material/styles";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { getIconUrlByName } from "lazy-icons";
import { tss } from "tss";
import { declareComponentKeys, useTranslation } from "ui/i18n";
import {
    S3DialogCopyUrlField,
    S3DialogItemSummary
} from "ui/shared/codex/S3DialogPrimitives";

export type S3SharePrefixDialogProps = {
    className?: string;
    prefixName: string;
    url: string;
};

export function S3SharePrefixDialog(props: S3SharePrefixDialogProps) {
    const { className, prefixName, url } = props;

    const { t } = useTranslation({ S3SharePrefixDialog });
    const { classes, cx } = useStyles();

    return (
        <section className={cx(classes.root, className)}>
            <div className={classes.prefixSection}>
                <S3DialogItemSummary
                    className={classes.prefixSummary}
                    name={prefixName}
                    isPublic={true}
                    icon="folder"
                />
            </div>

            <div className={classes.linkSection}>
                <S3DialogCopyUrlField
                    value={url}
                    ariaLabel={t("copy folder URL aria label")}
                />
            </div>

            <div className={classes.infoSection}>
                <Icon icon={getIconUrlByName("Info")} size="small" />
                <Text typo="body 1" className={classes.infoText}>
                    {t("public sharing note")}
                </Text>
            </div>
        </section>
    );
}

const useStyles = tss.withName({ S3SharePrefixDialog }).create(({ theme }) => ({
    root: {
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box"
    },
    prefixSection: {
        borderBottom: `1px solid ${theme.colors.useCases.surfaces.surface2}`
    },
    prefixSummary: {
        minHeight: 56,
        gap: theme.spacing(2.5),
        "& > :first-child": {
            width: 54,
            height: 54,
            borderRadius: 10,
            border: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
            backgroundColor: alpha(theme.colors.useCases.surfaces.surface2, 0.38)
        },
        "& > :nth-child(2)": {
            whiteSpace: "normal",
            fontSize: 20,
            lineHeight: 1.35,
            fontWeight: 500
        },
        marginBottom: theme.spacing(3)
    },
    linkSection: {
        minWidth: 0,
        ...theme.spacing.topBottom("padding", 3)
    },
    infoSection: {
        display: "grid",
        gridTemplateColumns: "32px minmax(0, 1fr)",
        gap: theme.spacing(2),
        alignItems: "start",
        paddingTop: theme.spacing(3),
        borderTop: `1px solid ${theme.colors.useCases.surfaces.surface2}`,
        color: theme.colors.useCases.typography.textFocus
    },
    infoText: {
        color: theme.colors.useCases.typography.textSecondary,
        lineHeight: 1.55,
        maxWidth: 720
    }
}));

const { i18n } = declareComponentKeys<
    "copy folder URL aria label" | "public sharing note"
>()({ S3SharePrefixDialog });
export type I18n = typeof i18n;
