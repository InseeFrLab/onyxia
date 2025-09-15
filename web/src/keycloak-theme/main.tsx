/* eslint-disable react-refresh/only-export-components */
import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { assert } from "tsafe/assert";
import { OnyxiaUi, loadThemedFavicon } from "keycloak-theme/login/theme";
import { injectCustomFontFaceIfNotAlreadyDone } from "ui/theme/injectCustomFontFaceIfNotAlreadyDone";

injectCustomFontFaceIfNotAlreadyDone();
loadThemedFavicon();

assert(window.kcContext !== undefined);

const KcLoginThemePage = lazy(() => import("keycloak-theme/login/KcPage"));

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <OnyxiaUi>
            <Suspense>
                <KcLoginThemePage kcContext={window.kcContext} />
            </Suspense>
        </OnyxiaUi>
    </StrictMode>
);
