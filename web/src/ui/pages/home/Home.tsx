import { useMemo, memo } from "react";
import { routes } from "ui/routes";
import { tss, useStyles as useClasslessStyles } from "tss";
import { Text } from "onyxia-ui/Text";
import { Button } from "onyxia-ui/Button";
import { useCoreFunctions } from "core";
import { useTranslation } from "ui/i18n";
import pictogramCommunitySvgUrl from "ui/assets/svg/PictogramCommunity.svg";
import pictogramServiceSvg from "ui/assets/svg/PictogramService.svg";
import iconStorageSvg from "ui/assets/svg/PictogramStorage.svg";
import { Card as OnyxiaUiCard } from "onyxia-ui/Card";
import type { Link } from "type-route";
import { env } from "env-parsed";
import { useConst } from "powerhooks/useConst";
import { declareComponentKeys } from "i18nifty";
import type { PageRoute } from "./route";
import { ThemedImage } from "onyxia-ui/ThemedImage";
import { useResolveAssetVariantUrl } from "onyxia-ui";

type Props = {
    route: PageRoute;
    className?: string;
};

export default function Home(props: Props) {
    const { className } = props;

    useConst(() => {
        if (env.DISABLE_HOMEPAGE) {
            routes.catalog().replace();
        }
    });

    const backgroundUrl = useResolveAssetVariantUrl(env.BACKGROUND_ASSET);

    const { classes, cx } = useStyles({ backgroundUrl });

    const { userAuthentication } = useCoreFunctions();

    const isUserLoggedIn = userAuthentication.getIsUserLoggedIn();

    const { t } = useTranslation({ Home });

    const myFilesLink = useMemo(() => routes.myFiles().link, []);
    const catalogExplorerLink = useMemo(() => routes.catalog().link, []);

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.hero}>
                <div className={classes.heroTextWrapper}>
                    <ThemedImage url={env.HOMEPAGE_LOGO} className={classes.logo} />
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
                <ThemedImage
                    url={env.HOMEPAGE_MAIN_ASSET}
                    className={classes.mainAsset}
                />
            </div>
            <div className={classes.cardsWrapper}>
                <Card
                    pictogramUrl={pictogramServiceSvg}
                    title={t("cardTitle1")}
                    text={t("cardText1")}
                    buttonText={t("cardButton1")}
                    link={catalogExplorerLink}
                />
                <Card
                    className={classes.middleCard}
                    pictogramUrl={pictogramCommunitySvgUrl}
                    title={t("cardTitle2")}
                    text={t("cardText2")}
                    buttonText={t("cardButton2")}
                    link="https://join.slack.com/t/3innovation/shared_invite/zt-1hnzukjcn-6biCSmVy4qvyDGwbNI~sWg"
                />
                <Card
                    pictogramUrl={iconStorageSvg}
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

const useStyles = tss
    .withName({ Home })
    .withParams<{ backgroundUrl: string }>()
    .create(({ theme, backgroundUrl }) => ({
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
            "backgroundImage": `url(${backgroundUrl})`,
            "backgroundPosition": "100% 0%",
            "backgroundRepeat": "no-repeat",
            "backgroundSize": "80%",
            "overflow": "hidden"
        },
        "mainAsset": {
            "position": "absolute",
            "width": `${41 * env.HOMEPAGE_MAIN_ASSET_SCALE_FACTOR}%`,
            "right": `calc(-1 * (${env.HOMEPAGE_MAIN_ASSET_X_OFFSET}))`,
            "top": env.HOMEPAGE_MAIN_ASSET_Y_OFFSET
        },
        "heroTextWrapper": {
            "paddingLeft": theme.spacing(3),
            "paddingTop": theme.spacing(3),
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
        "logo": {
            "width": 100
        }
    }));

type CardProps = {
    className?: string;
    title: string;
    text: string;
    buttonText: string;
    pictogramUrl: string;
    link: Link | string;
};

const Card = memo((props: CardProps) => {
    const { title, text, buttonText, pictogramUrl, className, link } = props;

    const { css, cx, theme } = useClasslessStyles();

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
                <ThemedImage
                    url={pictogramUrl}
                    className={css({
                        "width": 120,
                        "height": 120
                    })}
                />
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
