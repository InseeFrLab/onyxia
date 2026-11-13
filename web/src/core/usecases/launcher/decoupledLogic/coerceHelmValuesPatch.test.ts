import { describe, it, expect } from "vitest";
import { coerceHelmValuesPatch } from "./coerceHelmValuesPatch";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ coerceHelmValuesPatch }), () => {
    const helmValuesSchema = {
        type: "object",
        properties: {
            git: {
                type: "object",
                properties: { cache: { type: "string" }, enabled: { type: "boolean" } }
            },
            startupProbe: {
                type: "object",
                properties: { periodSeconds: { type: "integer" } }
            }
        }
    } as const;

    it("follows the schema type, whatever the incoming type", () => {
        const got = coerceHelmValuesPatch({
            helmValuesSchema,
            helmValuesPatch: [
                { path: ["git", "cache"], value: 0 },
                { path: ["git", "enabled"], value: "true" },
                { path: ["startupProbe", "periodSeconds"], value: "10" }
            ]
        });

        expect(got).toStrictEqual([
            { path: ["git", "cache"], value: "0" },
            { path: ["git", "enabled"], value: true },
            { path: ["startupProbe", "periodSeconds"], value: 10 }
        ]);
    });

    it("keeps a string typed field untouched, leading zeros included", () => {
        const got = coerceHelmValuesPatch({
            helmValuesSchema,
            helmValuesPatch: [{ path: ["git", "cache"], value: "007" }]
        });

        expect(got).toStrictEqual([{ path: ["git", "cache"], value: "007" }]);
    });

    it("guesses the type for paths unknown to the schema", () => {
        const got = coerceHelmValuesPatch({
            helmValuesSchema,
            helmValuesPatch: [
                { path: ["foo", "n"], value: "3" },
                { path: ["foo", "b"], value: "false" },
                { path: ["foo", "s"], value: "bar" }
            ]
        });

        expect(got).toStrictEqual([
            { path: ["foo", "n"], value: 3 },
            { path: ["foo", "b"], value: false },
            { path: ["foo", "s"], value: "bar" }
        ]);
    });

    it("turns digit-only segments into indexes under an array, and only there", () => {
        const got = coerceHelmValuesPatch({
            helmValuesSchema: {
                type: "object",
                properties: {
                    network: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: { port: { type: "integer" } }
                        }
                    },
                    labels: {
                        type: "object",
                        properties: { "1": { type: "string" } }
                    }
                }
            },
            helmValuesPatch: [
                { path: ["network", "0", "port"], value: "80" },
                { path: ["labels", "1"], value: "x" }
            ]
        });

        expect(got).toStrictEqual([
            { path: ["network", 0, "port"], value: 80 },
            { path: ["labels", "1"], value: "x" }
        ]);
    });
});
