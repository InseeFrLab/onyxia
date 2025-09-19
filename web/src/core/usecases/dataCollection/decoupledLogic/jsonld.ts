import { z } from "zod";
import jsonld from "jsonld";
import type { State } from "../state";
import {
    zLocalizedArrayInput,
    zLocalizedInput,
    toLocalizedString,
    toLocalizedStringList
} from "./ldLocalized";

export async function fetchCatalogDocuments(sourceUrl: string) {
    const res = await fetch(sourceUrl, { redirect: "follow" });
    if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status} : ${res.statusText}`);
    }

    const rawCatalog = await res.json();

    const compactedCatalog = await jsonld.compact(rawCatalog, {
        ...(rawCatalog["@context"] ?? {}),
        dcat: "http://www.w3.org/ns/dcat#",
        dct: "http://purl.org/dc/terms/"
    });

    const framedCatalog = await jsonld.frame(compactedCatalog, {
        "@context": compactedCatalog["@context"],
        "@type": "dcat:Dataset",
        "dcat:distribution": { "@type": "dcat:Distribution" }
    });

    return {
        rawCatalog,
        compactedCatalog,
        framedCatalog
    };
}

export function catalogToDatasets(framedCatalog: unknown): {
    datasets: State.Dataset[] | undefined;
    parsingErrors: string[] | undefined;
} {
    if (framedCatalog == null) {
        return { datasets: undefined, parsingErrors: undefined };
    }

    const parsed = zFramedCatalogSchema.safeParse(framedCatalog);

    if (!parsed.success) {
        const parsingErrors = parsed.error.issues.map(({ path, message }) => {
            const formattedPath = path.length === 0 ? "<root>" : path.join(".");
            return `${formattedPath}: ${message}`;
        });

        return { datasets: undefined, parsingErrors };
    }

    const { "@graph": graph } = parsed.data;

    const datasets = graph.map(d => {
        const distributions = (d["dcat:distribution"] ?? []).map(distrib => {
            const format =
                distrib["dcat:mediaType"] ?? distrib["dct:format"] ?? undefined;

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

        const titleLs = d["dct:title"] ?? d["@id"];
        const descriptionLs = d["dct:description"];

        return {
            id: d["@id"],
            title: titleLs,
            description: descriptionLs,
            keywords: d["dcat:keyword"],
            issuedDate: d["dct:issued"],
            landingPageUrl: d["dcat:landingPage"],
            licenseUrl: d["dct:license"],
            distributions
        } satisfies State.Dataset;
    });

    return { datasets, parsingErrors: undefined };
}

//   LiteralString:
//   "foo" -> "foo"
//   { "@value": "foo" } -> "foo"
//   undefined -> undefined
const zLiteralStringBase = z
    .union([z.string(), z.object({ "@value": z.string() })])
    .transform(v => (typeof v === "string" ? v : v["@value"]))
    .pipe(z.string());

const zLiteralString = zLiteralStringBase.optional();

//   LiteralNumber accepts number | string | {"@value": number|string}
//   123 -> 123
//   "123" -> 123
//   { "@value": "123" } -> 123
//   { "@value": 123 } -> 123
const zLiteralNumber = z
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
const zResourceIdBase = z
    .union([z.string(), z.object({ "@id": z.string() })])
    .transform(v => (typeof v === "string" ? v : v["@id"]))
    .pipe(z.string());

const zResourceId = zResourceIdBase.optional();

const zLiteralOrResourceId = z
    .union([zLiteralStringBase, zResourceIdBase])
    .transform(v => v)
    .optional();

const zLocalizedOptional = z
    .union([zLocalizedInput, z.undefined(), z.null()])
    .transform(v => (v == null ? undefined : toLocalizedString(v)));

const zLocalizedArrayOptional = z
    .union([zLocalizedArrayInput, z.undefined(), z.null()])
    .transform(v => (v == null ? undefined : toLocalizedStringList(v)));

const zDistributionNodeSchema = z
    .object({
        "@id": z.string(),
        "@type": z.union([z.string(), z.array(z.string())]).optional(),
        "dct:identifier": zLiteralString,
        "dct:title": zLocalizedOptional,
        "dct:description": zLocalizedOptional,
        "dct:license": zResourceId,
        "dcat:downloadURL": zResourceId,
        "dcat:accessURL": zResourceId,
        "dcat:mediaType": zLiteralOrResourceId,
        "dct:format": zLiteralOrResourceId,
        "dcat:filesize": z.number().optional(),
        "dcat:byteSize": zLiteralNumber.optional(),
        "dct:issued": zLiteralString,
        "dct:modified": zLiteralString
    })
    .passthrough();

const zDatasetNodeSchema = z
    .object({
        "@id": z.string(),
        "@type": z.union([z.string(), z.array(z.string())]).optional(),
        "dct:title": zLocalizedOptional,
        "dct:description": zLocalizedOptional,
        "dct:issued": zLiteralString,
        "dct:modified": zLiteralString,
        "dcat:landingPage": zResourceId,
        "dct:license": zResourceId,
        "dcat:keyword": zLocalizedArrayOptional,
        "dcat:distribution": z
            .union([z.null(), zDistributionNodeSchema, z.array(zDistributionNodeSchema)])
            .transform(v => (v === null ? [] : Array.isArray(v) ? v : [v]))
            .optional()
    })
    .passthrough();

const zFramedCatalogSchema = z.preprocess(
    obj =>
        obj && typeof obj === "object" && "@graph" in (obj as Record<string, unknown>)
            ? obj
            : { "@graph": [obj] },
    z.object({ "@graph": z.array(zDatasetNodeSchema) })
);
