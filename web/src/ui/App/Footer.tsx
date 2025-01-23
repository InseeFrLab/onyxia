import { memo } from "react";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { LanguageSelect } from "onyxia-ui/LanguageSelect";
import { languagesPrettyPrint } from "ui/i18n";
import { useTranslation } from "ui/i18n";
import githubSvgUrl from "ui/assets/svg/GitHub.svg";
import { useLang } from "ui/i18n";
import { DarkModeSwitch } from "onyxia-ui/DarkModeSwitch";
import { declareComponentKeys } from "i18nifty";
import { env } from "env";
import { routes } from "ui/routes";
import { ThemedImage } from "onyxia-ui/ThemedImage";

export type Props = {
    className?: string;
};

export const Footer = memo((props: Props) => {
    const { className } = props;

    const { classes, cx } = useStyles(props);

    const { t } = useTranslation({ Footer });

    const { lang, setLang } = useLang();

    const spacing = <div className={classes.spacing} />;

    return (
        <footer className={cx(classes.root, className)}>
            <Text typo="body 2">2017 - 2025 Onyxia</Text>
            {spacing}
            <a
                href="https://github.com/InseeFrLab/onyxia"
                className={classes.contribute}
                target="_blank"
                rel="noreferrer"
            >
                <ThemedImage className={classes.icon} url={githubSvgUrl} />
                &nbsp;
                <Text typo="body 2">{t("contribute")}</Text>
            </a>
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
            {env.TERMS_OF_SERVICES !== undefined && (
                <>
                    {spacing}
                    <a {...routes.terms().link}>
                        {" "}
                        <Text typo="body 2">{t("terms of service")}</Text>{" "}
                    </a>
                </>
            )}
            {spacing}
            {env.ONYXIA_VERSION !== undefined && (
                <a href={env.ONYXIA_VERSION_URL} target="_blank" rel="noreferrer">
                    <Text typo="body 2">v{env.ONYXIA_VERSION}</Text>
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
    "contribute" | "terms of service" | "change language" | "dark mode switch"
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
            fill: theme.colors.useCases.typography.textPrimary
        },
        contribute: {
            display: "flex",
            alignItems: "center"
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
