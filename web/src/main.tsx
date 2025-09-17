/*
import { getKcContextMock } from "keycloak-theme/login/getKcContextMock";

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

(async () => {
    if (window.kcContext !== undefined) {
        import("keycloak-theme/main");
        return;
    }

    const { oidcEarlyInit } = await import("oidc-spa/entrypoint");

    const { shouldLoadApp } = oidcEarlyInit({
        freezeFetch: true,
        freezeXMLHttpRequest: true
    });

    if (!shouldLoadApp) {
        return;
    }

    enable_screen_scaler: {
        if (import.meta.env.SCREEN_SCALER === "false") {
            break enable_screen_scaler;
        }

        const [{ enableScreenScaler }, { targetWindowInnerWidth }] = await Promise.all([
            import("screen-scaler"),
            import("ui/theme/targetWindowInnerWidth")
        ]);

        enableScreenScaler({
            rootDivId: "root",
            getTargetWindowInnerWidth: ({ zoomFactor, isPortraitOrientation }) =>
                isPortraitOrientation ? undefined : targetWindowInnerWidth * zoomFactor
        });
    }

    import("main.lazy");
})();
