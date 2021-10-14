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
    UserApiClientConfig,
} from "lib/setup";
import { getEnv } from "env";

export function createStoreProvider(params: { isStorybook: boolean }) {
    const { isStorybook } = params;

    //NOTE: Create store can only be called once
    const createStore_memo = memoize(
        () =>
            createStore({
                "getIsDarkModeEnabledValueForProfileInitialization":
                    getIsDarkModeEnabledOsDefault,

                "oidcClientConfig":
                    isStorybook || getEnv().OIDC_URL === ""
                        ? id<OidcClientConfig.Phony>({
                              "implementation": "PHONY",
                              "isUserLoggedIn": true,
                          })
                        : id<OidcClientConfig.Keycloak>({
                              "implementation": "KEYCLOAK",
                              "url": getEnv().OIDC_URL,
                              "realm": getEnv().OIDC_REALM,
                              "clientId": getEnv().OIDC_CLIENT_ID,
                          }),
                "onyxiaApiClientConfig": isStorybook
                    ? id<OnyxiaApiClientConfig.Mock>({
                          "implementation": "MOCK",
                          "availableDeploymentRegions": [
                              {
                                  "id": "dummy region",
                                  "namespacePrefix": "user-",
                              },
                          ],
                      })
                    : id<OnyxiaApiClientConfig.Official>({
                          "implementation": "OFFICIAL",
                          "url":
                              getEnv().ONYXIA_API_URL ||
                              (() => {
                                  const { protocol, host } = window.location;

                                  return `${protocol}//${host}/api`;
                              })(),
                      }),
                "userApiClientConfig":
                    isStorybook || getEnv().OIDC_URL === ""
                        ? id<UserApiClientConfig.Mock>({
                              "implementation": "MOCK",

                              "user": {
                                  "email": "john.doe@example.com",
                                  "familyName": "Doe",
                                  "firstName": "John",
                                  "username": "jdoe",
                                  "groups": [],
                                  "local": "en",
                              },
                          })
                        : id<UserApiClientConfig.Jwt>({
                              "implementation": "JWT",
                              "oidcClaims": {
                                  "email": getEnv().OIDC_EMAIL_CLAIM,
                                  "familyName": getEnv().OIDC_FAMILY_NAME_CLAIM,
                                  "firstName": getEnv().OIDC_FIRST_NAME_CLAIM,
                                  "username": getEnv().OIDC_USERNAME_CLAIM,
                                  "groups": getEnv().OIDC_GROUPS_CLAIM,
                                  "local": getEnv().OIDC_LOCALE_CLAIM,
                              },
                          }),
                "secretsManagerClientConfig":
                    isStorybook || getEnv().VAULT_URL === ""
                        ? id<SecretsManagerClientConfig.LocalStorage>({
                              "implementation": "LOCAL STORAGE",
                              "artificialDelayMs": 0,
                              "doReset": false,
                              "paramsForTranslator": {
                                  "engine": isStorybook ? "onyxia-kv" : "",
                              },
                          })
                        : id<SecretsManagerClientConfig.Vault>({
                              "implementation": "VAULT",
                              "baseUri": getEnv().VAULT_URL,
                              "engine": getEnv().VAULT_KV_ENGINE,
                              "role": getEnv().VAULT_ROLE,
                              "keycloakParams": {
                                  "url": getEnv().OIDC_VAULT_URL || getEnv().OIDC_URL,
                                  "realm":
                                      getEnv().OIDC_VAULT_REALM || getEnv().OIDC_REALM,
                                  "clientId":
                                      getEnv().OIDC_VAULT_CLIENT_ID ||
                                      getEnv().OIDC_CLIENT_ID,
                              },
                          }),
            }),
        { "promise": true },
    );

    type Props = {
        children: ReactNode;
    };

    function StoreProvider(props: Props) {
        const { children } = props;

        const asyncCreateStore = useAsync(() => createStore_memo(), []);

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
