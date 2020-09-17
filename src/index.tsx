import React from "react";
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
import configuration from "js/configuration";
import { initVaultData } from "js/vault-client";
import { useAsync } from "react-async-hook";
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

};

const SplashScreen = () => <h1>Initializing keycloak</h1>; //TODO: <= Actual splash screen here

const Switcher = () => {

    const asyncInitializeKeycloak = useAsync(async ()=> {

        if( configuration.AUTHENTICATION.TYPE !== "oidc" ){

            const kc = getKeycloak();

            localStorageToken.set("FAKE_TOKEN");

            store.dispatch(
                userActions.setAuthenticated({
                    "accessToken": kc.token,
                    "refreshToken": kc.refreshToken,
                    "idToken": kc.idToken
                })
            );

            return;

        }

        await initializeKeycloak();

    }, []);

    return !asyncInitializeKeycloak.result ? <SplashScreen /> : <App />;

};

reactDom.render(
    <React.StrictMode>
        <Provider store={store}>
            <Switcher />
        </Provider>
    </React.StrictMode>,
    document.getElementById("root")
);
