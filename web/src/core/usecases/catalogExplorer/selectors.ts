import type { Catalog } from "core/ports/OnyxiaApi";
import { assert } from "tsafe/assert";
import type { State as RootState } from "core/core";
import { exclude } from "tsafe/exclude";
import { createSelector } from "@reduxjs/toolkit";
import { name } from "./state";

function getPackageWeightFactory(params: { highlightedCharts: string[] }) {
    const { highlightedCharts } = params;

    function getPackageWeight(packageName: string) {
        const indexHiglightedCharts = highlightedCharts.findIndex(
            v => v.toLowerCase() === packageName.toLowerCase()
        );
        return indexHiglightedCharts !== -1
            ? highlightedCharts.length - indexHiglightedCharts
            : 0;
    }

    return { getPackageWeight };
}

const readyState = (rootState: RootState) => {
    const state = rootState[name];

    if (state.stateDescription !== "ready") {
        return undefined;
    }

    return state;
};

const filteredPackages = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    const { doShowOnlyHighlighted, search, selectedCatalogId } = state;

    const { catalogs } = state;
    const highlightedCharts =
        catalogs?.find(catalog => catalog.id === selectedCatalogId)?.highlightedCharts ||
        [];
    const { getPackageWeight } = getPackageWeightFactory({ highlightedCharts });
    const catalog = catalogs
        .filter(
            ({ id, status }) =>
                id === selectedCatalogId || (state.search !== "" && status === "PROD")
        )
        .map(catalog =>
            catalog.charts.map(chart => ({
                "packageDescription": chart.versions[0].description,
                "packageHomeUrl": chart.versions[0].home,
                "packageName": chart.name,
                "packageIconUrl": chart.versions[0].icon,
                "catalogId": catalog.id
            }))
        )
        .reduce((accumulator, packages) => accumulator.concat(packages), [])
        .sort(
            (a, b) => getPackageWeight(b.packageName) - getPackageWeight(a.packageName)
        );

    const packages = catalog
        .slice(
            0,
            doShowOnlyHighlighted && search === "" ? highlightedCharts.length : undefined
        )
        .filter(({ packageName, packageDescription }) =>
            [packageName, packageDescription]
                .map(str => str.toLowerCase().includes(search.toLowerCase()))
                .includes(true)
        );

    return {
        packages,
        "notShownCount": search !== "" ? 0 : catalog.length - packages.length
    };
});

const selectedCatalog = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    const { selectedCatalogId } = state;

    const catalog = state.catalogs.find(({ id }) => id === selectedCatalogId);

    assert(catalog !== undefined);

    const { charts: _, ...rest } = catalog;

    return rest;
});

const productionCatalogs = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    return filterProductionCatalogs(state.catalogs);
});

export const selectors = { filteredPackages, selectedCatalog, productionCatalogs };

export function filterProductionCatalogs(
    catalogs: Catalog[]
): (Omit<Catalog, "charts" | "status"> & { status: "PROD" })[] {
    return catalogs
        .map(({ status, ...rest }) =>
            status === "PROD" ? { ...rest, status } : undefined
        )
        .filter(exclude(undefined))
        .map(({ charts: _, ...rest }) => rest);
}
