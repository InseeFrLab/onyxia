import React from "react";
import * as reactDom from "react-dom";
import { Provider } from "react-redux";
import App_ from "js/components";
import { store } from "js/redux/store";
import { getKeycloakInstance } from "js/utils/getKeycloakInstance";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import { actions as userActions } from "js/redux/user";
import { locallyStoredOidcJwt } from "js/utils/locallyStoredOidcJwt";
import JavascriptTimeAgo from 'javascript-time-ago';
import fr from 'javascript-time-ago/locale/fr';
import { env } from "js/env";
import { initVaultData } from "js/vault-client";
import { useAsync } from "react-async-hook";
import Loader from "js/components/commons/loader";
import { assert } from "evt/tools/typeSafety/assert";
const App: any = App_;

JavascriptTimeAgo.locale(fr);

const keycloakDefaultConf = {
    "onLoad": "check-sso",
    "silentCheckSsoRedirectUri": `${window.location.origin}/silent-sso.html`,
    "responseMode": "query",
    "checkLoginIframe": false
} as const;

assert(
    env.AUTHENTICATION.TYPE === "oidc",
    [
        "REACT_APP_AUTH_TYPE must be set to \"oidc\" as it's",
        "the only authentication mechanism currently supported"
    ].join(" ")
);

const initializeKeycloak = async (): Promise<void> => {

    const kc = getKeycloakInstance();

    const isAuthenticated = await kc.init({
        ...keycloakDefaultConf,
        ...(() => {

            const { oidcJwt } = locallyStoredOidcJwt.get();

            return oidcJwt ? { "token": oidcJwt } : {};

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

    //NOTE: We know it as user is authenticated
    assert(
        kc.token !== undefined &&
        kc.refreshToken !== undefined &&
        kc.idToken !== undefined
    );

    locallyStoredOidcJwt.set(kc.token);

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
    } = locallyStoredOidcJwt.getParsed();

    initVaultData(preferred_username, name, email);

};


const Root: React.FC = () =>
    useAsync(initializeKeycloak, []).status !== "success" ?
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
