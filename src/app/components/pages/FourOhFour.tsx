import { memo } from "react";
import { useTranslation } from "app/i18n/useTranslations";
import { makeStyles, Text } from "app/theme";

export type Props = {
    className?: string;
};

const useStyles = makeStyles()(theme => ({
    "root": {
        "height": "100%",
        "display": "flex",
        "alignItems": "center",
        "justifyContent": "center",
        "backgroundColor": theme.colors.useCases.surfaces.background,
    },
}));

export const FourOhFour = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation("FourOhFour");

    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)}>
            <Text typo="display heading">{t("not found")} 😥</Text>
        </div>
    );
});

export declare namespace FourOhFour {
    export type I18nScheme = {
        "not found": undefined;
    };
}
