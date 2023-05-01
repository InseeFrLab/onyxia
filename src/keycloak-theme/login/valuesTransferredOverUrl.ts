import { kcContext } from "./kcContext";
import {
    retrieveParamFromUrl,
    addParamToUrl,
    updateSearchBarUrl
} from "powerhooks/tools/urlSearchParams";
import { capitalize } from "tsafe/capitalize";

export const { foo, addFooToQueryParams } = (() => {
    const queryParamName = "foo";

    type Type = { foo: number };

    const value = (() => {
        const unparsedValue = read({ queryParamName });

        if (unparsedValue === undefined) {
            return undefined;
        }

        return JSON.parse(unparsedValue) as Type;
    })();

    function addToUrlQueryParams(params: { url: string; value: Type }): string {
        const { url, value } = params;

        return addParamToUrl({
            url,
            "name": queryParamName,
            "value": JSON.stringify(value)
        }).newUrl;
    }

    const out = {
        [queryParamName]: value,
        [`add${capitalize(queryParamName)}ToQueryParams` as const]: addToUrlQueryParams
    } as const;

    return out;
})();

export const { bar, addBarToQueryParams } = (() => {
    const queryParamName = "bar";

    type Type = string;

    const value = (() => {
        const unparsedValue = read({ queryParamName });

        if (unparsedValue === undefined) {
            return undefined;
        }

        return JSON.parse(unparsedValue) as Type;
    })();

    function addToUrlQueryParams(params: { url: string; value: Type }): string {
        const { url, value } = params;

        return addParamToUrl({
            url,
            "name": queryParamName,
            "value": JSON.stringify(value)
        }).newUrl;
    }

    const out = {
        [queryParamName]: value,
        [`add${capitalize(queryParamName)}ToQueryParams` as const]: addToUrlQueryParams
    } as const;

    return out;
})();

function read(params: { queryParamName: string }): string | undefined {
    if (kcContext === undefined || process.env.NODE_ENV !== "production") {
        //NOTE: We do something only if we are really in Keycloak
        return undefined;
    }

    const { queryParamName } = params;

    read_from_url: {
        const result = retrieveParamFromUrl({
            "url": window.location.href,
            "name": queryParamName
        });

        if (!result.wasPresent) {
            break read_from_url;
        }

        const { newUrl, value: serializedValue } = result;

        updateSearchBarUrl(newUrl);

        localStorage.setItem(queryParamName, serializedValue);

        return serializedValue;
    }

    //Reading from local storage
    const serializedValue = localStorage.getItem(queryParamName);

    if (serializedValue === null) {
        throw new Error(
            `Missing ${queryParamName} in URL when redirecting to login page`
        );
    }

    return serializedValue;
}
