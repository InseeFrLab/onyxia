import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

export type SqlOlap = {
    getDb: () => Promise<AsyncDuckDB>;
    getData(params: { sourceUrl: string; limit: number; offset: number }): Promise<any[]>;
};
