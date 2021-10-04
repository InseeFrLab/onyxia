/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useEffect } from "react";
import type { RefObject } from "react";
import { CatalogExplorerCards } from "./CatalogExplorerCards";
import type { Props as CatalogExplorerCardsProps } from "./CatalogExplorerCards";
import { useConstCallback } from "powerhooks/useConstCallback";
import { useSplashScreen } from "onyxia-ui";
import { useSelector, useDispatch } from "app/interfaceWithLib";
import { thunks } from "lib/setup";
import { routes } from "app/routes/router";
import type { Route } from "type-route";

export type Props = {
    className?: string;
    route: Route<typeof routes.catalogExplorer>;
    scrollableDivRef: RefObject<HTMLDivElement>;
};

export const CatalogExplorer = memo((props: Props) => {
    const { className, route, scrollableDivRef } = props;

    const catalogExplorerState = useSelector(state => state.catalogExplorer);
    const dispatch = useDispatch();

    const { showSplashScreen, hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        switch (catalogExplorerState.stateDescription) {
            case "not fetched":
                if (!catalogExplorerState.isFetching) {
                    showSplashScreen({ "enableTransparency": true });
                    dispatch(thunks.catalogExplorer.fetchCatalogs());
                }
                break;
            case "not selected":
                dispatch(
                    thunks.catalogExplorer.selectCatalog({
                        "catalogId":
                            route.params.catalogId ??
                            catalogExplorerState.availableCatalogsId[0],
                    }),
                );
                break;
            case "ready":
                hideSplashScreen();
                if (route.params.catalogId !== catalogExplorerState.selectedCatalogId) {
                    routes
                        .catalogExplorer({
                            "catalogId": catalogExplorerState.selectedCatalogId,
                        })
                        [route.params.catalogId === undefined ? "replace" : "push"]();
                }
                break;
        }
    }, [
        catalogExplorerState.stateDescription,
        route.params.catalogId ?? "",
        catalogExplorerState.stateDescription !== "ready"
            ? ""
            : catalogExplorerState.selectedCatalogId,
    ]);

    const onRequestLaunch = useConstCallback<
        CatalogExplorerCardsProps["onRequestLaunch"]
    >(packageName =>
        routes
            .catalogLauncher({
                "catalogId": route.params.catalogId!,
                packageName,
            })
            .push(),
    );

    const setSearch = useConstCallback<CatalogExplorerCardsProps["setSearch"]>(search =>
        routes
            .catalogExplorer({
                "catalogId": route.params.catalogId!,
                search,
            })
            .replace(),
    );

    if (catalogExplorerState.stateDescription !== "ready") {
        return null;
    }

    return (
        <CatalogExplorerCards
            search={route.params.search}
            setSearch={setSearch}
            className={className}
            packages={catalogExplorerState.packages}
            onRequestLaunch={onRequestLaunch}
            scrollableDivRef={scrollableDivRef}
        />
    );
});
