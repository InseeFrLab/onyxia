import type { Thunks } from "core/bootstrap";
import { actions, previewCacheKey } from "./state";
import type { CatalogMetadata, NamespaceMetadata } from "./state";
import { id } from "tsafe/id";

export const thunks = {
    /**
     * Fetches the flat table list from all configured catalogs and groups
     * them into a hierarchical catalog → namespace → tables structure.
     */
    initialize:
        () =>
        async (...args) => {
            const [dispatch, , { icebergApi, icebergCatalogConfigs }] = args;

            dispatch(actions.loadingStarted());

            const listResult = await icebergApi.listAllTables();
            const allTables =
                listResult.errorCause !== undefined ? [] : listResult.tables;

            const catalogs: CatalogMetadata[] = icebergCatalogConfigs.map(config => {
                const namespaceMap = new Map<string, string[]>();

                for (const entry of allTables.filter(t => t.catalog === config.name)) {
                    const tables = namespaceMap.get(entry.namespace) ?? [];
                    tables.push(entry.name);
                    namespaceMap.set(entry.namespace, tables);
                }

                const namespaces: NamespaceMetadata[] = Array.from(
                    namespaceMap.entries()
                ).map(([name, tables]) => ({ name, tables }));

                return id<CatalogMetadata>({
                    name: config.name,
                    warehouse: config.warehouse,
                    endpoint: config.endpoint,
                    namespaces
                });
            });

            dispatch(actions.catalogsLoaded({ catalogs }));
        },

    /**
     * Fetches schema + preview rows for a table in a single DuckDB query.
     * No-ops if the same table is already selected.
     * Serves from cache if previously fetched.
     */
    selectTable:
        (params: { catalog: string; namespace: string; table: string }) =>
        async (...args) => {
            const { catalog, namespace, table } = params;
            const [dispatch, getState, { icebergApi }] = args;

            const state = getState().icebergCatalog;

            // No-op if already the active table
            if (
                state.selectedTable !== undefined &&
                !state.selectedTable.isLoading &&
                state.selectedTable.catalog === catalog &&
                state.selectedTable.namespace === namespace &&
                state.selectedTable.table === table
            ) {
                return;
            }

            // Serve from cache if available
            const cached = state.previewCache[previewCacheKey(catalog, namespace, table)];
            if (cached !== undefined) {
                dispatch(
                    actions.tableSelectedFromCache({
                        catalog,
                        namespace,
                        table,
                        columns: cached.columns,
                        rows: cached.rows
                    })
                );
                return;
            }

            dispatch(actions.tableSelectionStarted({ catalog, namespace, table }));

            const result = await icebergApi.fetchTablePreview({
                catalog,
                namespace,
                table,
                limit: 10
            });

            dispatch(
                actions.tablePreviewLoaded({
                    columns: result.errorCause === undefined ? result.columns : [],
                    rows: result.errorCause === undefined ? result.rows : []
                })
            );
        }
} satisfies Thunks;
