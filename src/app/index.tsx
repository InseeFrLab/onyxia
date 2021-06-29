import { StrictMode } from "react";
import * as reactDom from "react-dom";
import { I18nProvider } from "./i18n/I18nProvider";
import { RouteProvider } from "./routes/router";
import { createStoreProvider } from "app/interfaceWithLib/StoreProvider";
import { ThemeProvider } from "./theme";
import { SplashScreenProvider } from "onyxia-ui";
import { App } from "app/components/App";
import { KcApp, kcContext } from "app/components/KcApp";
import { ReactComponent as OnyxiaLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { PortraitModeUnsupported } from "app/components/pages/PortraitModeUnsupported";
import { useWindowInnerSize } from "powerhooks";
import { breakpointsValues } from "onyxia-ui";

const { StoreProvider } = createStoreProvider({ "doMock": false });

function Root() {

    const { isLandscapeOrientation, windowInnerWidth } = useWindowInnerSize();

    const enableZoomProvider =
        kcContext === undefined ||
        (
            windowInnerWidth < breakpointsValues["lg"] &&
            isLandscapeOrientation
        );

    return (
        <StrictMode>
            <I18nProvider>
                <RouteProvider>
                    <ThemeProvider
                        zoomProviderReferenceWidth={enableZoomProvider ? 1920 : undefined}
                        portraitModeUnsupportedMessage={<PortraitModeUnsupported />}
                    >
                        <SplashScreenProvider Logo={OnyxiaLogoSvg}>
                            {kcContext !== undefined ?
                                <KcApp kcContext={kcContext} /> :
                                <StoreProvider>
                                    <App />
                                </StoreProvider>
                            }
                        </SplashScreenProvider>
                    </ThemeProvider>
                </RouteProvider>
            </I18nProvider>
        </StrictMode>
    );

}


reactDom.render(
    <Root />,
    document.getElementById("root")
);
