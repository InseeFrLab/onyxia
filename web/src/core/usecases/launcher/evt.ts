import type { CreateEvt } from "core/bootstrap";
import { Evt } from "evt";
import { name } from "./state";
import { privateSelectors } from "./selectors";
import { assert } from "tsafe/assert";

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
        );

    return evtOut;
}) satisfies CreateEvt;
