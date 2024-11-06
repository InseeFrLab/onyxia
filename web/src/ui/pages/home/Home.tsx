import { useMemo, memo } from "react";
import { routes } from "ui/routes";
import { tss, useStyles as useClasslessStyles } from "tss";
import { Text } from "onyxia-ui/Text";
import { Button } from "onyxia-ui/Button";
import { useTranslation } from "ui/i18n";
import { Card as OnyxiaUiCard } from "onyxia-ui/Card";
import { env } from "env";
import { useConst } from "powerhooks/useConst";
import { declareComponentKeys } from "i18nifty";
import type { PageRoute } from "./route";
import { ThemedImage } from "onyxia-ui/ThemedImage";
import { LocalizedMarkdown } from "ui/shared/Markdown";
import { LinkFromConfigButton } from "./LinkFromConfigButton";
import { id } from "tsafe/id";
import { useThemedImageUrl } from "onyxia-ui/ThemedImage";
import { useCoreState } from "core";

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

    const backgroundUrl = useThemedImageUrl(env.BACKGROUND_ASSET);

    const { classes, cx } = useStyles({
        backgroundUrl,
        hasLogo: env.HOMEPAGE_LOGO !== undefined
    });

    const { isUserLoggedIn, user } = useCoreState(
        "userAuthentication",
        "authenticationState"
    );
    const isFileExplorerEnabled = useCoreState("fileExplorer", "isFileExplorerEnabled");

    const { t } = useTranslation({ Home });

    const title = useMemo(() => {
        if (isUserLoggedIn) {
            const userFirstname = user.firstName ?? "";

            if (env.HOMEPAGE_HERO_TEXT_AUTHENTICATED === undefined) {
                return t("title authenticated", { userFirstname });
            }

            return (
                <LocalizedMarkdown inline>
                    {env.HOMEPAGE_HERO_TEXT_AUTHENTICATED({ userFirstname })}
                </LocalizedMarkdown>
            );
        } else {
            if (env.HOMEPAGE_HERO_TEXT === undefined) {
                return t("title");
            }
            return <LocalizedMarkdown inline>{env.HOMEPAGE_HERO_TEXT}</LocalizedMarkdown>;
        }
    }, [t]);

    const subtitle = useMemo(() => {
        const defaultNode = t("subtitle");

        if (isUserLoggedIn) {
            if (env.HOMEPAGE_BELOW_HERO_TEXT_AUTHENTICATED === undefined) {
                return defaultNode;
            }

            const userFirstname = user.firstName ?? "";

            return (
                <LocalizedMarkdown inline>
                    {env.HOMEPAGE_BELOW_HERO_TEXT_AUTHENTICATED({ userFirstname })}
                </LocalizedMarkdown>
            );
        } else {
            if (env.HOMEPAGE_BELOW_HERO_TEXT === undefined) {
                return defaultNode;
            }
            return (
                <LocalizedMarkdown inline>
                    {env.HOMEPAGE_BELOW_HERO_TEXT}
                </LocalizedMarkdown>
            );
        }
    }, [t]);

    const callToActionButton = useMemo(() => {
        if (isUserLoggedIn) {
            if (env.HOMEPAGE_CALL_TO_ACTION_BUTTON_AUTHENTICATED === null) {
                return null;
            }

            if (env.HOMEPAGE_CALL_TO_ACTION_BUTTON_AUTHENTICATED === undefined) {
                return (
                    <Button
                        href="https://docs.onyxia.sh/user-guide"
                        doOpenNewTabIfHref={true}
                    >
                        {t("new user")}
                    </Button>
                );
            }

            return (
                <LinkFromConfigButton
                    linkFromConfig={env.HOMEPAGE_CALL_TO_ACTION_BUTTON_AUTHENTICATED}
                />
            );
        } else {
            if (env.HOMEPAGE_CALL_TO_ACTION_BUTTON === null) {
                return null;
            }

            if (env.HOMEPAGE_CALL_TO_ACTION_BUTTON === undefined) {
                return null;
            }

            return (
                <LinkFromConfigButton
                    linkFromConfig={env.HOMEPAGE_CALL_TO_ACTION_BUTTON}
                />
            );
        }
    }, [t]);

    const cards = useMemo(() => {
        if (env.HOMEPAGE_CARDS === undefined) {
            return id<CardProps["card"][]>([
                {
                    pictogram: `${env.PUBLIC_URL}/pictograms/service.svg?v=2`,
                    title: t("cardTitle1"),
                    description: t("cardText1"),
                    button: {
                        label: t("cardButton1"),
                        url: routes.catalog().link.href
                    }
                },
                {
                    pictogram: `${env.PUBLIC_URL}/pictograms/community.svg?v=2`,
                    title: t("cardTitle2"),
                    description: t("cardText2"),
                    button: {
                        label: t("cardButton2"),
                        url: "https://join.slack.com/t/3innovation/shared_invite/zt-1hnzukjcn-6biCSmVy4qvyDGwbNI~sWg"
                    }
                },
                ...(!isFileExplorerEnabled
                    ? []
                    : [
                          {
                              pictogram: `${env.PUBLIC_URL}/pictograms/storage.svg?v=2`,
                              title: t("cardTitle3"),
                              description: t("cardText3"),
                              button: {
                                  label: t("cardButton3"),
                                  url: routes.myFiles().link.href
                              }
                          }
                      ])
            ]);
        }

        return env.HOMEPAGE_CARDS;
    }, [t, isFileExplorerEnabled]);

    return (
        <div className={cx(classes.root, className)}>
            <div className={classes.hero}>
                <div className={classes.heroTextWrapper}>
                    {env.HOMEPAGE_LOGO !== undefined && (
                        <ThemedImage url={env.HOMEPAGE_LOGO} className={classes.logo} />
                    )}
                    <Text typo="display heading">{title}</Text>
                    <Text typo="subtitle" className={classes.heroSubtitle}>
                        {subtitle}
                    </Text>
                    {callToActionButton}
                </div>
                {env.HOMEPAGE_MAIN_ASSET !== undefined && (
                    <ThemedImage
                        url={env.HOMEPAGE_MAIN_ASSET}
                        className={classes.mainAsset}
                    />
                )}
            </div>
            {cards.length !== 0 && (
                <div className={classes.cardsWrapper}>
                    {cards.map((card, index) => (
                        <Card key={index} card={card} />
                    ))}
                </div>
            )}
        </div>
    );
}

const { i18n } = declareComponentKeys<
    | "login"
    | "new user"
    | "title"
    | { K: "title authenticated"; P: { userFirstname: string } }
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
export type I18n = typeof i18n;

const useStyles = tss
    .withName({ Home })
    .withParams<{ backgroundUrl: string | undefined; hasLogo: boolean }>()
    .create(({ theme, backgroundUrl, hasLogo }) => ({
        root: {
            height: "100%",
            overflow: "auto",
            backgroundColor: "transparent",
            display: "flex",
            flexDirection: "column"
        },
        hero: {
            flex: 1,
            position: "relative",
            ...(backgroundUrl === undefined
                ? undefined
                : {
                      backgroundImage: `url(${backgroundUrl})`,
                      backgroundPosition: "100% 0%",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "80%"
                  }),
            overflow: "hidden"
        },
        mainAsset: {
            position: "absolute",
            width: `${41 * env.HOMEPAGE_MAIN_ASSET_SCALE_FACTOR}%`,
            right: `calc(-1 * (${env.HOMEPAGE_MAIN_ASSET_X_OFFSET}))`,
            top: env.HOMEPAGE_MAIN_ASSET_Y_OFFSET
        },
        heroTextWrapper: {
            paddingLeft: theme.spacing(3),
            paddingTop: hasLogo ? theme.spacing(3) : theme.spacing(7),
            maxWidth: "42%",
            "& > *": {
                marginBottom: theme.spacing(4)
            }
        },
        heroSubtitle: {
            marginBottom: theme.spacing(5)
        },
        cardsWrapper: {
            borderTop: `1px solid ${theme.colors.useCases.typography.textPrimary}`,
            display: "flex",
            ...theme.spacing.topBottom("padding", 4),
            "& > *": {
                flex: 1
            },
            "& > *:not(:last-child)": {
                marginRight: theme.spacing(3)
            }
        },
        logo: {
            width: 100
        }
    }));

type CardProps = {
    className?: string;
    card: Exclude<typeof env.HOMEPAGE_CARDS, undefined>[number];
};

const Card = memo((props: CardProps) => {
    const { className, card } = props;

    const { css, cx, theme } = useClasslessStyles();

    return (
        <OnyxiaUiCard
            className={cx(
                css({
                    display: "flex",
                    flexDirection: "column",
                    padding: theme.spacing(4)
                }),
                className
            )}
        >
            <div className={css({ display: "flex" })}>
                <ThemedImage
                    url={card.pictogram}
                    className={css({
                        width: 120,
                        height: 120
                    })}
                />
                <div
                    className={css({
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        ...theme.spacing.rightLeft("padding", 4)
                    })}
                >
                    <Text typo="section heading">
                        <LocalizedMarkdown inline>{card.title}</LocalizedMarkdown>
                    </Text>
                </div>
            </div>
            <div
                className={css({
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    paddingTop: theme.spacing(3)
                })}
            >
                <div className={css({ flex: 1 })}>
                    <Text typo="body 1">
                        {<LocalizedMarkdown inline>{card.description}</LocalizedMarkdown>}
                    </Text>
                </div>
                <div
                    className={css({
                        marginTop: theme.spacing(5),
                        display: "flex"
                    })}
                >
                    <div style={{ flex: 1 }} />
                    <LinkFromConfigButton
                        linkFromConfig={card.button}
                        variant="secondary"
                    />
                </div>
            </div>
        </OnyxiaUiCard>
    );
});
