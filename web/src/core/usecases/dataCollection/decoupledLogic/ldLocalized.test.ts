import { describe, expect, it } from "vitest";
import {
    zLangValue,
    toLocalizedString,
    toLocalizedStringList,
    zLocalizedInput,
    groupLangValues,
    type LangValue
} from "./ldLocalized";
import { type Language } from "core/ports/OnyxiaApi";

describe("groupLangValues", () => {
    it("should group by index and merge identical values", () => {
        const input: LangValue[] = [
            { "@language": "fr", "@value": "mot" },
            { "@language": "en", "@value": "word" },
            { "@language": "fr", "@value": "plural" },
            { "@language": "en", "@value": "xxx" },
            { "@language": "fr", "@value": "xxx" },
            { "@language": "it", "@value": "yyy" }
        ];

        const output = groupLangValues(input);

        expect(output).toEqual([
            { fr: "xxx", en: "xxx" },
            { fr: "mot", en: "word", it: "yyy" },
            { fr: "plural" }
        ]);
    });

    it("should handle empty input", () => {
        expect(groupLangValues([])).toEqual([]);
    });

    it("should merge multiple identical values across languages", () => {
        const input: LangValue[] = [
            { "@language": "fr", "@value": "same" },
            { "@language": "en", "@value": "same" },
            { "@language": "it", "@value": "same" }
        ];

        expect(groupLangValues(input)).toEqual([{ fr: "same", en: "same", it: "same" }]);
    });
});

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
        expect(toLocalizedStringList(["unique"])).toEqual(["unique"]);
    });

    it("groups repeated language values into separate localized entries", () => {
        const input: { "@language": Language; "@value": string }[] = [
            { "@language": "fr", "@value": "mot" },
            { "@language": "en", "@value": "word" },
            { "@language": "fr", "@value": "mots" },
            { "@language": "en", "@value": "words" }
        ];
        expect(toLocalizedStringList(input)).toEqual([
            { fr: "mot", en: "word" },
            { fr: "mots", en: "words" }
        ]);
    });

    it("groups repeated language values into separate localized entries even if it's not ", () => {
        const input: { "@language": Language; "@value": string }[] = [
            { "@language": "fr", "@value": "mot" },
            { "@language": "en", "@value": "word" },
            { "@language": "fr", "@value": "plural" },
            { "@language": "en", "@value": "xxx" },
            { "@language": "fr", "@value": "xxx" },
            { "@language": "it", "@value": "yyy" }
        ];

        expect(toLocalizedStringList(input)).toEqual([
            { fr: "xxx", en: "xxx" },
            { fr: "mot", en: "word", it: "yyy" },
            { fr: "plural" }
        ]);
    });
});
