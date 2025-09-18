/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy, StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
    OnyxiaUi,
    loadThemedFavicon,
    injectCustomFontFaceIfNotAlreadyDone
} from "ui/theme";
import { useSplashScreen } from "onyxia-ui";

loadThemedFavicon();
// NOTE: We do that only to showcase the app with an other font with the URL.
injectCustomFontFaceIfNotAlreadyDone();

{
    const version = import.meta.env.WEB_VERSION;

    console.log(
        [
            `Docker image inseefrlab/onyxia-web version: ${version}`,
            `https://github.com/InseeFrLab/onyxia/tree/web-v${version}/web`
        ].join("\n")
    );
}

const App = lazy(() => import("ui/App"));

function Root() {
    const { hideRootSplashScreen } = useSplashScreen();

    useEffect(() => {
        hideRootSplashScreen();
    }, []);

    return (
        <Suspense fallback={<SplashScreen />}>
            <App />
        </Suspense>
    );
}

function SplashScreen() {
    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        showSplashScreen({ enableTransparency: false });

        return () => {
            hideSplashScreen();
        };
    }, []);

    return null;
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <OnyxiaUi>
            <Root />
        </OnyxiaUi>
    </StrictMode>
);
