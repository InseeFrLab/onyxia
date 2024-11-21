import { id } from "tsafe/id";
import memoizee from "memoizee";

/**
 * Returns window.localStorage or, if the browser does not implement it,
 * a mock ( non persistent across reloads )
 */
export const getLocalStorage = memoizee(() => {
    const localStorage =
        (() => {
            if (typeof window.localStorage === "undefined") {
                return undefined;
            }

            const key = "__a_random_key_SiSd9";
            const value = "yes";

            try {
                window.localStorage.setItem(key, value);

                if (window.localStorage.getItem(key) !== value) {
                    return undefined;
                }

                window.localStorage.removeItem(key);

                return window.localStorage;
            } catch {
                return undefined;
            }
        })() ??
        (() => {
            const map = new Map<string, string>();

            return id<
                Pick<typeof window.localStorage, "getItem" | "removeItem" | "setItem">
            >({
                getItem: key => map.get(key) ?? null,
                removeItem: key => map.delete(key),
                setItem: (key, value) => map.set(key, value)
            });
        })();

    return { localStorage };
});
