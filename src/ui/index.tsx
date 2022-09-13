import { createRoot } from "react-dom/client";
import { RouteProvider } from "./routes";
import { CoreProvider } from "ui/coreApi/CoreProvider";
import { ThemeProvider, splashScreen, createGetViewPortConfig } from "./theme";
import { lazy, Suspense } from "react";
import { kcContext } from "./components/KcApp/kcContext";
import { PortraitModeUnsupported } from "ui/components/pages/PortraitModeUnsupported";
import "./envCarriedOverToKc";
import { Buffer } from "buffer";
//For jwt-simple
(window as any).Buffer = Buffer;

const { getViewPortConfig } = createGetViewPortConfig({ PortraitModeUnsupported });

const App = lazy(() => import("./components/App"));
const KcApp = lazy(() => import("./components/KcApp"));

createRoot(document.getElementById("root")!).render(
    <Suspense>
        <RouteProvider>
            <ThemeProvider
                getViewPortConfig={
                    kcContext !== undefined ? undefined : getViewPortConfig
                }
                splashScreen={splashScreen}
            >
                {kcContext !== undefined ? (
                    <KcApp kcContext={kcContext} />
                ) : (
                    <CoreProvider>
                        <App />
                    </CoreProvider>
                )}
            </ThemeProvider>
        </RouteProvider>
    </Suspense>,
);
