

import { useMemo, memo } from "react";
import { Header } from "app/components/shared/Header";
import { LeftBar } from "./LeftBar";
import type { Props as LeftBarProps } from "./LeftBar";
import { Footer } from "./Footer";
import { useLng } from "app/i18n/useLng";
import { getTosMarkdownUrl } from "app/components/KcApp/getTosMarkdownUrl";
import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";
import { 
    useAppConstants, 
    useSelector, 
    useSyncDarkModeWithValueInProfile, 
    useApplyLanguageSelectedAtLogin 
} from "app/interfaceWithLib/hooks";
import { useConstCallback } from "powerhooks";
import { MySecrets } from "app/components/pages/MySecrets";
import { useRoute } from "app/router";
import { Home } from "app/components/pages/Home";
import { FourOhFour }  from "./FourOhFour";
import { assert } from "tsafe/assert";
import { routes } from "app/router";
import { useEffectOnValueChange } from "powerhooks";
import { useDomRect } from "powerhooks";
import { useSplashScreen } from "app/components/shared/SplashScreen";
import { Account } from "app/components/pages/Account";

//Legacy
import { Catalogue } from "js/components/my-lab/catalogue/catalogue-navigation";
import { Catalog } from "app/components/pages/Catalog/Catalog";
import { MyServices } from "js/components/my-services/home";
import { MyService } from "js/components/my-service/home";
import { MyBuckets } from "js/components/mes-fichiers/MyBuckets";
import { NavigationFile } from "js/components/mes-fichiers/navigation/NavigationFile";
import VisiteGuidee from 'js/components/visite-guidee';
import { VisiteGuideeDebut } from "js/components/visite-guidee/visite-guidee-debut.component";
import { CloudShell, useIsCloudShellVisible } from "js/components/cloud-shell/cloud-shell";
import { SharedServices } from "js/components/services/home/services";
import { Trainings } from "js/components/trainings/async-component";


export const logoMaxWidthInPercent = 5;

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "height": "100%",
            "display": "flex",
            "flexDirection": "column",
            "backgroundColor": theme.custom.colors.useCases.surfaces.background,
        },
        "header": {
            "width": "100%",
            "height": 64
        },
        "betweenHeaderAndFooter": {
            "flex": 1,
            "overflow": "hidden",
            "display": "flex"
        },
        "footer": {
            "height": 32
        },

        "leftBar": {
            "height": "100%",
        },
        "main": {
            "flex": 1,
            "height": "100%",
            //TODO: See if scroll delegation works if we put auto here instead of "hidden"
            "overflow": "auto",
            "paddingLeft": theme.spacing(3)
        },
        "generalPaddingRight": {
            "paddingRight": "2%",
        },
        "height100": {
            "height": "100%"
        }
    })
);

export type Props = {
    className?: string;
}

export const App = memo((props: Props) => {

    const { className } = props;

    useSyncDarkModeWithValueInProfile();

    useApplyLanguageSelectedAtLogin();


    const { domRect: { width: rootWidth }, ref: rootRef } = useDomRect();

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffectOnValueChange(
        () => { hideSplashScreen() },
        [rootWidth === 0]
    );

    const isWaiting = useSelector(state=> state.app.waiting);

    useEffectOnValueChange(
        () => {
            if( isWaiting ){
                showSplashScreen({ "enableTransparency": true });
            }else{
                hideSplashScreen();
            }
        },
        [isWaiting]
    );

    const logoMaxWidth = Math.floor(rootWidth * logoMaxWidthInPercent / 100);

    const { classNames } = useClassNames({});

    const route = useRoute();

    const onHeaderLogoClick = useConstCallback(() => routes.home().push());

    const appConstants = useAppConstants();

    const onHeaderAuthClick = useConstCallback(
        () => appConstants.isUserLoggedIn ?
            appConstants.logout({ "redirectToOrigin": true }) :
            appConstants.login()
    );

    const onLeftBarClick = useConstCallback(
        (target: Parameters<LeftBarProps["onClick"]>[0]) => {

            if (target in routes) {
                routes[target]().push();
                return;
            }

            alert(`TODO: missing page ${target}`);

        }
    );

    const { tosHref } = (function useClosure() {

        const { lng } = useLng();
        const tosHref = getTosMarkdownUrl(lng)
        return { tosHref };


    })();

    return (
        <div ref={rootRef} className={cx(classNames.root, className)} >
            <Header
                type="core"
                className={cx(classNames.header, classNames.generalPaddingRight)}
                logoMaxWidth={logoMaxWidth}
                isUserLoggedIn={appConstants.isUserLoggedIn}
                useIsCloudShellVisible={useIsCloudShellVisible}
                onLogoClick={onHeaderLogoClick}
                onAuthClick={onHeaderAuthClick}

            />
            <section className={classNames.betweenHeaderAndFooter}>

                <LeftBar
                    className={classNames.leftBar}
                    collapsedWidth={logoMaxWidth}
                    onClick={onLeftBarClick}
                    currentPage={route.name}
                />

                <main className={classNames.main}>
                    <PageSelector route={route} />
                </main>

            </section>
            <Footer
                className={classNames.footer}
                //NOTE: Defined in ./config-overrides.js
                onyxiaUiVersion={process.env.VERSION!}
                contributeHref={"https://github.com/InseeFrLab/onyxia"}
                tosHref={tosHref}
            />
            <VisiteGuidee />
            {appConstants.isUserLoggedIn && <CloudShell />}

        </div>
    );

});

const PageSelector = (
    props: {
        route: ReturnType<typeof useRoute>;
    }
) => {

    const { route } = props;

    const { classNames } = useClassNames({});

    const appConstants = useAppConstants();

    const legacyRoute = useMemo(
        () => {

            const Page = [
                Catalogue,
                MyServices,
                MyService,
                MyBuckets,
                NavigationFile,
                VisiteGuideeDebut,
                SharedServices,
                Trainings,
            ].find(({ routeGroup }) => routeGroup.has(route));

            if (Page === undefined) {
                return undefined;
            }

            if (
                Page.requireUserLoggedIn &&
                !appConstants.isUserLoggedIn
            ) {

                appConstants.login();

                return null;
            }

            switch (Page) {
                case NavigationFile:
                    assert(Page.routeGroup.has(route));
                    return <Page
                        route={route}
                    />;
                case MyService:
                    assert(Page.routeGroup.has(route));
                    return <Page
                        route={route}
                    />;
                case SharedServices:
                    return <Page
                        serviceSelectionne={false}
                    />;
                case Catalogue:
                case Trainings:
                case MyServices:
                case MyBuckets:
                case VisiteGuideeDebut:
                    return <Page />;
            }

            assert(false, "Not all cases have been dealt with in the above switch");

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [route]
    );



    {

        const Page = Catalog;

        if (Page.routeGroup.has(route)) {

            if (
                Page.requireUserLoggedIn(route) &&
                !appConstants.isUserLoggedIn
            ) {

                appConstants.login();

                return null;

            }

            return (
                <Page
                    route={route}
                    className={cx(
                        classNames.height100,
                        classNames.generalPaddingRight
                    )}
                />
            );

        }

    }

    {

        const Page = Home;

        if (Page.routeGroup.has(route)) {

            if (
                Page.requireUserLoggedIn() &&
                !appConstants.isUserLoggedIn
            ) {

                appConstants.login();

                return null;

            }

            return <Page />;

        }

    }

    {

        const Page = MySecrets;

        if (Page.routeGroup.has(route)) {

            if (
                Page.requireUserLoggedIn() &&
                !appConstants.isUserLoggedIn
            ) {

                appConstants.login();

                return null;

            }

            return (
                <Page
                    route={route}
                    className={classNames.height100}
                />
            );

        }

    }

    {

        const Page = Account;

        if (Page.routeGroup.has(route)) {

            if (
                Page.requireUserLoggedIn() &&
                !appConstants.isUserLoggedIn
            ) {

                appConstants.login();

                return null;

            }

            return (
                <Page
                    route={route}
                    className={classNames.generalPaddingRight}
                />
            );

        }

    }


    if (legacyRoute !== undefined) {
        return legacyRoute;
    }

    return <FourOhFour className={classNames.height100} />;



}