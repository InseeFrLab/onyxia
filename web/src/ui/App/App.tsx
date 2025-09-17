import { useEffect } from "react";
import { tss } from "tss";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { useDarkMode } from "onyxia-ui";
import { env, injectEnvsTransferableToKeycloakTheme } from "env";
import { RouteProvider } from "ui/routes";
import { createCoreProvider, useCoreState, useCore } from "core";
import { injectGlobalStatesInSearchParams } from "powerhooks/useGlobalState";
import { evtLang, I18nFetchingSuspense } from "ui/i18n";
import { PortraitModeUnsupported } from "ui/shared/PortraitModeUnsupported";
import { LeftBar } from "./LeftBar";
import { GlobalAlert } from "./GlobalAlert";
import { Main } from "./Main";
import { AutoLogoutCountdown } from "./AutoLogoutCountdown";
import { injectOnyxiaInstancePublicUrl } from "keycloak-theme/login/onyxiaInstancePublicUrl";
import { useDomRect } from "powerhooks/useDomRect";
import { useSplashScreen } from "onyxia-ui";
import { evtIsScreenScalerOutOfBound } from "screen-scaler";
import { useRerenderOnStateChange } from "evt/hooks/useRerenderOnStateChange";

const { CoreProvider } = createCoreProvider({
    apiUrl: env.ONYXIA_API_URL,
    getCurrentLang: () => evtLang.state,
    transformBeforeRedirectForKeycloakTheme: ({ authorizationUrl }) => {
        authorizationUrl = injectOnyxiaInstancePublicUrl({
            authorizationUrl,
            onyxiaInstancePublicUrl: `${window.location.origin}${env.PUBLIC_URL}`
        });
        authorizationUrl = injectEnvsTransferableToKeycloakTheme(authorizationUrl);
        authorizationUrl = injectGlobalStatesInSearchParams(authorizationUrl);
        return authorizationUrl;
    },
    disablePersonalInfosInjectionInGroup: env.DISABLE_PERSONAL_INFOS_INJECTION_IN_GROUP,
    isCommandBarEnabledByDefault: !env.DISABLE_COMMAND_BAR,
    quotaWarningThresholdPercent: env.QUOTA_WARNING_THRESHOLD * 100,
    quotaCriticalThresholdPercent: env.QUOTA_CRITICAL_THRESHOLD * 100,
    isAuthGloballyRequired: env.AUTHENTICATION_GLOBALLY_REQUIRED,
    enableOidcDebugLogs: env.OIDC_DEBUG_LOGS,
    disableDisplayAllCatalog: env.DISABLE_DISPLAY_ALL_CATALOG
});

export function App() {
    useRerenderOnStateChange(evtIsScreenScalerOutOfBound);

    if (evtIsScreenScalerOutOfBound.state === true) {
        return <PortraitModeFallback />;
    }

    return (
        <RouteProvider>
            <I18nFetchingSuspense>
                <CoreProvider>
                    <AppContextualized />
                </CoreProvider>
            </I18nFetchingSuspense>
        </RouteProvider>
    );
}

function PortraitModeFallback() {
    const { hideRootSplashScreen } = useSplashScreen();

    useEffect(() => {
        return () => {
            hideRootSplashScreen();
        };
    }, []);

    return <PortraitModeUnsupported />;
}

function AppContextualized() {
    useSyncDarkModeWithValueInProfile();
    useRerenderOnStateChange(evtIsScreenScalerOutOfBound);

    const isScreenScalerEnabled = evtIsScreenScalerOutOfBound.state !== undefined;

    const {
        ref: globalAlertRef,
        domRect: { height: globalAlertHeight }
    } = useDomRect();
    const { classes } = useStyles({ globalAlertHeight, isScreenScalerEnabled });
    const { isUserLoggedIn } = useCoreState("userAuthentication", "main");

    return (
        <>
            <div className={classes.root}>
                {env.GLOBAL_ALERT !== undefined && (
                    <GlobalAlert
                        ref={globalAlertRef}
                        className={classes.globalAlert}
                        severity={env.GLOBAL_ALERT.severity}
                        message={env.GLOBAL_ALERT.message}
                    />
                )}
                <Header className={classes.header} />
                <section className={classes.betweenHeaderAndFooter}>
                    <LeftBar className={classes.leftBar} />
                    <Main className={classes.main} />
                </section>
                <Footer className={classes.footer} />
            </div>
            {isUserLoggedIn && <AutoLogoutCountdown />}
        </>
    );
}

const useStyles = tss
    .withName({ App })
    .withParams<{ globalAlertHeight: number; isScreenScalerEnabled: boolean }>()
    .create(({ theme, globalAlertHeight, isScreenScalerEnabled }) => {
        const footerHeight = 32;

        const rootRightLeftMargin = theme.spacing(4);

        return {
            root: {
                height: isScreenScalerEnabled ? "100%" : "100vh",
                display: "flex",
                flexDirection: "column",
                margin: `0 ${rootRightLeftMargin}px`,
                position: "relative"
            },
            globalAlert: {
                position: "absolute",
                width: theme.windowInnerWidth,
                left: -rootRightLeftMargin
            },
            header: {
                marginTop:
                    globalAlertHeight === 0 ? 0 : globalAlertHeight + theme.spacing(2),
                paddingBottom: 0 //For the LeftBar shadow
            },
            betweenHeaderAndFooter: {
                flex: 1,
                overflow: "hidden",
                display: "flex",
                paddingTop: theme.spacing(2.3), //For the LeftBar shadow
                paddingBottom: footerHeight
            },
            footer: {
                height: footerHeight,
                position: "absolute",
                bottom: 0,
                width: "100%",
                background: "transparent"
            },
            leftBar: {
                height: "100%"
            },
            main: {
                height: "100%",
                flex: 1,
                //TODO: See if scroll delegation works if we put auto here instead of "hidden"
                paddingLeft: theme.spacing(4),
                overflow: "hidden"
            }
        };
    });

/**
 * This hook to two things:
 * - It sets whether or not the dark mode is enabled based on
 * the value stored in user configs.
 * - Each time the dark mode it changed it changes the value in
 * user configs.
 */
function useSyncDarkModeWithValueInProfile() {
    const { userConfigs } = useCore().functions;

    const { isUserLoggedIn } = useCoreState("userAuthentication", "main");

    const { isDarkModeEnabled, setIsDarkModeEnabled } = useDarkMode();

    const userConfigsIsDarkModeEnabled = useCoreState("userConfigs", "isDarkModeEnabled");

    useEffect(() => {
        if (userConfigsIsDarkModeEnabled !== undefined && env.DARK_MODE === undefined) {
            setIsDarkModeEnabled(userConfigsIsDarkModeEnabled);
        }
    }, []);

    useEffectOnValueChange(() => {
        if (!isUserLoggedIn) {
            return;
        }

        userConfigs.changeValue({
            key: "isDarkModeEnabled",
            value: isDarkModeEnabled
        });
    }, [isDarkModeEnabled]);
}
