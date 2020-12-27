import React, { useState } from "react";
import * as reactDom from "react-dom";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import JavascriptTimeAgo from 'javascript-time-ago';
import fr from 'javascript-time-ago/locale/fr';
import { assert } from "evt/tools/typeSafety/assert";
import { getEnv } from "../js/env";

import type { OidcClientConfig, SecretsManagerClientConfig, OnyxiaApiClientConfig } from "lib/setup";
import { id } from "evt/tools/typeSafety/id";
import { I18nProvider } from "./i18n/I18nProvider";
import { getIsOsPreferredColorSchemeDark } from "app/utils/getIsOsPreferredColorSchemeDark";

import { StoreProvider, Props as StoreProviderProps } from "app/lib/StoreProvider";

import App_ from "js/components/app.container";
const App: any = App_;

JavascriptTimeAgo.locale(fr);

function Root() {

    const [createStoreParams] = useState(() => {

        const env = getEnv();

        return id<StoreProviderProps["createStoreParams"]>({
            "isOsPrefersColorSchemeDark": getIsOsPreferredColorSchemeDark(),
            "oidcClientConfig": id<OidcClientConfig.Keycloak>({
                "doUseInMemoryClient": false,
                "keycloakConfig": (() => {

                    assert(
                        env.AUTHENTICATION.TYPE === "oidc",
                        [
                            "REACT_APP_AUTH_TYPE must be set to \"oidc\" as it's",
                            "the only authentication mechanism currently supported"
                        ].join(" ")
                    );

                    return env.AUTHENTICATION.OIDC;

                })()
            }),
            "secretsManagerClientConfig": id<SecretsManagerClientConfig.Vault>({
                "doUseInMemoryClient": false,
                "baseUri": env.VAULT.BASE_URI,
                "engine": env.VAULT.ENGINE,
                "role": env.VAULT.ROLE
            }),
            "onyxiaApiClientConfig": id<OnyxiaApiClientConfig.Remote>({
                "doUseInMemoryClient": false,
                "baseUrl": env.API.BASE_URL
            })
        });

    });

    return (
        <React.StrictMode>
            <I18nProvider lng="browser default">
                <StoreProvider createStoreParams={createStoreParams}>
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
