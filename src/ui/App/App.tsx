import "minimal-polyfills/Object.fromEntries";
import { useMemo, useEffect, useReducer, Suspense } from "react";
import { Header } from "ui/shared/Header";
import { LeftBar, makeStyles, type IconId } from "ui/theme";
import type { LeftBarProps } from "onyxia-ui/LeftBar";
import { Footer } from "./Footer";
import { useTranslation, useResolveLocalizedString } from "ui/i18n";
import { useCoreState, useCoreFunctions } from "core";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useRoute, routes } from "ui/routes";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { useDomRect, useSplashScreen } from "onyxia-ui";
import { id } from "tsafe/id";
import { useIsDarkModeEnabled } from "onyxia-ui";
import { keyframes } from "tss-react";
import type { Item } from "onyxia-ui/LeftBar";
import { getExtraLeftBarItemsFromEnv, getIsHomePageDisabled } from "ui/env";
import { declareComponentKeys } from "i18nifty";
import { RouteProvider } from "ui/routes";
import { createCoreProvider } from "core";
import { injectTransferableEnvsInSearchParams } from "keycloak-theme/login/envCarriedOverToKc";
import { injectGlobalStatesInSearchParams } from "powerhooks/useGlobalState";
import { evtLang } from "ui/i18n";
import { getEnv } from "env";
import { logoContainerWidthInPercent } from "./logoContainerWidthInPercent";
import { ThemeProvider, splashScreen, createGetViewPortConfig } from "ui/theme";
import { PortraitModeUnsupported } from "ui/shared/PortraitModeUnsupported";
import { objectKeys } from "tsafe/objectKeys";
import { pages } from "ui/pages";
import { assert, type Equals } from "tsafe/assert";
import { useIsI18nFetching } from "ui/i18n";
import { useLang } from "ui/i18n";
import { Alert } from "onyxia-ui/Alert";
import { simpleHash } from "ui/tools/simpleHash";
import { Markdown } from "onyxia-ui/Markdown";
import { type LocalizedString } from "ui/i18n";
import { getGlobalAlert } from "ui/env";

const { CoreProvider } = createCoreProvider({
    "apiUrl": getEnv().ONYXIA_API_URL,
    "isUserInitiallyLoggedIn": getEnv().KEYCLOAK_URL === undefined ? false : undefined,
    "jwtClaimByUserKey": {
        "email": getEnv().JWT_EMAIL_CLAIM,
        "familyName": getEnv().JWT_FAMILY_NAME_CLAIM,
        "firstName": getEnv().JWT_FIRST_NAME_CLAIM,
        "username": getEnv().JWT_USERNAME_CLAIM,
        "groups": getEnv().JWT_GROUPS_CLAIM
    },
    "keycloakParams":
        getEnv().KEYCLOAK_URL === ""
            ? undefined
            : {
                  "url": getEnv().KEYCLOAK_URL,
                  "realm": getEnv().KEYCLOAK_REALM,
                  "clientId": getEnv().KEYCLOAK_CLIENT_ID
              },
    "getCurrentLang": () => evtLang.state,
    "transformUrlBeforeRedirectToLogin": url =>
        [url]
            .map(injectTransferableEnvsInSearchParams)
            .map(injectGlobalStatesInSearchParams)[0]
});

const { getViewPortConfig } = createGetViewPortConfig({ PortraitModeUnsupported });

export default function App() {
    const isI18nFetching = useIsI18nFetching();

    console.log({ isI18nFetching });

    return (
        <ThemeProvider getViewPortConfig={getViewPortConfig} splashScreen={splashScreen}>
            <RouteProvider>
                <CoreProvider>
                    <ContextualizedApp />
                </CoreProvider>
            </RouteProvider>
        </ThemeProvider>
    );
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

    const projectsSlice = useProjectsSlice();

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
                              "iconId": "home",
                              "label": t("home"),
                              "link": routes.home().link
                          } as const
                      }),
                "account": {
                    "iconId": "account",
                    "label": t("account"),
                    "link": routes.account().link,
                    "belowDivider": t("divider: services features")
                },
                "catalog": {
                    "iconId": "catalog",
                    "label": t("catalog"),
                    "link": routes.catalogExplorer().link
                },
                "myServices": {
                    "iconId": "services",
                    "label": t("myServices"),
                    "link": routes.myServices().link,
                    "belowDivider": t("divider: external services features")
                },
                ...(!secretExplorer.getIsEnabled()
                    ? ({} as never)
                    : {
                          "mySecrets": {
                              "iconId": "secrets",
                              "label": t("mySecrets"),
                              "link": routes.mySecrets().link
                          } as const
                      }),
                ...(!fileExplorer.getIsEnabled()
                    ? ({} as never)
                    : {
                          "myFiles": {
                              "iconId": "files",
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
                                  id<Item>({
                                      "iconId": iconId as any,
                                      "label": resolveLocalizedString(label),
                                      "link": {
                                          "href": url,
                                          "target": "_blank"
                                      }
                                  })
                              ])
                          );
                })()
            } satisfies LeftBarProps<IconId, string>["items"]),
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
            {(() => {
                const common = {
                    "className": classes.header,
                    "useCase": "core app",
                    logoContainerWidth,
                    "onLogoClick": onHeaderLogoClick
                } as const;

                if (isUserLoggedIn) {
                    assert(projectsSlice !== null);

                    return (
                        <Header
                            {...common}
                            isUserLoggedIn={true}
                            onLogoutClick={onHeaderAuthClick}
                            {...projectsSlice}
                        />
                    );
                }

                return (
                    <Header
                        {...common}
                        isUserLoggedIn={false}
                        onLoginClick={onHeaderAuthClick}
                    />
                );
            })()}
            <section className={classes.betweenHeaderAndFooter}>
                <LeftBar
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
                            case "catalogExplorer":
                                return "catalog";
                            case "catalogLauncher":
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
                //NOTE: Defined in ./config-overrides.js
                packageJsonVersion={process.env.VERSION!}
                contributeUrl={"https://github.com/InseeFrLab/onyxia-web"}
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

const useStyles = makeStyles({ "name": { App } })(theme => {
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
            "left": -rootRightLeftMargin
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

                    const markdownNode = <Markdown>{str}</Markdown>;

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

function useProjectsSlice() {
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
        return null;
    }

    const { projects, selectedProjectId } = projectsState;

    return { projects, selectedProjectId, onSelectedProjectChange };
}
