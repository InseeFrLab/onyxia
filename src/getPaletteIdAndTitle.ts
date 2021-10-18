import "minimal-polyfills/Object.fromEntries";
import { getEnv, envNames } from "env";
import { kcContext } from "app/components/KcApp/kcContext";
import {
    retrieveParamFromUrl,
    addParamToUrl,
    updateSearchBarUrl,
} from "powerhooks/tools/urlSearchParams";
import memoize from "memoizee";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { symToStr } from "tsafe/symToStr";

const paletteIdParamName = "palette";
const titleParamName = "title";

const paletteIds = ["onyxia", "france", "ultraviolet"] as const;

export type PaletteId = typeof paletteIds[number];

export const getPaletteId = memoize(() => {
    function matchPaletteId(paletteId: string): paletteId is PaletteId {
        return id<readonly string[]>(paletteIds).includes(paletteId);
    }

    const paletteId = (() => {
        {
            const result = retrieveParamFromUrl({
                "url": window.location.href,
                "name": paletteIdParamName,
            });

            if (result.wasPresent) {
                updateSearchBarUrl(result.newUrl);

                return result.value;
            }
        }

        scope: {
            if (kcContext === undefined) {
                break scope;
            }

            const match = (() => {
                const { THEME } = Object.fromEntries(
                    envNames.map(envName => [envName, ""]),
                ) as ReturnType<typeof getEnv>;

                return kcContext.client.description?.match(
                    new RegExp(`${symToStr({ THEME })}=([^;]+);`),
                );
            })();

            if (!match) {
                break scope;
            }

            const paletteId = match[1];

            localStorage.setItem(paletteIdParamName, paletteId);

            return paletteId;
        }

        scope: {
            if (kcContext !== undefined) {
                break scope;
            }

            return getEnv().THEME;
        }

        scope: {
            if (kcContext === undefined) {
                break scope;
            }

            const value = localStorage.getItem(paletteIdParamName);

            if (value === null) {
                break scope;
            }

            if (!matchPaletteId(value)) {
                localStorage.removeItem(paletteIdParamName);

                break scope;
            }

            return value;
        }

        return id<PaletteId>("onyxia");
    })();

    assert(
        matchPaletteId(paletteId),
        `${paletteId} is not a valid theme. Available themes are: ${paletteIds}`,
    );

    return paletteId;
});

export const getTitle = memoize(() => {
    {
        const result = retrieveParamFromUrl({
            "url": window.location.href,
            "name": titleParamName,
        });

        if (result.wasPresent) {
            updateSearchBarUrl(result.newUrl);

            return result.value;
        }
    }

    scope: {
        if (kcContext === undefined) {
            break scope;
        }

        const value = kcContext.client.name;

        if (!value) {
            break scope;
        }

        localStorage.setItem(titleParamName, value);

        return value;
    }

    scope: {
        if (kcContext !== undefined) {
            break scope;
        }

        return getEnv().TITLE;
    }

    scope: {
        if (kcContext === undefined) {
            break scope;
        }

        const value = localStorage.getItem(titleParamName);

        if (value === null) {
            break scope;
        }

        return value;
    }

    return "";
});

export function injectPaletteIdAndTitleInSearchParams(url: string): string {
    let newUrl = url;

    (
        [
            [paletteIdParamName, getPaletteId()],
            [titleParamName, getTitle()],
        ] as const
    ).forEach(
        ([name, value]) =>
            (newUrl = addParamToUrl({ "url": newUrl, name, value }).newUrl),
    );

    return newUrl;
}
