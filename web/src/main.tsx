/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { assert } from "tsafe/assert";
const App = lazy(() => import("ui/App"));
const AppWithoutScreenScaler = lazy(() => import("ui/App/App"));
const KcLoginThemePage = lazy(() => import("keycloak-theme/login/KcPage"));

/*
import { getKcContextMock } from "keycloak-theme/login/getKcContextMock";

if (import.meta.env.DEV) {
    window.kcContext = getKcContextMock({
        //pageId: "login-idp-link-confirm.ftl",
        //pageId: "login-update-password.ftl",
        //pageId: "login-reset-password.ftl",
        pageId: "login.ftl",
        overrides: {

        }
    });
}
*/

{
    const version = import.meta.env.WEB_VERSION;

    console.log(
        [
            `Docker image inseefrlab/onyxia-web version: ${version}`,
            `https://github.com/InseeFrLab/onyxia/tree/web-v${version}/web`
        ].join("\n")
    );
}

const rootElement = document.getElementById("root");

assert(rootElement !== null);

createRoot(rootElement).render(
    <Suspense>
        {window.kcContext !== undefined ? (
            <KcLoginThemePage kcContext={window.kcContext} />
        ) : import.meta.env.SCREEN_SCALER === "true" ? (
            <App />
        ) : (
            <AppWithoutScreenScaler />
        )}
    </Suspense>
);
