import type { Thunks } from "../core";
import { addParamToUrl } from "powerhooks/tools/urlSearchParams";
import { createUsecaseContextApi } from "redux-clean-architecture";

export const name = "userAccountManagement";

export const reducer = null;

export const thunks = {
    "getPasswordResetUrl":
        () =>
        (...args): string | undefined => {
            const [, , extraArg] = args;

            const { keycloakPasswordResetUrl, clientId } = getContext(extraArg);

            if (keycloakPasswordResetUrl === undefined) {
                return undefined;
            }

            let url = keycloakPasswordResetUrl;

            {
                const { newUrl } = addParamToUrl({
                    url,
                    "name": "referrer",
                    "value": clientId
                });

                url = newUrl;
            }

            {
                const { newUrl } = addParamToUrl({
                    url,
                    "name": "referrer_uri",
                    "value": window.location.href
                });

                url = newUrl;
            }

            {
                const { newUrl } = addParamToUrl({
                    url,
                    "name": "kc_locale",
                    "value": extraArg.coreParams.getCurrentLang()
                });

                url = newUrl;
            }

            return url;
        }
} satisfies Thunks;

const { getContext, setContext } = createUsecaseContextApi<
    | {
          keycloakPasswordResetUrl: string;
          clientId: string;
      }
    | {
          keycloakPasswordResetUrl: undefined;
          clientId?: undefined;
      }
>();

export const protectedThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [, , extraArg] = args;

            const { onyxiaApi } = extraArg;

            const { oidcParams } = await onyxiaApi.getAvailableRegionsAndOidcParams();

            setContext(
                extraArg,
                (() => {
                    if (oidcParams === undefined) {
                        return {
                            "keycloakPasswordResetUrl": undefined
                        };
                    }

                    const { issuerUri, clientId } = oidcParams;

                    if (!new URL(issuerUri).pathname.match(/^\/(?:auth\/)?realms\/.*$/)) {
                        // Not a keycloak server
                        return {
                            "keycloakPasswordResetUrl": undefined
                        };
                    }

                    return {
                        "keycloakPasswordResetUrl": [
                            issuerUri,
                            "account",
                            "password"
                        ].join("/"),
                        clientId
                    };
                })()
            );
        }
} satisfies Thunks;
