import * as runExclusive from "run-exclusive";
import memoize from "memoizee";

export type TokenPersistence<T> = {
    get: () => Promise<{ token: T; ttl: number } | undefined>;
    set: (cache: { token: T; ttl: number }) => Promise<void>;
    clear: () => void;
};

function getNewlyRequestedOrCachedTokenWithoutParamsFactory<
    T extends { expirationTime: number }
>(params: {
    requestNewToken: () => Promise<T>;
    returnCachedTokenIfStillValidForXPercentOfItsTTL: "99%" | "90%" | "80%" | "50%";
    persistence: TokenPersistence<T> | undefined;
}) {
    const {
        requestNewToken,
        returnCachedTokenIfStillValidForXPercentOfItsTTL,
        persistence
    } = params;

    let cache: { token: T; ttl: number } | undefined = undefined;

    let hasCacheBeenRestoredFromPersistence = false;

    const getNewlyRequestedOrCachedTokenWithoutParams = runExclusive.build<
        () => Promise<T>
    >(async () => {
        if (!hasCacheBeenRestoredFromPersistence && persistence !== undefined) {
            hasCacheBeenRestoredFromPersistence = true;

            const cacheFromPersistence = await persistence.get();

            if (cacheFromPersistence !== undefined) {
                cache = cacheFromPersistence;
            }
        }

        if (
            cache !== undefined &&
            cache.token.expirationTime - Date.now() >
                (parseFloat(
                    returnCachedTokenIfStillValidForXPercentOfItsTTL.split("%")[0]
                ) /
                    100) *
                    cache.ttl
        ) {
            return cache.token;
        }

        const token = await requestNewToken();

        cache = {
            token,
            ttl: token.expirationTime - Date.now()
        };

        await persistence?.set(cache);

        return token;
    });

    return { getNewlyRequestedOrCachedTokenWithoutParams };
}

export function getNewlyRequestedOrCachedTokenFactory<
    T extends { expirationTime: number },
    Args extends any[]
>(params: {
    requestNewToken: (...args: Args) => Promise<T>;
    returnCachedTokenIfStillValidForXPercentOfItsTTL: "99%" | "90%" | "80%" | "50%";
    persistence: TokenPersistence<T> | undefined;
}) {
    const {
        requestNewToken,
        returnCachedTokenIfStillValidForXPercentOfItsTTL,
        persistence
    } = params;

    const getNewlyRequestedOrCachedTokenFactory_memo = memoize(
        (...args: Args) =>
            getNewlyRequestedOrCachedTokenWithoutParamsFactory({
                requestNewToken: () => requestNewToken(...args),
                returnCachedTokenIfStillValidForXPercentOfItsTTL,
                persistence
            }),
        { length: requestNewToken.length }
    );

    function getNewlyRequestedOrCachedToken(...args: Args) {
        const { getNewlyRequestedOrCachedTokenWithoutParams } =
            getNewlyRequestedOrCachedTokenFactory_memo(...args);

        return getNewlyRequestedOrCachedTokenWithoutParams();
    }

    async function clearCachedToken() {
        await persistence?.clear();
        getNewlyRequestedOrCachedTokenFactory_memo.clear();
    }

    return { getNewlyRequestedOrCachedToken, clearCachedToken };
}

export function createSessionStorageTokenPersistence<T>(params: {
    sessionStorageKey: string;
}): TokenPersistence<T> {
    const { sessionStorageKey } = params;

    return {
        set: async ({ token, ttl }) => {
            sessionStorage.setItem(sessionStorageKey, JSON.stringify({ token, ttl }));
        },
        get: async () => {
            const item = sessionStorage.getItem(sessionStorageKey);

            if (item === null) {
                return undefined;
            }

            const { token, ttl } = JSON.parse(item);

            return { token, ttl };
        },
        clear: () => {
            sessionStorage.removeItem(sessionStorageKey);
        }
    };
}
