import type { ThunkAction } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { Catalog } from "../ports/OnyxiaApiClient";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";

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
        locationUrl: string;
        packages: {
            packageName: string;
            packageDescription: string;
            packageIconUrl?: string;
            packageHomeUrl?: string;
        }[];
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
        "catalogSelected": (state, { payload }: PayloadAction<{ catalogId: string }>) => {
            const { catalogId } = payload;

            assert(state.stateDescription !== "not fetched");

            const apiRequestResultResultForCatalog = state[
                "~internal"
            ].apiRequestResult.find(({ id }) => id === catalogId)!;

            return id<CatalogExplorerState.Ready>({
                "stateDescription": "ready",
                "availableCatalogsId": state.availableCatalogsId,
                "selectedCatalogId": catalogId,
                "locationUrl": apiRequestResultResultForCatalog.location,
                "~internal": state["~internal"],
                "packages": apiRequestResultResultForCatalog.catalog.packages
                    .map(o => ({
                        "packageDescription": o.description,
                        "packageHomeUrl": o.home,
                        "packageName": o.name,
                        "packageIconUrl": o.icon,
                    }))
                    .sort(
                        (a, b) =>
                            getHardCodedPackageWeight(b.packageName) -
                            getHardCodedPackageWeight(a.packageName),
                    ),
            });
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
        async dispatch =>
            dispatch(actions.catalogSelected(params)),
};

const { getHardCodedPackageWeight } = (() => {
    //TODO: Address this
    const mainServices = ["rstudio", "jupyter", "ubuntu", "postgres", "code"];

    function getHardCodedPackageWeight(packageName: string) {
        for (let i = 0; i < mainServices.length; i++) {
            if (packageName.toLowerCase().includes(mainServices[i])) {
                return mainServices.length - i;
            }
        }

        return 0;
    }

    return { getHardCodedPackageWeight };
})();
