import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name, type RouteParams } from "./state";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { protectedSelectors } from "./selectors";
import { assert } from "tsafe";
import { same } from "evt/tools/inDepth/same";

export const createEvt = (({ evtAction, getState }) => {
    const evtOut = Evt.create<{
        actionName: "updateRoute";
        method: "replace" | "push";
        routeParams: RouteParams;
    }>();

    evtAction
        .pipe(action => (action.usecaseName !== name ? null : [action.actionName]))
        .pipe(actionName => [
            {
                actionName,
                routeParams:
                    protectedSelectors.routeParams_defaultsAsUndefined(getState())
            }
        ])
        .pipe(
            onlyIfChanged({
                areEqual: (a, b) => same(a.routeParams, b.routeParams)
            })
        )
        .attach(({ actionName, routeParams }) => {
            if (actionName === "routeParamsSet") {
                return;
            }

            assert(actionName !== "queryStarted");
            assert(actionName !== "queryCompleted");

            evtOut.post({
                actionName: "updateRoute",
                method: (() => {
                    switch (actionName) {
                        case "columnVisibilityUpdated":
                        case "selectedRowIdUpdated":
                        case "urlBarTextUpdated":
                            return "replace" as const;
                        case "paginationModelUpdated":
                            return "push";
                    }
                })(),
                routeParams
            });
        });

    return evtOut;
}) satisfies CreateEvt;
