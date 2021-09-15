import { useMemo, memo } from "react";
import { Header } from "app/components/shared/Header";
import { LeftBar } from "app/theme";
import { Footer } from "./Footer";
import { useLng } from "app/i18n/useLng";
import { getTosMarkdownUrl } from "app/components/KcApp/getTosMarkdownUrl";
import { makeStyles } from "app/theme";
import { useTranslation } from "app/i18n/useTranslations";
import {
    useAppConstants,
    useSelector,
    useSyncDarkModeWithValueInProfile,
    useApplyLanguageSelectedAtLogin,
} from "app/interfaceWithLib/hooks";
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

//Legacy
import { MyBuckets } from "js/components/mes-fichiers/MyBuckets";
import { NavigationFile } from "js/components/mes-fichiers/navigation/NavigationFile";
import {
    CloudShell,
    useIsCloudShellVisible,
} from "js/components/cloud-shell/cloud-shell";

export const logoContainerWidthInPercent = 4;

const useStyles = makeStyles()(theme => {
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
            "overflow": "visible", //For the LeftBar shadow
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

    const appConstants = useAppConstants();

    const onHeaderAuthClick = useConstCallback(() =>
        appConstants.isUserLoggedIn
            ? appConstants.logout({ "redirectToOrigin": true })
            : appConstants.login(),
    );

    const { tosUrl } = (function useClosure() {
        const { lng } = useLng();
        const tosUrl = getTosMarkdownUrl(lng);
        return { tosUrl };
    })();

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
                },
                "myFiles": {
                    "iconId": "files",
                    "label": t("myFiles"),
                    "link": routes.myBuckets().link,
                },
            } as const),
        [t],
    );

    return (
        <div ref={rootRef} className={cx(classes.root, className)}>
            <Header
                className={classes.header}
                useCase="core app"
                logoContainerWidth={logoContainerWidth}
                isUserLoggedIn={appConstants.isUserLoggedIn}
                useIsCloudShellVisible={useIsCloudShellVisible}
                onLogoClick={onHeaderLogoClick}
                onAuthClick={onHeaderAuthClick}
            />
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
            {appConstants.isUserLoggedIn && <CloudShell />}
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

const PageSelector = (props: { route: ReturnType<typeof useRoute> }) => {
    const { route } = props;

    const appConstants = useAppConstants();

    const legacyRoute = useMemo(() => {
        const Page = [MyBuckets, NavigationFile].find(({ routeGroup }) =>
            routeGroup.has(route),
        );

        if (Page === undefined) {
            return undefined;
        }

        if (Page.requireUserLoggedIn && !appConstants.isUserLoggedIn) {
            appConstants.login();

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
            if (Page.requireUserLoggedIn(route) && !appConstants.isUserLoggedIn) {
                appConstants.login();

                return null;
            }

            return <Page route={route} />;
        }
    }

    {
        const Page = Home;

        if (Page.routeGroup.has(route)) {
            if (Page.requireUserLoggedIn() && !appConstants.isUserLoggedIn) {
                appConstants.login();

                return null;
            }

            return <Page />;
        }
    }

    {
        const Page = MySecrets;

        if (Page.routeGroup.has(route)) {
            if (Page.requireUserLoggedIn() && !appConstants.isUserLoggedIn) {
                appConstants.login();

                return null;
            }

            return <Page route={route} />;
        }
    }

    {
        const Page = Account;

        if (Page.routeGroup.has(route)) {
            if (Page.requireUserLoggedIn() && !appConstants.isUserLoggedIn) {
                appConstants.login();

                return null;
            }

            return <Page route={route} />;
        }
    }

    {
        const Page = MyServices;

        if (Page.routeGroup.has(route)) {
            if (Page.requireUserLoggedIn() && !appConstants.isUserLoggedIn) {
                appConstants.login();

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
