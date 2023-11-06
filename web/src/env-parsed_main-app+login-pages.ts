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
import type { Language } from "ui/i18n";
import type { PaletteBase } from "onyxia-ui";
import type { DeepPartial } from "keycloakify/tools/DeepPartial";
import type { AssetVariantUrl } from "ui/shared/AssetVariantUrl";
import { parseAssetVariantUrl } from "ui/shared/AssetVariantUrl/z";
import { z } from "zod";
import memoize from "memoizee";

const paletteIds = ["onyxia", "france", "ultraviolet", "verdant"] as const;

export type PaletteId = (typeof paletteIds)[number];

export const { parsed_THEME_ID } = parseEnv({
    "isUsedInKeycloakTheme": true,
    "envName": "THEME_ID",
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
});

export const { parsed_PALETTE_OVERRIDE } = parseEnv({
    "isUsedInKeycloakTheme": true,
    "envName": "PALETTE_OVERRIDE",
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
});

export const { parsed_HEADER_ORGANIZATION } = parseEnv({
    "isUsedInKeycloakTheme": true,
    "envName": "HEADER_ORGANIZATION" as const,
    "validateAndParseOrGetDefault": ({ envValue }) => envValue
});

export const { parsed_HEADER_USECASE_DESCRIPTION } = parseEnv({
    "isUsedInKeycloakTheme": true,
    "envName": "HEADER_USECASE_DESCRIPTION",
    "validateAndParseOrGetDefault": ({ envValue }) => envValue
});

export const { parsed_TERMS_OF_SERVICES } = parseEnv({
    "isUsedInKeycloakTheme": true,
    "envName": "TERMS_OF_SERVICES",
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
});

export const { parsed_FAVICON } = parseEnv({
    "isUsedInKeycloakTheme": true,
    "envName": "FAVICON",
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
});

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

export const { parsed_FONT } = parseEnv({
    "isUsedInKeycloakTheme": true,
    "envName": "FONT",
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
            throw new Error(`${envName} is not a valid Font object: ${String(error)}`);
        }
        assert(is<Font>(font));

        return font;
    }
});

export function injectTransferableEnvsInQueryParams(url: string): string {
    let newUrl = url;

    for (const inject of injectTransferableEnvsInQueryParams.injectFunctions) {
        newUrl = inject(newUrl);
    }

    return newUrl;
}

injectTransferableEnvsInQueryParams.injectFunctions = id<((url: string) => string)[]>([]);

function parseEnv<T, N extends EnvName>(params: {
    isUsedInKeycloakTheme: true;
    envName: N;
    validateAndParseOrGetDefault: (params: { envValue: string; envName: N }) => T;
}): Record<`parsed_${N}`, T>;
function parseEnv<T, N extends EnvName>(params: {
    isUsedInKeycloakTheme: false;
    envName: N;
    validateAndParseOrGetDefault: (params: { envValue: string; envName: N }) => T;
}): Record<`getParsed_${N}`, () => T>;
function parseEnv<T, N extends EnvName>(params: {
    isUsedInKeycloakTheme: boolean;
    envName: N;
    validateAndParseOrGetDefault: (params: { envValue: string; envName: N }) => T;
}): any {
    const { envName, validateAndParseOrGetDefault, isUsedInKeycloakTheme } = params;

    const isProductionKeycloak =
        process.env.NODE_ENV === "production" && kcLoginThemeContext !== undefined;

    const envValue = (() => {
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
    })();

    if (isUsedInKeycloakTheme) {
        injectTransferableEnvsInQueryParams.injectFunctions.push(
            url => addParamToUrl({ url, "name": envName, "value": envValue }).newUrl
        );
    }

    const envValueWithPublicUrlReplaced = envValue.replace(
        /%PUBLIC_URL%/g,
        kcLoginThemeContext === undefined || process.env.NODE_ENV === "development"
            ? process.env.PUBLIC_URL
            : `${kcLoginThemeContext.url.resourcesPath}/build`
    );

    return isUsedInKeycloakTheme
        ? {
              [`parsed_${envName}`]: validateAndParseOrGetDefault({
                  "envValue": envValueWithPublicUrlReplaced,
                  envName
              })
          }
        : {
              [`getParsed_${envName}`]: memoize(() =>
                  validateAndParseOrGetDefault({
                      "envValue": envValueWithPublicUrlReplaced,
                      envName
                  })
              )
          };
}
