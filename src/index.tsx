import React, { useCallback } from "react";
import * as reactDom from "react-dom";
import { Provider } from "react-redux";
import App_ from "js/components";
import { store } from "js/redux/store";
import { getKeycloak } from "js/utils";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import { actions as userActions } from "js/redux/user";
import * as localStorageToken from "js/utils/localStorageToken";
import JavascriptTimeAgo from 'javascript-time-ago';
import fr from 'javascript-time-ago/locale/fr';
import { env } from "js/env";
import { initVaultData } from "js/vault-client";
import { useAsync } from "react-async-hook";
import Loader from "js/components/commons/loader";
const App: any = App_;

JavascriptTimeAgo.locale(fr);

const keycloakDefaultConf = {
    "onLoad": "check-sso",
    "silentCheckSsoRedirectUri": `${window.location.origin}/silent-sso.html`,
    "responseMode": "query",
    "checkLoginIframe": false
};

const initializeKeycloak: () => Promise<void> =
    env.AUTHENTICATION.TYPE !== "oidc" ?
        (() => {

            const kc = getKeycloak();

            localStorageToken.set("FAKE_TOKEN");

            store.dispatch(
                userActions.setAuthenticated({
                    "accessToken": kc.token,
                    "refreshToken": kc.refreshToken,
                    "idToken": kc.idToken
                })
            );

            return Promise.resolve();

        })
        :
        (async () => {

            const isAuthenticated = await getKeycloak()
                .init({
                    ...keycloakDefaultConf,
                    ...(() => {

                        const localToken = localStorageToken.get();

                        return localToken ? { "token": localToken } : {};

                    })()
                })
                .catch((error: Error) => error);

            //TODO: Make sure that result is always an object.
            if (isAuthenticated instanceof Error) {
                throw isAuthenticated;
            }

            if (!isAuthenticated) {
                return;
            }

            const kc = getKeycloak();

            localStorageToken.set(kc.token);

            store.dispatch(
                userActions.setAuthenticated({
                    "accessToken": kc.token,
                    "refreshToken": kc.refreshToken,
                    "idToken": kc.idToken
                })
            );

            const {
                preferred_username,
                name,
                email
            } = kc.tokenParsed;

            initVaultData(preferred_username, name, email);

        });

reactDom.render(
    <React.StrictMode>
        <Provider store={store}>
            {useAsync(initializeKeycloak, []).status !== "success" ?
                <Loader em={30} /> :
                <App />}
        </Provider>
    </React.StrictMode>,
    document.getElementById("root")
);
