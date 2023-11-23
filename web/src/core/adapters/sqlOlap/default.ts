import type { SqlOlap } from "core/ports/SqlOlap";
import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import duckdbBrowserMvpWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js";
import duckdbMvpWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm";
import duckdbEhWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm";
import duckdbBrowserEhWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js";
import { Deferred } from "evt/tools/Deferred";

export const createSqlOlap = (): SqlOlap => {
    let dDb: Deferred<AsyncDuckDB> | undefined = undefined;

    return {
        "getDb": async () => {
            if (dDb !== undefined) {
                return dDb.pr;
            }

            dDb = new Deferred();

            const duckdb = await import("@duckdb/duckdb-wasm");
            const bundle = await duckdb.selectBundle({
                "mvp": {
                    "mainModule": duckdbMvpWasmUrl,
                    "mainWorker": duckdbBrowserMvpWorkerJsUrl
                },
                "eh": {
                    "mainModule": duckdbEhWasmUrl,
                    "mainWorker": duckdbBrowserEhWorkerJsUrl
                }
            });
            const logger = new duckdb.ConsoleLogger();
            const worker = new Worker(bundle.mainWorker!);
            const db = new duckdb.AsyncDuckDB(logger, worker);
            await db.instantiate(bundle.mainModule);

            dDb.resolve(db);

            return db;
        }
    };
};
