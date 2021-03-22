
import { useTranslation } from "app/i18n/useTranslations";
import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";
import { Typography } from "app/components/designSystem/Typography";

export type Props = {
    className?: string;
};

const { useClassNames } = createUseClassNames()(
    (theme)=>({
        "root": {
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center",
            "backgroundColor": theme.custom.colors.useCases.surfaces.background,
        }
    })
);

export function FourOhFour(props: Props) {

    const { className } = props;

    const { t } = useTranslation("FourOhFour");

    const { classNames }  = useClassNames({});

    return (
        <div className={cx(classNames.root, className)}>
            <Typography variant="h1">
                {t("not found")} 😥
            </Typography>
        </div>
    );

}


export declare namespace FourOhFour {

    export type I18nScheme = {
        'not found': undefined;
    };

}

