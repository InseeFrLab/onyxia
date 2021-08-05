import memoize from "memoizee";

export const getBrowser = memoize((): "chrome" | "safari" | "firefox" | undefined => {
    const { userAgent } = navigator;

    for (const id of ["chrome", "safari", "firefox"] as const) {
        if (new RegExp(id, "i").test(userAgent)) {
            return id;
        }
    }
});
