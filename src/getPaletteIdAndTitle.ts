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

            console.log("Get paletteId from URL");

            return paletteId;
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
                    new RegExp(`${symToStr({ THEME })}=([^;]+);?`),
                );
            })();

            if (!match) {
                break scope;
            }

            const paletteId = match[1];

            console.log("Get paletteId from Keycloak's client description");

            return paletteId;
        }

        scope: {
            if (kcContext !== undefined) {
                break scope;
            }

            console.log("Get paletteId from ENV");

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

            console.log("Get paletteId from localStorage");

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

        console.log("Get title from url param");

        return title;
    }

    scope: {
        if (kcContext === undefined) {
            break scope;
        }

        const title = kcContext.client.name;

        if (!title) {
            break scope;
        }

        console.log("Get title from Keycloak's client name");

        return title;
    }

    scope: {
        if (kcContext !== undefined) {
            break scope;
        }

        console.log("Get title from ENV");

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

        console.log("Get title from localStorage");

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
