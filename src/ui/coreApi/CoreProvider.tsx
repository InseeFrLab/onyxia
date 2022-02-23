import type { ReactNode } from "react";
import { Provider as ReactReduxProvider } from "react-redux";
import { useAsync } from "react-async-hook";
import { createStore } from "core";
import { getIsDarkModeEnabledOsDefault } from "onyxia-ui";
import memoize from "memoizee";
import { id } from "tsafe/id";
import type {
    OidcClientConfig,
    SecretsManagerClientConfig,
    OnyxiaApiClientConfig,
    UserApiClientConfig,
} from "core/setup";
import { getEnv } from "env";
import { isStorybook } from "ui/tools/isStorybook";
import { assert } from "tsafe/assert";
import { symToStr } from "tsafe/symToStr";

//NOTE: Create store can only be called once
const createStore_memo = memoize(
    () => {
        const env = getEnv();

        {
            const { OIDC_URL } = env;

            if (env.OIDC_URL !== "") {
                const { OIDC_REALM } = env;
                assert(
                    OIDC_REALM !== "",
                    `If ${symToStr({ OIDC_URL })} is specified ${symToStr({
                        OIDC_REALM,
                    })} should be specified too.`,
                );
            }
        }

        {
            const { VAULT_URL } = env;

            if (VAULT_URL !== "") {
                const { OIDC_URL } = env;

                assert(
                    OIDC_URL !== "",
                    `To use ${symToStr({ VAULT_URL })} you must provide ${symToStr({
                        OIDC_URL,
                    })}`,
                );
            }
        }

        const { highlightedPackages } = (() => {
            const { HIGHLIGHTED_PACKAGES } = env;

            let highlightedPackages: string[];

            if (HIGHLIGHTED_PACKAGES === "") {
                highlightedPackages = [];
                return { highlightedPackages };
            }

            try {
                highlightedPackages = JSON.parse(HIGHLIGHTED_PACKAGES);

                assert(
                    highlightedPackages.find(
                        packageName => typeof packageName !== "string",
                    ) === undefined,
                );
            } catch {
                throw new Error(
                    `${symToStr({
                        HIGHLIGHTED_PACKAGES,
                    })}, is not a valid value: \`${HIGHLIGHTED_PACKAGES}\` please refer to the comments in the .env file at the root of the project.`,
                );
            }

            return { highlightedPackages };
        })();

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
                              "defaultIpProtection": undefined,
                              "defaultNetworkPolicy": undefined,
                              "servicesMonitoringUrlPattern": undefined,
                              "kubernetesClusterDomain": "kub.sspcloud.fr",
                              "initScriptUrl":
                                  "https://InseeFrLab.github.io/onyxia/onyxia-init.sh",
                              "s3": undefined,
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
            highlightedPackages,
        });
    },
    { "promise": true },
);

type Props = {
    children: ReactNode;
};

export function CoreProvider(props: Props) {
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
