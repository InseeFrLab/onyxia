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
        tables: {
            name: string;
            /** iceberg://<catalog>/<namespace>/<table> */
            explorerSource: string;
        }[];
    }[];
};

export type SelectedTableView = {
    catalog: string;
    namespace: string;
    table: string;
    isLoadingSchema: boolean;
    columns: IcebergApi.Column[];
    rowCount: number | undefined;
    location: string | undefined;
    /** ISO date string (YYYY-MM-DD), derived from lastUpdatedMs. */
    lastUpdatedAt: string | undefined;
    format: string | undefined;
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
                tables: ns.tables.map(tableName => ({
                    name: tableName,
                    explorerSource: `iceberg://${catalog.name}/${ns.name}/${tableName}`
                }))
            }))
        })),
        selectedTable:
            state.selectedTable === undefined
                ? undefined
                : {
                      catalog: state.selectedTable.catalog,
                      namespace: state.selectedTable.namespace,
                      table: state.selectedTable.table,
                      isLoadingSchema: state.selectedTable.isLoadingSchema,
                      columns: state.selectedTable.columns,
                      rowCount: state.selectedTable.rowCount,
                      location: state.selectedTable.location,
                      lastUpdatedAt:
                          state.selectedTable.lastUpdatedMs !== undefined
                              ? new Date(state.selectedTable.lastUpdatedMs)
                                    .toISOString()
                                    .slice(0, 10)
                              : undefined,
                      format: state.selectedTable.format
                  }
    })
);

export const selectors = { view };
