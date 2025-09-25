import type { Thunks } from "core/bootstrap";
import { actions, name, type RouteParams } from "./state";
import { protectedSelectors } from "./selectors";
import { createWaitForDebounce } from "core/tools/waitForDebounce";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";

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
    updatePage:
        (params: { direction: "next" | "previous" }) =>
        (...args) => {
            const { direction } = params;
            const [dispatch] = args;
            dispatch(actions.urlBarTextUpdated({ urlBarText }));
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

            const { waitForDebounce } = createWaitForDebounce({ delay: 500 });

            evtAction
                .pipe(action => action.usecaseName === name)
                .pipe(() => [protectedSelectors.queryRequest(getState())])
                .pipe(queryRequest => queryRequest !== undefined)
                .pipe(onlyIfChanged({ areEqual: (a, b) => a === b }))
                .attach(async queryRequest => {
                    await waitForDebounce();

                    if (queryRequest !== protectedSelectors.queryRequest(getState())) {
                        return;
                    }

                    dispatch(
                        actions.queryResponseSet({
                            query: { request: queryRequest, response: undefined }
                        })
                    );

                    // TODO: Actually perform the query
                    const response = await Promise.resolve({
                        isSuccess: false,
                        error: {
                            isWellKnown: false,
                            message: "not implemented yet"
                        }
                    } as const);

                    if (queryRequest !== protectedSelectors.queryRequest(getState())) {
                        return;
                    }

                    dispatch(
                        actions.queryResponseSet({
                            query: {
                                request: queryRequest,
                                response
                            }
                        })
                    );
                });
        }
} satisfies Thunks;
