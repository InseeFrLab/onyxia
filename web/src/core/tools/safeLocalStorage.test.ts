import { afterEach, describe, expect, it, vi } from "vitest";

describe("getLocalStorage", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it("falls back to memory when reading window.localStorage throws", async () => {
        vi.stubGlobal(
            "window",
            Object.defineProperty({}, "localStorage", {
                get: () => {
                    throw new DOMException("The operation is insecure.", "SecurityError");
                }
            })
        );

        const { getLocalStorage } = await import("./safeLocalStorage");

        const { localStorage } = getLocalStorage();

        localStorage.setItem("k", "v");

        expect(localStorage.getItem("k")).toBe("v");
    });
});
