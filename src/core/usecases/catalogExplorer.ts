import type { ThunkAction } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { Catalog } from "../ports/OnyxiaApiClient";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import type { ThunksExtraArgument, RootState } from "../setup";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";
import memoize from "memoizee";

type CatalogExplorerState = CatalogExplorerState.NotFetched | CatalogExplorerState.Ready;

namespace CatalogExplorerState {
    export type NotFetched = {
        stateDescription: "not fetched";
        isFetching: boolean;
    };

    export type Ready = {
        stateDescription: "ready";
        "~internal": {
            apiRequestResult: Catalog[];
        };
        selectedCatalogId: string;
        doShowOnlyHighlighted: boolean;
        search: string;
        highlightedPackages: string[];
    };
}

export const { name, reducer, actions } = createSlice({
    "name": "catalogExplorer",
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
                apiRequestResult: Catalog[];
            }>,
        ) => {
            const { selectedCatalogId, highlightedPackages, apiRequestResult } = payload;

            return id<CatalogExplorerState.Ready>({
                "stateDescription": "ready",
                selectedCatalogId,
                "~internal": { apiRequestResult },
                highlightedPackages,
                "doShowOnlyHighlighted":
                    getAreConditionMetForOnlyShowingHighlightedPackaged({
                        "highlightedPackagesLength": highlightedPackages.length,
                        apiRequestResult,
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

            payload.selectedCatalogId = selectedCatalogId;
        },
        "setSearch": (state, { payload }: PayloadAction<{ search: string }>) => {
            const { search } = payload;

            assert(state.stateDescription === "ready");

            state.search = search;

            if (
                search === "" &&
                getAreConditionMetForOnlyShowingHighlightedPackaged({
                    "highlightedPackagesLength": state.highlightedPackages.length,
                    "apiRequestResult": state["~internal"].apiRequestResult,
                    "selectedCatalogId": state.selectedCatalogId,
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

            const apiRequestResult = await onyxiaApiClient.getCatalogs();

            const selectedCatalogId = params.isCatalogIdInUrl
                ? params.catalogId
                : apiRequestResult[0].id;

            dispatch(
                actions.catalogsFetched({
                    highlightedPackages,
                    apiRequestResult,
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
            const [dispatch, , extra] = args;

            const { waitForSearchDebounce } = getSliceContext(extra);

            await waitForSearchDebounce();

            dispatch(actions.setSearch({ search }));
        },
    "revealAllPackages": (): ThunkAction<void> => async dispatch =>
        dispatch(actions.setDoShowOnlyHighlightedToFalse()),
    "changeSelectedCatalogId":
        (params: { catalogId: string }): ThunkAction<void> =>
        (...args) => {
            const { catalogId } = params;
            const [dispatch, getStates] = args;

            if (getStates().catalogExplorer.stateDescription === "not fetched") {
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

        const { highlightedPackages, selectedCatalogId, doShowOnlyHighlighted, search } =
            state;

        const apiRequestResultResultForCatalog = state["~internal"].apiRequestResult.find(
            ({ id }) => id === selectedCatalogId,
        )!.catalog.packages;

        const { getPackageWeight } = getPackageWeightFactory({ highlightedPackages });

        const packages = apiRequestResultResultForCatalog
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
            "notShownCount":
                search !== ""
                    ? 0
                    : apiRequestResultResultForCatalog.length - packages.length,
        };
    };

    const locationUrl = (rootState: RootState): string | undefined => {
        const state = rootState.catalogExplorer;

        if (state.stateDescription !== "ready") {
            return undefined;
        }

        const { selectedCatalogId } = state;

        const apiRequestResultResultForCatalog = state["~internal"].apiRequestResult.find(
            ({ id }) => id === selectedCatalogId,
        )!;

        return apiRequestResultResultForCatalog.location;
    };

    const availableCatalogsId = (rootState: RootState): string[] | undefined => {
        const state = rootState.catalogExplorer;

        if (state.stateDescription !== "ready") {
            return undefined;
        }

        return state["~internal"].apiRequestResult.map(({ id }) => id);
    };

    return { filteredPackages, locationUrl, availableCatalogsId };
})();

function getAreConditionMetForOnlyShowingHighlightedPackaged(params: {
    highlightedPackagesLength: number;
    apiRequestResult: Catalog[];
    selectedCatalogId: string;
}) {
    const { highlightedPackagesLength, apiRequestResult, selectedCatalogId } = params;

    const totalPackageCount = apiRequestResult.find(({ id }) => id === selectedCatalogId)!
        .catalog.packages.length;

    return highlightedPackagesLength !== 0 && totalPackageCount > 5;
}
