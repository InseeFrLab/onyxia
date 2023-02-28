import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { kcContext } from "ui/keycloak-theme/kcContext";
import { ThemeProvider, splashScreen, createGetViewPortConfig } from "./theme";
import "./envCarriedOverToKc";
import { PortraitModeUnsupported } from "ui/pages/PortraitModeUnsupported";

const App = lazy(() => import("ui/App"));
const KcApp = lazy(() => import("ui/keycloak-theme/KcApp"));

const { getViewPortConfig } = createGetViewPortConfig({ PortraitModeUnsupported });

createRoot(document.getElementById("root")!).render(
    <ThemeProvider
        getViewPortConfig={kcContext !== undefined ? undefined : getViewPortConfig}
        splashScreen={splashScreen}
    >
        <Suspense>
            {kcContext !== undefined ? <KcApp kcContext={kcContext} /> : <App />}
        </Suspense>
    </ThemeProvider>
);
