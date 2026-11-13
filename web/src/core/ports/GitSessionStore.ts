/**
 * Keeps the OAuth refresh tokens of the Git providers between two visits, per user.
 * The access tokens stay in memory, in the usecase.
 */
export type GitSessionStore = {
    get: (params: { providerId: string }) => { refreshToken: string } | undefined;
    set: (params: { providerId: string; refreshToken: string }) => void;
    remove: (params: { providerId: string }) => void;
    /**
     * Cross tab lock: a refresh token is single use, two tabs must never refresh it at once.
     * The callback must re-read the refresh token with get, another tab may have rotated it.
     */
    runExclusive: <T>(params: {
        providerId: string;
        callback: () => Promise<T>;
    }) => Promise<T>;
};
