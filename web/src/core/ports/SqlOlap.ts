import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

export type SqlOlap = {
    getDb: () => Promise<AsyncDuckDB>;
};
