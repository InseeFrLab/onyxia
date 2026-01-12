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

    const [{ oidcEarlyInit }, { browserRuntimeFreeze }] = await Promise.all([
        import("oidc-spa/entrypoint"),
        import("oidc-spa/browser-runtime-freeze")
    ]);

    const { shouldLoadApp } = oidcEarlyInit({
        BASE_URL: import.meta.env.BASE_URL,
        securityDefenses: {
            ...browserRuntimeFreeze()
        }
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
