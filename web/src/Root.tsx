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
    const { hideRootSplashScreen } = useSplashScreen();

    useEffect(() => {
        hideRootSplashScreen();
    }, []);

    return (
        <OnyxiaUi>
            <Suspense fallback={<SplashScreen />}>
                <App />
            </Suspense>
        </OnyxiaUi>
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
