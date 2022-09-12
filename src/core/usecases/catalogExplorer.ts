import type { ThunkAction } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { Catalog } from "../ports/OnyxiaApiClient";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import type { ThunksExtraArgument, RootState } from "../setup";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";
import memoize from "memoizee";
import { exclude } from "tsafe/exclude";

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
        highlightedPackages: string[];
    };
}

export const name = "catalogExplorer";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<CatalogExplorerState>(
        id<CatalogExplorerState.NotFetched>({
            "stateDescription": "not fetched",
            "isFetching": false,
        }),
    ),
    "reducers": {
        "catalogsFetching": state => {
            assert(state.stateDescription === "not fetched");
            state.isFetching = true;
        },
        "catalogsFetched": (
            _state,
            {
                payload,
            }: PayloadAction<{
                selectedCatalogId: string;
                highlightedPackages: string[];
                catalogs: Catalog[];
            }>,
        ) => {
            const { selectedCatalogId, highlightedPackages, catalogs } = payload;

            return id<CatalogExplorerState.Ready>({
                "stateDescription": "ready",
                "~internal": { catalogs, selectedCatalogId },
                highlightedPackages,
                "doShowOnlyHighlighted":
                    getAreConditionMetForOnlyShowingHighlightedPackaged({
                        "highlightedPackagesLength": highlightedPackages.length,
                        catalogs,
                        selectedCatalogId,
                    }),
                "search": "",
            });
        },
        "changeSelectedCatalogue": (
            state,
            { payload }: PayloadAction<{ selectedCatalogId: string }>,
        ) => {
            const { selectedCatalogId } = payload;

            assert(state.stateDescription === "ready");

            if (state["~internal"].selectedCatalogId === selectedCatalogId) {
                return;
            }

            state["~internal"].selectedCatalogId = selectedCatalogId;

            if (
                state.search === "" &&
                getAreConditionMetForOnlyShowingHighlightedPackaged({
                    "highlightedPackagesLength": state.highlightedPackages.length,
                    "catalogs": state["~internal"].catalogs,
                    selectedCatalogId,
                })
            ) {
                state.doShowOnlyHighlighted = true;
            }
        },
        "setSearch": (state, { payload }: PayloadAction<{ search: string }>) => {
            const { search } = payload;

            assert(state.stateDescription === "ready");

            state.search = search;

            if (
                search === "" &&
                getAreConditionMetForOnlyShowingHighlightedPackaged({
                    "highlightedPackagesLength": state.highlightedPackages.length,
                    "catalogs": state["~internal"].catalogs,
                    "selectedCatalogId": state["~internal"].selectedCatalogId,
                })
            ) {
                state.doShowOnlyHighlighted = true;
            }
        },
        "setDoShowOnlyHighlightedToFalse": state => {
            assert(state.stateDescription === "ready");

            state.doShowOnlyHighlighted = false;
        },
    },
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
                  },
        ): ThunkAction =>
        async (...args) => {
            const [
                dispatch,
                ,
                {
                    onyxiaApiClient,
                    createStoreParams: { highlightedPackages },
                },
            ] = args;

            dispatch(actions.catalogsFetching());

            const catalogs = await onyxiaApiClient.getCatalogs();

            const selectedCatalogId = params.isCatalogIdInUrl
                ? params.catalogId
                : filterProductionCatalogs(catalogs)[0].id;

            dispatch(
                actions.catalogsFetched({
                    highlightedPackages,
                    catalogs,
                    selectedCatalogId,
                }),
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

            const { waitForSearchDebounce } = getSliceContext(extra);

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
        },
};

const getSliceContext = memoize((_: ThunksExtraArgument) => {
    const { waitForDebounce } = waitForDebounceFactory({ "delay": 500 });
    return {
        "waitForSearchDebounce": waitForDebounce,
    };
});

export const selectors = (() => {
    function getPackageWeightFactory(params: { highlightedPackages: string[] }) {
        const { highlightedPackages } = params;

        function getPackageWeight(packageName: string) {
            for (let i = 0; i < highlightedPackages.length; i++) {
                if (packageName.toLowerCase().includes(highlightedPackages[i])) {
                    return highlightedPackages.length - i;
                }
            }

            return 0;
        }

        return { getPackageWeight };
    }

    const filteredPackages = (rootState: RootState) => {
        const state = rootState.catalogExplorer;

        if (state.stateDescription !== "ready") {
            return undefined;
        }

        const {
            highlightedPackages,
            doShowOnlyHighlighted,
            search,
            "~internal": { selectedCatalogId },
        } = state;

        const catalog = state["~internal"].catalogs
            .filter(({ id }) => id === selectedCatalogId || state.search !== "")
            .map(e => e.catalog.packages)
            .reduce((r, e) => r.concat(e), []);

        const { getPackageWeight } = getPackageWeightFactory({ highlightedPackages });

        const packages = catalog
            .map(o => ({
                "packageDescription": o.description,
                "packageHomeUrl": o.home,
                "packageName": o.name,
                "packageIconUrl": o.icon,
            }))
            .sort(
                (a, b) =>
                    getPackageWeight(b.packageName) - getPackageWeight(a.packageName),
            )
            .slice(
                0,
                doShowOnlyHighlighted && search === ""
                    ? highlightedPackages.length
                    : undefined,
            )
            .filter(({ packageName, packageDescription }) =>
                [packageName, packageDescription]
                    .map(str => str.toLowerCase().includes(search.toLowerCase()))
                    .includes(true),
            );

        return {
            packages,
            "notShownCount": search !== "" ? 0 : catalog.length - packages.length,
        };
    };

    const selectedCatalog = (
        rootState: RootState,
    ): Omit<Catalog, "catalog"> | undefined => {
        const state = rootState.catalogExplorer;

        if (state.stateDescription !== "ready") {
            return undefined;
        }

        const { selectedCatalogId } = state["~internal"];

        const catalog = state["~internal"].catalogs.find(
            ({ id }) => id === selectedCatalogId,
        );

        assert(catalog !== undefined);

        const { catalog: _, ...rest } = catalog;

        return rest;
    };

    const productionCatalogs = (
        rootState: RootState,
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
    highlightedPackagesLength: number;
    catalogs: Catalog[];
    selectedCatalogId: string;
}) {
    const { highlightedPackagesLength, catalogs, selectedCatalogId } = params;

    const totalPackageCount = catalogs.find(({ id }) => id === selectedCatalogId)!.catalog
        .packages.length;

    return highlightedPackagesLength !== 0 && totalPackageCount > 5;
}

function filterProductionCatalogs(
    catalogs: Catalog[],
): (Omit<Catalog, "catalog" | "status"> & { status: "PROD" })[] {
    return catalogs
        .map(({ status, ...rest }) =>
            status === "PROD" ? { ...rest, status } : undefined,
        )
        .filter(exclude(undefined))
        .map(({ catalog: _, ...rest }) => rest);
}
