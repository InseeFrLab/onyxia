import {
    createObjectThatThrowsIfAccessed,
    createUsecaseActions,
    isObjectThatThrowIfAccessed
} from "clean-architecture";
import { same } from "evt/tools/inDepth/same";
import { id } from "tsafe/id";
import type { QueryRequest, QueryResponse } from "./decoupledLogic/performQuery";
import { assert } from "tsafe";

export const name = "dataCollection" as const;

export type RouteParams = {
    source?: string;
};

export const ROUTE_PARAMS_DEFAULTS = {
    source: ""
} as const satisfies RouteParams & Record<keyof RouteParams, unknown>;

export type State = {
    routeParams: RouteParams;
    ongoingQueryRequest: QueryRequest | undefined;
    completedQuery:
        | {
              request: QueryRequest;
              response: QueryResponse;
          }
        | undefined;
};

export const { actions, reducer } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>(),
    reducers: {
        routeParamsSet: (
            state,
            {
                payload
            }: {
                payload: {
                    routeParams: RouteParams | undefined;
                };
            }
        ) => {
            const { routeParams } = payload;

            if (isObjectThatThrowIfAccessed(state)) {
                state = id<State>({
                    routeParams: {},
                    ongoingQueryRequest: undefined,
                    completedQuery: undefined
                });
            }

            if (routeParams !== undefined) {
                state.routeParams = routeParams;
            }

            return state;
        },
        catalogUrlUpdated: (state, { payload }: { payload: { url: string } }) => {
            const { url } = payload;

            if (state.routeParams.source === url) {
                return;
            }

            state.routeParams = {
                source: url
            };
        },

        queryStarted: (
            state,
            {
                payload
            }: {
                payload: {
                    queryRequest: QueryRequest;
                };
            }
        ) => {
            const { queryRequest } = payload;
            state.ongoingQueryRequest = queryRequest;
        },

        queryCompleted: (
            state,
            {
                payload
            }: {
                payload: {
                    queryRequest: QueryRequest;
                    queryResponse: QueryResponse;
                };
            }
        ) => {
            const { queryRequest, queryResponse } = payload;

            assert(same(state.ongoingQueryRequest, queryRequest));

            state.completedQuery = {
                request: queryRequest,
                response: queryResponse
            };
            state.ongoingQueryRequest = undefined;
        }
    }
});
