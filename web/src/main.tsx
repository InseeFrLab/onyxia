import { handleOidcCallback } from "oidc-spa/handleOidcCallback";

(async () => {
    // NOTE: This is just an optimization to speedup the silent SSO.
    if (window.kcContext === undefined) {
        const { isHandled } = handleOidcCallback();
        if (isHandled) {
            return;
        }
    }

    const [{ lazy, Suspense }, { createRoot }] = await Promise.all([
        import("react"),
        import("react-dom/client")
    ]);

    const App = lazy(() => import("ui/App"));
    const AppWithoutScreenScaler = lazy(() => import("ui/App/App"));
    const KcLoginThemePage = lazy(() => import("keycloak-theme/login/KcPage"));

    {
        const version = import.meta.env.WEB_VERSION;

        console.log(
            [
                `Docker image inseefrlab/onyxia-web version: ${version}`,
                `https://github.com/InseeFrLab/onyxia/tree/web-v${version}/web`
            ].join("\n")
        );
    }

    /*
    const { getKcContextMock } = await import("keycloak-theme/login/getKcContextMock");

    if (import.meta.env.DEV) {
        window.kcContext = getKcContextMock({
            //pageId: "login-idp-link-confirm.ftl",
            //pageId: "login-update-password.ftl",
            //pageId: "login-reset-password.ftl",
            pageId: "login.ftl",
            overrides: {}
        });
    }
    */

    createRoot(document.getElementById("root")!).render(
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
})();
