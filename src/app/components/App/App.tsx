

import { useMemo, memo } from "react";
import { Header } from "./Header";
import type { Props as HeaderProps } from "./Header";
import { LeftBar } from "./LeftBar";
import type { Props as LeftBarProps } from "./LeftBar";
import { Footer } from "./Footer";
import { createUseClassNames } from "app/theme/useClassNames";
import { css, cx } from "jss-emotion";
import { useAppConstants, useSelector } from "app/lib/hooks";
import { useConstCallback } from "powerhooks";
import { MySecrets } from "app/components/pages/MySecrets";
import { useRoute } from "app/router";
import { Home } from "app/components/pages/Home";
import { FourOhFour }  from "./FourOhFour";
import { assert } from "evt/tools/typeSafety/assert";
import { routes } from "app/router";
import { useIsDarkModeEnabled } from "app/lib/hooks";
import { useWindowInnerSize } from "powerhooks";
import { useValueChangeEffect } from "powerhooks";
import { useDomRect } from "powerhooks";
import { useSplashScreen } from "app/components/shared/SplashScreen";

//Legacy
import { Catalogue } from "js/components/my-lab/catalogue/catalogue-navigation";
import { MyServices } from "js/components/my-services/home";
import { MyService } from "js/components/my-service/home";
import { MonCompte } from "js/components/mon-compte/mon-compte.component";
import { MyBuckets } from "js/components/mes-fichiers/MyBuckets";
import { NavigationFile } from "js/components/mes-fichiers/navigation/NavigationFile";
import VisiteGuidee from 'js/components/visite-guidee';
import { VisiteGuideeDebut } from "js/components/visite-guidee/visite-guidee-debut.component";
import { CloudShell, useIsCloudShellVisible } from "js/components/cloud-shell/cloud-shell";
import { SharedServices } from "js/components/services/home/services";
import { ServiceDetails } from "js/components/services/details/details-service-async";
import { Trainings } from "js/components/trainings/async-component";

const logoMaxWidthInPercent = 5;

const { useClassNames } = createUseClassNames<{ windowInnerWidth: number; aspectRatio: number; windowInnerHeight: number; }>()(
    (theme) => ({
        "root": {
            "height": "100%",
            "display": "flex",
            "flexDirection": "column",
            "backgroundColor": theme.custom.colors.useCases.surfaces.background,
        },

        "header": {
            "width": "100%",
            "paddingRight": "2%",
            "height": 64
        },
        "betweenHeaderAndFooter": {
            "flex": 1,
            "overflow": "hidden",
            "display": "flex"
        },
        "footer": {
            "height": 34
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
        }

    })
);

const classNameFillBlock= css({ "height": "100%" });

export type Props = {
    className?: string;
}

export const App = memo((props: Props) => {

    const { className } = props;

    const appConstants = useAppConstants();

    const { domRect: { width: rootWidth }, ref: rootRef } = useDomRect();

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useValueChangeEffect(
        () => hideSplashScreen(),
        [rootWidth === 0]
    );

    const isWaiting = useSelector(state=> state.app.waiting);

    useValueChangeEffect(
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

    const { windowInnerWidth, windowInnerHeight } = useWindowInnerSize();

    const { classNames } = useClassNames({
        windowInnerWidth,
        "aspectRatio": windowInnerWidth / windowInnerHeight,
        windowInnerHeight
    });


    const route = useRoute();

    const Page = useMemo(
        () => {

            const Page = [
                Home, 
                MySecrets,
                Catalogue,
                MyServices,
                MyService,
                MonCompte,
                MyBuckets,
                NavigationFile,
                VisiteGuideeDebut,
                SharedServices,
                Trainings,
                ServiceDetails
            ].find(({ routeGroup }) => routeGroup.has(route));

            if (Page === undefined) {
                return () => <FourOhFour className={classNameFillBlock} />;
            }

            if (Page.requireUserLoggedIn && !appConstants.isUserLoggedIn) {

                appConstants.login();

                return () => null;
            }

            switch (Page) {
                case MySecrets:
                    assert(Page.routeGroup.has(route));
                    return () => <Page
                        route={route}
                        className={classNameFillBlock}
                    />;
                case NavigationFile:
                    assert(Page.routeGroup.has(route));
                    return () => <Page
                        route={route}
                    />;
                case MyService:
                    assert(Page.routeGroup.has(route));
                    return () => <Page
                        route={route}
                    />;
                case SharedServices:
                    return ()=> <Page
                        serviceSelectionne={false}
                    />;
                case Trainings:
                case Home:
                case MyServices:
                case MonCompte:
                case MyBuckets:
                case Catalogue:
                case VisiteGuideeDebut:
                case ServiceDetails:
                    return ()=> <Page/>;
            }

            assert(false, "Not all cases have been dealt with in the above switch");

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [route.name]
    );

    const onHeaderClick = useConstCallback(
        (target: Parameters<HeaderProps["onClick"]>[0]) => {
            switch (target) {
                case "logo": routes.home().push(); return;
                case "auth button":

                    if (appConstants.isUserLoggedIn) {
                        appConstants.logout();
                    } else {
                        appConstants.login();
                    }

                    return;
            }
        }
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




    return (
        <div ref={rootRef} className={cx(classNames.root, className)} >
            <Header
                className={classNames.header}
                logoMaxWidth={logoMaxWidth}
                isUserLoggedIn={appConstants.isUserLoggedIn}
                useIsDarkModeEnabled={useIsDarkModeEnabled}
                useIsCloudShellVisible={useIsCloudShellVisible}
                onClick={onHeaderClick}
            />
            <section className={classNames.betweenHeaderAndFooter}>

                <LeftBar
                    className={classNames.leftBar}
                    collapsedWidth={logoMaxWidth}
                    onClick={onLeftBarClick}
                    currentPage={route.name}
                />

                <main className={classNames.main}>
                    <Page />
                </main>

            </section>
            <Footer className={classNames.footer} />
            <VisiteGuidee />
            {appConstants.isUserLoggedIn && <CloudShell />}

        </div>
    );

});
