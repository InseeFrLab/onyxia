import "minimal-polyfills/Object.fromEntries";
import { useMemo, useEffect, Suspense } from "react";
import { Header } from "ui/shared/Header";
import { LeftBar, makeStyles, type IconId } from "ui/theme";
import type { LeftBarProps } from "onyxia-ui/LeftBar";
import { Footer } from "./Footer";
import { useLang } from "ui/i18n";
import { useTranslation, useResolveLocalizedString } from "ui/i18n";
import { useCoreState, useCoreFunctions } from "core";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useRoute, routes } from "ui/routes";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { useDomRect, useSplashScreen } from "onyxia-ui";
import { id } from "tsafe/id";
import { useIsDarkModeEnabled } from "onyxia-ui";
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
    "keycloakParams": {
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
    return (
        <ThemeProvider getViewPortConfig={getViewPortConfig} splashScreen={splashScreen}>
            <CoreProvider>
                <RouteProvider>
                    <ContextualizedApp />
                </RouteProvider>
            </CoreProvider>
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
                    <Suspense fallback={<Fallback />}>
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

                                    return <page.LazyComponent route={route} />;
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

function Fallback() {
    const { hideRootSplashScreen, showSplashScreen, hideSplashScreen } =
        useSplashScreen();

    useEffect(() => {
        showSplashScreen({ "enableTransparency": false });

        return () => {
            hideSplashScreen();
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

    return {
        "root": {
            "height": "100%",
            "display": "flex",
            "flexDirection": "column",
            "backgroundColor": theme.colors.useCases.surfaces.background,
            "margin": theme.spacing({ "topBottom": 0, "rightLeft": 4 }),
            "position": "relative"
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

function useProjectsSlice() {
    const { projectSelection, userAuthentication } = useCoreFunctions();
    const projectsState = useCoreState(state =>
        !userAuthentication.getIsUserLoggedIn() ? undefined : state.projectSelection
    );

    const route = useRoute();

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

            await projectSelection.changeProject({
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
