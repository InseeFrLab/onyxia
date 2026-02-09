import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { protectedSelectors, type RouteParams } from "./selectors";
import { Reflect } from "tsafe";
import { name } from "./state";
import { protectedThunks } from "./thunks";

export const evt = Evt.create<
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

export const createEvt = (({ evtAction, dispatch, getState }) => {
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
                action: "updateRoute",
                method,
                routeParams
            });
        });

    return evt;
}) satisfies CreateEvt;
