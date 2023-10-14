import type { Chart } from "core/ports/OnyxiaApi";
import { assert } from "tsafe/assert";
import type { State as RootState } from "core/core";
import { createSelector } from "@reduxjs/toolkit";
import { name } from "./state";
import { symToStr } from "tsafe/symToStr";

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

type CatalogChart = {
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
    (isReady, searchResults, chartsByCatalogId) => {
        if (!isReady) {
            return undefined;
        }

        assert(chartsByCatalogId !== undefined);

        const filteredCharts: CatalogChart[] = [];

        for (const { catalogId, chartName, matchedCharacterIndexes } of searchResults ??
            []) {
            const chart: Chart | undefined = chartsByCatalogId[catalogId].charts.find(
                ({ name }) => name === chartName
            );

            assert(chart !== undefined);

            const { description, home, icon } = chart.versions[0];

            filteredCharts.push({
                "name": chartName,
                "nameHighlightedIndexes": matchedCharacterIndexes.name,
                description,
                "descriptionHighlightedIndexes": matchedCharacterIndexes.description,
                "moreInfosUrl": home,
                "iconUrl": icon
            });
        }

        return filteredCharts;
    }
);

const selectedCatalogId = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return state.selectedCatalogId;
});

const chartNotShownCount = createSelector(
    isReady,
    selectedCatalogId,
    chartsByCatalogId,
    filteredCharts,
    (isReady, selectedCatalogId, chartsByCatalogId, filteredCharts) => {
        if (!isReady) {
            return undefined;
        }

        assert(selectedCatalogId !== undefined);
        assert(chartsByCatalogId !== undefined);
        assert(filteredCharts !== undefined);

        const charts = chartsByCatalogId[selectedCatalogId].charts;

        return charts.length - filteredCharts.length;
    }
);

const catalogs = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return state.catalogs;
});

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

const availableCatalogNames = createSelector(catalogs, catalogs => {
    if (catalogs === undefined) {
        return undefined;
    }

    return catalogs.filter(({ isHidden }) => !isHidden).map(({ name }) => name);
});

const wrap = createSelector(
    isReady,
    selectedCatalog,
    filteredCharts,
    chartNotShownCount,
    availableCatalogNames,
    (
        isReady,
        selectedCatalog,
        filteredCharts,
        chartNotShownCount,
        availableCatalogNames
    ) => {
        if (!isReady) {
            return {
                "isReady": false as const,
                [symToStr({ selectedCatalog })]: undefined,
                [symToStr({ filteredCharts })]: undefined,
                [symToStr({ chartNotShownCount })]: undefined,
                [symToStr({ availableCatalogNames })]: undefined
            };
        }

        assert(selectedCatalog !== undefined);
        assert(filteredCharts !== undefined);
        assert(chartNotShownCount !== undefined);
        assert(availableCatalogNames !== undefined);

        return {
            "isReady": true as const,
            selectedCatalog,
            filteredCharts,
            chartNotShownCount,
            availableCatalogNames
        };
    }
);

export const selectors = { wrap };
