/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "ui/App";
const AppWithoutScreenScaler = lazy(() => import("ui/App/App"));

{
    const version = import.meta.env.WEB_VERSION;

    console.log(
        [
            `Docker image inseefrlab/onyxia-web version: ${version}`,
            `https://github.com/InseeFrLab/onyxia/tree/web-v${version}/web`
        ].join("\n")
    );
}

createRoot(document.getElementById("root")!).render(
    import.meta.env.SCREEN_SCALER === "true" ? (
        /** Default case */
        <App />
    ) : (
        /** For debugging cases that might be related to the screen scaler */
        <Suspense>
            <AppWithoutScreenScaler />
        </Suspense>
    )
);
