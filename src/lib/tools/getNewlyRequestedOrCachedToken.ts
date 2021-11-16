import * as runExclusive from "run-exclusive";

export function getNewlyRequestedOrCachedTokenFactory<
    T extends { expirationTime: number },
>(params: {
    requestNewToken: () => Promise<T>;
    returnCachedTokenIfStillValidForXPercentOfItsTTL: "99%" | "90%" | "80%" | "50%";
}) {
    const { requestNewToken, returnCachedTokenIfStillValidForXPercentOfItsTTL } = params;

    let cache:
        | (T & {
              ttl: number;
          })
        | undefined = undefined;

    const getNewlyRequestedOrCachedToken = runExclusive.build<() => Promise<T>>(
        async () => {
            if (
                cache !== undefined &&
                cache.expirationTime - Date.now() >
                    (parseFloat(
                        returnCachedTokenIfStillValidForXPercentOfItsTTL.split("%")[0],
                    ) /
                        100) *
                        cache.ttl
            ) {
                return cache;
            }

            const token = await requestNewToken();

            cache = {
                ...token,
                "ttl": token.expirationTime - Date.now(),
            };

            return cache;
        },
    );

    return { getNewlyRequestedOrCachedToken };
}
