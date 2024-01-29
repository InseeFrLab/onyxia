import * as runExclusive from "run-exclusive";
import memoize from "memoizee";

export type TokenPersistance<T> = {
    get: () => Promise<{ token: T; ttl: number } | undefined>;
    set: (cache: { token: T; ttl: number }) => Promise<void>;
    clear: () => Promise<void>;
};

function getNewlyRequestedOrCachedTokenWithoutParamsFactory<
    T extends { expirationTime: number }
>(params: {
    requestNewToken: () => Promise<T>;
    returnCachedTokenIfStillValidForXPercentOfItsTTL: "99%" | "90%" | "80%" | "50%";
}) {
    const { requestNewToken, returnCachedTokenIfStillValidForXPercentOfItsTTL } = params;

    let cache: { token: T; ttl: number } | undefined = undefined;

    const getNewlyRequestedOrCachedTokenWithoutParams = runExclusive.build<
        () => Promise<T>
    >(async () => {
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
            "ttl": token.expirationTime - Date.now()
        };

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
}) {
    const { requestNewToken, returnCachedTokenIfStillValidForXPercentOfItsTTL } = params;

    const getNewlyRequestedOrCachedTokenFactory_memo = memoize(
        (...args: Args) =>
            getNewlyRequestedOrCachedTokenWithoutParamsFactory({
                "requestNewToken": () => requestNewToken(...args),
                returnCachedTokenIfStillValidForXPercentOfItsTTL
            }),
        { "length": requestNewToken.length }
    );

    function getNewlyRequestedOrCachedToken(...args: Args) {
        const { getNewlyRequestedOrCachedTokenWithoutParams } =
            getNewlyRequestedOrCachedTokenFactory_memo(...args);

        return getNewlyRequestedOrCachedTokenWithoutParams();
    }

    function clearCachedToken() {
        getNewlyRequestedOrCachedTokenFactory_memo.clear();
    }

    return { getNewlyRequestedOrCachedToken, clearCachedToken };
}
