import type { Thunks } from "core/bootstrap";
import { waitForDebounceFactory } from "core/tools/waitForDebounce";
import { createUsecaseContextApi } from "clean-architecture";
import { actions, allCatalog, name, type State } from "./state";
import { assert, is } from "tsafe/assert";
import memoize from "memoizee";
import FlexSearch from "flexsearch";
import { getMatchPositions } from "core/tools/highlightMatches";
import * as projectManagement from "core/usecases/projectManagement";
import * as userAuthentication from "core/usecases/userAuthentication";

export const thunks = {
    changeSelectedCatalogId:
        (params: { catalogId: string | undefined }) =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi, paramsOfBootstrapCore }] = args;

            const state = getState()[name];

            if (state.stateDescription === "ready") {
                if (params.catalogId === undefined) {
                    dispatch(actions.defaultCatalogSelected());
                    return;
                }

                if (state.selectedCatalogId === params.catalogId) {
                    return;
                }

                dispatch(
                    actions.selectedCatalogChanged({
                        selectedCatalogId: params.catalogId
                    })
                );

                return;
            }

            if (state.isFetching) {
                return;
            }

            dispatch(actions.catalogsFetching());

            const { catalogs, chartsByCatalogId } = await (async () => {
                const isInGroupProject = (() => {
                    const { isUserLoggedIn } =
                        userAuthentication.selectors.main(getState());

                    if (!isUserLoggedIn) {
                        return false;
                    }
                    return (
                        projectManagement.protectedSelectors.currentProject(getState())
                            .group !== undefined
                    );
                })();

                const { catalogs: catalogs_all, chartsByCatalogId } =
                    await onyxiaApi.getCatalogsAndCharts();

                const catalogs = catalogs_all.filter(({ visibility }) => {
                    switch (visibility) {
                        case "always":
                            return true;
                        case "only in groups projects":
                            return isInGroupProject;
                        case "ony in personal projects":
                            return !isInGroupProject;
                    }
                });

                !paramsOfBootstrapCore.disableDisplayAllCatalog &&
                    catalogs.unshift(allCatalog);

                return { catalogs, chartsByCatalogId };
            })();

            const selectedCatalogId =
                params.catalogId !== undefined &&
                catalogs.some(({ id }) => id === params.catalogId)
                    ? params.catalogId
                    : catalogs.filter(({ isProduction }) => isProduction)[0].id;

            dispatch(
                actions.catalogsFetched({
                    catalogs,
                    chartsByCatalogId: (() => {
                        const out: State.Ready["chartsByCatalogId"] = {};

                        Object.keys(chartsByCatalogId).forEach(
                            catalogId =>
                                (out[catalogId] = chartsByCatalogId[catalogId].map(
                                    chart => ({
                                        id: `${catalogId}-${chart.name}`,
                                        name: chart.name,
                                        description: chart.description ?? "",
                                        iconUrl: chart.iconUrl,
                                        projectHomepageUrl: chart.projectHomepageUrl
                                    })
                                ))
                        );

                        return out;
                    })(),
                    selectedCatalogId
                })
            );

            if (
                params.catalogId === undefined ||
                params.catalogId !== selectedCatalogId
            ) {
                dispatch(actions.defaultCatalogSelected());
            }
        },
    setSearch:
        (params: { search: string }) =>
        async (...args) => {
            const { search } = params;
            const [dispatch, getState, rootContext] = args;

            const { evtAction } = rootContext;

            const { waitForSearchDebounce, getFlexSearch } = getContext(rootContext);

            await waitForSearchDebounce();

            if (getState()[name].stateDescription === "not fetched") {
                await evtAction.waitFor(
                    action =>
                        action.usecaseName === name &&
                        action.actionName === "catalogsFetched"
                );
            }

            dispatch(actions.searchChanged({ search }));

            if (search === "") {
                dispatch(actions.searchResultChanged({ searchResults: undefined }));
                return;
            }

            const state = getState()[name];

            assert(state.stateDescription === "ready");

            const { flexSearch } = getFlexSearch(state.catalogs, state.chartsByCatalogId);

            dispatch(
                actions.searchResultChanged({
                    searchResults: await flexSearch({ search })
                })
            );
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => {
    const { waitForDebounce } = waitForDebounceFactory({ delay: 200 });

    const getFlexSearch = memoize(
        (
            catalogs: State.Ready["catalogs"],
            chartsByCatalogId: State.Ready["chartsByCatalogId"]
        ) => {
            const index = new FlexSearch.Document<{
                catalogIdChartName: `${string}/${string}`;
                chartNameAndDescription: `${string} ${string}`;
            }>({
                document: {
                    id: "catalogIdChartName",
                    field: ["chartNameAndDescription"]
                },
                cache: 100,
                tokenize: "full",
                context: {
                    resolution: 9,
                    depth: 2,
                    bidirectional: true
                }
            });

            Object.entries(chartsByCatalogId)
                .filter(
                    ([catalogId]) =>
                        catalogs.find(({ id }) => id === catalogId)!.isProduction
                )
                .forEach(([catalogId, charts]) =>
                    charts.forEach(chart =>
                        index.add({
                            catalogIdChartName: `${catalogId}/${chart.name}`,
                            chartNameAndDescription: `${chart.name} ${chart.description}`
                        })
                    )
                );

            async function flexSearch(params: {
                search: string;
            }): Promise<State.SearchResult[]> {
                const { search } = params;

                const flexSearchResults = await index.searchAsync(search, {
                    bool: "or",
                    suggest: true,
                    enrich: true
                });

                if (flexSearchResults.length === 0) {
                    return [];
                }

                const [{ result: catalogIdChartNames }] = flexSearchResults;

                assert(is<`${string}/${string}`[]>(catalogIdChartNames));

                return catalogIdChartNames.map(
                    (catalogIdChartName): State.SearchResult => {
                        const [catalogId, chartName] = catalogIdChartName.split("/");

                        return {
                            catalogId,
                            chartName,
                            chartNameHighlightedIndexes: getMatchPositions({
                                search,
                                text: chartName
                            }),
                            chartDescriptionHighlightedIndexes: getMatchPositions({
                                search,
                                text: chartsByCatalogId[catalogId].find(
                                    chart => chart.name === chartName
                                )!.description
                            })
                        };
                    }
                );
            }

            return { flexSearch };
        },
        { max: 1 }
    );

    return {
        waitForSearchDebounce: waitForDebounce,
        getFlexSearch
    };
});
