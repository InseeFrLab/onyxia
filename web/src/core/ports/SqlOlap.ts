import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

export type SqlOlap = {
    getConfiguredAsyncDuckDb: () => Promise<AsyncDuckDB>;
    getRowCount: (params: {
        sourceUrl: string;
    }) => Promise<SqlOlap.ReturnTypeOfGetRowCount>;
    getRows: (params: {
        sourceUrl: string;
        rowsPerPage: number;
        page: number;
    }) => Promise<SqlOlap.ReturnTypeOfGetRows>;
    inferFileType: (params: {
        sourceUrl: string;
    }) => Promise<SqlOlap.ReturnTypeOfInferType>;
};

export namespace SqlOlap {
    export type ReturnTypeOfInferType =
        | ReturnTypeOfInferType.Failed
        | ReturnTypeOfInferType.Success;

    export namespace ReturnTypeOfInferType {
        export type Failed = {
            errorCause:
                | "no s3 client"
                | "unsupported protocol"
                | "https fetch error"
                | "query error"
                | "unsupported file type";
            fileType?: never;
            sourceUrlProtocol?: never;
        };

        export type Success = {
            errorCause?: never;
            fileType: "parquet" | "csv" | "json";
            sourceUrlProtocol: "https:" | "s3:";
        };
    }

    export type ReturnTypeOfGetRowCount =
        | ReturnTypeOfGetRowCount.Success
        | ReturnTypeOfGetRowCount.Failed;

    export namespace ReturnTypeOfGetRowCount {
        export type Failed = {
            errorCause:
                | ReturnTypeOfInferType.Failed["errorCause"]
                | "not file type allowing querying row count";
            rowCount?: never;
        };

        export type Success = {
            errorCause?: never;
            rowCount: number;
        };
    }

    export type ReturnTypeOfGetRows =
        | ReturnTypeOfGetRows.Failed
        | ReturnTypeOfGetRows.Success;

    export namespace ReturnTypeOfGetRows {
        export type Failed = {
            errorCause: ReturnTypeOfInferType.Failed["errorCause"];
            rows?: never;
            columns?: never;
        };

        export type Success = {
            errorCause?: never;
            rows: Record<string, unknown>[];
            columns: Success.Column[];
        };

        export namespace Success {
            export type Column = {
                name: string;
                type:
                    | "string"
                    | "number"
                    | "boolean"
                    | "date"
                    | "dateTime"
                    | "binary"
                    | "time";
                displayType: string;
            };
        }
    }
}
