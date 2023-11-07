import { useEffect, Suspense } from "react";
import { tss } from "tss";
import { Footer } from "./Footer";
import { Header, useLogoContainerWidth } from "./Header";
import { useRoute, routes } from "ui/routes";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { useSplashScreen } from "onyxia-ui";
import { useIsDarkModeEnabled } from "onyxia-ui";
import { keyframes } from "tss-react";
import { env, injectTransferableEnvsInQueryParams } from "env-parsed";
import { RouteProvider } from "ui/routes";
import { createCoreProvider, useCoreState, useCoreFunctions } from "core";
import { injectGlobalStatesInSearchParams } from "powerhooks/useGlobalState";
import { evtLang } from "ui/i18n";
import { getEnv } from "env";
import { ThemeProvider, targetWindowInnerWidth, loadThemedFavicon } from "ui/theme";
import { PortraitModeUnsupported } from "ui/shared/PortraitModeUnsupported";
import { objectKeys } from "tsafe/objectKeys";
import { pages } from "ui/pages";
import { assert } from "tsafe/assert";
import { useIsI18nFetching } from "ui/i18n";
import { enableScreenScaler } from "screen-scaler/react";
import { addParamToUrl } from "powerhooks/tools/urlSearchParams";
import { LeftBar } from "./LeftBar";
import { GlobalAlert } from "./GlobalAlert";

loadThemedFavicon();

const { CoreProvider } = createCoreProvider({
    "apiUrl": getEnv().ONYXIA_API_URL,
    "getCurrentLang": () => evtLang.state,
    "transformUrlBeforeRedirectToLogin": url =>
        [url]
            .map(injectTransferableEnvsInQueryParams)
            .map(injectGlobalStatesInSearchParams)
            .map(
                url =>
                    addParamToUrl({
                        url,
                        "name": "ui_locales",
                        "value": evtLang.state
                    }).newUrl
            )[0],
    "disablePersonalInfosInjectionInGroup": env.DISABLE_PERSONAL_INFOS_INJECTION_IN_GROUP,
    "isCommandBarEnabledByDefault": !env.DISABLE_COMMAND_BAR
});

const { ScreenScalerOutOfRangeFallbackProvider } = enableScreenScaler({
    "rootDivId": "root",
    "targetWindowInnerWidth": ({ zoomFactor, isPortraitOrientation }) =>
        isPortraitOrientation ? undefined : targetWindowInnerWidth * zoomFactor
});

export default function App() {
    if (useIsI18nFetching()) {
        return null;
    }

    return (
        <ThemeProvider>
            <ScreenScalerOutOfRangeFallbackProvider
                fallback={<ScreenScalerOutOfRangeFallback />}
            >
                <RouteProvider>
                    <CoreProvider>
                        <ContextualizedApp />
                    </CoreProvider>
                </RouteProvider>
            </ScreenScalerOutOfRangeFallbackProvider>
        </ThemeProvider>
    );
}

function ScreenScalerOutOfRangeFallback() {
    const { hideRootSplashScreen } = useSplashScreen();

    useEffect(() => {
        hideRootSplashScreen();
    }, []);

    return <PortraitModeUnsupported />;
}

function ContextualizedApp() {
    useSyncDarkModeWithValueInProfile();

    const { classes } = useStyles();

    const { logoContainerWidth } = useLogoContainerWidth();

    const route = useRoute();

    const { userAuthentication } = useCoreFunctions();

    return (
        <div className={classes.root}>
            {env.GLOBAL_ALERT !== undefined && (
                <GlobalAlert
                    className={classes.globalAlert}
                    severity={env.GLOBAL_ALERT.severity}
                    message={env.GLOBAL_ALERT.message}
                />
            )}
            <Header className={classes.header} logoContainerWidth={logoContainerWidth} />
            <section className={classes.betweenHeaderAndFooter}>
                <LeftBar className={classes.leftBar} />
                <main className={classes.main}>
                    <Suspense fallback={<SuspenseFallback />}>
                        {(() => {
                            for (const pageName of objectKeys(pages)) {
                                //You must be able to replace "home" by any other page and get no type error.
                                const page = pages[pageName as "home"];

                                if (page.routeGroup.has(route)) {
                                    if (
                                        page.getDoRequireUserLoggedIn(route) &&
                                        !userAuthentication.getIsUserLoggedIn()
                                    ) {
                                        /* prettier-ignore */
                                        userAuthentication.login({ "doesCurrentHrefRequiresAuth": true });
                                        return null;
                                    }

                                    return (
                                        <page.LazyComponent
                                            className={classes.page}
                                            route={route}
                                        />
                                    );
                                }
                            }

                            return <pages.page404.LazyComponent />;
                        })()}
                    </Suspense>
                </main>
            </section>
            <Footer
                className={classes.footer}
                onyxiaVersion={(() => {
                    const version = getEnv().ONYXIA_VERSION;

                    if (version === "") {
                        return undefined;
                    }

                    const url = getEnv().ONYXIA_VERSION_URL;

                    assert(url !== "");

                    return { "number": version, url };
                })()}
                contributeUrl={"https://github.com/inseefrlab/onyxia"}
                termsLink={routes.terms().link}
            />
        </div>
    );
}

function SuspenseFallback() {
    const { hideRootSplashScreen } = useSplashScreen();

    useEffect(() => {
        return () => {
            hideRootSplashScreen();
        };
    }, []);

    return null;
}

const useStyles = tss.withName({ App }).create(({ theme }) => {
    const footerHeight = 32;

    const rootRightLeftMargin = theme.spacing(4);

    return {
        "root": {
            "height": "100%",
            "display": "flex",
            "flexDirection": "column",
            "backgroundColor": theme.colors.useCases.surfaces.background,
            "margin": `0 ${rootRightLeftMargin}px`,
            "position": "relative"
        },
        "globalAlert": {
            "position": "relative",
            "width": `calc(100% + 2 * ${rootRightLeftMargin}px)`,
            "left": -rootRightLeftMargin,
            "marginBottom": theme.spacing(1)
        },
        "header": {
            "paddingBottom": 0 //For the LeftBar shadow
        },
        "betweenHeaderAndFooter": {
            "flex": 1,
            "overflow": "hidden",
            "display": "flex",
            "paddingTop": theme.spacing(2.3), //For the LeftBar shadow
            "paddingBottom": footerHeight
        },
        "footer": {
            "height": footerHeight,
            "position": "absolute",
            "bottom": 0,
            "width": "100%",
            "background": "transparent"
        },
        "leftBar": {
            "height": "100%"
        },
        "main": {
            "height": "100%",
            "flex": 1,
            //TODO: See if scroll delegation works if we put auto here instead of "hidden"
            "paddingLeft": theme.spacing(4),
            "overflow": "hidden"
        },
        "page": {
            "animation": `${keyframes`
            0% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
            `} 400ms`
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
    const { userAuthentication, userConfigs } = useCoreFunctions();

    const isUserLoggedIn = userAuthentication.getIsUserLoggedIn();

    const { isDarkModeEnabled, setIsDarkModeEnabled } = useIsDarkModeEnabled();

    const userConfigsIsDarkModeEnabled = useCoreState(state =>
        !isUserLoggedIn ? undefined : state.userConfigs.isDarkModeEnabled.value
    );

    useEffect(() => {
        if (userConfigsIsDarkModeEnabled === undefined) {
            return;
        }

        setIsDarkModeEnabled(userConfigsIsDarkModeEnabled);
    }, []);

    useEffectOnValueChange(() => {
        if (!isUserLoggedIn) {
            return;
        }

        userConfigs.changeValue({
            "key": "isDarkModeEnabled",
            "value": isDarkModeEnabled
        });
    }, [isDarkModeEnabled]);
}
