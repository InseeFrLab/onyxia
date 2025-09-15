import { z } from "zod";
import jsonld, { type JsonLdDocument } from "jsonld";
import type { State } from "../state";

export function catalogToDatasets(framed: JsonLdDocument) {
    const { "@graph": graph } = FramedCatalogSchema.parse(framed);

    return graph.map(d => {
        const distributions = (d["dcat:distribution"] ?? []).map(distrib => {
            const mediaType = distrib["dcat:mediaType"] ?? undefined;
            const format = mediaType ?? distrib?.["dct:format"] ?? undefined;

            const byteSize = distrib["dcat:byteSize"];
            const fileSize = distrib["dcat:filesize"];
            const sizeInBytes =
                typeof byteSize === "number"
                    ? byteSize
                    : byteSize === undefined
                      ? fileSize
                      : byteSize;

            return {
                id: distrib["@id"],
                format,
                downloadUrl: distrib["dcat:downloadURL"],
                accessUrl: distrib["dcat:accessURL"],
                sizeInBytes: sizeInBytes ?? undefined
            } satisfies State.Distribution;
        });

        return {
            id: d["@id"],
            title: d["dct:title"] ?? d["@id"],
            description: d["dct:description"],
            keywords: d["dcat:keyword"] ?? [],
            issuedDate: d["dct:issued"],
            landingPageUrl: d["dcat:landingPage"],
            licenseUrl: d["dct:license"],
            distributions
        } satisfies State.Dataset;
    });
}

export async function fetchCatalogAndConvertInDatasets(sourceUrl: string) {
    const res = await fetch(sourceUrl);
    if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status} : ${res.statusText}`);
    }
    const raw = await res.json();
    const framed = await jsonld.frame(raw, {
        "@context": raw["@context"],
        "@type": "dcat:Dataset",
        "dcat:distribution": { "@type": "dcat:Distribution" }
    });

    console.log("framed", framed);

    return catalogToDatasets(framed);
}

//   LiteralString:
//   "foo" -> "foo"
//   { "@value": "foo" } -> "foo"
//   undefined -> undefined
const LiteralString = z
    .union([z.string(), z.object({ "@value": z.string() })])
    .transform(v => (typeof v === "string" ? v : v["@value"]))
    .optional();

//   LiteralNumber accepts number | string | {"@value": number|string}
//   123 -> 123
//   "123" -> 123
//   { "@value": "123" } -> 123
//   { "@value": 123 } -> 123
const LiteralNumber = z
    .union([
        z.number(),
        z.string(),
        z.object({ "@value": z.union([z.string(), z.number()]) })
    ])
    .transform(v =>
        typeof v === "number"
            ? v
            : typeof v === "string"
              ? Number(v)
              : Number(v["@value"])
    );

//   ResourceId:
//   "https://example.org/x" -> "https://example.org/x"
//   { "@id": "https://example.org/x" } -> "https://example.org/x"
//   undefined -> undefined
const ResourceId = z
    .union([z.string(), z.object({ "@id": z.string() })])
    .transform(v => (typeof v === "string" ? v : v["@id"]))
    .optional();

// OneOrMany helper: T | T[] -> T[] (or [] if undefined)
const OneOrMany = <T extends z.ZodTypeAny>(schema: T) =>
    z
        .union([schema, z.array(schema)])
        .transform(v => (Array.isArray(v) ? v : v !== undefined ? [v] : []));

// Examples:
//   "Statistiques" -> ["Statistiques"]
//   [{ "@value": "A" }, "B"] -> ["A", "B"]
//   undefined -> []
const KeywordsSchema = OneOrMany(LiteralString)
    .transform(arr => arr.filter((x): x is string => typeof x === "string"))
    .optional();

const DistributionNodeSchema = z
    .object({
        "@id": z.string(),
        "@type": z.union([z.string(), z.array(z.string())]).optional(),
        "dct:identifier": LiteralString,
        "dct:title": LiteralString,
        "dct:description": LiteralString,
        "dct:license": ResourceId,
        "dcat:downloadURL": ResourceId,
        "dcat:accessURL": ResourceId,
        "dcat:mediaType": LiteralString,
        "dct:format": LiteralString,
        "dcat:filesize": z.number().optional(),
        "dcat:byteSize": LiteralNumber.optional(),
        "dct:issued": LiteralString,
        "dct:modified": LiteralString
    })
    .passthrough();

const DatasetNodeSchema = z
    .object({
        "@id": z.string(),
        "@type": z.union([z.string(), z.array(z.string())]).optional(),
        "dct:title": LiteralString,
        "dct:description": LiteralString,
        "dct:issued": LiteralString,
        "dct:modified": LiteralString,
        "dcat:landingPage": ResourceId,
        "dct:license": ResourceId,
        "dcat:keyword": KeywordsSchema,
        "dcat:distribution": z
            .union([z.null(), DistributionNodeSchema, z.array(DistributionNodeSchema)])
            .transform(v => (v === null ? [] : Array.isArray(v) ? v : [v]))
            .optional()
    })
    .passthrough();

const FramedCatalogSchema = z.preprocess(
    obj =>
        obj && typeof obj === "object" && "@graph" in (obj as Record<string, unknown>)
            ? obj
            : { "@graph": [obj] },
    z.object({ "@graph": z.array(DatasetNodeSchema) })
);
