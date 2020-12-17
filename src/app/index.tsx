import React, { useState } from "react";
import * as reactDom from "react-dom";
import { Provider } from "react-redux";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import JavascriptTimeAgo from 'javascript-time-ago';
import fr from 'javascript-time-ago/locale/fr';
import { useAsync } from "react-async-hook";
import Loader from "js/components/commons/loader";
import { assert } from "evt/tools/typeSafety/assert";
import { getEnv } from "../js/env";
import { Evt } from "evt";

import { createStore } from "lib/setup";
import type { KeycloakConfig, SecretsManagerClientConfig } from "lib/setup";
import { id } from "evt/tools/typeSafety/id";
import { I18nProvider } from "./i18n/I18nProvider";

import App_ from "js/components/app.container";
const App: any = App_;

JavascriptTimeAgo.locale(fr);

const Root = () => {

    const [env] = useState(() => getEnv());

    const { result: store, error } = useAsync(
        () => createStore({
            "isOsPrefersColorSchemeDark": (
                window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
            ),
            "keycloakConfig": id<KeycloakConfig.Real>({
                "doUseInMemoryClient": false,
                ...(() => {

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
            "evtBackOnline": Evt.from(window, "online").pipe(() => [id<void>(undefined)]),
        }),
        []
    );

    if (error) {
        throw error;
    }

    return (
        <React.StrictMode>
            <>
                {
                    store === undefined ?
                        <Loader em={30} /> :
                        <I18nProvider lng="browser default">
                            <Provider store={store}>
                                <App />
                            </Provider>
                        </I18nProvider>
                }
            </>
        </React.StrictMode>
    );

};



reactDom.render(
    <Root />,
    document.getElementById("root")
);
