import type { SqlOlap } from "core/ports/SqlOlap";
import { assert, type Equals, id } from "tsafe";

export type QueryRequest = {
    source: string;
    rowsPerPage: number;
    page: number;
};

export type QueryResponse = QueryResponse.Success | QueryResponse.Failed;

export namespace QueryResponse {
    export type Success = {
        isSuccess: true;
        data: {
            rows: Record<string, unknown>[];
            columns: SqlOlap.ReturnTypeOfGetRows.Success.Column[];
            rowCount: number | undefined;
        };
    };

    export type Failed = {
        isSuccess: false;
        errorCause:
            | "no s3 client"
            | "unsupported protocol"
            | "https fetch error"
            | "query error"
            | "unsupported file type";
    };
}

export async function performQuery(params: {
    sqlOlap: SqlOlap;
    login: () => Promise<never>;
    queryRequest: QueryRequest;
    getShouldAbort: () => boolean;
}): Promise<QueryResponse> {
    const { sqlOlap, login, queryRequest, getShouldAbort } = params;

    const { errorCause: errorCause_getRowCount, rowCount } = await sqlOlap.getRowCount({
        sourceUrl: queryRequest.source
    });

    if (getShouldAbort()) {
        return new Promise<never>(() => {});
    }

    if (errorCause_getRowCount !== undefined) {
        switch (errorCause_getRowCount) {
            case "need login":
                await login();
                assert(false);
                break;
            case "not file type allowing querying row count":
                break;
            case "https fetch error":
            case "no s3 client":
            case "query error":
            case "unsupported file type":
            case "unsupported protocol":
                return id<QueryResponse.Failed>({
                    isSuccess: false,
                    errorCause: errorCause_getRowCount
                });
            default:
                assert<Equals<typeof errorCause_getRowCount, never>>(false);
        }
    }

    const {
        errorCause: errorCause_getRows,
        rows,
        columns
    } = await sqlOlap.getRows({
        sourceUrl: queryRequest.source,
        page: queryRequest.page,
        rowsPerPage: queryRequest.rowsPerPage
    });

    if (getShouldAbort()) {
        return new Promise<never>(() => {});
    }

    if (errorCause_getRows !== undefined) {
        assert(errorCause_getRows !== "need login");
        switch (errorCause_getRows) {
            case "no s3 client":
            case "https fetch error":
            case "query error":
            case "unsupported file type":
            case "unsupported protocol":
                return id<QueryResponse.Failed>({
                    isSuccess: false,
                    errorCause: errorCause_getRows
                });
            default:
                assert<Equals<typeof errorCause_getRows, never>>(false);
        }
    }

    return id<QueryResponse>({
        isSuccess: true,
        data: { rowCount, rows, columns }
    });
}
