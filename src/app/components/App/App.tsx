import { useMemo, memo } from "react";
import { Header } from "app/components/shared/Header";
import { LeftBar } from "./LeftBar";
import type { Props as LeftBarProps } from "./LeftBar";
import { Footer } from "./Footer";
import { useLng } from "app/i18n/useLng";
import { getTosMarkdownUrl } from "app/components/KcApp/getTosMarkdownUrl";
import { makeStyles } from "app/theme";
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

const useStyles = makeStyles()(theme => ({
    "root": {
        "height": "100%",
        "display": "flex",
        "flexDirection": "column",
        "backgroundColor": theme.colors.useCases.surfaces.background,
        "margin": theme.spacing({ "topBottom": 0, "rightLeft": 4 }),
    },
    "betweenHeaderAndFooter": {
        "flex": 1,
        "overflow": "hidden",
        "display": "flex",
    },
    "footer": {
        "height": 32,
    },

    "leftBar": {
        "height": "100%",
    },
    "main": {
        "flex": 1,
        "height": "100%",
        //TODO: See if scroll delegation works if we put auto here instead of "hidden"
        "overflow": "auto",
        "paddingLeft": theme.spacing(4),
    },
}));

export type Props = {
    className?: string;
};

export const App = memo((props: Props) => {
    const { className } = props;

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

    const onLeftBarClick = useConstCallback(
        (target: Parameters<LeftBarProps["onClick"]>[0]) => {
            if (target in routes) {
                routes[target]().push();
                return;
            }

            alert(`TODO: missing page ${target}`);
        },
    );

    const { tosUrl } = (function useClosure() {
        const { lng } = useLng();
        const tosUrl = getTosMarkdownUrl(lng);
        return { tosUrl };
    })();

    return (
        <div ref={rootRef} className={cx(classes.root, className)}>
            <Header
                type="core"
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
                    onClick={onLeftBarClick}
                    currentPage={route.name}
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
                return <Page route={route} />;
            case MyBuckets:
                return <Page />;
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
