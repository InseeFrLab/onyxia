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
    let paletteId: PaletteId | undefined = undefined;

    {
        const result = retrieveParamFromUrl({
            "url": window.location.href,
            "name": paletteIdParamName,
        });

        if (result.wasPresent) {
            updateSearchBarUrl(result.newUrl);

            paletteId = result.value as PaletteId;
        }
    }

    scope: {
        if (paletteId !== undefined || kcContext === undefined) {
            break scope;
        }

        const match = kcContext.client.description?.match(/THEME=([^;]+);/);

        if (!match) {
            break scope;
        }

        paletteId = match[1] as PaletteId;
    }

    scope: {
        if (paletteId !== undefined || kcContext !== undefined) {
            break scope;
        }

        paletteId = getEnv().THEME as PaletteId;
    }

    if (paletteId === undefined) {
        paletteId = "onyxia";
    }

    assert(
        id<readonly string[]>(paletteIds).includes(paletteId),
        `${paletteId} is not a valid theme. Available themes are: ${paletteIds}`,
    );

    return paletteId;
});

export const getTitle = memoize(() => {
    let title: string | undefined = undefined;

    {
        const result = retrieveParamFromUrl({
            "url": window.location.href,
            "name": titleParamName,
        });

        if (result.wasPresent) {
            updateSearchBarUrl(result.newUrl);

            title = result.value;
        }
    }

    scope: {
        if (title !== undefined || kcContext === undefined) {
            break scope;
        }

        title = kcContext.client.name;
    }

    scope: {
        if (title !== undefined || kcContext !== undefined) {
            break scope;
        }

        title = getEnv().TITLE;
    }

    if (title === undefined) {
        title = "";
    }

    return title;
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
