import React from "react";
import * as reactDom from "react-dom";
import { Provider } from "react-redux";
import { getKeycloakInstance } from "js/utils/getKeycloakInstance";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import { actions as userActions } from "js/redux/user";
import { locallyStoredOidcAccessToken } from "js/utils/locallyStoredOidcAccessToken";
import JavascriptTimeAgo from 'javascript-time-ago';
import fr from 'javascript-time-ago/locale/fr';
import { useAsync } from "react-async-hook";
import Loader from "js/components/commons/loader";
import { assert } from "evt/tools/typeSafety/assert";
import { getEnv } from "../env";
import { actions } from "js/redux/legacyActions";

import { createStore } from "js/../libs/setup";

import App_ from "js/components/app.container";
const App: any = App_;

JavascriptTimeAgo.locale(fr);

const env = getEnv();

assert(
    env.AUTHENTICATION.TYPE === "oidc",
    [
        "REACT_APP_AUTH_TYPE must be set to \"oidc\" as it's",
        "the only authentication mechanism currently supported"
    ].join(" ")
);


const initializeUserSessionIfLoggedIn = async () => {

    const kc = getKeycloakInstance();

    const isAuthenticated = await kc.init({
        "onLoad": "check-sso",
        "silentCheckSsoRedirectUri": `${window.location.origin}/silent-sso.html`,
        "responseMode": "query",
        "checkLoginIframe": false,
        "token": locallyStoredOidcAccessToken.get().oidcAccessToken
    }).catch((error: Error) => error);

    //TODO: Make sure that result is always an object.
    if (isAuthenticated instanceof Error) {
        throw isAuthenticated;
    }

    if (!isAuthenticated) {

        locallyStoredOidcAccessToken.clear();

        const { store } = await createStore({ "isUserLoggedIn": false });

        return store;

    }

    //NOTE: We know it as user is authenticated
    assert(
        kc.token !== undefined &&
        kc.refreshToken !== undefined &&
        kc.idToken !== undefined
    );

    locallyStoredOidcAccessToken.set(kc.token);

    const { email, preferred_username } = locallyStoredOidcAccessToken.getParsed();

    //TODO: Should be the only entry point of the app initialization.
    const { store } = await createStore({
        "isUserLoggedIn": true,
        "username": preferred_username,
        email,
        "paramsNeededToInitializeVaultClient": {
            "useInMemoryClient": false,
            "engine": env.VAULT.ENGINE,
            "baseUri": env.VAULT.BASE_URI,
            "role": env.VAULT.ROLE,
            "oidcAccessToken": kc.token
        }
    });

    //TODO: Anti pattern
    store.dispatch(
        userActions.setAuthenticated({
            "accessToken": kc.token,
            "refreshToken": kc.refreshToken,
            "idToken": kc.idToken
        })
    );

    await store.dispatch(actions.getUserInfo());

    return store;

};


const LoaderOrApp: React.FC = () => {

    const { result: store, error } = useAsync(initializeUserSessionIfLoggedIn, []);

    if (error) {
        throw error;
    }

    return store === undefined ?
        <Loader em={30} /> :
        <Provider store={store}>
            <App />
        </Provider>
        ;

};



reactDom.render(
    <React.StrictMode>
        <LoaderOrApp />,
    </React.StrictMode>,
    document.getElementById("root")
);
