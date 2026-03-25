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

    function secretName(catalogName: string): string {
        return `iceberg_${catalogName}`;
    }

    // Eagerly install the iceberg extension, create secrets and attach all
    // catalogs in a single connection so everything is ready before the first query.
    const prDb = (async () => {
        const { db } = await sqlOlap.getConfiguredAsyncDuckDb();

        const conn = await db.connect();
        try {
            await conn.query("INSTALL iceberg;\nLOAD iceberg;");

            for (const catalogConfig of catalogs) {
                const token = await catalogConfig.getAccessToken();

                if (token !== undefined) {
                    await conn.query(
                        [
                            `CREATE OR REPLACE SECRET "${secretName(catalogConfig.name)}" (`,
                            `    TYPE iceberg,`,
                            `    TOKEN '${token}'`,
                            ");"
                        ].join("\n")
                    );
                }

                const attachLines = [
                    `ATTACH '${catalogConfig.warehouse}' AS "${catalogConfig.name}" (`,
                    `    TYPE iceberg,`,
                    ...(token !== undefined
                        ? [`    SECRET '${secretName(catalogConfig.name)}',`]
                        : []),
                    `    ENDPOINT '${catalogConfig.endpoint}'`,
                    ");"
                ];
                await conn.query(attachLines.join("\n"));
            }
        } finally {
            await conn.close();
        }

        return db;
    })();

    return {
        listAllTables: async () => {
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
                const result = await conn.query(
                    `SELECT table_catalog AS database, table_schema AS schema, table_name AS name FROM information_schema.tables;`
                );

                const tables: IcebergApi.TableEntry[] = result.toArray().map(row => ({
                    catalog: String(row["database"]),
                    namespace: String(row["schema"]),
                    name: String(row["name"])
                }));

                return id<IcebergApi.ListAllTablesResult.Success>({ tables });
            } catch (e) {
                const cause = classifyError(e);
                return id<IcebergApi.ListAllTablesResult.Failed>({
                    errorCause:
                        cause === "unauthorized" ? "unauthorized" : "network error"
                });
            } finally {
                await conn.close();
            }
        },

        fetchTablePreview: async ({ catalog: catalogName, namespace, table, limit }) => {
            const catalogConfig = catalogs.find(c => c.name === catalogName);

            if (catalogConfig === undefined) {
                return id<IcebergApi.FetchTablePreviewResult.Failed>({
                    errorCause: "network error"
                });
            }

            let db: import("@duckdb/duckdb-wasm").AsyncDuckDB;
            try {
                db = await prDb;
            } catch {
                return id<IcebergApi.FetchTablePreviewResult.Failed>({
                    errorCause: "network error"
                });
            }

            const conn = await db.connect();
            try {
                const result = await conn.query(
                    `SELECT * FROM "${catalogName}"."${namespace}"."${table}" LIMIT ${limit};`
                );

                const columns: IcebergApi.Column[] = (
                    result.schema.fields as {
                        name: string;
                        type: { toString(): string };
                        nullable: boolean;
                    }[]
                ).map((field, index) => ({
                    fieldId: index,
                    name: field.name,
                    rawType: field.type.toString(),
                    isRequired: !field.nullable
                }));

                const rows: Record<string, unknown>[] = result
                    .toArray()
                    .map(row => Object.fromEntries(Object.entries(row)));

                return id<IcebergApi.FetchTablePreviewResult.Success>({ columns, rows });
            } catch (e) {
                return id<IcebergApi.FetchTablePreviewResult.Failed>({
                    errorCause: classifyError(e)
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

function classifyError(e: unknown): "unauthorized" | "table not found" | "network error" {
    const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
    if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("403")) {
        return "unauthorized";
    }
    if (msg.includes("not found") || msg.includes("does not exist")) {
        return "table not found";
    }
    return "network error";
}
