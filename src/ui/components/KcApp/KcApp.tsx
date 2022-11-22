import { lazy, useEffect, memo } from "react";
import type { KcContext } from "./kcContext";
import KcAppBase, { defaultKcProps } from "keycloakify";
import { useSplashScreen } from "onyxia-ui";
import { makeStyles } from "ui/theme";
import onyxiaNeumorphismDarkModeUrl from "ui/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "ui/assets/svg/OnyxiaNeumorphismLightMode.svg";
import { getBrowser } from "ui/tools/getBrowser";
import { useI18n } from "./i18n";

const Login = lazy(() => import("./Login"));
const RegisterUserProfile = lazy(() => import("./RegisterUserProfile"));
const Terms = lazy(() => import("./Terms"));
const LoginUpdateProfile = lazy(() => import("./LoginUpdateProfile"));

export type Props = {
    kcContext: KcContext;
};

const KcApp = memo((props: Props) => {
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

    const kcProps = {
        i18n,
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

    switch (kcContext.pageId) {
        case "login.ftl":
            return <Login {...{ kcContext, ...kcProps }} />;
        case "terms.ftl":
            return <Terms {...{ kcContext, ...kcProps }} />;
        case "login-update-profile.ftl":
            return <LoginUpdateProfile {...{ kcContext, ...kcProps }} />;
        case "register-user-profile.ftl":
            return <RegisterUserProfile {...{ kcContext, ...kcProps }} />;
        default:
            return <KcAppBase {...{ kcContext, ...kcProps }} />;
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
