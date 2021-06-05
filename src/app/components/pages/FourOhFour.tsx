
import { memo } from "react";
import { useTranslation } from "app/i18n/useTranslations";
import { createUseClassNames } from "app/theme";
import { cx } from "tss-react";
import { Typography } from "onyxia-ui";

export type Props = {
    className?: string;
};

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center",
            "backgroundColor": theme.colors.useCases.surfaces.background,
        }
    })
);

export const FourOhFour = memo((props: Props) => {

    const { className } = props;

    const { t } = useTranslation("FourOhFour");

    const { classNames } = useClassNames({});

    return (
        <div className={cx(classNames.root, className)}>
            <Typography variant="h1">
                {t("not found")} 😥
            </Typography>
        </div>
    );

});

export declare namespace FourOhFour {

    export type I18nScheme = {
        'not found': undefined;
    };

}

