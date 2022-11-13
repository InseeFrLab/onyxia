import "minimal-polyfills/Object.fromEntries";
import type { LocalizedString } from "ui/i18n";
import { getEnv } from "env";
import { symToStr } from "tsafe/symToStr";
import memoize from "memoizee";
import { assert } from "tsafe/assert";
import type { createCoreProvider } from "core";
import { getIsDarkModeEnabledOsDefault } from "onyxia-ui";
import type { NonPostableEvt } from "evt";
import type { Param0 } from "tsafe";

export type AdminProvidedLink = {
    iconId: string;
    label: LocalizedString;
    url: string;
};

const getAdminProvidedLinksFromEnv = memoize(
    (
        envName: "EXTRA_LEFTBAR_ITEMS" | "HEADER_LINKS",
    ): AdminProvidedLink[] | undefined => {
        const envValue = getEnv()[envName];

        if (envValue === "") {
            return undefined;
        }

        const errorMessage = `${envName} is malformed`;

        let extraLeftBarItems: AdminProvidedLink[];

        try {
            extraLeftBarItems = JSON.parse(envValue);
        } catch {
            throw new Error(errorMessage);
        }

        assert(
            extraLeftBarItems instanceof Array &&
                extraLeftBarItems.find(
                    extraLeftBarItem =>
                        !(
                            extraLeftBarItem instanceof Object &&
                            typeof extraLeftBarItem.url === "string" &&
                            (typeof extraLeftBarItem.label === "string" ||
                                extraLeftBarItem.label instanceof Object)
                        ),
                ) === undefined,
            errorMessage,
        );

        return extraLeftBarItems;
    },
);

export const getExtraLeftBarItemsFromEnv = () =>
    getAdminProvidedLinksFromEnv("EXTRA_LEFTBAR_ITEMS");
export const getHeaderLinksFromEnv = () => getAdminProvidedLinksFromEnv("HEADER_LINKS");

export const getIsHomePageDisabled = memoize((): boolean => {
    const { DISABLE_HOME_PAGE } = getEnv();

    const possibleValues = ["true", "false"];

    assert(
        possibleValues.indexOf(DISABLE_HOME_PAGE) >= 0,
        `${symToStr({ DISABLE_HOME_PAGE })} should either be ${possibleValues.join(
            " or ",
        )}`,
    );

    return DISABLE_HOME_PAGE === "true";
});

export const getDoHideOnyxia = memoize((): boolean => {
    const { HEADER_HIDE_ONYXIA } = getEnv();

    const possibleValues = ["true", "false"];

    assert(
        possibleValues.indexOf(HEADER_HIDE_ONYXIA) >= 0,
        `${symToStr({ HEADER_HIDE_ONYXIA })} should either be ${possibleValues.join(
            " or ",
        )}`,
    );

    return HEADER_HIDE_ONYXIA === "true";
});

export const getCreateStoreParams = memoize(
    (params: {
        transformUrlBeforeRedirectToLogin: (url: string) => string;
        evtUserActivity: NonPostableEvt<void>;
    }): Exclude<Param0<typeof createCoreProvider>, Function> => {
        const { transformUrlBeforeRedirectToLogin, evtUserActivity } = params;

        const {
            ONYXIA_API_URL,
            JWT_EMAIL_CLAIM,
            JWT_FAMILY_NAME_CLAIM,
            JWT_FIRST_NAME_CLAIM,
            JWT_USERNAME_CLAIM,
            JWT_GROUPS_CLAIM,
            KEYCLOAK_URL,
            KEYCLOAK_REALM,
            KEYCLOAK_CLIENT_ID,
        } = getEnv();

        if (KEYCLOAK_URL !== "") {
            assert(
                KEYCLOAK_REALM !== "",
                `If ${symToStr({ KEYCLOAK_URL })} is specified ${symToStr({
                    KEYCLOAK_REALM,
                })} should be specified too.`,
            );
        }

        return {
            "onyxiaApiUrl": ONYXIA_API_URL || undefined,
            "userAuthenticationParams":
                KEYCLOAK_URL === ""
                    ? {
                          "method": "mock",
                          "isUserInitiallyLoggedIn": false,
                          "user": {
                              "email": "john.doe@example.com",
                              "familyName": "Doe",
                              "firstName": "John",
                              "username": "jdoe",
                              "groups": [],
                          },
                      }
                    : {
                          "method": "keycloak",
                          "keycloakParams": {
                              "url": KEYCLOAK_URL,
                              "realm": KEYCLOAK_REALM,
                              "clientId": KEYCLOAK_CLIENT_ID,
                              "jwtClaims": {
                                  "email": JWT_EMAIL_CLAIM,
                                  "familyName": JWT_FAMILY_NAME_CLAIM,
                                  "firstName": JWT_FIRST_NAME_CLAIM,
                                  "username": JWT_USERNAME_CLAIM,
                                  "groups": JWT_GROUPS_CLAIM,
                              },
                          },
                          transformUrlBeforeRedirectToLogin,
                      },
            "getIsDarkModeEnabledValueForProfileInitialization":
                getIsDarkModeEnabledOsDefault,
            evtUserActivity,
        };
    },
);
