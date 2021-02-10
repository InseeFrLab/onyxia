

import { useMemo, memo } from "react";
import { Header } from "./Header";
import type { Props as HeaderProps } from "./Header";
import { LeftBar } from "./LeftBar";
import type { Props as LeftBarProps } from "./LeftBar";
//import { Footer } from "./Footer";
import { createUseClassNames, css, cx } from "app/theme/useClassNames";
import { useAppConstants } from "app/lib/hooks";
import { useConstCallback } from "app/tools/hooks/useConstCallback";
import { useDOMRect } from "app/tools/hooks/useDOMRect";
import { MySecrets } from "app/components/pages/MySecrets";
import { useRoute } from "app/router";
import { Home } from "app/components/pages/Home";
import { FourOhFour }  from "./FourOhFour";
import { assert } from "evt/tools/typeSafety/assert";
import { routes } from "app/router";
import { useIsDarkModeEnabled } from "app/lib/hooks";
import { useWindowInnerSize } from "app/tools/hooks/useWindowInnerSize";
import { useValueChangeEffect } from "app/tools/hooks/useValueChangeEffect";
import { useSplashScreen } from "app/components/shared/SplashScreen";
import { useSelector } from "app/lib/hooks";

//Legacy
import { Catalogue } from "js/components/my-lab/catalogue/catalogue-navigation";
import { MyServices } from "js/components/my-services/home";

const logoMaxWidthInPercent = 5;

const { useClassNames } = createUseClassNames<{ windowInnerWidth: number; aspectRatio: number; windowInnerHeight: number; }>()(
    ({theme}) => ({
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

    const { domRect: { width: rootWidth }, ref: rootRef } = useDOMRect();

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
                MyServices
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
                case Catalogue:
                    assert(Page.routeGroup.has(route));
                    return () => <Page route={route} />;
                case Home:
                case MyServices:
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
                case "cloudShell": alert("TODO: Report cloudshell could shell"); return;
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
                routes[target as keyof typeof routes]().push();
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
            {/*<Footer className={classNames.footer} />*/}

        </div>
    );

});
