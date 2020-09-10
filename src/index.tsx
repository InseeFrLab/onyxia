import React, { useState } from "react";
import * as reactDom from "react-dom";
import { Provider } from "react-redux";
import App_ from "js/components";
import { store } from "js/redux";
import { getKeycloak } from "js/utils";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import { setAuthenticated } from "js/redux/actions";
import * as localStorageToken from "js/utils/localStorageToken";
import JavascriptTimeAgo from 'javascript-time-ago';
import fr from 'javascript-time-ago/locale/fr';
import configuration from "js/configuration";
import { initVaultData } from "js/vault-client";
import { useRequest } from "js/utils/hooks/useRequest";
const App: any = App_;

JavascriptTimeAgo.locale(fr);

const keycloakDefaultConf = {
    "onLoad": "check-sso",
    "silentCheckSsoRedirectUri": `${window.location.origin}/silent-sso.html`,
    "responseMode": "query",
    "checkLoginIframe": false
};

const initializeKeycloak = async (): Promise<void> => {

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
        setAuthenticated({
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

};

const SplashScreen: React.FunctionComponent<{}> = () => {

    const [
        ,
        initializeKeycloakProxy,
        { length: isKeycloakInitialized }
    ] = useRequest(initializeKeycloak);

    const shouldInitializeKeycloak = configuration.AUTHENTICATION.TYPE === "oidc";

    //NOTE: useState instead of useEffect because it's callback is executed synchronously.
    useState(() => {

        if (!shouldInitializeKeycloak) {

            const kc = getKeycloak();

            localStorageToken.set("FAKE_TOKEN");

            store.dispatch(
                setAuthenticated({
                    "accessToken": kc.token,
                    "refreshToken": kc.refreshToken,
                    "idToken": kc.idToken
                })
            );

            return;

        }

        initializeKeycloakProxy();

    });

    return shouldInitializeKeycloak && !isKeycloakInitialized ?
        <h1>Initializing keycloak</h1> : //TODO: <= Actual splash screen here
        <Provider store={store}>
            <App />
        </Provider>;

};

reactDom.render(
    <React.StrictMode>
        <SplashScreen />
    </React.StrictMode>,
    document.getElementById("root")
);
