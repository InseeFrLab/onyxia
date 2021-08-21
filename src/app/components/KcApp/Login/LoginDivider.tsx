import { memo } from "react";
import { makeStyles, Text } from "app/theme";

import { useTranslation } from "app/i18n/useTranslations";

export type Props = {
    className?: string;
};

const useStyles = makeStyles()(theme => ({
    "root": {
        "display": "flex",
        "alignItems": "center",
    },
    "separator": {
        "height": 1,
        "backgroundColor": theme.colors.useCases.typography.textSecondary,
        "flex": 1,
    },
    "text": {
        ...theme.spacing.rightLeft("margin", 2),
        "paddingBottom": 2,
    },
}));

export const LoginDivider = memo((props: Props) => {
    const { className } = props;

    const { classes, cx } = useStyles();

    const { t } = useTranslation("LoginDivider");

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

export declare namespace LoginDivider {
    export type I18nScheme = {
        or: undefined;
    };
}
