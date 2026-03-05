/**
 * Port for the Iceberg REST Catalog API (e.g. Apache Polaris).
 *
 * One IcebergApi instance manages several catalogs whose endpoints, warehouses
 * and token providers are all fixed at creation time.
 * Callers identify which catalog to target via the `catalog` parameter.
 */
export type IcebergApi = {
    /**
     * Returns the flat list of all (namespace, table) pairs for a given catalog.
     *
     * Equivalent to:  SHOW ALL TABLES
     */
    listAllTables: () => Promise<IcebergApi.ListAllTablesResult>;

    /**
     * Fetches the first `limit` rows of a table together with its column schema
     * in a single query. The column schema is derived from the Arrow result schema
     * so no separate DESCRIBE round-trip is needed.
     *
     * Equivalent to:  SELECT * FROM <catalog>.<namespace>.<table> LIMIT <limit>
     */
    fetchTablePreview: (params: {
        catalog: string;
        namespace: string;
        table: string;
        limit: number;
    }) => Promise<IcebergApi.FetchTablePreviewResult>;
};

export namespace IcebergApi {
    // ----------------------------------------------------------------
    // Shared domain types
    // ----------------------------------------------------------------

    /** A row from SHOW ALL TABLES */
    export type TableEntry = {
        catalog: string;
        namespace: string;
        name: string;
    };

    /**
     * A column derived from the Arrow result schema.
     *
     * `rawType` is the Arrow type string (e.g. "Int<32, true>", "Utf8").
     */
    export type Column = {
        fieldId: number;
        name: string;
        rawType: string;
        isRequired: boolean;
    };

    // ----------------------------------------------------------------
    // listAllTables
    // ----------------------------------------------------------------

    export type ListAllTablesResult =
        | ListAllTablesResult.Success
        | ListAllTablesResult.Failed;

    export namespace ListAllTablesResult {
        export type Success = {
            tables: TableEntry[];
            errorCause?: never;
        };

        export type Failed = {
            tables?: never;
            errorCause: "unauthorized" | "network error";
        };
    }

    // ----------------------------------------------------------------
    // fetchTablePreview
    // ----------------------------------------------------------------

    export type FetchTablePreviewResult =
        | FetchTablePreviewResult.Success
        | FetchTablePreviewResult.Failed;

    export namespace FetchTablePreviewResult {
        export type Success = {
            columns: Column[];
            rows: Record<string, unknown>[];
            errorCause?: never;
        };

        export type Failed = {
            columns?: never;
            rows?: never;
            errorCause: "unauthorized" | "table not found" | "network error";
        };
    }
}
