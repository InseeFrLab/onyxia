
import type {
    AppThunk,
    Dependencies,
    OidcClientConfig,
    SecretsManagerClientConfig
} from "../setup";
import { assert } from "evt/tools/typeSafety/assert";

import type { SecretsManagerTranslation } from "../ports/SecretsManagerClient";
import type { NonPostableEvt } from "evt";

export type AppConstant = AppConstant.LoggedIn | AppConstant.NotLoggedIn;

export declare namespace AppConstant {

    export type _Common = {
        isOsPrefersColorSchemeDark: boolean;
        vaultClientConfig: Readonly<Omit<SecretsManagerClientConfig.Vault,
            "implementation" |
            "evtOidcAccessToken" |
            "renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired"
        >>;
        /** NOTE: Convoluted way of pointing to type { KeycloakConfig } from "Keycloak-js" */
        keycloakConfig: Readonly<OidcClientConfig.Keycloak["keycloakConfig"]>;
    };

    export type LoggedIn = _Common & {
        isUserLoggedIn: true;
        userProfile: {
            idep: string;
            email: string;
            nomComplet: string;
        };
        getEvtSecretsManagerTranslation(): { evtSecretsManagerTranslation: NonPostableEvt<SecretsManagerTranslation> };
    };

    export type NotLoggedIn = _Common & {
        isUserLoggedIn: false;
    };

}

export const name = "appConstants";

const appConstantsByDependenciesRef = new WeakMap<Dependencies, AppConstant>();

export const thunks = {
    "getAppConstants":
        (): AppThunk<Readonly<AppConstant>> => (...args) => {

            const [, , dependencies] = args;

            const appConstants = appConstantsByDependenciesRef.get(dependencies);

            assert(appConstants !== undefined);

            return appConstants;


        },
};

export const privateThunks = {
    "initialize":
        (params: { appConstants: AppConstant; }): AppThunk => async (...args) => {

            const { appConstants } = params;

            const [, , dependencies] = args;

            appConstantsByDependenciesRef.set(dependencies, appConstants);

        }
};