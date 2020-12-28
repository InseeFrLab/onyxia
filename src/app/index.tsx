import React, { useState } from "react";
import * as reactDom from "react-dom";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import JavascriptTimeAgo from 'javascript-time-ago';
import fr from 'javascript-time-ago/locale/fr';
import { getEnv } from "../js/env";

import type { OidcClientConfig, SecretsManagerClientConfig, OnyxiaApiClientConfig } from "lib/setup";
import { id } from "evt/tools/typeSafety/id";
import { I18nProvider } from "./i18n/I18nProvider";
import { getIsOsPreferredColorSchemeDark } from "app/utils/getIsOsPreferredColorSchemeDark";

import { StoreProvider } from "app/lib/StoreProvider";
import type { Props as StoreProviderProps } from "app/lib/StoreProvider";

import App_ from "js/components/app.container";
const App: any = App_;

JavascriptTimeAgo.locale(fr);

function Root() {

    const [createStoreParams] = useState(() => {

        const env = getEnv();

        return id<StoreProviderProps["createStoreParams"]>({
            "isOsPrefersColorSchemeDark": getIsOsPreferredColorSchemeDark(),
            "oidcClientConfig":
                env.AUTHENTICATION.TYPE === "oidc" ?
                    id<OidcClientConfig.Keycloak>({
                        "implementation": "KEYCLOAK",
                        "keycloakConfig": env.AUTHENTICATION.OIDC
                    }) :
                    id<OidcClientConfig.InMemory>({
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
                "baseUrl": env.API.BASE_URL
            })
        });

    });

    return (
        <React.StrictMode>
            <I18nProvider lng="browser default">
                <StoreProvider
                    createStoreParams={createStoreParams}
                    //TODO: False once we will actually log things
                    doLogSecretManager={true}
                >
                    <App />
                </StoreProvider>
            </I18nProvider>
        </React.StrictMode>
    );

};

reactDom.render(
    <Root />,
    document.getElementById("root")
);
