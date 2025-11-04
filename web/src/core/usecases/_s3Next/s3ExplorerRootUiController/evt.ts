import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name, type RouteParams } from "./state";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { protectedSelectors } from "./selectors";
import { same } from "evt/tools/inDepth/same";

export const evt = Evt.create<{
    actionName: "updateRoute";
    method: "replace" | "push";
    routeParams: RouteParams;
}>();

export const createEvt = (({ evtAction, getState }) => {
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
            evt.post({
                actionName: "updateRoute",
                method: (() => {
                    switch (actionName) {
                        case "routeParamsSet":
                        case "s3UrlUpdated":
                        case "selectedS3ProfileUpdated":
                            return "replace" as const;
                    }
                })(),
                routeParams
            });
        });

    return evt;
}) satisfies CreateEvt;
