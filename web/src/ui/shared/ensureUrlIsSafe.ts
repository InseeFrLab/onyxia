import { getSafeUrl as getSafeUrl_base } from "onyxia-ui/tools/getSafeUrl";
import { assert } from "tsafe/assert";

/** Throws if urls isn't safe, returns url */
export function ensureUrlIsSafe(url: string): void {
    try {
        getSafeUrl_base(url);
    } catch {
        throw new Error(`Invalid url: ${url}`);
    }

    if (url.startsWith("/")) {
        return;
    }

    if (window.kcContext === undefined) {
        throw new Error(`${url} is not a local url. (Local urls start with "/")`);
    }

    const { ONYXIA_RESOURCES_ALLOWED_ORIGINS } = window.kcContext.properties;

    assert(typeof ONYXIA_RESOURCES_ALLOWED_ORIGINS === "string");

    if (ONYXIA_RESOURCES_ALLOWED_ORIGINS === "*") {
        return;
    }

    const safeOriginOfUrl = ONYXIA_RESOURCES_ALLOWED_ORIGINS.split(",")
        .map(origin => origin.trim())
        .find(origin => url.startsWith(origin.toLowerCase()));

    if (safeOriginOfUrl === undefined) {
        throw new Error(
            `${url} is not from an allowed origin, allowed origins: ${ONYXIA_RESOURCES_ALLOWED_ORIGINS}`
        );
    }
}
