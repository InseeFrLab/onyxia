/**
 * Port for the Iceberg REST Catalog API (e.g. Apache Polaris).
 *
 * One IcebergApi instance manages several catalogs whose endpoints, warehouses
 * and token providers are all fixed at creation time.
 * Callers identify which catalog to target via the `catalog` parameter.
 *
 * Two operations map directly onto the spec:
 *   - listAllTables  →  SHOW ALL TABLES
 *   - describeTable  →  DESCRIBE <catalog>.<namespace>.<table>
 */
export type IcebergApi = {
    /**
     * Returns the flat list of all (namespace, table) pairs for a given catalog.
     *
     * Equivalent to:  SHOW ALL TABLES
     */
    listAllTables: (params: {
        catalog: string;
    }) => Promise<IcebergApi.ListAllTablesResult>;

    /**
     * Returns the full column schema for one specific table.
     *
     * Equivalent to:  DESCRIBE <catalog>.<namespace>.<table>
     */
    describeTable: (params: {
        catalog: string;
        namespace: string;
        table: string;
    }) => Promise<IcebergApi.DescribeTableResult>;
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
     * A column from DESCRIBE.
     *
     * `type` is the normalised semantic category used by the UI.
     * `rawType` is the original Iceberg type string returned by the
     * API (e.g. "decimal(10, 2)", "list<string>", "struct<id:long>").
     */
    export type Column = {
        fieldId: number;
        name: string;
        type: Column.Type;
        rawType: string;
        isRequired: boolean;
        doc: string | undefined;
    };

    export namespace Column {
        export type Type =
            | "boolean"
            | "int"
            | "long"
            | "float"
            | "double"
            | "decimal"
            | "date"
            | "time"
            | "timestamp"
            | "timestamptz"
            | "string"
            | "uuid"
            | "binary"
            | "fixed"
            | "list"
            | "map"
            | "struct"
            | "unknown";
    }

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
            errorCause: "unauthorized" | "catalog not found" | "network error";
        };
    }

    // ----------------------------------------------------------------
    // describeTable
    // ----------------------------------------------------------------

    export type DescribeTableResult =
        | DescribeTableResult.Success
        | DescribeTableResult.Failed;

    export namespace DescribeTableResult {
        export type Success = {
            columns: Column[];
            /** Total number of rows if available from table metadata */
            rowCount: number | undefined;
            /** Storage location of the table (e.g. s3://…) */
            location: string | undefined;
            /** Snapshot timestamp of the current table version */
            lastUpdatedMs: number | undefined;
            /** Data file format: parquet, orc, avro */
            format: string | undefined;
            errorCause?: never;
        };

        export type Failed = {
            columns?: never;
            rowCount?: never;
            location?: never;
            lastUpdatedMs?: never;
            format?: never;
            errorCause: "unauthorized" | "table not found" | "network error";
        };
    }
}
