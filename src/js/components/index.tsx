import React, { useState } from "react";
import * as reactDom from "react-dom";
import { Provider } from "react-redux";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import JavascriptTimeAgo from 'javascript-time-ago';
import fr from 'javascript-time-ago/locale/fr';
import { useAsync } from "react-async-hook";
import Loader from "js/components/commons/loader";
import { assert } from "evt/tools/typeSafety/assert";
import { getEnv } from "../env";

import { createStore } from "lib/setup";
import type { ParamsNeededToInitializeKeycloakClient, ParamsNeededToInitializeVaultClient } from "lib/setup";
import { id } from "evt/tools/typeSafety/id";

import App_ from "js/components/app.container";
const App: any = App_;

JavascriptTimeAgo.locale(fr);

console.log("load!");

const Root = () => {

    const [env] = useState(() => getEnv());

    const { result: store, error } = useAsync(
        () => createStore({
            "paramsNeededToInitializeKeycloakClient":
                id<ParamsNeededToInitializeKeycloakClient.Real>({
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
            "paramsNeededToInitializeVaultClient":
                id<ParamsNeededToInitializeVaultClient.Real>({
                    "doUseInMemoryClient": false,
                    "baseUri": env.VAULT.BASE_URI,
                    "engine": env.VAULT.ENGINE,
                    "role": env.VAULT.ROLE
                })
        }),
        []
    );

    if (error) {
        throw error;
    }

    return (
        //<React.StrictMode>
        <>
            {
                store === undefined ?
                    <Loader em={30} /> :
                    <Provider store={store}>
                        <App />
                    </Provider>
            }
        </>
        //</React.StrictMode>
    );

};



reactDom.render(
    <Root />,
    document.getElementById("root")
);
