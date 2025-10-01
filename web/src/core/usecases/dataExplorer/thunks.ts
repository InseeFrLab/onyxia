import type { Thunks } from "core/bootstrap";
import { actions, name, type RouteParams } from "./state";
import { protectedSelectors } from "./selectors";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { same } from "evt/tools/inDepth/same";
import { performQuery } from "./decoupledLogic/performQuery";
import { assert } from "tsafe";

export const thunks = {
    load:
        (params: { routeParams: RouteParams }) =>
        (...args) => {
            const { routeParams } = params;

            const [dispatch, getState] = args;

            dispatch(privateThunks.subscribeToEventAction());

            const doRestoreState = !routeParams.source;

            dispatch(
                actions.routeParamsSet({
                    // NOTE: If we have no specified source on the route at the loader
                    // page, restore the current state if any.
                    routeParams: doRestoreState ? undefined : routeParams
                })
            );

            const routeParams_toRestore = doRestoreState
                ? protectedSelectors.routeParams_defaultsAsUndefined(getState())
                : undefined;

            return { routeParams_toRestore };
        },
    notifyRouteParamsExternallyUpdated:
        (params: { routeParams: RouteParams }) =>
        (...args) => {
            const { routeParams } = params;
            const [dispatch] = args;
            dispatch(actions.routeParamsSet({ routeParams }));
        },
    updateUrlBarText:
        (params: { urlBarText: string }) =>
        (...args) => {
            const { urlBarText } = params;
            const [dispatch] = args;
            dispatch(actions.urlBarTextUpdated({ urlBarText }));
        },
    updatePaginationModel:
        (params: { page: number; rowsPerPage: number }) =>
        (...args) => {
            const { page, rowsPerPage } = params;
            const [dispatch] = args;
            dispatch(actions.paginationModelUpdated({ page, rowsPerPage }));
        },
    updateSelectedRowIndex:
        (params: { selectedRowIndex: number }) =>
        (...args) => {
            const { selectedRowIndex } = params;
            const [dispatch] = args;
            dispatch(actions.selectedRowIndexUpdated({ selectedRowIndex }));
        },
    updateColumnVisibility:
        (params: { columnVisibility: Record<string, boolean> }) =>
        (...args) => {
            const { columnVisibility } = params;
            const [dispatch] = args;
            dispatch(actions.columnVisibilityUpdated({ columnVisibility }));
        }
} satisfies Thunks;

let hasSubscribedToEvtAction = false;

const privateThunks = {
    subscribeToEventAction:
        () =>
        (...args) => {
            const [dispatch, getState, { evtAction, oidc, sqlOlap }] = args;

            if (hasSubscribedToEvtAction) {
                return;
            }
            hasSubscribedToEvtAction = true;

            evtAction
                .pipe(action => action.usecaseName === name)
                .pipe(() => [protectedSelectors.queryRequest(getState())])
                .pipe(queryRequest => queryRequest !== undefined)
                .pipe(onlyIfChanged())
                .attach(async queryRequest => {
                    const getShouldAbort = () =>
                        !same(queryRequest, protectedSelectors.queryRequest(getState()));

                    dispatch(actions.queryStarted({ queryRequest }));

                    const queryResponse = await performQuery({
                        getShouldAbort,
                        login: () => {
                            assert(!oidc.isUserLoggedIn);
                            return oidc.login({ doesCurrentHrefRequiresAuth: false });
                        },
                        queryRequest,
                        sqlOlap
                    });

                    dispatch(
                        actions.queryCompleted({
                            queryRequest,
                            queryResponse
                        })
                    );
                });
        }
} satisfies Thunks;
