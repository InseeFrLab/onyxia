import type { SqlOlap } from "core/ports/SqlOlap";

import duckdbBrowserMvpWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdbMvpWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";

import duckdbBrowserEhWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import duckdbEhWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";

import duckdbBrowserCoiWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-coi.worker.js?url";
import duckdbBrowserCoiPThreadWorkerJsUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-coi.pthread.worker.js?url";
import duckdbCoiWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-coi.wasm?url";

import { assert, type Equals, type ReturnType, id, isAmong } from "tsafe";
import memoize from "memoizee";
import { createArrowTableApi } from "./utils/arrowTable";
import { inferFileType } from "./utils/inferFileType";
import type { S3Client } from "core/ports/S3Client";
import { Deferred } from "evt/tools/Deferred";
import { streamToArrayBuffer } from "core/tools/streamToArrayBuffer";

export const createDuckDbSqlOlap = (params: {
    getS3Client: () => Promise<
        | {
              errorCause: "need login" | "no s3 client";
              s3Client?: never;
              s3_endpoint?: never;
              s3_url_style?: never;
              s3_region?: never;
          }
        | {
              errorCause?: never;
              s3Client: S3Client;
              s3_endpoint: string;
              s3_url_style: "path" | "vhost";
              s3_region: string | undefined;
          }
    >;
}): SqlOlap => {
    const { getS3Client } = params;

    const prArrowTableApi = createArrowTableApi();

    const getHttpUrlWithoutRedirect = memoize(
        async (httpUrl: string) => {
            let response: Response;

            try {
                response = await fetch(httpUrl);
            } catch {
                return undefined;
            }

            return response.url;
        },
        { promise: true }
    );

    const sqlOlap: SqlOlap = {
        getConfiguredAsyncDuckDb: (() => {
            let hasInit = false;

            const prDb = getAsyncDuckDb();

            let s3FeatureStatus: SqlOlap.ReturnTypeOfGetConfiguredAsyncDuckDb.S3FeatureStatus;

            return async () => {
                const db = await prDb;

                let conn:
                    | import("@duckdb/duckdb-wasm").AsyncDuckDBConnection
                    | undefined = undefined;

                init: {
                    if (hasInit) {
                        break init;
                    }

                    conn = await db.connect();

                    await conn.query(
                        [
                            "LOAD httpfs;",
                            `SET custom_extension_repository = '${window.location.origin}${import.meta.env.BASE_URL}duckdb-extensions';`
                        ].join("\n")
                    );

                    hasInit = true;
                }

                setup_s3: {
                    const { errorCause, s3Client, s3_endpoint, s3_url_style, s3_region } =
                        await getS3Client();

                    if (errorCause !== undefined) {
                        s3FeatureStatus =
                            id<SqlOlap.ReturnTypeOfGetConfiguredAsyncDuckDb.S3FeatureStatus.NotCapable>(
                                {
                                    isS3Capable: false,
                                    reason: errorCause
                                }
                            );
                        break setup_s3;
                    }

                    if (conn === undefined) {
                        conn = await db.connect();
                    }

                    const tokens = await s3Client.getToken({ doForceRenew: false });

                    const query = [
                        "CREATE OR REPLACE SECRET onyxia_s3 (",
                        [
                            "TYPE s3",
                            "PROVIDER config",
                            `ENDPOINT '${s3_endpoint
                                .trim()
                                .replace(/^https?:\/\//, "")
                                .replace(/\/$/, "")}'`,
                            `URL_STYLE '${s3_url_style}'`,
                            `USE_SSL ${s3_endpoint.startsWith("http://") ? "false" : "true"}`,
                            ...(s3_region === undefined ? [] : [`REGION '${s3_region}'`]),
                            ...(tokens === undefined
                                ? []
                                : [
                                      `KEY_ID '${tokens.accessKeyId}'`,
                                      `SECRET '${tokens.secretAccessKey}'`,
                                      ...(tokens.sessionToken === undefined
                                          ? []
                                          : [`SESSION_TOKEN '${tokens.sessionToken}'`])
                                  ])
                        ]
                            .map(part => `    ${part}`)
                            .join(",\n"),
                        ");"
                    ].join("\n");

                    await conn.query(query);

                    s3FeatureStatus = {
                        isS3Capable: true
                    };
                }

                await conn?.close();

                return id<SqlOlap.ReturnTypeOfGetConfiguredAsyncDuckDb>({
                    db,
                    s3FeatureStatus
                });
            };
        })(),
        inferFileType: ({ sourceUrl }) => {
            const dOut = new Deferred<SqlOlap.ReturnTypeOfInferType>();

            const { protocol: sourceUrlProtocol } = new URL(sourceUrl);

            assert(isAmong(["https:", "s3:"], sourceUrlProtocol));

            const partialFetch = memoize(
                async () => {
                    switch (sourceUrlProtocol) {
                        case "https:": {
                            const response = await fetch(sourceUrl, {
                                method: "GET",
                                headers: { Range: "bytes=0-15" }
                            }).catch(error => {
                                assert(error instanceof Error);
                                dOut.resolve({ errorCause: "https fetch error" });
                                return new Promise<never>(() => {});
                            });

                            if (!response.ok) {
                                dOut.resolve({ errorCause: "https fetch error" });
                                return new Promise<never>(() => {});
                            }

                            return {
                                getContentType: () =>
                                    response.headers.get("Content-Type") ?? undefined,
                                getFirstBytes: async () => {
                                    try {
                                        return await response.arrayBuffer();
                                    } catch {
                                        dOut.resolve({ errorCause: "https fetch error" });
                                        return new Promise<never>(() => {});
                                    }
                                }
                            };
                        }
                        case "s3:": {
                            const { errorCause: errorCause_getS3Client, s3Client } =
                                await getS3Client();

                            if (errorCause_getS3Client !== undefined) {
                                dOut.resolve({ errorCause: errorCause_getS3Client });
                                return new Promise<never>(() => {});
                            }

                            const result = await s3Client.getFileContent({
                                path: sourceUrl.replace(/^s3:\/\//, ""),
                                range: "bytes=0-15"
                            });

                            const buffer = await streamToArrayBuffer(result.stream);

                            return {
                                getContentType: () => result.contentType ?? undefined,
                                getFirstBytes: async () => buffer
                            };
                        }
                        default:
                            assert<Equals<typeof sourceUrlProtocol, never>>(false);
                    }
                },
                { promise: true }
            );

            inferFileType({
                sourceUrl,
                getContentType: async () => {
                    const result = await partialFetch();
                    return result.getContentType();
                },
                getFirstBytes: async () => {
                    const result = await partialFetch();
                    return result.getFirstBytes();
                }
            }).then(fileType => {
                if (fileType === undefined) {
                    dOut.resolve({
                        errorCause: "unsupported file type"
                    });
                    return;
                }
                dOut.resolve(
                    id<SqlOlap.ReturnTypeOfInferType.Success>({
                        fileType,
                        sourceUrlProtocol
                    })
                );
            });

            return dOut.pr;
        },
        getRows: async ({ sourceUrl, rowsPerPage, page }) => {
            const {
                errorCause: errorCause_inferFileType,
                fileType,
                sourceUrlProtocol
            } = await sqlOlap.inferFileType({ sourceUrl });

            if (errorCause_inferFileType !== undefined) {
                return id<SqlOlap.ReturnTypeOfGetRows.Failed>({
                    errorCause: errorCause_inferFileType
                });
            }

            const { db, s3FeatureStatus } = await sqlOlap.getConfiguredAsyncDuckDb();

            if (sourceUrlProtocol === "s3:" && !s3FeatureStatus.isS3Capable) {
                return id<SqlOlap.ReturnTypeOfGetRows.Failed>({
                    errorCause: s3FeatureStatus.reason
                });
            }

            if (sourceUrlProtocol === "https:") {
                const sourceUrl_noRedirect = await getHttpUrlWithoutRedirect(sourceUrl);
                if (sourceUrl_noRedirect === undefined) {
                    return id<SqlOlap.ReturnTypeOfGetRows.Failed>({
                        errorCause: "https fetch error"
                    });
                }
                sourceUrl = sourceUrl_noRedirect;
            }

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

            const conn = await db.connect();
            const stmt = await conn.prepare(sqlQuery);

            let res: ReturnType<(typeof stmt)["query"]>;

            try {
                res = await stmt.query();
            } catch {
                return id<SqlOlap.ReturnTypeOfGetRows.Failed>({
                    errorCause: "query error"
                });
            } finally {
                conn.close();
            }

            const { arrowTableToJsData } = await prArrowTableApi;

            const { columns, rows } = arrowTableToJsData({ table: res });

            return id<SqlOlap.ReturnTypeOfGetRows.Success>({ rows, columns });
        },
        getRowCount: (() => {
            const getRowCount_memo = memoize(
                async (sourceUrl: string) => {
                    const {
                        errorCause: errorCause_inferFileType,
                        fileType,
                        sourceUrlProtocol
                    } = await sqlOlap.inferFileType({ sourceUrl });

                    if (errorCause_inferFileType !== undefined) {
                        return id<SqlOlap.ReturnTypeOfGetRowCount.Failed>({
                            errorCause: errorCause_inferFileType
                        });
                    }

                    if (fileType !== "parquet") {
                        return id<SqlOlap.ReturnTypeOfGetRowCount.Failed>({
                            errorCause: "not file type allowing querying row count"
                        });
                    }

                    const { db, s3FeatureStatus } =
                        await sqlOlap.getConfiguredAsyncDuckDb();

                    if (sourceUrlProtocol === "s3:" && !s3FeatureStatus.isS3Capable) {
                        return id<SqlOlap.ReturnTypeOfGetRowCount.Failed>({
                            errorCause: s3FeatureStatus.reason
                        });
                    }

                    if (sourceUrlProtocol === "https:") {
                        const sourceUrl_noRedirect =
                            await getHttpUrlWithoutRedirect(sourceUrl);
                        if (sourceUrl_noRedirect === undefined) {
                            return id<SqlOlap.ReturnTypeOfGetRowCount.Failed>({
                                errorCause: "https fetch error"
                            });
                        }
                        sourceUrl = sourceUrl_noRedirect;
                    }

                    const query = `SELECT count(*)::INTEGER as v FROM read_parquet("${sourceUrl}");`;

                    const conn = await db.connect();
                    const stmt = await conn.prepare(query);

                    let res: ReturnType<(typeof stmt)["query"]>;

                    try {
                        res = await stmt.query();
                    } catch {
                        return id<SqlOlap.ReturnTypeOfGetRowCount.Failed>({
                            errorCause: "query error"
                        });
                    } finally {
                        conn.close();
                    }
                    const rowCount = res.toArray()[0]["v"];

                    assert(typeof rowCount === "number");

                    return id<SqlOlap.ReturnTypeOfGetRowCount.Success>({
                        rowCount
                    });
                },
                { promise: true, max: 1 }
            );

            return ({ sourceUrl }) => getRowCount_memo(sourceUrl);
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

        await db.instantiate(
            bundle.mainModule,
            bundle.pthreadWorker
            //progress => console.log( `Loading DuckDB: ${~~((progress.bytesLoaded / progress.bytesTotal) * 100)}%`)
        );

        return db;
    },
    { promise: true }
);
