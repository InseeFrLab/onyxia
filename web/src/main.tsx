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

    import("main.lazy");
})();
