import "minimal-polyfills/Object.fromEntries";
import { useMemo, useEffect, useReducer, Suspense } from "react";
import { Header } from "ui/shared/Header";
import { tss, useStyles as useCss } from "ui/theme";
import { LeftBar, type LeftBarProps } from "onyxia-ui/LeftBar";
import { Footer } from "./Footer";
import { useTranslation, useResolveLocalizedString } from "ui/i18n";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useRoute, routes } from "ui/routes";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { useSplashScreen } from "onyxia-ui";
import { useDomRect } from "powerhooks/useDomRect";
import { id } from "tsafe/id";
import { useIsDarkModeEnabled } from "onyxia-ui";
import { keyframes } from "tss-react";
import {
    getExtraLeftBarItemsFromEnv,
    getIsHomePageDisabled,
    getDisableCommandBar
} from "ui/env";
import { declareComponentKeys } from "i18nifty";
import { RouteProvider } from "ui/routes";
import { createCoreProvider, useCoreState, useCoreFunctions, selectors } from "core";
import { injectTransferableEnvsInSearchParams } from "keycloak-theme/login/envCarriedOverToKc";
import { injectGlobalStatesInSearchParams } from "powerhooks/useGlobalState";
import { evtLang } from "ui/i18n";
import { getEnv } from "env";
import { logoContainerWidthInPercent } from "./logoContainerWidthInPercent";
import { ThemeProvider, targetWindowInnerWidth } from "ui/theme";
import { PortraitModeUnsupported } from "ui/shared/PortraitModeUnsupported";
import { objectKeys } from "tsafe/objectKeys";
import { pages } from "ui/pages";
import { assert, type Equals } from "tsafe/assert";
import { useLang } from "ui/i18n";
import { Alert } from "onyxia-ui/Alert";
import { simpleHash } from "ui/tools/simpleHash";
import { Markdown } from "onyxia-ui/Markdown";
import { type LocalizedString, useIsI18nFetching } from "ui/i18n";
import { getGlobalAlert, getDisablePersonalInfosInjectionInGroup } from "ui/env";
import { enableScreenScaler } from "screen-scaler/react";
import { addParamToUrl } from "powerhooks/tools/urlSearchParams";
import { customIcons } from "ui/theme";

const { CoreProvider } = createCoreProvider({
    "apiUrl": getEnv().ONYXIA_API_URL,
    "getCurrentLang": () => evtLang.state,
    "transformUrlBeforeRedirectToLogin": url =>
        [url]
            .map(injectTransferableEnvsInSearchParams)
            .map(injectGlobalStatesInSearchParams)
            .map(
                url =>
                    addParamToUrl({
                        url,
                        "name": "ui_locales",
                        "value": evtLang.state
                    }).newUrl
            )[0],
    "disablePersonalInfosInjectionInGroup": getDisablePersonalInfosInjectionInGroup(),
    "isCommandBarEnabledByDefault": !getDisableCommandBar()
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
    const { t } = useTranslation({ App });

    useSyncDarkModeWithValueInProfile();

    const {
        domRect: { width: rootWidth },
        ref: rootRef
    } = useDomRect();

    const { classes } = useStyles();

    const logoContainerWidth = Math.max(
        Math.floor((Math.min(rootWidth, 1920) * logoContainerWidthInPercent) / 100),
        45
    );

    const route = useRoute();

    const onHeaderLogoClick = useConstCallback(() => routes.home().push());

    const { userAuthentication, fileExplorer, secretExplorer } = useCoreFunctions();

    const isUserLoggedIn = userAuthentication.getIsUserLoggedIn();

    const onHeaderAuthClick = useConstCallback(() =>
        isUserLoggedIn
            ? userAuthentication.logout({ "redirectTo": "home" })
            : userAuthentication.login({ "doesCurrentHrefRequiresAuth": false })
    );

    const projectSelectProps = useProjectSelectProps();

    const regionSelectProps = useRegionSelectProps();

    const { lang } = useLang();

    const { resolveLocalizedString } = useResolveLocalizedString({
        "labelWhenMismatchingLanguage": true
    });

    const leftBarItems = useMemo(
        () =>
            ({
                ...(getIsHomePageDisabled()
                    ? ({} as never)
                    : {
                          "home": {
                              "icon": customIcons.homeSvgUrl,
                              "label": t("home"),
                              "link": routes.home().link
                          } as const
                      }),
                "account": {
                    "icon": customIcons.accountSvgUrl,
                    "label": t("account"),
                    "link": routes.account().link,
                    "belowDivider": t("divider: services features")
                },
                "catalog": {
                    "icon": customIcons.catalogSvgUrl,
                    "label": t("catalog"),
                    "link": routes.catalog().link
                },
                "myServices": {
                    "icon": customIcons.servicesSvgUrl,
                    "label": t("myServices"),
                    "link": routes.myServices().link,
                    "belowDivider": t("divider: external services features")
                },
                ...(!secretExplorer.getIsEnabled()
                    ? ({} as never)
                    : {
                          "mySecrets": {
                              "icon": customIcons.secretsSvgUrl,
                              "label": t("mySecrets"),
                              "link": routes.mySecrets().link
                          } as const
                      }),
                ...(!fileExplorer.getIsEnabled()
                    ? ({} as never)
                    : {
                          "myFiles": {
                              "icon": customIcons.filesSvgUrl,
                              "label": t("myFiles"),
                              "link": routes.myFiles().link,
                              "belowDivider":
                                  getExtraLeftBarItemsFromEnv() === undefined
                                      ? true
                                      : t("divider: onyxia instance specific features")
                          } as const
                      }),
                ...(() => {
                    const extraLeftBarItems = getExtraLeftBarItemsFromEnv();

                    return extraLeftBarItems === undefined
                        ? ({} as never)
                        : Object.fromEntries(
                              extraLeftBarItems.map(({ iconId, label, url }, i) => [
                                  `extraItem${i}`,
                                  id<LeftBarProps.Item>({
                                      "icon": iconId,
                                      "label": resolveLocalizedString(label),
                                      "link": {
                                          "href": url,
                                          "target": "_blank"
                                      }
                                  })
                              ])
                          );
                })()
            } satisfies LeftBarProps<string>["items"]),
        [t, lang]
    );

    return (
        <div ref={rootRef} className={classes.root}>
            {(() => {
                const globalAlert = getGlobalAlert();

                if (globalAlert === undefined) {
                    return null;
                }

                return (
                    <GlobalAlert
                        className={classes.globalAlert}
                        severity={globalAlert.severity}
                        message={globalAlert.message}
                    />
                );
            })()}
            <Header
                className={classes.header}
                useCase="core app"
                logoContainerWidth={logoContainerWidth}
                onLogoClick={onHeaderLogoClick}
                regionSelectProps={regionSelectProps}
                projectSelectProps={projectSelectProps}
                auth={
                    isUserLoggedIn
                        ? {
                              "isUserLoggedIn": true,
                              "onLogoutClick": onHeaderAuthClick
                          }
                        : {
                              "isUserLoggedIn": false,
                              "onLoginClick": onHeaderAuthClick
                          }
                }
            />
            <section className={classes.betweenHeaderAndFooter}>
                <LeftBar
                    doPersistIsPanelOpen={true}
                    defaultIsPanelOpen={true}
                    className={classes.leftBar}
                    collapsedWidth={logoContainerWidth}
                    reduceText={t("reduce")}
                    items={leftBarItems}
                    currentItemId={(() => {
                        switch (route.name) {
                            case "home":
                                return "home" as const;
                            case "account":
                                return "account";
                            case "catalog":
                                return "catalog";
                            case "launcher":
                                return "catalog";
                            case "myServices":
                                return "myServices";
                            case "mySecrets":
                                return "mySecrets";
                            case "myFiles":
                                return "myFiles";
                            case "page404":
                                return null;
                            case "terms":
                                return null;
                            case false:
                                return null;
                        }
                        assert<Equals<typeof route, never>>(false);
                    })()}
                />

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

export const { i18n } = declareComponentKeys<
    | "reduce"
    | "home"
    | "account"
    | "catalog"
    | "myServices"
    | "mySecrets"
    | "myFiles"
    | "divider: services features"
    | "divider: external services features"
    | "divider: onyxia instance specific features"
>()({ App });

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

const { GlobalAlert } = (() => {
    type GlobalAlertProps = {
        className?: string;
        // Default value is "info"
        severity: "success" | "info" | "warning" | "error" | undefined;
        message: LocalizedString;
    };

    const localStorageKeyPrefix = "global-alert-";

    function GlobalAlert(props: GlobalAlertProps) {
        const { className, severity = "info", message } = props;

        const { resolveLocalizedStringDetailed } = useResolveLocalizedString({
            "labelWhenMismatchingLanguage": true
        });

        const localStorageKey = useMemo(() => {
            const { str } = resolveLocalizedStringDetailed(message);

            return `${localStorageKeyPrefix}${simpleHash(severity + str)}-closed`;
        }, [severity, message]);

        const [trigger, pullTrigger] = useReducer(() => ({}), {});

        const isClosed = useMemo(() => {
            // Remove all the local storage keys that are not used anymore.
            for (const key of Object.keys(localStorage)) {
                if (!key.startsWith(localStorageKeyPrefix) || key === localStorageKey) {
                    continue;
                }
                localStorage.removeItem(key);
            }

            const value = localStorage.getItem(localStorageKey);

            return value === "true";
        }, [localStorageKey, trigger]);

        const { css, theme } = useCss();

        return (
            <Alert
                className={className}
                severity={severity}
                doDisplayCross
                isClosed={isClosed}
                onClose={() => {
                    localStorage.setItem(localStorageKey, "true");
                    pullTrigger();
                }}
            >
                {(() => {
                    const { str, langAttrValue } =
                        resolveLocalizedStringDetailed(message);

                    const markdownNode = (
                        <Markdown
                            className={css({
                                "&>p": { ...theme.spacing.topBottom("margin", 2) }
                            })}
                        >
                            {str}
                        </Markdown>
                    );

                    return langAttrValue === undefined ? (
                        markdownNode
                    ) : (
                        <div lang={langAttrValue}>{markdownNode}</div>
                    );
                })()}
            </Alert>
        );
    }

    return { GlobalAlert };
})();

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

function useProjectSelectProps() {
    const { projectConfigs, userAuthentication } = useCoreFunctions();
    const projectsState = useCoreState(state =>
        !userAuthentication.getIsUserLoggedIn() ? undefined : state.projectConfigs
    );

    const route = useRoute();

    {
        const { isOnboarding } = projectsState ?? {};

        const { showSplashScreen, hideSplashScreen } = useSplashScreen({
            "minimumDisplayDuration": 200
        });

        useEffect(() => {
            if (isOnboarding === undefined) {
                return;
            }

            if (isOnboarding) {
                showSplashScreen({
                    "enableTransparency": true
                });
            } else {
                hideSplashScreen();
            }
        }, [isOnboarding]);
    }

    const onSelectedProjectChange = useConstCallback(
        async (props: { projectId: string }) => {
            const { projectId } = props;

            //TODO: Eventually we shouldn't have to reload any pages
            //when project is changed.
            const reload = (() => {
                switch (route.name) {
                    case "home":
                    case "account":
                    case "myServices":
                    case "myFiles":
                    case "mySecrets":
                        return undefined;
                    default:
                        return () => window.location.reload();
                }
            })();

            await projectConfigs.changeProject({
                projectId,
                "doPreventDispatch": reload !== undefined
            });

            reload?.();
        }
    );

    if (projectsState === undefined) {
        return undefined;
    }

    const { projects, selectedProjectId } = projectsState;

    if (projects.length === 1) {
        return undefined;
    }

    return { projects, selectedProjectId, onSelectedProjectChange };
}

function useRegionSelectProps() {
    const { deploymentRegion } = useCoreFunctions();
    const { availableDeploymentRegionIds } = useCoreState(
        selectors.deploymentRegion.availableDeploymentRegionIds
    );
    const {
        selectedDeploymentRegion: { id: selectedDeploymentRegionId }
    } = useCoreState(selectors.deploymentRegion.selectedDeploymentRegion);

    const route = useRoute();

    const onDeploymentRegionChange = useConstCallback(
        async (props: { deploymentRegionId: string }) => {
            const { deploymentRegionId } = props;

            deploymentRegion.changeDeploymentRegion({
                deploymentRegionId,
                "reload": () => {
                    window.location.reload();
                    assert(false, "never");
                }
            });
        }
    );

    if (availableDeploymentRegionIds.length === 1) {
        return undefined;
    }

    switch (route.name) {
        case "launcher":
            break;
        case "myFiles":
            break;
        case "mySecrets":
            break;
        case "myServices":
            break;
        default:
            return undefined;
    }

    return {
        availableDeploymentRegionIds,
        selectedDeploymentRegionId,
        onDeploymentRegionChange
    };
}
