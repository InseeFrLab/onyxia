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
    }) => Promise<any[]>;
};
