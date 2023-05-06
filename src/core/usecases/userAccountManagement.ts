import type { Thunks } from "../core";
import { addParamToUrl } from "powerhooks/tools/urlSearchParams";

export const name = "userAccountManagement";

export const reducer = null;

export const thunks = {
    "getPasswordResetUrl":
        () =>
        (...args): string | undefined => {
            const [
                ,
                ,
                {
                    createStoreParams: { getCurrentLang, keycloakParams }
                }
            ] = args;

            if (keycloakParams === undefined) {
                return undefined;
            }

            let url = [
                keycloakParams.url.replace(/\/$/, ""),
                "realms",
                keycloakParams.realm,
                "account",
                "password"
            ].join("/");

            {
                const { newUrl } = addParamToUrl({
                    url,
                    "name": "referrer",
                    "value": keycloakParams.clientId
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
                    "value": getCurrentLang()
                });

                url = newUrl;
            }

            return url;
        }
} satisfies Thunks;
