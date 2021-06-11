

import { memo } from "react";
import { createUseClassNames } from "app/theme";
import { cx } from "tss-react";
import { Typography } from "onyxia-ui";
import { useTranslation } from "app/i18n/useTranslations";
import { ReactComponent as GitHubSvg } from "app/assets/svg/GitHub.svg";

export type Props = {
    className?: string;
    packageJsonVersion: string;
    contributeUrl: string;
    tosUrl: string;
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
        contributeUrl,
        tosUrl,
        packageJsonVersion, 
        className
    } = props;


    const { classNames } = useClassNames(props);

    const { t } = useTranslation("Footer");

    const spacing = <div className={classNames.spacing}/>;

    return (
        <footer className={cx(classNames.root, className)}>
            <Typography variant="body2">2017 - 2021 Onyxia, InseefrLab</Typography>
            {spacing}
            <a href={contributeUrl} className={classNames.contribute} target="_blank" rel="noreferrer"> 
                <GitHubSvg className={classNames.icon} />
                &nbsp;
                <Typography variant="body2">{t("contribute")}</Typography> 
            </a>
            <div className={classNames.sep}/>
            <a href={tosUrl} target="_blank" rel="noreferrer"> <Typography variant="body2">{t("terms of service")}</Typography> </a>
            {spacing}
            <a href={`https://github.com/InseeFrLab/onyxia-web/tree/v${packageJsonVersion}`} target="_blank" rel="noreferrer"> 
                <Typography variant="body2">v{packageJsonVersion} </Typography>
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