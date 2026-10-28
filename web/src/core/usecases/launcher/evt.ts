import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name } from "./state";
import { privateSelectors } from "./selectors";
import { assert } from "tsafe/assert";
import type { ServiceGitCredentialsError } from "core/usecases/gitProvidersManagement";

export const createEvt = (({ evtAction, getState }) => {
    const evtOut = Evt.create<
        | {
              eventName: "initialized";
          }
        | {
              eventName: "launchStarted";
          }
        | {
              eventName: "launchCompleted";
              helmReleaseName: string;
          }
        | {
              eventName: "launchFailedOnGitCredentials";
              gitCredentialsError: ServiceGitCredentialsError;
          }
    >();

    const evtUsecaseAction = evtAction.pipe(action =>
        action.usecaseName !== name ? null : [action]
    );

    evtUsecaseAction
        .attach(
            action => action.actionName === "initialized",
            () => evtOut.post({ eventName: "initialized" })
        )
        .attach(
            action => action.actionName === "launchStarted",
            () => evtOut.post({ eventName: "launchStarted" })
        )
        .attach(
            action => action.actionName === "launchCompleted",
            () => {
                const helmReleaseName = privateSelectors.helmReleaseName(getState());
                assert(helmReleaseName !== null);
                evtOut.post({ eventName: "launchCompleted", helmReleaseName });
            }
        )
        .attach(
            action => action.actionName === "launchFailedOnGitCredentials",
            ({ payload: { gitCredentialsError } }) =>
                evtOut.post({
                    eventName: "launchFailedOnGitCredentials",
                    gitCredentialsError
                })
        );

    return evtOut;
}) satisfies CreateEvt;
