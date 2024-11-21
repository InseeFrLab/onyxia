import { retrieveParamFromUrl } from "powerhooks/tools/urlSearchParams";

export const onyxiaInstancePublicUrlKey = "onyxia-instance-public-url";

export function getOnyxiaInstancePublicUrl() {
    const localStorageValue = localStorage.getItem(onyxiaInstancePublicUrlKey);

    if (localStorageValue !== null) {
        return localStorageValue;
    }

    const result = retrieveParamFromUrl({
        name: onyxiaInstancePublicUrlKey,
        url: window.location.href
    });

    if (!result.wasPresent) {
        console.warn(`${onyxiaInstancePublicUrlKey} not found in url`);
        return "/";
    }

    const { newUrl, value } = result;

    localStorage.setItem(onyxiaInstancePublicUrlKey, value);

    window.history.replaceState({}, "", newUrl);

    return value;
}
