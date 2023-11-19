function getRefererUrlFromUrl() {
    const queryParams = new URLSearchParams(window.location.search);
    const redirectUri = queryParams.get("redirect_uri");

    if (redirectUri === null) {
        return undefined;
    }

    const redirectUrl = new URL(redirectUri);

    return redirectUrl.origin;
}

const localStorageKey = "theme-onyxia_refererUrl";

export function getReferrerUrl() {
    const refererUrl = getRefererUrlFromUrl();

    if (refererUrl === undefined) {
        return localStorage.getItem(localStorageKey) ?? undefined;
    }

    localStorage.setItem(localStorageKey, refererUrl);

    return refererUrl;
}
