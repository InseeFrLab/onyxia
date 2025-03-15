import { getSearchParam } from "powerhooks/tools/urlSearchParams";

export const onyxiaInstancePublicUrlKey = "onyxia-instance-public-url";

export function getOnyxiaInstancePublicUrl() {
    const localStorageValue = localStorage.getItem(onyxiaInstancePublicUrlKey);

    if (localStorageValue !== null) {
        return localStorageValue;
    }

    const { wasPresent, value, url_withoutTheParam } = getSearchParam({
        name: onyxiaInstancePublicUrlKey,
        url: window.location.href
    });

    if (!wasPresent) {
        console.warn(`${onyxiaInstancePublicUrlKey} not found in url`);
        return "/";
    }

    localStorage.setItem(onyxiaInstancePublicUrlKey, value);

    window.history.replaceState({}, "", url_withoutTheParam);

    return value;
}
