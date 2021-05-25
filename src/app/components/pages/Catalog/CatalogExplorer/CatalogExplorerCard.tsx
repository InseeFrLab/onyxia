
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
            "backgroundColor": theme.custom.colors.useCases.surfaces.surface1,
            "&:hover": {
                "boxShadow": theme.custom.shadows[6]
            },
            "display": "flex",
            "flexDirection": "column"
        },
        "aboveDivider": {
            "padding": theme.spacing(2, 3),
            "borderBottom": `1px solid ${theme.custom.colors.useCases.typography.textSecondary}`,
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
            //TODO: Commented out for mozilla (longer one always have scroll in a grid)
            //"overflow": "auto"
        },
        "bodyTypo": {
            "color": theme.custom.colors.useCases.typography.textSecondary
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
    packageIconUrl?: string;
    packageName: string;
    packageDescription: string;
    onRequestLaunch(): void;
    packageHomeUrl: string | undefined;
};

export const CatalogExplorerCard = memo((props: Props) => {

    const {
        className,
        packageIconUrl: packageIcon,
        packageName,
        packageDescription,
        packageHomeUrl,
        onRequestLaunch
    } = props;

    const { classNames } = useClassNames({});

    const { t } = useTranslation("CatalogExplorerCard");

    return (
        <div className={cx(classNames.root, className)}>
            <div className={classNames.aboveDivider}>
                {packageIcon !== undefined &&
                    <Avatar src={packageIcon} />}
                <Typography
                    className={classNames.title}
                    variant="h5"
                >
                    {packageName}
                </Typography>

            </div>
            <div className={classNames.belowDivider}>
                <div className={classNames.body} >
                    <Typography 
                        variant="body1" 
                        className={classNames.bodyTypo}
                    >
                        {packageDescription}
                    </Typography>
                </div>
                <div className={classNames.buttonsWrapper}>
                    {packageHomeUrl !== undefined &&
                        <Button
                            href={packageHomeUrl}
                            color="ternary"
                        >
                            {t("learn more")}
                        </Button>}
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

export declare namespace CatalogExplorerCard {

    export type I18nScheme = {
        'learn more': undefined;
        launch: undefined;
    };
}