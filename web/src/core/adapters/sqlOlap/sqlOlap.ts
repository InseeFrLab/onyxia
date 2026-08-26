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
import { inferFileType as inferFileType_pure } from "./utils/inferFileType";
import type { S3Client } from "core/ports/S3Client";
import type { S3Profile } from "core/usecases/s3ProfilesManagement/decoupledLogic/s3Profiles";
import { Deferred } from "evt/tools/Deferred";
import { streamToArrayBuffer } from "core/tools/streamToArrayBuffer";
import { getHttpUrlWithoutRedirect } from "core/tools/getHttpUrlWithoutRedirect";
import { parseS3Uri } from "core/tools/S3Uri";

export const createDuckDbSqlOlap = (params: {
    getAmbientS3ProfileAndClient: () => Promise<
        | {
              s3Client: S3Client;
              s3Profile: S3Profile;
          }
        | undefined
    >;
}): SqlOlap => {
    const { getAmbientS3ProfileAndClient } = params;

    const prArrowTableApi = createArrowTableApi();

    const inferFileType = memoize((s3Client: S3Client | undefined, sourceUrl: string) => {
        const dOut = new Deferred<SqlOlap.ReturnTypeOfInferType>();

        const { protocol: sourceUrlProtocol } = new URL(sourceUrl);

        assert(isAmong(["https:", "s3:"], sourceUrlProtocol));

        const partialFetch = memoize(
            async () => {
                switch (sourceUrlProtocol) {
                    case "https:": {
                        const response = await fetch(sourceUrl, {
                            method: "GET",
                            redirect: "follow",
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

                        const httpUrl_withoutRedirect = response.url;

                        getHttpUrlWithoutRedirect.setResult({
                            httpUrl: sourceUrl,
                            httpUrl_withoutRedirect
                        });

                        return {
                            httpUrl_withoutRedirect,
                            contentType:
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
                        if (s3Client === undefined) {
                            dOut.resolve({ errorCause: "no s3 client" });
                            return new Promise<never>(() => {});
                        }
                        const s3Uri = parseS3Uri({
                            value: sourceUrl,
                            delimiter: "/"
                        });

                        assert(!s3Uri.isDelimiterTerminated);

                        const result = await s3Client.getObjectContent({
                            s3Uri,
                            range: "bytes=0-15"
                        });

                        const buffer = await streamToArrayBuffer(result.stream);

                        return {
                            httpUrl_withoutRedirect: undefined,
                            contentType: result.contentType ?? undefined,
                            getFirstBytes: async () => buffer
                        };
                    }
                    default:
                        assert<Equals<typeof sourceUrlProtocol, never>>(false);
                }
            },
            { promise: true }
        );

        inferFileType_pure({
            sourceUrl,
            getHttpUrlWithoutRedirect: async () => {
                const result = await partialFetch();
                return result.httpUrl_withoutRedirect;
            },
            getContentType: async () => {
                const result = await partialFetch();
                return result.contentType;
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
    });

    // NOTE: Eager background warmup.
    const prDb = (async () => {
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
            new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING),
            new Worker(bundle.mainWorker)
        );

        await db.instantiate(
            bundle.mainModule,
            bundle.pthreadWorker
            //progress => console.log( `Loading DuckDB: ${~~((progress.bytesLoaded / progress.bytesTotal) * 100)}%`)
        );

        let query = [
            `SET custom_extension_repository = '${window.location.origin}${import.meta.env.BASE_URL}duckdb-extensions';`,
            "LOAD httpfs;"
        ].join("\n");

        const conn = await db.connect();
        await conn.query(query);
        conn.close();

        return db;
    })();

    const getConfiguredAsyncDuckDb = async (
        s3Profile: S3Profile | undefined,
        s3Client: S3Client | undefined
    ) => {
        const db = await prDb;

        setup_s3: {
            if (s3Profile === undefined) {
                break setup_s3;
            }

            assert(s3Client !== undefined);

            const tokens = await s3Client.getToken({ doForceRenew: false });

            const s3_endpoint = s3Profile.paramsOfCreateS3Client.url;
            const s3_url_style = s3Profile.paramsOfCreateS3Client.pathStyleAccess
                ? "path"
                : "vhost";
            const s3_region = s3Profile.paramsOfCreateS3Client.region;

            const query = [
                "",
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

            const conn = await db.connect();
            await conn.query(query);
            conn.close();
        }

        return db;
    };

    const sqlOlap: SqlOlap = {
        getConfiguredAsyncDuckDb: async () => {
            const { s3Client, s3Profile } = (await getAmbientS3ProfileAndClient()) ?? {};
            return getConfiguredAsyncDuckDb(s3Profile, s3Client);
        },
        inferFileType: async ({ sourceUrl }) => {
            const { s3Client } = (await getAmbientS3ProfileAndClient()) ?? {};

            return inferFileType(s3Client, sourceUrl);
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

            const { s3Profile, s3Client } = (await getAmbientS3ProfileAndClient()) ?? {};

            if (sourceUrlProtocol === "s3:" && s3Profile === undefined) {
                return id<SqlOlap.ReturnTypeOfGetRows.Failed>({
                    errorCause: "no s3 client"
                });
            }

            if (sourceUrlProtocol === "https:") {
                const sourceUrl_noRedirect = await getHttpUrlWithoutRedirect({
                    httpUrl: sourceUrl
                });
                if (sourceUrl_noRedirect === undefined) {
                    return id<SqlOlap.ReturnTypeOfGetRows.Failed>({
                        errorCause: "https fetch error"
                    });
                }
                sourceUrl = sourceUrl_noRedirect;
            }

            let sqlQuery = `SELECT * FROM ${(() => {
                switch (fileType) {
                    case "csv":
                        return `read_csv('${sourceUrl}')`;
                    case "parquet":
                        return `read_parquet('${sourceUrl}')`;
                    case "json":
                        return `read_json('${sourceUrl}')`;
                }
            })()} LIMIT ${rowsPerPage}`;

            if (page !== 1) {
                sqlQuery += ` OFFSET ${rowsPerPage * (page - 1)}`;
            }

            const db = await getConfiguredAsyncDuckDb(s3Profile, s3Client);

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

                    const { s3Profile, s3Client } =
                        (await getAmbientS3ProfileAndClient()) ?? {};

                    if (sourceUrlProtocol === "s3:" && s3Client === undefined) {
                        return id<SqlOlap.ReturnTypeOfGetRowCount.Failed>({
                            errorCause: "no s3 client"
                        });
                    }

                    if (sourceUrlProtocol === "https:") {
                        const sourceUrl_noRedirect = await getHttpUrlWithoutRedirect({
                            httpUrl: sourceUrl
                        });
                        if (sourceUrl_noRedirect === undefined) {
                            return id<SqlOlap.ReturnTypeOfGetRowCount.Failed>({
                                errorCause: "https fetch error"
                            });
                        }
                        sourceUrl = sourceUrl_noRedirect;
                    }

                    const query = `SELECT count(*)::INTEGER as v FROM read_parquet("${sourceUrl}");`;

                    const db = await getConfiguredAsyncDuckDb(s3Profile, s3Client);
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
