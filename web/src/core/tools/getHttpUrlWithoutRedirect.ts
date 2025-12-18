import memoize from "memoizee";

const externalizedResultRecord = new Map<string, string>();

const getHttpUrlWithoutRedirect_internal = memoize(
    async (httpUrl: string) => {
        {
            const httpUrl_withoutRedirect = externalizedResultRecord.get(httpUrl);

            if (httpUrl_withoutRedirect !== undefined) {
                return httpUrl_withoutRedirect;
            }
        }

        const doFetch = async (init: RequestInit) => {
            const controller = new AbortController();
            try {
                const response = await fetch(httpUrl, {
                    ...init,
                    redirect: "follow",
                    signal: controller.signal
                });
                // HEAD has no body; if we fall back to GET, cancel immediately to avoid downloads.
                response.body?.cancel();
                return response.url;
            } catch {
                return undefined;
            } finally {
                controller.abort();
            }
        };

        // Prefer HEAD (cheap); fall back to a ranged GET if HEAD is unsupported.
        return (
            (await doFetch({ method: "HEAD" })) ??
            (await doFetch({
                method: "GET",
                headers: { Range: "bytes=0-0" }
            }))
        );
    },
    { promise: true }
);

export function getHttpUrlWithoutRedirect(params: { httpUrl: string }) {
    const { httpUrl } = params;
    return getHttpUrlWithoutRedirect_internal(httpUrl);
}

getHttpUrlWithoutRedirect.setResult = (params: {
    httpUrl: string;
    httpUrl_withoutRedirect: string;
}) => {
    const { httpUrl, httpUrl_withoutRedirect } = params;

    externalizedResultRecord.set(httpUrl, httpUrl_withoutRedirect);
};
