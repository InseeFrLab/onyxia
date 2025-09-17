/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
    OnyxiaUi,
    loadThemedFavicon,
    injectCustomFontFaceIfNotAlreadyDone
} from "ui/theme";

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

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <OnyxiaUi>
            <Suspense>
                <App />
            </Suspense>
        </OnyxiaUi>
    </StrictMode>
);
