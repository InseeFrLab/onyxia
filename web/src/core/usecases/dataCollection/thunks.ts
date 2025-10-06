import type { Thunks } from "core/bootstrap";
import { name, actions, type RouteParams } from "./state";
import { protectedSelectors } from "./selectors";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { same } from "evt/tools/inDepth/same";
import { performQuery } from "./decoupledLogic/performQuery";

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
    updateCatalogUrl:
        (params: { url: string }) =>
        (...args) => {
            const { url } = params;
            const [dispatch] = args;
            dispatch(actions.catalogUrlUpdated({ url }));
        }
} satisfies Thunks;

let hasSubscribedToEvtAction = false;

const privateThunks = {
    subscribeToEventAction:
        () =>
        (...args) => {
            const [dispatch, getState, { evtAction }] = args;

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
                        queryRequest
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
