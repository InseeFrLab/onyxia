import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

export type SqlOlap = {
    getDb: () => Promise<AsyncDuckDB>;
    getRowCount: (sourceUrl: string) => Promise<number>;
    getRows: (params: {
        sourceUrl: string;
        limit: number;
        page: number;
    }) => Promise<any[]>;
};
