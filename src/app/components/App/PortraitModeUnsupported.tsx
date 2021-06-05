

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
            "height": "100vh",
            "display": "flex",
            "alignItems": "center"
        },
        "wrapper": {
            "textAlign": "center"
        },
        "instructions": {
            "marginTop": theme.spacing(2)
        }
    })
);

export const PortraitModeUnsupported = memo((props: Props) => {

    const { className } = props;

    const { t } = useTranslation("PortraitModeUnsupported");

    const { classNames } = useClassNames({});

    return (
        <div className={cx(classNames.root, className)}>
            <div className={classNames.wrapper}>
                <Typography variant="h4">
                    {t("portrait mode not supported")} 🙇
            </Typography>
                <Typography
                    variant="body1"
                    className={classNames.instructions}
                >
                    {t("instructions")}
                </Typography>
            </div>
        </div>
    );

});


export declare namespace PortraitModeUnsupported {

    export type I18nScheme = {
        'portrait mode not supported': undefined;
        'instructions': undefined;
    };

}

