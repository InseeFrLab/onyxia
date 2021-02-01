

import { useMemo, useEffect, memo } from "react";
import { Header } from "./Header";
import type { Props as HeaderProps } from "./Header";
import { LeftBar } from "./LeftBar";
import type { Props as LeftBarProps } from "./LeftBar";
import { Footer } from "./Footer";
import { createUseClassNames, css } from "app/theme/useClassNames";
import { useAppConstants } from "app/lib/hooks";
import { useConstCallback } from "app/tools/hooks/useConstCallback";
import { useDOMRect } from "app/tools/hooks/useDOMRect";
import { MySecrets } from "app/components/pages/MySecrets";
import { SplashScreen as UnsizedSplashScreen } from "app/components/shared/SplashScreen";
import { useRoute } from "app/router";
import { Home } from "app/components/pages/Home";
import { FourOhFour }  from "./FourOhFour";
import { assert } from "evt/tools/typeSafety/assert";
import { routes } from "app/router";
import { useIsDarkModeEnabled } from "app/lib/hooks";




const logoMaxWidthInPercent = 4;

const { useClassNames } = createUseClassNames()(
    () => ({
        "root": {
            "height": "100vh",
            "display": "flex",
            "flexDirection": "column"
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
            "overflow": "auto"
        },
        "main": {
            "flex": 1,
            "height": "100%",
            //TODO: See if scroll delegation works if we put auto here instead of "hidden"
            "overflow": "auto"
        }

    })
);

const classNameFillBlock= css({ "height": "100%" });

const SplashScreen = memo(() => <UnsizedSplashScreen className={classNameFillBlock} />);


export const App = memo(() => {


    const appConstants = useAppConstants();

    const { domRect: { width: rootWidth }, ref: rootRef } = useDOMRect();

    const { classNames } = useClassNames({});




    const route = useRoute();

    const Page = useMemo(
        () => {

            const Page = [Home, MySecrets].find(({ routeGroup }) => routeGroup.has(route));

            if (Page === undefined) {
                return () => <FourOhFour className={classNameFillBlock} />;
            }

            if (Page.requireUserLoggedIn && !appConstants.isUserLoggedIn) {
                return SplashScreen;
            }

            switch (Page) {
                case MySecrets:
                    assert(Page.routeGroup.has(route));
                    return () => <Page
                        splashScreen={<SplashScreen />}
                        route={route}
                        className={classNameFillBlock}
                    />;
                case Home:
                    assert(Page.routeGroup.has(route));
                    return () => <Page
                        splashScreen={<SplashScreen />}
                        route={route}
                    />;
            }

            assert(false, "Not all cases have been dealt with in the above switch");

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [route.name]
    );

    useEffect(
        ()=>{

        if( Page !== SplashScreen ){
            return;
        }

        assert(!appConstants.isUserLoggedIn);

        appConstants.login();

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [Page]
    );

    const onHeaderClick = useConstCallback(
        (target: Parameters<HeaderProps["onClick"]>[0]) => {
            switch (target) {
                case "logo": routes.home().push(); return;
                case "cloudShell": alert("TODO: Report cloudshell could shell"); return;
                case "auth button": 

                if( appConstants.isUserLoggedIn ){
                    appConstants.logout();
                }else{
                    appConstants.login();
                }

                return;
            }
        }
    );

    const onLeftBarClick = useConstCallback(
        (target: Parameters<LeftBarProps["onClick"]>[0]) => {

            if( target in routes ){
                routes[target as keyof typeof routes]().push();
                return;
            }

            alert("TODO: Report missing pages");

            //TODO
        }
    );


    const logoMaxWidth = Math.floor(rootWidth * logoMaxWidthInPercent / 100);

    return (
        <div ref={rootRef} className={classNames.root} >
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
                />

                <main className={classNames.main}>
                    <Page />
                </main>

            </section>
            <Footer className={classNames.footer} />

        </div>
    );

});
