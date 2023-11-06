/* In keycloak-theme, this should be evaluated early */

import { getEnv, type EnvName } from "env";
import { kcContext as kcLoginThemeContext } from "keycloak-theme/login/kcContext";
import {
    retrieveParamFromUrl,
    addParamToUrl,
    updateSearchBarUrl
} from "powerhooks/tools/urlSearchParams";
import { assert, type Equals } from "tsafe/assert";
import { is } from "tsafe/is";
import { typeGuard } from "tsafe/typeGuard";
import { id } from "tsafe/id";
import { objectKeys } from "tsafe/objectKeys";
import type { PaletteBase } from "onyxia-ui";
import type { DeepPartial } from "keycloakify/tools/DeepPartial";
import type { AssetVariantUrl } from "ui/shared/AssetVariantUrl";
import { parseAssetVariantUrl } from "ui/shared/AssetVariantUrl/z";
import type { LocalizedString, Language } from "ui/i18n";
import memoize from "memoizee";
import { z } from "zod";
import { removeDuplicates } from "evt/tools/reducers/removeDuplicates";
import { zLocalizedString, zLanguage, languages } from "ui/i18n/z";

const paletteIds = ["onyxia", "france", "ultraviolet", "verdant"] as const;

export type PaletteId = (typeof paletteIds)[number];

type Font = {
    fontFamily: string;
    dirUrl: string;
    400: string;
    ["400-italic"]?: string;
    500?: string;
    ["500-italic"]?: string;
    600?: string;
    ["600-italic"]?: string;
    700?: string;
    ["700-italic"]?: string;
};

export type AdminProvidedLink = {
    iconId: string;
    label: LocalizedString;
    url: string;
};

export const { env, injectTransferableEnvsInQueryParams } = createParsedEnvs([
    {
        "envName": "THEME_ID",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({ envValue }): PaletteId =>
            envValue === ""
                ? "onyxia"
                : (() => {
                      assert(
                          typeGuard<PaletteId>(
                              envValue,
                              id<readonly string[]>(paletteIds).includes(envValue)
                          ),
                          `${envValue} is not a valid palette. Available are: ${paletteIds.join(
                              ", "
                          )}`
                      );

                      return envValue;
                  })()
    },
    {
        "envName": "PALETTE_OVERRIDE",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({
            envValue,
            envName
        }): DeepPartial<PaletteBase> | undefined => {
            if (envValue === "") {
                return undefined;
            }

            let paletteOverride: any;

            try {
                paletteOverride = JSON.parse(envValue);
            } catch (err) {
                throw new Error(`${envName} is not parsable JSON`);
            }

            assert(
                typeGuard<DeepPartial<PaletteBase>>(
                    paletteOverride,
                    typeof paletteOverride === "object" &&
                        paletteOverride !== null &&
                        !(paletteOverride instanceof Array)
                ),
                `${envName} should be a JSON object`
            );

            return paletteOverride;
        }
    },
    {
        "envName": "HEADER_ORGANIZATION",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({ envValue }) => envValue
    },
    {
        "envName": "HEADER_USECASE_DESCRIPTION",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({ envValue }) => envValue
    },
    {
        "envName": "TERMS_OF_SERVICES",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({
            envValue,
            envName
        }): Partial<Record<Language, string>> | string | undefined => {
            if (envValue === "") {
                return undefined;
            }

            {
                const match = envValue.match(/^ *{/);

                if (match === null) {
                    return envValue;
                }
            }

            let tosUrlByLng: Partial<Record<Language, string>>;

            try {
                tosUrlByLng = JSON.parse(envValue);
            } catch {
                throw new Error(`${envName} malformed`);
            }

            {
                const languages = objectKeys(tosUrlByLng);

                languages.forEach(lang =>
                    assert(
                        id<readonly string[]>(languages).includes(lang),
                        `${lang} is not a supported languages, supported languages are: ${languages.join(
                            ", "
                        )}`
                    )
                );

                languages.forEach(lang =>
                    assert(
                        typeof tosUrlByLng[lang] === "string",
                        `terms of service malformed (${lang})`
                    )
                );
            }

            if (Object.keys(tosUrlByLng).length === 0) {
                return undefined;
            }

            return tosUrlByLng;
        }
    },
    {
        "envName": "FAVICON",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({ envValue, envName }): AssetVariantUrl => {
            assert(envValue !== "Should have default in .env");

            let faviconUrl: AssetVariantUrl;

            try {
                faviconUrl = parseAssetVariantUrl(envValue);
            } catch (error) {
                throw new Error(`${envName} is malformed. ${String(error)}`);
            }

            return faviconUrl;
        }
    },
    {
        "envName": "FONT",
        "isUsedInKeycloakTheme": true,
        "validateAndParseOrGetDefault": ({ envValue, envName }): Font => {
            assert(envValue !== "Should have default in .env");

            let font: unknown;

            try {
                font = JSON.parse(envValue);
            } catch {
                throw new Error(`${envName} is not a valid JSON`);
            }

            const zFont = z.object({
                "fontFamily": z.string(),
                "dirUrl": z.string(),
                "400": z.string(),
                "400-italic": z.string().optional(),
                "500": z.string().optional(),
                "500-italic": z.string().optional(),
                "600": z.string().optional(),
                "600-italic": z.string().optional(),
                "700": z.string().optional(),
                "700-italic": z.string().optional()
            });

            assert<Equals<ReturnType<(typeof zFont)["parse"]>, Font>>();

            try {
                zFont.parse(font);
            } catch (error) {
                throw new Error(
                    `${envName} is not a valid Font object: ${String(error)}`
                );
            }
            assert(is<Font>(font));

            return font;
        }
    },
    {
        "envName": "EXTRA_LEFTBAR_ITEMS",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
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
                            )
                    ) === undefined,
                errorMessage
            );

            return extraLeftBarItems;
        }
    },
    {
        "envName": "HEADER_LINKS",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
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
                            )
                    ) === undefined,
                errorMessage
            );

            return extraLeftBarItems;
        }
    },
    {
        "envName": "DISABLE_HOME_PAGE",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        "envName": "DISABLE_AUTO_LAUNCH",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        "envName": "HEADER_HIDE_ONYXIA",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        "envName": "GLOBAL_ALERT",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            if (envValue === "") {
                return undefined;
            }

            if (/^\s*\{.*\}\s*$/.test(envValue.replace(/\r?\n/g, " "))) {
                const zSchema = z.object({
                    "severity": z.enum(["error", "warning", "info", "success"]),
                    "message": zLocalizedString
                });

                let parsedEnvValue: z.infer<typeof zSchema>;

                try {
                    parsedEnvValue = JSON.parse(envValue);

                    zSchema.parse(parsedEnvValue);
                } catch {
                    throw new Error(`${envName} is malformed, ${envValue}`);
                }

                return parsedEnvValue;
            }

            return {
                "severity": "info" as const,
                "message": envValue
            };
        }
    },
    {
        "envName": "DISABLE_PERSONAL_INFOS_INJECTION_IN_GROUP",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue, envName }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `${envName} should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        "envName": "DISABLE_COMMAND_BAR",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue }) => {
            const possibleValues = ["true", "false"];

            assert(
                possibleValues.indexOf(envValue) >= 0,
                `DISABLE_COMMAND_BAR should either be ${possibleValues.join(" or ")}`
            );

            return envValue === "true";
        }
    },
    {
        "envName": "ENABLED_LANGUAGES",
        "isUsedInKeycloakTheme": false,
        "validateAndParseOrGetDefault": ({ envValue }): readonly Language[] => {
            try {
                if (envValue === "") {
                    return languages;
                }

                return envValue
                    .split(",")
                    .map(part => part.trim())
                    .reduce(...removeDuplicates<string>())
                    .map(language => {
                        try {
                            return zLanguage.parse(language);
                        } catch {
                            throw new Error(
                                `Language ${language} not supported by Onyxia. Supported languages are ${languages.join(
                                    ", "
                                )}`
                            );
                        }
                    });
            } catch (error) {
                throw new Error(
                    JSON.stringify(process.env.NODE_ENV) + " " + String(error)
                );
            }
        }
    }
]);

type Entry<N extends EnvName> = {
    envName: N;
    validateAndParseOrGetDefault: (params: { envValue: string; envName: N }) => any;
    isUsedInKeycloakTheme: boolean;
};

function createParsedEnvs<Parser extends Entry<EnvName>>(
    parsers: Parser[]
): {
    env: {
        [K in Parser["envName"]]: ReturnType<
            Extract<Parser, { envName: K }>["validateAndParseOrGetDefault"]
        >;
    };
    injectTransferableEnvsInQueryParams: (url: string) => string;
} {
    const parsedValueOrGetterByEnvName: Record<string, any> = {};

    const injectFunctions: ((url: string) => string)[] = [];

    const replacePUBLIC_URL = (envValue: string) =>
        envValue.replace(
            /%PUBLIC_URL%/g,
            kcLoginThemeContext === undefined || process.env.NODE_ENV === "development"
                ? process.env.PUBLIC_URL
                : `${kcLoginThemeContext.url.resourcesPath}/build`
        );

    for (const parser of parsers) {
        const { envName, validateAndParseOrGetDefault, isUsedInKeycloakTheme } = parser;

        const isProductionKeycloak =
            process.env.NODE_ENV === "production" && kcLoginThemeContext !== undefined;

        const getEnvValue = () => {
            if (!isUsedInKeycloakTheme && kcLoginThemeContext !== undefined) {
                throw new Error(
                    `Env ${envName} not labeled as being used in keycloak theme`
                );
            }

            look_in_url: {
                if (!isUsedInKeycloakTheme) {
                    break look_in_url;
                }

                const result = retrieveParamFromUrl({
                    "url": window.location.href,
                    "name": envName
                });

                if (!result.wasPresent) {
                    break look_in_url;
                }

                const { newUrl, value: envValue } = result;

                updateSearchBarUrl(newUrl);

                if (isProductionKeycloak) {
                    localStorage.setItem(envName, envValue);
                }

                return envValue;
            }

            read_what_have_been_injected_by_cra_envs: {
                if (isProductionKeycloak) {
                    break read_what_have_been_injected_by_cra_envs;
                }

                return getEnv()[envName];
            }

            restore_from_local_storage: {
                if (!isProductionKeycloak) {
                    break restore_from_local_storage;
                }

                const envValue = localStorage.getItem(envName);

                if (envValue === null) {
                    break restore_from_local_storage;
                }

                return envValue;
            }

            // NOTE: Here we are in production Keycloak
            // We get the default that was injected at build time. (cra-envs do not work with keycloak)
            // This can happen when the user has never navigated to the login page via onyxia.
            return getEnv()[envName];
        };

        if (isUsedInKeycloakTheme) {
            const envValue = getEnvValue();

            injectFunctions.push(
                url => addParamToUrl({ url, "name": envName, "value": envValue }).newUrl
            );

            parsedValueOrGetterByEnvName[envName] = validateAndParseOrGetDefault({
                "envValue": replacePUBLIC_URL(envValue),
                envName
            });
        } else {
            parsedValueOrGetterByEnvName[envName] = memoize(() =>
                validateAndParseOrGetDefault({
                    "envValue": replacePUBLIC_URL(getEnvValue()),
                    envName
                })
            );
        }
    }

    const env: any = new Proxy(
        {},
        {
            "get": (...[, envName]) => {
                assert(typeof envName === "string");

                assert(envName in parsedValueOrGetterByEnvName);

                const parsedValueOrGetter = parsedValueOrGetterByEnvName[envName];

                return typeof parsedValueOrGetter === "function"
                    ? parsedValueOrGetter()
                    : parsedValueOrGetter;
            }
        }
    );

    function injectTransferableEnvsInQueryParams(url: string): string {
        let newUrl = url;

        for (const inject of injectFunctions) {
            newUrl = inject(newUrl);
        }

        return newUrl;
    }

    return { env, injectTransferableEnvsInQueryParams };
}
