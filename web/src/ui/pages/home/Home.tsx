import { useEffect, useMemo, memo } from "react";
import { Button } from "ui/theme";
import { routes } from "ui/routes";
import { tss, Text, useStyles as useClasslessStyles } from "ui/theme";
import { ReactComponent as OnyxiaLogoSvg } from "ui/assets/svg/OnyxiaLogo.svg";
import { useCoreFunctions } from "core";
import { useTranslation } from "ui/i18n";
import iconCommunitySvgUrl from "ui/assets/svg/IconCommunity.svg";
import iconServiceSvg from "ui/assets/svg/IconService.svg";
import iconStorageSvg from "ui/assets/svg/IconStorage.svg";
import { Card as OnyxiaUiCard } from "onyxia-ui/Card";
import type { Link } from "type-route";
import onyxiaNeumorphismDarkModeUrl from "ui/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "ui/assets/svg/OnyxiaNeumorphismLightMode.svg";
import dragoonSvgUrl from "ui/assets/svg/Dragoon.svg";
import { getIsHomePageDisabled } from "ui/env";
import { useConst } from "powerhooks/useConst";
import { useStateRef } from "powerhooks/useStateRef";
import { declareComponentKeys } from "i18nifty";
import type { PageRoute } from "./route";
import { DynamicSvg, createDynamicSvg } from "ui/tools/DynamicSvg";

type Props = {
    route: PageRoute;
    className?: string;
};

export default function Home(props: Props) {
    const { className } = props;

    useConst(() => {
        if (getIsHomePageDisabled()) {
            routes.catalog().replace();
        }
    });

    const { classes, cx } = useStyles();

    const { userAuthentication } = useCoreFunctions();

    const isUserLoggedIn = userAuthentication.getIsUserLoggedIn();

    const { t } = useTranslation({ Home });

    const myFilesLink = useMemo(() => routes.myFiles().link, []);
    const catalogExplorerLink = useMemo(() => routes.catalog().link, []);

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.hero}>
                <div className={classes.heroTextWrapper}>
                    <OnyxiaLogoSvg className={classes.svg} />
                    <Text typo="display heading">
                        {isUserLoggedIn
                            ? t("welcome", {
                                  "who": userAuthentication.getUser().firstName ?? ""
                              })
                            : t("title")}
                    </Text>
                    <Text typo="subtitle" className={classes.heroSubtitle}>
                        {t("subtitle")}
                    </Text>
                    {isUserLoggedIn && (
                        <Button href="https://docs.sspcloud.fr/">{t("new user")}</Button>
                    )}
                </div>
                <DynamicSvg svgUrl={dragoonSvgUrl} className={classes.dragoon} />
            </div>
            <div className={classes.cardsWrapper}>
                <Card
                    Icon={createDynamicSvg(iconServiceSvg)}
                    title={t("cardTitle1")}
                    text={t("cardText1")}
                    buttonText={t("cardButton1")}
                    link={catalogExplorerLink}
                />
                <Card
                    className={classes.middleCard}
                    Icon={createDynamicSvg(iconCommunitySvgUrl)}
                    title={t("cardTitle2")}
                    text={t("cardText2")}
                    buttonText={t("cardButton2")}
                    link="https://join.slack.com/t/3innovation/shared_invite/zt-1hnzukjcn-6biCSmVy4qvyDGwbNI~sWg"
                />
                <Card
                    Icon={createDynamicSvg(iconStorageSvg)}
                    title={t("cardTitle3")}
                    text={t("cardText3")}
                    buttonText={t("cardButton3")}
                    link={myFilesLink}
                />
            </div>
        </div>
    );
}

export const { i18n } = declareComponentKeys<
    | { K: "welcome"; P: { who: string } }
    | "login"
    | "new user"
    | "title"
    | "subtitle"
    | "cardTitle1"
    | "cardTitle2"
    | "cardTitle3"
    | "cardText1"
    | "cardText2"
    | "cardText3"
    | "cardButton1"
    | "cardButton2"
    | "cardButton3"
>()({ Home });

const useStyles = tss.withName({ Home }).create(({ theme }) => ({
    "root": {
        "height": "100%",
        "overflow": "auto",
        "backgroundColor": "transparent",
        "display": "flex",
        "flexDirection": "column"
    },
    "hero": {
        "flex": 1,
        "position": "relative",
        "backgroundImage": `url(${
            theme.isDarkModeEnabled
                ? onyxiaNeumorphismDarkModeUrl
                : onyxiaNeumorphismLightModeUrl
        })`,
        "backgroundPosition": "100% 0%",
        "backgroundRepeat": "no-repeat",
        "backgroundSize": "80%",
        "overflow": "hidden"
    },
    "dragoon": {
        "position": "absolute",
        "width": "46%",
        "right": -82,
        "top": -206,
        "& .focus-color": {
            "fill": theme.colors.useCases.typography.textFocus
        }
    },
    "heroTextWrapper": {
        "paddingLeft": theme.spacing(3),
        "maxWidth": "42%",
        "& > *": {
            "marginBottom": theme.spacing(4)
        }
    },
    "heroSubtitle": {
        "marginBottom": theme.spacing(5)
    },
    "cardsWrapper": {
        "borderTop": `1px solid ${theme.colors.useCases.typography.textPrimary}`,
        "display": "flex",
        ...theme.spacing.topBottom("padding", 4),
        "& > *": {
            "flex": 1
        }
    },
    "middleCard": {
        ...theme.spacing.rightLeft("margin", 3)
    },
    "svg": {
        "fill": theme.colors.useCases.typography.textFocus,
        "width": 122
    }
}));

const { Card } = (() => {
    type Props = {
        className?: string;
        title: string;
        text: string;
        buttonText: string;
        Icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
        link: Link | string;
    };

    const Card = memo((props: Props) => {
        const { title, text, buttonText, Icon, className, link } = props;

        const { css, cx, theme } = useClasslessStyles();

        const iconRef = useStateRef<SVGSVGElement>(null);

        useEffect(() => {
            if (iconRef.current === null) {
                return;
            }
            iconRef.current
                .querySelectorAll("g")
                .forEach(g =>
                    g.setAttribute(
                        "fill",
                        g.classList.contains("colorPrimary")
                            ? theme.colors.useCases.typography.textFocus
                            : theme.colors.useCases.typography.textPrimary
                    )
                );
        }, [theme, iconRef.current]);

        return (
            <OnyxiaUiCard
                className={cx(
                    css({
                        "display": "flex",
                        "flexDirection": "column",
                        "padding": theme.spacing(4),
                        "backgroundColor": theme.isDarkModeEnabled ? "#383E50" : undefined
                    }),
                    className
                )}
            >
                <div className={css({ "display": "flex" })}>
                    <Icon ref={iconRef} width={120} height={120} />
                    <div
                        className={css({
                            "flex": 1,
                            "display": "flex",
                            "alignItems": "center",
                            ...theme.spacing.rightLeft("padding", 4)
                        })}
                    >
                        <Text typo="section heading">{title}</Text>
                    </div>
                </div>
                <div
                    className={css({
                        "flex": 1,
                        "display": "flex",
                        "flexDirection": "column",
                        "paddingTop": theme.spacing(3)
                    })}
                >
                    <div className={css({ "flex": 1 })}>
                        <Text typo="body 1">{text}</Text>
                    </div>
                    <div
                        className={css({
                            "marginTop": theme.spacing(5),
                            "display": "flex"
                        })}
                    >
                        <div style={{ "flex": 1 }} />
                        <Button
                            variant="secondary"
                            {...(typeof link === "string"
                                ? { "href": link }
                                : { ...link, "doOpenNewTabIfHref": false })}
                        >
                            {buttonText}
                        </Button>
                    </div>
                </div>
            </OnyxiaUiCard>
        );
    });

    return { Card };
})();
