import type { ReactNode } from "react";
import { Provider as ReactReduxProvider } from "react-redux";
import { useAsync } from "react-async-hook";
import { createStore } from "lib/setup";
import { getIsDarkModeEnabledOsDefault } from "onyxia-ui";
import memoize from "memoizee";
import { getValidatedEnv } from "app/validatedEnv";
import { id } from "tsafe/id";
import type {
    OidcClientConfig,
    SecretsManagerClientConfig,
    OnyxiaApiClientConfig,
} from "lib/setup";
import * as mockData from "./mockData";

export function createStoreProvider(params: { doMock: boolean }) {
    const { doMock } = params;

    //NOTE: Create store can only be called once
    const createStore_memo = memoize(
        () => {
            const env = getValidatedEnv();

            return createStore({
                "oidcClientConfig": doMock
                    ? id<OidcClientConfig.Phony>({
                          "implementation": "PHONY",
                          "tokenValidityDurationMs": Infinity,
                          "parsedJwt": {
                              "email": "john.doe@insee.fr",
                              "preferred_username": "jdoe",
                              "family_name": "Doe",
                              "given_name": "John",
                              "groups": ["sspcloud-admin", "dsi-ddc"],
                              "locale": "en",
                          },
                      })
                    : env.AUTHENTICATION.TYPE === "oidc"
                    ? id<OidcClientConfig.Keycloak>({
                          "implementation": "KEYCLOAK",
                          "keycloakConfig": env.AUTHENTICATION.OIDC,
                      })
                    : id<OidcClientConfig.Phony>({
                          "implementation": "PHONY",
                          "tokenValidityDurationMs": Infinity,
                          "parsedJwt": {
                              "email": "john.doe@insee.fr",
                              "preferred_username": "jdoe",
                              "family_name": "Doe",
                              "given_name": "John",
                              "groups": [],
                              "locale": "fr",
                          },
                      }),
                "secretsManagerClientConfig": doMock
                    ? id<SecretsManagerClientConfig.LocalStorage>({
                          "implementation": "LOCAL STORAGE",
                          "artificialDelayMs": 0,
                          "doReset": false,
                          "paramsForTranslator": {
                              "baseUri": "https://vault.lab.sspcloud.fr",
                              "engine": "onyxia-kv",
                              "role": "onyxia-user",
                          },
                      })
                    : id<SecretsManagerClientConfig.Vault>({
                          "implementation": "VAULT",
                          "baseUri": env.VAULT.BASE_URI,
                          "engine": env.VAULT.ENGINE,
                          "role": env.VAULT.ROLE,
                      }),
                "onyxiaApiClientConfig": doMock
                    ? id<OnyxiaApiClientConfig.Mock>({
                          "implementation": "MOCK",
                          ...mockData,
                      })
                    : id<OnyxiaApiClientConfig.Official>({
                          "implementation": "OFFICIAL",
                          "baseUrl":
                              env.API.BASE_URL ??
                              (() => {
                                  const { protocol, host } = window.location;

                                  return `${protocol}//${host}/api`;
                              })(),
                      }),
                "getIsDarkModeEnabledValueForProfileInitialization":
                    getIsDarkModeEnabledOsDefault,
            });
        },
        { "promise": true },
    );

    type Props = {
        children: ReactNode;
    };

    function StoreProvider(props: Props) {
        const { children } = props;

        const asyncCreateStore = useAsync(
            () => createStore_memo(),
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [],
        );

        if (asyncCreateStore.error) {
            throw asyncCreateStore.error;
        }

        const { result: store } = asyncCreateStore;

        return store === undefined ? null : (
            <ReactReduxProvider store={store}>{children}</ReactReduxProvider>
        );
    }

    return { StoreProvider };
}
