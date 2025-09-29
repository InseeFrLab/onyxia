import type { Thunks } from "core/bootstrap";
import { actions, name, type RouteParams } from "./state";
import { protectedSelectors } from "./selectors";
import { createWaitForDebounce } from "core/tools/waitForDebounce";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { same } from "evt/tools/inDepth/same";
import { performQuery } from "./decoupledLogic/performQuery";
import { assert } from "tsafe";

export const thunks = {
    load:
        (params: { routeParams: RouteParams }) =>
        (...args) => {
            const { routeParams } = params;

            const [dispatch] = args;

            dispatch(privateThunks.subscribeToEventAction());

            dispatch(
                actions.routeParamsSet({
                    // NOTE: If we have no specified source on the route at the loader
                    // page, restore the current state if any.
                    routeParams: routeParams.source ? routeParams : undefined
                })
            );
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

            const { waitForDebounce } = createWaitForDebounce({ delay: 500 });

            evtAction
                .pipe(action => action.usecaseName === name)
                .pipe(() => [protectedSelectors.queryRequest(getState())])
                .pipe(queryRequest => queryRequest !== undefined)
                .pipe(onlyIfChanged())
                .attach(async queryRequest => {
                    const getShouldAbort = () =>
                        !same(queryRequest, protectedSelectors.queryRequest(getState()));

                    await waitForDebounce();

                    if (getShouldAbort()) {
                        return;
                    }

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
