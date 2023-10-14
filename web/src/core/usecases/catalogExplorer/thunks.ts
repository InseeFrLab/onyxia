import type { Thunks } from "core/core";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { actions, name, type State } from "./state";
import { assert } from "tsafe/assert";
import memoize from "memoizee";
import { Chart } from "core/ports/OnyxiaApi";
import FlexSearch from "flexsearch";
import { getMatchPositions } from "core/tools/highlightMatches";

export const thunks = {
    "changeSelectedCatalogId":
        (params: { catalogId: string | undefined }) =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi }] = args;

            const state = getState()[name];

            if (state.stateDescription === "ready") {
                assert(params.catalogId !== undefined);

                if (state.selectedCatalogId === params.catalogId) {
                    return;
                }

                dispatch(
                    actions.selectedCatalogChanged({
                        "selectedCatalogId": params.catalogId
                    })
                );

                return;
            }

            if (state.isFetching) {
                return;
            }

            dispatch(actions.catalogsFetching());

            const { catalogs, chartsByCatalogId } =
                await onyxiaApi.getCatalogsAndCharts();

            const selectedCatalogId =
                params.catalogId ?? catalogs.filter(({ isHidden }) => !isHidden)[0].id;

            dispatch(
                actions.catalogsFetched({
                    catalogs,
                    chartsByCatalogId,
                    selectedCatalogId
                })
            );

            if (params.catalogId !== undefined) {
                dispatch(actions.notifyDefaultCatalogIdSelected());
            }
        },
    "setSearch":
        (params: { search: string }) =>
        async (...args) => {
            const { search } = params;
            const [dispatch, getState, extra] = args;

            const { evtAction } = extra;

            const { waitForSearchDebounce } = getContext(extra);

            await waitForSearchDebounce();

            if (getState()[name].stateDescription === "not fetched") {
                await evtAction.waitFor(
                    action =>
                        action.sliceName === name &&
                        action.actionName === "catalogsFetched"
                );
            }

            dispatch(actions.searchChanged({ search }));

            if (search === "") {
                dispatch(
                    actions.searchResultChanged({
                        "searchResults": undefined
                    })
                );
                return;
            }

            dispatch(
                actions.searchResultChanged({
                    "searchResults": await (async () => {
                        if (search === "") {
                            return undefined;
                        }

                        function getPackageWeightFactory(params: {
                            highlightedCharts: string[] | undefined;
                        }) {
                            const { highlightedCharts = [] } = params;

                            function getPackageWeight(packageName: string) {
                                const indexHighlightedCharts =
                                    highlightedCharts.findIndex(
                                        v => v.toLowerCase() === packageName.toLowerCase()
                                    );
                                return indexHighlightedCharts !== -1
                                    ? highlightedCharts.length - indexHighlightedCharts
                                    : 0;
                            }

                            return { getPackageWeight };
                        }

                        /*
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
                                */

                        /*
                        const filteredCharts = catalog
                            .slice(
                                0,
                                doShowOnlyHighlighted && search === "" ? highlightedCharts.length : undefined
                            )
                            .filter(({ packageName, packageDescription }) =>
                                [packageName, packageDescription]
                                    .map(str => str.toLowerCase().includes(search.toLowerCase()))
                                    .includes(true)
                            );
                            */

                        // Actually perform the search

                        return [];
                    })()
                })
            );
        },
    "revealAllPackages":
        () =>
        (...args) => {
            const [dispatch] = args;
            dispatch(actions.setDoShowOnlyHighlightedToFalse());
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => {
    const { waitForDebounce } = waitForDebounceFactory({ "delay": 500 });
    return {
        "waitForSearchDebounce": waitForDebounce,
        "getFlexSearch": memoize(
            (chartsByCatalogId: Record<string, { charts: Chart[] }>) => {
                const index = new FlexSearch.Document<{
                    catalogIdChartName: `${string}/${string}`;
                    chartNameAndDescription: `${string} ${string}`;
                }>({
                    "document": {
                        "id": "catalogIdChartName",
                        "field": ["chartNameAndDescription"]
                    },
                    "cache": 100,
                    "tokenize": "full",
                    "context": {
                        "resolution": 9,
                        "depth": 2,
                        "bidirectional": true
                    }
                });

                Object.entries(chartsByCatalogId).forEach(([catalogId, { charts }]) =>
                    charts.forEach(chart => {
                        index.add({
                            "catalogIdChartName": `${catalogId}/${chart.name}`,
                            "chartNameAndDescription": `${chart.name} ${chart.versions[0].description}`
                        });
                    })
                );

                async function flexSearch(params: {
                    search: string;
                }): State.SearchResult[] {
                    const { search } = params;

                    const searchResult = await index.searchAsync(search, {
                        "bool": "or",
                        "suggest": true,
                        "enrich": true
                    });

                    if (searchResult.length === 0) {
                        return [];
                    }

                    const [{ result: catalogIdChartNames }] = searchResult;

                    return null as any as any[];

                    /*
                    return catalogIdChartNames.map(
                        softwareName => (
                            assert(typeof softwareName === "string"),
                            {
                                softwareName,
                                "positions": highlightMatches({
                                    "text": (() => {
                                        const software = softwares.find(
                                            software => software.softwareName === softwareName
                                        );

                                        assert(software !== undefined);

                                        return software.search;
                                    })(),
                                    search
                                })
                            }
                        )
                    );
                    */
                }

                return { flexSearch };
            },
            { "max": 1 }
        )
    };
});
