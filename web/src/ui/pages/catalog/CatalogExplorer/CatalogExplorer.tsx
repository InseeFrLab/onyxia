/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useEffect } from "react";
import type { RefObject } from "react";
import { CatalogExplorerCards } from "./CatalogExplorerCards";
import type { Props as CatalogExplorerCardsProps } from "./CatalogExplorerCards";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useCoreState, useCoreFunctions, selectors, useCoreEvts } from "core";
import { routes } from "ui/routes";
import type { Route } from "type-route";
import { assert } from "tsafe/assert";
import { useEvt } from "evt/hooks";

export type Props = {
    className?: string;
    route: Route<typeof routes.catalogExplorer>;
    scrollableDivRef: RefObject<HTMLDivElement>;
};

export const CatalogExplorer = memo((props: Props) => {
    const { className, route, scrollableDivRef } = props;

    const {
        isReady,
        availableCatalogNames,
        chartNotShownCount,
        filteredCharts,
        selectedCatalog
    } = useCoreState(selectors.catalogExplorer.wrap).wrap;

    const { evtCatalogExplorer } = useCoreEvts();

    useEvt(
        ctx =>
            evtCatalogExplorer.$attach(
                action =>
                    action.actionName !== "set catalogue id in url" ? null : [action],
                ctx,
                ({ catalogId }) =>
                    routes
                        .catalogExplorer({
                            catalogId
                        })
                        .replace()
            ),
        [evtCatalogExplorer]
    );

    const { catalogExplorer } = useCoreFunctions();

    useEffect(() => {
        catalogExplorer.changeSelectedCatalogId({ "catalogId": route.params.catalogId });
    }, [route.params.catalogId]);

    useEffect(() => {
        catalogExplorer.setSearch({ "search": route.params.search });
    }, [route.params.search]);

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

    const onSelectedCatalogIdChange = useConstCallback((catalogId: string) =>
        routes.catalogExplorer({ catalogId }).replace()
    );

    if (!isReady) {
        return null;
    }

    return (
        <CatalogExplorerCards
            search={route.params.search}
            onSearchChange={onSearchChange}
            className={className}
            packages={packages}
            onRequestLaunch={onRequestLaunch}
            scrollableDivRef={scrollableDivRef}
            onRequestRevealPackagesNotShown={catalogExplorer.revealAllPackages}
            notShownPackageCount={chartNotShownCount}
            selectedCatalogId={selectedCatalog.id}
            catalogs={productionCatalogs}
            onSelectedCatalogIdChange={onSelectedCatalogIdChange}
        />
    );
});
