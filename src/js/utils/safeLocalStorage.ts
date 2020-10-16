
import { id } from "evt/tools/typeSafety/id";

const localStorage: undefined | typeof window.localStorage = (() => {

    if (typeof window.localStorage === "undefined") {
        return undefined;
    }

    const key = "__a_random_key_SiSd9"
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

})();

/** window.localStorage or a non persistent polyfill */
export const safeLocalStorage = localStorage ?? (() => {

    const map = new Map<string, string>();

    return id<Pick<typeof window.localStorage, "getItem" | "removeItem" | "setItem">>({
        "getItem": key => map.get(key) ?? null,
        "removeItem": key => map.delete(key),
        "setItem": (key, value)=> map.set(key, value)
    });


})();

