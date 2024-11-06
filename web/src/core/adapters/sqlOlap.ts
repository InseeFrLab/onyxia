import type { SqlOlap } from "core/ports/SqlOlap";
import duckdbBrowserMvpWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdbMvpWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdbEhWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import duckdbBrowserEhWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import { assert } from "tsafe/assert";
import memoize from "memoizee";
import { same } from "evt/tools/inDepth/same";
import type { ReturnType } from "tsafe";

export const createDuckDbSqlOlap = (params: {
    getS3Config: () => Promise<
        | {
              s3_endpoint: string;
              s3_url_style: "path" | "vhost";
              credentials:
                  | {
                        s3_access_key_id: string;
                        s3_secret_access_key: string;
                        s3_session_token: string | undefined;
                    }
                  | undefined;
          }
        | undefined
    >;
}): SqlOlap => {
    const { getS3Config } = params;

    const sqlOlap: SqlOlap = {
        getConfiguredAsyncDuckDb: (() => {
            let currentS3Config: ReturnType<typeof getS3Config> = undefined;

            return async () => {
                const db = await getAsyncDuckDb();

                setup_s3: {
                    const s3Config = await getS3Config();

                    if (s3Config === undefined) {
                        break setup_s3;
                    }

                    if (same(s3Config, currentS3Config)) {
                        break setup_s3;
                    }

                    currentS3Config = s3Config;

                    const {
                        s3_endpoint,
                        //s3_url_style,
                        credentials
                    } = s3Config;

                    const conn = await db.connect();

                    await conn.query(
                        [
                            `SET s3_endpoint = '${s3_endpoint}';`,
                            // https://github.com/duckdb/duckdb-wasm/issues/1207
                            //`SET s3_url_style = '${s3_url_style}';`
                            ...(credentials === undefined
                                ? []
                                : [
                                      `SET s3_access_key_id = '${credentials.s3_access_key_id}';`,
                                      `SET s3_secret_access_key = '${credentials.s3_secret_access_key}';`,
                                      ...(credentials.s3_session_token === undefined
                                          ? []
                                          : [
                                                `SET s3_session_token = '${credentials.s3_session_token}';`
                                            ])
                                  ])
                        ].join("\n")
                    );

                    await conn.close();
                }

                return db;
            };
        })(),
        getRows: async ({ sourceUrl, rowsPerPage, page }) => {
            const db = await sqlOlap.getConfiguredAsyncDuckDb();

            const conn = await db.connect();

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
        getRowCount: memoize(
            async sourceUrl => {
                if (!new URL(sourceUrl).pathname.endsWith(".parquet")) {
                    return undefined;
                }

                const db = await sqlOlap.getConfiguredAsyncDuckDb();

                const conn = await db.connect();

                const stmt = await conn.prepare(
                    `SELECT count(*)::INTEGER as v FROM "${sourceUrl}";`
                );

                const res = await stmt.query();

                const count: number = JSON.parse(JSON.stringify(res.toArray()))[0]["v"];

                return count;
            },
            { promise: true, max: 1 }
        )
    };

    return sqlOlap;
};

const getAsyncDuckDb = memoize(
    async () => {
        const duckdb = await import("@duckdb/duckdb-wasm");
        const bundle = await duckdb.selectBundle({
            mvp: {
                mainModule: duckdbMvpWasmUrl,
                mainWorker: duckdbBrowserMvpWorkerJsUrl
            },
            eh: {
                mainModule: duckdbEhWasmUrl,
                mainWorker: duckdbBrowserEhWorkerJsUrl
            }
        });

        assert(bundle.mainWorker !== null);

        const db = new duckdb.AsyncDuckDB(
            new duckdb.ConsoleLogger(),
            new Worker(bundle.mainWorker)
        );
        await db.instantiate(bundle.mainModule);

        return db;
    },
    { promise: true }
);
