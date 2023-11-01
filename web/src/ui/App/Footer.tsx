import { memo } from "react";
import { tss } from "ui/theme";
import { Text } from "onyxia-ui/Text";
import { LanguageSelect } from "onyxia-ui/LanguageSelect";
import { languagesPrettyPrint } from "ui/i18n";
import { useTranslation } from "ui/i18n";
import { ReactComponent as GitHubSvg } from "ui/assets/svg/GitHub.svg";
import { useLang } from "ui/i18n";
import { DarkModeSwitch } from "onyxia-ui/DarkModeSwitch";
import { declareComponentKeys } from "i18nifty";
import type { Link } from "type-route";
import { getEnabledLanguages } from "ui/env";

export type Props = {
    className?: string;
    contributeUrl: string;
    onyxiaVersion:
        | {
              number: string;
              url: string;
          }
        | undefined;
    termsLink: Link;
};

export const Footer = memo((props: Props) => {
    const { className, contributeUrl, onyxiaVersion, termsLink } = props;

    const { classes, cx } = useStyles(props);

    const { t } = useTranslation({ Footer });

    const { lang, setLang } = useLang();

    const spacing = <div className={classes.spacing} />;

    return (
        <footer className={cx(classes.root, className)}>
            <Text typo="body 2">2017 - 2023 Onyxia, INSEE, CodeGouv</Text>
            {spacing}
            <a
                href={contributeUrl}
                className={classes.contribute}
                target="_blank"
                rel="noreferrer"
            >
                <GitHubSvg className={classes.icon} />
                &nbsp;
                <Text typo="body 2">{t("contribute")}</Text>
            </a>
            <div className={classes.sep} />
            {getEnabledLanguages().length !== 1 && (
                <LanguageSelect
                    languagesPrettyPrint={languagesPrettyPrint}
                    language={lang}
                    onLanguageChange={setLang}
                    variant="small"
                    changeLanguageText={t("change language")}
                />
            )}
            {spacing}
            <a {...termsLink} target="_blank" rel="noreferrer">
                {" "}
                <Text typo="body 2">{t("terms of service")}</Text>{" "}
            </a>
            {spacing}
            {onyxiaVersion !== undefined && (
                <a href={onyxiaVersion.url} target="_blank" rel="noreferrer">
                    <Text typo="body 2">v{onyxiaVersion.number}</Text>
                </a>
            )}
            {spacing}
            <DarkModeSwitch
                size="extra small"
                className={classes.darkModeSwitch}
                ariaLabel={t("dark mode switch")}
            />
        </footer>
    );
});

export const { i18n } = declareComponentKeys<
    "contribute" | "terms of service" | "change language" | "dark mode switch"
>()({ Footer });

const useStyles = tss
    .withParams<Props>()
    .withName({ Footer })
    .create(({ theme }) => ({
        "root": {
            "backgroundColor": theme.colors.useCases.surfaces.background,
            "display": "flex",
            "alignItems": "center",
            "& a": {
                "textDecoration": "none",
                "&:hover": {
                    "textDecoration": "underline",
                    "textDecorationColor": theme.colors.useCases.typography.textPrimary
                }
            }
        },
        "icon": {
            "fill": theme.colors.useCases.typography.textPrimary
        },
        "contribute": {
            "display": "flex",
            "alignItems": "center"
        },
        "sep": {
            "flex": 1
        },
        "spacing": {
            "width": theme.spacing(4)
        },
        "darkModeSwitch": {
            "padding": 0
        }
    }));
