import { symToStr } from "tsafe/symToStr";
import { it, expect, describe } from "vitest";
import { getHelmValuesPathDeeperCommonSubpath } from "./getHelmValuesPathDeeperCommonSubpath";

describe(symToStr({ getHelmValuesPathDeeperCommonSubpath }), () => {
    it("base case", () => {
        const got = getHelmValuesPathDeeperCommonSubpath({
            helmValuesPath1: ["a", 1, "b", "c"],
            helmValuesPath2: ["a", 1, "d", "e"]
        });

        const expected = ["a", 1];

        expect(got).toStrictEqual(expected);
    });
});
