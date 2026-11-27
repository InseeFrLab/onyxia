import { Mutex } from "async-mutex";
import { z } from "zod";
import { getLocalStorage } from "core/tools/safeLocalStorage";

/**
 * Keeps the OAuth refresh tokens of the Git forges between two visits, per user.
 * The access tokens stay in memory, in the usecase.
 */
export type GitSessionStore = {
    get: (params: { forgeId: string }) => { refreshToken: string } | undefined;
    set: (params: { forgeId: string; refreshToken: string }) => void;
    remove: (params: { forgeId: string }) => void;
    /**
     * Cross tab lock: a refresh token is single use, two tabs must never refresh it at once.
     * The callback must re-read the refresh token with get, another tab may have rotated it.
     */
    runExclusive: <T>(params: {
        forgeId: string;
        callback: () => Promise<T>;
    }) => Promise<T>;
};

const zSession = z.object({ refreshToken: z.string().min(1) });

/**
 * In localStorage, keyed by the Keycloak sub: another user of the same browser doesn't
 * see the sessions. Not cleared on logout from Onyxia.
 */
export function createGitSessionStore(params: { userSub: string }): GitSessionStore {
    const { userSub } = params;

    const { localStorage } = getLocalStorage();

    const getKey = (forgeId: string) => `onyxia:git-session:${userSub}:${forgeId}`;

    /** Without the Web Locks API, the lock only holds within the tab */
    const mutexByForgeId = new Map<string, Mutex>();

    return {
        get: ({ forgeId }) => {
            const value = localStorage.getItem(getKey(forgeId));

            if (value === null) {
                return undefined;
            }

            try {
                return zSession.parse(JSON.parse(value));
            } catch {
                return undefined;
            }
        },
        set: ({ forgeId, refreshToken }) =>
            localStorage.setItem(getKey(forgeId), JSON.stringify({ refreshToken })),
        remove: ({ forgeId }) => localStorage.removeItem(getKey(forgeId)),
        runExclusive: async ({ forgeId, callback }) => {
            if (typeof navigator !== "undefined" && navigator.locks !== undefined) {
                return navigator.locks.request(getKey(forgeId), callback);
            }

            let mutex = mutexByForgeId.get(forgeId);

            if (mutex === undefined) {
                mutex = new Mutex();
                mutexByForgeId.set(forgeId, mutex);
            }

            return mutex.runExclusive(callback);
        }
    };
}
