import "minimal-polyfills/Object.fromEntries";
import { getEnv } from "env";
import { kcContext } from "app/components/KcApp/kcContext";
import {
    retrieveParamFromUrl,
    addParamToUrl,
    updateSearchBarUrl,
} from "powerhooks/tools/urlSearchParams";
import memoize from "memoizee";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";

const paletteIdParamName = "palette";
const titleParamName = "title";

const paletteIds = ["onyxia", "france", "ultraviolet"] as const;

export type PaletteId = typeof paletteIds[number];

export const getPaletteId = memoize(() => {
    function matchPaletteId(paletteId: string): paletteId is PaletteId {
        return id<readonly string[]>(paletteIds).includes(paletteId);
    }

    const paletteId = (() => {
        scope: {
            const result = retrieveParamFromUrl({
                "url": window.location.href,
                "name": paletteIdParamName,
            });

            if (!result.wasPresent) {
                break scope;
            }

            const { newUrl, value: paletteId } = result;

            updateSearchBarUrl(newUrl);

            if (kcContext !== undefined) {
                localStorage.setItem(paletteIdParamName, paletteId);
            }

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

            const paletteId = localStorage.getItem(paletteIdParamName);

            if (paletteId === null) {
                break scope;
            }

            if (!matchPaletteId(paletteId)) {
                localStorage.removeItem(paletteIdParamName);

                break scope;
            }

            return paletteId;
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
    scope: {
        const result = retrieveParamFromUrl({
            "url": window.location.href,
            "name": titleParamName,
        });

        if (!result.wasPresent) {
            break scope;
        }

        const { newUrl, value: title } = result;

        updateSearchBarUrl(newUrl);

        if (kcContext !== undefined) {
            localStorage.setItem(titleParamName, title);
        }

        return title;
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

        const title = localStorage.getItem(titleParamName);

        if (title === null) {
            break scope;
        }

        return title;
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
