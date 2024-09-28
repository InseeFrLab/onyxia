import { lazy, Suspense } from "react";
import { targetWindowInnerWidth } from "ui/theme/targetWindowInnerWidth";
import { enableScreenScaler } from "screen-scaler/react";

const AppLazy = lazy(() => import("./App"));

// NOTE: This must happen very early-on, if overwrite some DOM APIs.
const { ScreenScalerOutOfRangeFallbackProvider } = enableScreenScaler({
    "rootDivId": "root",
    "targetWindowInnerWidth": ({ zoomFactor, isPortraitOrientation }) =>
        isPortraitOrientation ? undefined : targetWindowInnerWidth * zoomFactor
});

export default function App() {
    return (
        <Suspense>
            <AppLazy
                ScreenScalerOutOfRangeFallbackProvider={
                    ScreenScalerOutOfRangeFallbackProvider
                }
            />
        </Suspense>
    );
}
