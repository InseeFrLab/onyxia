import { Mutex } from "async-mutex";
import { z } from "zod";
import type { GitSessionStore } from "core/ports/GitSessionStore";
import { getLocalStorage } from "core/tools/safeLocalStorage";

const zSession = z.object({ refreshToken: z.string().min(1) });

/**
 * In localStorage, keyed by the Keycloak sub: another user of the same browser doesn't
 * see the sessions. Not cleared on logout from Onyxia.
 */
export function createGitSessionStore(params: { userSub: string }): GitSessionStore {
    const { userSub } = params;

    const { localStorage } = getLocalStorage();

    const getKey = (providerId: string) => `onyxia:git-session:${userSub}:${providerId}`;

    /** Without the Web Locks API, the lock only holds within the tab */
    const mutexByProviderId = new Map<string, Mutex>();

    return {
        get: ({ providerId }) => {
            const value = localStorage.getItem(getKey(providerId));

            if (value === null) {
                return undefined;
            }

            try {
                return zSession.parse(JSON.parse(value));
            } catch {
                return undefined;
            }
        },
        set: ({ providerId, refreshToken }) =>
            localStorage.setItem(getKey(providerId), JSON.stringify({ refreshToken })),
        remove: ({ providerId }) => localStorage.removeItem(getKey(providerId)),
        runExclusive: async ({ providerId, callback }) => {
            if (typeof navigator !== "undefined" && navigator.locks !== undefined) {
                return navigator.locks.request(getKey(providerId), callback);
            }

            let mutex = mutexByProviderId.get(providerId);

            if (mutex === undefined) {
                mutex = new Mutex();
                mutexByProviderId.set(providerId, mutex);
            }

            return mutex.runExclusive(callback);
        }
    };
}
