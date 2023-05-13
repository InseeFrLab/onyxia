/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useEffect } from "react";
import type { RefObject } from "react";
import { CatalogExplorerCards } from "./CatalogExplorerCards";
import type { Props as CatalogExplorerCardsProps } from "./CatalogExplorerCards";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useCoreState, useCoreFunctions, selectors } from "core";
import { routes } from "ui/routes";
import type { Route } from "type-route";
import { assert } from "tsafe/assert";

export type Props = {
    className?: string;
    route: Route<typeof routes.catalogExplorer>;
    scrollableDivRef: RefObject<HTMLDivElement>;
};

export const CatalogExplorer = memo((props: Props) => {
    const { className, route, scrollableDivRef } = props;

    const catalogExplorerState = useCoreState(state => state.catalogExplorer);

    const { catalogExplorer } = useCoreFunctions();

    useEffect(() => {
        switch (catalogExplorerState.stateDescription) {
            case "not fetched":
                if (!catalogExplorerState.isFetching) {
                    const { catalogId } = route.params;

                    catalogExplorer.fetchCatalogs(
                        catalogId === undefined
                            ? {
                                  "isCatalogIdInUrl": false,
                                  "onAutoSelectCatalogId": ({ selectedCatalogId }) =>
                                      routes
                                          .catalogExplorer({
                                              "catalogId": selectedCatalogId
                                          })
                                          .replace()
                              }
                            : {
                                  "isCatalogIdInUrl": true,
                                  catalogId
                              }
                    );
                }
                break;
            case "ready":
                //NOTE: When coming back to the catalog.
                assert(selectedCatalog !== undefined);
                if (route.params.catalogId !== selectedCatalog.id) {
                    routes
                        .catalogExplorer({ "catalogId": selectedCatalog.id })
                        [route.params.catalogId === undefined ? "replace" : "push"]();
                }
                break;
        }
    }, [catalogExplorerState.stateDescription]);

    useEffect(() => {
        const { catalogId } = route.params;

        if (catalogId === undefined) {
            return;
        }

        catalogExplorer.changeSelectedCatalogId({ catalogId });
    }, [route.params.catalogId]);

    const onRequestLaunch = useConstCallback<
        CatalogExplorerCardsProps["onRequestLaunch"]
    >(({ packageName, catalogId }) =>
        routes
            .catalogLauncher({
                catalogId,
                packageName
            })
            .push()
    );

    const onSearchChange = useConstCallback<CatalogExplorerCardsProps["onSearchChange"]>(
        search =>
            routes
                .catalogExplorer({
                    "catalogId": route.params.catalogId!,
                    "search": search || undefined
                })
                .replace()
    );

    useEffect(() => {
        catalogExplorer.setSearch({ "search": route.params.search });
    }, [route.params.search]);

    const onRequestRevealPackagesNotShown = useConstCallback(() =>
        catalogExplorer.revealAllPackages()
    );

    const { filteredPackages } = useCoreState(selectors.catalogExplorer.filteredPackages);

    const { productionCatalogs } = useCoreState(
        selectors.catalogExplorer.productionCatalogs
    );
    const { selectedCatalog } = useCoreState(selectors.catalogExplorer.selectedCatalog);

    const onSelectedCatalogIdChange = useConstCallback((catalogId: string) =>
        routes.catalogExplorer({ catalogId }).push()
    );

    if (catalogExplorerState.stateDescription !== "ready") {
        return null;
    }

    assert(filteredPackages !== undefined);
    assert(productionCatalogs !== undefined);
    assert(selectedCatalog !== undefined);

    const { packages, notShownCount } = filteredPackages;

    return (
        <CatalogExplorerCards
            search={route.params.search}
            onSearchChange={onSearchChange}
            className={className}
            packages={packages}
            onRequestLaunch={onRequestLaunch}
            scrollableDivRef={scrollableDivRef}
            onRequestRevealPackagesNotShown={onRequestRevealPackagesNotShown}
            notShownPackageCount={notShownCount}
            selectedCatalogId={selectedCatalog.id}
            catalogs={productionCatalogs}
            onSelectedCatalogIdChange={onSelectedCatalogIdChange}
        />
    );
});
