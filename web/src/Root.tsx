import { Suspense, lazy, useEffect } from "react";
import { useSplashScreen } from "onyxia-ui";
import {
    OnyxiaUi,
    injectCustomFontFaceIfNotAlreadyDone,
    loadThemedFavicon
} from "ui/theme";

injectCustomFontFaceIfNotAlreadyDone();
loadThemedFavicon();

const App = lazy(() => import("ui/App"));

export function Root() {
    return (
        <OnyxiaUi>
            <Suspense fallback={<SplashScreen />}>
                <AppWrapper />
            </Suspense>
        </OnyxiaUi>
    );
}

function AppWrapper() {
    const { hideRootSplashScreen } = useSplashScreen();

    useEffect(() => {
        hideRootSplashScreen();
    }, []);

    return <App />;
}

function SplashScreen() {
    const { showSplashScreen, hideSplashScreen, hideRootSplashScreen } =
        useSplashScreen();

    useEffect(() => {
        hideRootSplashScreen();
        showSplashScreen({ enableTransparency: false });

        return () => {
            hideSplashScreen();
        };
    }, []);

    return null;
}
