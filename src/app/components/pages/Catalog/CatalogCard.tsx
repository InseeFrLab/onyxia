
import { memo } from "react";
import { createUseClassNames } from "app/theme/useClassNames";
import Avatar from "@material-ui/core/Avatar";
import { Typography } from "app/components/designSystem/Typography";
import { Button } from "app/components/designSystem/Button";
import { useTranslation } from "app/i18n/useTranslations";
import { cx } from "tss-react";

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "borderRadius": 8,
            "boxShadow": theme.custom.shadows[1],
            "backgroundColor": theme.custom.colors.useCases.surfaces.surfaces,
            "&:hover": {
                "boxShadow": theme.custom.shadows[5]
            },
            "display": "flex",
            "flexDirection": "column"
        },
        "aboveDivider": {
            "padding": theme.spacing(2, 3),
            "borderBottom": `1px solid ${theme.custom.colors.palette.whiteSnow.greyVariant1}`,
            "boxSizing": "border-box"
        },
        "title": {
            "marginTop": theme.spacing(2)
        },
        "belowDivider": {
            "padding": theme.spacing(3),
            "paddingTop": theme.spacing(2),
            "flex": 1,
            "display": "flex",
            "flexDirection": "column",
            "overflow": "hidden"
        },
        "body": {
            "margin": 0,
            "flex": 1,
            "overflow": "auto"
        },
        "buttonsWrapper": {
            "display": "flex",
            "justifyContent": "flex-end",
            "marginTop": theme.spacing(3)
        },
        "launchButton": {
            "marginLeft": theme.spacing(1)
        }
    })
);

export type Props = {
    className?: string;
    serviceImageUrl?: string;
    serviceTitle: string;
    serviceDescription: string;
    onRequestLaunch(): void;
    onRequestLearnMore?(): void;
};

export const CatalogCard = memo((props: Props) => {

    const {
        className,
        serviceImageUrl,
        serviceTitle,
        serviceDescription,
        onRequestLearnMore,
        onRequestLaunch
    } = props;

    const { classNames } = useClassNames({});

    const { t } = useTranslation("CatalogCard");

    return (
        <div className={cx(classNames.root, className)}>
            <div className={classNames.aboveDivider}>
                {serviceImageUrl !== undefined &&
                    <Avatar src={serviceImageUrl} />}
                <Typography
                    className={classNames.title}
                    variant="h5"
                >
                    {serviceTitle}
                </Typography>

            </div>
            <div className={classNames.belowDivider}>
                <div className={classNames.body} >
                    <Typography variant="body1" >
                        {serviceDescription}
                    </Typography>
                </div>
                <div className={classNames.buttonsWrapper}>
                    {onRequestLearnMore !== undefined &&
                        <Button onClick={onRequestLearnMore}>{t("learn more")}</Button>}
                    <Button
                        className={classNames.launchButton}
                        color="secondary"
                        onClick={onRequestLaunch}
                    >{t("launch")}</Button>
                </div>

            </div>
        </div>
    );

});

export declare namespace CatalogCard {

    export type I18nScheme = {
        'learn more': undefined;
        launch: undefined;
    };
}