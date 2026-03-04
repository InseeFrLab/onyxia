import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import type { CatalogMetadata, NamespaceMetadata } from "./state";
import { id } from "tsafe/id";

export const thunks = {
    /**
     * Fetches the flat table list from all configured catalogs and groups
     * them into a hierarchical catalog → namespace → tables structure.
     * Equivalent to running SHOW ALL TABLES on each catalog.
     */
    initialize:
        () =>
        async (...args) => {
            const [dispatch, , { icebergApi, icebergCatalogConfigs }] = args;

            dispatch(actions.loadingStarted());

            const catalogs = await Promise.all(
                icebergCatalogConfigs.map(async config => {
                    const result = await icebergApi.listAllTables({
                        catalog: config.name
                    });

                    if (result.errorCause !== undefined) {
                        return id<CatalogMetadata>({
                            name: config.name,
                            warehouse: config.warehouse,
                            endpoint: config.endpoint,
                            namespaces: []
                        });
                    }

                    const namespaceMap = new Map<string, string[]>();

                    for (const entry of result.tables) {
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
                })
            );

            dispatch(actions.catalogsLoaded({ catalogs }));
        },

    /**
     * Fetches the full column schema for a specific table.
     * Equivalent to running DESCRIBE <catalog>.<namespace>.<table>.
     */
    selectTable:
        (params: { catalog: string; namespace: string; table: string }) =>
        async (...args) => {
            const { catalog, namespace, table } = params;
            const [dispatch, , { icebergApi }] = args;

            dispatch(actions.tableSelectionStarted({ catalog, namespace, table }));

            const result = await icebergApi.describeTable({ catalog, namespace, table });

            if (result.errorCause !== undefined) {
                // TODO: surface error in state (add a schemaLoadFailed action)
                return;
            }

            dispatch(
                actions.schemaLoaded({
                    columns: result.columns,
                    rowCount: result.rowCount,
                    location: result.location,
                    lastUpdatedMs: result.lastUpdatedMs,
                    format: result.format
                })
            );
        }
} satisfies Thunks;
