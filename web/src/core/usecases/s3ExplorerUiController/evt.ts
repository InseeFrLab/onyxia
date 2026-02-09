import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { privateSelectors, type RouteParams } from "./selectors";
import { Reflect } from "tsafe";
import { name } from "./state";
import { protectedThunks } from "./thunks";

export const createEvt = (({ evtAction, dispatch, getState }) => {
    const evt = Evt.create<
        | {
              action: "updateRoute";
              method: "replace" | "push";
              routeParams: RouteParams;
          }
        | {
              action: "ask confirmation for bucket creation attempt";
              bucket: string;
              createBucket: () => Promise<{ isSuccess: boolean }>;
          }
    >();

    evtAction
        .pipe(action => action.usecaseName === name)
        .$attach(
            action =>
                action.actionName === "navigationCompleted" &&
                !action.payload.isSuccess &&
                action.payload.navigationError.errorCase === "no such bucket" &&
                action.payload.navigationError.shouldAttemptToCreate
                    ? [action.payload.navigationError]
                    : null,
            ({ bucket, directoryPath }) =>
                evt.post({
                    action: "ask confirmation for bucket creation attempt",
                    bucket,
                    createBucket: () =>
                        dispatch(
                            protectedThunks.createBucket({
                                bucket,
                                directoryPath_toNavigateToOnSuccess: directoryPath
                            })
                        )
                })
        );

    evtAction
        .pipe(() => [privateSelectors.routeParams(getState())])
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
                routeParams: privateSelectors.routeParams(getState()),
                method: Reflect<"push" | "replace">()
            }
        ])
        .attach(({ method, routeParams }) => {
            evt.post({
                action: "updateRoute",
                method,
                routeParams
            });
        });

    return evt;
}) satisfies CreateEvt;
