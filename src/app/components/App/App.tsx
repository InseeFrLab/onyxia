import { useMemo, useEffect, memo } from "react";
import { Header } from "app/components/shared/Header";
import { LeftBar } from "app/theme";
import { Footer } from "./Footer";
import { useLng } from "app/i18n/useLng";
import { getTosMarkdownUrl } from "app/components/KcApp/getTosMarkdownUrl";
import { makeStyles } from "app/theme";
import { useTranslation } from "app/i18n/useTranslations";
import { useSelector, useThunks } from "app/libApi";
import { useConstCallback } from "powerhooks/useConstCallback";
import { MySecrets } from "app/components/pages/MySecrets";
import { useRoute } from "app/routes/router";
import { Home } from "app/components/pages/Home";
import { assert } from "tsafe/assert";
import { routes } from "app/routes/router";
import { useEffectOnValueChange } from "powerhooks/useEffectOnValueChange";
import { useDomRect, useSplashScreen } from "onyxia-ui";
import { Account } from "app/components/pages/Account";
import { FourOhFour } from "app/components/pages/FourOhFour";
import { Catalog } from "app/components/pages/Catalog";
import { MyServices } from "app/components/pages/MyServices";
import { typeGuard } from "tsafe/typeGuard";
import type { SupportedLanguage } from "app/i18n/translations";
import { id } from "tsafe/id";
import { useIsDarkModeEnabled } from "onyxia-ui";
//Legacy
import { MyBuckets } from "js/components/mes-fichiers/MyBuckets";
import { NavigationFile } from "js/components/mes-fichiers/navigation/NavigationFile";
import {
    CloudShell,
    useIsCloudShellVisible,
} from "js/components/cloud-shell/cloud-shell";
//TODO: Move in a slice, we shouldn't access env directly here.
import { getEnv } from "env";

export const logoContainerWidthInPercent = 4;

export type Props = {
    className?: string;
};

export const App = memo((props: Props) => {
    const { className } = props;

    const { t } = useTranslation("App");

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

    const { userAuthenticationThunks, secretExplorerThunks } = useThunks();

    const isUserLoggedIn = userAuthenticationThunks.getIsUserLoggedIn();

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

    const leftBarItems = useMemo(
        () =>
            ({
                "home": {
                    "iconId": "home",
                    "label": t("home"),
                    "link": routes.home().link,
                },
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
                "mySecrets": {
                    "iconId": "secrets",
                    "label": t("mySecrets"),
                    "link": routes.mySecrets().link,
                    "availability": secretExplorerThunks.getIsEnabled()
                        ? "available"
                        : "greyed",
                },
                "myFiles": {
                    "iconId": "files",
                    "label": t("myFiles"),
                    "link": routes.myBuckets().link,
                    "availability": getEnv().MINIO_URL !== "" ? "available" : "greyed",
                },
                "myDataCatalog": {
                    "iconId": "MenuBookOutlined",
                    "label": t("myDataCatalog"),
                    "link": {
                        "href":
                            "https://" +
                            getEnv().DATA_CATALOG_URL +
                            "." +
                            getEnv().DOMAIN_URL,
                        "target": "_blank",
                    },
                },
            } as const),
        [t],
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
                            case "myDataCatalog":
                                return "myDataCatalog";
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
        | "myFiles"
        | "myDataCatalog",
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

const PageSelector = (props: { route: ReturnType<typeof useRoute> }) => {
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

        if (Page.requireUserLoggedIn && !isUserLoggedIn) {
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

    {
        const Page = Catalog;

        if (Page.routeGroup.has(route)) {
            if (Page.requireUserLoggedIn(route) && !isUserLoggedIn) {
                userAuthenticationThunks.login();
                return null;
            }

            return <Page route={route} />;
        }
    }

    {
        const Page = Home;

        if (Page.routeGroup.has(route)) {
            if (Page.requireUserLoggedIn() && !isUserLoggedIn) {
                userAuthenticationThunks.login();
                return null;
            }

            return <Page />;
        }
    }

    {
        const Page = MySecrets;

        if (Page.routeGroup.has(route)) {
            if (Page.requireUserLoggedIn() && !isUserLoggedIn) {
                userAuthenticationThunks.login();
                return null;
            }

            return <Page route={route} />;
        }
    }

    {
        const Page = Account;

        if (Page.routeGroup.has(route)) {
            if (Page.requireUserLoggedIn() && !isUserLoggedIn) {
                userAuthenticationThunks.login();
                return null;
            }

            return <Page route={route} />;
        }
    }

    {
        const Page = MyServices;

        if (Page.routeGroup.has(route)) {
            if (Page.requireUserLoggedIn() && !isUserLoggedIn) {
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
};

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

        const { local } = userAuthenticationThunks.getUser();

        if (
            !typeGuard<SupportedLanguage>(
                local,
                local in
                    id<Record<SupportedLanguage, null>>({
                        "en": null,
                        "fr": null,
                    }),
            )
        ) {
            return;
        }

        setLng(local);
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

            await projectSelectionThunks.changeProject({
                projectId,
                "doPreventDispatch": true,
            });

            if (route.name === "mySecrets") {
                //TODO: Refactor, if we switch project on the secrets
                //explorer page we want to go back to the project top dir.
                window.location.href = routes.mySecrets().href;
                return;
            }

            window.location.reload();
        },
    );

    if (projectsState === undefined) {
        return null;
    }

    const { projects, selectedProjectId } = projectsState;

    return { projects, selectedProjectId, onSelectedProjectChange };
}
