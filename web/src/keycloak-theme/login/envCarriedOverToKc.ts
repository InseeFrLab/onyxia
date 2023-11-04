/**
 * Here are the envs that are both accessible in the regular app and on
 * the Keycloak pages.
 * When redirecting to the login page we transfer those values as url
 * query parameters.
 * In the pages served by Keycloak we can't use getEnv()
 * so we need to pass the params as url query parameters.
 *
 * BE MINDFUL: This module should be evaluated as soon as possible
 * to cleanup the url query parameter.
 */

import "minimal-polyfills/Object.fromEntries";
import { getEnv } from "env";
import { kcContext } from "./kcContext";
import {
    retrieveParamFromUrl,
    addParamToUrl,
    updateSearchBarUrl
} from "powerhooks/tools/urlSearchParams";
import { assert, type Equals } from "tsafe/assert";
import { is } from "tsafe/is";
import { isStorybook } from "ui/tools/isStorybook";
import { capitalize } from "tsafe/capitalize";
import { typeGuard } from "tsafe/typeGuard";
import { id } from "tsafe/id";
import { objectKeys } from "tsafe/objectKeys";
import type { Language } from "ui/i18n";
import type { PaletteBase } from "onyxia-ui";
import type { DeepPartial } from "keycloakify/tools/DeepPartial";
import type { AssetVariantUrl } from "ui/shared/AssetVariantUrl";
import { parseAssetVariantUrl } from "ui/shared/AssetVariantUrl/z";
import { symToStr } from "tsafe/symToStr";
import { z } from "zod";

const paletteIds = ["onyxia", "france", "ultraviolet", "verdant"] as const;

export type PaletteId = (typeof paletteIds)[number];

function replaceAllPublicUrl(valueStr: string): string {
    return valueStr.replace(
        /%PUBLIC_URL%/g,
        kcContext === undefined || process.env.NODE_ENV === "development"
            ? process.env.PUBLIC_URL
            : `${kcContext.url.resourcesPath}/build`
    );
}

const { THEME_ID, injectTHEME_IDInSearchParams } = getTransferableEnv({
    "name": "THEME_ID" as const,
    "getSerializedValueFromEnv": () => getEnv().THEME_ID,
    "validateAndParseOrGetDefault": (valueStr): PaletteId =>
        valueStr === ""
            ? "onyxia"
            : (() => {
                  assert(
                      typeGuard<PaletteId>(
                          valueStr,
                          id<readonly string[]>(paletteIds).includes(valueStr)
                      ),
                      `${valueStr} is not a valid palette. Available are: ${paletteIds.join(
                          ", "
                      )}`
                  );

                  return valueStr;
              })()
});

export { THEME_ID };

const { PALETTE_OVERRIDE, injectPALETTE_OVERRIDEInSearchParams } = getTransferableEnv({
    "name": "PALETTE_OVERRIDE" as const,
    "getSerializedValueFromEnv": () => getEnv().PALETTE_OVERRIDE,
    "validateAndParseOrGetDefault": (valueStr): DeepPartial<PaletteBase> | undefined => {
        if (valueStr === "") {
            return undefined;
        }

        let paletteOverride: any;

        try {
            paletteOverride = JSON.parse(valueStr);
        } catch (err) {
            throw new Error(`palette override is not parsable JSON`, {
                "cause": err
            });
        }

        assert(
            typeGuard<DeepPartial<PaletteBase>>(
                paletteOverride,
                typeof paletteOverride === "object" &&
                    paletteOverride !== null &&
                    !(paletteOverride instanceof Array)
            ),
            `palette override should be a JSON object`
        );

        return paletteOverride;
    }
});

export { PALETTE_OVERRIDE };

const { HEADER_ORGANIZATION, injectHEADER_ORGANIZATIONInSearchParams } =
    getTransferableEnv({
        "name": "HEADER_ORGANIZATION" as const,
        "getSerializedValueFromEnv": () => getEnv().HEADER_ORGANIZATION,
        "validateAndParseOrGetDefault": (valueStr): string => valueStr
    });

export { HEADER_ORGANIZATION };

const { HEADER_USECASE_DESCRIPTION, injectHEADER_USECASE_DESCRIPTIONInSearchParams } =
    getTransferableEnv({
        "name": "HEADER_USECASE_DESCRIPTION" as const,
        "getSerializedValueFromEnv": () => getEnv().HEADER_USECASE_DESCRIPTION,
        "validateAndParseOrGetDefault": (valueStr): string => valueStr
    });

export { HEADER_USECASE_DESCRIPTION };

const { TERMS_OF_SERVICES, injectTERMS_OF_SERVICESInSearchParams } = getTransferableEnv({
    "name": "TERMS_OF_SERVICES" as const,
    "getSerializedValueFromEnv": () => getEnv().TERMS_OF_SERVICES,
    "validateAndParseOrGetDefault": (
        valueStr
    ): Partial<Record<Language, string>> | string | undefined => {
        if (valueStr === "") {
            return undefined;
        }

        {
            const match = valueStr.match(/^ *{/);

            if (match === null) {
                return valueStr;
            }
        }

        let tosUrlByLng: Partial<Record<Language, string>>;

        try {
            tosUrlByLng = JSON.parse(valueStr);
        } catch {
            throw new Error("Terms of services malformed");
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

export { TERMS_OF_SERVICES };

const { FAVICON, injectFAVICONInSearchParams } = getTransferableEnv({
    "name": "FAVICON" as const,
    "getSerializedValueFromEnv": () => getEnv().FAVICON,
    "validateAndParseOrGetDefault": (valueStr): AssetVariantUrl => {
        assert(valueStr !== "Should have default in .env");

        valueStr = replaceAllPublicUrl(valueStr);

        let faviconUrl: AssetVariantUrl;

        try {
            faviconUrl = parseAssetVariantUrl(valueStr);
        } catch (error) {
            throw new Error(`${symToStr({ FAVICON })} is malformed. ${String(error)}`);
        }

        return faviconUrl;
    }
});

export { FAVICON };

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

const { FONT, injectFONTInSearchParams } = getTransferableEnv({
    "name": "FONT" as const,
    "getSerializedValueFromEnv": () => getEnv().FONT,
    "validateAndParseOrGetDefault": (valueStr): Font => {
        assert(valueStr !== "Should have default in .env");

        valueStr = replaceAllPublicUrl(valueStr);

        let font: unknown;

        try {
            font = JSON.parse(valueStr);
        } catch {
            throw new Error(`${valueStr} is not a valid JSON`);
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
            throw new Error(`${valueStr} is not a valid Font object: ${String(error)}`);
        }
        assert(is<Font>(font));

        return font;
    }
});

export { FONT };

export function injectTransferableEnvsInSearchParams(url: string): string {
    let newUrl = url;

    for (const inject of [
        injectTHEME_IDInSearchParams,
        injectHEADER_ORGANIZATIONInSearchParams,
        injectHEADER_USECASE_DESCRIPTIONInSearchParams,
        injectTERMS_OF_SERVICESInSearchParams,
        injectPALETTE_OVERRIDEInSearchParams,
        injectFAVICONInSearchParams,
        injectFONTInSearchParams
    ]) {
        newUrl = inject(newUrl);
    }

    return newUrl;
}

function getTransferableEnv<T, Name extends string>(params: {
    name: Name;
    getSerializedValueFromEnv: () => string;
    validateAndParseOrGetDefault: (serializedValue: string) => T;
}): Record<Name, T> &
    Record<`inject${Capitalize<Name>}InSearchParams`, (url: string) => string> {
    const { name, getSerializedValueFromEnv, validateAndParseOrGetDefault } = params;

    const isKeycloak = process.env.NODE_ENV === "production" && kcContext !== undefined;

    const serializedValue = (() => {
        scope: {
            const result = retrieveParamFromUrl({
                "url": window.location.href,
                name
            });

            if (!result.wasPresent) {
                break scope;
            }

            const { newUrl, value: serializedValue } = result;

            updateSearchBarUrl(newUrl);

            if (isKeycloak) {
                localStorage.setItem(name, serializedValue);
            }

            return serializedValue;
        }

        scope: {
            if (isKeycloak || isStorybook) {
                break scope;
            }

            return getSerializedValueFromEnv();
        }

        scope: {
            if (!isKeycloak) {
                break scope;
            }

            const serializedValue = localStorage.getItem(name);

            if (serializedValue === null) {
                break scope;
            }

            return serializedValue;
        }

        return getSerializedValueFromEnv();
    })();

    return {
        [name]: validateAndParseOrGetDefault(serializedValue),
        [`inject${capitalize(name)}InSearchParams`]: (url: string) =>
            addParamToUrl({ url, name, "value": serializedValue }).newUrl
    } as any;
}
