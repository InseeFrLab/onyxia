import { assert } from "tsafe/assert";
import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name, type State } from "./state";
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
    projectHomepageUrl: string | undefined;
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
            chart: State.Ready["chartsByCatalogId"][string][number];
            chartNameHighlightedIndexes: number[];
            chartDescriptionHighlightedIndexes: number[];
            catalogId: string;
        }): ChartCardData {
            const {
                chart: { name: chartName, description, projectHomepageUrl, iconUrl },
                chartNameHighlightedIndexes,
                chartDescriptionHighlightedIndexes,
                catalogId
            } = params;

            return {
                catalogId,
                chartName,
                chartNameWithHighlights: {
                    charArray: chartName.normalize().split(""),
                    highlightedIndexes: chartNameHighlightedIndexes
                },
                chartDescriptionWithHighlights: {
                    charArray: description.normalize().split(""),
                    highlightedIndexes: chartDescriptionHighlightedIndexes
                },
                projectHomepageUrl,
                iconUrl
            };
        }

        return searchResults === undefined
            ? chartsByCatalogId[selectedCatalogId].map(chart =>
                  chartToCardData({
                      chart,
                      chartNameHighlightedIndexes: [],
                      chartDescriptionHighlightedIndexes: [],
                      catalogId: selectedCatalogId
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
                          chart: chartsByCatalogId[catalogId].find(
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
            .filter(({ isProduction }) => isProduction)
            .map(({ id, name }) => ({
                catalogId: id,
                catalogName: name
            }));
    }
);

const main = createSelector(
    isReady,
    selectedCatalog,
    filteredCharts,
    availableCatalogs,
    (isReady, selectedCatalog, filteredCharts, availableCatalogs) => {
        if (!isReady) {
            return {
                isReady: false as const
            };
        }

        assert(selectedCatalog !== undefined);
        assert(filteredCharts !== undefined);
        assert(availableCatalogs !== undefined);

        return {
            isReady: true as const,
            selectedCatalog,
            filteredCharts,
            availableCatalogs
        };
    }
);

export const selectors = { main };
