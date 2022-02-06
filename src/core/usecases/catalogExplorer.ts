import type { ThunkAction } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { Catalog } from "../ports/OnyxiaApiClient";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import type { ThunksExtraArgument, RootState } from "../setup";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";
import memoize from "memoizee";

type CatalogExplorerState =
    | CatalogExplorerState.NotFetched
    | CatalogExplorerState.NotSelected
    | CatalogExplorerState.Ready;

namespace CatalogExplorerState {
    type Common = {
        availableCatalogsId: string[];
        "~internal": {
            apiRequestResult: Catalog[];
        };
    };

    export type NotFetched = {
        stateDescription: "not fetched";
        isFetching: boolean;
    };

    export type NotSelected = Common & {
        stateDescription: "not selected";
    };

    export type Ready = Common & {
        stateDescription: "ready";
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
            _,
            { payload }: PayloadAction<NonNullable<CatalogExplorerState.NotSelected>>,
        ) => payload,
        "catalogSelected": (
            state,
            {
                payload,
            }: PayloadAction<{ catalogId: string; highlightedPackages: string[] }>,
        ) => {
            const { catalogId, highlightedPackages } = payload;

            assert(state.stateDescription !== "not fetched");

            return id<CatalogExplorerState.Ready>({
                "stateDescription": "ready",
                "availableCatalogsId": state.availableCatalogsId,
                "selectedCatalogId": catalogId,
                "~internal": state["~internal"],
                highlightedPackages,
                "doShowOnlyHighlighted":
                    getAreConditionMetForOnlyShowingHighlightedPackaged({
                        "highlightedPackagesLength": highlightedPackages.length,
                        "totalPackageCount": state["~internal"].apiRequestResult.length,
                    }),
                "search": "",
            });
        },
        "setSearch": (state, { payload }: PayloadAction<{ search: string }>) => {
            const { search } = payload;

            assert(state.stateDescription === "ready");

            state.search = search;

            if (
                search === "" &&
                getAreConditionMetForOnlyShowingHighlightedPackaged({
                    "highlightedPackagesLength": state.highlightedPackages.length,
                    "totalPackageCount": state["~internal"].apiRequestResult.length,
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
        (): ThunkAction =>
        async (...args) => {
            const [dispatch, , { onyxiaApiClient }] = args;

            dispatch(actions.catalogsFetching());

            const apiRequestResult = await onyxiaApiClient.getCatalogs();

            dispatch(
                actions.catalogsFetched(
                    id<CatalogExplorerState.NotSelected>({
                        "stateDescription": "not selected",
                        "availableCatalogsId": apiRequestResult.map(({ id }) => id),
                        "~internal": {
                            apiRequestResult,
                        },
                    }),
                ),
            );
        },
    "selectCatalog":
        (params: { catalogId: string }): ThunkAction<void> =>
        async (...args) => {
            const { catalogId } = params;
            const [
                dispatch,
                ,
                {
                    createStoreParams: { highlightedPackages },
                },
            ] = args;
            dispatch(actions.catalogSelected({ catalogId, highlightedPackages }));
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
            .slice(0, doShowOnlyHighlighted ? highlightedPackages.length : undefined)
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

    return { filteredPackages, locationUrl };
})();

function getAreConditionMetForOnlyShowingHighlightedPackaged(params: {
    highlightedPackagesLength: number;
    totalPackageCount: number;
}) {
    const { highlightedPackagesLength, totalPackageCount } = params;
    return highlightedPackagesLength !== 0 && totalPackageCount > 5;
}
