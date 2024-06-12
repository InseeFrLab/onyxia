/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { assert } from "tsafe/assert";
/*
import { getKcContextMock } from "keycloak-theme/login/getKcContextMock";

if (import.meta.env.DEV) {
    window.kcContext = getKcContextMock({
        pageId: "info.ftl",
        overrides: {}
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

const App = lazy(() => import("ui/App"));
const KcLoginThemePage = lazy(() => import("keycloak-theme/login/KcPages"));

createRoot(
    (() => {
        const rootElement = document.getElementById("root");

        assert(rootElement !== null);

        return rootElement;
    })()
).render(
    <Suspense>
        {(() => {
            if (window.kcContext !== undefined) {
                // We want to do that as soon as possible to prevent Flash Of Unstyled Content (FOUC)
                import("ui/theme/injectCustomFontFaceIfNotAlreadyDone").then(
                    ({ injectCustomFontFaceIfNotAlreadyDone }) =>
                        injectCustomFontFaceIfNotAlreadyDone()
                );

                return <KcLoginThemePage kcContext={window.kcContext} />;
            }
            return <App />;
        })()}
    </Suspense>
);
