import type { Thunks } from "core/core";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { compareVersions } from "compare-versions";
import { actions, name } from "./state";
import { filterProductionCatalogs } from "./selectors";

export const thunks = {
    "fetchCatalogs":
        (
            params:
                | {
                      isCatalogIdInUrl: true;
                      catalogId: string;
                  }
                | {
                      isCatalogIdInUrl: false;
                      onAutoSelectCatalogId: (params: {
                          selectedCatalogId: string;
                      }) => void;
                  }
        ) =>
        async (...args) => {
            const [dispatch, , { onyxiaApi }] = args;

            dispatch(actions.catalogsFetching());

            const { catalogs } = await (async () => {
                let catalogs = await onyxiaApi.getCatalogs();

                catalogs = JSON.parse(JSON.stringify(catalogs));

                return { catalogs };
            })();

            catalogs.forEach(catalog =>
                catalog.charts.forEach(
                    chart =>
                        chart.versions.sort((v1, v2) =>
                            compareVersions(v2.version, v1.version)
                        )
                    // Descending Order
                )
            );

            const selectedCatalogId = params.isCatalogIdInUrl
                ? params.catalogId
                : filterProductionCatalogs(catalogs)[0].id;

            dispatch(
                actions.catalogsFetched({
                    catalogs,
                    selectedCatalogId
                })
            );

            if (!params.isCatalogIdInUrl) {
                params.onAutoSelectCatalogId({ selectedCatalogId });
            }
        },
    "setSearch":
        (params: { search: string }) =>
        async (...args) => {
            const { search } = params;
            const [dispatch, getState, extra] = args;

            const { waitForSearchDebounce } = getContext(extra);

            await waitForSearchDebounce();

            if (getState()[name].stateDescription !== "ready") {
                return;
            }

            dispatch(actions.setSearch({ search }));
        },
    "revealAllPackages":
        () =>
        (...args) => {
            const [dispatch] = args;
            dispatch(actions.setDoShowOnlyHighlightedToFalse());
        },
    "changeSelectedCatalogId":
        (params: { catalogId: string }) =>
        (...args) => {
            const { catalogId } = params;
            const [dispatch, getState] = args;

            if (getState().catalogExplorer.stateDescription !== "ready") {
                return;
            }

            dispatch(actions.changeSelectedCatalogue({ "selectedCatalogId": catalogId }));
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => {
    const { waitForDebounce } = waitForDebounceFactory({ "delay": 500 });
    return {
        "waitForSearchDebounce": waitForDebounce
    };
});
