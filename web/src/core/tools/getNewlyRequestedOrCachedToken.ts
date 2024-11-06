import * as runExclusive from "run-exclusive";
import memoize from "memoizee";

export type TokenPersistance<T> = {
    get: () => Promise<{ token: T; ttl: number } | undefined>;
    set: (cache: { token: T; ttl: number }) => Promise<void>;
    clear: () => void;
};

function getNewlyRequestedOrCachedTokenWithoutParamsFactory<
    T extends { expirationTime: number }
>(params: {
    requestNewToken: () => Promise<T>;
    returnCachedTokenIfStillValidForXPercentOfItsTTL: "99%" | "90%" | "80%" | "50%";
    persistance: TokenPersistance<T> | undefined;
}) {
    const {
        requestNewToken,
        returnCachedTokenIfStillValidForXPercentOfItsTTL,
        persistance
    } = params;

    let cache: { token: T; ttl: number } | undefined = undefined;

    let hasCacheBeenRestoredFromPersistance = false;

    const getNewlyRequestedOrCachedTokenWithoutParams = runExclusive.build<
        () => Promise<T>
    >(async () => {
        if (!hasCacheBeenRestoredFromPersistance && persistance !== undefined) {
            hasCacheBeenRestoredFromPersistance = true;

            const cacheFromPersistance = await persistance.get();

            if (cacheFromPersistance !== undefined) {
                cache = cacheFromPersistance;
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

        await persistance?.set(cache);

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
    persistance: TokenPersistance<T> | undefined;
}) {
    const {
        requestNewToken,
        returnCachedTokenIfStillValidForXPercentOfItsTTL,
        persistance
    } = params;

    const getNewlyRequestedOrCachedTokenFactory_memo = memoize(
        (...args: Args) =>
            getNewlyRequestedOrCachedTokenWithoutParamsFactory({
                requestNewToken: () => requestNewToken(...args),
                returnCachedTokenIfStillValidForXPercentOfItsTTL,
                persistance
            }),
        { length: requestNewToken.length }
    );

    function getNewlyRequestedOrCachedToken(...args: Args) {
        const { getNewlyRequestedOrCachedTokenWithoutParams } =
            getNewlyRequestedOrCachedTokenFactory_memo(...args);

        return getNewlyRequestedOrCachedTokenWithoutParams();
    }

    async function clearCachedToken() {
        await persistance?.clear();
        getNewlyRequestedOrCachedTokenFactory_memo.clear();
    }

    return { getNewlyRequestedOrCachedToken, clearCachedToken };
}

export function createSessionStorageTokenPersistance<T>(params: {
    sessionStorageKey: string;
}): TokenPersistance<T> {
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
