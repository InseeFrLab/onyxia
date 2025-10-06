import { z } from "zod";
import jsonld from "jsonld";
import {
    zLocalizedArrayInput,
    zLocalizedInput,
    toLocalizedString,
    toLocalizedStringList
} from "./ldLocalized";
import { assert, id } from "tsafe";
import type { QueryResponse } from "./performQuery";
import type { View } from "../selectors";

export async function fetchCatalogDocuments(sourceUrl: string): Promise<
    | {
          isSuccess: true;
          framedCatalog: jsonld.NodeObject;
          errorMessage?: never;
          errorCause?: never;
      }
    | {
          isSuccess: false;
          errorCause: QueryResponse.Failed["errorCause"];
          errorMessage: string;
          framedCatalog?: never;
      }
> {
    const res = await fetch(sourceUrl, { redirect: "follow" }).catch(error => {
        assert(error instanceof Error);
        return error;
    });

    if (res instanceof Error) {
        return {
            isSuccess: false,
            errorCause: "https fetch error",
            errorMessage: res.message
        };
    }

    if (!res.ok) {
        return {
            isSuccess: false,
            errorCause: "https fetch error",
            errorMessage: `${res.status} ${res.statusText}`
        };
    }

    const jsonLdDocument = await res.json().then(
        jsonLdDocument => jsonLdDocument as jsonld.JsonLdDocument,
        error => {
            assert(error instanceof Error);
            return error;
        }
    );

    if (jsonLdDocument instanceof Error) {
        return {
            isSuccess: false,
            errorCause: "invalid json response",
            errorMessage: jsonLdDocument.message
        };
    }

    let compactedCatalog: jsonld.NodeObject;

    try {
        compactedCatalog = await jsonld.compact(jsonLdDocument, {
            dcat: "http://www.w3.org/ns/dcat#",
            dct: "http://purl.org/dc/terms/"
        });
    } catch (error) {
        assert(error instanceof Error);
        return {
            isSuccess: false,
            errorCause: "json-ld compact error",
            errorMessage: error.message
        };
    }

    let framedCatalog: jsonld.NodeObject;

    try {
        framedCatalog = await jsonld.frame(compactedCatalog, {
            "@context": compactedCatalog["@context"],
            "@type": "dcat:Dataset",
            "dcat:distribution": { "@type": "dcat:Distribution" }
        });
    } catch (error) {
        assert(error instanceof Error);
        return {
            isSuccess: false,
            errorCause: "json-ld frame error",
            errorMessage: error.message
        };
    }

    return {
        isSuccess: true,
        framedCatalog
    };
}

export function catalogToDatasets(framedCatalog: jsonld.NodeObject) {
    const {
        success,
        data: framedCatalog_parsed,
        error
    } = zFramedCatalogSchema.safeParse(framedCatalog);

    if (!success) {
        const parsingErrors = error.issues.map(({ path, message }) => {
            const formattedPath = path.length === 0 ? "<root>" : path.join(".");
            return `${formattedPath}: ${message}`;
        });

        return { datasets: undefined, parsingErrors };
    }

    const { "@graph": graph } = framedCatalog_parsed;

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

            return id<View.CatalogView.Distribution>({
                id: distrib["@id"],
                format,
                downloadUrl: distrib["dcat:downloadURL"],
                accessUrl: distrib["dcat:accessURL"],
                sizeInBytes: sizeInBytes ?? undefined
            });
        });

        const titleLs = d["dct:title"] ?? d["@id"];
        const descriptionLs = d["dct:description"];

        return id<View.CatalogView.Dataset>({
            id: d["@id"],
            title: titleLs,
            description: descriptionLs,
            keywords: d["dcat:keyword"],
            issuedDate: d["dct:issued"],
            landingPageUrl: d["dcat:landingPage"],
            licenseUrl: d["dct:license"],
            distributions
        });
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
    )
    .refine(n => Number.isFinite(n), { message: "Invalid numeric literal" });

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
