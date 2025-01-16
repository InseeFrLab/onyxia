import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

export type SqlOlap = {
    getConfiguredAsyncDuckDb: () => Promise<AsyncDuckDB>;
    getRowCount: (params: {
        sourceUrl: string;
        fileType: "parquet" | "csv" | "json";
    }) => Promise<number | undefined>;
    getRowsAndColumns: (params: {
        sourceUrl: string;
        fileType: "parquet" | "csv" | "json";
        rowsPerPage: number;
        page: number;
    }) => Promise<{ rows: unknown[]; columns: Column[] }>;
    getRows: (params: {
        sourceUrl: string;
        fileType: "parquet" | "csv" | "json";
        rowsPerPage: number;
        page: number;
        columns: Column[];
    }) => Promise<{ rows: unknown[] }>;
};

export type Column = {
    name: string;
    type: "string" | "number" | "bigint" | "boolean" | "date" | "dateTime" | "binary";
    rowType: string;
};
