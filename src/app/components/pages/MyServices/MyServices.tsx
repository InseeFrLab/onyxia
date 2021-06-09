
import { memo } from "react";
import { PageHeader } from "app/components/shared/PageHeader";
import { createUseClassNames } from "app/theme";
import { cx } from "tss-react";
import { useTranslation } from "app/i18n/useTranslations";
import { MyServicesButtonBar } from "./MyServicesButtonBar";
import { MyServicesCards } from "./MyServicesCards";
import { MyServicesSavedConfigs } from "./MyServicesSavedConfigs";
import { ButtonId } from "./MyServicesButtonBar";
import { useConstCallback } from "powerhooks";
import { Typography } from "onyxia-ui";

export type Props = {
    className: string;
};

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "display": "flex",
            "flexDirection": "column"
        },
        "contextTypo": {
            "margin": theme.spacing(3, 0)
        },
        /*
        "payload": { 
            "overflow": "hidden",
            "flex": 1
        }
        */
    })
);

export const MyServices = memo((props: Props) => {

    const { className } = props;

    const { classNames } = useClassNames({});

    const { t } = useTranslation("MyServices");

    const onButtonBarClick = useConstCallback(
        (buttonId: ButtonId) => {

            //TODO

        }
    );



    return (
        <div className={cx(classNames.root, className)}>
            <PageHeader
                icon="services"
                text1={t("text1")}
                text2={t("text2")}
                text3={t("text3")}
            />
            <MyServicesButtonBar
                onClick={onButtonBarClick}
            />
            <Typography
                variant="h4"
                className={classNames.contextTypo}
            >
                {t("running services")}
            </Typography>
            

        </div>
    );


});

export declare namespace MyServices {

    export type I18nScheme = {
        text1: undefined;
        text2: undefined;
        text3: undefined;
        'running services': undefined;
    };

}




