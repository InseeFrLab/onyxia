import { createRoot } from "react-dom/client";
import { RouteProvider } from "./routes";
import { ThemeProvider, splashScreen, createGetViewPortConfig } from "./theme";
import { lazy, Suspense } from "react";
import { kcContext } from "ui/KcApp/kcContext";
import { PortraitModeUnsupported } from "ui/pages/PortraitModeUnsupported";
import { createCoreProvider } from "core";
import { getCreateStoreParams } from "ui/env";
import { injectTransferableEnvsInSearchParams } from "ui/envCarriedOverToKc";
import { injectGlobalStatesInSearchParams } from "powerhooks/useGlobalState";
import { addParamToUrl } from "powerhooks/tools/urlSearchParams";
import { Evt } from "evt";
import "./envCarriedOverToKc";
import { Buffer } from "buffer";
import { evtLang } from "ui/i18n";
//For jwt-simple
(window as any).Buffer = Buffer;

const { getViewPortConfig } = createGetViewPortConfig({ PortraitModeUnsupported });

const App = lazy(() => import("ui/App"));
const KcApp = lazy(() => import("ui/KcApp"));

const { CoreProvider } = createCoreProvider(() =>
    getCreateStoreParams({
        "transformUrlBeforeRedirectToLogin": url =>
            [url]
                .map(injectTransferableEnvsInSearchParams)
                .map(injectGlobalStatesInSearchParams)
                .map(
                    url =>
                        addParamToUrl({
                            url,
                            "name": "ui_locales",
                            "value": evtLang.state
                        }).newUrl
                )[0],
        "evtUserActivity": Evt.merge([
            Evt.from(document, "mousemove"),
            Evt.from(document, "keydown")
        ]).pipe(() => [undefined as void])
    })
);

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
    </Suspense>
);
