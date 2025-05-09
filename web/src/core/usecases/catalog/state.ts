import type { Catalog } from "core/ports/OnyxiaApi";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { createUsecaseActions } from "clean-architecture";

export type State = State.NotFetched | State.Ready;

export const allCatalog: Catalog = {
    id: "all",
    name: "All",
    description: undefined,
    repositoryUrl: "",
    isProduction: true,
    visibility: "always"
};

export namespace State {
    export type NotFetched = {
        stateDescription: "not fetched";
        isFetching: boolean;
    };

    export type Ready = {
        stateDescription: "ready";
        catalogs: Catalog[];
        chartsByCatalogId: Record<
            string,
            {
                id: string;
                name: string;
                description: string;
                iconUrl: string | undefined;
                projectHomepageUrl: string | undefined;
            }[]
        >;
        selectedCatalogId: string;
        search: string;
        searchResults: SearchResult[] | undefined;
    };

    export type SearchResult = {
        catalogId: string;
        chartName: string;
        chartNameHighlightedIndexes: number[];
        chartDescriptionHighlightedIndexes: number[];
    };
}

export const name = "catalog";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(
        id<State.NotFetched>({
            stateDescription: "not fetched",
            isFetching: false
        })
    ),
    reducers: {
        catalogsFetching: state => {
            assert(state.stateDescription === "not fetched");
            state.isFetching = true;
        },
        catalogsFetched: (
            _state,
            {
                payload
            }: {
                payload: {
                    selectedCatalogId: string;
                    catalogs: Catalog[];
                    chartsByCatalogId: State.Ready["chartsByCatalogId"];
                };
            }
        ) => {
            const { selectedCatalogId, catalogs, chartsByCatalogId } = payload;

            return id<State.Ready>({
                stateDescription: "ready",
                catalogs,
                selectedCatalogId,
                chartsByCatalogId,
                search: "",
                searchResults: undefined
            });
        },
        selectedCatalogChanged: (
            state,
            { payload }: { payload: { selectedCatalogId: string } }
        ) => {
            const { selectedCatalogId } = payload;

            assert(state.stateDescription === "ready");

            if (state.selectedCatalogId === selectedCatalogId) {
                return;
            }

            state.selectedCatalogId = selectedCatalogId;
        },
        defaultCatalogSelected: () => {
            /* Only for evt */
        },
        searchChanged: (state, { payload }: { payload: { search: string } }) => {
            const { search } = payload;

            assert(state.stateDescription === "ready");

            state.search = search;
        },
        searchResultChanged: (
            state,
            { payload }: { payload: { searchResults: State.Ready["searchResults"] } }
        ) => {
            const { searchResults } = payload;

            assert(state.stateDescription === "ready");

            state.searchResults = searchResults;
        }
    }
});
