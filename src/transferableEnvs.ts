/**
 * Here we deal with the envs that should be transferred over to the
 * Keycloak pages. (kcApp).
 * Remember that in the pages served by Keycloak we cant use getEnv()
 * so we need to pass the params as url query parameters
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

const { palette, injectPaletteInSearchParams } = getTransferableEnv({
    "name": "palette" as const,
    "getSerializedValueFromEnv": () => getEnv().THEME,
    "parse": (valueStr): PaletteId =>
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

export { palette };

const { title, injectTitleInSearchParams } = getTransferableEnv({
    "name": "title" as const,
    "getSerializedValueFromEnv": () => getEnv().TITLE,
    "parse": (valueStr): string => valueStr,
});

export { title };

export function injectTransferableEnvsInSearchParams(url: string): string {
    let newUrl = url;

    newUrl = injectPaletteInSearchParams(newUrl);
    newUrl = injectTitleInSearchParams(newUrl);

    return newUrl;
}

function getTransferableEnv<T, Name extends string>(params: {
    name: Name;
    getSerializedValueFromEnv: () => string;
    parse: (serializedValue: string) => T;
}): Record<Name, T> &
    Record<`inject${Capitalize<Name>}InSearchParams`, (url: string) => string> {
    const { name, getSerializedValueFromEnv, parse } = params;

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
        [name]: parse(serializedValue),
        [`inject${capitalize(name)}InSearchParams`]: (url: string) =>
            addParamToUrl({ url, name, "value": serializedValue }).newUrl,
    } as any;
}
