import { memo, useMemo, Fragment } from "react";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { LanguageSelect } from "onyxia-ui/LanguageSelect";
import { languagesPrettyPrint } from "ui/i18n";
import { useTranslation } from "ui/i18n";
import { useLang } from "ui/i18n";
import { DarkModeSwitch } from "onyxia-ui/DarkModeSwitch";
import { declareComponentKeys } from "i18nifty";
import { env } from "env";
import { routes } from "ui/routes";
import { ThemedImage } from "onyxia-ui/ThemedImage";
import { useUrlToLink } from "ui/routes";
import { getIconUrl } from "lazy-icons";
import { LocalizedMarkdown } from "ui/shared/Markdown";
import type { LinkFromConfig } from "ui/shared/LinkFromConfig";

export type Props = {
    className?: string;
};

export const Footer = memo((props: Props) => {
    const { className } = props;

    const { classes, cx } = useStyles(props);

    const { t } = useTranslation({ Footer });

    const { lang, setLang } = useLang();

    const { urlToLink } = useUrlToLink();

    const headerLinks = useMemo(
        (): LinkFromConfig[] => [
            ...(env.TERMS_OF_SERVICES === undefined
                ? []
                : [
                      {
                          label: t("terms of service"),
                          url: routes.document({ source: env.TERMS_OF_SERVICES }).link
                              .href
                      }
                  ]),
            ...env.FOOTER_LINKS
        ],
        [t]
    );

    const spacing = <div className={classes.spacing} />;

    return (
        <footer className={cx(classes.root, className)}>
            {headerLinks
                .map(({ url, startIcon, icon, ...rest }) => ({
                    link: urlToLink(url),
                    icon: startIcon ?? icon,
                    ...rest
                }))
                .map(({ link, icon, label }, index) => (
                    <Fragment key={index}>
                        <a className={classes.linkAnchor} rel="noreferrer" {...link}>
                            {icon !== undefined && (
                                <>
                                    <ThemedImage
                                        className={classes.icon}
                                        url={getIconUrl(icon)}
                                    />
                                    &nbsp;
                                </>
                            )}
                            <LocalizedMarkdown inline>{label}</LocalizedMarkdown>
                        </a>
                        {spacing}
                    </Fragment>
                ))}

            <div className={classes.sep} />

            {env.ENABLED_LANGUAGES.length !== 1 && (
                <LanguageSelect
                    languagesPrettyPrint={languagesPrettyPrint}
                    language={lang}
                    onLanguageChange={setLang}
                    variant="small"
                    changeLanguageText={t("change language")}
                />
            )}
            {spacing}
            {env.ONYXIA_VERSION !== undefined && (
                <a href={env.ONYXIA_VERSION_URL} target="_blank" rel="noreferrer">
                    <Text typo="body 2">Onyxia v{env.ONYXIA_VERSION}</Text>
                </a>
            )}
            {spacing}
            {env.DARK_MODE === undefined && (
                <DarkModeSwitch
                    size="extra small"
                    className={classes.darkModeSwitch}
                    ariaLabel={t("dark mode switch")}
                />
            )}
        </footer>
    );
});

const { i18n } = declareComponentKeys<
    "terms of service" | "change language" | "dark mode switch"
>()({ Footer });
export type I18n = typeof i18n;

const useStyles = tss
    .withParams<Props>()
    .withName({ Footer })
    .create(({ theme }) => ({
        root: {
            backgroundColor: theme.colors.useCases.surfaces.background,
            display: "flex",
            alignItems: "center",
            "& a": {
                textDecoration: "none",
                "&:hover": {
                    textDecoration: "underline",
                    textDecorationColor: theme.colors.useCases.typography.textPrimary
                }
            }
        },
        icon: {
            fill: theme.colors.useCases.typography.textPrimary,
            height: `calc(${theme.typography.variants["body 1"].style.lineHeight} * 0.8)`
        },
        linkAnchor: {
            display: "flex",
            alignItems: "center",
            color: "inherit"
        },
        sep: {
            flex: 1
        },
        spacing: {
            width: theme.spacing(4)
        },
        darkModeSwitch: {
            padding: 0
        }
    }));
