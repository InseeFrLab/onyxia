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

    const [{ oidcEarlyInit }, { browserRuntimeFreeze }, { DPoP }] = await Promise.all([
        import("oidc-spa/entrypoint"),
        import("oidc-spa/browser-runtime-freeze"),
        import.meta.env.OIDC_DISABLE_DPOP === "true"
            ? { DPoP: undefined }
            : import("oidc-spa/DPoP")
    ]);

    const { shouldLoadApp } = oidcEarlyInit({
        BASE_URL: import.meta.env.BASE_URL,
        securityDefenses: {
            ...browserRuntimeFreeze(),
            ...DPoP?.({ mode: "auto" })
        },
        sessionRestorationMethod: (() => {
            switch (import.meta.env.OIDC_SESSION_RESTORATION_METHOD) {
                case "iframe":
                    return "iframe";
                case "full page redirect":
                    return "full page redirect";
                case "auto":
                default:
                    return undefined;
            }
        })()
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

        const portraitBreakpoint = (() => {
            const raw = import.meta.env.SCREEN_SCALER_PORTRAIT_BREAKPOINT;
            if (raw === "" || raw === undefined) return undefined;
            const n = parseInt(raw, 10);
            if (isNaN(n)) return undefined;
            return n;
        })();

        enableScreenScaler({
            rootDivId: "root",
            getTargetWindowInnerWidth: ({
                zoomFactor,
                isPortraitOrientation,
                actualWindowInnerWidth
            }) => {
                if (isPortraitOrientation) {
                    if (
                        portraitBreakpoint === undefined ||
                        actualWindowInnerWidth < portraitBreakpoint
                    ) {
                        return undefined;
                    }
                }
                return targetWindowInnerWidth * zoomFactor;
            }
        });
    }

    import("main.lazy");
})();
