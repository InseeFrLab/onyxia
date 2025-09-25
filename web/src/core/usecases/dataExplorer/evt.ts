import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name, type RouteParams } from "./state";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { protectedSelectors } from "./selectors";

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
                areEqual: (a, b) => a.routeParams === b.routeParams
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
                        case "queryResponseSet":
                        case "urlBarTextUpdated":
                            return "replace" as const;
                    }
                })(),
                routeParams
            });
        });

    return evtOut;
}) satisfies CreateEvt;
