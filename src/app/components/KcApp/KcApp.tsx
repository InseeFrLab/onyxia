import { useEffect, memo } from "react";
import { useSplashScreen } from "onyxia-ui";
import { defaultKcProps } from "keycloakify";
import { makeStyles } from "app/theme";
import onyxiaNeumorphismDarkModeUrl from "app/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "app/assets/svg/OnyxiaNeumorphismLightMode.svg";
import { Login } from "./Login";
import { Register } from "./Register";
import { Terms } from "./Terms";
import { Info } from "keycloakify/lib/components/Info";
import { Error as KcError } from "keycloakify/lib/components/Error";
import { LoginResetPassword } from "keycloakify/lib/components/LoginResetPassword";
import { LoginVerifyEmail } from "keycloakify/lib/components/LoginVerifyEmail";
import { LoginOtp } from "keycloakify/lib/components/LoginOtp";
import { LoginIdpLinkConfirm } from "keycloakify/lib/components/LoginIdpLinkConfirm";
import { LoginUpdateProfile } from "./LoginUpdateProfile";
import { getBrowser } from "app/tools/getBrowser";
import type { KcContext } from "./kcContext";

export type Props = {
    kcContext: KcContext;
};

const useStyles = makeStyles()(theme => ({
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
            }) no-repeat center center fixed !important`,
            "fontFamily": theme.typography.fontFamily,
        },
        "background": `${theme.colors.useCases.surfaces.background} !important`,
        "& a": {
            "color": `${theme.colors.palette.focus.main} !important`,
        },
        "& #kc-current-locale-link": {
            "color": `${theme.colors.palette.light.greyVariant3} !important`,
        },
        "& label": {
            "fontSize": 14,
            "color": theme.colors.palette.light.greyVariant3,
            "fontWeight": "normal",
        },
        "& #kc-page-title": theme.typography.variants["page heading"].style,
        "& #kc-header-wrapper": {
            "visibility": "hidden",
        },
    },
    "kcFormCardClass": {
        "borderRadius": 10,
    },
    "kcButtonPrimaryClass": {
        "backgroundColor": "unset !important",
        "backgroundImage": "unset !important",
        "borderColor": `${theme.colors.palette.focus.main} !important`,
        "borderWidth": "2px !important",
        "borderRadius": `20px !important`,
        "color": `${theme.colors.palette.focus.main} !important`,
        "textTransform": "uppercase",
    },
    "kcInputClass": {
        "borderRadius": "unset !important",
        "border": "unset !important",
        "boxShadow": "unset !important",
        "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary} !important`,
        "&:focus": {
            "borderColor": `unset !important`,
            "borderBottom": `1px solid ${theme.colors.useCases.typography.textFocus} !important`,
        },
    },
}));

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
            return <KcError {...{ kcContext, ...kcProps }} />;
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
            throw new Error("not yet available");
    }
});
