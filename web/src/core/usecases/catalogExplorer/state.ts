import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { Catalog, Chart } from "core/ports/OnyxiaApi";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";

export type State = State.NotFetched | State.Ready;

export namespace State {
    export type NotFetched = {
        stateDescription: "not fetched";
        isFetching: boolean;
    };

    export type Ready = {
        stateDescription: "ready";
        catalogs: Catalog[];
        chartsByCatalogId: Record<string, Chart[]>;
        selectedCatalogId: string;
        search: string;
        searchResults: SearchResult[] | undefined;
    };

    export type SearchResult = {
        catalogId: string;
        chartName: string;
        nameHighlightedIndexes: number[];
        descriptionHighlightedIndexes: number[];
    };
}

export const name = "catalogExplorer";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<State>(
        id<State.NotFetched>({
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
                chartsByCatalogId: Record<string, Chart[]>;
            }>
        ) => {
            const { selectedCatalogId, catalogs, chartsByCatalogId } = payload;

            return id<State.Ready>({
                "stateDescription": "ready",
                catalogs,
                selectedCatalogId,
                chartsByCatalogId,
                "search": "",
                "searchResults": undefined
            });
        },
        "selectedCatalogChanged": (
            state,
            { payload }: PayloadAction<{ selectedCatalogId: string }>
        ) => {
            const { selectedCatalogId } = payload;

            assert(state.stateDescription === "ready");

            if (state.selectedCatalogId === selectedCatalogId) {
                return;
            }

            state.selectedCatalogId = selectedCatalogId;
        },
        "notifyDefaultCatalogIdSelected": () => {
            /* Only for evt */
        },
        "searchChanged": (state, { payload }: PayloadAction<{ search: string }>) => {
            const { search } = payload;

            assert(state.stateDescription === "ready");

            state.search = search;
        },
        "searchResultChanged": (
            state,
            { payload }: { payload: { searchResults: State.Ready["searchResults"] } }
        ) => {
            const { searchResults } = payload;

            assert(state.stateDescription === "ready");

            state.searchResults = searchResults;
        }
    }
});
