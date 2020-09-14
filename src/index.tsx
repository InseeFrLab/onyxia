import React from "react";
import * as reactDom from "react-dom";
import { Provider } from "react-redux";
import App_ from "js/components";
import { store } from "js/redux";
import { getKeycloak } from "js/utils";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import { actions as userActions } from "js/redux/user";
import * as localStorageToken from "js/utils/localStorageToken";
import JavascriptTimeAgo from 'javascript-time-ago';
import fr from 'javascript-time-ago/locale/fr';
import configuration from "js/configuration";
import { initVaultData } from "js/vault-client";
import { Evt } from "evt";
import { useStatefulEvt } from "evt/hooks";
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

/** 
 * evtIsKeycloakInitialized.state === false while initializeKeycloak() has not resolved,
 * it is sets to true after.
 */
const evtIsKeycloakInitialized =
    configuration.AUTHENTICATION.TYPE === "oidc" ?
        Evt.from(initializeKeycloak().then(() => true))
            .toStateful(false)
        :
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

            return Evt.create(true);


        })();


const Switcher = () => {

    //NOTE: Hook that trigger render when evtIsKeycloakInitialized.state value changes.
    useStatefulEvt([evtIsKeycloakInitialized]);

    return !evtIsKeycloakInitialized.state ?
        <SplashScreen /> :
        <Provider store={store}>
            <App />
        </Provider>;

};

reactDom.render(
    <React.StrictMode>
        <Switcher />
    </React.StrictMode>,
    document.getElementById("root")
);
