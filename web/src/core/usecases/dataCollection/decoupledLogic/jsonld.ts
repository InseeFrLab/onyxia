import * as jsonld from "jsonld";
import { z } from "zod";
import type { JsonLdDocument } from "jsonld";

export async function fetchAndFrameCatalog(
    sourceUrl: string
): Promise<jsonld.NodeObject> {
    const res = await fetch(sourceUrl);

    if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status} : ${res.statusText}`);
    }

    const raw = await res.json();

    const framed = await jsonld.frame(raw, {
        "@context": raw["@context"],
        "@type": "dcat:Dataset",
        "dcat:distribution": {
            "@type": "dcat:Distribution"
        }
    });

    return framed;
}

export function catalogToDatasets(raw: JsonLdDocument) {
    const parsed = FramedCatalogSchema.safeParse(raw);

    console.log(parsed);
    if (!parsed.success) {
        console.warn("Invalid JSON-LD catalog", parsed.error);
        return [];
    }

    const graph = Array.isArray(parsed.data["@graph"])
        ? parsed.data["@graph"]
        : [parsed.data["@graph"]];

    return graph.map(dataset => {
        const dists = Array.isArray(dataset["dcat:distribution"])
            ? dataset["dcat:distribution"]
            : dataset["dcat:distribution"]
              ? [dataset["dcat:distribution"]]
              : [];

        return {
            id: dataset["@id"],
            title: dataset["dct:title"] ?? dataset["@id"],
            description: dataset["dct:description"],
            keywords: Array.isArray(dataset["dcat:keyword"])
                ? dataset["dcat:keyword"]
                : dataset["dcat:keyword"]
                  ? [dataset["dcat:keyword"]]
                  : [],
            issuedDate: dataset["dct:issued"]
                ? new Date(dataset["dct:issued"]).toLocaleDateString()
                : undefined,
            landingPageUrl: dataset["dcat:landingPage"],
            licenseUrl: dataset["dct:license"],
            distributions: dists.map(dist => ({
                id: dist["@id"],
                format: dist["dcat:mediaType"],
                size: dist["dcat:filesize"]
                    ? `${Math.round(dist["dcat:filesize"] / 1024)} Ko`
                    : undefined,
                downloadUrl: dist["dcat:downloadURL"],
                accessUrl: dist["dcat:accessURL"]
            }))
        };
    });
}

const DistributionSchema = z.object({
    "@id": z.string(),
    "@type": z.literal("dcat:Distribution"),
    "dct:identifier": z.string().optional(),
    "dct:title": z.string().optional(),
    "dct:description": z.string().optional(),
    "dct:license": z.string().optional(),
    "dcat:downloadURL": z.string().optional(),
    "dcat:mediaType": z.string().optional(),
    "dcat:filesize": z.number().optional(),
    "dcat:mime": z.string().optional(),
    "dcat:accessURL": z.string().optional()
});

const DatasetSchema = z.object({
    "@id": z.string(),
    "dct:title": z.string().optional(),
    "dct:description": z.string().optional(),
    "dcat:keyword": z.union([z.array(z.string()), z.string()]).optional(),
    "dct:issued": z.string().optional(),
    "dcat:landingPage": z.string().optional(),
    "dct:license": z.string().optional(),
    "dcat:distribution": z
        .union([DistributionSchema, z.array(DistributionSchema)])
        .nullable()
});

const GraphSchema = z.array(DatasetSchema);

const FramedCatalogSchema = z.object({
    "@graph": GraphSchema
});
