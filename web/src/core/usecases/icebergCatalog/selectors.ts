import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import type { IcebergApi } from "core/ports/IcebergApi";

const state = (rootState: RootState) => rootState[name];

export type CatalogView = {
    name: string;
    warehouse: string;
    endpoint: string;
    namespaces: {
        name: string;
        tables: { name: string }[];
    }[];
};

export type SelectedTableView = {
    catalog: string;
    namespace: string;
    table: string;
    isLoading: boolean;
    columns: IcebergApi.Column[];
    rows: Record<string, unknown>[];
};

export type View = {
    isLoading: boolean;
    catalogs: CatalogView[];
    selectedTable: SelectedTableView | undefined;
};

const view = createSelector(
    state,
    (state): View => ({
        isLoading: state.stateDescription === "loading",
        catalogs: state.catalogs.map(catalog => ({
            name: catalog.name,
            warehouse: catalog.warehouse,
            endpoint: catalog.endpoint,
            namespaces: catalog.namespaces.map(ns => ({
                name: ns.name,
                tables: ns.tables.map(tableName => ({ name: tableName }))
            }))
        })),
        selectedTable:
            state.selectedTable === undefined
                ? undefined
                : {
                      catalog: state.selectedTable.catalog,
                      namespace: state.selectedTable.namespace,
                      table: state.selectedTable.table,
                      isLoading: state.selectedTable.isLoading,
                      columns: state.selectedTable.columns,
                      rows: state.selectedTable.rows
                  }
    })
);

export const selectors = { view };
