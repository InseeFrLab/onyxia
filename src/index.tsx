import React from "react";
import * as reactDom from "react-dom";
import { Provider } from "react-redux";
import App_ from "js/components";
import { store } from "js/redux/store";
import { getKeycloakInstance } from "js/utils/getKeycloakInstance";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import { actions as userActions } from "js/redux/user";
import { locallyStoredOidcAccessToken } from "js/utils/locallyStoredOidcAccessToken";
import JavascriptTimeAgo from 'javascript-time-ago';
import fr from 'javascript-time-ago/locale/fr';
import { getEnv } from "js/env";
import { initVaultData } from "js/vault";
import { useAsync } from "react-async-hook";
import Loader from "js/components/commons/loader";
import { assert } from "evt/tools/typeSafety/assert";
const App: any = App_;

JavascriptTimeAgo.locale(fr);

assert(
    getEnv().AUTHENTICATION.TYPE === "oidc",
    [
        "REACT_APP_AUTH_TYPE must be set to \"oidc\" as it's",
        "the only authentication mechanism currently supported"
    ].join(" ")
);

const initializeUserSessionIfLoggedIn = async (): Promise<void> => {

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
        return;

    }

    //NOTE: We know it as user is authenticated
    assert(
        kc.token !== undefined &&
        kc.refreshToken !== undefined &&
        kc.idToken !== undefined
    );

    locallyStoredOidcAccessToken.set(kc.token);

    store.dispatch(
        userActions.setAuthenticated({
            "accessToken": kc.token,
            "refreshToken": kc.refreshToken,
            "idToken": kc.idToken
        })
    );

    await initVaultData();

};


const Root: React.FC = () =>
    useAsync(initializeUserSessionIfLoggedIn, []).status !== "success" ?
        <Loader em={30} /> :
        <App />
    ;


reactDom.render(
    <React.StrictMode>
        <Provider store={store}>
            <Root />
        </Provider>
    </React.StrictMode>,
    document.getElementById("root")
);
