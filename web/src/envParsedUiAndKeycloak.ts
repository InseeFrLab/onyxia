/**
 * Here are the envs that are both accessible in the web app and in the Onyxia Keycloak theme.
 * When redirecting to the login page we transfer those values as url query parameters.
 *
 * BE MINDFUL: This module should be evaluated as soon as possible
 * to cleanup the url query parameter.
 */
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

const paletteIds = ["onyxia", "france", "ultraviolet", "verdant"] as const;

export type PaletteId = (typeof paletteIds)[number];

export const { THEME_ID } = registerEnvParser({
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

export const { PALETTE_OVERRIDE } = registerEnvParser({
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

export const { HEADER_ORGANIZATION } = registerEnvParser({
    "envName": "HEADER_ORGANIZATION" as const,
    "validateAndParseOrGetDefault": ({ envValue }) => envValue
});

export const { HEADER_USECASE_DESCRIPTION } = registerEnvParser({
    "envName": "HEADER_USECASE_DESCRIPTION",
    "validateAndParseOrGetDefault": ({ envValue }) => envValue
});

export const { TERMS_OF_SERVICES } = registerEnvParser({
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

export const { FAVICON } = registerEnvParser({
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

export const { FONT } = registerEnvParser({
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

function registerEnvParser<T, N extends EnvName>(params: {
    envName: N;
    validateAndParseOrGetDefault: (params: { envValue: string; envName: string }) => T;
}): Record<N, T> &
    Record<`inject${Capitalize<N>}InSearchParams`, (url: string) => string> {
    const { envName, validateAndParseOrGetDefault } = params;

    const isProductionKeycloak =
        process.env.NODE_ENV === "production" && kcLoginThemeContext !== undefined;

    const serializedValue = (() => {
        look_in_url: {
            const result = retrieveParamFromUrl({
                "url": window.location.href,
                "name": envName
            });

            if (!result.wasPresent) {
                break look_in_url;
            }

            const { newUrl, value: serializedValue } = result;

            updateSearchBarUrl(newUrl);

            if (isProductionKeycloak) {
                localStorage.setItem(envName, serializedValue);
            }

            return serializedValue;
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

            const serializedValue = localStorage.getItem(envName);

            if (serializedValue === null) {
                break restore_from_local_storage;
            }

            return serializedValue;
        }

        // NOTE: Here we are in production Keycloak
        // We get the default that was injected at build time. (cra-envs do not work with keycloak)
        // This can happen when the user has never navigated to the login page via onyxia.
        return getEnv()[envName];
    })();

    function replaceAllPublicUrl(valueStr: string): string {
        return valueStr.replace(
            /%PUBLIC_URL%/g,
            kcLoginThemeContext === undefined || process.env.NODE_ENV === "development"
                ? process.env.PUBLIC_URL
                : `${kcLoginThemeContext.url.resourcesPath}/build`
        );
    }

    injectTransferableEnvsInQueryParams.injectFunctions.push(
        url => addParamToUrl({ url, "name": envName, "value": serializedValue }).newUrl
    );

    return {
        [envName]: validateAndParseOrGetDefault({
            "envValue": replaceAllPublicUrl(serializedValue),
            envName
        })
    } as any;
}
