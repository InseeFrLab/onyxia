import type { SqlOlap } from "core/ports/SqlOlap";
import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import duckdbBrowserMvpWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js";
import duckdbMvpWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm";
import duckdbEhWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm";
import duckdbBrowserEhWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js";
import { Deferred } from "evt/tools/Deferred";
import { assert } from "tsafe/assert";
import memoize from "memoizee";
import { same } from "evt/tools/inDepth/same";
import type { ReturnType } from "tsafe";

export const createDuckDbSqlOlap = (params: {
    getS3Config: () => Promise<{
        s3_endpoint: string;
        s3_access_key_id: string;
        s3_secret_access_key: string;
        s3_session_token: string | undefined;
        s3_url_style: "path" | "vhost";
    }>;
}): SqlOlap => {
    const { getS3Config } = params;

    let currentS3Config: ReturnType<typeof getS3Config> | undefined = undefined;

    async function configureS3(conn: AsyncDuckDBConnection) {
        const s3Config = await getS3Config();

        if (same(s3Config, currentS3Config)) {
            return;
        }

        currentS3Config = s3Config;

        const {
            s3_endpoint,
            s3_access_key_id,
            s3_secret_access_key,
            s3_session_token
            //s3_url_style
        } = s3Config;

        await conn.query(
            [
                `SET s3_endpoint = '${s3_endpoint}';`,
                `SET s3_access_key_id = '${s3_access_key_id}';`,
                `SET s3_secret_access_key = '${s3_secret_access_key}';`,
                ...(s3_session_token === undefined
                    ? []
                    : [`SET s3_session_token = '${s3_session_token}';`])
                //`SET s3_url_style = '${s3_url_style}';`
            ].join("\n")
        );
    }

    let dDb: Deferred<AsyncDuckDB> | undefined = undefined;

    const sqlOlap: SqlOlap = {
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

            assert(bundle.mainWorker !== null);

            const db = new duckdb.AsyncDuckDB(
                new duckdb.ConsoleLogger(),
                new Worker(bundle.mainWorker)
            );
            await db.instantiate(bundle.mainModule);

            dDb.resolve(db);

            return db;
        },
        "getRows": async ({ sourceUrl, rowsPerPage, page }) => {
            const db = await sqlOlap.getDb();

            const conn = await db.connect();

            if (sourceUrl.startsWith("s3://")) {
                await configureS3(conn);
            }

            const stmt = await conn.prepare(
                `SELECT * FROM "${sourceUrl}" LIMIT ${rowsPerPage} OFFSET ${
                    rowsPerPage * (page - 1)
                }`
            );

            const res = await stmt.query();

            const rows = JSON.parse(
                JSON.stringify(res.toArray(), (_key, value) => {
                    if (typeof value === "bigint") {
                        return value.toString();
                    }

                    if (value instanceof Uint8Array) {
                        return Array.from(value)
                            .map(byte => byte.toString(16).padStart(2, "0"))
                            .join("");
                    }

                    return value;
                })
            );

            await conn.close();

            return rows;
        },
        "getRowCount": memoize(
            async sourceUrl => {
                if (!new URL(sourceUrl).pathname.endsWith(".parquet")) {
                    return undefined;
                }

                const db = await sqlOlap.getDb();

                const conn = await db.connect();

                if (sourceUrl.startsWith("s3://")) {
                    await configureS3(conn);
                }

                const stmt = await conn.prepare(
                    `SELECT count(*)::INTEGER as v FROM "${sourceUrl}";`
                );

                const res = await stmt.query();

                const count: number = JSON.parse(JSON.stringify(res.toArray()))[0]["v"];

                return count;
            },
            { "promise": true, "max": 1 }
        )
    };

    return sqlOlap;
};
