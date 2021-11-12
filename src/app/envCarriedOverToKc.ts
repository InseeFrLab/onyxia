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
import { kcContext } from "app/components/KcApp/kcContext";
import {
    retrieveParamFromUrl,
    addParamToUrl,
    updateSearchBarUrl,
} from "powerhooks/tools/urlSearchParams";
import { assert } from "tsafe/assert";
import { isStorybook } from "app/tools/isStorybook";
import { capitalize } from "tsafe/capitalize";
import { typeGuard } from "tsafe/typeGuard";
import { id } from "tsafe/id";

const paletteIds = ["onyxia", "france", "ultraviolet"] as const;

export type PaletteId = typeof paletteIds[number];

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
                          id<readonly string[]>(paletteIds).includes(valueStr),
                      ),
                      `${valueStr} is not a valid palette. Available are: ${paletteIds.join(
                          ", ",
                      )}`,
                  );

                  return valueStr;
              })(),
});

export { THEME_ID };

const { HEADER_TITLE, injectHEADER_TITLEInSearchParams } = getTransferableEnv({
    "name": "HEADER_TITLE" as const,
    "getSerializedValueFromEnv": () => getEnv().HEADER_TITLE,
    "validateAndParseOrGetDefault": (valueStr): string => valueStr,
});

export { HEADER_TITLE };

export function injectTransferableEnvsInSearchParams(url: string): string {
    let newUrl = url;

    newUrl = injectTHEME_IDInSearchParams(newUrl);
    newUrl = injectHEADER_TITLEInSearchParams(newUrl);

    return newUrl;
}

function getTransferableEnv<T, Name extends string>(params: {
    name: Name;
    getSerializedValueFromEnv: () => string;
    validateAndParseOrGetDefault: (serializedValue: string) => T;
}): Record<Name, T> &
    Record<`inject${Capitalize<Name>}InSearchParams`, (url: string) => string> {
    const { name, getSerializedValueFromEnv, validateAndParseOrGetDefault } = params;

    const serializedValue = (() => {
        scope: {
            const result = retrieveParamFromUrl({
                "url": window.location.href,
                name,
            });

            if (!result.wasPresent) {
                break scope;
            }

            const { newUrl, value: serializedValue } = result;

            updateSearchBarUrl(newUrl);

            if (kcContext !== undefined) {
                localStorage.setItem(name, serializedValue);
            }

            return serializedValue;
        }

        scope: {
            if (kcContext !== undefined || isStorybook) {
                break scope;
            }

            return getSerializedValueFromEnv();
        }

        scope: {
            if (kcContext === undefined) {
                break scope;
            }

            const serializedValue = localStorage.getItem(name);

            if (serializedValue === null) {
                break scope;
            }

            return serializedValue;
        }

        return "";
    })();

    return {
        [name]: validateAndParseOrGetDefault(serializedValue),
        [`inject${capitalize(name)}InSearchParams`]: (url: string) =>
            addParamToUrl({ url, name, "value": serializedValue }).newUrl,
    } as any;
}
