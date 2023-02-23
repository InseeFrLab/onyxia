import { memo } from "react";
import { makeStyles, Text } from "ui/theme";
import { useTranslation } from "ui/i18n";
import { declareComponentKeys } from "i18nifty";

export type Props = {
    className?: string;
};

export const LoginDivider = memo((props: Props) => {
    const { className } = props;

    const { classes, cx } = useStyles();

    const { t } = useTranslation({ LoginDivider });

    const separator = <div role="separator" className={classes.separator} />;

    return (
        <div className={cx(classes.root, className)}>
            {separator}
            <Text typo="body 2" color="secondary" className={classes.text}>
                {t("or")}
            </Text>
            {separator}
        </div>
    );
});

export const { i18n } = declareComponentKeys<"or">()({
    LoginDivider
});

const useStyles = makeStyles({ "name": { LoginDivider } })(theme => ({
    "root": {
        "display": "flex",
        "alignItems": "center"
    },
    "separator": {
        "height": 1,
        "backgroundColor": theme.colors.useCases.typography.textSecondary,
        "flex": 1
    },
    "text": {
        ...theme.spacing.rightLeft("margin", 2),
        "paddingBottom": 2
    }
}));
