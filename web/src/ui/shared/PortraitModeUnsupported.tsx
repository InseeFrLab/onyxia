import { memo } from "react";
import { useTranslation } from "ui/i18n";
import { tss, Text, Icon } from "ui/theme";
import { declareComponentKeys } from "i18nifty";

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
                <Icon iconId="screenRotation" className={classes.icon} />
                <Text typo="body 1" className={classes.instructions}>
                    {t("instructions")}
                </Text>
            </div>
        </div>
    );
});

const useStyles = tss.withName({ PortraitModeUnsupported }).create(({ theme }) => ({
    "root": {
        "height": "100vh",
        "display": "flex",
        "alignItems": "center",
        "justifyContent": "center"
    },
    "icon": {
        "fontSize": 5 * theme.typography.rootFontSizePx
    },
    "wrapper": {
        "textAlign": "center"
    },
    "instructions": {
        "marginTop": theme.spacing(3)
    }
}));

export const { i18n } = declareComponentKeys<"instructions">()({
    PortraitModeUnsupported
});
