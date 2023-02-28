import { lazy, useEffect, memo } from "react";
import type { KcContext } from "./kcContext";
import { useSplashScreen } from "onyxia-ui";
import { makeStyles } from "ui/theme";
import onyxiaNeumorphismDarkModeUrl from "ui/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "ui/assets/svg/OnyxiaNeumorphismLightMode.svg";
import { getBrowser } from "ui/tools/getBrowser";
import { useI18n } from "./i18n";
import Fallback, { defaultKcProps, type KcProps, type PageProps } from "keycloakify";
import Template from "./Template";

const Login = lazy(() => import("./pages/Login"));
const RegisterUserProfile = lazy(() => import("./pages/RegisterUserProfile"));
const Terms = lazy(() => import("./pages/Terms"));
const LoginUpdateProfile = lazy(() => import("./pages/LoginUpdateProfile"));

const KcApp = memo((props: { kcContext: KcContext }) => {
    const { kcContext } = props;

    const i18n = useI18n({ kcContext });

    const { hideRootSplashScreen } = useSplashScreen({
        "fadeOutDuration": getBrowser() === "firefox" ? 0 : undefined
    });

    useEffect(() => {
        hideRootSplashScreen();
    }, []);

    const { classes } = useStyles();

    //NOTE: Locale not yet downloaded
    if (i18n === null) {
        return null;
    }

    // https://github.com/keycloak/keycloak/blob/11.0.3/themes/src/main/resources/theme/keycloak/login/theme.properties
    const kcProps: KcProps = {
        ...defaultKcProps,
        "kcHtmlClass": [...defaultKcProps.kcHtmlClass, classes.kcHtmlClass],
        "kcLoginClass": [...defaultKcProps.kcLoginClass, classes.kcLoginClass],
        "kcFormCardClass": [...defaultKcProps.kcFormCardClass, classes.kcFormCardClass],
        "kcButtonPrimaryClass": [
            ...defaultKcProps.kcButtonPrimaryClass,
            classes.kcButtonPrimaryClass
        ],
        "kcInputClass": [...defaultKcProps.kcInputClass, classes.kcInputClass]
    };

    const pageProps: Omit<PageProps<any, typeof i18n>, "kcContext"> = {
        i18n,
        Template,
        "doFetchDefaultThemeResources": true,
        ...kcProps
    };

    switch (kcContext.pageId) {
        case "login.ftl":
            return <Login {...{ kcContext, ...pageProps }} />;
        case "terms.ftl":
            return <Terms {...{ kcContext, ...pageProps }} />;
        case "login-update-profile.ftl":
            return <LoginUpdateProfile {...{ kcContext, ...pageProps }} />;
        case "register-user-profile.ftl":
            return <RegisterUserProfile {...{ kcContext, ...pageProps }} />;
        default:
            return <Fallback {...{ kcContext, ...pageProps }} />;
    }
});

export default KcApp;

const useStyles = makeStyles({ "name": { KcApp } })(theme => ({
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
