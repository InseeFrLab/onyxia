import type { Chart } from "core/ports/OnyxiaApi";
import { assert } from "tsafe/assert";
import type { State as RootState } from "core/core";
import { createSelector } from "@reduxjs/toolkit";
import { name } from "./state";
import { symToStr } from "tsafe/symToStr";
import type { LocalizedString } from "core/ports/OnyxiaApi";

const readyState = (rootState: RootState) => {
    const state = rootState[name];

    if (state.stateDescription !== "ready") {
        return undefined;
    }

    return state;
};

const isReady = createSelector(readyState, state => state !== undefined);

const chartsByCatalogId = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    const { chartsByCatalogId } = state;

    return chartsByCatalogId;
});

const searchResults = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    return state.searchResults;
});

const selectedCatalogId = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return state.selectedCatalogId;
});

const catalogs = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return state.catalogs;
});

export type StringWithHighlights = {
    charArray: string[];
    highlightedIndexes: number[];
};

export type ChartCardData = {
    catalogId: string;
    chartName: string;
    chartNameWithHighlights: StringWithHighlights;
    chartDescriptionWithHighlights: StringWithHighlights;
    moreInfosUrl: string | undefined;
    iconUrl: string | undefined;
};

const filteredCharts = createSelector(
    isReady,
    searchResults,
    chartsByCatalogId,
    selectedCatalogId,
    catalogs,
    (
        isReady,
        searchResults,
        chartsByCatalogId,
        selectedCatalogId,
        catalogs
    ): ChartCardData[] | undefined => {
        if (!isReady) {
            return undefined;
        }

        assert(chartsByCatalogId !== undefined);
        assert(selectedCatalogId !== undefined);
        assert(catalogs !== undefined);

        function chartToCardData(params: {
            chart: Chart;
            chartNameHighlightedIndexes: number[];
            chartDescriptionHighlightedIndexes: number[];
            catalogId: string;
        }): ChartCardData {
            const {
                chart,
                chartNameHighlightedIndexes,
                chartDescriptionHighlightedIndexes,
                catalogId
            } = params;

            const {
                name: chartName,
                versions: [{ description: chartDescription = "", home, icon }]
            } = chart;

            return {
                catalogId,
                chartName,
                "chartNameWithHighlights": {
                    "charArray": chartName.normalize().split(""),
                    "highlightedIndexes": chartNameHighlightedIndexes
                },
                "chartDescriptionWithHighlights": {
                    "charArray": chartDescription.normalize().split(""),
                    "highlightedIndexes": chartDescriptionHighlightedIndexes
                },
                "moreInfosUrl": home,
                "iconUrl": icon
            };
        }

        return searchResults === undefined
            ? chartsByCatalogId[selectedCatalogId]!.map(chart =>
                  chartToCardData({
                      chart,
                      "chartNameHighlightedIndexes": [],
                      "chartDescriptionHighlightedIndexes": [],
                      "catalogId": selectedCatalogId
                  })
              )
            : searchResults.map(
                  ({
                      catalogId,
                      chartName,
                      chartNameHighlightedIndexes,
                      chartDescriptionHighlightedIndexes
                  }) =>
                      chartToCardData({
                          "chart": chartsByCatalogId[catalogId]!.find(
                              chart => chart.name === chartName
                          )!,
                          chartNameHighlightedIndexes,
                          chartDescriptionHighlightedIndexes,
                          catalogId
                      })
              );
    }
);

const selectedCatalog = createSelector(
    isReady,
    catalogs,
    selectedCatalogId,
    (isReady, catalogs, selectedCatalogId) => {
        if (!isReady) {
            return undefined;
        }

        assert(catalogs !== undefined);
        assert(selectedCatalogId !== undefined);

        const catalog = catalogs.find(({ id }) => id === selectedCatalogId);

        assert(catalog !== undefined);

        return catalog;
    }
);

const availableCatalogs = createSelector(
    catalogs,
    (catalogs): { catalogId: string; catalogName: LocalizedString }[] | undefined => {
        if (catalogs === undefined) {
            return undefined;
        }

        return catalogs
            .filter(({ isHidden }) => !isHidden)
            .map(({ id, name }) => ({
                "catalogId": id,
                "catalogName": name
            }));
    }
);

const wrap = createSelector(
    isReady,
    selectedCatalog,
    filteredCharts,
    availableCatalogs,
    (isReady, selectedCatalog, filteredCharts, availableCatalogs) => {
        if (!isReady) {
            return {
                "isReady": false as const,
                [symToStr({ selectedCatalog })]: undefined,
                [symToStr({ filteredCharts })]: undefined,
                [symToStr({ availableCatalogs })]: undefined
            };
        }

        assert(selectedCatalog !== undefined);
        assert(filteredCharts !== undefined);
        assert(availableCatalogs !== undefined);

        return {
            "isReady": true as const,
            selectedCatalog,
            filteredCharts,
            availableCatalogs
        };
    }
);

export const selectors = { wrap };
