import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { Catalog } from "core/ports/OnyxiaApi";
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
        selectedCatalogId: string;
        doShowOnlyHighlighted: boolean;
        search: string;
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
            }>
        ) => {
            const { selectedCatalogId, catalogs } = payload;
            const highlightedCharts =
                catalogs.find(catalog => catalog.id === selectedCatalogId)
                    ?.highlightedCharts || [];

            return id<State.Ready>({
                "stateDescription": "ready",
                catalogs,
                selectedCatalogId,
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

            if (state.selectedCatalogId === selectedCatalogId) {
                return;
            }

            state.selectedCatalogId = selectedCatalogId;
            const catalogs = state.catalogs;
            const highlightedCharts =
                catalogs.find(catalog => catalog.id === selectedCatalogId)
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

            const selectedCatalogId = state.selectedCatalogId;
            const catalogs = state.catalogs;
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

export function getAreConditionMetForOnlyShowingHighlightedPackaged(params: {
    highlightedChartsLength: number;
    catalogs: Catalog[];
    selectedCatalogId: string;
}) {
    const { highlightedChartsLength, catalogs, selectedCatalogId } = params;

    const totalPackageCount = catalogs.find(({ id }) => id === selectedCatalogId)!.charts
        .length;

    return highlightedChartsLength !== 0 && totalPackageCount > 5;
}
