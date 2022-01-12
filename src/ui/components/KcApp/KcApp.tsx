import { useEffect, memo } from "react";
import { useSplashScreen } from "onyxia-ui";
import { defaultKcProps } from "keycloakify";
import { makeStyles } from "ui/theme";
import onyxiaNeumorphismDarkModeUrl from "ui/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "ui/assets/svg/OnyxiaNeumorphismLightMode.svg";
import { Login } from "./Login";
import { Terms } from "./Terms";
import { Info } from "keycloakify/lib/components/Info";
import { Error } from "keycloakify/lib/components/Error";
import { LoginResetPassword } from "keycloakify/lib/components/LoginResetPassword";
import { LoginVerifyEmail } from "keycloakify/lib/components/LoginVerifyEmail";
import { LoginOtp } from "keycloakify/lib/components/LoginOtp";
import { LoginIdpLinkConfirm } from "keycloakify/lib/components/LoginIdpLinkConfirm";
import { LoginUpdatePassword } from "keycloakify/lib/components/LoginUpdatePassword";
import { LoginUpdateProfile } from "./LoginUpdateProfile";
import { RegisterUserProfile } from "./RegisterUserProfile";
import { LoginPageExpired } from "keycloakify/lib/components/LoginPageExpired";
import { Register } from "keycloakify/lib/components/Register";
import { getBrowser } from "ui/tools/getBrowser";
import type { KcContext } from "./kcContext";

export type Props = {
    kcContext: KcContext;
};

export const KcApp = memo((props: Props) => {
    const { kcContext } = props;

    const { hideRootSplashScreen } = useSplashScreen({
        "fadeOutDuration": getBrowser() === "firefox" ? 0 : undefined,
    });

    useEffect(() => {
        hideRootSplashScreen();
    }, []);

    const { classes } = useStyles();

    const kcProps = {
        ...defaultKcProps,
        "kcHtmlClass": [...defaultKcProps.kcHtmlClass, classes.kcHtmlClass],
        "kcLoginClass": [...defaultKcProps.kcLoginClass, classes.kcLoginClass],
        "kcFormCardClass": [...defaultKcProps.kcFormCardClass, classes.kcFormCardClass],
        "kcButtonPrimaryClass": [
            ...defaultKcProps.kcButtonPrimaryClass,
            classes.kcButtonPrimaryClass,
        ],
        "kcInputClass": [...defaultKcProps.kcInputClass, classes.kcInputClass],
    };

    switch (kcContext.pageId) {
        case "login.ftl":
            return <Login {...{ kcContext, ...kcProps }} />;
        case "register.ftl":
            return <Register {...{ kcContext, ...kcProps }} />;
        case "terms.ftl":
            return <Terms {...{ kcContext, ...kcProps }} />;
        case "info.ftl":
            return <Info {...{ kcContext, ...kcProps }} />;
        case "error.ftl":
            return <Error {...{ kcContext, ...kcProps }} />;
        case "login-reset-password.ftl":
            return <LoginResetPassword {...{ kcContext, ...kcProps }} />;
        case "login-verify-email.ftl":
            return <LoginVerifyEmail {...{ kcContext, ...kcProps }} />;
        case "login-otp.ftl":
            return <LoginOtp {...{ kcContext, ...kcProps }} />;
        case "login-update-profile.ftl":
            return <LoginUpdateProfile {...{ kcContext, ...kcProps }} />;
        case "login-idp-link-confirm.ftl":
            return <LoginIdpLinkConfirm {...{ kcContext, ...kcProps }} />;
        case "register-user-profile.ftl":
            return <RegisterUserProfile {...{ kcContext, ...kcProps }} />;
        case "login-update-password.ftl":
            return <LoginUpdatePassword {...{ kcContext, ...kcProps }} />;
        case "login-page-expired.ftl":
            return <LoginPageExpired {...{ kcContext, ...kcProps }} />;
    }
});

const useStyles = makeStyles({ "name": { KcApp } })(theme => ({
    "kcLoginClass": {
        "& #kc-locale": {
            "zIndex": 5,
        },
    },
    "kcHtmlClass": {
        "& body": {
            "background": `url(${
                theme.isDarkModeEnabled
                    ? onyxiaNeumorphismDarkModeUrl
                    : onyxiaNeumorphismLightModeUrl
            }) no-repeat center center fixed`,
            "fontFamily": theme.typography.fontFamily,
        },
        "background": `${theme.colors.useCases.surfaces.background}`,
        "& a": {
            "color": `${theme.colors.useCases.typography.textFocus}`,
        },
        "& #kc-current-locale-link": {
            "color": `${theme.colors.palette.light.greyVariant3}`,
        },
        "& label": {
            "fontSize": 14,
            "color": theme.colors.palette.light.greyVariant3,
            "fontWeight": "normal",
        },
        "& #kc-page-title": {
            ...theme.typography.variants["page heading"].style,
            "color": theme.colors.palette.dark.main,
        },
        "& #kc-header-wrapper": {
            "visibility": "hidden",
        },
    },
    "kcFormCardClass": {
        "borderRadius": 10,
    },
    "kcButtonPrimaryClass": {
        "backgroundColor": "unset",
        "backgroundImage": "unset",
        "borderColor": `${theme.colors.useCases.typography.textFocus}`,
        "borderWidth": "2px",
        "borderRadius": `20px`,
        "color": `${theme.colors.useCases.typography.textFocus}`,
        "textTransform": "uppercase",
    },
    "kcInputClass": {
        "borderRadius": "unset",
        "border": "unset",
        "boxShadow": "unset",
        "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        "&:focus": {
            "borderColor": "unset",
            "borderBottom": `1px solid ${theme.colors.useCases.typography.textFocus}`,
        },
    },
}));
