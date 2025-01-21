import type { SqlOlap } from "core/ports/SqlOlap";

import duckdbBrowserMvpWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdbMvpWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";

import duckdbBrowserEhWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import duckdbEhWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";

import duckdbBrowserCoiWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-coi.worker.js?url";
import duckdbBrowserCoiPThreadWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-coi.pthread.worker.js?url";
import duckdbCoiWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-coi.wasm?url";

import { assert } from "tsafe/assert";
import memoize from "memoizee";
import { same } from "evt/tools/inDepth/same";
import type { ReturnType } from "tsafe";
import { createArrowTableApi } from "./utils/arrowTable";

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

    const prArrowTableApi = createArrowTableApi();

    const sqlOlap: SqlOlap = {
        getConfiguredAsyncDuckDb: (() => {
            let hasCustomExtensionRepositoryBeenSetup = false;
            let currentS3Config: ReturnType<typeof getS3Config> = undefined;

            return async () => {
                const db = await getAsyncDuckDb();

                let conn:
                    | import("@duckdb/duckdb-wasm").AsyncDuckDBConnection
                    | undefined = undefined;

                setup_custom_extension_repository: {
                    if (hasCustomExtensionRepositoryBeenSetup) {
                        break setup_custom_extension_repository;
                    }

                    conn = await db.connect();

                    await conn.query(
                        `SET custom_extension_repository = '${window.location.origin}${import.meta.env.BASE_URL}duckdb-extensions';`
                    );
                }

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

                    if (conn === undefined) {
                        conn = await db.connect();
                    }

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
                }

                await conn?.close();

                return db;
            };
        })(),
        getRows: async ({ sourceUrl, fileType, rowsPerPage, page }) => {
            const db = await sqlOlap.getConfiguredAsyncDuckDb();
            const conn = await db.connect();

            const sqlQuery = `SELECT * FROM ${(() => {
                switch (fileType) {
                    case "csv":
                        return `read_csv('${sourceUrl}')`;
                    case "parquet":
                        return `read_parquet('${sourceUrl}')`;
                    case "json":
                        return `read_json('${sourceUrl}')`;
                }
            })()} LIMIT ${rowsPerPage} OFFSET ${rowsPerPage * (page - 1)}`;

            const stmt = await conn.prepare(sqlQuery);
            const res = await stmt.query();

            const { arrowTableToColumns, arrowTableToRows } = await prArrowTableApi;

            const columns = arrowTableToColumns({ table: res });
            const rows = arrowTableToRows({ table: res, columns });

            await conn.close();

            return { rows, columns };
        },
        getRowCount: (() => {
            const getRowCount_memo = memoize(
                async (sourceUrl: string, fileType: "parquet" | "json" | "csv") => {
                    if (fileType !== "parquet") {
                        return undefined;
                    }

                    const db = await sqlOlap.getConfiguredAsyncDuckDb();

                    const conn = await db.connect();

                    const query = `SELECT count(*)::INTEGER as v FROM read_parquet("${sourceUrl}");`;

                    return conn
                        .prepare(query)
                        .then(stmt => stmt.query())
                        .then(res => res.toArray()[0]["v"])
                        .finally(() => conn.close());
                },
                { promise: true, max: 1 }
            );

            return ({ sourceUrl, fileType }) => getRowCount_memo(sourceUrl, fileType);
        })()
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
            },
            coi: {
                mainModule: duckdbCoiWasmUrl,
                mainWorker: duckdbBrowserCoiWorkerJsUrl,
                pthreadWorker: duckdbBrowserCoiPThreadWorkerJsUrl
            }
        });

        assert(bundle.mainWorker !== null);

        const db = new duckdb.AsyncDuckDB(
            new duckdb.ConsoleLogger(),
            new Worker(bundle.mainWorker)
        );

        await db.instantiate(bundle.mainModule, bundle.pthreadWorker, progress =>
            console.log(
                `Loading DuckDB: ${~~((progress.bytesLoaded / progress.bytesTotal) * 100)}%`
            )
        );

        return db;
    },
    { promise: true }
);
