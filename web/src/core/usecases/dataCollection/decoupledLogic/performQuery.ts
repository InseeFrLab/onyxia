import { id } from "tsafe";
import type { NodeObject } from "jsonld";
import { fetchCatalogDocuments } from "./jsonld";

export type QueryRequest = {
    source: string;
};

export type QueryResponse = QueryResponse.Success | QueryResponse.Failed;

export namespace QueryResponse {
    export type Success = {
        isSuccess: true;
        framedCatalog: NodeObject;
    };

    export type Failed = {
        isSuccess: false;
        errorCause:
            | "https fetch error"
            | "invalid json response"
            | "json-ld compact error"
            | "json-ld frame error"
            | "datasets parsing error";
        errorMessages: string[];
    };
}

export async function performQuery(params: {
    queryRequest: QueryRequest;
    getShouldAbort: () => boolean;
}): Promise<QueryResponse> {
    const { queryRequest, getShouldAbort } = params;

    const { source } = queryRequest;
    if (getShouldAbort()) {
        return new Promise<never>(() => {});
    }

    const { isSuccess, errorCause, errorMessage, framedCatalog } =
        await fetchCatalogDocuments(source);

    if (!isSuccess) {
        return {
            isSuccess: false,
            errorCause,
            errorMessages: [errorMessage]
        };
    }

    return id<QueryResponse>({
        isSuccess: true,
        framedCatalog
    });
}
