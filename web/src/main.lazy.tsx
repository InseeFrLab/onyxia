/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { enableScreenScaler } from "screen-scaler";
import {
    OnyxiaUi,
    targetWindowInnerWidth,
    loadThemedFavicon,
    injectCustomFontFaceIfNotAlreadyDone
} from "ui/theme";
import { Evt } from "evt";
import { useRerenderOnStateChange } from "evt/hooks";

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

const evtIsPortraitOrientation = Evt.create<boolean | undefined>(undefined);

if (import.meta.env.SCREEN_SCALER !== "false") {
    enableScreenScaler({
        rootDivId: "root",
        targetWindowInnerWidth: ({ zoomFactor, isPortraitOrientation }) => {
            evtIsPortraitOrientation.state = isPortraitOrientation;

            return isPortraitOrientation
                ? undefined
                : targetWindowInnerWidth * zoomFactor;
        }
    });
}

const App = lazy(() => import("ui/App"));

function Root() {
    useRerenderOnStateChange(evtIsPortraitOrientation);

    return (
        <Suspense>
            <App isPortraitOrientation={evtIsPortraitOrientation.state} />
        </Suspense>
    );
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <OnyxiaUi>
            <Root />
        </OnyxiaUi>
    </StrictMode>
);
