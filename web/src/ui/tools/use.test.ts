import { describe, expect, it } from "vitest";
import { use } from "./use";

describe("use", () => {
    it("returns the value after the promise fulfills", async () => {
        const promise = Promise.resolve("loaded");

        expect(getThrownValue(() => use(promise))).toBe(promise);

        await promise;

        expect(use(promise)).toBe("loaded");
    });

    it("throws the reason after the promise rejects", async () => {
        const error = new Error("loader failed");
        const promise = Promise.reject(error);

        expect(getThrownValue(() => use(promise))).toBe(promise);

        await promise.catch(() => undefined);

        expect(() => use(promise)).toThrow(error);
    });
});

function getThrownValue(callback: () => unknown): unknown {
    try {
        callback();
    } catch (thrownValue) {
        return thrownValue;
    }

    throw new Error("Expected callback to throw");
}
