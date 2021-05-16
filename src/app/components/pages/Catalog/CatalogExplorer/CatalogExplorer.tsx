
import { memo, useEffect } from "react";
import { CatalogExplorerCards } from "./CatalogExplorerCards";
import type { Props as CatalogCardsParams } from "./CatalogExplorerCards";
import { useConstCallback } from "powerhooks";
import { useSplashScreen } from "app/components/shared/SplashScreen";
import { useSelector, useDispatch } from "app/interfaceWithLib/hooks";
import { thunks } from "lib/setup";
import { routes } from "app/router";
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

            if (catalogExplorerState.stateDescription !== "not fetched") {
                return;
            }

            dispatch(thunks.catalogExplorer.fetchCatalogs());

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    useEffect(
        () => {

            if (catalogExplorerState.stateDescription === "not fetched") {
                return;
            }

            dispatch(thunks.catalogExplorer.selectCatalog({
                "catalogId":
                    route.params.catalogId ??
                    catalogExplorerState.availableCatalogsId[0]
            }));

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [route.params.catalogId ?? ""]
    );

    useEffect(
        () => {

            if (catalogExplorerState.stateDescription !== "ready") {
                return;
            }

            routes
                .catalogExplorer({ "catalogId": catalogExplorerState.selectedCatalogId })
                .replace();

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [catalogExplorerState.stateDescription !== "ready" ? "" : catalogExplorerState.selectedCatalogId]
    );

    const onRequestLaunch = useConstCallback<CatalogCardsParams["onRequestLaunch"]>(
        packageName =>
            routes.catalog({
                "optionalTrailingPath": `${route.params.catalogId}/${packageName}/deploiement`
            }).push()
    );

    const { hideSplashScreen, showSplashScreen } = useSplashScreen();

    useEffect(
        () => {

            if (catalogExplorerState.stateDescription !== "ready") {
                showSplashScreen({ "enableTransparency": true });
            } else {
                hideSplashScreen();
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [catalogExplorerState.stateDescription]
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
