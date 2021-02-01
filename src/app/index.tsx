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
import { App } from "app/components/App";
import { css } from "app/theme/useClassNames";

/*
import App_ from "js/components/app.container";
const App: any = App_;
*/


const { ThemeProvider } = themeProviderFactory(
    { "isReactStrictModeEnabled": process.env.NODE_ENV !== "production" }
);

function Root() {

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

    return (
        <React.StrictMode>
            <I18nProvider lng="browser default">
                <RouteProvider>
                    <ThemeProvider isDarkModeEnabled={isDarkModeEnabled}>
                        <StoreProvider
                            createStoreParams={createStoreParams}
                            splashScreen={
                                <SplashScreen
                                    className={css({
                                        "width": "100vw",
                                        "height": "100vh"
                                    })}
                                />
                            }
                        >
                            <App />
                        </StoreProvider>
                    </ThemeProvider>
                </RouteProvider>
            </I18nProvider>
        </React.StrictMode>
    );

};

reactDom.render(
    <Root />,
    document.getElementById("root")
);
