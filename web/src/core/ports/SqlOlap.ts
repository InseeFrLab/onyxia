import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

export type SqlOlap = {
    getConfiguredAsyncDuckDb: () => Promise<AsyncDuckDB>;
    getRowCount: (sourceUrl: string) => Promise<number | undefined>;
    getRows: (params: {
        sourceUrl: string;
        rowsPerPage: number;
        page: number;
    }) => Promise<any[]>;
};
