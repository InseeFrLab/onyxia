import { getSearchParam, addOrUpdateSearchParam } from "powerhooks/tools/urlSearchParams";
import { updateSearchBarUrl } from "powerhooks/tools/updateSearchBar";

const LOCAL_STORAGE_AND_SEARCH_PARAM_NAME = "onyxia-instance-public-url";

export function getOnyxiaInstancePublicUrl() {
    look_in_url: {
        const { wasPresent, value, url_withoutTheParam } = getSearchParam({
            name: LOCAL_STORAGE_AND_SEARCH_PARAM_NAME,
            url: window.location.href
        });

        if (!wasPresent) {
            break look_in_url;
        }

        localStorage.setItem(LOCAL_STORAGE_AND_SEARCH_PARAM_NAME, value);

        updateSearchBarUrl(url_withoutTheParam);

        return value;
    }

    look_in_localStorage: {
        const value = localStorage.getItem(LOCAL_STORAGE_AND_SEARCH_PARAM_NAME);

        if (value === null) {
            break look_in_localStorage;
        }

        return value;
    }

    console.warn(
        "No Onyxia instance public URL found in the URL or in the local storage."
    );

    return "/";
}

export function injectOnyxiaInstancePublicUrl(params: {
    authorizationUrl: string;
    onyxiaInstancePublicUrl: string;
}): string {
    const { authorizationUrl, onyxiaInstancePublicUrl } = params;

    return addOrUpdateSearchParam({
        url: authorizationUrl,
        name: LOCAL_STORAGE_AND_SEARCH_PARAM_NAME,
        value: onyxiaInstancePublicUrl,
        encodeMethod: "encodeURIComponent"
    });
}
