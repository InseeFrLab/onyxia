import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name, type RouteParams } from "./state";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { protectedSelectors } from "./selectors";
import { same } from "evt/tools/inDepth/same";

export const createEvt = (({ evtAction, getState }) => {
    const evtOut = Evt.create<{
        actionName: "updateRoute";
        method: "replace" | "push";
        routeParams: RouteParams;
    }>();

    evtAction
        .pipe(action => (action.usecaseName !== name ? null : [action.actionName]))
        .pipe(() => protectedSelectors.isStateInitialized(getState()))
        .pipe(actionName => [
            {
                actionName,
                routeParams: protectedSelectors.routeParams(getState())
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

            evtOut.post({
                actionName: "updateRoute",
                method: (() => {
                    switch (actionName) {
                        case "locationUpdated":
                        case "selectedS3ProfileUpdated":
                            return "replace" as const;
                    }
                })(),
                routeParams
            });
        });

    return evtOut;
}) satisfies CreateEvt;
