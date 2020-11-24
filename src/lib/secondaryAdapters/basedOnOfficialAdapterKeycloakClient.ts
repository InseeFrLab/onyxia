
import type { KeycloakClient } from "../ports/KeycloakClient";
import keycloak_js from "keycloak-js";
import type { KeycloakConfig } from "keycloak-js";
import { id } from "evt/tools/typeSafety/id";
import { Evt } from "evt";
import { getLocalStorage } from "../utils/safeLocalStorage";
import { assert } from "evt/tools/typeSafety/assert";

const fallbackUri = `${window.location.origin}/accueil`;

export async function createImplOfKeycloakClientBasedOnOfficialAddapter(
    params: {
        keycloakConfig: KeycloakConfig;
    }
): Promise<KeycloakClient> {

    const { keycloakConfig } = params;

    const keycloakInstance = keycloak_js(keycloakConfig);

    const { evtLocallyStoredOidcAccessToken } = getEvtLocallyStoredOidcAccessToken();

    const isAuthenticated = await keycloakInstance.init({
        "onLoad": "check-sso",
        "silentCheckSsoRedirectUri": `${window.location.origin}/silent-sso.html`,
        "responseMode": "query",
        "checkLoginIframe": false,
        "token": evtLocallyStoredOidcAccessToken.state
    }).catch((error: Error) => error);

    //TODO: Make sure that result is always an object.
    if (isAuthenticated instanceof Error) {
        throw isAuthenticated;
    }

    const login: KeycloakClient.NotLoggedIn["login"] = async params => {

        const { redirectUri = fallbackUri } = params ?? {};

        await keycloakInstance.login({ redirectUri });

        return new Promise<never>(() => { });

    };

    if (!isAuthenticated) {

        evtLocallyStoredOidcAccessToken.state = undefined;

        return id<KeycloakClient.NotLoggedIn>({
            "isUserLoggedIn": false,
            login
        })

    }

    evtLocallyStoredOidcAccessToken.state = keycloakInstance.token!;

    return id<KeycloakClient.LoggedIn>({
        "isUserLoggedIn": true,
        "evtOidcTokens": evtLocallyStoredOidcAccessToken.pipe(
            oidcAccessToken => oidcAccessToken === undefined ?
                [undefined] :
                [{
                    "accessToken": oidcAccessToken,
                    "idToken": keycloakInstance.idToken!,
                    "refreshToken": keycloakInstance.refreshToken!
                }]
        ),
        "renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired":
            async params => {

                const { minValidity = 10 } = params ?? {};

                if (!keycloakInstance.isTokenExpired(minValidity)) {
                    return;
                }

                evtLocallyStoredOidcAccessToken.state = undefined;

                const error = await keycloakInstance.updateToken(-1)
                    .then(
                        () => undefined,
                        (error: Error) => error
                    );

                if (error) {

                    //NOTE: Never resolves
                    await login({ "redirectUri": window.location.href });

                }

                assert(keycloakInstance.token !== undefined);

                evtLocallyStoredOidcAccessToken.state = keycloakInstance.token;


            },
        "logout": async () => {

            await keycloakInstance.logout({ "redirectUri": fallbackUri });

            return new Promise<never>(() => { });

        }
    });

}


const getEvtLocallyStoredOidcAccessToken = () => {

    const { localStorage } = getLocalStorage();

    const key = "onyxia/localStorage/user/token";

    const evtLocallyStoredOidcAccessToken = Evt.create(localStorage.getItem(key) ?? undefined);

    evtLocallyStoredOidcAccessToken
        .toStateless()
        .attach(oidcAccessToken => {

            if (oidcAccessToken === undefined) {

                localStorage.removeItem(key)

            } else {

                localStorage.setItem(key, oidcAccessToken);

            }

        });

    return { evtLocallyStoredOidcAccessToken };


};
