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
import { assert } from "evt/tools/typeSafety/assert";
import { typeGuard } from "evt/tools/typeSafety/typeGuard";
const App: any = App_;

JavascriptTimeAgo.locale(fr);

const keycloakDefaultConf = {
    "onLoad": "check-sso",
    "silentCheckSsoRedirectUri": `${window.location.origin}/silent-sso.html`,
    "responseMode": "query",
    "checkLoginIframe": false
} as const;

const initializeKeycloak: () => Promise<void> =
    env.AUTHENTICATION.TYPE !== "oidc" ?
        (() => {

            locallyStoredOidcJwt.set("FAKE_TOKEN");

            store.dispatch(
                userActions.setAuthenticated({
                    "accessToken": "fake",
                    "refreshToken": "fake",
                    "idToken": "fake"
                })
            );

            return Promise.resolve();

        })
        :
        (async () => {

            const kc = getKeycloakInstance();

            const isAuthenticated = await kc.init({
                    ...keycloakDefaultConf,
                    ...(() => {

                        const oidcJwt = locallyStoredOidcJwt.get();

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
                kc.idToken !== undefined &&
                typeGuard<Record<string,string>>(kc.tokenParsed)
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
            } = kc.tokenParsed;

            initVaultData(preferred_username, name, email);

        });


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
