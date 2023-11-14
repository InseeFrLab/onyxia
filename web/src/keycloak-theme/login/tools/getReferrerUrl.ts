import {
    retrieveQueryParamFromUrl,
    retrieveAllQueryParamStartingWithPrefixFromUrl
} from "oidc-spa/tools/urlQueryParams";

function inferRefererUrlFromUrl() {
    const url = window.location.href;

    const result = retrieveQueryParamFromUrl({
        "name": "redirect_uri",
        url
    });

    if (!result.wasPresent) {
        return undefined;
    }

    const redirectUri = result.value;

    const result2 = retrieveAllQueryParamStartingWithPrefixFromUrl({
        "url": redirectUri,
        "prefix": "",
        "doLeavePrefixInResults": true
    });

    return result2.newUrl.replace(/callback?\/$/, "");
}

const localStorageKey = "theme-onyxia_refererUrl";

export function getReferrerUrl() {
    const refererUrl = inferRefererUrlFromUrl();

    if (refererUrl === undefined) {
        return localStorage.getItem(localStorageKey) ?? undefined;
    }

    localStorage.setItem(localStorageKey, refererUrl);

    return refererUrl;
}
