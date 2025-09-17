import { describe, it, expect } from "vitest";
import { catalogToDatasets } from "./jsonld";
import type { JsonLdDocument } from "jsonld";

describe("catalogToDatasets (framed JSON-LD)", () => {
    it("handles null distribution and string keyword", () => {
        const framed = {
            "@context": {
                dcat: "http://www.w3.org/ns/dcat#",
                dct: "http://purl.org/dc/terms/"
            },
            "@graph": [
                {
                    "@id": "dataset:1",
                    "@type": "dcat:Dataset",
                    "dct:title": "Titre",
                    "dct:description": "Desc",
                    "dct:issued": "2024-01-01",
                    "dcat:landingPage": "https://example.org",
                    "dct:license": "https://license",
                    "dcat:keyword": "Statistiques",
                    "dcat:distribution": null
                }
            ]
        } as const;

        const res = catalogToDatasets(framed as any);
        expect(res).toHaveLength(1);
        expect(res[0]).toMatchObject({
            id: "dataset:1",
            title: "Titre",
            description: "Desc",
            keywords: ["Statistiques"],
            issuedDate: "2024-01-01",
            landingPageUrl: "https://example.org",
            licenseUrl: "https://license",
            distributions: []
        });
    });

    it("normalizes when there is no @graph (single dataset object)", () => {
        const framed = {
            "@id": "dataset:single",
            "@type": "dcat:Dataset",
            // no dct:title to assert fallback to @id
            "dct:description": undefined,
            // landingPage and license as {"@id": ...}
            "dcat:landingPage": { "@id": "https://lp" },
            "dct:license": { "@id": "https://lic" },
            // keyword as {@value}
            "dcat:keyword": { "@value": "K" },
            // distribution as array with byteSize as string
            "dcat:distribution": [
                {
                    "@id": "dist:byte",
                    "@type": "dcat:Distribution",
                    "dcat:downloadURL": "https://dl",
                    "dcat:byteSize": 456,
                    "dct:format": "text/csv"
                }
            ]
        } satisfies JsonLdDocument;

        const res = catalogToDatasets(framed);
        expect(res).toHaveLength(1);
        const ds = res[0];
        expect(ds.id).toBe("dataset:single");
        expect(ds.title).toBe("dataset:single"); // fallback to @id
        expect(ds.landingPageUrl).toBe("https://lp");
        expect(ds.licenseUrl).toBe("https://lic");
        expect(ds.keywords).toEqual(["K"]);
        expect(ds.distributions).toEqual([
            {
                id: "dist:byte",
                format: "text/csv",
                downloadUrl: "https://dl",
                accessUrl: undefined,
                sizeInBytes: 456
            }
        ]);
    });

    it("handles distribution array with multiple items and mediaType preference", () => {
        const framed = {
            "@context": {
                dcat: "http://www.w3.org/ns/dcat#",
                dct: "http://purl.org/dc/terms/"
            },
            "@graph": [
                {
                    "@id": "dataset:multi",
                    "@type": "dcat:Dataset",
                    "dct:title": "Multi",
                    "dcat:distribution": [
                        {
                            "@id": "d1",
                            "@type": "dcat:Distribution",
                            "dcat:mediaType": "application/json",
                            "dct:format": "json"
                        },
                        {
                            "@id": "d2",
                            "@type": "dcat:Distribution",
                            // no mediaType, should fallback to dct:format
                            "dct:format": "csv",
                            "dcat:filesize": 10
                        }
                    ]
                }
            ]
        } as const;

        const res = catalogToDatasets(framed as any);
        expect(res).toHaveLength(1);
        const [d1, d2] = res[0].distributions;
        expect(d1).toMatchObject({ id: "d1", format: "application/json" });
        expect(d2).toMatchObject({ id: "d2", format: "csv", sizeInBytes: 10 });
    });

    it("normalizes mediaType and format when provided as @id objects", () => {
        const framed = {
            "@context": {
                dcat: "http://www.w3.org/ns/dcat#",
                dct: "http://purl.org/dc/terms/"
            },
            "@graph": [
                {
                    "@id": "dataset:ids",
                    "@type": "dcat:Dataset",
                    "dct:title": "IDs",
                    "dcat:distribution": [
                        {
                            "@id": "d1",
                            "@type": "dcat:Distribution",
                            "dcat:mediaType": { "@id": "http://media/type" }
                        },
                        {
                            "@id": "d2",
                            "@type": "dcat:Distribution",
                            "dct:format": { "@id": "http://format/type" }
                        }
                    ]
                }
            ]
        } as const;

        const res = catalogToDatasets(framed as any);
        expect(res).toHaveLength(1);
        const [d1, d2] = res[0].distributions;
        expect(d1).toMatchObject({ id: "d1", format: "http://media/type" });
        expect(d2).toMatchObject({ id: "d2", format: "http://format/type" });
    });

    it("maps single distribution object and keyword array", () => {
        const framed = {
            "@context": {
                dcat: "http://www.w3.org/ns/dcat#",
                dct: "http://purl.org/dc/terms/"
            },
            "@graph": [
                {
                    "@id": "dataset:2",
                    "@type": "dcat:Dataset",
                    "dct:title": "DS",
                    "dct:description": undefined,
                    "dct:issued": undefined,
                    "dcat:landingPage": undefined,
                    "dct:license": undefined,
                    "dcat:keyword": ["A", "B"],
                    "dcat:distribution": {
                        "@id": "dist:1",
                        "@type": "dcat:Distribution",
                        "dcat:downloadURL": "https://download",
                        "dcat:accessURL": "https://access",
                        "dcat:mediaType": "text/csv",
                        "dcat:filesize": 123
                    }
                }
            ]
        } as const;

        const res = catalogToDatasets(framed as any);
        expect(res).toHaveLength(1);
        expect(res[0].keywords).toEqual(["A", "B"]);
        expect(res[0].distributions).toEqual([
            {
                id: "dist:1",
                format: "text/csv",
                downloadUrl: "https://download",
                accessUrl: "https://access",
                sizeInBytes: 123
            }
        ]);
    });

    it("accepts dcat:keywords plural and @value wrapper, compacts to array", () => {
        const framed = {
            "@context": {
                dcat: "http://www.w3.org/ns/dcat#",
                dct: "http://purl.org/dc/terms/"
            },
            "@graph": [
                {
                    "@id": "dataset:3",
                    "@type": "dcat:Dataset",
                    "dct:title": "DS3",
                    "dct:description": undefined,
                    "dct:issued": undefined,
                    "dcat:landingPage": undefined,
                    "dct:license": undefined,
                    "dcat:keyword": [{ "@value": "K1" }, "K2"],
                    "dcat:distribution": []
                }
            ]
        } as const;

        const res = catalogToDatasets(framed as any);
        expect(res).toHaveLength(1);
        expect(res[0].keywords).toEqual(["K1", "K2"]);
        expect(res[0].distributions).toEqual([]);
    });

    it("normalizes localized titles, descriptions and keyword inputs", () => {
        const framed = {
            "@context": {
                dcat: "http://www.w3.org/ns/dcat#",
                dct: "http://purl.org/dc/terms/"
            },
            "@graph": [
                {
                    "@id": "dataset:localized",
                    "@type": "dcat:Dataset",
                    "dct:title": [
                        { "@language": "fr", "@value": "Jeu de données" },
                        { "@language": "en", "@value": "Dataset" }
                    ],
                    "dct:description": {
                        fr: "Description FR",
                        en: "Description EN"
                    },
                    "dcat:keyword": [
                        [
                            { "@language": "fr", "@value": "mot" },
                            { "@language": "en", "@value": "word" }
                        ],
                        { "@value": "plain" }
                    ],
                    "dcat:distribution": []
                }
            ]
        } as const;

        const [dataset] = catalogToDatasets(framed as any);
        expect(dataset.title).toEqual({ fr: "Jeu de données", en: "Dataset" });
        expect(dataset.description).toEqual({
            fr: "Description FR",
            en: "Description EN"
        });
        expect(dataset.keywords).toEqual([{ fr: "mot", en: "word" }, "plain"]);
    });
});
