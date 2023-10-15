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

export type ChartCardData = {
    catalogId: string;
    catalogName: LocalizedString;
    name: string;
    nameHighlightedIndexes: number[];
    description: string;
    descriptionHighlightedIndexes: number[];
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
            nameHighlightedIndexes: number[];
            descriptionHighlightedIndexes: number[];
            catalogId: string;
            catalogName: LocalizedString;
        }): ChartCardData {
            const {
                chart,
                nameHighlightedIndexes,
                descriptionHighlightedIndexes,
                catalogId,
                catalogName
            } = params;

            const {
                name,
                versions: [{ description, home, icon }]
            } = chart;

            return {
                catalogId,
                catalogName,
                name,
                nameHighlightedIndexes,
                description,
                descriptionHighlightedIndexes,
                "moreInfosUrl": home,
                "iconUrl": icon
            };
        }

        return searchResults === undefined
            ? chartsByCatalogId[selectedCatalogId]!.map(chart =>
                  chartToCardData({
                      chart,
                      "nameHighlightedIndexes": [],
                      "descriptionHighlightedIndexes": [],
                      "catalogId": selectedCatalogId,
                      "catalogName": catalogs.find(({ id }) => id === selectedCatalogId)!
                          .name
                  })
              )
            : searchResults.map(
                  ({
                      catalogId,
                      chartName,
                      nameHighlightedIndexes,
                      descriptionHighlightedIndexes
                  }) =>
                      chartToCardData({
                          "chart": chartsByCatalogId[catalogId]!.find(
                              chart => chart.name === chartName
                          )!,
                          nameHighlightedIndexes,
                          descriptionHighlightedIndexes,
                          catalogId,
                          "catalogName": catalogs.find(({ id }) => id === catalogId)!.name
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
