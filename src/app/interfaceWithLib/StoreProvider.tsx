import type { ReactNode } from "react";
import { Provider as ReactReduxProvider } from "react-redux";
import { useAsync } from "react-async-hook";
import { createStore } from "lib/setup";
import { getIsDarkModeEnabledOsDefault } from "onyxia-ui";
import memoize from "memoizee";
import { id } from "tsafe/id";
import type {
    OidcClientConfig,
    SecretsManagerClientConfig,
    OnyxiaApiClientConfig,
} from "lib/setup";
import { getEnv } from "env";
import * as mockData from "./mockData";

export function createStoreProvider(params: { isStorybook: boolean }) {
    const { isStorybook } = params;

    //NOTE: Create store can only be called once
    const createStore_memo = memoize(
        () =>
            createStore({
                "oidcClientConfig":
                    isStorybook || getEnv().OIDC_URL === ""
                        ? id<OidcClientConfig.Phony>({
                              "implementation": "PHONY",
                              "tokenValidityDurationMs": Infinity,
                              "parsedJwt": {
                                  "email": "john.doe@insee.fr",
                                  "username": "jdoe",
                                  "familyName": "Doe",
                                  "firstName": "John",
                                  "groups": ["sspcloud-admin", "dsi-ddc"],
                                  "kcLanguageTag": "en",
                              },
                          })
                        : id<OidcClientConfig.Keycloak>({
                              "implementation": "KEYCLOAK",
                              "keycloakConfig": {
                                  "clientId": getEnv().OIDC_CLIENT_ID,
                                  "realm": getEnv().OIDC_REALM,
                                  "url": getEnv().OIDC_URL,
                              },
                          }),
                "secretsManagerClientConfig":
                    isStorybook || getEnv().VAULT_URL === ""
                        ? id<SecretsManagerClientConfig.LocalStorage>({
                              "implementation": "LOCAL STORAGE",
                              "artificialDelayMs": 0,
                              "doReset": false,
                              "paramsForTranslator": isStorybook
                                  ? {
                                        "baseUri": "https://vault.lab.sspcloud.fr",
                                        "engine": "onyxia-kv",
                                        "role": "onyxia-user",
                                    }
                                  : {
                                        "baseUri": "",
                                        "engine": "",
                                        "role": "",
                                    },
                          })
                        : id<SecretsManagerClientConfig.Vault>({
                              "implementation": "VAULT",
                              "baseUri": getEnv().VAULT_URL,
                              "engine": getEnv().VAULT_KV_ENGINE,
                              "role": getEnv().VAULT_ROLE,
                          }),
                "onyxiaApiClientConfig": isStorybook
                    ? id<OnyxiaApiClientConfig.Mock>({
                          "implementation": "MOCK",
                          ...mockData,
                      })
                    : id<OnyxiaApiClientConfig.Official>({
                          "implementation": "OFFICIAL",
                          "baseUrl":
                              getEnv().ONYXIA_API_URL ||
                              (() => {
                                  const { protocol, host } = window.location;

                                  return `${protocol}//${host}/api`;
                              })(),
                      }),
                "getIsDarkModeEnabledValueForProfileInitialization":
                    getIsDarkModeEnabledOsDefault,
            }),
        { "promise": true },
    );

    type Props = {
        children: ReactNode;
    };

    function StoreProvider(props: Props) {
        const { children } = props;

        const asyncCreateStore = useAsync(
            () => createStore_memo(),

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
