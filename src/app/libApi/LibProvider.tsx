import type { ReactNode } from "react";
import { Provider as ReactReduxProvider } from "react-redux";
import { useAsync } from "react-async-hook";
import { createStore } from "lib";
import { getIsDarkModeEnabledOsDefault } from "onyxia-ui";
import memoize from "memoizee";
import { id } from "tsafe/id";
import type {
    OidcClientConfig,
    SecretsManagerClientConfig,
    OnyxiaApiClientConfig,
    UserApiClientConfig,
    S3ClientConfig,
} from "lib/setup";
import { getEnv } from "env";
import { isStorybook } from "app/tools/isStorybook";
import { assert } from "tsafe/assert";

//NOTE: Create store can only be called once
const createStore_memo = memoize(
    () => {
        const env = getEnv();

        if (env.OIDC_URL !== "") {
            assert(env.OIDC_REALM !== "", "You must provide an OIDC realm");
        }

        return createStore({
            "getIsDarkModeEnabledValueForProfileInitialization":
                getIsDarkModeEnabledOsDefault,

            "oidcClientConfig":
                isStorybook || env.OIDC_URL === ""
                    ? id<OidcClientConfig.Phony>({
                          "implementation": "PHONY",
                          "isUserLoggedIn": true,
                      })
                    : id<OidcClientConfig.Keycloak>({
                          "implementation": "KEYCLOAK",
                          "url": env.OIDC_URL,
                          "realm": env.OIDC_REALM,
                          "clientId": env.OIDC_CLIENT_ID,
                      }),
            "onyxiaApiClientConfig": isStorybook
                ? id<OnyxiaApiClientConfig.Mock>({
                      "implementation": "MOCK",
                      "availableDeploymentRegions": [
                          {
                              "id": "dummy region",
                              "namespacePrefix": "user-",
                              "defaultIpProtection": undefined,
                              "defaultNetworkPolicy": undefined,
                              "s3MonitoringUrlPattern": undefined,
                              "servicesMonitoringUrlPattern": undefined,
                          },
                      ],
                  })
                : id<OnyxiaApiClientConfig.Official>({
                      "implementation": "OFFICIAL",
                      "url":
                          env.ONYXIA_API_URL ||
                          (() => {
                              const { protocol, host } = window.location;

                              return `${protocol}//${host}/api`;
                          })(),
                  }),
            "userApiClientConfig":
                isStorybook || env.OIDC_URL === ""
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
                              "email": env.OIDC_EMAIL_CLAIM,
                              "familyName": env.OIDC_FAMILY_NAME_CLAIM,
                              "firstName": env.OIDC_FIRST_NAME_CLAIM,
                              "username": env.OIDC_USERNAME_CLAIM,
                              "groups": env.OIDC_GROUPS_CLAIM,
                              "local": env.OIDC_LOCALE_CLAIM,
                          },
                      }),
            "secretsManagerClientConfig":
                isStorybook || env.VAULT_URL === ""
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
                          "url": env.VAULT_URL,
                          "engine": env.VAULT_KV_ENGINE,
                          "role": env.VAULT_ROLE,
                          "keycloakParams": {
                              "url": env.OIDC_VAULT_URL || env.OIDC_URL,
                              "realm": env.OIDC_VAULT_REALM || env.OIDC_REALM,
                              "clientId": env.OIDC_VAULT_CLIENT_ID || env.OIDC_CLIENT_ID,
                          },
                      }),
            "s3ClientConfig":
                isStorybook || env.MINIO_URL === ""
                    ? id<S3ClientConfig.LocalStorage>({
                          "implementation": "DUMMY",
                      })
                    : id<S3ClientConfig.Minio>({
                          "implementation": "MINIO",
                          "url": env.MINIO_URL,
                          "keycloakParams": {
                              "url": env.OIDC_MINIO_URL || env.OIDC_URL,
                              "realm": env.OIDC_MINIO_REALM || env.OIDC_REALM,
                              "clientId": env.OIDC_MINIO_CLIENT_ID || env.OIDC_CLIENT_ID,
                          },
                      }),
        });
    },
    { "promise": true },
);

type Props = {
    children: ReactNode;
};

export function LibProvider(props: Props) {
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
