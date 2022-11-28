import type { ThunkAction } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { Catalog } from "../ports/OnyxiaApiClient";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import type { State } from "../setup";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { exclude } from "tsafe/exclude";
import { compareVersions } from "compare-versions";

type CatalogExplorerState = CatalogExplorerState.NotFetched | CatalogExplorerState.Ready;

namespace CatalogExplorerState {
    export type NotFetched = {
        stateDescription: "not fetched";
        isFetching: boolean;
    };

    export type Ready = {
        stateDescription: "ready";
        "~internal": {
            catalogs: Catalog[];
            selectedCatalogId: string;
        };
        doShowOnlyHighlighted: boolean;
        search: string;
    };
}

export const name = "catalogExplorer";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<CatalogExplorerState>(
        id<CatalogExplorerState.NotFetched>({
            "stateDescription": "not fetched",
            "isFetching": false
        })
    ),
    "reducers": {
        "catalogsFetching": state => {
            assert(state.stateDescription === "not fetched");
            state.isFetching = true;
        },
        "catalogsFetched": (
            _state,
            {
                payload
            }: PayloadAction<{
                selectedCatalogId: string;
                catalogs: Catalog[];
            }>
        ) => {
            const { selectedCatalogId, catalogs } = payload;
            const highlightedCharts =
                catalogs?.find(catalog => catalog.id === selectedCatalogId)
                    ?.highlightedCharts || [];

            return id<CatalogExplorerState.Ready>({
                "stateDescription": "ready",
                "~internal": { catalogs, selectedCatalogId },
                "doShowOnlyHighlighted":
                    getAreConditionMetForOnlyShowingHighlightedPackaged({
                        "highlightedChartsLength": highlightedCharts.length,
                        catalogs,
                        selectedCatalogId
                    }),
                "search": ""
            });
        },
        "changeSelectedCatalogue": (
            state,
            { payload }: PayloadAction<{ selectedCatalogId: string }>
        ) => {
            const { selectedCatalogId } = payload;

            assert(state.stateDescription === "ready");

            if (state["~internal"].selectedCatalogId === selectedCatalogId) {
                return;
            }

            state["~internal"].selectedCatalogId = selectedCatalogId;
            const catalogs = state["~internal"].catalogs;
            const highlightedCharts =
                catalogs?.find(catalog => catalog.id === selectedCatalogId)
                    ?.highlightedCharts || [];
            state.doShowOnlyHighlighted =
                state.search === "" &&
                getAreConditionMetForOnlyShowingHighlightedPackaged({
                    "highlightedChartsLength": highlightedCharts.length,
                    "catalogs": catalogs,
                    selectedCatalogId
                });
        },
        "setSearch": (state, { payload }: PayloadAction<{ search: string }>) => {
            const { search } = payload;

            assert(state.stateDescription === "ready");

            state.search = search;

            const selectedCatalogId = state["~internal"].selectedCatalogId;
            const catalogs = state["~internal"].catalogs;
            const highlightedCharts =
                catalogs?.find(catalog => catalog.id === selectedCatalogId)
                    ?.highlightedCharts || [];

            state.doShowOnlyHighlighted =
                search === "" &&
                getAreConditionMetForOnlyShowingHighlightedPackaged({
                    "highlightedChartsLength": highlightedCharts.length,
                    "catalogs": catalogs,
                    "selectedCatalogId": selectedCatalogId
                });
        },
        "setDoShowOnlyHighlightedToFalse": state => {
            assert(state.stateDescription === "ready");

            state.doShowOnlyHighlighted = false;
        }
    }
});

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
        ): ThunkAction =>
        async (...args) => {
            const [dispatch, , { onyxiaApiClient }] = args;

            dispatch(actions.catalogsFetching());

            const { catalogs } = await (async () => {
                let catalogs = await onyxiaApiClient.getCatalogs();

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
        (params: { search: string }): ThunkAction =>
        async (...args) => {
            const { search } = params;
            const [dispatch, getState, extra] = args;

            const { waitForSearchDebounce } = getContext(extra);

            await waitForSearchDebounce();

            if (getState().catalogExplorer.stateDescription !== "ready") {
                return;
            }

            dispatch(actions.setSearch({ search }));
        },
    "revealAllPackages": (): ThunkAction<void> => async dispatch =>
        dispatch(actions.setDoShowOnlyHighlightedToFalse()),
    "changeSelectedCatalogId":
        (params: { catalogId: string }): ThunkAction<void> =>
        (...args) => {
            const { catalogId } = params;
            const [dispatch, getState] = args;

            if (getState().catalogExplorer.stateDescription !== "ready") {
                return;
            }

            dispatch(actions.changeSelectedCatalogue({ "selectedCatalogId": catalogId }));
        }
};

const { getContext } = createUsecaseContextApi(() => {
    const { waitForDebounce } = waitForDebounceFactory({ "delay": 500 });
    return {
        "waitForSearchDebounce": waitForDebounce
    };
});

export const selectors = (() => {
    function getPackageWeightFactory(params: { highlightedCharts: string[] }) {
        const { highlightedCharts } = params;

        function getPackageWeight(packageName: string) {
            const indexHiglightedCharts = highlightedCharts.findIndex(
                v => v.toLowerCase() === packageName.toLowerCase()
            );
            return indexHiglightedCharts !== -1
                ? highlightedCharts.length - indexHiglightedCharts
                : 0;
        }

        return { getPackageWeight };
    }

    const filteredPackages = (rootState: State) => {
        const state = rootState.catalogExplorer;

        if (state.stateDescription !== "ready") {
            return undefined;
        }

        const {
            doShowOnlyHighlighted,
            search,
            "~internal": { selectedCatalogId }
        } = state;

        const catalogs = state["~internal"].catalogs;
        const highlightedCharts =
            catalogs?.find(catalog => catalog.id === selectedCatalogId)
                ?.highlightedCharts || [];
        const { getPackageWeight } = getPackageWeightFactory({ highlightedCharts });
        const catalog = catalogs
            .filter(({ id }) => id === selectedCatalogId || state.search !== "")
            .map(catalog =>
                catalog.charts.map(chart => ({
                    "packageDescription": chart.versions[0].description,
                    "packageHomeUrl": chart.versions[0].home,
                    "packageName": chart.name,
                    "packageIconUrl": chart.versions[0].icon,
                    "catalogId": catalog.id
                }))
            )
            .reduce((accumulator, packages) => accumulator.concat(packages), [])
            .sort(
                (a, b) =>
                    getPackageWeight(b.packageName) - getPackageWeight(a.packageName)
            );

        const packages = catalog
            .slice(
                0,
                doShowOnlyHighlighted && search === ""
                    ? highlightedCharts.length
                    : undefined
            )
            .filter(({ packageName, packageDescription }) =>
                [packageName, packageDescription]
                    .map(str => str.toLowerCase().includes(search.toLowerCase()))
                    .includes(true)
            );

        return {
            packages,
            "notShownCount": search !== "" ? 0 : catalog.length - packages.length
        };
    };

    const selectedCatalog = (rootState: State): Omit<Catalog, "charts"> | undefined => {
        const state = rootState.catalogExplorer;

        if (state.stateDescription !== "ready") {
            return undefined;
        }

        const { selectedCatalogId } = state["~internal"];

        const catalog = state["~internal"].catalogs.find(
            ({ id }) => id === selectedCatalogId
        );

        assert(catalog !== undefined);

        const { charts: _, ...rest } = catalog;

        return rest;
    };

    const productionCatalogs = (
        rootState: State
    ): ReturnType<typeof filterProductionCatalogs> | undefined => {
        const state = rootState.catalogExplorer;

        if (state.stateDescription !== "ready") {
            return undefined;
        }

        return filterProductionCatalogs(state["~internal"].catalogs);
    };

    return { filteredPackages, selectedCatalog, productionCatalogs };
})();

function getAreConditionMetForOnlyShowingHighlightedPackaged(params: {
    highlightedChartsLength: number;
    catalogs: Catalog[];
    selectedCatalogId: string;
}) {
    const { highlightedChartsLength, catalogs, selectedCatalogId } = params;

    const totalPackageCount = catalogs.find(({ id }) => id === selectedCatalogId)!.charts
        .length;

    return highlightedChartsLength !== 0 && totalPackageCount > 5;
}

function filterProductionCatalogs(
    catalogs: Catalog[]
): (Omit<Catalog, "charts" | "status"> & { status: "PROD" })[] {
    return catalogs
        .map(({ status, ...rest }) =>
            status === "PROD" ? { ...rest, status } : undefined
        )
        .filter(exclude(undefined))
        .map(({ charts: _, ...rest }) => rest);
}
