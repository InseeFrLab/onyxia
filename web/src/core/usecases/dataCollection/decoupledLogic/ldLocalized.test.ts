import { describe, expect, it } from "vitest";
import { toLocalizedString, toLocalizedStringList } from "./ldLocalized";

describe("toLocalizedString", () => {
    it("returns the input when it is already a string", () => {
        expect(toLocalizedString("simple")).toBe("simple");
    });

    it("unwraps @value objects", () => {
        expect(toLocalizedString({ "@value": "wrapped" })).toBe("wrapped");
    });

    it("converts language arrays while filtering unknown locales", () => {
        expect(
            toLocalizedString([
                { "@language": "fr", "@value": "Bonjour" },
                { "@language": "en", "@value": "Hello" },
                //@ts-expect-error
                { "@language": "zz", "@value": "Should be dropped" }
            ])
        ).toEqual({ fr: "Bonjour", en: "Hello" });
    });

    it("accepts language maps unchanged", () => {
        expect(
            toLocalizedString({
                fr: "Carte",
                en: "Map"
            })
        ).toEqual({ fr: "Carte", en: "Map" });
    });
});

describe("toLocalizedStringList", () => {
    it("wraps a single value", () => {
        expect(toLocalizedStringList("unique")).toEqual(["unique"]);
    });

    it("normalizes a mix of supported inputs", () => {
        expect(
            toLocalizedStringList([
                "plain",
                { "@value": "wrapped" },
                [
                    { "@language": "fr", "@value": "mot" },
                    { "@language": "en", "@value": "word" }
                ],
                {
                    fr: "Carte",
                    en: "Map"
                }
            ])
        ).toEqual([
            "plain",
            "wrapped",
            { fr: "mot", en: "word" },
            { fr: "Carte", en: "Map" }
        ]);
    });
});
