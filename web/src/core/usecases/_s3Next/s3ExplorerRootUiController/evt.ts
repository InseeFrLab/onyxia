import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { protectedSelectors, type RouteParams } from "./selectors";
import { Reflect } from "tsafe";

export const evt = Evt.create<{
    actionName: "updateRoute";
    method: "replace" | "push";
    routeParams: RouteParams;
}>();

export const createEvt = (({ evtAction, getState }) => {
    evtAction
        .pipe(() => [protectedSelectors.routeParams(getState())])
        .pipe(onlyIfChanged())
        .pipe([
            (routeParams, { routeParams: routeParams_prev }) => [
                {
                    routeParams,
                    method:
                        routeParams.path === routeParams_prev.path ? "replace" : "push"
                } as const
            ],
            {
                routeParams: protectedSelectors.routeParams(getState()),
                method: Reflect<"push" | "replace">()
            }
        ])
        .attach(({ method, routeParams }) => {
            evt.post({
                actionName: "updateRoute",
                method,
                routeParams
            });
        });

    return evt;
}) satisfies CreateEvt;
