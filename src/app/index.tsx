import React, { useEffect } from "react";
import * as reactDom from "react-dom";
import { getValidatedEnv } from "./validatedEnv";

import type { OidcClientConfig, SecretsManagerClientConfig, OnyxiaApiClientConfig } from "lib/setup";
import { id } from "evt/tools/typeSafety/id";
import { I18nProvider } from "./i18n/I18nProvider";
import { RouteProvider } from "./router";
import { StoreProvider } from "app/interfaceWithLib/StoreProvider";
import type { Props as StoreProviderProps } from "app/interfaceWithLib/StoreProvider";
import { themeProviderFactory } from "app/theme/ThemeProvider";
import { useIsDarkModeEnabled } from "app/theme/useIsDarkModeEnabled";
import { SplashScreenProvider } from "app/components/shared/SplashScreen";
import { App } from "app/components/App";
import { PublicIpProvider, getPublicIp } from "app/tools/usePublicIp";
import { useLng } from "app/i18n/useLng";
import {
    kcContext as realKcContext,
    kcContextMocks
} from "keycloakify";
import { useConstCallback } from "powerhooks";
import { KcApp } from "app/components/KcApp";


const { ThemeProvider } = themeProviderFactory(
    { "isReactStrictModeEnabled": process.env.NODE_ENV !== "production" }
);

Object.defineProperty(
    kcContextMocks.kcRegisterContext.realm,
    "registrationEmailAsUsername",
    { "value": false }
);

const kcContext = realKcContext ?? (
    false /* Set to true to test the login pages outside of Keycloak */
        ? kcContextMocks.kcLoginContext /* Change to .kcRegisterContext for example */
        :
        undefined
);

function Root() {

    const { isDarkModeEnabled } = useIsDarkModeEnabled();
    const { lng } = useLng();

    //Pre fetch so it's not blocking
    useEffect(() => { getPublicIp() }, []);

    const getStoreInitializationParams = useConstCallback<StoreProviderProps["getStoreInitializationParams"]>(
        () => {

            const env = getValidatedEnv();

            return {
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
                                "preferred_username": "jdoe",
                                "family_name": "Doe",
                                "given_name": "John",
                                "groups": [],
                                "locale": "fr"
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
            };

        }
    );

    return (
        <React.StrictMode>
            <I18nProvider lng={lng}>
                <RouteProvider>
                    <ThemeProvider
                        isDarkModeEnabled={isDarkModeEnabled}
                        doEnableZoom={true}
                    >
                        <SplashScreenProvider>
                            {kcContext !== undefined ?
                                <KcApp kcContext={kcContext} /> :
                                <StoreProvider getStoreInitializationParams={getStoreInitializationParams}>
                                    <PublicIpProvider>
                                        <App />
                                    </PublicIpProvider>
                                </StoreProvider>
                            }
                        </SplashScreenProvider>
                    </ThemeProvider>
                </RouteProvider>
            </I18nProvider>
        </React.StrictMode>
    );

}

reactDom.render(
    <Root />,
    document.getElementById("root")
);
