import { describe, it, expect } from "vitest";
import { mutateHelmValues_removeArrayItem } from "./mutateHelmValues_removeArrayItem";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ mutateHelmValues_removeArrayItem }), () => {
    it("simple case", () => {
        const helmValues = { r: [1, 2, 3] };

        mutateHelmValues_removeArrayItem({
            helmValues,
            helmValuesPath: ["r"],
            index: 1
        });

        expect(helmValues).toStrictEqual({
            r: [1, 3]
        });
    });
});
