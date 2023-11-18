import { useEffect, lazy, Suspense } from "react";
import Fallback, { type PageProps } from "keycloakify/login";
import type { KcContext } from "./kcContext";
import { useI18n } from "./i18n";
import { loadThemedFavicon } from "keycloak-theme/login/theme";
import { tss } from "tss";
import { env } from "env-parsed";
import onyxiaNeumorphismDarkModeUrl from "ui/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "ui/assets/svg/OnyxiaNeumorphismLightMode.svg";
import { OnyxiaUi } from "keycloak-theme/login/theme";

loadThemedFavicon();

const DefaultTemplate = lazy(() => import("keycloakify/login/Template"));
const Template = lazy(() => import("./Template"));
const Login = lazy(() => import("./pages/Login"));
const RegisterUserProfile = lazy(() => import("./pages/RegisterUserProfile"));
const Terms = lazy(() => import("./pages/Terms"));

type Props = {
    kcContext: KcContext;
};

export default function KcApp(props: Props) {
    return (
        <OnyxiaUi>
            <ContextualizedKcApp {...props} />
        </OnyxiaUi>
    );
}

function ContextualizedKcApp(props: Props) {
    const { kcContext } = props;

    const i18n = useI18n({ kcContext });

    const { classes } = useStyles();

    useEffect(() => {
        if (i18n === null) {
            return;
        }

        document.title = `${env.TAB_TITLE} - ${i18n.msgStr("tabTitleSuffix")}`;
    }, [i18n]);

    if (i18n === null) {
        return null;
    }

    const pageProps: Omit<PageProps<any, typeof i18n>, "kcContext"> = {
        i18n,
        Template,
        "doUseDefaultCss": false,
        "classes": {
            "kcHtmlClass": classes.kcHtmlClass
        }
    };

    return (
        <Suspense>
            {(() => {
                switch (kcContext.pageId) {
                    case "login.ftl":
                        return <Login kcContext={kcContext} {...pageProps} />;
                    case "register-user-profile.ftl":
                        return (
                            <RegisterUserProfile kcContext={kcContext} {...pageProps} />
                        );
                    case "terms.ftl":
                        return <Terms kcContext={kcContext} {...pageProps} />;
                    default:
                        return (
                            <Fallback
                                kcContext={kcContext}
                                i18n={i18n}
                                Template={DefaultTemplate}
                                doUseDefaultCss={true}
                                classes={{
                                    "kcHtmlClass": classes.kcHtmlClass,
                                    "kcLoginClass": classes.kcLoginClass,
                                    "kcFormCardClass": classes.kcFormCardClass,
                                    "kcButtonPrimaryClass": classes.kcButtonPrimaryClass,
                                    "kcInputClass": classes.kcInputClass
                                }}
                            />
                        );
                }
            })()}
        </Suspense>
    );
}

const useStyles = tss.withName({ KcApp }).create(({ theme }) => ({
    "kcLoginClass": {
        "& #kc-locale": {
            "zIndex": 5
        }
    },
    "kcHtmlClass": {
        "& body": {
            "background": `url(${
                theme.isDarkModeEnabled
                    ? onyxiaNeumorphismDarkModeUrl
                    : onyxiaNeumorphismLightModeUrl
            }) no-repeat center center fixed`,
            "fontFamily": theme.typography.fontFamily
        },
        "background": `${theme.colors.useCases.surfaces.background}`,
        "& a": {
            "color": `${theme.colors.useCases.typography.textFocus}`
        },
        "& #kc-current-locale-link": {
            "color": `${theme.colors.palette.light.greyVariant3}`
        },
        "& label": {
            "fontSize": 14,
            "color": theme.colors.palette.light.greyVariant3,
            "fontWeight": "normal"
        },
        "& #kc-page-title": {
            ...theme.typography.variants["page heading"].style,
            "color": theme.colors.palette.dark.main
        },
        "& #kc-header-wrapper": {
            "visibility": "hidden"
        }
    },
    "kcFormCardClass": {
        "borderRadius": 10
    },
    "kcButtonPrimaryClass": {
        "backgroundColor": "unset",
        "backgroundImage": "unset",
        "borderColor": `${theme.colors.useCases.typography.textFocus}`,
        "borderWidth": "2px",
        "borderRadius": `20px`,
        "color": `${theme.colors.useCases.typography.textFocus}`,
        "textTransform": "uppercase"
    },
    "kcInputClass": {
        "borderRadius": "unset",
        "border": "unset",
        "boxShadow": "unset",
        "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        "&:focus": {
            "borderColor": "unset",
            "borderBottom": `1px solid ${theme.colors.useCases.typography.textFocus}`
        }
    }
}));
