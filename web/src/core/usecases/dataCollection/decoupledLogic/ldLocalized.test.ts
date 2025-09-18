import { describe, expect, it } from "vitest";
import {
    zLangValue,
    toLocalizedString,
    toLocalizedStringList,
    zLocalizedInput
} from "./ldLocalized";

describe("zLangValue", () => {
    it("accepts translation tagged languages", () => {
        expect(() =>
            zLangValue.parse({
                "@language": "fr-t-en",
                "@value": "Bonjour"
            })
        ).not.toThrow();
    });

    it("rejects translation tags with identical source and target", () => {
        expect(() =>
            zLangValue.parse({
                "@language": "fr-t-fr",
                "@value": "Bonjour"
            })
        ).toThrow();
    });

    it("reject translation same langue", () => {
        expect(() =>
            zLangValue.parse({
                "@language": "fr-t-fr",
                "@value": "Bonjour"
            })
        ).toThrow();
    });

    it("rejects unsupported languages", () => {
        expect(() =>
            zLangValue.parse({
                "@language": "zz",
                "@value": "Unknown"
            })
        ).toThrow();
    });
});

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

    it("normalizes translation tags to their supported target", () => {
        expect(
            toLocalizedString([
                { "@language": "fr-t-en", "@value": "Bonjour" },
                { "@language": "en", "@value": "Hello" }
            ])
        ).toEqual({ fr: "Bonjour", en: "Hello" });
    });

    it("accepts translation tags through the zod schema", () => {
        expect(() =>
            zLocalizedInput.parse([
                { "@language": "fr-t-en", "@value": "Bonjour" },
                { "@language": "en", "@value": "Hello" }
            ])
        ).not.toThrow();
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
