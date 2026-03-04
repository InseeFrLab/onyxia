import type { IcebergApi } from "core/ports/IcebergApi";
import type { SqlOlap } from "core/ports/SqlOlap";
import { id } from "tsafe/id";

export type IcebergCatalogConfig = {
    name: string;
    warehouse: string;
    endpoint: string;
    /**
     * Returns a fresh bearer token before each request.
     * Each catalog can have its own auth provider (different OIDC clients,
     * different realms, etc.). Returns undefined for public catalogs.
     */
    getAccessToken: () => Promise<string | undefined>;
};

/**
 * Creates one IcebergApi instance that manages multiple catalogs.
 * All catalog configs (endpoint, warehouse, token provider) are fixed at
 * creation time — callers select which catalog to use via the `catalog` param.
 */
export function createDuckDbIcebergApi(params: {
    sqlOlap: SqlOlap;
    catalogs: IcebergCatalogConfig[];
}): IcebergApi {
    const { sqlOlap, catalogs } = params;

    // Load the iceberg extension once, lazily, on first use.
    // custom_extension_repository is already set by getConfiguredAsyncDuckDb().
    const prDb = (async () => {
        const { db } = await sqlOlap.getConfiguredAsyncDuckDb();

        const conn = await db.connect();
        try {
            await conn.query("INSTALL iceberg;\nLOAD iceberg;");
        } finally {
            await conn.close();
        }

        return db;
    })();

    // Catalogs that have already been ATTACHed — ATTACH is done once per session.
    const attached = new Set<string>();

    // The secret name is stable for a given catalog name.
    // Only the token content changes via CREATE OR REPLACE SECRET.
    function secretName(catalogName: string): string {
        return `iceberg_${catalogName}`;
    }

    async function upsertSecret(
        catalogConfig: IcebergCatalogConfig,
        conn: import("@duckdb/duckdb-wasm").AsyncDuckDBConnection
    ): Promise<void> {
        const token = await catalogConfig.getAccessToken();

        if (token === undefined) return;

        await conn.query(
            [
                `CREATE OR REPLACE SECRET "${secretName(catalogConfig.name)}" (`,
                `    TYPE iceberg,`,
                `    TOKEN '${token}'`,
                ");"
            ].join("\n")
        );
    }

    async function ensureAttached(
        catalogConfig: IcebergCatalogConfig,
        conn: import("@duckdb/duckdb-wasm").AsyncDuckDBConnection
    ): Promise<void> {
        if (attached.has(catalogConfig.name)) return;

        attached.add(catalogConfig.name);

        try {
            await conn.query(
                [
                    `ATTACH '${catalogConfig.warehouse}' AS "${catalogConfig.name}" (`,
                    `    TYPE iceberg,`,
                    `    SECRET '${secretName(catalogConfig.name)}',`,
                    `    ENDPOINT '${catalogConfig.endpoint}'`,
                    ");"
                ].join("\n")
            );
        } catch (e) {
            attached.delete(catalogConfig.name);
            throw e;
        }
    }

    function findCatalog(name: string): IcebergCatalogConfig | undefined {
        return catalogs.find(c => c.name === name);
    }

    return {
        listAllTables: async ({ catalog: catalogName }) => {
            const catalogConfig = findCatalog(catalogName);

            if (catalogConfig === undefined) {
                return id<IcebergApi.ListAllTablesResult.Failed>({
                    errorCause: "catalog not found"
                });
            }

            let db: import("@duckdb/duckdb-wasm").AsyncDuckDB;
            try {
                db = await prDb;
            } catch {
                return id<IcebergApi.ListAllTablesResult.Failed>({
                    errorCause: "network error"
                });
            }

            const conn = await db.connect();
            try {
                await upsertSecret(catalogConfig, conn);
                await ensureAttached(catalogConfig, conn);

                const result = await conn.query(
                    `
                    SELECT
                        table_catalog AS database,
                        table_schema  AS schema,
                        table_name    AS name
                    FROM information_schema.tables
                    WHERE table_catalog = '${catalogName}';
                    `.trim()
                );

                const tables: IcebergApi.TableEntry[] = result.toArray().map(row => ({
                    catalog: String(row["database"]),
                    namespace: String(row["schema"]),
                    name: String(row["name"])
                }));

                return id<IcebergApi.ListAllTablesResult.Success>({ tables });
            } catch (e) {
                return id<IcebergApi.ListAllTablesResult.Failed>({
                    errorCause: classifyListError(e)
                });
            } finally {
                await conn.close();
            }
        },

        describeTable: async ({ catalog: catalogName, namespace, table }) => {
            const catalogConfig = findCatalog(catalogName);

            if (catalogConfig === undefined) {
                return id<IcebergApi.DescribeTableResult.Failed>({
                    errorCause: "network error"
                });
            }

            let db: import("@duckdb/duckdb-wasm").AsyncDuckDB;
            try {
                db = await prDb;
            } catch {
                return id<IcebergApi.DescribeTableResult.Failed>({
                    errorCause: "network error"
                });
            }

            const conn = await db.connect();
            try {
                const result = await conn.query(
                    `SELECT * FROM "${catalogName}.${namespace}.${table}"`
                );

                const columns: IcebergApi.Column[] = result
                    .toArray()
                    .map((row, index) => {
                        const rawType = String(row["column_type"]);
                        return {
                            fieldId: index,
                            name: String(row["column_name"]),
                            type: parseDuckDbType(rawType),
                            rawType,
                            isRequired: String(row["null"]).toUpperCase() === "NO",
                            doc: undefined
                        };
                    });

                return id<IcebergApi.DescribeTableResult.Success>({
                    columns,
                    // These fields come from Iceberg snapshot metadata, not
                    // available via DuckDB DESCRIBE. A REST-native adapter would fill them.
                    rowCount: undefined,
                    location: undefined,
                    lastUpdatedMs: undefined,
                    format: undefined
                });
            } catch (e) {
                return id<IcebergApi.DescribeTableResult.Failed>({
                    errorCause: classifyDescribeError(e)
                });
            } finally {
                await conn.close();
            }
        }
    };
}

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

function isAuthError(e: unknown): boolean {
    const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
    return msg.includes("401") || msg.includes("unauthorized") || msg.includes("403");
}

function isNotFoundError(e: unknown): boolean {
    const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
    return msg.includes("not found") || msg.includes("does not exist");
}

function classifyListError(
    e: unknown
): IcebergApi.ListAllTablesResult.Failed["errorCause"] {
    if (isAuthError(e)) return "unauthorized";
    return "network error";
}

function classifyDescribeError(
    e: unknown
): IcebergApi.DescribeTableResult.Failed["errorCause"] {
    if (isAuthError(e)) return "unauthorized";
    if (isNotFoundError(e)) return "table not found";
    return "network error";
}

// ---------------------------------------------------------------------------
// DuckDB type → IcebergApi.Column.Type
// ---------------------------------------------------------------------------

function parseDuckDbType(raw: string): IcebergApi.Column.Type {
    const t = raw.toUpperCase().trim();

    if (t === "BOOLEAN") return "boolean";

    if (
        [
            "TINYINT",
            "SMALLINT",
            "INTEGER",
            "INT",
            "INT4",
            "INT2",
            "UINTEGER",
            "USMALLINT",
            "UTINYINT"
        ].includes(t)
    ) {
        return "int";
    }

    if (["BIGINT", "INT8", "HUGEINT", "UBIGINT"].includes(t)) return "long";

    if (["FLOAT", "REAL", "FLOAT4"].includes(t)) return "float";

    if (["DOUBLE", "FLOAT8"].includes(t)) return "double";

    if (t.startsWith("DECIMAL") || t.startsWith("NUMERIC")) return "decimal";

    if (t === "DATE") return "date";

    if (t === "TIME" || t.startsWith("TIME ")) return "time";

    if (t === "TIMESTAMPTZ" || t.includes("WITH TIME ZONE")) return "timestamptz";

    if (t.startsWith("TIMESTAMP")) return "timestamp";

    if (
        ["VARCHAR", "TEXT", "STRING", "JSON"].includes(t) ||
        t.startsWith("CHAR") ||
        t.startsWith("VARCHAR")
    ) {
        return "string";
    }

    if (t === "UUID") return "uuid";

    if (["BLOB", "BYTEA", "VARBINARY", "BINARY"].includes(t)) return "binary";

    if (t.startsWith("BIT") || t.startsWith("FIXED")) return "fixed";

    if (t.startsWith("LIST") || t.endsWith("[]")) return "list";

    if (t.startsWith("MAP")) return "map";

    if (t.startsWith("STRUCT")) return "struct";

    return "unknown";
}
