import { it, expect, describe } from "vitest";
import { resolveEnum, type XOnyxiaContextLike } from "./resolveEnum";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ resolveEnum }), () => {
    it("resolves from the xOnyxiaContext", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {
            user: {
                decodedIdToken: {
                    groups: ["a", "b", "c"]
                }
            }
        };

        const got = resolveEnum({
            "helmValuesSchema": {
                "type": "string",
                "x-onyxia": {
                    "overwriteListEnumWith": "user.decodedIdToken.groups"
                }
            },
            xOnyxiaContext
        });

        const expected = ["a", "b", "c"];

        expect(got).toStrictEqual(expected);
    });
});
