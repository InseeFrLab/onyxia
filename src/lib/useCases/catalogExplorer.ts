

import type { AppThunk } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { Public_Catalog } from "../ports/OnyxiaApiClient";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";

export const name = "catalogExplorer";

export type CatalogExplorerState =
    CatalogExplorerState.NotFetched |
    CatalogExplorerState.NotSelected |
    CatalogExplorerState.Ready;

export namespace CatalogExplorerState {

    type Common = {
        availableCatalogsId: string[];
        '~internal': {
            apiRequestResult: Public_Catalog["catalogs"];
        }
    };

    export type NotFetched = {
        stateDescription: "not fetched"
        isFetching: boolean;
    };

    export type NotSelected = Common & {
        stateDescription: "not selected";
    };

    export type Ready = Common & {
        stateDescription: "ready";
        selectedCatalogId: string;
        packages: {
            packageName: string;
            packageDescription: string;
            packageIconUrl?: string;
            packageHomeUrl?: string;
        }[];
    };

}

const { reducer, actions } = createSlice({
    name,
    "initialState": id<CatalogExplorerState>(id<CatalogExplorerState.NotFetched>({
        "stateDescription": "not fetched",
        "isFetching": false
    })),
    "reducers": {
        "catalogsFetching": state =>{
            assert(state.stateDescription === "not fetched");
            state.isFetching= true;
        },
        "catalogsFetched": (_, { payload }: PayloadAction<NonNullable<CatalogExplorerState.NotSelected>>) =>
            payload,
        "catalogSelected": (state, { payload }: PayloadAction<{ catalogId: string; }>) => {

            const { catalogId } = payload;

            assert(state.stateDescription !== "not fetched");

            return id<CatalogExplorerState.Ready>({
                "stateDescription": "ready",
                "availableCatalogsId": state.availableCatalogsId,
                "selectedCatalogId": catalogId,
                "~internal": state["~internal"],
                "packages": state["~internal"].apiRequestResult.find(({ id }) => id === catalogId)!
                    .catalog
                    .packages
                    .map(o => ({
                        "packageDescription": o.description,
                        "packageHomeUrl": o.home,
                        "packageName": o.name,
                        "packageIconUrl": o.icon
                    }))
                    .sort((a, b) =>
                        getHardCodedPackageWeight(b.packageName) -
                        getHardCodedPackageWeight(a.packageName)
                    )
            });

        }
    }
});

export { reducer };

export const thunks = {
    "fetchCatalogs":
        (): AppThunk => async (...args) => {

            const [dispatch, , dependencies] = args;

            dispatch(actions.catalogsFetching());

            const apiRequestResult = await dependencies.onyxiaApiClient
                .getCatalogs();

            dispatch(
                actions.catalogsFetched(id<CatalogExplorerState.NotSelected>({
                    "stateDescription": "not selected",
                    "availableCatalogsId": apiRequestResult.map(({ id }) => id),
                    "~internal": {
                        apiRequestResult
                    }
                }))
            );

        },
    "selectCatalog":
        (
            params: {
                catalogId: string;
            }
        ): AppThunk<void> => async dispatch =>
                dispatch(actions.catalogSelected(params))
};



const { getHardCodedPackageWeight } = (() => {

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

