import React, { useState } from "react";
import * as reactDom from "react-dom";
import { getEnv } from "./env";

import type { OidcClientConfig, SecretsManagerClientConfig, OnyxiaApiClientConfig } from "lib/setup";
import { id } from "evt/tools/typeSafety/id";
import { I18nProvider } from "./i18n/I18nProvider";
import { RouteProvider } from "./router";
import { StoreProvider } from "app/lib/StoreProvider";
import type { Props as StoreProviderProps } from "app/lib/StoreProvider";
import { themeProviderFactory } from "app/theme/ThemeProvider";
import { useIsDarkModeEnabled } from "app/tools/hooks/useIsDarkModeEnabled";
import { SplashScreen } from "app/components/shared/SplashScreen";
import type { Props as SplashScreenProps } from "app/components/shared/SplashScreen";
import { App } from "app/components/App";
import { css } from "app/theme/useClassNames";
import { useLng } from "app/i18n/useLng";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { useConstCallback } from "app/tools/hooks/useConstCallback";
import { useDOMRect } from "app/tools/hooks/useDOMRect";

/*
import App_ from "js/components/app.container";
const App: any = App_;
*/


const { ThemeProvider } = themeProviderFactory(
    { "isReactStrictModeEnabled": process.env.NODE_ENV !== "production" }
);

function Root() {

    const { isDarkModeEnabled } = useIsDarkModeEnabled();
    const { lng } = useLng();

    return (
        <React.StrictMode>
            <I18nProvider lng={lng}>
                <RouteProvider>
                    <ThemeProvider isDarkModeEnabled={isDarkModeEnabled}>
                        <InnerRoot />
                    </ThemeProvider>
                </RouteProvider>
            </I18nProvider>
        </React.StrictMode>
    );

};

/** We need to be inside the theme provider to be able to use useDOMRect */
function InnerRoot() {


    const { isDarkModeEnabled } = useIsDarkModeEnabled();

    const [createStoreParams] = useState(() => {

        const env = getEnv();

        return id<StoreProviderProps["createStoreParams"]>({
            "isColorSchemeDarkEnabledByDefalut": isDarkModeEnabled,
            "oidcClientConfig":
                env.AUTHENTICATION.TYPE === "oidc" ?
                    id<OidcClientConfig.Keycloak>({
                        "implementation": "KEYCLOAK",
                        "keycloakConfig": env.AUTHENTICATION.OIDC
                    }) :
                    id<OidcClientConfig.Phony>({
                        "implementation": "PHONY",
                        "tokenValidityDurationMs": Infinity,
                        "parsedJwt": {
                            "email": "john.doe@insee.fr",
                            "preferred_username": "doej"
                        }
                    }),
            "secretsManagerClientConfig": id<SecretsManagerClientConfig.Vault>({
                "implementation": "VAULT",
                "baseUri": env.VAULT.BASE_URI,
                "engine": env.VAULT.ENGINE,
                "role": env.VAULT.ROLE
            }),
            "onyxiaApiClientConfig": id<OnyxiaApiClientConfig.Official>({
                "implementation": "OFFICIAL",
                "baseUrl": env.API.BASE_URL ?? (() => {

                    const { protocol, host } = window.location;

                    return `${protocol}//${host}/api`;

                })()
            })
        });

    });

    const { ref, domRect: { width, height } } = useDOMRect();

    const [evtSplashScreenAction] = useState(() => Evt.create<UnpackEvt<SplashScreenProps["evtAction"]>>());

    //const [appVisibility, setAppVisibility] = useState<"visible" |"hidden">("hidden");

    const onReady = useConstCallback(
        () => evtSplashScreenAction.post("START FADING OUT")
    );

    return (
        <div ref={ref} className={css({ "height": "100%" })}>
            <SplashScreen
                className={css({ width, "position": "absolute", height, "zIndex": 1000 })}
                evtAction={evtSplashScreenAction}
            />
            <StoreProvider createStoreParams={createStoreParams} >
                <App onReady={onReady} className={css({ "zIndex": 0 })} />
            </StoreProvider>
        </div>
    );

}


reactDom.render(
    <Root />,
    document.getElementById("root")
);
