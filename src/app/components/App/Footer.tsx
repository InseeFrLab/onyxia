

import { memo } from "react";
import { createUseClassNames } from "onyxia-design";
import { cx } from "tss-react";
import { Typography } from "app/components/designSystem/Typography";
import { useTranslation } from "app/i18n/useTranslations";
import { ReactComponent as GitHubSvg } from "app/assets/svg/GitHub.svg";

export type Props = {
    className?: string;
    onyxiaUiVersion: string;
    contributeHref: string;
    tosHref: string;
}

const { useClassNames } = createUseClassNames<Props>()(
    theme => ({
        "root": {
            "backgroundColor": theme.colors.useCases.surfaces.background,
            "display": "flex",
            "alignItems": "center",
            "padding": theme.spacing(0, 3),
            "& a:hover": {
                "textDecoration": "underline",
                "textDecorationColor": theme.colors.useCases.typography.textPrimary
            }
        },
        "icon": {
            "fill": theme.colors.useCases.typography.textPrimary
        },
        "contribute": {
            "display": "flex",
            "alignItems": "center",
        },
        "sep": {
            "flex": 1
        },
        "spacing": {
            "width": theme.spacing(3)
        }
    })
);

export const Footer = memo((props: Props) => {

    const { 
        contributeHref,
        tosHref,
        onyxiaUiVersion, 
        className
    } = props;


    const { classNames } = useClassNames(props);

    const { t } = useTranslation("Footer");

    const spacing = <div className={classNames.spacing}/>;

    return (
        <footer className={cx(classNames.root, className)}>
            <Typography variant="body2">2017 - 2021 Onyxia, InseefrLab</Typography>
            {spacing}
            <a href={contributeHref} className={classNames.contribute} target="_blank" rel="noreferrer"> 
                <GitHubSvg className={classNames.icon} />
                &nbsp;
                <Typography variant="body2">{t("contribute")}</Typography> 
            </a>
            <div className={classNames.sep}/>
            <a href={tosHref} target="_blank" rel="noreferrer"> <Typography variant="body2">{t("terms of service")}</Typography> </a>
            {spacing}
            <a href={`https://github.com/InseeFrLab/onyxia-ui/tree/v${onyxiaUiVersion}`} target="_blank" rel="noreferrer"> 
                <Typography variant="body2">v{onyxiaUiVersion} </Typography>
            </a>
        </footer>
    );

});

export declare namespace Footer {

    export type I18nScheme = {
        'contribute': undefined;
        'terms of service': undefined;
    };

}