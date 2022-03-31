import "minimal-polyfills/Object.fromEntries";
import { useMemo, useEffect, memo } from "react";
import { Header } from "ui/components/shared/Header";
import { LeftBar } from "ui/theme";
import { Footer } from "./Footer";
import { useLng } from "ui/i18n/useLng";
import { getTosMarkdownUrl } from "ui/components/KcApp/getTosMarkdownUrl";
import { makeStyles } from "ui/theme";
import { useTranslation } from "ui/i18n/useTranslations";
import { useSelector, useThunks } from "ui/coreApi";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useRoute, routes } from "ui/routes";
import { Home } from "ui/components/pages/Home";
import { assert } from "tsafe/assert";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { useDomRect, useSplashScreen } from "onyxia-ui";
import { Account } from "ui/components/pages/Account";
import { FourOhFour } from "ui/components/pages/FourOhFour";
import { Catalog } from "ui/components/pages/Catalog";
import { MyServices } from "ui/components/pages/MyServices";
import { typeGuard } from "tsafe/typeGuard";
import type { Language } from "ui/i18n/useLng";
import { languages } from "ui/i18n/useLng";
import { id } from "tsafe/id";
import { useIsDarkModeEnabled } from "onyxia-ui";
import { MyFilesMySecrets } from "ui/components/pages/MyFilesMySecrets";
//Legacy
import { MyBuckets } from "js/components/mes-fichiers/MyBuckets";
import { NavigationFile } from "js/components/mes-fichiers/navigation/NavigationFile";
import {
    CloudShell,
    useIsCloudShellVisible,
} from "js/components/cloud-shell/cloud-shell";
import { useResolveLocalizedString } from "ui/i18n/useResolveLocalizedString";
import type { Item } from "onyxia-ui/LeftBar";
import { getExtraLeftBarItemsFromEnv, getIsHomePageDisabled } from "ui/env";

export const logoContainerWidthInPercent = 4;

export type Props = {
    className?: string;
};

export const App = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation({ App });

    useSyncDarkModeWithValueInProfile();

    useApplyLanguageSelectedAtLogin();

    const {
        domRect: { width: rootWidth },
        ref: rootRef,
    } = useDomRect();

    {
        const { hideRootSplashScreen } = useSplashScreen();

        useEffectOnValueChange(() => {
            hideRootSplashScreen();
        }, [rootWidth === 0]);
    }

    const isWaiting = useSelector(state => state.app.waiting);

    {
        const { hideSplashScreen, showSplashScreen } = useSplashScreen();

        useEffectOnValueChange(() => {
            if (isWaiting) {
                showSplashScreen({ "enableTransparency": true });
            } else {
                hideSplashScreen();
            }
        }, [isWaiting]);
    }
    const { classes, cx } = useStyles();

    const logoContainerWidth = Math.max(
        Math.floor((Math.min(rootWidth, 1920) * logoContainerWidthInPercent) / 100),
        45,
    );

    const route = useRoute();

    const onHeaderLogoClick = useConstCallback(() => routes.home().push());

    const { userAuthenticationThunks, explorersThunks } = useThunks();

    const isUserLoggedIn = userAuthenticationThunks.getIsUserLoggedIn();

    const isDevModeEnabled = useSelector(state =>
        isUserLoggedIn ? state.userConfigs.isDevModeEnabled.value : false,
    );

    const onHeaderAuthClick = useConstCallback(() =>
        isUserLoggedIn
            ? userAuthenticationThunks.logout({ "redirectTo": "home" })
            : userAuthenticationThunks.login(),
    );

    const { tosUrl } = (function useClosure() {
        const { lng } = useLng();
        const tosUrl = getTosMarkdownUrl(lng);
        return { tosUrl };
    })();

    const projectsSlice = useProjectsSlice();

    const { lng } = useLng();

    const { resolveLocalizedString } = useResolveLocalizedString();

    //TODO: The LefBar types assertion is broken, see what is up.
    const leftBarItems = useMemo(
        () =>
            ({
                ...(getIsHomePageDisabled()
                    ? {}
                    : {
                          "home": {
                              "iconId": "home",
                              "label": t("home"),
                              "link": routes.home().link,
                          } as const,
                      }),
                "account": {
                    "iconId": "account",
                    "label": t("account"),
                    "link": routes.account().link,
                    "hasDividerBelow": true,
                },
                "catalog": {
                    "iconId": "catalog",
                    "label": t("catalog"),
                    "link": routes.catalogExplorer().link,
                },
                "myServices": {
                    "iconId": "services",
                    "label": t("myServices"),
                    "link": routes.myServices().link,
                    "hasDividerBelow": true,
                },
                ...(!explorersThunks.getIsEnabled({ "explorerType": "secrets" })
                    ? ({} as never)
                    : {
                          "mySecrets": {
                              "iconId": "secrets",
                              "label": t("mySecrets"),
                              "link": routes.mySecrets().link,
                          } as const,
                      }),
                ...(!explorersThunks.getIsEnabled({ "explorerType": "s3" })
                    ? ({} as never)
                    : {
                          "myFiles": {
                              "iconId": "files",
                              "label": t("myFiles"),
                              "link": routes.myBuckets().link,
                              //TODO: This usage of getEnv should be removed as soon as we have the new explorer
                              //we should get the info "is file enabled" from the core.
                              "hasDividerBelow": true,
                          } as const,
                      }),
                ...(() => {
                    const extraLeftBarItems = getExtraLeftBarItemsFromEnv();

                    return extraLeftBarItems === undefined
                        ? {}
                        : Object.fromEntries(
                              extraLeftBarItems.map(({ iconId, label, url }, i) => [
                                  `extraItem${i}`,
                                  id<Item>({
                                      "iconId": iconId as any,
                                      "label": resolveLocalizedString(label),
                                      "link": {
                                          "href": url,
                                          "target": "_blank",
                                      },
                                  }),
                              ]),
                          );
                })(),
                ...(() => {
                    if (!isDevModeEnabled) {
                        return {} as never;
                    }

                    return {
                        "myFilesDev": {
                            "iconId": "files",
                            "label": t("myFiles") + " dev",
                            "link": routes.myFilesDev().link,
                            "availability": explorersThunks.getIsEnabled({
                                "explorerType": "s3",
                            })
                                ? "available"
                                : "greyed",
                        },
                    } as const;
                })(),
            } as const),
        [t, lng, isDevModeEnabled],
    );

    return (
        <div ref={rootRef} className={cx(classes.root, className)}>
            {(() => {
                const common = {
                    "className": classes.header,
                    "useCase": "core app",
                    logoContainerWidth,
                    "onLogoClick": onHeaderLogoClick,
                } as const;

                return isUserLoggedIn ? (
                    <Header
                        {...common}
                        isUserLoggedIn={true}
                        useIsCloudShellVisible={useIsCloudShellVisible}
                        onLogoutClick={onHeaderAuthClick}
                        {...projectsSlice!}
                    />
                ) : (
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
                                return "home";
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
                            case "myBuckets":
                                return "myFiles";
                            case "myFiles":
                                return "myFiles";
                        }
                    })()}
                />

                <main className={classes.main}>
                    <PageSelector route={route} />
                </main>
            </section>
            <Footer
                className={classes.footer}
                //NOTE: Defined in ./config-overrides.js
                packageJsonVersion={process.env.VERSION!}
                contributeUrl={"https://github.com/InseeFrLab/onyxia-web"}
                tosUrl={tosUrl}
            />
            {isUserLoggedIn && <CloudShell />}
        </div>
    );
});

export declare namespace App {
    export type I18nScheme = Record<
        | "reduce"
        | "home"
        | "account"
        | "catalog"
        | "myServices"
        | "mySecrets"
        | "myFiles",
        undefined
    >;
}

const useStyles = makeStyles({ "name": { App } })(theme => {
    const footerHeight = 32;

    return {
        "root": {
            "height": "100%",
            "display": "flex",
            "flexDirection": "column",
            "backgroundColor": theme.colors.useCases.surfaces.background,
            "margin": theme.spacing({ "topBottom": 0, "rightLeft": 4 }),
            "position": "relative",
        },
        "header": {
            "paddingBottom": 0, //For the LeftBar shadow
        },
        "betweenHeaderAndFooter": {
            "flex": 1,
            "overflow": "hidden",
            "display": "flex",
            "paddingTop": theme.spacing(2.3), //For the LeftBar shadow
            "paddingBottom": footerHeight,
        },
        "footer": {
            "height": footerHeight,
            "position": "absolute",
            "bottom": 0,
            "width": "100%",
            "background": "transparent",
        },
        "leftBar": {
            "height": "100%",
        },
        "main": {
            "height": "100%",
            "flex": 1,
            //TODO: See if scroll delegation works if we put auto here instead of "hidden"
            "paddingLeft": theme.spacing(4),
            "overflow": "hidden",
        },
    };
});

const PageSelector = memo((props: { route: ReturnType<typeof useRoute> }) => {
    const { route } = props;

    const { userAuthenticationThunks } = useThunks();

    const isUserLoggedIn = userAuthenticationThunks.getIsUserLoggedIn();

    const legacyRoute = useMemo(() => {
        const Page = [MyBuckets, NavigationFile].find(({ routeGroup }) =>
            routeGroup.has(route),
        );

        if (Page === undefined) {
            return undefined;
        }

        if (Page.getDoRequireUserLoggedIn && !isUserLoggedIn) {
            userAuthenticationThunks.login();
            return null;
        }

        switch (Page) {
            case NavigationFile:
                assert(Page.routeGroup.has(route));
                return (
                    <div
                        style={{
                            "height": "100%",
                            "overflow": "auto",
                        }}
                    >
                        <Page route={route} />
                    </div>
                );
            case MyBuckets:
                return (
                    <div
                        style={{
                            "height": "100%",
                            "overflow": "auto",
                        }}
                    >
                        <Page />
                    </div>
                );
        }

        assert(false, "Not all cases have been dealt with in the above switch");
    }, [route]);

    /*
    Here is one of the few places in the codebase where we tolerate code duplication.
    We sacrifice dryness for the sake of type safety and flexibility.
    */
    {
        const Page = Catalog;

        if (Page.routeGroup.has(route)) {
            if (Page.getDoRequireUserLoggedIn(route) && !isUserLoggedIn) {
                userAuthenticationThunks.login();
                return null;
            }

            return <Page route={route} />;
        }
    }

    {
        const Page = Home;

        if (Page.routeGroup.has(route)) {
            if (Page.getDoRequireUserLoggedIn() && !isUserLoggedIn) {
                userAuthenticationThunks.login();
                return null;
            }

            return <Page />;
        }
    }

    {
        const Page = Account;

        if (Page.routeGroup.has(route)) {
            if (Page.getDoRequireUserLoggedIn() && !isUserLoggedIn) {
                userAuthenticationThunks.login();
                return null;
            }

            return <Page route={route} />;
        }
    }

    {
        const Page = MyServices;

        if (Page.routeGroup.has(route)) {
            if (Page.getDoRequireUserLoggedIn() && !isUserLoggedIn) {
                userAuthenticationThunks.login();
                return null;
            }

            return <Page route={route} />;
        }
    }

    {
        const Page = MyFilesMySecrets;

        if (Page.routeGroup.has(route)) {
            if (Page.getDoRequireUserLoggedIn() && !isUserLoggedIn) {
                userAuthenticationThunks.login();
                return null;
            }

            return <Page route={route} />;
        }
    }

    if (legacyRoute !== undefined) {
        return legacyRoute;
    }

    return <FourOhFour />;
});

/** On the login pages hosted by keycloak the user can select
 * a language, we want to use this language on the app.
 * For example we want that if a user selects english on the
 * register page while signing in that the app be set to english
 * automatically.
 */
function useApplyLanguageSelectedAtLogin() {
    const { userAuthenticationThunks } = useThunks();

    const isUserLoggedIn = userAuthenticationThunks.getIsUserLoggedIn();

    const { setLng } = useLng();

    useEffect(() => {
        if (!isUserLoggedIn) {
            return;
        }

        const { locale } = userAuthenticationThunks.getUser();

        if (
            !typeGuard<Language>(
                locale,
                locale !== undefined && id<readonly string[]>(languages).includes(locale),
            )
        ) {
            return;
        }

        setLng(locale);
    }, []);
}

/**
 * This hook to two things:
 * - It sets whether or not the dark mode is enabled based on
 * the value stored in user configs.
 * - Each time the dark mode it changed it changes the value in
 * user configs.
 */
function useSyncDarkModeWithValueInProfile() {
    const { userAuthenticationThunks, userConfigsThunks } = useThunks();

    const isUserLoggedIn = userAuthenticationThunks.getIsUserLoggedIn();

    const { isDarkModeEnabled, setIsDarkModeEnabled } = useIsDarkModeEnabled();

    const userConfigsIsDarkModeEnabled = useSelector(state =>
        !isUserLoggedIn ? undefined : state.userConfigs.isDarkModeEnabled.value,
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

        userConfigsThunks.changeValue({
            "key": "isDarkModeEnabled",
            "value": isDarkModeEnabled,
        });
    }, [isDarkModeEnabled]);
}

function useProjectsSlice() {
    const { projectSelectionThunks, userAuthenticationThunks } = useThunks();
    const projectsState = useSelector(state =>
        !userAuthenticationThunks.getIsUserLoggedIn()
            ? undefined
            : state.projectSelection,
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
                    case "myFilesDev":
                    case "mySecrets":
                        return undefined;
                    default:
                        return () => window.location.reload();
                }
            })();

            await projectSelectionThunks.changeProject({
                projectId,
                "doPreventDispatch": reload !== undefined,
            });

            reload?.();
        },
    );

    if (projectsState === undefined) {
        return null;
    }

    const { projects, selectedProjectId } = projectsState;

    return { projects, selectedProjectId, onSelectedProjectChange };
}
