/* eslint-disable react-hooks/exhaustive-deps */

import { memo, useEffect } from "react";
import { CatalogExplorerCards } from "./CatalogExplorerCards";
import type { Props as CatalogCardsParams } from "./CatalogExplorerCards";
import { useConstCallback } from "powerhooks";
import { hideSplashScreen, showSplashScreen } from "app/components/shared/SplashScreen";
import { useSelector, useDispatch } from "app/interfaceWithLib/hooks";
import { thunks } from "lib/setup";
import { routes } from "app/routes/router";
import type { Route } from "type-route";

export type Props = {
    className?: string;
    route: Route<typeof routes.catalogExplorer>;
};

export const CatalogExplorer = memo((props: Props) => {

    const { className, route } = props;

    const catalogExplorerState = useSelector(state => state.catalogExplorer);
    const dispatch = useDispatch();

    useEffect(
        () => {

            switch (catalogExplorerState.stateDescription) {
                case "not fetched":
                    if (!catalogExplorerState.isFetching) {
                        showSplashScreen({ "enableTransparency": true });
                        dispatch(thunks.catalogExplorer.fetchCatalogs());
                    }
                    break;
                case "not selected":
                    dispatch(thunks.catalogExplorer.selectCatalog({
                        "catalogId":
                            route.params.catalogId ??
                            catalogExplorerState.availableCatalogsId[0]
                    }));
                    break;
                case "ready":
                    hideSplashScreen();
                    if (route.params.catalogId !== catalogExplorerState.selectedCatalogId) {
                        routes
                            .catalogExplorer({ "catalogId": catalogExplorerState.selectedCatalogId })
                        [route.params.catalogId === undefined ? "replace" : "push"]();
                    }
                    break;
            }

        },
        [
            catalogExplorerState.stateDescription,
            route.params.catalogId ?? "",
            catalogExplorerState.stateDescription !== "ready" ? 
                "" : catalogExplorerState.selectedCatalogId
        ]
    );

    const onRequestLaunch = useConstCallback<CatalogCardsParams["onRequestLaunch"]>(
        packageName =>
            routes.catalogLauncher({
                "catalogId": route.params.catalogId!,
                packageName,
            }).push()
    );

    if (catalogExplorerState.stateDescription !== "ready") {
        return null;
    }

    return (
        <CatalogExplorerCards
            className={className}
            packages={catalogExplorerState.packages}
            onRequestLaunch={onRequestLaunch}
        />
    );
});
