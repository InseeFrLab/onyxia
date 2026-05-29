import { describe, expect, it } from "vitest";
import { mergeDeep } from "./mergeDeep";

describe(mergeDeep.name, () => {
    it("preserves getters so this points to the merged object", () => {
        const result = mergeDeep(
            {
                focus: {
                    main: "#FE3711",
                    get mainAlpha20() {
                        return `${this.main}:20`;
                    }
                }
            },
            {
                focus: {
                    main: "#000000"
                }
            }
        );

        const descriptor = Object.getOwnPropertyDescriptor(result.focus, "mainAlpha20");

        expect(descriptor?.get).toBeInstanceOf(Function);
        expect(result.focus.mainAlpha20).toBe("#000000:20");
    });
});
