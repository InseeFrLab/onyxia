import { memo } from "react";
import { useTranslation } from "ui/i18n";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { Icon } from "onyxia-ui/Icon";
import { declareComponentKeys } from "i18nifty";
import { getIconUrlByName } from "lazy-icons";

export type Props = {
    className?: string;
};

export const PortraitModeUnsupported = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation({ PortraitModeUnsupported });

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.wrapper}>
                <Icon
                    icon={getIconUrlByName("ScreenRotation")}
                    className={classes.icon}
                />
                <Text typo="body 1" className={classes.instructions}>
                    {t("instructions")}
                </Text>
            </div>
        </div>
    );
});

const useStyles = tss.withName({ PortraitModeUnsupported }).create(({ theme }) => ({
    root: {
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    icon: {
        fontSize: 5 * theme.typography.rootFontSizePx
    },
    wrapper: {
        textAlign: "center"
    },
    instructions: {
        marginTop: theme.spacing(3)
    }
}));

const { i18n } = declareComponentKeys<"instructions">()({
    PortraitModeUnsupported
});
export type I18n = typeof i18n;
