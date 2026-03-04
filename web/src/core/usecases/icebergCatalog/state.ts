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

/** Detail of a table selected by the user, loaded via describeTable. */
export type SelectedTable = {
    catalog: string;
    namespace: string;
    table: string;
    isLoadingSchema: boolean;
    columns: IcebergApi.Column[];
    rowCount: number | undefined;
    location: string | undefined;
    lastUpdatedMs: number | undefined;
    format: string | undefined;
};

export type State = {
    stateDescription: "not loaded" | "loading" | "ready";
    catalogs: CatalogMetadata[];
    selectedTable: SelectedTable | undefined;
};

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>({
        stateDescription: "not loaded",
        catalogs: [],
        selectedTable: undefined
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
                isLoadingSchema: true,
                columns: [],
                rowCount: undefined,
                location: undefined,
                lastUpdatedMs: undefined,
                format: undefined
            };
        },
        schemaLoaded: (
            state,
            {
                payload
            }: {
                payload: {
                    columns: IcebergApi.Column[];
                    rowCount: number | undefined;
                    location: string | undefined;
                    lastUpdatedMs: number | undefined;
                    format: string | undefined;
                };
            }
        ) => {
            if (state.selectedTable === undefined) return;
            state.selectedTable = {
                ...state.selectedTable,
                isLoadingSchema: false,
                ...payload
            };
        }
    }
});
