import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

export type SqlOlap = {
    getConfiguredAsyncDuckDb: () => Promise<AsyncDuckDB>;
    getRowCount: (params: {
        sourceUrl: string;
        fileType: "parquet" | "csv" | "json";
    }) => Promise<number | undefined>;
    getRows: (params: {
        sourceUrl: string;
        fileType: "parquet" | "csv" | "json";
        rowsPerPage: number;
        page: number;
    }) => Promise<{ rows: Record<string, unknown>[]; columns: Column[] }>;
};

export type Column = {
    name: string;
    type: "string" | "number" | "boolean" | "date" | "dateTime" | "binary" | "time";
    displayType: string;
};
