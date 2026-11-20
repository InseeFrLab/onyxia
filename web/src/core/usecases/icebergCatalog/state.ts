import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import type { IcebergApi } from "core/ports/IcebergApi";

export const name = "icebergCatalog" as const;

/** Hierarchical structure built from listAllTables (table names only). */
export type NamespaceMetadata = {
    name: string;
    tables: string[];
};

export type CatalogMetadata = {
    name: string;
    warehouse: string;
    endpoint: string;
    namespaces: NamespaceMetadata[];
};

/** Preview of a table selected by the user — schema + first rows in one query. */
export type SelectedTable = {
    catalog: string;
    namespace: string;
    table: string;
    isLoading: boolean;
    columns: IcebergApi.Column[];
    rows: Record<string, unknown>[];
};

export type TablePreviewCacheEntry = {
    columns: IcebergApi.Column[];
    rows: Record<string, unknown>[];
};

export type State = {
    stateDescription: "not loaded" | "loading" | "ready";
    catalogs: CatalogMetadata[];
    selectedTable: SelectedTable | undefined;
    /** Keyed by `catalog\0namespace\0table` */
    previewCache: Record<string, TablePreviewCacheEntry>;
};

export function previewCacheKey(
    catalog: string,
    namespace: string,
    table: string
): string {
    return `${catalog}\0${namespace}\0${table}`;
}

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>({
        stateDescription: "not loaded",
        catalogs: [],
        selectedTable: undefined,
        previewCache: {}
    }),
    reducers: {
        loadingStarted: state => {
            state.stateDescription = "loading";
        },
        catalogsLoaded: (
            state,
            { payload }: { payload: { catalogs: CatalogMetadata[] } }
        ) => {
            state.stateDescription = "ready";
            state.catalogs = payload.catalogs;
        },
        tableSelectionStarted: (
            state,
            {
                payload
            }: { payload: { catalog: string; namespace: string; table: string } }
        ) => {
            state.selectedTable = {
                ...payload,
                isLoading: true,
                columns: [],
                rows: []
            };
        },
        tablePreviewLoaded: (
            state,
            {
                payload
            }: {
                payload: {
                    columns: IcebergApi.Column[];
                    rows: Record<string, unknown>[];
                };
            }
        ) => {
            if (state.selectedTable === undefined) return;
            state.selectedTable.isLoading = false;
            state.selectedTable.columns = payload.columns;
            state.selectedTable.rows = payload.rows;
            const key = previewCacheKey(
                state.selectedTable.catalog,
                state.selectedTable.namespace,
                state.selectedTable.table
            );
            state.previewCache[key] = { columns: payload.columns, rows: payload.rows };
        },
        tableSelectedFromCache: (
            state,
            {
                payload
            }: {
                payload: {
                    catalog: string;
                    namespace: string;
                    table: string;
                    columns: IcebergApi.Column[];
                    rows: Record<string, unknown>[];
                };
            }
        ) => {
            state.selectedTable = {
                catalog: payload.catalog,
                namespace: payload.namespace,
                table: payload.table,
                isLoading: false,
                columns: payload.columns,
                rows: payload.rows
            };
        }
    }
});
