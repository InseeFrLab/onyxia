import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { kcContext as kcLoginThemeContext } from "keycloak-theme/login/kcContext";
import { kcContext as kcAccountThemeContext } from "keycloak-theme/account/kcContext";
import { assert } from "tsafe/assert";

const App = lazy(() => import("ui/App"));
const KcLoginThemeApp = lazy(() => import("keycloak-theme/login/KcApp"));
const KcAccountThemeApp = lazy(() => import("keycloak-theme/account/KcApp"));

createRoot(
    (() => {
        const rootElement = document.getElementById("root");

        assert(rootElement !== null);

        return rootElement;
    })()
).render(
    <Suspense>
        {(() => {
            if (kcLoginThemeContext !== undefined) {
                return <KcLoginThemeApp kcContext={kcLoginThemeContext} />;
            }

            if (kcAccountThemeContext !== undefined) {
                return <KcAccountThemeApp kcContext={kcAccountThemeContext} />;
            }

            return <App />;
        })()}
    </Suspense>
);
